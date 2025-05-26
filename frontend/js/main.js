const API_AUTH  = '/api/auth';
const API_USERS = '/api/users';

// Exibe mensagem no elemento de feedback (se existir)
function showFeedback(message, isError = true) {
  const fb = document.getElementById('feedback');
  if (!fb) return;
  fb.style.color = isError ? '#d9534f' : '#28a745';
  fb.textContent = message;
}

// Função genérica para login/register
async function handleAuthForm(e, type) {
  e.preventDefault();

  // Limpa feedback anterior
  showFeedback('', true);

  // Monta o objeto com todos os campos do form
  const data = {};
  [...e.target.elements].forEach(el => {
    if (el.id) data[el.id] = el.value.trim();
  });

  try {
    const res  = await fetch(`${API_AUTH}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();

    if (!res.ok) {
      return showFeedback(json.error || 'Erro na requisição', true);
    }

    if (type === 'login') {
      // Salva token e dados do usuário
      localStorage.setItem('token', json.token);
      localStorage.setItem('userId', json.user.id);
      localStorage.setItem('username', json.user.name);
      // Redireciona pro chat
      window.location = 'chat.html';
    } else {
      // registro
      showFeedback('Registrado com sucesso! Redirecionando...', false);
      setTimeout(() => window.location = 'login.html', 1500);
    }

  } catch (err) {
    console.error('Erro de conexão:', err);
    showFeedback('Falha de conexão com o servidor.', true);
  }
}

// Verifica e protege o chat, e configura logout
async function protectChatAndSetup() {
  const token    = localStorage.getItem('token');
  const userId   = localStorage.getItem('userId');
  const username = localStorage.getItem('username');

  // Se faltar algo, manda pro login
  if (!token || !userId || !username) {
    window.location = 'login.html';
    return false;
  }

  // Exibe nome do usuário e configura logout
  document.getElementById('currentUsername').textContent = username;
  document.getElementById('logoutBtn').onclick = () => {
    localStorage.clear();
    window.location = 'login.html';
  };

  return true;
}

// Dispatcher de páginas
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // login.html
  if (path.endsWith('login.html')) {
    document.getElementById('form')
      .addEventListener('submit', e => handleAuthForm(e, 'login'));
  }

  // register.html
  else if (path.endsWith('register.html')) {
    document.getElementById('form')
      .addEventListener('submit', e => handleAuthForm(e, 'register'));
  }

  // chat.html
  else if (path.endsWith('chat.html')) {
    protectChatAndSetup().then(ok => {
      if (!ok) return;
      // Aqui você pode iniciar o chat (Socket.IO, etc)
    });
  }
});
