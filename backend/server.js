const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const socketio = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

// MODELS
const Message = require('./models/Message');
const Story = require('./models/story');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*" }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB conectado"))
  .catch(err => console.error("❌ Erro ao conectar:", err));

const onlineUsers = new Map();

// SOCKET.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Token ausente"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    return next(new Error("Token inválido"));
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  // Entrar em salas privadas entre 2 usuários
  socket.on('joinRoom', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
  });

  // Enviar mensagem de texto
  socket.on('sendMessage', async ({ to, text }) => {
    const room = [socket.userId, to].sort().join('_');
    const msg = await Message.create({ from: socket.userId, to, text });
    io.to(room).emit('message', { ...msg.toObject(), room });
  });

  // Mensagem com mídia (imagem/vídeo em base64)
  socket.on('mediaMessage', async ({ to, base64, type, text }) => {
    if (!['image', 'video'].includes(type)) return;
    const room = [socket.userId, to].sort().join('_');
    const msg = await Message.create({
      from: socket.userId,
      to,
      text,
      media: { type, url: base64 }
    });
    io.to(room).emit('message', msg);
  });

  // Mensagem autodestrutiva
  socket.on('selfDestructMessage', async ({ to, text, seconds }) => {
    const room = [socket.userId, to].sort().join('_');
    const destructAt = new Date(Date.now() + seconds * 1000);
    const msg = await Message.create({
      from: socket.userId,
      to,
      text,
      isSelfDestruct: true,
      destructAt
    });

    io.to(room).emit('message', msg);

    setTimeout(async () => {
      await Message.findByIdAndDelete(msg._id);
      io.to(room).emit('messageDeleted', { id: msg._id });
    }, seconds * 1000);
  });

  // Reagir a uma mensagem
  socket.on('react', async ({ messageId, emoji }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;
    msg.reactions = msg.reactions.filter(r => r.userId.toString() !== socket.userId);
    msg.reactions.push({ userId: socket.userId, emoji });
    await msg.save();

    const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
    io.to(room).emit('reaction', {
      messageId: msg._id,
      reactions: msg.reactions
    });
  });

  // Fixar uma mensagem
  socket.on('pinMessage', async ({ messageId }) => {
    const msg = await Message.findByIdAndUpdate(messageId, { isPinned: true }, { new: true });
    if (msg) {
      const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
      io.to(room).emit('pinned', { messageId: msg._id });
    }
  });

  // Enviar uma story (24h)
  socket.on('uploadStory', async ({ base64, type }) => {
    if (!['image', 'video'].includes(type)) return;
    const story = await Story.create({
      userId: socket.userId,
      media: base64,
      type,
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000)
    });
    io.emit('newStory', {
      userId: story.userId,
      media: story.media,
      type: story.type
    });
  });

  // Chamadas WebRTC: iniciar chamada
  socket.on('callUser', ({ to, signalData }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('incomingCall', {
        from: socket.userId,
        signalData
      });
    }
  });

  // Chamadas WebRTC: aceitar chamada
  socket.on('answerCall', ({ to, signal }) => {
    const targetSocket = onlineUsers.get(to);
    if (targetSocket) {
      io.to(targetSocket).emit('callAccepted', { signal });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuário saiu: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
  });
});

// Remoção automática de stories expiradas a cada 1 min
setInterval(async () => {
  const expired = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
  if (expired.deletedCount) io.emit('storyCleanup');
}, 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando em http://localhost:${PORT}`));
