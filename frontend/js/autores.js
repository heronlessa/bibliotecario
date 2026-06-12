'use strict';

const API_AUTORES_URL = `${API_BASE}/autores`;

let autores = [];
let editandoAutorId = null;

// ── Elementos do DOM ─────────────────────────────────────────────
const formAutor      = document.getElementById('form-autor');
const tabelaAutores  = document.querySelector('#autores-lista tbody');
const campoAutorHiddenId = document.getElementById('autor-form-id');
const campoAutorNome = document.getElementById('autor-nome');
const campoAutorNac  = document.getElementById('autor-nacionalidade');

// ── Inicialização ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await carregarAutores();

  formAutor.addEventListener('submit', handleSubmitAutor);
  formAutor.addEventListener('reset',  handleResetAutor);

  [campoAutorNome, campoAutorNac].forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('is-invalid');
      const err = this.parentElement.querySelector('.error-message');
      if (err) err.remove();
    });
  });
});

// ── Carregar autores ─────────────────────────────────────────────
async function carregarAutores() {
  try {
    const resp = await authFetch(API_AUTORES_URL);
    const json = await resp.json();
    if (json.status === 'ok') {
      autores = json.data;
      renderizarAutores();
      // Atualiza o select de autores no form de livros se existir
      if (typeof popularSelectAutores === 'function') popularSelectAutores();
    }
  } catch {
    mostrarMensagem('Falha ao carregar autores.', 'danger');
  }
}

// ── Renderizar tabela ────────────────────────────────────────────
function renderizarAutores() {
  tabelaAutores.innerHTML = '';

  if (autores.length === 0) {
    tabelaAutores.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          Nenhum autor cadastrado.
        </td>
      </tr>`;
    return;
  }

  autores.forEach((autor, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(autor.nome)}</td>
      <td>${escapeHtml(autor.nacionalidade ?? '-')}</td>
      <td>
        <button class="btn-acao btn-editar"  data-id="${autor.id}">Editar</button>
        <button class="btn-acao btn-excluir" data-id="${autor.id}">Excluir</button>
      </td>`;

    tr.querySelector('.btn-editar').addEventListener('click',  () => editarAutor(autor.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => excluirAutor(autor.id));
    tabelaAutores.appendChild(tr);
  });
}

// ── Submit ───────────────────────────────────────────────────────
async function handleSubmitAutor(e) {
  e.preventDefault();

  document.querySelectorAll('#form-autor .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-autor .is-invalid').forEach(el => el.classList.remove('is-invalid'));

  if (!campoAutorNome.value.trim()) {
    campoAutorNome.classList.add('is-invalid');
    const err = document.createElement('div');
    err.className = 'error-message text-danger small mt-1';
    err.textContent = 'Nome é obrigatório.';
    campoAutorNome.parentElement.appendChild(err);
    return;
  }

  const dados = {
    nome:          campoAutorNome.value.trim(),
    nacionalidade: campoAutorNac.value.trim() || null,
  };

  try {
    const url    = editandoAutorId ? `${API_AUTORES_URL}/${editandoAutorId}` : API_AUTORES_URL;
    const method = editandoAutorId ? 'PUT' : 'POST';
    const msg    = editandoAutorId ? 'Autor atualizado com sucesso!' : 'Autor cadastrado com sucesso!';

    const resp = await authFetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formAutor.reset();
      await carregarAutores();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

// ── Editar ───────────────────────────────────────────────────────
function editarAutor(id) {
  const autor = autores.find(a => a.id === id);
  if (!autor) return;

  campoAutorHiddenId.value = autor.id;
  campoAutorNome.value     = autor.nome;
  campoAutorNac.value      = autor.nacionalidade ?? '';
  editandoAutorId          = id;

  document.getElementById('cadastro-autor').scrollIntoView({ behavior: 'smooth' });
  campoAutorNome.focus();
  mostrarMensagem('Editando autor. Modifique os campos e clique em Salvar.', 'info');
}

// ── Excluir ──────────────────────────────────────────────────────
async function excluirAutor(id) {
  const autor = autores.find(a => a.id === id);
  if (!autor) return;
  if (!confirm(`Deseja realmente excluir o autor "${autor.nome}"?`)) return;

  try {
    const resp = await authFetch(`${API_AUTORES_URL}/${id}`, { method: 'DELETE' });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem('Autor excluído com sucesso!', 'success');
      await carregarAutores();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

// ── Reset ────────────────────────────────────────────────────────
function handleResetAutor() {
  editandoAutorId = null;
  campoAutorHiddenId.value = '';
  document.querySelectorAll('#form-autor .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-autor .is-invalid').forEach(el => el.classList.remove('is-invalid'));
}
