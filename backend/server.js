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

// Configurações
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*'; // Melhor definir um domínio real em produção
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET não definido no .env');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'chat.html'));
});

// Conexão com MongoDB (melhor adicionar async/await e captura de erros)
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado');
  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  }
})();

// Configuração do Socket.IO com autenticação JWT
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Token ausente'));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  // Join em sala privada ordenada para evitar duplicidade
  socket.on('joinRoom', ({ to }) => {
    if (!to) return;
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
    console.log(`Usuário ${socket.userId} entrou na sala ${room}`);
  });

  // Envio de mensagem de texto
  socket.on('sendMessage', async ({ to, text }) => {
    if (!to || !text?.trim()) return;

    try {
      const msg = await Message.create({
        from: socket.userId,
        to,
        text: text.trim(),
        createdAt: new Date(),
      });
      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);
    } catch (err) {
      console.error('Erro ao salvar mensagem:', err);
    }
  });

  // Envio de mensagem com mídia (imagem, vídeo, áudio)
  socket.on('mediaMessage', async ({ to, base64, type, text = '' }) => {
    if (!to || !base64 || !type) return;

    try {
      const msg = await Message.create({
        from: socket.userId,
        to,
        text: text.trim(),
        media: { type, url: base64 },
        createdAt: new Date(),
      });
      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);
    } catch (err) {
      console.error('Erro ao salvar mensagem de mídia:', err);
    }
  });

  // Reação em mensagem (emoji)
  socket.on('react', async ({ messageId, emoji }) => {
    if (!messageId || !emoji) return;

    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      // Remove reação anterior do mesmo usuário (se existir)
      msg.reactions = msg.reactions.filter(r => r.userId.toString() !== socket.userId);

      // Adiciona nova reação
      msg.reactions.push({ userId: socket.userId, emoji });

      await msg.save();

      const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
      io.to(room).emit('reaction', { messageId: msg._id, reactions: msg.reactions });
    } catch (err) {
      console.error('Erro ao reagir mensagem:', err);
    }
  });

  // Mensagem autodestrutiva
  socket.on('selfDestructMessage', async ({ to, text, seconds }) => {
    if (!to || !text?.trim() || !seconds || seconds <= 0) return;

    try {
      const destructAt = new Date(Date.now() + seconds * 1000);
      const msg = await Message.create({
        from: socket.userId,
        to,
        text: text.trim(),
        isSelfDestruct: true,
        destructAt,
        createdAt: new Date(),
      });

      const room = [socket.userId, to].sort().join('_');
      io.to(room).emit('message', msg);

      // Timeout para deletar a mensagem e avisar clientes
      setTimeout(async () => {
        try {
          await Message.findByIdAndDelete(msg._id);
          io.to(room).emit('messageDeleted', { id: msg._id });
        } catch (err) {
          console.error('Erro ao deletar mensagem autodestrutiva:', err);
        }
      }, seconds * 1000);
    } catch (err) {
      console.error('Erro ao criar mensagem autodestrutiva:', err);
    }
  });

  // Fixar mensagem
  socket.on('pinMessage', async ({ messageId }) => {
    if (!messageId) return;

    try {
      const msg = await Message.findByIdAndUpdate(
        messageId,
        { isPinned: true },
        { new: true }
      );
      if (msg) {
        const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
        io.to(room).emit('pinned', { messageId: msg._id });
      }
    } catch (err) {
      console.error('Erro ao fixar mensagem:', err);
    }
  });

  // Upload de story (mídia temporária)
  socket.on('uploadStory', async ({ base64, type }) => {
    if (!base64 || !type) return;

    try {
      const story = await Story.create({
        userId: socket.userId,
        media: base64,
        type,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000), // 24h
        createdAt: new Date(),
      });

      io.emit('newStory', {
        userId: story.userId,
        media: story.media,
        type: story.type,
      });
    } catch (err) {
      console.error('Erro ao criar story:', err);
    }
  });

  // Chamadas WebRTC signaling
  socket.on('callUser', ({ to, signalData }) => {
    if (!to || !signalData) return;

    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', { from: socket.userId, signalData });
    }
  });

  socket.on('answerCall', ({ to, signal }) => {
    if (!to || !signal) return;

    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('callAccepted', { signal });
    }
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId);
    console.log(`❌ Usuário desconectado: ${socket.userId}`);
  });
});

// Limpar stories expirados a cada minuto
setInterval(async () => {
  try {
    const result = await Story.deleteMany({ expiresAt: { $lt: new Date() } });
    if (result.deletedCount > 0) {
      io.emit('storyCleanup');
      console.log(`🧹 Stories expirados removidos: ${result.deletedCount}`);
    }
  } catch (err) {
    console.error('Erro ao limpar stories expirados:', err);
  }
}, 60 * 1000);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
