require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Você esqueceu de importar isso!
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

// ✅ Configura CORS para permitir sua origem do Netlify
const corsOptions = {
  origin: 'https://techchaat.netlify.app', // 👈 seu domínio
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Rotas da API
app.use('/api/auth', authRoutes);

// Conexão com MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch((err) => console.error('❌ Erro ao conectar no MongoDB:', err));

// Inicializa o Socket.IO
const io = new Server(server, {
  cors: {
    origin: 'https://techchaat.netlify.app', // também aqui
    methods: ['GET', 'POST']
  }
});

// Autenticação de sockets com JWT
io.use(async (socket, next) => {
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

// Armazena mensagens na memória (pode ser substituído por banco futuramente)
const messages = {};

io.on('connection', (socket) => {
  console.log(`🔌 Usuário conectado: ${socket.userId}`);

  socket.on('join', ({ to }) => {
    const room = [socket.userId, to].sort().join('_');
    socket.join(room);

    // Envia o histórico de mensagens
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
    console.log(`❌ Usuário desconectado: ${socket.userId}`);
  });
});

// Rota padrão para testar se API está online
app.get('/', (req, res) => {
  res.send('🚀 API do chat está online!');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
