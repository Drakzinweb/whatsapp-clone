const api = '/api/auth';

async function handleSubmit(e, type) {
  e.preventDefault();
  const data = {};
  [...e.target.elements].forEach(el => {
    if (el.id) data[el.id] = el.value;
  });
  const res = await fetch(`${api}/${type}`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) return alert(json.error);
  if (type==='login') {
    localStorage.setItem('token', json.token);
    window.location = 'chat.html';
  } else {
    alert('Registrado com sucesso!');
    window.location = 'login.html';
  }
}

// Detecta página e conecta evento
if (location.pathname.includes('login')) {
  document.getElementById('form').addEventListener('submit', e => handleSubmit(e, 'login'));
} else if (location.pathname.includes('register')) {
  document.getElementById('form').addEventListener('submit', e => handleSubmit(e, 'register'));
}