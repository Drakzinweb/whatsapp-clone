require('dotenv').config();
const path     = require('path');
const express  = require('express');
const http     = require('http');
const mongoose = require('mongoose');
const cors     = require('cors');
const jwt      = require('jsonwebtoken');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const User       = require('./models/User');
const Message    = require('./models/Message');

const app    = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = 'https://whatsapp-clone-wwjc.onrender.com';

// --- 1) Middlewares globais ---
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// --- 2) Rotas da API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- 3) Servir frontend estático ---
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// --- 4) Conexão com MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => {
  console.error('❌ Erro MongoDB:', err);
  process.exit(1);
});

// --- 5) Socket.IO ---
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io'
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token não fornecido'));
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

const onlineUsers = new Map();

async function emitOnline() {
  const list = [];
  for (let [userId] of onlineUsers) {
    const user = await User.findById(userId).select('username');
    if (user) list.push({ id: userId, username: user.username });
  }
  io.emit('onlineUsers', list);
}

io.on('connection', socket => {
  onlineUsers.set(socket.userId, socket.id);
  emitOnline();

  // ===== Join Chat =====
  socket.on('join', async ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);

    const history = await Message.find({
      $or: [
        { from: socket.userId, to },
        { from: to, to: socket.userId }
      ]
    }).sort('createdAt');

    socket.emit('history', history);
  });

  // ===== Enviar Mensagem =====
  socket.on('message', async ({ to, text }) => {
    if (!to || !text) return;

    const sender = await User.findById(socket.userId);
    const recipient = await User.findById(to);

    if (!sender || !recipient) return;

    // Checa bloqueios
    const isBlockedByRecipient = recipient.blockedUsers?.includes(socket.userId);
    const hasBlockedRecipient  = sender.blockedUsers?.includes(to);

    if (isBlockedByRecipient || hasBlockedRecipient) {
      console.log(`❌ Mensagem bloqueada entre ${socket.userId} e ${to}`);
      return;
    }

    const msg = await Message.create({ from: socket.userId, to, text });
    const room = [socket.userId, to].sort().join('_');

    io.to(room).emit('message', {
      from: msg.from.toString(),
      to: msg.to.toString(),
      text: msg.text,
      timestamp: msg.createdAt
    });
  });

  // ===== Indicador de Digitação =====
  socket.on('typing', ({ to, isTyping }) => {
    const target = onlineUsers.get(to);
    if (target) {
      io.to(target).emit('typing', { from: socket.userId, isTyping });
    }
  });

  // ===== Desconectar =====
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId);
    emitOnline();
  });
});

// --- 6) Iniciar servidor ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
