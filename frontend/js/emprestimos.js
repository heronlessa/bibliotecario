'use strict';

const API_EMPRESTIMOS = '/emprestimos';
const API_LIVROS      = '/livros';
const API_USUARIOS    = '/usuarios';

let emprestimos = [];
let editandoEmprestimoId = null;

const formEmprestimo   = document.getElementById('form-emprestimo');
const tabelaEmprestimos = document.querySelector('#emprestimos-lista tbody');
const campoEmpId       = document.getElementById('emprestimo-id');
const campoLivroId     = document.getElementById('emprestimo-livro');
const campoUsuarioId   = document.getElementById('emprestimo-usuario');
const campoDataSaida   = document.getElementById('emprestimo-saida');
const campoDataPrevista = document.getElementById('emprestimo-prevista');

document.addEventListener('DOMContentLoaded', async () => {
  if (!exigirAutenticacao()) return;

  await Promise.all([carregarEmprestimos(), popularSelects()]);

  formEmprestimo.addEventListener('submit', handleSubmitEmprestimo);
  formEmprestimo.addEventListener('reset',  handleResetEmprestimo);
  registrarLimpezaErro([campoLivroId, campoUsuarioId, campoDataSaida, campoDataPrevista]);
});

async function popularSelects(livroId = null, usuarioId = null) {
  try {
    const [livrosResp, usuariosResp] = await Promise.all([
      apiFetch(API_LIVROS),
      apiFetch(API_USUARIOS),
    ]);

    if (livrosResp.json.status === 'ok') {
      const valorAtual = livroId ?? campoLivroId.value;
      campoLivroId.innerHTML = '<option value="" disabled selected>Selecione</option>';
      livrosResp.json.data.forEach(livro => {
        const opt = document.createElement('option');
        opt.value = livro.id;
        const disp = livro.disponivel === true || livro.disponivel === 1;
        opt.textContent = `${livro.titulo}${disp ? '' : ' (indisponivel)'}`;
        opt.disabled = !editandoEmprestimoId && !disp;
        campoLivroId.appendChild(opt);
      });
      if (valorAtual) campoLivroId.value = valorAtual;
    }

    if (usuariosResp.json.status === 'ok') {
      const valorAtual = usuarioId ?? campoUsuarioId.value;
      campoUsuarioId.innerHTML = '<option value="" disabled selected>Selecione</option>';
      usuariosResp.json.data.forEach(usuario => {
        const opt = document.createElement('option');
        opt.value = usuario.id;
        opt.textContent = usuario.nome;
        campoUsuarioId.appendChild(opt);
      });
      if (valorAtual) campoUsuarioId.value = valorAtual;
    }
  } catch { /* selects ficam vazios */ }
}

async function carregarEmprestimos() {
  try {
    const { json } = await apiFetch(API_EMPRESTIMOS);
    if (json.status === 'ok') {
      emprestimos = json.data;
      renderizarEmprestimos();
    } else {
      mostrarMensagem('Erro ao carregar emprestimos: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function renderizarEmprestimos() {
  tabelaEmprestimos.innerHTML = '';

  if (emprestimos.length === 0) {
    tabelaEmprestimos.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">Nenhum emprestimo cadastrado.</td>
      </tr>`;
    return;
  }

  emprestimos.forEach((emp, index) => {
    const tr = document.createElement('tr');
    const devolvido = !!emp.data_devolucao;
    const acoesDevolver = devolvido
      ? '<span class="text-muted small">Devolvido</span>'
      : `<button class="btn-acao btn-devolver" data-id="${emp.id}">Devolver</button>`;

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(emp.livro_titulo ?? '-')}</td>
      <td>${escapeHtml(emp.usuario_nome ?? '-')}</td>
      <td>${formatarData(emp.data_saida)}</td>
      <td>${formatarData(emp.data_prevista)}</td>
      <td>${formatarData(emp.data_devolucao)}</td>
      <td>
        <button class="btn-acao btn-editar"  data-id="${emp.id}">Editar</button>
        ${acoesDevolver}
        <button class="btn-acao btn-excluir" data-id="${emp.id}">Excluir</button>
      </td>`;

    tr.querySelector('.btn-editar')?.addEventListener('click', () => editarEmprestimo(emp.id));
    tr.querySelector('.btn-devolver')?.addEventListener('click', () => devolverEmprestimo(emp.id));
    tr.querySelector('.btn-excluir').addEventListener('click', () => excluirEmprestimo(emp.id));
    tabelaEmprestimos.appendChild(tr);
  });
}

async function handleSubmitEmprestimo(e) {
  e.preventDefault();
  if (!validarFormEmprestimo()) return;

  const dados = {
    livro_id:      Number(campoLivroId.value),
    usuario_id:    Number(campoUsuarioId.value),
    data_saida:    campoDataSaida.value,
    data_prevista: campoDataPrevista.value,
  };

  try {
    const path   = editandoEmprestimoId ? `${API_EMPRESTIMOS}/${editandoEmprestimoId}` : API_EMPRESTIMOS;
    const method = editandoEmprestimoId ? 'PUT' : 'POST';
    const msg    = editandoEmprestimoId ? 'Emprestimo atualizado com sucesso!' : 'Emprestimo registrado com sucesso!';

    const { json } = await apiFetch(path, {
      method,
      body: JSON.stringify(dados),
    });

    if (json.status === 'ok') {
      mostrarMensagem(msg, 'success');
      formEmprestimo.reset();
      editandoEmprestimoId = null;
      await Promise.all([carregarEmprestimos(), popularSelects()]);
      if (typeof carregarLivros === 'function') await carregarLivros();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function validarFormEmprestimo() {
  limparErros('#form-emprestimo');
  let valido = true;

  if (!campoLivroId.value) {
    marcarErro(campoLivroId, 'Livro e obrigatorio.');
    valido = false;
  }
  if (!campoUsuarioId.value) {
    marcarErro(campoUsuarioId, 'Usuario e obrigatorio.');
    valido = false;
  }
  if (!campoDataSaida.value) {
    marcarErro(campoDataSaida, 'Data de saida e obrigatoria.');
    valido = false;
  }
  if (!campoDataPrevista.value) {
    marcarErro(campoDataPrevista, 'Data prevista e obrigatoria.');
    valido = false;
  }
  if (campoDataSaida.value && campoDataPrevista.value && campoDataPrevista.value <= campoDataSaida.value) {
    marcarErro(campoDataPrevista, 'Data prevista deve ser posterior a data de saida.');
    valido = false;
  }

  return valido;
}

async function editarEmprestimo(id) {
  const emp = emprestimos.find(e => e.id === id);
  if (!emp) return;

  editandoEmprestimoId = id;
  campoEmpId.value = emp.id;
  await popularSelects(emp.livro_id, emp.usuario_id);
  campoDataSaida.value    = formatarData(emp.data_saida);
  campoDataPrevista.value = formatarData(emp.data_prevista);

  document.getElementById('cadastro-emprestimo').scrollIntoView({ behavior: 'smooth' });
  mostrarMensagem('Editando emprestimo. Modifique os campos e clique em Salvar.', 'info');
}

async function devolverEmprestimo(id) {
  const emp = emprestimos.find(e => e.id === id);
  if (!emp) return;
  if (!confirm(`Registrar devolucao do livro "${emp.livro_titulo}"?`)) return;

  try {
    const { json } = await apiFetch(`${API_EMPRESTIMOS}/${id}/devolver`, { method: 'PATCH' });
    if (json.status === 'ok') {
      mostrarMensagem('Devolucao registrada com sucesso!', 'success');
      await Promise.all([carregarEmprestimos(), popularSelects()]);
      if (typeof carregarLivros === 'function') await carregarLivros();
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
  if (!confirm(`Deseja realmente excluir o emprestimo do livro "${emp.livro_titulo}"?`)) return;

  try {
    const { json } = await apiFetch(`${API_EMPRESTIMOS}/${id}`, { method: 'DELETE' });
    if (json.status === 'ok') {
      mostrarMensagem('Emprestimo excluido com sucesso!', 'success');
      await carregarEmprestimos();
    } else {
      mostrarMensagem('Erro: ' + json.mensagem, 'danger');
    }
  } catch {
    mostrarMensagem('Falha ao conectar com a API.', 'danger');
  }
}

function handleResetEmprestimo() {
  editandoEmprestimoId = null;
  campoEmpId.value = '';
  limparErros('#form-emprestimo');
  popularSelects();
}
