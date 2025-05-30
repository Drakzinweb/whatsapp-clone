const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../usuarios/User');

// 📌 Validações simples
const validateRegister = (name, email, password) => {
  if (!name || !email || !password) return 'Todos os campos são obrigatórios';
  if (!email.includes('@')) return 'Email inválido';
  if (password.length < 6) return 'A senha deve ter no mínimo 6 caracteres';
  return null;
};

const validateLogin = (email, password) => {
  if (!email || !password) return 'Email e senha são obrigatórios';
  if (!email.includes('@')) return 'Email inválido';
  return null;
};

// 🔐 Rota de registro
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  const error = validateRegister(name, email, password);
  if (error) return res.status(400).json({ error });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email já registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });
  } catch (err) {
    console.error('Erro no registro:', err.message);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// 🔑 Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const error = validateLogin(email, password);
  if (error) return res.status(400).json({ error });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      message: 'Login bem-sucedido',
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error('Erro no login:', err.message);
    res.status(500).json({ error: 'Erro ao autenticar' });
  }
});

module.exports = router;
