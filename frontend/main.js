import {
    elements,
    populateAccountSelect,
    resetDataDisplay,
} from './ui.js';
import { getAccounts } from './admin.js';
import { setupAuthEventListeners, checkAuthAndRender } from './auth-handlers.js';
import { setupDashboardEventListeners } from './dashboard-handlers.js';
import { setupAdminEventListeners } from './admin-handlers.js';

function init() {
    // Set default dates in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const formattedToday = `${year}-${month}-${day}`;
    elements.endDateInput.value = formattedToday;

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekYear = lastWeek.getFullYear();
    const lastWeekMonth = String(lastWeek.getMonth() + 1).padStart(2, '0');
    const lastWeekDay = String(lastWeek.getDate()).padStart(2, '0');
    
    const formattedLastWeek = `${lastWeekYear}-${lastWeekMonth}-${lastWeekDay}`;
    elements.startDateInput.value = formattedLastWeek;

    setupEventListeners();
    // checkAuthAndRender is now responsible for initial view and data population
    checkAuthAndRender();
}

function setupEventListeners() {
    setupAuthEventListeners();
    setupDashboardEventListeners();
    setupAdminEventListeners();
}

// Call init to start the application
init();
