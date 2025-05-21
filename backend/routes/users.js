// routes/users.js
const express = require('express');
const User    = require('../models/User');
const auth    = require('../middleware/authMiddleware');

const router = express.Router();

// Lista bloqueados
router.get('/me/blocked', auth, async (req, res) => {
  // ...
});

// Bloquear usuário
router.post('/:id/block', auth, async (req, res) => {
  // ... seu código de bloqueio ...
});

// Desbloquear usuário
router.post('/:id/unblock', auth, async (req, res) => {
  // ... seu código de desbloqueio ...
});

// Atualizar username
router.put('/:id/update-username', auth, async (req, res) => {
  // ...
});

// Alterar senha
router.put('/:id/change-password', auth, async (req, res) => {
  // ...
});

// Excluir conta
router.delete('/:id', auth, async (req, res) => {
  // ...
});

module.exports = router;
