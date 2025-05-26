const api = '/api/auth';

async function handleSubmit(e, type) {
  e.preventDefault();
  const data = {};
  [...e.target.elements].forEach(el => {
    if (el.id) data[el.id] = el.value;
  });

  try {
    const res = await fetch(`${api}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!res.ok) {
      return alert(json.error || 'Erro na requisição');
    }

    if (type === 'login') {
      localStorage.setItem('token', json.token);
      window.location = 'chat.html';
    } else {
      alert('Registrado com sucesso!');
      window.location = 'login.html';
    }
  } catch (err) {
    alert('Erro de conexão com o servidor');
    console.error(err);
  }
}

// Detecta a página atual
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname;

  if (path.includes('login')) {
    document.getElementById('form')?.addEventListener('submit', e => handleSubmit(e, 'login'));
  }

  if (path.includes('register')) {
    document.getElementById('form')?.addEventListener('submit', e => handleSubmit(e, 'register'));
  }
});
