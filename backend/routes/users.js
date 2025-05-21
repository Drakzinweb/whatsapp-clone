const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

// Lista usuários bloqueados
router.get('/me/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', 'username');
    res.json(user.blockedUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar bloqueados' });
  }
});

// Bloquear usuário
router.post('/:id/block', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const toBlockId = req.params.id;

    if (me.blockedUsers.includes(toBlockId)) {
      return res.status(400).json({ message: 'Usuário já bloqueado' });
    }

    me.blockedUsers.push(toBlockId);
    await me.save();

    res.json({ message: 'Usuário bloqueado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao bloquear o usuário' });
  }
});

// Desbloquear usuário
router.post('/:id/unblock', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const unblockId = req.params.id;

    me.blockedUsers = me.blockedUsers.filter(id => id.toString() !== unblockId);
    await me.save();

    res.json({ message: 'Usuário desbloqueado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao desbloquear o usuário' });
  }
});

// Atualizar username
router.put('/:id/update-username', auth, async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findById(req.params.id);

    if (!username || !user) return res.status(400).json({ message: 'Dados inválidos' });

    user.username = username;
    await user.save();

    res.json({ message: 'Nome de usuário atualizado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar username' });
  }
});

// Alterar senha
router.put('/:id/change-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.params.id);

    if (!password || !user) return res.status(400).json({ message: 'Senha inválida' });

    user.password = password;
    await user.save();

    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao mudar a senha' });
  }
});

// Excluir conta
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Não autorizado' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao excluir conta' });
  }
});

module.exports = router;
