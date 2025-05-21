const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Criação da pasta de upload se não existir
const AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(AVATAR_DIR, { recursive: true });

// Configuração do Multer para upload de avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `${req.params.id}${ext}`);
  }
});

const upload = multer({ storage });

// Upload de avatar
router.post('/:id/avatar', auth, upload.single('avatar'), (req, res) => {
  return res.status(200).json({ message: 'Avatar enviado com sucesso' });
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

// Atualizar perfil (nome/status)
router.put('/:id/update-profile', auth, async (req, res) => {
  try {
    const { username, status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { username, status }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: 'Erro ao atualizar perfil' });
  }
});

// Trocar senha
router.put('/:id/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Senha atual incorreta' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    res.status(400).json({ message: 'Erro ao alterar senha' });
  }
});

// Obter lista de bloqueados
router.get('/me/blocked', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('blockedUsers', 'username');
    res.json(user.blockedUsers);
  } catch {
    res.status(400).json({ message: 'Erro ao buscar usuários bloqueados' });
  }
});

// Desbloquear usuário
router.post('/:id/unblock', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { blockedUsers: req.params.id }
    });
    res.json({ message: 'Usuário desbloqueado' });
  } catch {
    res.status(400).json({ message: 'Erro ao desbloquear' });
  }
});

// Deletar conta
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    await User.findByIdAndDelete(req.params.id);

    // Remover avatar
    const avatarPath = path.join(AVATAR_DIR, `${req.params.id}.png`);
    if (fs.existsSync(avatarPath)) {
      fs.unlinkSync(avatarPath);
    }

    res.json({ message: 'Conta excluída com sucesso' });
  } catch {
    res.status(400).json({ message: 'Erro ao excluir conta' });
  }
});

module.exports = router;
