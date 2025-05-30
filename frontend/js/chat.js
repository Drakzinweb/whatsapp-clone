document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  const chatBox = document.getElementById('chat-box');
  const msgForm = document.getElementById('msg-form');
  const msgInput = document.getElementById('msg-input');
  const userList = document.getElementById('user-list');
  const currentUser = document.getElementById('currentUsername');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!token || !userId || !username) {
    return window.location.href = 'login.html';
  }

  currentUser.textContent = username;
  logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };

  let selectedUser = null;

  async function carregarUsuarios() {
    const res = await fetch('/api/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    userList.innerHTML = '';
    data.forEach(user => {
      if (user._id !== userId) {
        const li = document.createElement('li');
        li.textContent = user.name;
        li.onclick = () => {
          selectedUser = user;
          carregarMensagens(user._id);
        };
        userList.appendChild(li);
      }
    });
  }

  async function carregarMensagens(outroId) {
    const res = await fetch(`/api/messages/${outroId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    chatBox.innerHTML = '';
    data.data.forEach(msg => {
      const div = document.createElement('div');
      div.className = msg.from === userId ? 'sent' : 'received';
      div.textContent = msg.text;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  msgForm.onsubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return alert('Selecione um usuário para conversar.');
    const text = msgInput.value.trim();
    if (!text) return;

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: selectedUser._id,
        text,
        isSelfDestruct: false
      })
    });

    const data = await res.json();
    if (res.ok) {
      const div = document.createElement('div');
      div.className = 'sent';
      div.textContent = text;
      chatBox.appendChild(div);
      chatBox.scrollTop = chatBox.scrollHeight;
      msgInput.value = '';
    } else {
      alert(data.message || 'Erro ao enviar mensagem');
    }
  };

  await carregarUsuarios();
});
