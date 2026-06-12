'use strict';

const API_USUARIOS_URL = `${API_BASE}/usuarios`;

let usuarios = [];
let editandoUsuarioId = null;

const formUsuario    = document.getElementById('form-usuario');
const tabelaUsuarios = document.querySelector('#usuarios-lista tbody');
const campoUserId    = document.getElementById('usuario-id');
const campoNome      = document.getElementById('usuario-nome');
const campoEmail     = document.getElementById('usuario-email');
const campoSenha     = document.getElementById('usuario-senha');
const labelSenha     = document.querySelector('label[for="usuario-senha"]');

document.addEventListener('DOMContentLoaded', async () => {
  await carregarUsuarios();

  formUsuario.addEventListener('submit', handleSubmitUsuario);
  formUsuario.addEventListener('reset',  handleResetUsuario);

  [campoNome, campoEmail, campoSenha].forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('is-invalid');
      const err = this.parentElement.querySelector('.error-message');
      if (err) err.remove();
    });
  });
});

async function carregarUsuarios() {
  try {
    const resp = await authFetch(API_USUARIOS_URL);
    const json = await resp.json();
    if (json.status === 'ok') {
      usuarios = json.data;
      renderizarUsuarios();
    } else {
      mostrarMensagem('Erro ao carregar usuarios: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function renderizarUsuarios() {
  tabelaUsuarios.innerHTML = '';

  if (usuarios.length === 0) {
    tabelaUsuarios.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          Nenhum usuario cadastrado.
        </td>
      </tr>`;
    return;
  }

  usuarios.forEach((usuario, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(usuario.nome)}</td>
      <td>${escapeHtml(usuario.email)}</td>
      <td>
        <button class="btn-acao btn-editar"  data-id="${usuario.id}">Editar</button>
        <button class="btn-acao btn-excluir" data-id="${usuario.id}">Excluir</button>
      </td>`;

    tr.querySelector('.btn-editar').addEventListener('click',  () => editarUsuario(usuario.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => excluirUsuario(usuario.id));
    tabelaUsuarios.appendChild(tr);
  });
}

async function handleSubmitUsuario(e) {
  e.preventDefault();
  if (!validarFormUsuario()) return;

  const dados = {
    nome:  campoNome.value.trim(),
    email: campoEmail.value.trim(),
    senha: campoSenha.value,
  };

  try {
    const url    = editandoUsuarioId ? `${API_USUARIOS_URL}/${editandoUsuarioId}` : API_USUARIOS_URL;
    const method = editandoUsuarioId ? 'PUT' : 'POST';
    const msg    = editandoUsuarioId ? 'Usuário atualizado com sucesso!' : 'Usuário cadastrado com sucesso!';

    const resp = await authFetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formUsuario.reset();
      await carregarUsuarios();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormUsuario() {
  document.querySelectorAll('#form-usuario .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-usuario .is-invalid').forEach(el => el.classList.remove('is-invalid'));

  let valido = true;
  const obrigatorios = [
    { el: campoNome,  nome: 'Nome' },
    { el: campoEmail, nome: 'E-mail' },
  ];
  if (!editandoUsuarioId) obrigatorios.push({ el: campoSenha, nome: 'Senha' });

  for (const c of obrigatorios) {
    if (!c.el.value.trim()) {
      c.el.classList.add('is-invalid');
      const err = document.createElement('div');
      err.className = 'error-message text-danger small mt-1';
      err.textContent = `${c.nome} é obrigatório.`;
      c.el.parentElement.appendChild(err);
      valido = false;
    }
  }

  if (campoEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value)) {
    campoEmail.classList.add('is-invalid');
    const err = document.createElement('div');
    err.className = 'error-message text-danger small mt-1';
    err.textContent = 'E-mail inválido.';
    campoEmail.parentElement.appendChild(err);
    valido = false;
  }

  if (campoSenha.value && campoSenha.value.length < 6) {
    campoSenha.classList.add('is-invalid');
    const err = document.createElement('div');
    err.className = 'error-message text-danger small mt-1';
    err.textContent = 'A senha deve ter no mínimo 6 caracteres.';
    campoSenha.parentElement.appendChild(err);
    valido = false;
  }

  return valido;
}

function editarUsuario(id) {
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) return;

  campoUserId.value = usuario.id;
  campoNome.value   = usuario.nome;
  campoEmail.value  = usuario.email;
  campoSenha.value  = '';
  editandoUsuarioId = id;

  if (labelSenha) {
    labelSenha.innerHTML = 'Senha <span class="text-muted fw-normal fst-italic">(deixe em branco para manter)</span>';
  }

  document.getElementById('cadastro-usuario').scrollIntoView({ behavior: 'smooth' });
  campoNome.focus();
  mostrarMensagem('Editando usuario. Modifique os campos e clique em Salvar.', 'info');
}

async function excluirUsuario(id) {
  const usuario = usuarios.find(u => u.id === id);
  if (!usuario) return;
  if (!confirm(`Deseja realmente excluir o usuario "${usuario.nome}"?`)) return;

  try {
    const resp = await authFetch(`${API_USUARIOS_URL}/${id}`, { method: 'DELETE' });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem('Usuario excluído com sucesso!', 'success');
      await carregarUsuarios();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function handleResetUsuario() {
  editandoUsuarioId = null;
  campoUserId.value = '';

  if (labelSenha) {
    labelSenha.innerHTML = 'Senha <span class="text-danger">*</span>';
  }

  document.querySelectorAll('#form-usuario .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-usuario .is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

