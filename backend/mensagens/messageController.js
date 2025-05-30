const Message = require('./Message');
const { asyncHandler, sendSuccess, sendError, AppError } = require('../utils/helpers');

// Enviar uma nova mensagem
exports.sendMessage = asyncHandler(async (req, res) => {
  const from = req.userId;
  const { to, text, media, isSelfDestruct, destructAt } = req.body;

  if (!to) throw new AppError('ID do destinatário é obrigatório', 400);

  const msg = new Message({
    from,
    to,
    text: text || '',
    media: media || { type: null, url: null },
    isSelfDestruct: !!isSelfDestruct,
    destructAt: isSelfDestruct ? destructAt : null
  });
  await msg.save();

  sendSuccess(res, msg, 'Mensagem enviada');
});

// Buscar conversas entre o usuário logado e outro usuário
exports.getConversation = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const otherId = req.params.userId;

  if (!otherId) throw new AppError('ID do outro usuário é obrigatório', 400);

  const messages = await Message.find({
    $or: [
      { from: userId, to: otherId },
      { from: otherId, to: userId }
    ]
  })
  .sort({ createdAt: 1 });

  sendSuccess(res, messages, 'Conversação carregada');
});

// Listar todas as mensagens envolvendo o usuário (paginado)
exports.listMessages = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [msgs, total] = await Promise.all([
    Message.find({
      $or: [ { from: userId }, { to: userId } ]
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(skip,10))
    .limit(parseInt(limit,10)),
    Message.countDocuments({
      $or: [ { from: userId }, { to: userId } ]
    })
  ]);

  sendSuccess(res, { messages: msgs, page: Number(page), limit: Number(limit), total });
});
