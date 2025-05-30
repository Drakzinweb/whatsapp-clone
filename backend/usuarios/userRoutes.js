const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Rota protegida
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

module.exports = router;
