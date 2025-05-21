const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Verifica se o header de autorização existe
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  // Espera o formato: "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token ausente ou mal formatado' });
  }

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Salva o ID do usuário para uso posterior nas rotas
    req.userId = decoded.id;

    // Passa para o próximo middleware ou rota
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido' });
  }
};
