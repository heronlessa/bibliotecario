'use strict';

function mostrarMensagem(texto, tipo = 'success') {
  const anterior = document.getElementById('feedback-message');
  if (anterior) anterior.remove();

  const msg = document.createElement('div');
  msg.id = 'feedback-message';
  msg.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  msg.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  msg.innerHTML = `
    ${escapeHtml(texto)}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>`;

  document.body.appendChild(msg);
  setTimeout(() => msg.remove(), 5000);
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}

function limparErros(seletor) {
  document.querySelectorAll(`${seletor} .error-message`).forEach(el => el.remove());
  document.querySelectorAll(`${seletor} .is-invalid`).forEach(el => el.classList.remove('is-invalid'));
}

function marcarErro(el, texto) {
  el.classList.add('is-invalid');
  const err = document.createElement('div');
  err.className = 'error-message text-danger small mt-1';
  err.textContent = texto;
  el.parentElement.appendChild(err);
}

function registrarLimpezaErro(inputs) {
  inputs.forEach(input => {
    input.addEventListener('input', function () {
      this.classList.remove('is-invalid');
      const err = this.parentElement.querySelector('.error-message');
      if (err) err.remove();
    });
  });
}

function formatarData(valor) {
  if (!valor) return '-';
  return String(valor).slice(0, 10);
}
