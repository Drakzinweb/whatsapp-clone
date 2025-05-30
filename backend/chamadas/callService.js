const { v4: uuidv4 } = require('uuid');

/**
 * Em memória armazenamos as sessões de chamadas:
 * {
 *   callId: { from, to, startTime, endTime }
 * }
 */
const calls = {};

/**
 * Inicia uma nova sessão de chamada
 * @param {String} from  ID do usuário que inicia
 * @param {String} to    ID do usuário que recebe
 * @returns {Object}     { callId, startTime }
 */
exports.createCallSession = (from, to) => {
  const callId = uuidv4();
  const startTime = new Date();
  calls[callId] = { from, to, startTime, endTime: null };
  return { callId, startTime };
};

/**
 * Finaliza uma sessão de chamada existente
 * @param {String} callId 
 * @returns {Object|null}  { callId, duration } ou null se não existir
 */
exports.endCallSession = (callId) => {
  const session = calls[callId];
  if (!session) return null;
  session.endTime = new Date();
  const duration = (session.endTime - session.startTime) / 1000; // segundos
  return { callId, duration };
};

/**
 * Retorna o histórico de todas as chamadas
 * @returns {Array} Lista de sessões de chamada
 */
exports.getCallHistory = () => {
  return Object.entries(calls).map(([callId, { from, to, startTime, endTime }]) => ({
    callId,
    from,
    to,
    startTime,
    endTime,
    duration: endTime ? (endTime - startTime) / 1000 : null
  }));
};
