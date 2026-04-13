// Handles admin panel UI interactions and data management

import { elements, showAdminPanel, closeAdminModal, showClientModal, closeClientModal, showAccountModal, closeAccountModal, renderClientsTable, renderAccountsTable, populateAdminClientSelects, populateAccountSelect, resetDataDisplay } from './ui.js';
import { getClients, createClient, updateClient, deleteClient, getAccounts, createAccount, updateAccount, deleteAccount, setApiKey, getApiKey } from './admin.js';
import { getUser, logout } from './auth.js';
import { updateApiKey } from './facebook-api.js';

/**
 * Sets up event listeners for all admin panel related actions.
 */
export function setupAdminEventListeners() {
    // Admin Panel Button - Check if the user is admin before showing/allowing click
    elements.adminPanelBtn.addEventListener('click', () => {
        const user = getUser();
        if (user && user.isAdmin) {
            showAdminPanel();
             // Ensure initial admin UI is setup when modal opens
            setupAdminUI();
        } else {
            console.warn("Attempted to open Admin Panel without admin privileges.");
        }
    });

    // Close modals
    elements.closeAdminModal.addEventListener('click', closeAdminModal);
    elements.closeClientModal.addEventListener('click', closeClientModal);
    elements.closeAccountModal.addEventListener('click', closeAccountModal);

    // Admin Tabs
    elements.adminTabs.forEach(tabBtn => {
        tabBtn.addEventListener('click', handleAdminTabClick);
    });

    // Admin Client Management
    elements.addClientBtnAdmin.addEventListener('click', () => showClientModal(false));
    elements.saveClientBtn.addEventListener('click', handleSaveClient);
    // Use event delegation on the table body for edit/delete buttons
    elements.clientsTableBody.addEventListener('click', handleClientTableClick);

    // Admin Account Management
    elements.addAccountBtnAdmin.addEventListener('click', () => {
         populateAdminClientSelects(); // Ensure client select in modal is populated
         showAccountModal(false);
    });
    elements.saveAccountBtn.addEventListener('click', handleSaveAccount);
     // Use event delegation on the table body for edit/delete buttons
    elements.accountsTableBody.addEventListener('click', handleAccountTableClick);
    // Event listener for the filter select in the admin accounts tab (if filtering were implemented)
    // elements.clientSelectAdmin.addEventListener('change', handleAdminClientSelectChange);

    // Admin API Key
    elements.saveApiBtnAdmin.addEventListener('click', handleSaveApiKey);

    // Close modals when clicking outside
    // Attach to the modal background divs directly
     elements.adminModal.addEventListener('click', handleWindowClick);
     elements.clientModal.addEventListener('click', handleWindowClick);
     elements.accountModal.addEventListener('click', handleWindowClick);
}

/**
 * Sets up the initial state of the admin panel UI when it is opened.
 */
export function setupAdminUI() {
    // Ensure first tab ('clients') is active when opening modal
    // This simulates clicking the clients tab initially
    const clientsTabButton = document.querySelector('.admin-modal .tab-btn[data-tab="clients"]');
    if (clientsTabButton) {
         // Manually trigger the logic that handleAdminTabClick would do
         // Remove active class from all tabs and tab contents
         elements.adminTabs.forEach(btn => btn.classList.remove('active'));
         elements.adminTabContents.forEach(content => content.classList.remove('active'));

         // Add active class to the clients tab and its corresponding content
         clientsTabButton.classList.add('active');
         const targetContent = document.querySelector(`.modal-content .tab-content[data-tab="clients"]`);
         if (targetContent) {
             targetContent.classList.add('active');
         }
         // Now render the content for the 'clients' tab
         renderClientsTable();
    } else {
         console.error("Clients tab button not found in admin modal.");
    }

     // Populate client selects needed in admin panel
     populateAdminClientSelects();
     // Populate API key textarea
     elements.apiKeyTextareaAdmin.value = getApiKey();
     // Render tables (rendering clients is done above, render accounts here)
     renderAccountsTable();
}


/**
 * Handles clicks on admin tab buttons to switch between sections.
 */
function handleAdminTabClick(event) {
    const targetTab = event.target.dataset.tab;
    // console.log('Admin Tab clicked:', targetTab); // Log which tab was clicked

    // Remove active class from all tabs and tab contents
    elements.adminTabs.forEach(btn => btn.classList.remove('active'));
    elements.adminTabContents.forEach(content => content.classList.remove('active'));

    // Add active class to the clicked tab and its corresponding content
    event.target.classList.add('active');
    const targetContent = document.querySelector(`.modal-content .tab-content[data-tab="${targetTab}"]`);
    if (targetContent) {
        // console.log(`Found content for tab ${targetTab}. Adding active class.`); // Log finding content
        targetContent.classList.add('active');
    } else {
         console.error(`Could not find content for tab ${targetTab} with selector .modal-content .tab-content[data-tab="${targetTab}"]`); // Log if content not found
    }

    // Perform actions specific to the activated tab (e.g., re-render tables)
    if(targetTab === 'clients') {
         renderClientsTable();
    } else if(targetTab === 'accounts') {
        populateAdminClientSelects(); // Ensure client filter/selects are up-to-date
         renderAccountsTable();
    } else if(targetTab === 'api') {
        elements.apiKeyTextareaAdmin.value = getApiKey();
    }
}

/**
 * Handles clicks outside modal content to close modals.
 */
function handleWindowClick(event) {
    // Check if the click is directly on the modal background, not the content
    if (event.target === elements.adminModal) {
        closeAdminModal();
    }
    if (event.target === elements.clientModal) {
        closeClientModal();
    }
    if (event.target === elements.accountModal) {
        closeAccountModal();
    }
}

/**
 * Handles clicks within the Clients table (Edit/Delete buttons).
 */
function handleClientTableClick(event) {
    const target = event.target;
    // Traverse up to find the closest button with data-id
    const button = target.closest('button[data-id]');
    if (!button) return;

    const clientId = parseInt(button.dataset.id, 10);

    if (button.classList.contains('edit-client-btn')) {
        const clientToEdit = getClients().find(c => c.id === clientId);
        if (clientToEdit) {
             showClientModal(true, clientToEdit);
        }
    } else if (button.classList.contains('delete-client-btn')) {
        // Prevent admin from deleting themselves
        const userViewing = getUser();
        if (userViewing && !userViewing.isAdmin && userViewing.clientId === clientId) {
            alert('Você não pode excluir seu próprio usuário enquanto estiver logado.');
            return;
        }

        if (confirm('Tem certeza que deseja excluir este cliente? Todas as contas de anúncio associadas a ele também serão excluídas.')) {
            // Get associated accounts BEFORE deleting the client
            const accountsToDelete = getAccounts(clientId);
            accountsToDelete.forEach(acc => deleteAccount(acc.id)); // Delete associated accounts

            deleteClient(clientId); // Delete the client

            // Re-render tables and selects
            renderClientsTable();
            populateAdminClientSelects(); // Update client selects in admin panel
            renderAccountsTable(); // Re-render accounts table as some accounts might be deleted

            // Ensure the dashboard account select is updated for the current user
             const user = getUser();
             if (user) {
                const accountsForUser = user.isAdmin ? getAccounts() : getAccounts(user.clientId);
                populateAccountSelect(accountsForUser);
                resetDataDisplay(); // Reset dashboard display as selected account might be gone
             } else {
                 // This case should not happen if an admin is logged in, but as a fallback
                 populateAccountSelect([]);
                 resetDataDisplay();
             }


            // If the user viewing is a client and their client ID was just deleted, log them out
             if (user && !user.isAdmin && user.clientId === clientId) {
                 alert('Seu usuário de cliente foi excluído. Você será desconectado.');
                 logout(); // Use the imported logout function
                 showLogin(); // Explicitly show login after logout
             }
        }
    }
}

/**
 * Handles saving a client from the modal (Add or Edit).
 */
function handleSaveClient() {
    const id = elements.clientIdInputModal.value ? parseInt(elements.clientIdInputModal.value, 10) : null;
    const name = elements.clientNameInputModal.value.trim();
    const password = elements.clientPasswordInputModal.value; // Use the current password input value

    if (!name) {
        alert('Nome do cliente é obrigatório.');
        return;
    }

    // When editing, password field is optional. If left empty, keep the old password.
    // When adding, password is required.
    if (!id && !password) {
        alert('Senha do cliente é obrigatória para novos clientes.');
        return;
    }

    // Check for duplicate client name (case-insensitive)
    const existingClient = getClients().find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== id);
    if (existingClient) {
         alert('Já existe um cliente com este nome.');
         return;
    }

    if (id) {
         const updatedClient = { name: name };
         // Only update password if the input field is not empty
         if (password !== '') {
             updatedClient.password = password;
         } else {
             // If password field is empty during edit, keep the old password
             const currentClient = getClients().find(c => c.id === id);
             if (currentClient) {
                 updatedClient.password = currentClient.password; // Ensure password field is populated correctly on re-edit if not changed
             }
         }
        updateClient(id, updatedClient);
    } else {
        createClient({ name, password, isAdmin: false });
    }

    renderClientsTable(); // Re-render the table after save
    populateAdminClientSelects(); // Update client selects in admin panel
    closeClientModal(); // Close the modal
}

/**
 * Handles clicks within the Accounts table (Edit/Delete buttons).
 */
function handleAccountTableClick(event) {
    const target = event.target;
     // Traverse up to find the closest button with data-id
    const button = target.closest('button[data-id]');
    if (!button) return;

    const accountId = parseInt(button.dataset.id, 10);

    if (button.classList.contains('edit-account-btn')) {
        const accounts = getAccounts();
        const account = accounts.find(a => a.id === accountId);
        if (account) {
            populateAdminClientSelects(); // Ensure client select in modal is populated
            showAccountModal(true, account);
        }
    } else if (button.classList.contains('delete-account-btn')) {
        if (confirm('Tem certeza que deseja excluir esta conta de anúncio?')) {
            deleteAccount(accountId);
            renderAccountsTable(); // Re-render admin accounts table

            // Ensure the dashboard account select is updated for the current user
            const user = getUser();
            if (user) {
                const accountsForUser = user.isAdmin ? getAccounts() : getAccounts(user.clientId);
                populateAccountSelect(accountsForUser);
                resetDataDisplay(); // Reset dashboard display as selected account might be gone
            } else {
                 populateAccountSelect([]);
                 resetDataDisplay();
            }
        }
    }
}

/**
 * Handles saving an account from the modal (Add or Edit).
 */
function handleSaveAccount() {
    const id = elements.accountIdHiddenInputModal.value ? parseInt(elements.accountIdHiddenInputModal.value, 10) : null;
    const clientId = parseInt(elements.accountClientSelectAdmin.value, 10);
    const name = elements.accountNameInputModal.value.trim();
    const accountIdStr = elements.accountIdInputModal.value.trim();

    if (!clientId || !name || !accountIdStr) {
        alert('Cliente, Nome da Conta e ID da Conta são obrigatórios.');
        return;
    }

     // Basic validation for Facebook account ID format (optional, but good practice)
     if (!accountIdStr.startsWith('act_')) {
         alert('O ID da Conta de Anúncio deve começar com "act_".');
         return;
     }
    if (accountIdStr.length <= 4) {
        alert('O ID da Conta de Anúncio parece muito curto.');
         return;
    }


    if (id) {
        // Check for duplicate Facebook account ID only if it's changed or if adding
        const existingAccount = getAccounts().find(a => a.accountId === accountIdStr && a.id !== id);
         if (existingAccount) {
             alert(`Já existe outra conta de anúncio com o ID "${accountIdStr}".`);
             return;
         }
        updateAccount(id, { clientId, name, accountId: accountIdStr });
    } else {
         // Check if Facebook Account ID already exists globally when adding
         const existingAccount = getAccounts().find(a => a.accountId === accountIdStr);
         if (existingAccount) {
             alert(`Já existe uma conta de anúncio com o ID "${accountIdStr}".`);
             return;
         }
        createAccount({ clientId, name, accountId: accountIdStr });
    }

    renderAccountsTable();
    // No need to repopulate client selects here as account save doesn't affect client list

    // Ensure the dashboard account select is updated if a new account was added or one was edited for the current user
    const user = getUser();
     if (user) {
        const accountsForUser = user.isAdmin ? getAccounts() : getAccounts(user.clientId);
        populateAccountSelect(accountsForUser);
    } else {
         populateAccountSelect([]);
         resetDataDisplay();
    }
    closeAccountModal();
}

/**
 * Handles saving the API key.
 */
function handleSaveApiKey() {
    const newKey = elements.apiKeyTextareaAdmin.value.trim();
    setApiKey(newKey);
    updateApiKey();
    alert('Chave da API salva!');
}