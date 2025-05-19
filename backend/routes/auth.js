const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const { JWT_SECRET } = process.env;

// Registro de usuário
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ msg: 'Preencha usuário e senha' });

  try {
    if (await User.findOne({ username }))
      return res.status(400).json({ msg: 'Usuário já existe' });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash });
    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ msg: 'Erro interno' });
  }
});

// Login de usuário
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ msg: 'Usuário não encontrado' });

    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ msg: 'Senha incorreta' });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, username: user.username });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Erro interno' });
  }
});

// Lista de usuários (para contatos)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error('Users list error:', err.message);
    res.status(500).json({ msg: 'Erro interno' });
  }
});

module.exports = router;
