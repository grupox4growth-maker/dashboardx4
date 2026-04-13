// Handles authentication-related events and view switching

import { login, logout, checkAuth, getUser } from './auth.js';
import {
    elements,
    showDashboard,
    showLogin,
    populateAccountSelect,
    populateCampaignSelect,
    populateAdSelect,
    resetDataDisplay,
    populateAdminClientSelects, // Needed if admin logs in
    renderClientsTable, // Needed if admin logs in
    renderAccountsTable, // Needed if admin logs in
} from './ui.js';
import { getAccounts, getApiKey } from './admin.js'; // Needed if admin logs in

/**
 * Checks authentication status and renders the appropriate view (login or dashboard).
 * Populates initial data/UI based on user type (admin/client).
 */
export async function checkAuthAndRender() {
    const user = checkAuth();
    if (user) {
        // User is logged in, show dashboard and populate data
        showDashboard();

        // If admin, show admin panel button and populate admin specific UI elements
        if (user.isAdmin) {
            elements.adminPanelBtn.style.display = 'flex'; // Show the admin button
            // These will be populated when admin modal is opened/tabs clicked
            // populateAdminClientSelects();
            // elements.apiKeyTextareaAdmin.value = getApiKey();
            // renderClientsTable();
            // renderAccountsTable();
        } else {
             elements.adminPanelBtn.style.display = 'none'; // Hide the admin button for clients
        }

         // Populate account select for the logged-in user (admin or client)
         const accountsForUser = user.isAdmin ? getAccounts() : getAccounts(user.clientId);
         populateAccountSelect(accountsForUser);

    } else {
        showLogin();
        elements.adminPanelBtn.style.display = 'none'; // Ensure button is hidden on login screen
    }
}

/**
 * Sets up event listeners for login and logout actions.
 */
export function setupAuthEventListeners() {
    // Login/Logout
    elements.loginBtn.addEventListener('click', handleLoginAttempt);
    // Allow login with Enter key on password field
    elements.passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleLoginAttempt();
        }
    });
    elements.logoutBtn.addEventListener('click', handleLogout);
}


/**
 * Handles the user attempting to log in.
 */
async function handleLoginAttempt() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();

    const user = login(username, password);

    if (user) {
        // Login successful
        showDashboard();

        // Populate account select for the logged-in user
        const accountsForUser = user.isAdmin ? getAccounts() : getAccounts(user.clientId);
        populateAccountSelect(accountsForUser);

         // If admin, show admin button
         // Admin specific UI (tables, selects) population is deferred until modal opens
        if (user.isAdmin) {
             elements.adminPanelBtn.style.display = 'flex'; // Show the admin button
        } else {
             elements.adminPanelBtn.style.display = 'none'; // Hide the admin button for clients
        }

    } else {
        // Login failed
        alert('Credenciais inválidas');
        elements.passwordInput.value = '';
    }
}

/**
 * Handles the user logging out.
 */
function handleLogout() {
    logout();
    showLogin();
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    resetDataDisplay();
     // Clear dashboard account select and related dropdowns
    populateAccountSelect([]);
    populateCampaignSelect([]);
    populateAdSelect([]);
    elements.adminPanelBtn.style.display = 'none'; // Hide the admin button on logout
}