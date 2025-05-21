require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = 'https://whatsapp-clone-wwjc.onrender.com';

// CORS Config
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas Auth
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// Conexão MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB conectado'))
  .catch(err => {
    console.error('Erro MongoDB:', err);
    process.exit(1);
  });

// Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware autenticação token para socket
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token não fornecido'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

const onlineUsers = new Map();

io.on('connection', async (socket) => {
  console.log(`Usuário conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  // Emitir usuários online com username
  const usersOnline = [];
  for (const userId of onlineUsers.keys()) {
    const user = await User.findById(userId);
    if (user) usersOnline.push({ id: user._id, username: user.username });
  }
  io.emit('onlineUsers', usersOnline);

  socket.on('join', async ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);

    // Buscar histórico da sala do MongoDB
    const messages = await Message.find({
      $or: [
        { from: socket.userId, to },
        { from: to, to: socket.userId }
      ]
    }).sort({ createdAt: 1 });

    socket.emit('history', messages);
  });

  socket.on('message', async ({ to, text }) => {
    const msg = new Message({
      from: socket.userId,
      to,
      text,
      createdAt: new Date(),
    });
    await msg.save();

    const room = [socket.userId, to].sort().join('_');
    io.to(room).emit('message', {
      from: msg.from,
      to: msg.to,
      text: msg.text,
      timestamp: msg.createdAt,
    });
  });

  socket.on('typing', ({ to, isTyping }) => {
    const toSocketId = onlineUsers.get(to);
    if (toSocketId) {
      io.to(toSocketId).emit('typing', { from: socket.userId, isTyping });
    }
  });

  socket.on('disconnect', async () => {
    console.log(`Usuário desconectado: ${socket.userId}`);
    onlineUsers.delete(socket.userId);

    // Atualiza lista de online com username
    const usersOnline = [];
    for (const userId of onlineUsers.keys()) {
      const user = await User.findById(userId);
      if (user) usersOnline.push({ id: user._id, username: user.username });
    }
    io.emit('onlineUsers', usersOnline);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
