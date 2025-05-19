// Conexão com MongoDB (Atlas ou local)
const mongoose = require('mongoose');
const { MONGO_URI } = process.env;

module.exports = async function connectDB() {
  if (!MONGO_URI) {
    console.error('✖ MONGO_URI está indefinido. Verifique seu .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✔ MongoDB conectado');
  } catch (err) {
    console.error('✖ Erro ao conectar MongoDB:', err.message);
    process.exit(1);
  }
};
