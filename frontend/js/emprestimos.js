'use strict';

const API_EMPRESTIMOS = `${API_BASE}/emprestimos`;
const API_LIVROS      = `${API_BASE}/livros`;
const API_USUARIOS    = `${API_BASE}/usuarios`;

let emprestimos = [];
let editandoId = null;

const formEmprestimo   = document.getElementById('form-emprestimo');
const tabelaBody       = document.querySelector('#lista tbody');
const campoId          = document.getElementById('emprestimo-id');
const campoLivroId     = document.getElementById('livro-id');
const campoUsuarioId   = document.getElementById('usuario-id');
const campoDataSaida   = document.getElementById('data-saida');
const campoDataPrevista = document.getElementById('data-prevista');

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([
    carregarEmprestimos(),
    popularSelectLivros(),
    popularSelectUsuarios()
  ]);

  formEmprestimo.addEventListener('submit', handleSubmit);
  formEmprestimo.addEventListener('reset', handleReset);

  const hoje = new Date().toISOString().split('T')[0];
  campoDataSaida.value = hoje;

  [campoLivroId, campoUsuarioId, campoDataSaida, campoDataPrevista].forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('is-invalid');
      const err = this.parentElement.querySelector('.error-message');
      if (err) err.remove();
    });
  });
});

async function popularSelectLivros(selecionarId = null) {
  try {
    const resp = await authFetch(API_LIVROS);
    const json = await resp.json();
    if (json.status !== 'ok') return;

    const valorAtual = selecionarId ?? campoLivroId.value;
    campoLivroId.innerHTML = '<option value="" disabled selected>Selecione</option>';
    
    json.data.forEach(livro => {
      const opt = document.createElement('option');
      opt.value = livro.id;
      opt.textContent = `${livro.titulo} ${livro.disponivel ? '(Disponivel)' : '(Indisponivel)'}`;
      if (!livro.disponivel && !editandoId) opt.disabled = true;
      campoLivroId.appendChild(opt);
    });
    
    if (valorAtual) campoLivroId.value = valorAtual;
  } catch { }
}

async function popularSelectUsuarios(selecionarId = null) {
  try {
    const resp = await authFetch(API_USUARIOS);
    const json = await resp.json();
    if (json.status !== 'ok') return;

    const valorAtual = selecionarId ?? campoUsuarioId.value;
    campoUsuarioId.innerHTML = '<option value="" disabled selected>Selecione</option>';
    
    json.data.forEach(usuario => {
      const opt = document.createElement('option');
      opt.value = usuario.id;
      opt.textContent = `${usuario.nome} (${usuario.email})`;
      campoUsuarioId.appendChild(opt);
    });
    
    if (valorAtual) campoUsuarioId.value = valorAtual;
  } catch { }
}

async function carregarEmprestimos() {
  try {
    const resp = await authFetch(API_EMPRESTIMOS);
    const json = await resp.json();
    if (json.status === 'ok') {
      emprestimos = json.data;
      renderizarLista();
    } else {
      mostrarMensagem('Erro ao carregar emprestimos: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function renderizarLista() {
  tabelaBody.innerHTML = '';

  if (emprestimos.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-muted py-4">
          Nenhum emprestimo cadastrado. Use o formulario abaixo para adicionar.
        </td>
      </tr>`;
    return;
  }

  emprestimos.forEach((emp, index) => {
    const tr = document.createElement('tr');
    
    const devolvido = emp.data_devolucao !== null;
    const statusClass = devolvido ? 'badge-disponivel' : 'badge-indisponivel';
    const statusTexto = devolvido ? 'Devolvido' : 'Em aberto';
    
    const dataSaida = emp.data_saida ? new Date(emp.data_saida + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
    const dataPrevista = emp.data_prevista ? new Date(emp.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR') : '-';
    const dataDevolucao = emp.data_devolucao ? new Date(emp.data_devolucao + 'T00:00:00').toLocaleDateString('pt-BR') : '-';

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(emp.livro_titulo ?? 'N/A')}</td>
      <td>${escapeHtml(emp.usuario_nome ?? 'N/A')}</td>
      <td>${dataSaida}</td>
      <td>${dataPrevista}</td>
      <td>${dataDevolucao}</td>
      <td><span class="badge rounded-pill ${statusClass}">${statusTexto}</span></td>
      <td>
        ${!devolvido ? `<button class="btn-acao btn-editar" data-action="devolver" data-id="${emp.id}">Devolver</button>` : ''}
        <button class="btn-acao btn-editar" data-action="editar" data-id="${emp.id}" ${devolvido ? 'disabled' : ''}>Editar</button>
        <button class="btn-acao btn-excluir" data-action="excluir" data-id="${emp.id}">Excluir</button>
      </td>`;

    tr.querySelectorAll('.btn-acao').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const id = Number(btn.getAttribute('data-id'));
        if (action === 'devolver') devolverLivro(id);
        else if (action === 'editar') editarEmprestimo(id);
        else if (action === 'excluir') excluirEmprestimo(id);
      });
    });
    
    tabelaBody.appendChild(tr);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  if (!validarFormulario()) return;

  const dados = {
    livro_id:      Number(campoLivroId.value),
    usuario_id:    Number(campoUsuarioId.value),
    data_saida:    campoDataSaida.value,
    data_prevista: campoDataPrevista.value,
  };

  try {
    const url    = editandoId ? `${API_EMPRESTIMOS}/${editandoId}` : API_EMPRESTIMOS;
    const method = editandoId ? 'PUT' : 'POST';
    const msg    = editandoId ? 'Emprestimo atualizado com sucesso!' : 'Emprestimo cadastrado com sucesso!';

    const resp = await authFetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formEmprestimo.reset();
      await Promise.all([carregarEmprestimos(), popularSelectLivros()]);
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormulario() {
  const campos = [
    { elemento: campoLivroId,      nome: 'Livro' },
    { elemento: campoUsuarioId,    nome: 'Usuario' },
    { elemento: campoDataSaida,    nome: 'Data de Saida' },
    { elemento: campoDataPrevista, nome: 'Data Prevista' },
  ];

  document.querySelectorAll('#form-emprestimo .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-emprestimo .is-invalid').forEach(el => el.classList.remove('is-invalid'));

  let valido = true;
  for (const campo of campos) {
    if (!campo.elemento.value) {
      campo.elemento.classList.add('is-invalid');
      const err = document.createElement('div');
      err.className = 'error-message text-danger small mt-1';
      err.textContent = `${campo.nome} e obrigatorio.`;
      campo.elemento.parentElement.appendChild(err);
      valido = false;
    }
  }

  if (campoDataSaida.value && campoDataPrevista.value) {
    const dataSaida = new Date(campoDataSaida.value);
    const dataPrevista = new Date(campoDataPrevista.value);
    
    if (dataPrevista < dataSaida) {
      campoDataPrevista.classList.add('is-invalid');
      const err = document.createElement('div');
      err.className = 'error-message text-danger small mt-1';
      err.textContent = 'Data prevista deve ser posterior a data de saida.';
      campoDataPrevista.parentElement.appendChild(err);
      valido = false;
    }
  }

  return valido;
}

async function editarEmprestimo(id) {
  const emp = emprestimos.find(e => e.id === id);
  if (!emp || emp.data_devolucao) return;

  campoId.value          = emp.id;
  campoDataSaida.value   = emp.data_saida;
  campoDataPrevista.value = emp.data_prevista;

  await Promise.all([
    popularSelectLivros(emp.livro_id),
    popularSelectUsuarios(emp.usuario_id)
  ]);

  editandoId = id;
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
  campoLivroId.focus();
  mostrarMensagem('Editando emprestimo. Modifique os campos e clique em Salvar.', 'info');
}

async function devolverLivro(id) {
  const emp = emprestimos.find(e => e.id === id);
  if (!emp) return;
  if (!confirm(`Registrar devolucao do livro "${emp.livro_titulo}"?`)) return;

  try {
    const resp = await authFetch(`${API_EMPRESTIMOS}/${id}/devolver`, {
      method: 'PATCH'
    });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem('Livro devolvido com sucesso!', 'success');
      await Promise.all([carregarEmprestimos(), popularSelectLivros()]);
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

async function excluirEmprestimo(id) {
  const emp = emprestimos.find(e => e.id === id);
  if (!emp) return;
  if (!confirm(`Deseja realmente excluir este emprestimo?`)) return;

  try {
    const resp = await authFetch(`${API_EMPRESTIMOS}/${id}`, { method: 'DELETE' });
    const json = await resp.json();

    if (json.status === 'ok') {
      mostrarMensagem('Emprestimo removido com sucesso.', 'success');
      await Promise.all([carregarEmprestimos(), popularSelectLivros()]);
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
  
  const hoje = new Date().toISOString().split('T')[0];
  campoDataSaida.value = hoje;
  
  document.querySelectorAll('#form-emprestimo .error-message').forEach(el => el.remove());
  document.querySelectorAll('#form-emprestimo .is-invalid').forEach(el => el.classList.remove('is-invalid'));
  
  popularSelectLivros();
  mostrarMensagem('Formulario limpo. Pronto para novo cadastro.', 'info');
}
