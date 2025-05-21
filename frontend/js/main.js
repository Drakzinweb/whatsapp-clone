const socketUrl = 'https://whatsapp-clone-oz95.onrender.com'; // backend real

const token = localStorage.getItem('token');
if (!token) {
  alert('Usuário não autenticado! Faça login.');
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

socket.on('onlineUsers', (users) => {
  usersList.innerHTML = '';
  users.forEach(userId => {
    if (userId === getUserIdFromToken(token)) return;

    const li = document.createElement('li');
    li.textContent = `Usuário: ${userId}`;
    li.classList.add('cursor-pointer', 'p-2', 'rounded', 'hover:bg-blue-100');
    li.onclick = () => startChat(userId);
    usersList.appendChild(li);
  });
});

socket.on('history', (msgs) => {
  messagesContainer.innerHTML = '';
  msgs.forEach(renderMessage);
});

socket.on('message', (msg) => {
  const userId = getUserIdFromToken(token);
  if ((msg.from === currentChatUser && msg.to === userId) ||
      (msg.to === currentChatUser && msg.from === userId)) {
    renderMessage(msg);
  }
});

msgForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text || !currentChatUser) return;

  socket.emit('message', { to: currentChatUser, text });
  msgInput.value = '';
});

function startChat(userId) {
  currentChatUser = userId;
  chatWith.textContent = `Usuário: ${userId}`;
  messagesContainer.innerHTML = '';
  socket.emit('join', { to: userId });
}

function renderMessage(msg) {
  const div = document.createElement('div');
  const isMe = msg.from === getUserIdFromToken(token);
  div.classList.add('max-w-xs', 'p-2', 'rounded',
    isMe ? 'bg-blue-500 text-white self-end' : 'bg-gray-200 text-gray-800 self-start');
  div.textContent = `${msg.text} (${new Date(msg.timestamp).toLocaleTimeString()})`;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getUserIdFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.id;
  } catch {
    return null;
  }
}
