'use strict';

function resolverApiBase() {
  const { protocol, hostname, port } = window.location;
  if (port === '3000' || port === '') return '/api';
  return `${protocol}//${hostname}:3000/api`;
}

const API_BASE = resolverApiBase();
const STORAGE_TOKEN   = 'bibliotecario_token';
const STORAGE_USUARIO = 'bibliotecario_usuario';

function getToken() {
  return localStorage.getItem(STORAGE_TOKEN);
}

function getUsuario() {
  try {
    const dados = localStorage.getItem(STORAGE_USUARIO);
    return dados ? JSON.parse(dados) : null;
  } catch {
    return null;
  }
}

function isAuthenticated() {
  return !!getToken();
}

function salvarSessao(token, usuario) {
  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USUARIO, JSON.stringify(usuario));
}

function limparSessao() {
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USUARIO);
}

async function apiFetch(path, options = {}, config = { redirectOn401: true }) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

  let json;
  try {
    json = await resp.json();
  } catch {
    json = {
      status: 'erro',
      mensagem: 'Resposta invalida do servidor. Verifique se o backend esta rodando em http://localhost:3000',
      data: null,
    };
  }

  if (resp.status === 401 && config.redirectOn401 && !path.startsWith('/auth/login')) {
    limparSessao();
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = '/login.html';
    }
  }

  return { resp, json };
}

async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' }, { redirectOn401: false });
  } catch { /* logout stateless */ }
  limparSessao();
  window.location.href = '/login.html';
}

function exigirAutenticacao() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
