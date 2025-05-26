require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { Server } = require('socket.io');

const User = require('./models/User');
const Message = require('./models/Message');
const Story = require('./models/Story');

const app = express();
const server = http.createServer(app);

// Configurações
const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET || !MONGO_URI) {
  console.error('❌ Variáveis de ambiente faltando (JWT_SECRET ou MONGO_URI). Verifique seu .env.');
  process.exit(1);
}

// Middlewares
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

// ROTAS DE AUTENTICAÇÃO (REGISTRO E LOGIN)

app.post('/api/auth/register', async (req, res) => {
  const { username, password, name } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: 'Usuário já existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, name: name || username });

    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Usuário ou senha inválidos' });

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user._id, username: user.username, name: user.name } });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'chat.html'));
});

// Conexão com MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ MongoDB conectado');
}).catch((err) => {
  console.error('❌ Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    credentials: true,
  },
});

const onlineUsers = new Map();

// Autenticação JWT no Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token ausente'));

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

// Conexões WebSocket
io.on('connection', (socket) => {
  console.log(`⚡ Usuário conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  socket.on('joinRoom', ({ to }) => {
    if (!to) return;
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
    console.log(`📥 ${socket.userId} entrou na sala ${room}`);
  });

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
      console.error('❌ Erro ao salvar mensagem:', err);
    }
  });

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
      console.error('❌ Erro ao salvar mensagem de mídia:', err);
    }
  });

  socket.on('react', async ({ messageId, emoji }) => {
    if (!messageId || !emoji) return;

    try {
      const msg = await Message.findById(messageId);
      if (!msg) return;

      msg.reactions = msg.reactions.filter(r => r.userId.toString() !== socket.userId);
      msg.reactions.push({ userId: socket.userId, emoji });
      await msg.save();

      const room = [msg.from.toString(), msg.to.toString()].sort().join('_');
      io.to(room).emit('reaction', { messageId: msg._id, reactions: msg.reactions });
    } catch (err) {
      console.error('❌ Erro ao reagir à mensagem:', err);
    }
  });

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

      setTimeout(async () => {
        try {
          await Message.findByIdAndDelete(msg._id);
          io.to(room).emit('messageDeleted', { id: msg._id });
        } catch (err) {
          console.error('❌ Erro ao deletar mensagem autodestrutiva:', err);
        }
      }, seconds * 1000);
    } catch (err) {
      console.error('❌ Erro ao criar mensagem autodestrutiva:', err);
    }
  });

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
      console.error('❌ Erro ao fixar mensagem:', err);
    }
  });

  socket.on('uploadStory', async ({ base64, type }) => {
    if (!base64 || !type) return;

    try {
      const story = await Story.create({
        userId: socket.userId,
        media: base64,
        type,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      });

      io.emit('newStory', {
        userId: story.userId,
        media: story.media,
        type: story.type,
      });
    } catch (err) {
      console.error('❌ Erro ao criar story:', err);
    }
  });

  // WebRTC Signaling
  socket.on('callUser', ({ to, signalData }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('incomingCall', { from: socket.userId, signalData });
    }
  });

  socket.on('answerCall', ({ to, signal }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit('callAccepted', { signal });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Usuário desconectado: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
  });
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
