// Admin functions and data
// Sample data loaded once
let clients = JSON.parse(localStorage.getItem('clients')) || [
    { id: 1, name: "POPDENTS", password: "POP@2025" }
];

let accounts = JSON.parse(localStorage.getItem('accounts')) || [
    { id: 1, clientId: 1, name: "FORTALEZA", accountId: "act_1163342075039039" },
    { id: 2, clientId: 1, name: "INTERIOR CEARÁ", accountId: "act_1855895228554990" },
    { id: 3, clientId: 1, name: "POP - BELÉM", accountId: "act_1746453236304218" },
    { id: 4, clientId: 1, name: "POP - INTERIOR PARÁ", accountId: "act_613787471423916" },
    { id: 5, clientId: 1, name: "POP - ESTADOS", accountId: "act_1167056531494491" }
];

// Note: This application is running in a browser environment and cannot directly connect to the Facebook Ads API
// due to CORS restrictions and the need for server-side authentication.
// The API key is stored here for demonstration purposes but is NOT used for actual API calls in this mock implementation.
// In a real-world application, you would need a backend server to handle API requests securely using the key.
let apiKey = localStorage.getItem('facebookApiKey') || "EAAJaMYfkzOoBO0WxpmpmfnldCndzWhYoyrWpC0OIdIdloL9b4Nzz15gIVh3pzhohoQRmjwxaV93DeGtSZBnctw7heeheheZBPza6IjwpQ92ZCAj8MBUhCMmemXQQQuZA5ZBir4kDBGp2wOW8CUYbxarjVsVs1My2jJBT7QR3fwbAa4VBZZAFHAHAMQqnySSSSjkuIWZAEPZAzasI8O";

function saveClients() {
    localStorage.setItem('clients', JSON.stringify(clients));
}

function saveAccounts() {
    localStorage.setItem('accounts', JSON.stringify(accounts));
}

function saveApiKey() {
    // This key is for demonstration only and not used by the mock API functions.
    localStorage.setItem('facebookApiKey', apiKey);
}

export function getClients() {
    return [...clients]; // Return a copy
}

export function createClient(client) {
    client.id = clients.length ? Math.max(...clients.map(c => c.id)) + 1 : 1;
    clients.push(client);
    saveClients();
    return [...clients];
}

export function updateClient(id, updatedClient) {
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
        clients[index] = { ...clients[index], ...updatedClient };
        saveClients();
    }
    return [...clients];
}

export function deleteClient(id) {
    const initialLength = clients.length;
    clients = clients.filter(c => c.id !== id);
    if (clients.length < initialLength) {
        saveClients();
    }
    return [...clients];
}

export function getAccounts(clientId = null) {
    if (clientId === null) {
        return [...accounts];
    }
    return accounts.filter(a => a.clientId === clientId);
}

export function createAccount(account) {
    account.id = accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1;
    accounts.push(account);
    saveAccounts();
    return [...accounts];
}

export function updateAccount(id, updatedAccount) {
    const index = accounts.findIndex(a => a.id === id);
    if (index !== -1) {
        accounts[index] = { ...accounts[index], ...updatedAccount };
        saveAccounts();
    }
    return [...accounts];
}

export function deleteAccount(id) {
    const initialLength = accounts.length;
    accounts = accounts.filter(a => a.id !== id);
    if (accounts.length < initialLength) {
        saveAccounts();
    }
    return [...accounts];
}

export function getApiKey() {
    return apiKey;
}

export function setApiKey(newKey) {
    apiKey = newKey;
    saveApiKey();
    return apiKey;
}