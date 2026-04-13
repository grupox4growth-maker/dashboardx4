// ═══════════════════════════════════════════════
// admin.js — Gerenciamento de clientes e contas
// ═══════════════════════════════════════════════

const DEFAULT_CLIENTS = [
  { id: 1, name: "POPDENTS",     password: "POP@2025",    sheetsUrl: "" },
  { id: 2, name: "SELLETO",      password: "@SELLETO2026", sheetsUrl: "" },
];

const DEFAULT_ACCOUNTS = [
  // POPDENTS
  { id: 1, clientId: 1, name: "FORTALEZA",        accountId: "act_1163342075039039" },
  { id: 2, clientId: 1, name: "INTERIOR CEARÁ",   accountId: "act_1855895228554990" },
  { id: 3, clientId: 1, name: "POP - BELÉM",      accountId: "act_1746453236304218" },
  { id: 4, clientId: 1, name: "POP - INTERIOR PARÁ", accountId: "act_613787471423916" },
  { id: 5, clientId: 1, name: "POP - ESTADOS",    accountId: "act_1167056531494491" },
  // SELLETO ODONTO
  { id: 6, clientId: 2, name: "SELLETO PRINCIPAL", accountId: "act_559830453408809" },
];

const DEFAULT_API_KEY = "EAAS6y59i6xgBQ3FLPU7l6DpCbGvMrKZATeEBfvwe7ZCx8JAhZBFpQJzIMQOXrk8WgcBxaZB4ZAssgLxijXbdGJHQiAGa4tH9iZBQBStu75YDdNIhDKUe8f8XP9kPmCJv52WouLORTwchZCwtgjTTP80Kr7Dkv55YAiQ9SssF3V4i6ou1fxyiDhGLPPbto6v";

// ── Inicializa localStorage com defaults se vazio ──
function initStorage() {
  if (!localStorage.getItem('x4_clients')) {
    localStorage.setItem('x4_clients', JSON.stringify(DEFAULT_CLIENTS));
  }
  if (!localStorage.getItem('x4_accounts')) {
    localStorage.setItem('x4_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
  }
  if (!localStorage.getItem('x4_apikey')) {
    localStorage.setItem('x4_apikey', DEFAULT_API_KEY);
  }
}
initStorage();

// ── Load from storage ──
function loadClients()  { return JSON.parse(localStorage.getItem('x4_clients')  || '[]'); }
function loadAccounts() { return JSON.parse(localStorage.getItem('x4_accounts') || '[]'); }

function saveClients(c)  { localStorage.setItem('x4_clients',  JSON.stringify(c)); }
function saveAccounts(a) { localStorage.setItem('x4_accounts', JSON.stringify(a)); }

// ── CLIENT CRUD ──
export function getClients() { return loadClients(); }

export function createClient(client) {
  const clients = loadClients();
  client.id = clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1;
  clients.push(client);
  saveClients(clients);
  return [...clients];
}

export function updateClient(id, data) {
  const clients = loadClients();
  const i = clients.findIndex(c => c.id === id);
  if (i !== -1) { clients[i] = { ...clients[i], ...data }; saveClients(clients); }
  return [...clients];
}

export function deleteClient(id) {
  const clients = loadClients().filter(c => c.id !== id);
  saveClients(clients);
  return [...clients];
}

// ── ACCOUNT CRUD ──
export function getAccounts(clientId = null) {
  const accounts = loadAccounts();
  return clientId === null ? [...accounts] : accounts.filter(a => a.clientId === clientId);
}

export function createAccount(account) {
  const accounts = loadAccounts();
  account.id = accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
  accounts.push(account);
  saveAccounts(accounts);
  return [...accounts];
}

export function updateAccount(id, data) {
  const accounts = loadAccounts();
  const i = accounts.findIndex(a => a.id === id);
  if (i !== -1) { accounts[i] = { ...accounts[i], ...data }; saveAccounts(accounts); }
  return [...accounts];
}

export function deleteAccount(id) {
  const accounts = loadAccounts().filter(a => a.id !== id);
  saveAccounts(accounts);
  return [...accounts];
}

// ── API KEY ──
export function getApiKey()      { return localStorage.getItem('x4_apikey') || DEFAULT_API_KEY; }
export function setApiKey(key)   { localStorage.setItem('x4_apikey', key); return key; }
