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

// Socket.IO com CORS configurado
const io = new Server(server, {
  cors: {
    origin: 'https://techchaat.netlify.app', // Seu frontend na Netlify
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: 'https://techchaat.netlify.app'
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('Erro MongoDB:', err));

// SOCKET.IO AUTENTICAÇÃO E MENSAGEM
const messages = {};
let onlineUsers = [];

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

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`✅ Usuário conectado: ${userId}`);

  // Adicionar usuário à lista online
  if (!onlineUsers.includes(userId)) {
    onlineUsers.push(userId);
    io.emit('online_users', onlineUsers);
  }

  // Entrar na sala de conversa
  socket.on('join', ({ to }) => {
    const room = [userId, to].sort().join('_');
    socket.join(room);
    if (messages[room]) {
      socket.emit('history', messages[room]);
    }
  });

  // Enviar mensagem
  socket.on('message', ({ to, text }) => {
    const room = [userId, to].sort().join('_');
    const msg = { from: userId, to, text, timestamp: new Date() };

    if (!messages[room]) messages[room] = [];
    messages[room].push(msg);

    io.to(room).emit('message', msg);
  });

  // Desconectar
  socket.on('disconnect', () => {
    onlineUsers = onlineUsers.filter(id => id !== userId);
    io.emit('online_users', onlineUsers);
    console.log(`❌ Usuário desconectado: ${userId}`);
  });
});

// Status
app.get('/', (req, res) => {
  res.send('✅ API do WhatsApp Clone está online!');
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
