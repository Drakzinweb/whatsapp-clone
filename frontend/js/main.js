const socketUrl = 'https://whatsapp-clone-oz95.onrender.com'; // ou http://localhost:3000
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
let currentChatUsername = '';

socket.on('onlineUsers', (users) => {
  usersList.innerHTML = '';
  const myId = getUserIdFromToken(token);

  users.forEach(user => {
    if (user.id === myId) return;

    const li = document.createElement('li');
    li.textContent = user.username;
    li.classList.add('cursor-pointer', 'p-2', 'rounded', 'hover:bg-blue-100');
    li.onclick = () => startChat(user.id, user.username);
    usersList.appendChild(li);
  });
});

socket.on('history', (msgs) => {
  messagesContainer.innerHTML = '';
  msgs.forEach(renderMessage);
});

socket.on('message', (msg) => {
  const myId = getUserIdFromToken(token);
  if (
    (msg.from === currentChatUser && msg.to === myId) ||
    (msg.to === currentChatUser && msg.from === myId)
  ) {
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

function startChat(userId, username) {
  currentChatUser = userId;
  currentChatUsername = username;
  chatWith.textContent = `Conversando com: ${username}`;
  messagesContainer.innerHTML = '';
  socket.emit('join', { to: userId });
}

function renderMessage(msg) {
  const div = document.createElement('div');
  const isMe = msg.from === getUserIdFromToken(token);

  div.classList.add('max-w-xs', 'p-2', 'rounded', 'fadeIn', isMe ? 'bg-blue-500 text-white self-end' : 'bg-gray-300 text-black self-start');
  div.textContent = `${isMe ? 'Você' : msg.senderName}: ${msg.text} (${new Date(msg.timestamp).toLocaleTimeString()})`;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getUserIdFromToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload).id;
  } catch (err) {
    console.error('Erro ao decodificar token:', err);
    return null;
  }
}
