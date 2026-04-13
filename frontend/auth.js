import { getClients } from './admin.js';

let currentUser = null;

export function checkAuth() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        return currentUser;
    }
    return null;
}

export function login(username, password) {
    // Admin check
    if (username === 'X4GROWTH' && password === '@2025x4GROWTH') {
        currentUser = { username: 'X4GROWTH', isAdmin: true };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return currentUser;
    }

    // Check clients from admin module
    const clients = getClients();
    const client = clients.find(c => c.name === username && c.password === password);

    if (client) {
        currentUser = { username: client.name, isAdmin: false, clientId: client.id };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        return currentUser;
    }

    return null;
}

export function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
}

export function getUser() {
    return currentUser;
}