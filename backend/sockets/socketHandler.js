const users = new Map(); // socket.id => userData
const onlineUsers = new Map(); // userId => socket.id

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🔌 Novo socket conectado:', socket.id);

    // Quando o usuário entra
    socket.on('userConnected', (userData) => {
      users.set(socket.id, userData);
      onlineUsers.set(userData._id, socket.id);
      console.log(`✅ ${userData.name} está online`);

      // Atualizar lista de usuários online para todos
      io.emit('userList', Array.from(users.values()));
    });

    // Mensagem enviada
    socket.on('sendMessage', (data) => {
      const { senderId, receiverId, text } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receiveMessage', {
          senderId,
          text,
          timestamp: Date.now()
        });
      }
    });

    // Chamadas de vídeo/voz
    socket.on('callUser', ({ from, to, signalData }) => {
      const toSocket = onlineUsers.get(to);
      if (toSocket) {
        io.to(toSocket).emit('incomingCall', { from, signalData });
      }
    });

    socket.on('answerCall', ({ to, signal }) => {
      const toSocket = onlineUsers.get(to);
      if (toSocket) {
        io.to(toSocket).emit('callAccepted', signal);
      }
    });

    socket.on('endCall', ({ to }) => {
      const toSocket = onlineUsers.get(to);
      if (toSocket) {
        io.to(toSocket).emit('callEnded');
      }
    });

    // Desconectar
    socket.on('disconnect', () => {
      const userData = users.get(socket.id);
      if (userData) {
        console.log(`❌ ${userData.name} saiu`);
        onlineUsers.delete(userData._id);
        users.delete(socket.id);
        io.emit('userList', Array.from(users.values()));
      }
    });
  });
};
