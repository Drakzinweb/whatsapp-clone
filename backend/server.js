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

// --- 1) Middlewares globais (CORS, JSON) ---
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS']
}));
app.use(express.json());

// --- 2) Rotas de API ANTES de servir arquivos estáticos ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- 3) Servir o frontend estático somente após as APIs ---
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// --- 4) Conexão MongoDB ---
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB conectado'))
.catch(err => { console.error('❌ Erro MongoDB:', err); process.exit(1); });

// --- 5) Socket.IO (inalterado) ---
const io = new Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ['GET','POST'],
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

  socket.on('join', async ({ to }) => { /* ... */ });
  socket.on('message', async ({ to, text }) => { /* ... */ });
  socket.on('typing', ({ to, isTyping }) => { /* ... */ });
  socket.on('disconnect', () => { /* ... */ });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
