let livros = [];
let editandoId = null;

// ── Elementos do DOM ─────────────────────────────────────────────
const formLivro = document.getElementById('form-livro');
const tabelaBody = document.querySelector('#lista tbody');
const campoId = document.getElementById('livro-id');
const campoTitulo = document.getElementById('titulo');
const campoAutor = document.getElementById('autor');
const campoISBN = document.getElementById('isbn');
const campoAno = document.getElementById('ano');
const campoDisponivel = document.getElementById('disponivel');

// ── Inicialização ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  renderizarLista();
  
  // Event Listeners
  formLivro.addEventListener('submit', handleSubmit);
  formLivro.addEventListener('reset', handleReset);
});

// ── Carregar dados do localStorage ──────────────────────────────
function carregarDados() {
  const dadosSalvos = localStorage.getItem('bibliotecario_livros');
  
  if (dadosSalvos) {
    livros = JSON.parse(dadosSalvos);
  } else {
    livros = [
      {
        id: 1,
        titulo: 'Dom Casmurro',
        autor: 'Machado de Assis',
        isbn: '978-85-359-0277-5',
        ano: 1899,
        disponivel: true
      },
      {
        id: 2,
        titulo: 'O Senhor dos Anéis',
        autor: 'J.R.R. Tolkien',
        isbn: '978-85-333-0235-9',
        ano: 1954,
        disponivel: false
      },
      {
        id: 3,
        titulo: 'Clean Code',
        autor: 'Robert C. Martin',
        isbn: '978-85-7608-539-2',
        ano: 2008,
        disponivel: true
      }
    ];
    salvarDados();
  }
}

// ── Salvar dados no localStorage ────────────────────────────────
function salvarDados() {
  localStorage.setItem('bibliotecario_livros', JSON.stringify(livros));
}

// ── Renderizar lista de livros ──────────────────────────────────
function renderizarLista() {
  tabelaBody.innerHTML = '';
  
  if (livros.length === 0) {
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted py-4">
          Nenhum livro cadastrado. Use o formulário abaixo para adicionar.
        </td>
      </tr>
    `;
    return;
  }
  
  // Renderizar cada livro
  livros.forEach((livro, index) => {
    const tr = document.createElement('tr');
    
    const badgeClass = livro.disponivel ? 'badge-disponivel' : 'badge-indisponivel';
    const disponivelTexto = livro.disponivel ? 'Sim' : 'Não';
    
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${livro.titulo}</td>
      <td>${livro.autor}</td>
      <td>${livro.isbn}</td>
      <td>${livro.ano}</td>
      <td><span class="badge rounded-pill ${badgeClass}">${disponivelTexto}</span></td>
      <td>
        <button class="btn-acao btn-editar" onclick="editarLivro(${livro.id})">Editar</button>
        <button class="btn-acao btn-excluir" onclick="excluirLivro(${livro.id})">Excluir</button>
      </td>
    `;
    
    tabelaBody.appendChild(tr);
  });
}

// ── Handler do submit do formulário ─────────────────────────────
function handleSubmit(e) {
  e.preventDefault();
  if (!validarFormulario()) {
    return;
  }

  const dadosLivro = {
    titulo: campoTitulo.value.trim(),
    autor: campoAutor.value.trim(),
    isbn: campoISBN.value.trim(),
    ano: parseInt(campoAno.value),
    disponivel: campoDisponivel.value === '1'
  };
  
  if (editandoId) {
    atualizarLivro(editandoId, dadosLivro);
  } else {
    adicionarLivro(dadosLivro);
  }
  
  formLivro.reset();
  renderizarLista();
  
  mostrarMensagem(editandoId ? 'Livro atualizado com sucesso!' : 'Livro cadastrado com sucesso!', 'success');
}

// ── Validar formulário ──────────────────────────────────────────
function validarFormulario() {
  const campos = [
    { elemento: campoTitulo, nome: 'Título' },
    { elemento: campoAutor, nome: 'Autor' },
    { elemento: campoISBN, nome: 'ISBN' },
    { elemento: campoAno, nome: 'Ano' },
    { elemento: campoDisponivel, nome: 'Disponível' }
  ];
  
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  
  let valido = true;
  
  for (const campo of campos) {
    if (!campo.elemento.value.trim()) {
      campo.elemento.classList.add('is-invalid');
      
      const errorMsg = document.createElement('div');
      errorMsg.className = 'error-message text-danger small mt-1';
      errorMsg.textContent = `${campo.nome} é obrigatório.`;
      campo.elemento.parentElement.appendChild(errorMsg);
      
      valido = false;
    }
  }
  
  const ano = parseInt(campoAno.value);
  if (campoAno.value && (ano < 1000 || ano > 2099)) {
    campoAno.classList.add('is-invalid');
    const errorMsg = document.createElement('div');
    errorMsg.className = 'error-message text-danger small mt-1';
    errorMsg.textContent = 'Ano deve estar entre 1000 e 2099.';
    campoAno.parentElement.appendChild(errorMsg);
    valido = false;
  }
  
  return valido;
}

// ── Adicionar novo livro ────────────────────────────────────────
function adicionarLivro(dadosLivro) {
  const novoLivro = {
    id: Date.now(),
    ...dadosLivro
  };
  
  livros.push(novoLivro);
  salvarDados();
}

// ── Atualizar livro existente ───────────────────────────────────
function atualizarLivro(id, dadosLivro) {
  const index = livros.findIndex(livro => livro.id === id);
  
  if (index !== -1) {
    livros[index] = {
      id: id,
      ...dadosLivro
    };
    salvarDados();
  }
}

// ── Editar livro ────────────────────────────────────────────────
function editarLivro(id) {
  const livro = livros.find(l => l.id === id);
  
  if (!livro) return;
  
  // Preencher formulário
  campoId.value = livro.id;
  campoTitulo.value = livro.titulo;
  campoAutor.value = livro.autor;
  campoISBN.value = livro.isbn;
  campoAno.value = livro.ano;
  campoDisponivel.value = livro.disponivel ? '1' : '0';
  
  editandoId = id;
  
  document.getElementById('cadastro').scrollIntoView({ behavior: 'smooth' });
  campoTitulo.focus();
    mostrarMensagem('Editando livro. Modifique os campos e clique em Salvar.', 'info');
}

// ── Excluir livro ───────────────────────────────────────────────
function excluirLivro(id) {
  const livro = livros.find(l => l.id === id);
  
  if (!livro) return;
  
  if (!confirm(`Deseja realmente excluir o livro "${livro.titulo}"?`)) {
    return;
  }
  
  livros = livros.filter(l => l.id !== id);
  salvarDados();
  renderizarLista();
  
  mostrarMensagem('Livro excluído com sucesso!', 'danger');
}

// ── Handler do reset do formulário ──────────────────────────────
function handleReset() {
  editandoId = null;
  campoId.value = '';
  
  document.querySelectorAll('.error-message').forEach(el => el.remove());
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// ── Mostrar mensagem de feedback ────────────────────────────────
function mostrarMensagem(texto, tipo = 'success') {
  const mensagemAnterior = document.getElementById('feedback-message');
  if (mensagemAnterior) {
    mensagemAnterior.remove();
  }
  
  const mensagem = document.createElement('div');
  mensagem.id = 'feedback-message';
  mensagem.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  mensagem.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  mensagem.innerHTML = `
    ${texto}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(mensagem);
  
  setTimeout(() => {
    mensagem.remove();
  }, 5000);
}

// ── Remover classes de validação ao digitar ─────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const inputs = [campoTitulo, campoAutor, campoISBN, campoAno, campoDisponivel];
  
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      this.classList.remove('is-invalid');
      const errorMsg = this.parentElement.querySelector('.error-message');
      if (errorMsg) {
        errorMsg.remove();
      }
    });
  });
});
