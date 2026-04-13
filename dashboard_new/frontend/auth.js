// ═══════════════════════════════════════════════
// auth.js — Autenticação
// ═══════════════════════════════════════════════
import { getClients } from './admin.js';

const ADMIN_USER = 'X4GROWTH';
const ADMIN_PASS = '@2026x4GROWTH'; // Senha atualizada

let currentUser = null;

export function checkAuth() {
  const stored = localStorage.getItem('x4_current_user');
  if (stored) { currentUser = JSON.parse(stored); return currentUser; }
  return null;
}

export function login(username, password) {
  // Admin
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    currentUser = { username: ADMIN_USER, isAdmin: true };
    localStorage.setItem('x4_current_user', JSON.stringify(currentUser));
    return currentUser;
  }
  // Clients
  const clients = getClients();
  const client = clients.find(c => c.name === username && c.password === password);
  if (client) {
    currentUser = { username: client.name, isAdmin: false, clientId: client.id, sheetsUrl: client.sheetsUrl || '' };
    localStorage.setItem('x4_current_user', JSON.stringify(currentUser));
    return currentUser;
  }
  return null;
}

export function logout() {
  currentUser = null;
  localStorage.removeItem('x4_current_user');
}

export function getUser() { return currentUser; }
