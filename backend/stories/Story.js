const mongoose = require('mongoose');

const StorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  mediaUrl: { type: String, required: true },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Índice para remover stories expirados (se quiser usar TTL no MongoDB)
// StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Story', StorySchema);
