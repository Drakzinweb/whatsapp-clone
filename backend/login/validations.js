exports.validateRegister = (name, email, password) => {
  if (!name || !email || !password) return 'Todos os campos são obrigatórios';
  if (password.length < 6) return 'A senha deve ter no mínimo 6 caracteres';
  if (!email.includes('@')) return 'Email inválido';
  return null;
};

exports.validateLogin = (email, password) => {
  if (!email || !password) return 'Email e senha são obrigatórios';
  if (!email.includes('@')) return 'Email inválido';
  return null;
};
exports.validateUpdate = (name, email) => {
  if (!name || !email) return 'Nome e email são obrigatórios';
  if (!email.includes('@')) return 'Email inválido';
  return null;
};