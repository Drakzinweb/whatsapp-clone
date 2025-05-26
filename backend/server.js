require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

// Conecta ao Mongo
connectDB();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Muitas requisições' } })
);

// Rotas
app.use('/api/auth', authRoutes);

// Rota protegida de exemplo
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: `Olá usuário ${req.userId}` });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server rodando na porta ${PORT}`));