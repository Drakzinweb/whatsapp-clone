const express = require('express');
const User = require('../usuarios/User');
const auth = require('../login/authMiddleware');

const router = express.Router();

// Rota protegida para obter dados do usuário logado
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Listar todos os usuários (exclui senha) - protegido
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Erro ao listar usuários:', err);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Buscar usuário por ID (exclui senha) - protegido
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar usuário por ID - protegido
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(updatedUser);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário por ID - protegido
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
