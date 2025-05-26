module.exports.errorHandler = (err, req, res, next) => {
  console.error('❌ Erro capturado pelo middleware:', err.stack || err.message);
  res.status(500).json({
    message: 'Erro interno do servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};
