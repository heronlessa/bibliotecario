'use strict';

// â”€â”€ ConfiguraÃ§Ã£o da API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// API_BASE Ã© definido em index.html (compartilhado com os outros mÃ³dulos)
const API_LIVROS  = `${API_BASE}/livros`;
const API_AUTORES = `${API_BASE}/autores`;

let livros = [];
let editandoId = null;

// â”€â”€ Elementos do DOM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const formLivro       = document.getElementById('form-livro');
const tabelaBody      = document.querySelector('#lista tbody');
const campoId         = document.getElementById('livro-id');
const campoTitulo     = document.getElementById('titulo');
const campoAutorId    = document.getElementById('autor-id');
const campoISBN       = document.getElementById('isbn');
const campoAno        = document.getElementById('ano');
const campoDisponivel = document.getElementById('disponivel');

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([carregarLivros(), popularSelectAutores()]);

  formLivro.addEventListener('submit', handleSubmit);
  formLivro.addEventListener('reset', handleReset);

  [campoTitulo, campoAutorId, campoISBN, campoAno, campoDisponivel].forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('is-invalid');
      const err = this.parentElement.querySelector('.error-message');
      if (err) err.remove();
    });
  });
});

async function popularSelectAutores(selecionarId = null) {
  try {
    const resp = await fetch(API_AUTORES);
    const json = await resp.json();
    if (json.status !== 'ok') return;

    const valorAtual = selecionarId ?? campoAutorId.value;
    campoAutorId.innerHTML = '<option value="" disabled selected>Selecione</option>';
    json.data.forEach(autor => {
      const opt = document.createElement('option');
      opt.value = autor.id;
      opt.textContent = autor.nome;
      campoAutorId.appendChild(opt);
    });
    if (valorAtual) campoAutorId.value = valorAtual;
  } catch { /* silencia â€” select fica vazio */ }
}

async function carregarLivros() {
  try {
    const resp = await fetch(API_LIVROS);
    const json = await resp.json();
    if (json.status === 'ok') {
      livros = json.data;
      renderizarLista();
    } else {
      mostrarMensagem('Erro ao carregar livros: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API. Verifique se o servidor estÃ¡ rodando na porta 3000.', 'danger');
  }
}

function renderizarLista() {
  tabelaBody.innerHTML = '';

  if (livros.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          Nenhum livro cadastrado. Use o formulÃ¡rio abaixo para adicionar.
        </td>
      </tr>`;
    return;
  }

  livros.forEach((livro, index) => {
    const tr = document.createElement('tr');
    const badgeClass      = livro.disponivel ? 'badge-disponivel' : 'badge-indisponivel';
    const disponivelTexto = livro.disponivel ? 'Sim' : 'NÃ£o';

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(livro.titulo)}</td>
      <td>${escapeHtml(livro.autor_nome ?? '-')}</td>
      <td>${escapeHtml(livro.isbn ?? '-')}</td>
      <td>${livro.ano ?? '-'}</td>
      <td><span class="badge rounded-pill ${badgeClass}">${disponivelTexto}</span></td>
      <td>
        <button class="btn-acao btn-editar"  data-id="${livro.id}">Editar</button>
        <button class="btn-acao btn-excluir" data-id="${livro.id}">Excluir</button>
      </td>`;

    tr.querySelector('.btn-editar').addEventListener('click',  () => editarLivro(livro.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => excluirLivro(livro.id));
    tabelaBody.appendChild(tr);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validarFormulario()) return;

  const dados = {
    titulo:     campoTitulo.value.trim(),
    autor_id:   Number(campoAutorId.value),
    isbn:       campoISBN.value.trim() || null,
    ano:        campoAno.value ? Number(campoAno.value) : null,
    disponivel: Number(campoDisponivel.value),
  };

  try {
    const url = editandoId ? `${API_LIVROS}?id=${editandoId}` : API_LIVROS;
    const msg = editandoId ? 'Livro atualizado com sucesso!' : 'Livro cadastrado com sucesso!';

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formLivro.reset();
      await carregarLivros();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormulario() {
  const campos = [
    { elemento: campoTitulo,     nome: 'TÃ­tulo' },
    { elemento: campoAutorId,    nome: 'Autor' },
    { elemento: campoDisponivel, nome: 'DisponÃ­vel' },
  ];

  document.querySelectorAll('#form-livro .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-livro .is-invalid').forEach(el => el.classList.remove('is-invalid'));

  let valido = true;
  for (const campo of campos) {
    if (!campo.elemento.value) {
      campo.elemento.classList.add('is-invalid');
      const err = document.createElement('div');
      err.className = 'error-message text-danger small mt-1';
      err.textContent = `${campo.nome} Ã© obrigatÃ³rio.`;
      campo.elemento.parentElement.appendChild(err);
      valido = false;
    }
  }

  const ano = Number(campoAno.value);
  if (campoAno.value && (ano < 1000 || ano > 2099)) {
    campoAno.classList.add('is-invalid');
    const err = document.createElement('div');
    err.className = 'error-message text-danger small mt-1';
    err.textContent = 'Ano deve estar entre 1000 e 2099.';
    campoAno.parentElement.appendChild(err);
    valido = false;
  }

  return valido;
}

async function editarLivro(id) {
  const livro = livros.find(l => l.id === id);
  if (!livro) return;

  campoId.value         = livro.id;
  campoTitulo.value     = livro.titulo;
  campoISBN.value       = livro.isbn ?? '';
  campoAno.value        = livro.ano ?? '';
  campoDisponivel.value = livro.disponivel ? '1' : '0';

  await popularSelectAutores(livro.autor_id);

  editandoId = id;
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
  campoTitulo.focus();
  mostrarMensagem('Editando livro. Modifique os campos e clique em Salvar.', 'info');
}

async function excluirLivro(id) {
  const livro = livros.find(l => l.id === id);
  if (!livro) return;
  if (!confirm(`Deseja realmente excluir o livro "${livro.titulo}"?`)) return;

  try {
    const resp = await fetch(`${API_LIVROS}?id=${id}&acao=excluir`);
    const json = await resp.json();
    if (json.status === 'ok') {
      mostrarMensagem('Livro excluÃ­do com sucesso!', 'success');
      await carregarLivros();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function handleReset() {
  editandoId = null;
  campoId.value = '';
  document.querySelectorAll('#form-livro .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-livro .is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function mostrarMensagem(texto, tipo = 'success') {
  const anterior = document.getElementById('feedback-message');
  if (anterior) anterior.remove();

  const msg = document.createElement('div');
  msg.id = 'feedback-message';
  msg.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  msg.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  msg.innerHTML = `
    ${escapeHtml(texto)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;

  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 5000);
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}

