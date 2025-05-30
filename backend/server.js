const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = require('./config/db');
connectDB();

// Inicializar Express
const app = express();
const server = http.createServer(app); // Necessário para Socket.IO

// Middlewares globais
app.use(cors());
app.use(express.json());

// Importar middlewares
const errorHandler = require('./middleware/errorHandler');

// Importar rotas organizadas por funcionalidade
app.use('/api/auth', require('./login/authRoutes'));
app.use('/api/users', require('./usuarios/userRoutes'));
app.use('/api/messages', require('./mensagens/messageRoutes'));
app.use('/api/calls', require('./chamadas/callRoutes'));
app.use('/api/stories', require('./stories/storyRoutes'));
app.use('/api/follow', require('./seguidor/followerRoutes'));

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota fallback para SPA (Single Page Application)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Middleware de erro 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de erro global
app.use(errorHandler);

// Socket.IO
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });
require('./sockets/socketHandler')(io);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
