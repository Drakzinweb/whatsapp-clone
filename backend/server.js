require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

// CORS manual para polling/socket
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://whatsapp-clone-wwjc.onrender.com");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: "https://whatsapp-clone-wwjc.onrender.com",
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('Erro MongoDB:', err));

// Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: "https://whatsapp-clone-wwjc.onrender.com",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Autenticação do socket
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
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Conectado: ${socket.userId}`);
  onlineUsers.set(socket.userId, socket.id);

  io.emit('onlineUsers', Array.from(onlineUsers.keys()));

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
    console.log(`❌ Desconectado: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
