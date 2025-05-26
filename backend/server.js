require('dotenv').config();
const path      = require('path');
const express   = require('express');
const mongoose  = require('mongoose');
const helmet    = require('helmet');
const cors      = require('cors');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');

// Conexão DB
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;
const FRONT = process.env.FRONTEND_ORIGIN || '*';

app.use(helmet());
app.use(cors({ origin: FRONT, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15*60*1000, max: 100, message: { error: 'Too many requests' } }));

// Rotas API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));