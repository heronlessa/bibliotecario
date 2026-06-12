'use strict';

const API_USUARIOS = '/usuarios';

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
  if (!exigirAutenticacao()) return;

  await carregarUsuarios();

  formUsuario.addEventListener('submit', handleSubmitUsuario);
  formUsuario.addEventListener('reset',  handleResetUsuario);
  registrarLimpezaErro([campoNome, campoEmail, campoSenha]);
});

async function carregarUsuarios() {
  try {
    const { json } = await apiFetch(API_USUARIOS);
    if (json.status === 'ok') {
      usuarios = json.data;
      renderizarUsuarios();
      if (typeof popularSelectUsuarios === 'function') popularSelectUsuarios();
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
        <td colspan="4" class="text-center text-muted py-4">Nenhum usuario cadastrado.</td>
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
  };
  if (campoSenha.value) dados.senha = campoSenha.value;

  try {
    const path   = editandoUsuarioId ? `${API_USUARIOS}/${editandoUsuarioId}` : API_USUARIOS;
    const method = editandoUsuarioId ? 'PUT' : 'POST';
    const msg    = editandoUsuarioId ? 'Usuario atualizado com sucesso!' : 'Usuario cadastrado com sucesso!';

    const { json } = await apiFetch(path, {
      method,
      body: JSON.stringify(dados),
    });

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formUsuario.reset();
      handleResetUsuario();
      await carregarUsuarios();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormUsuario() {
  limparErros('#form-usuario');
  let valido = true;

  const obrigatorios = [
    { el: campoNome,  nome: 'Nome' },
    { el: campoEmail, nome: 'E-mail' },
  ];
  if (!editandoUsuarioId) obrigatorios.push({ el: campoSenha, nome: 'Senha' });

  for (const c of obrigatorios) {
    if (!c.el.value.trim()) {
      marcarErro(c.el, `${c.nome} e obrigatorio.`);
      valido = false;
    }
  }

  if (campoEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campoEmail.value)) {
    marcarErro(campoEmail, 'E-mail invalido.');
    valido = false;
  }

  if (campoSenha.value && campoSenha.value.length < 6) {
    marcarErro(campoSenha, 'A senha deve ter no minimo 6 caracteres.');
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
    const { json } = await apiFetch(`${API_USUARIOS}/${id}`, { method: 'DELETE' });
    if (json.status === 'ok') {
      mostrarMensagem('Usuario excluido com sucesso!', 'success');
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
  limparErros('#form-usuario');
}
