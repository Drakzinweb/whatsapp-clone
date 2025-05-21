// routes/auth.js
const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Verifica se já existe
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }
    // Cria usuário (o pre('save') no model já faz hash da senha)
    const user = await User.create({ username, password });
    // Gera token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Retorna token e dados essenciais
    res.status(201).json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error('Erro no register:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Busca usuário por username
    const user = await User.findOne({ username });
    // Se não existir ou senha incorreta
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    // Gera token JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Envia token e dados
    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
