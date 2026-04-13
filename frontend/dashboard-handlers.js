// Handles dashboard filter events and fetching/displaying data

import { elements } from './dom.js';
import { populateCampaignSelect, populateAdSelect, resetDataDisplay, displayMetrics } from './dashboard-ui.js';
import { getCampaigns, getMetrics, getAds } from './facebook-api.js';

/**
 * Sets up event listeners for dashboard filters and data fetching.
 */
export function setupDashboardEventListeners() {
    // Dashboard Filters
    elements.accountSelect.addEventListener('change', handleAccountSelectChange);
    elements.campaignSelect.addEventListener('change', handleCampaignSelectChange);
    elements.fetchDataBtn.addEventListener('click', handleFetchData);
    
    // Configurar datas padrão
    setDefaultDates();
}

/**
 * Define datas padrão para os campos de data
 */
function setDefaultDates() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    // Formatar as datas como YYYY-MM-DD
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // Definir valores iniciais
    elements.startDateInput.value = formatDate(lastWeek);
    elements.endDateInput.value = formatDate(today);
}

/**
 * Handles the change event on the account select dropdown.
 * Populates the campaign select based on the selected account.
 */
async function handleAccountSelectChange() {
    const accountId = elements.accountSelect.value;
    resetDataDisplay();

    // Populate campaigns for the selected account
    if (accountId) {
         try {
             const campaigns = await getCampaigns(accountId);
             console.log("Campanhas carregadas:", campaigns);
             populateCampaignSelect(campaigns);
             // Reset ad select as campaigns changed
             populateAdSelect([]);
         } catch (error) {
             console.error("Erro ao buscar campanhas:", error);
             populateCampaignSelect([]);
             populateAdSelect([]);
         }
    } else {
        // Reset campaigns and ads if no account is selected
         populateCampaignSelect([]);
         populateAdSelect([]);
    }
}

/**
 * Handles the change event on the campaign select dropdown.
 * Populates the ad select based on the selected campaign (if any).
 */
async function handleCampaignSelectChange() {
    const accountId = elements.accountSelect.value; // Needed for getAds mock context
    const campaignId = elements.campaignSelect.value || null;

    // Populate ads for the selected campaign and account
    if (accountId && campaignId && campaignId !== '') {
        try {
            console.log("Buscando anúncios para a campanha:", campaignId);
            const ads = await getAds(campaignId);
            console.log("Anúncios obtidos:", ads);
            populateAdSelect(ads);
        } catch (error) {
            console.error("Erro ao buscar anúncios:", error);
            populateAdSelect([]);
        }
    } else {
        // Reset ads if "Todas as Campanhas" or no campaign is selected
        populateAdSelect([]);
    }
}

/**
 * Handles the click event on the "Ver Dados" button.
 * Fetches and displays metrics based on selected filters and dates.
 */
async function handleFetchData() {
    // Usar as referências de elementos do objeto elements importado de dom.js
    const accountId = elements.accountSelect.value;
    const campaignId = elements.campaignSelect.value;
    const adId = elements.adSelect ? elements.adSelect.value : null;
    const startDate = elements.startDateInput.value;
    const endDate = elements.endDateInput.value;

    console.log("Valores selecionados:", {
        accountId,
        campaignId,
        adId,
        startDate,
        endDate
    });

    // Verificar se os valores necessários estão presentes
    if (!accountId) {
        console.error("Erro: Conta não selecionada");
        return;
    }

    // Ajustar e formatar as datas para o padrão 'YYYY-MM-DD'
const formatDate = (date) => {
    if (typeof date === 'string' && date.includes('-')) {
        // já está no formato YYYY-MM-DD
        return date;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    console.log("Datas ajustadas:", formattedStartDate, formattedEndDate);

    try {
        console.log("Buscando métricas com datas:", formattedStartDate, formattedEndDate);
        const metrics = await getMetrics(accountId, campaignId, adId, formattedStartDate, formattedEndDate);
        console.log("Métricas recebidas:", metrics);
        displayMetrics(metrics); // Exibir as métricas no dashboard
    } catch (error) {
        console.error("Erro ao buscar métricas:", error);
        // Mostrar mensagem de erro ao usuário
        resetDataDisplay();
    }
}
