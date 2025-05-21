const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Registro
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (await User.findOne({ username })) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }
    const user = await User.create({ username, password });
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
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, userId: user._id, username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Bloquear usuário
router.post('/block/:id', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const toBlock = req.params.id;
    me.blockedUsers = me.blockedUsers || [];
    if (me.blockedUsers.includes(toBlock)) {
      return res.status(400).json({ message: 'Já está bloqueado' });
    }
    me.blockedUsers.push(toBlock);
    await me.save();
    res.json({ message: 'Usuário bloqueado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao bloquear usuário' });
  }
});

// Desbloquear usuário
router.post('/unblock/:id', authMiddleware, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const unblockId = req.params.id;
    me.blockedUsers = (me.blockedUsers || []).filter(id => id.toString() !== unblockId);
    await me.save();
    res.json({ message: 'Usuário desbloqueado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao desbloquear usuário' });
  }
});

module.exports = router;
