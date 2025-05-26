require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Server } = require('socket.io');

const User = require('./models/User');
const Message = require('./models/Message');
const Story = require('./models/Story');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = '*'; // ou o domínio exato se quiser restringir

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// Servir frontend (chat.html)
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'chat.html'));
});

// Conexão com MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('❌ Erro MongoDB:', err);
    process.exit(1);
  });

// WebSocket
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true
  }
});

const onlineUsers = new Map();

io.use((socket, next) => {
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
  console.log(`⚡ Conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  socket.on('joinRoom', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
  });

  socket.on('sendMessage', async ({ to, text }) => {
    const msg = await Message.create({ from: socket.userId, to, text });
    const room = [socket.userId, to].sort().join('_');
    io.to(room).emit('message', msg);
  });

  socket.on('mediaMessage', async ({ to, base64, type, text }) => {
    const msg = await Message.create({
      from: socket.userId,
      to,
      text,
      media: { type, url: base64 }
    });
    const room = [socket.userId, to].sort().join('_');
    io.to(room).emit('message', msg);
  });

  socket.on('react', async ({ messageId, emoji }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;
    msg.reactions = msg.reactions.filter(r => r.userId.toString() !== socket.userId);
    msg.reactions.push({ userId: socket.userId, emoji });
    await msg.save();

    const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
    io.to(room).emit('reaction', { messageId: msg._id, reactions: msg.reactions });
  });

  socket.on('selfDestructMessage', async ({ to, text, seconds }) => {
    const destructAt = new Date(Date.now() + seconds * 1000);
    const msg = await Message.create({
      from: socket.userId,
      to,
      text,
      isSelfDestruct: true,
      destructAt
    });

    const room = [socket.userId, to].sort().join('_');
    io.to(room).emit('message', msg);

    setTimeout(async () => {
      await Message.findByIdAndDelete(msg._id);
      io.to(room).emit('messageDeleted', { id: msg._id });
    }, seconds * 1000);
  });

  socket.on('pinMessage', async ({ messageId }) => {
    const msg = await Message.findByIdAndUpdate(messageId, { isPinned: true }, { new: true });
    if (msg) {
      const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
      io.to(room).emit('pinned', { messageId: msg._id });
    }
  });

  socket.on('uploadStory', async ({ base64, type }) => {
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

  socket.on('callUser', ({ to, signalData }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit('incomingCall', { from: socket.userId, signalData });
    }
  });

  socket.on('answerCall', ({ to, signal }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit('callAccepted', { signal });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId);
    console.log(`❌ Desconectado: ${socket.userId}`);
  });
});

// Limpar stories expirados
setInterval(async () => {
  const expired = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
  if (expired.deletedCount) io.emit('storyCleanup');
}, 60 * 1000);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
