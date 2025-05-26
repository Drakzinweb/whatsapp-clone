require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Conectar ao banco
const connectDB = require('./config/db');
connectDB();

// Rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONT = process.env.FRONTEND_ORIGIN || '*';

// Helmet com CSP personalizada para permitir TailwindCDN, FontAwesome, e inline scripts
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com",
          "https://kit.fontawesome.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.tailwindcss.com"
        ],
        fontSrc: [
          "'self'",
          "https://kit.fontawesome.com"
        ],
        connectSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
      },
    },
  })
);

// Middleware
app.use(cors({ origin: FRONT, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Servir frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
