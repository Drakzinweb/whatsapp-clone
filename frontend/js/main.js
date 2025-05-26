const socketUrl = 'https://whatsapp-clone-oz95.onrender.com'; // backend real

function getUserIdFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    // Verifica se o token expirou (exp é timestamp em segundos)
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null; // token expirado
    }
    return decoded.id;
  } catch {
    return null;
  }
}

const token = localStorage.getItem('token');
const userId = getUserIdFromToken(token);

if (!token || !userId) {
  alert('Usuário não autenticado ou token expirado! Faça login novamente.');
  localStorage.clear();
  window.location.href = '/login.html';
}

const socket = io(socketUrl, {
  auth: { token }
});

const usersList = document.getElementById('usersList');
const chatWith = document.getElementById('chatWith');
const messagesContainer = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');

let currentChatUser = null;

// Tratamento de erro na conexão (ex: token inválido)
socket.on('connect_error', (err) => {
  alert('Erro na conexão: ' + err.message);
  if (err.message.toLowerCase().includes('token')) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
});

// Atualiza lista de usuários online (exceto o próprio usuário)
socket.on('onlineUsers', (users) => {
  usersList.innerHTML = '';
  users.forEach(otherUserId => {
    if (otherUserId === userId) return;

    const li = document.createElement('li');
    li.textContent = `Usuário: ${otherUserId}`;
    li.classList.add('cursor-pointer', 'p-2', 'rounded', 'hover:bg-blue-100');
    li.onclick = () => startChat(otherUserId);
    usersList.appendChild(li);
  });
});

// Recebe histórico de mensagens do chat atual
socket.on('history', (msgs) => {
  messagesContainer.innerHTML = '';
  msgs.forEach(renderMessage);
});

// Recebe mensagens novas em tempo real
socket.on('message', (msg) => {
  if (!currentChatUser) return;

  if ((msg.from === currentChatUser && msg.to === userId) ||
      (msg.to === currentChatUser && msg.from === userId)) {
    renderMessage(msg);
  }
});

// Envia mensagem ao enviar formulário
msgForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text || !currentChatUser) return;

  socket.emit('message', { to: currentChatUser, text });
  msgInput.value = '';
});

// Inicia chat com usuário selecionado
function startChat(userId) {
  currentChatUser = userId;
  chatWith.textContent = `Usuário: ${userId}`;
  messagesContainer.innerHTML = '';
  socket.emit('join', { to: userId });
}

// Renderiza uma mensagem na tela
function renderMessage(msg) {
  const div = document.createElement('div');
  const isMe = msg.from === userId;

  div.classList.add(
    'max-w-xs', 'p-2', 'rounded', 'mb-2',
    'break-words', // para quebras de linha em mensagens longas
    isMe ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start'
  );

  div.textContent = `${msg.text} (${new Date(msg.timestamp).toLocaleTimeString()})`;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
