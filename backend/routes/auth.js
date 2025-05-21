// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Retorna token, username e userId
    res.json({ token, username: user.username, userId: user._id });
  } catch {
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
