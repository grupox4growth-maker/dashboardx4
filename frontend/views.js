// Handles showing and hiding different views and modals

import { elements } from './dom.js';

// Show login view
export function showLogin() {
    elements.loginView.style.display = 'flex';
    elements.dashboardView.style.display = 'none';
}

// Show dashboard view
export function showDashboard() {
    elements.loginView.style.display = 'none';
    elements.dashboardView.style.display = 'block';
    // Dashboard specific setup (like populating selects) is handled by the app/listeners after calling this
}

// --- Admin Modal Functions ---

export function showAdminPanel() {
    elements.adminModal.style.display = 'block';
    // Admin panel data population and initial tab activation handled by the app/listeners after calling this
}

export function closeAdminModal() {
    elements.adminModal.style.display = 'none';
}

export function showClientModal(isEdit, client = null) {
    elements.clientModal.style.display = 'block';
    if (isEdit && client) {
        elements.clientModalTitle.textContent = 'Editar Cliente';
        elements.clientIdInputModal.value = client.id;
        elements.clientNameInputModal.value = client.name;
        elements.clientPasswordInputModal.value = client.password;
    } else {
        elements.clientModalTitle.textContent = 'Adicionar Cliente';
        elements.clientIdInputModal.value = '';
        elements.clientNameInputModal.value = '';
        elements.clientPasswordInputModal.value = '';
    }
}

export function closeClientModal() {
    elements.clientModal.style.display = 'none';
}

export function showAccountModal(isEdit, account = null) {
    elements.accountModal.style.display = 'block';
     // Ensure client list is populated before showing - handled by app/listeners before calling this

    if (isEdit && account) {
        elements.accountModalTitle.textContent = 'Editar Conta de Anúncio';
        elements.accountIdHiddenInputModal.value = account.id;
        // Populate client select in modal is handled by app/listeners, just set the value here
        elements.accountClientSelectAdmin.value = account.clientId;
        elements.accountNameInputModal.value = account.name;
        elements.accountIdInputModal.value = account.accountId;
    } else {
        elements.accountModalTitle.textContent = 'Adicionar Conta de Anúncio';
        elements.accountIdHiddenInputModal.value = '';
        elements.accountClientSelectAdmin.value = ''; // Reset dropdown
        elements.accountNameInputModal.value = '';
        elements.accountIdInputModal.value = '';
    }
}

export function closeAccountModal() {
    elements.accountModal.style.display = 'none';
}