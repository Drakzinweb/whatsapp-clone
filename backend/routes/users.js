const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// Diretório de uploads de avatar
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${req.params.id}${ext}`);
  }
});

const upload = multer({ storage });

// Upload de avatar
router.post('/:id/avatar', auth, upload.single('avatar'), (req, res) => {
  res.status(200).json({ message: 'Avatar enviado com sucesso' });
});

// Download de avatar
router.get('/:id/avatar', (req, res) => {
  const filePath = path.join(AVATAR_DIR, `${req.params.id}.png`);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Avatar não encontrado' });
  }
});

// Atualizar perfil (nome ou status)
router.put('/:id/update-profile', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { username, status } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (status) updateData.status = status;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Trocar senha
router.put('/:id/change-password', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erro ao alterar senha' });
  }
});

// Obter lista de usuários bloqueados
router.get('/me/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', 'username');
    res.json(user.blockedUsers || []);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erro ao buscar usuários bloqueados' });
  }
});

// Desbloquear usuário
router.post('/:id/unblock', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, {
      $pull: { blockedUsers: req.params.id }
    });
    res.json({ message: 'Usuário desbloqueado' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erro ao desbloquear' });
  }
});

// Deletar conta
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Remover avatar
    const avatarPath = path.join(AVATAR_DIR, `${req.params.id}.png`);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    res.json({ message: 'Conta excluída com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Erro ao excluir conta' });
  }
});

module.exports = router;
