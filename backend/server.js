require('dotenv').config();
const path = require('path');
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const authMiddleware = require('./middleware/authMiddleware');
const { errorHandler } = require('./middleware/errorHandler');

// Conecta ao MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Configurações
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';

// Middlewares gerais
app.use(helmet());
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas requisições, tente novamente mais tarde.' }
  })
);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes); // Todas as rotas de /api/users protegidas

// Rota protegida de exemplo
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: `Olá usuário ${req.userId}` });
});

// Serve arquivos estáticos do frontend
app.use(express.static(FRONTEND_DIR));

// Se não encontrar rota API, retorna index.html (SPA fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// Middleware global de erros
app.use(errorHandler);

// Inicia o servidor
server.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));
