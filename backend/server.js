// backend/server.js
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

// 1) Use o middleware CORS do pacote oficial,
//    carregado ANTES de qualquer outra rota ou middleware.
app.use(cors({
  origin: 'https://techchaat.netlify.app',  // seu domínio Netlify
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// 2) Responda automaticamente a todos os OPTIONS
app.options('*', cors());

// 3) JSON body parser
app.use(express.json());

// 4) Rotas de Autenticação
app.use('/api/auth', authRoutes);

// 5) Conecta ao MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro ao conectar no MongoDB:', err));

// 6) Configuração do Socket.IO com CORS
const io = new Server(server, {
  cors: {
    origin: 'https://techchaat.netlify.app',
    methods: ['GET','POST','OPTIONS']
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
    const room = [socket.userId,to].sort().join('_');
    socket.join(room);
    if (messages[room]) socket.emit('history', messages[room]);
  });

  socket.on('message', ({ to,text }) => {
    const room = [socket.userId,to].sort().join('_');
    const msg = { from: socket.userId,to,text,timestamp: new Date() };
    messages[room] = messages[room]||[];
    messages[room].push(msg);
    io.to(room).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Usuário desconectado: ${socket.userId}`);
  });
});

// 7) Rota raiz para teste
app.get('/', (req, res) => {
  res.send('🚀 API do chat está online!');
});

// 8) Inicia servidor HTTP+WebSocket
const PORT = process.env.PORT||3000;
server.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
