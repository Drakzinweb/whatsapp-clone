const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, default: '' },
  media: {
    type: { type: String, enum: ['image', 'video', null], default: null },
    url: String
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String
  }],
  isPinned: { type: Boolean, default: false },
  isSelfDestruct: { type: Boolean, default: false },
  destructAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
