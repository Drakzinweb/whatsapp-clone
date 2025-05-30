const Story = require('./Story');
const { asyncHandler, sendSuccess, AppError } = require('../utils/helpers');

/**
 * Postar um novo story
 * Body: { mediaType: 'image'|'video', mediaUrl: String, durationSec: Number }
 */
exports.postStory = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const { mediaType, mediaUrl, durationSec } = req.body;

  if (!mediaType || !mediaUrl || !durationSec) {
    throw new AppError('mediaType, mediaUrl e durationSec são obrigatórios', 400);
  }

  const expiresAt = new Date(Date.now() + durationSec * 1000);
  const story = await Story.create({ user: userId, mediaType, mediaUrl, expiresAt });

  sendSuccess(res, story, 'Story postado com sucesso');
});

/**
 * Listar stories ativos de todos os usuários ou de um usuário específico
 * Query opcional: ?userId=...
 */
exports.listStories = asyncHandler(async (req, res) => {
  const filter = { expiresAt: { $gt: new Date() } };
  if (req.query.userId) filter.user = req.query.userId;

  const stories = await Story.find(filter)
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  sendSuccess(res, stories, 'Stories carregados');
});
