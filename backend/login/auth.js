const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Rota de registro
router.post('/register', async (req, res) => {
  const { name, email, password, username } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    // Verifica se email já está em uso
    if (await User.findOne({ email })) {
      return res.status(400).json({ error: 'E-mail já cadastrado.' });
    }

    // Se estiver usando username, verifique também
    if (username && await User.findOne({ username })) {
      return res.status(400).json({ error: 'Nome de usuário já está em uso.' });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, password: hash, username });

    res.status(201).json({ message: 'Usuário criado com sucesso', userId: user._id });
  } catch (err) {
    console.error('Erro ao registrar:', err.message);

    // Erro de chave duplicada (MongoDB)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({ error: `Já existe um usuário com o mesmo ${field}.` });
    }

    res.status(500).json({ error: 'Erro interno ao registrar o usuário.' });
  }
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username || null
      }
    });
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ error: 'Erro interno ao fazer login.' });
  }
});

module.exports = router;
