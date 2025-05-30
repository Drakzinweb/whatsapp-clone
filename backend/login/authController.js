const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../usuarios/User');
const { validateRegister, validateLogin } = require('./validations');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  const validationError = validateRegister(name, email, password);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email já registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token });
  } catch (err) {
    console.error('Erro ao registrar:', err.message);
    res.status(500).json({ error: 'Erro interno ao registrar' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const validationError = validateLogin(email, password);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Credenciais inválidas' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Erro ao autenticar:', err.message);
    res.status(500).json({ error: 'Erro interno no login' });
  }
};
