'use strict';

const API_LIVROS  = '/livros';
const API_AUTORES = '/autores';

let livros = [];
let editandoId = null;

const formLivro       = document.getElementById('form-livro');
const tabelaBody      = document.querySelector('#lista tbody');
const campoId         = document.getElementById('livro-id');
const campoTitulo     = document.getElementById('titulo');
const campoAutorId    = document.getElementById('autor-id');
const campoISBN       = document.getElementById('isbn');
const campoAno        = document.getElementById('ano');
const campoDisponivel = document.getElementById('disponivel');

document.addEventListener('DOMContentLoaded', async () => {
  if (!exigirAutenticacao()) return;

  await Promise.all([carregarLivros(), popularSelectAutores()]);

  formLivro.addEventListener('submit', handleSubmit);
  formLivro.addEventListener('reset', handleReset);
  registrarLimpezaErro([campoTitulo, campoAutorId, campoISBN, campoAno, campoDisponivel]);
});

async function popularSelectAutores(selecionarId = null) {
  try {
    const { json } = await apiFetch(API_AUTORES);
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
  } catch { /* select fica vazio */ }
}

async function carregarLivros() {
  try {
    const { json } = await apiFetch(API_LIVROS);
    if (json.status === 'ok') {
      livros = json.data;
      renderizarLista();
    } else {
      mostrarMensagem('Erro ao carregar livros: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function renderizarLista() {
  tabelaBody.innerHTML = '';

  if (livros.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          Nenhum livro cadastrado. Use o formulario abaixo para adicionar.
        </td>
      </tr>`;
    return;
  }

  livros.forEach((livro, index) => {
    const tr = document.createElement('tr');
    const disponivel = livro.disponivel === true || livro.disponivel === 1;
    const badgeClass = disponivel ? 'badge-sim' : 'badge-nao';
    const disponivelTexto = disponivel ? 'Sim' : 'Nao';

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(livro.titulo)}</td>
      <td>${escapeHtml(livro.autor_nome ?? '-')}</td>
      <td>${escapeHtml(livro.isbn ?? '-')}</td>
      <td>${livro.ano ?? '-'}</td>
      <td><span class="${badgeClass}">${disponivelTexto}</span></td>
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
    const path    = editandoId ? `${API_LIVROS}/${editandoId}` : API_LIVROS;
    const method  = editandoId ? 'PUT' : 'POST';
    const msg     = editandoId ? 'Livro atualizado com sucesso!' : 'Livro cadastrado com sucesso!';

    const { json } = await apiFetch(path, {
      method,
      body: JSON.stringify(dados),
    });

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formLivro.reset();
      editandoId = null;
      await carregarLivros();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormulario() {
  limparErros('#form-livro');
  let valido = true;

  const campos = [
    { elemento: campoTitulo,     nome: 'Titulo' },
    { elemento: campoAutorId,    nome: 'Autor' },
    { elemento: campoDisponivel, nome: 'Disponivel' },
  ];

  for (const campo of campos) {
    if (!campo.elemento.value) {
      marcarErro(campo.elemento, `${campo.nome} e obrigatorio.`);
      valido = false;
    }
  }

  const ano = Number(campoAno.value);
  if (campoAno.value && (ano < 1000 || ano > 2099)) {
    marcarErro(campoAno, 'Ano deve estar entre 1000 e 2099.');
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
  campoDisponivel.value = (livro.disponivel === true || livro.disponivel === 1) ? '1' : '0';

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
    const { json } = await apiFetch(`${API_LIVROS}/${id}`, { method: 'DELETE' });
    if (json.status === 'ok') {
      mostrarMensagem('Livro excluido com sucesso!', 'success');
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
  limparErros('#form-livro');
}
