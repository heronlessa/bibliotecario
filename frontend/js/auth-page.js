'use strict';

const formLogin = document.getElementById('form-login');
const campoEmail = document.getElementById('login-email');
const campoSenha = document.getElementById('login-senha');

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    window.location.href = '/index.html';
    return;
  }

  formLogin.addEventListener('submit', handleLogin);
  registrarLimpezaErro([campoEmail, campoSenha]);
});

async function handleLogin(e) {
  e.preventDefault();
  limparErros('#form-login');

  let valido = true;
  if (!campoEmail.value.trim()) {
    marcarErro(campoEmail, 'E-mail e obrigatorio.');
    valido = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value)) {
    marcarErro(campoEmail, 'E-mail invalido.');
    valido = false;
  }
  if (!campoSenha.value) {
    marcarErro(campoSenha, 'Senha e obrigatoria.');
    valido = false;
  }
  if (!valido) return;

  try {
    const { json } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: campoEmail.value.trim(),
        senha: campoSenha.value,
      }),
    }, { redirectOn401: false });

    if (json.status === 'ok' && json.data?.token) {
      salvarSessao(json.data.token, json.data.usuario);
      mostrarMensagem('Bem-vindo, ' + json.data.usuario.nome + '!', 'success');
      setTimeout(() => { window.location.href = '/index.html'; }, 600);
    } else {
      mostrarMensagem(json.mensagem || 'Falha no login.', 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}
