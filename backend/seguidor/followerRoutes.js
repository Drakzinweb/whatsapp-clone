const express = require('express');
const router = express.Router();
const authMiddleware = require('../login/authMiddleware');
const User = require('../login/User');

// Lista todos os usuários com status de "seguindo"
router.get('/all-users', authMiddleware, async (req, res) => {
  const currentUser = req.user;
  const users = await User.find({ _id: { $ne: currentUser._id } });

  const formatted = users.map(user => ({
    _id: user._id,
    name: user.name,
    isFollowing: currentUser.following.includes(user._id)
  }));

  res.json(formatted);
});

// Seguir um usuário
router.post('/follow/:id', authMiddleware, async (req, res) => {
  const currentUser = req.user;
  const userToFollow = await User.findById(req.params.id);

  if (!userToFollow) return res.status(404).json({ message: 'Usuário não encontrado' });

  if (!currentUser.following.includes(userToFollow._id)) {
    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);
    await currentUser.save();
    await userToFollow.save();
  }

  res.json({ message: 'Seguindo com sucesso' });
});

module.exports = router;
