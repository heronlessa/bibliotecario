'use strict';

const API_AUTORES = '/autores';

let autores = [];
let editandoAutorId = null;

const formAutor          = document.getElementById('form-autor');
const tabelaAutores      = document.querySelector('#autores-lista tbody');
const campoAutorHiddenId = document.getElementById('autor-form-id');
const campoAutorNome     = document.getElementById('autor-nome');
const campoAutorNac      = document.getElementById('autor-nacionalidade');

document.addEventListener('DOMContentLoaded', async () => {
  if (!exigirAutenticacao()) return;

  await carregarAutores();

  formAutor.addEventListener('submit', handleSubmitAutor);
  formAutor.addEventListener('reset',  handleResetAutor);
  registrarLimpezaErro([campoAutorNome, campoAutorNac]);
});

async function carregarAutores() {
  try {
    const { json } = await apiFetch(API_AUTORES);
    if (json.status === 'ok') {
      autores = json.data;
      renderizarAutores();
      if (typeof popularSelectAutores === 'function') popularSelectAutores();
    }
  } catch {
    mostrarMensagem('Falha ao carregar autores.', 'danger');
  }
}

function renderizarAutores() {
  tabelaAutores.innerHTML = '';

  if (autores.length === 0) {
    tabelaAutores.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">Nenhum autor cadastrado.</td>
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

async function handleSubmitAutor(e) {
  e.preventDefault();
  limparErros('#form-autor');

  if (!campoAutorNome.value.trim()) {
    marcarErro(campoAutorNome, 'Nome e obrigatorio.');
    return;
  }

  const dados = {
    nome:          campoAutorNome.value.trim(),
    nacionalidade: campoAutorNac.value.trim() || null,
  };

  try {
    const path   = editandoAutorId ? `${API_AUTORES}/${editandoAutorId}` : API_AUTORES;
    const method = editandoAutorId ? 'PUT' : 'POST';
    const msg    = editandoAutorId ? 'Autor atualizado com sucesso!' : 'Autor cadastrado com sucesso!';

    const { json } = await apiFetch(path, {
      method,
      body: JSON.stringify(dados),
    });

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formAutor.reset();
      editandoAutorId = null;
      await carregarAutores();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

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

async function excluirAutor(id) {
  const autor = autores.find(a => a.id === id);
  if (!autor) return;
  if (!confirm(`Deseja realmente excluir o autor "${autor.nome}"?`)) return;

  try {
    const { json } = await apiFetch(`${API_AUTORES}/${id}`, { method: 'DELETE' });
    if (json.status === 'ok') {
      mostrarMensagem('Autor excluido com sucesso!', 'success');
      await carregarAutores();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function handleResetAutor() {
  editandoAutorId = null;
  campoAutorHiddenId.value = '';
  limparErros('#form-autor');
}
