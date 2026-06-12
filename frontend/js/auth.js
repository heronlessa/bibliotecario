// === AUTH HELPERS ===
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function saveUser(usuario) {
  try {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  } catch {}
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null');
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
}

// === AUTH FETCH ===
async function authFetch(url, options = {}) {
  options.headers = options.headers || {};
  const token = getToken();
  
  if (token) {
    options.headers['Authorization'] = 'Bearer ' + token;
  } else {
    window.location.href = '/frontend/login.html';
    return Promise.reject('Nao autenticado');
  }
  
  const response = await fetch(url, options);

  if (response.status === 401) {
    clearAuth();
    window.location.href = '/frontend/login.html';
    return Promise.reject('Sessao expirada');
  }
  
  return response;
}

// === SHOW USER UI ===
function showUserUI() {
  const user = getUser();
  const userNameEl = document.getElementById('user-name');
  
  if (user && userNameEl) {
    userNameEl.textContent = user.nome || user.email || '';
  }
}

// === LOGOUT ===
async function handleLogout() {
  try {
    await authFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch {}
  clearAuth();
  window.location.href = '/frontend/login.html';
}

// === INIT AUTH CHECK ===
function initAuthCheck() {
  if (!getToken()) {
    window.location.href = '/frontend/login.html';
    return false;
  }
  return true;
}

// === MENSAGEM DE FEEDBACK ===
function mostrarMensagem(texto, tipo = 'success') {
  const anterior = document.getElementById('feedback-message');
  if (anterior) anterior.remove();

  const msg = document.createElement('div');
  msg.id = 'feedback-message';
  msg.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
  msg.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
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

// === INIT ON LOAD ===
document.addEventListener('DOMContentLoaded', function() {
  if (initAuthCheck()) {
    showUserUI();
    
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
  }
});
