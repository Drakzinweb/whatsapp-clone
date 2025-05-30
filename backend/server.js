// backend/server.js

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

// Importar rotas e middlewares
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Inicializar Express
const app = express();
const server = http.createServer(app); // necessário para socket.io

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', routes);

// Servir arquivos estáticos do frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Rota fallback para SPA (Single Page App)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Middleware de erro 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Rota não encontrada' });
});

// Middleware de erro geral
app.use(errorHandler);

// Socket.IO (se quiser usar)
// const { Server } = require('socket.io');
// const io = new Server(server, { cors: { origin: '*' } });
// require('./socket/index')(io);

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
