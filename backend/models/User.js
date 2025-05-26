const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'O nome de usuário é obrigatório'],
    trim: true,
    minlength: [3, 'O nome de usuário deve ter pelo menos 3 caracteres']
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // opcional
    trim: true
  },
  password: {
    type: String,
    required: [true, 'A senha é obrigatória'],
    minlength: [4, 'A senha deve ter pelo menos 4 caracteres'],
    select: false
  },
  avatar: {
    type: String, // URL ou base64
    default: ''
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Criptografar a senha antes de salvar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    return next(err);
  }
});

// Método para verificar senha
userSchema.methods.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
