require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

// Conecta ao MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend estático
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.get('/',        (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/login',   (req, res) => res.sendFile(path.join(frontendPath, 'login.html')));
app.get('/register',(req, res) => res.sendFile(path.join(frontendPath, 'register.html')));
app.get('/chat',    authMiddleware, (req, res) => res.sendFile(path.join(frontendPath, 'chat.html')));

// API routes
app.use('/api/auth', authRoutes);
app.get('/api/me', authMiddleware, (req, res) => res.json({ username: req.user.username, id: req.user._id }));

// Socket.IO para chat em tempo real
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token ausente'));
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Token inválido'));
  }
});

io.on('connection', socket => {
  console.log(`Usuário conectado: ${socket.userId}`);
  socket.join(socket.userId);

  // Carrega histórico
  socket.on('join', async ({ to }) => {
    if (!to) return;
    const history = await Message.find({
      $or: [
        { from: socket.userId, to },
        { from: to, to: socket.userId }
      ]
    }).sort('createdAt');
    socket.emit('history', history);
  });

  // Envia e armazena mensagem
  socket.on('message', async ({ to, text }) => {
    if (!to || !text) return;
    const msg = await Message.create({ from: socket.userId, to, text });
    io.to(to).emit('message', msg);
    io.to(socket.userId).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`Usuário desconectado: ${socket.userId}`);
  });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
