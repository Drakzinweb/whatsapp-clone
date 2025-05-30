module.exports = (io) => {
  const users = new Map(); // Map socket.id => userId (ou username)

  io.on('connection', (socket) => {
    console.log(`🔌 Usuário conectado: ${socket.id}`);

    // Evento para registrar o usuário após conectar (ex: enviar userId do frontend)
    socket.on('userConnected', (userId) => {
      users.set(socket.id, userId);
      console.log(`👤 Usuário registrado: ${userId}`);

      // Enviar lista atualizada de usuários online para todos
      io.emit('usersOnline', Array.from(users.values()));
    });

    // Evento para enviar mensagem (exemplo simples)
    socket.on('sendMessage', (data) => {
      // data: { to, from, message, timestamp }
      console.log(`Mensagem de ${data.from} para ${data.to}: ${data.message}`);

      // Emitir mensagem para o destinatário específico (supondo que você tem a lógica de socket.id para usuário)
      // Aqui é um broadcast simples para todos
      io.emit('receiveMessage', data);
    });

    socket.on('disconnect', () => {
      const userId = users.get(socket.id);
      users.delete(socket.id);
      console.log(`❌ Usuário desconectado: ${userId} (${socket.id})`);

      // Atualizar lista de usuários online
      io.emit('usersOnline', Array.from(users.values()));
    });
  });
};
