const User = require('./User');
const bcrypt = require('bcryptjs');

// Listar todos os usuários (sem senha)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
};

// Buscar usuário pelo ID (sem senha)
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id, '-password');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

// Atualizar usuário pelo ID
exports.updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updateData = { name, email };

    // Se enviar senha, faz o hash
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
      select: '-password',
    });

    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    console.error('Erro ao atualizar usuário:', err);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

// Deletar usuário pelo ID
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar usuário:', err);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};
