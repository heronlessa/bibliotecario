'use strict';

document.addEventListener('DOMContentLoaded', () => {
  // Se não estiver na página de login, não faz nada.
  const form = document.getElementById('form-login');
  if (!form) return;

  form.addEventListener('submit', handleLogin);
});

async function handleLogin(e) {
  e.preventDefault();
  const emailEl = document.getElementById('login-email');
  const senhaEl = document.getElementById('login-senha');
  const email = emailEl.value.trim();
  const senha = senhaEl.value;

  if (!email || !senha) {
    alert('Por favor, preencha e-mail e senha.');
    return;
  }

  try {
    const resp = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    const json = await resp.json();

    if (resp.ok && json.status === 'ok') {
      setToken(json.data.token);
      saveUser(json.data.usuario);
      window.location.href = '/frontend/home.html'; // Redireciona para a página principal
    } else {
      alert('Erro: ' + (json.mensagem || 'E-mail ou senha inválidos.'));
    }
  } catch (err) {
    alert('Falha ao conectar com a API. Verifique o console para mais detalhes.');
    console.error(err);
  }
}
