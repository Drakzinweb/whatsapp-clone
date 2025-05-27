// backend/config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado');

    // Drop índice de username_1 se existir
    const collection = conn.connection.db.collection('users');
    const indexes = await collection.indexes();
    if (indexes.find(ix => ix.name === 'username_1')) {
      await collection.dropIndex('username_1');
      console.log('🗑️  Índice username_1 removido');
    }

  } catch (error) {
    console.error('❌ Erro ao conectar MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
