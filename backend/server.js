require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// 1) Configura CORS para seu domínio e preflight OPTIONS
const corsOptions = {
  origin: 'https://techchaat.netlify.app', // seu front no Netlify
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // responde OPTIONS para todas as rotas

// 2) Middleware de JSON
app.use(express.json());

// 3) Rotas da API
app.use('/api/auth', authRoutes);

// 4) Conexão com MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// 5) Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://techchaat.netlify.app',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
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
    if (messages[room]) socket.emit('history', messages[room]);
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

// 6) Rota raiz para verificar se o servidor está online
app.get('/', (req, res) => res.send('🚀 API do chat está online!'));

// 7) Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
