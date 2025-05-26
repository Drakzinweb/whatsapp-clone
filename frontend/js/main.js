// URL do servidor backend real
const socketUrl = 'https://whatsapp-clone-oz95.onrender.com';

// Função para extrair o ID do usuário do token JWT
function getUserIdFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    // Verifica se o token expirou
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return null;
    }
    return decoded.id;
  } catch {
    return null;
  }
}

// Recupera token do localStorage
const token = localStorage.getItem('token');
const userId = getUserIdFromToken(token);

// Se não estiver autenticado, redireciona para login
if (!token || !userId) {
  alert('Usuário não autenticado ou token expirado! Faça login novamente.');
  localStorage.clear();
  window.location.href = '/login.html';
}

// Conecta ao servidor Socket.IO com autenticação
const socket = io(socketUrl, {
  auth: { token }
});

// Elementos da interface
const usersList = document.getElementById('usersList');
const chatWith = document.getElementById('chatWith');
const messagesContainer = document.getElementById('messages');
const msgForm = document.getElementById('msgForm');
const msgInput = document.getElementById('msgInput');

let currentChatUser = null;

// Lida com erro de conexão (ex: token inválido)
socket.on('connect_error', (err) => {
  alert('Erro na conexão: ' + err.message);
  if (err.message.toLowerCase().includes('token')) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
});

// Atualiza a lista de usuários online
socket.on('onlineUsers', (users) => {
  usersList.innerHTML = '';
  users.forEach(otherUserId => {
    if (otherUserId === userId) return; // ignora o próprio usuário

    const li = document.createElement('li');
    li.textContent = `Usuário: ${otherUserId}`;
    li.classList.add(
      'cursor-pointer', 'p-2', 'rounded', 'hover:bg-pink-100', 'transition-all', 'duration-200'
    );
    li.onclick = () => startChat(otherUserId);
    usersList.appendChild(li);
  });
});

// Recebe histórico de mensagens ao iniciar o chat
socket.on('history', (msgs) => {
  messagesContainer.innerHTML = '';
  msgs.forEach(renderMessage);
});

// Recebe mensagens em tempo real
socket.on('message', (msg) => {
  if (!currentChatUser) return;

  const isCurrentChat = 
    (msg.from === currentChatUser && msg.to === userId) ||
    (msg.to === currentChatUser && msg.from === userId);

  if (isCurrentChat) {
    renderMessage(msg);
  }
});

// Envia mensagem ao enviar o formulário
msgForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text || !currentChatUser) return;

  socket.emit('message', { to: currentChatUser, text });
  msgInput.value = '';
});

// Inicia o chat com o usuário selecionado
function startChat(otherUserId) {
  currentChatUser = otherUserId;
  chatWith.textContent = `Chat com: ${otherUserId}`;
  messagesContainer.innerHTML = '';

  socket.emit('join', { to: otherUserId });
}

// Renderiza mensagens na interface
function renderMessage(msg) {
  const div = document.createElement('div');
  const isMe = msg.from === userId;

  div.classList.add(
    'max-w-xs', 'p-3', 'rounded-lg', 'mb-2', 'shadow-md',
    'break-words', 'text-sm',
    'flex', 'flex-col',
    isMe ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 text-gray-800 self-start'
  );

  const textSpan = document.createElement('span');
  textSpan.textContent = msg.text;
  div.appendChild(textSpan);

  const timeSpan = document.createElement('span');
  timeSpan.classList.add('text-xs', 'mt-1', 'opacity-70');
  timeSpan.textContent = new Date(msg.timestamp).toLocaleTimeString();
  div.appendChild(timeSpan);

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
