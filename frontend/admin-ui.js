// Handles UI elements and rendering within the admin panel modal and their interactions

import { elements } from './dom.js';
import { getClients, getAccounts, getApiKey } from './admin.js';

// Render clients table in admin panel
export function renderClientsTable() {
    elements.clientsTableBody.innerHTML = '';
    const clients = getClients(); // Fetch clients from admin module
    clients.forEach(client => {
        const row = document.createElement('tr');
        // Use data attributes for edit/delete IDs
        row.innerHTML = `
            <td>${client.name}</td>
            <td>${client.password}</td>
            <td>
                <button class="edit-client-btn" data-id="${client.id}" style="padding: 5px 10px; margin-right: 5px;">Editar</button>
                <button class="delete-client-btn" data-id="${client.id}" style="padding: 5px 10px;">Excluir</button>
            </td>
        `;
        elements.clientsTableBody.appendChild(row);
    });
}

// Render accounts table in admin panel
export function renderAccountsTable() {
    elements.accountsTableBody.innerHTML = '';
    const accounts = getAccounts(); // Fetch accounts from admin module
    const clients = getClients(); // Fetch clients to map clientId to name

    accounts.forEach(account => {
        const client = clients.find(c => c.id === account.clientId);
        const row = document.createElement('tr');
        // Use data attributes for edit/delete IDs
        row.innerHTML = `
            <td>${client ? client.name : 'Cliente Excluído'}</td>
            <td>${account.name}</td>
            <td>${account.accountId}</td>
            <td>
                <button class="edit-account-btn" data-id="${account.id}" style="padding: 5px 10px; margin-right: 5px;">Editar</button>
                <button class="delete-account-btn" data-id="${account.id}" style="padding: 5px 10px;">Excluir</button>
            </td>
        `;
        elements.accountsTableBody.appendChild(row);
    });
}

// Populate client selects in admin panel modals and filters
export function populateClientSelects() {
    const clients = getClients(); // Fetch clients from admin module

    // Populate Client Select in 'Contas de Anúncio' tab filter
    elements.clientSelectAdmin.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        elements.clientSelectAdmin.appendChild(option);
    });

    // Populate Client Select in 'Adicionar/Editar Conta' modal
    elements.accountClientSelectAdmin.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = client.name;
        elements.accountClientSelectAdmin.appendChild(option);
    });
}