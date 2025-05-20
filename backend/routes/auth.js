const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: 'Usuário já existe' });

  const user = await User.create({ username, password });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(400).json({ message: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.json({ token });
});

router.get('/users', protect, async (req, res) => {
  const users = await User.find({}, '_id username');
  res.json(users);
});

router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user).select('-password');
  res.json({ id: user._id, username: user.username });
});

module.exports = router;
