const API_AUTH  = '/api/auth';
const API_USERS = '/api/users';

// Exibe mensagem no elemento de feedback (se existir)
function showFeedback(message, isError = true) {
  const fb = document.getElementById('feedback');
  if (!fb) return;
  fb.style.color = isError ? '#d9534f' : '#28a745';
  fb.textContent = message;
}

// Função genérica para login ou registro
async function handleAuthForm(e, type) {
  e.preventDefault();
  showFeedback('', true); // limpa feedback

  const data = {};
  [...e.target.elements].forEach(el => {
    if (el.id && el.value.trim()) data[el.id] = el.value.trim();
  });

  if (!data.email || !data.password || (type === 'register' && !data.name)) {
    return showFeedback('Preencha todos os campos obrigatórios.');
  }

  try {
    const res  = await fetch(`${API_AUTH}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) return showFeedback(json.error || 'Erro ao processar requisição.');

    if (type === 'login') {
      // Armazena dados no localStorage
      localStorage.setItem('token', json.token);
      localStorage.setItem('userId', json.user.id);
      localStorage.setItem('username', json.user.name);
      window.location = 'chat.html';
    } else {
      showFeedback('Registrado com sucesso! Redirecionando...', false);
      setTimeout(() => window.location = 'login.html', 1500);
    }

  } catch (err) {
    console.error('Erro de conexão:', err);
    showFeedback('Erro ao conectar com o servidor.');
  }
}

// Verifica se o usuário está autenticado
async function protectChatAndSetup(callback = null) {
  const token    = localStorage.getItem('token');
  const userId   = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  if (!token || !userId || !username) {
    localStorage.clear();
    window.location = 'login.html';
    return false;
  }

  // Exibe nome do usuário e configura logout
  const currentUser = document.getElementById('currentUsername');
  if (currentUser) currentUser.textContent = username;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      localStorage.clear();
      window.location = 'login.html';
    };
  }

  if (typeof callback === 'function') {
    callback({ token, userId, username });
  }

  return true;
}

// Dispatcher baseado na página
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  if (path.endsWith('login.html')) {
    document.getElementById('form')
      .addEventListener('submit', e => handleAuthForm(e, 'login'));

  } else if (path.endsWith('register.html')) {
    document.getElementById('form')
      .addEventListener('submit', e => handleAuthForm(e, 'register'));

  } else if (path.endsWith('chat.html')) {
    protectChatAndSetup(({ token, userId, username }) => {
      // Lógica adicional ao entrar no chat
      console.log('Usuário autenticado:', username);
      // Aqui você pode iniciar conexão com o socket, carregar mensagens, etc.
    });
  }
});
