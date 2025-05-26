const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// REGISTRO DE NOVO USUÁRIO
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// LOGIN DE USUÁRIO
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ message: 'Usuário e senha são obrigatórios' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// VERIFICAÇÃO DE TOKEN
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ userId: user._id, username: user.username });
  } catch (err) {
    console.error('[VERIFY ERROR]', err);
    res.status(500).json({ message: 'Erro ao verificar usuário' });
  }
});

// BLOQUEAR USUÁRIO
router.post('/:id/block', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const toBlockId = req.params.id;

    if (!me || !toBlockId) {
      return res.status(400).json({ message: 'Requisição inválida' });
    }

    me.blockedUsers = me.blockedUsers || [];

    if (me.blockedUsers.includes(toBlockId)) {
      return res.status(400).json({ message: 'Usuário já está bloqueado' });
    }

    me.blockedUsers.push(toBlockId);
    await me.save();

    res.json({ message: 'Usuário bloqueado com sucesso' });
  } catch (err) {
    console.error('[BLOCK ERROR]', err);
    res.status(500).json({ message: 'Erro ao bloquear usuário' });
  }
});

// DESBLOQUEAR USUÁRIO
router.post('/:id/unblock', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const unblockId = req.params.id;

    if (!me || !unblockId) {
      return res.status(400).json({ message: 'Requisição inválida' });
    }

    me.blockedUsers = (me.blockedUsers || []).filter(id => id.toString() !== unblockId);
    await me.save();

    res.json({ message: 'Usuário desbloqueado com sucesso' });
  } catch (err) {
    console.error('[UNBLOCK ERROR]', err);
    res.status(500).json({ message: 'Erro ao desbloquear usuário' });
  }
});

module.exports = router;
