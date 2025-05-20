require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Conecta ao MongoDB
connectDB();

// Parser e Rotas API
app.use(express.json());
app.use('/api/auth', authRoutes);

// Serve frontend estático
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));
app.get('/',       (req,res) => res.sendFile(path.join(frontendPath,'index.html')));
app.get('/login',  (req,res) => res.sendFile(path.join(frontendPath,'login.html')));
app.get('/register',(req,res) => res.sendFile(path.join(frontendPath,'register.html')));
app.get('/chat',   authMiddleware, (req,res) => res.sendFile(path.join(frontendPath,'chat.html')));

// Socket.IO
const io = new Server(server);
const online = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token não fornecido'));
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = id;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', socket => {
  online.set(socket.userId, socket.id);
  socket.on('join', async ({ to }) => {
    const history = await Message.find({
      $or: [
        { from: socket.userId, to },
        { from: to, to: socket.userId }
      ]
    }).sort('createdAt');
    socket.emit('history', history);
  });
  socket.on('message', async ({ to, text }) => {
    const msg = await Message.create({ from: socket.userId, to, text });
    const target = online.get(to);
    if (target) io.to(target).emit('message', msg);
    socket.emit('message', msg);
  });
  socket.on('disconnect', () => {
    online.delete(socket.userId);
  });
});

// Inicia servidor
const PORT = process.env.PORT||3000;
server.listen(PORT, ()=>console.log(`🚀 rodando na porta ${PORT}`));
