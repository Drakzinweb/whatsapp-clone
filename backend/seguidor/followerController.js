// seguidor/followerController.js
const User = require('../routes/User');

// Lista TODOS usuários (exceto o logado) com info se já é seguido
exports.getAllUsers = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.userId);

    const users = await User.find({ _id: { $ne: req.userId } }).select('name email');

    const usersWithFollowStatus = users.map(user => ({
      _id: user._id,
      name: user.name,
      isFollowing: loggedUser.following.some(followId => followId.equals(user._id)),
    }));

    res.json(usersWithFollowStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

// Seguir usuário
exports.followUser = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.userId);
    const userToFollow = await User.findById(req.params.id);

    if (!userToFollow) return res.status(404).json({ message: 'Usuário não encontrado' });
    if (loggedUser.following.includes(userToFollow._id))
      return res.status(400).json({ message: 'Você já segue este usuário' });

    loggedUser.following.push(userToFollow._id);
    userToFollow.followers.push(loggedUser._id);

    await loggedUser.save();
    await userToFollow.save();

    res.json({ message: 'Seguindo usuário com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao seguir usuário' });
  }
};

// Deixar de seguir usuário
exports.unfollowUser = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.userId);
    const userToUnfollow = await User.findById(req.params.id);

    if (!userToUnfollow) return res.status(404).json({ message: 'Usuário não encontrado' });
    if (!loggedUser.following.includes(userToUnfollow._id))
      return res.status(400).json({ message: 'Você não segue este usuário' });

    loggedUser.following = loggedUser.following.filter(id => !id.equals(userToUnfollow._id));
    userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(loggedUser._id));

    await loggedUser.save();
    await userToUnfollow.save();

    res.json({ message: 'Deixou de seguir usuário com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deixar de seguir usuário' });
  }
};

// Lista usuários para chat: só os que você segue ou que te seguem
exports.getFollowedUsers = async (req, res) => {
  try {
    const loggedUser = await User.findById(req.userId);

    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [
        { _id: { $in: loggedUser.following } },
        { _id: { $in: loggedUser.followers } }
      ]
    }).select('name email');

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar usuários para chat' });
  }
};
