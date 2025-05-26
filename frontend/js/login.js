const API = 'https://whatsapp-clone-wwjc.onrender.com/api/auth';

// Alternar visibilidade da senha
document.addEventListener('DOMContentLoaded', () => {
  const togglePasswordBtn = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  togglePasswordBtn.addEventListener('click', () => {
    const icon = togglePasswordBtn.querySelector('i');
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
      passwordInput.type = 'password';
      icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
  });

  // Submissão do formulário
  const form = document.getElementById('loginForm');
  const errorContainer = document.getElementById('errorContainer');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorContainer.textContent = '';

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Entrando...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.elements.email.value.trim(),
          password: form.elements.password.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'mb-4 p-3 bg-red-100 text-red-700 rounded-lg animate-bounce';
        errorDiv.textContent = data.message || 'Erro ao fazer login';
        errorContainer.appendChild(errorDiv);

        setTimeout(() => {
          errorDiv.classList.remove('animate-bounce');
          errorDiv.style.transition = 'opacity 0.3s ease';
          errorDiv.style.opacity = '0';
          setTimeout(() => errorDiv.remove(), 300);
        }, 5000);
        submitButton.textContent = originalText;
        submitButton.disabled = false;
        return;
      }

      // Sucesso: salvar dados
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('email', data.email);

      submitButton.innerHTML = '<i class="fas fa-check mr-2"></i> Sucesso!';
      submitButton.classList.replace('bg-indigo-600', 'bg-green-500');

      setTimeout(() => {
        window.location.href = 'chat.html';
      }, 1000);

    } catch (err) {
      alert('Erro de conexão. Tente novamente.');
      console.error(err);
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });
});
