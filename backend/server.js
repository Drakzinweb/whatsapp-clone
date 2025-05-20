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

// Configura o CORS para permitir apenas seu frontend da Netlify
app.use(cors({
  origin: 'https://techchaat.netlify.app',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/api/auth', authRoutes);

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('Erro ao conectar no MongoDB:', err));

// WebSocket
const io = new Server(server, {
  cors: {
    origin: 'https://techchaat.netlify.app',
    methods: ['GET', 'POST']
  }
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token não fornecido'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

const messages = {};

io.on('connection', (socket) => {
  console.log(`Usuário conectado: ${socket.userId}`);

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
    if (!messages[room]) messages[room] = [];
    messages[room].push(msg);
    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.userId}`);
  });
});

// Rota raiz opcional
app.get('/', (req, res) => {
  res.send('🚀 API do chat está online!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
