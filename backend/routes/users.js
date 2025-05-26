const express = require('express');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

const router = express.Router();

// Exemplo: obter perfil do usuário logado
outer.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

module.exports = router;