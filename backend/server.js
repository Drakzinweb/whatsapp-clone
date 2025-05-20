// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// ─── 1) CORS MANUAL PARA TODAS AS ROTAS ──────────────────────────
app.use((req, res, next) => {
  // Permite qualquer origem (para teste). Depois pode restringir ao seu domínio.
  res.header('Access-Control-Allow-Origin', '*');
  // Métodos permitidos
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  // Cabeçalhos permitidos
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Se for preflight, retorna imediatamente com sucesso
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ─── 2) BODY PARSER ──────────────────────────────────────────────
app.use(express.json());

// ─── 3) ROTAS DA API ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── 4) CONEXÃO COM MONGO ────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar MongoDB:', err));

// ─── 5) SOCKET.IO (SEM RESTRIÇÃO CORS) ────────────────────────────
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token não fornecido'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

const messages = {};
io.on('connection', socket => {
  console.log(`🔌 Usuário conectado: ${socket.userId}`);

  socket.on('join', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
    if (messages[room]) {
      socket.emit('history', messages[room]);
    }
  });

  socket.on('message', ({ to, text }) => {
    const room = [socket.userId, to].sort().join('_');
    const msg = { from: socket.userId, to, text, timestamp: new Date() };
    messages[room] = messages[room] || [];
    messages[room].push(msg);
    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${socket.userId}`);
  });
});

// ─── 6) ROTA RAIZ (TESTE) ────────────────────────────────────────
app.get('/', (req, res) => res.send('🚀 API do chat está online!'));

// ─── 7) INICIA O SERVIDOR ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
