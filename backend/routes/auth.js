const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ username, password: hashedPassword });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // Verifica a senha com bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Verificar token
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    res.json({ userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao verificar usuário' });
  }
});

// Bloquear usuário
router.post('/:id/block', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const toBlock = req.params.id;

    if (!me.blockedUsers) me.blockedUsers = [];

    if (me.blockedUsers.includes(toBlock)) {
      return res.status(400).json({ message: 'Usuário já está bloqueado' });
    }

    me.blockedUsers.push(toBlock);
    await me.save();

    res.json({ message: 'Usuário bloqueado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao bloquear usuário' });
  }
});

// Desbloquear usuário
router.post('/:id/unblock', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const unblockId = req.params.id;

    me.blockedUsers = (me.blockedUsers || []).filter(id => id.toString() !== unblockId);
    await me.save();

    res.json({ message: 'Usuário desbloqueado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao desbloquear usuário' });
  }
});

module.exports = router;
