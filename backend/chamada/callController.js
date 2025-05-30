const { asyncHandler, sendSuccess, sendError, AppError } = require('../utils/helpers');
const callService = require('./callService');

/**
 * Inicia uma chamada: cria sessão e retorna callId
 * Body: { to: <ID do usuário alvo> }
 */
exports.initiateCall = asyncHandler(async (req, res) => {
  const from = req.userId;
  const { to } = req.body;
  if (!to) throw new AppError('ID do usuário a chamar é obrigatório', 400);
  if (to === from) throw new AppError('Não é possível chamar a si mesmo', 400);

  const session = callService.createCallSession(from, to);
  sendSuccess(res, session, 'Chamada iniciada');
});

/**
 * Encerra uma chamada aberta
 * Body: { callId: <ID da chamada> }
 */
exports.endCall = asyncHandler(async (req, res) => {
  const { callId } = req.body;
  if (!callId) throw new AppError('callId é obrigatório', 400);

  const result = callService.endCallSession(callId);
  if (!result) throw new AppError('Chamada não encontrada', 404);

  sendSuccess(res, result, 'Chamada encerrada');
});

/**
 * Retorna o histórico de chamadas do sistema
 */
exports.getCallHistory = asyncHandler(async (req, res) => {
  const history = callService.getCallHistory();
  sendSuccess(res, history, 'Histórico de chamadas');
});
/**
 * Retorna o histórico de chamadas de um usuário específico
 * Query: ?userId=<ID do usuário>
 */