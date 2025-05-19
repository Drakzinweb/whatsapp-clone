// Conecta via Socket.IO usando token JWT
const socket = io({ auth: { token: localStorage.getItem('token') } });
let selectedUserId = null;
let currentUserId = null;

// Carrega lista de usuários
async function loadUsers() {
  try {
    const resMe = await fetch('/api/me', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const me = await resMe.json();
    currentUserId = me.id;

    const resUsers = await fetch('/api/auth/users', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') }
    });
    const users = await resUsers.json();

    const list = document.getElementById('usersList');
    list.innerHTML = '';

    users.filter(u => u._id !== me.id).forEach(u => {
      const li = document.createElement('li');
      li.className = 'cursor-pointer p-2 rounded-lg hover:bg-gray-100 flex items-center space-x-2';
      li.innerHTML = `
        <i class="fas fa-user-circle text-gray-500 text-xl"></i>
        <span class="text-gray-700 font-medium">${u.username}</span>
      `;
      li.onclick = () => selectUser(u._id, u.username);
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Erro ao carregar usuários:', err);
  }
}

// Seleciona usuário e solicita histórico
function selectUser(id, username) {
  selectedUserId = id;
  document.getElementById('chatWith').textContent = username;
  document.getElementById('messages').innerHTML = '';
  socket.emit('join', { to: selectedUserId });
}

// Exibe histórico e novas mensagens
socket.on('history', msgs => msgs.forEach(addMessage));
socket.on('message', addMessage);

// Envia mensagem
document.getElementById('msgForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('msgInput');
  const text = input.value.trim();
  if (selectedUserId && text) {
    socket.emit('message', { to: selectedUserId, text });
    input.value = '';
  }
});

// Adiciona mensagem ao chat
function addMessage(msg) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `fadeIn max-w-xs px-4 py-2 rounded-lg text-white break-words ${
    msg.from === currentUserId ? 'bg-blue-500 self-end' : 'bg-gray-400 self-start'
  }`;
  msgDiv.textContent = msg.text;

  const wrapper = document.createElement('div');
  wrapper.className = 'flex mb-1 ' + (msg.from === currentUserId ? 'justify-end' : 'justify-start');
  wrapper.appendChild(msgDiv);

  const messages = document.getElementById('messages');
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

// Aguardar DOM e iniciar
document.addEventListener('DOMContentLoaded', loadUsers);
