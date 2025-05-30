const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'O nome é obrigatório'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'O email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Por favor, insira um email válido'],
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória'],
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
