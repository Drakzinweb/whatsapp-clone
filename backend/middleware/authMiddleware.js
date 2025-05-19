const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = process.env;

module.exports = async function (req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({ msg: 'Token não informado' });

  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) throw new Error('Usuário não existe');
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ msg: 'Token inválido ou expirado' });
  }
};
