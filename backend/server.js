require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Rotas
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('Erro ao conectar:', err));

// Socket.IO Auth
const onlineUsers = new Map(); // { userId: { socketId, username } }
const messages = {}; // { roomId: [msg1, msg2...] }

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token não fornecido'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Usuário não encontrado'));

    socket.userId = user._id.toString();
    socket.username = user.username;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  console.log(`✅ ${socket.username} conectou`);
  onlineUsers.set(socket.userId, { socketId: socket.id, username: socket.username });

  // Enviar usuários online
  const usersList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
    id,
    username: info.username,
  }));
  io.emit('onlineUsers', usersList);

  socket.on('join', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);
    if (messages[room]) {
      socket.emit('history', messages[room]);
    }
  });

  socket.on('message', ({ to, text }) => {
    const room = [socket.userId, to].sort().join('_');
    const msg = {
      from: socket.userId,
      to,
      text,
      timestamp: new Date(),
      senderName: socket.username,
    };

    if (!messages[room]) messages[room] = [];
    messages[room].push(msg);
    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`❌ ${socket.username} desconectou`);
    onlineUsers.delete(socket.userId);
    const updatedList = Array.from(onlineUsers.entries()).map(([id, info]) => ({
      id,
      username: info.username,
    }));
    io.emit('onlineUsers', updatedList);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
