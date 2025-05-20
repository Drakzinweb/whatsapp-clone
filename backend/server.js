require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

connectDB();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.token;
  console.log('🔌 Usuário conectado:', userId);

  socket.on('join', async ({ to }) => {
    const messages = await Message.find({ $or: [{ from: userId, to }, { from: to, to: userId }] });
    socket.emit('history', messages);
  });

  socket.on('message', async ({ to, text }) => {
    const message = await Message.create({ from: userId, to, text });
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('❌ Usuário desconectado:', userId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
