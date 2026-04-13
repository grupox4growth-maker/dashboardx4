// Handles displaying data and filters on the dashboard view

import { elements } from './dom.js';
// Chart is loaded via CDN, so it's available globally

// Chart instance
let metricsChart = null;

// Populate dashboard account select
export function populateAccountSelect(accounts) {
     elements.accountSelect.innerHTML = '<option value="">Selecione a conta de anúncio</option>';
     accounts.forEach(account => {
         const option = document.createElement('option');
         option.value = account.accountId; // Use Facebook Account ID as value
         option.textContent = `${account.name} (${account.accountId})`;
         elements.accountSelect.appendChild(option);
     });
}

// Populate dashboard campaign select
export function populateCampaignSelect(campaigns) { 
    if (!campaigns || campaigns.length === 0) {
         elements.campaignSelect.innerHTML = '<option value="">Selecione a campanha</option>';
         elements.campaignSelect.disabled = true;
         return;
    }

    elements.campaignSelect.disabled = false;

    elements.campaignSelect.innerHTML = '<option value="">Todas as Campanhas</option>'; // Option for all campaigns
    campaigns.forEach(camp => {
        const option = document.createElement('option');
        option.value = camp.id;
        option.textContent = camp.name;
        elements.campaignSelect.appendChild(option);
    });
}

// Populate dashboard ad select
export function populateAdSelect(ads) {
    console.log("Populando select de anúncios com:", ads); // Log para depuração
    
    elements.adSelect.innerHTML = '<option value="">Selecione o anúncio</option>';
    
    if (!ads || ads.length === 0) {
        elements.adSelect.disabled = true;
        return;
    }
    
    elements.adSelect.disabled = false;
    
    // Adiciona anúncios ao dropdown
    ads.forEach(ad => {
        const option = document.createElement('option');
        option.value = ad.id;
        option.textContent = ad.name;
        elements.adSelect.appendChild(option);
    });
}

// Reset data display
export function resetDataDisplay() {
    elements.amountSpentElement.textContent = 'R$ 0,00';
    elements.messagesElement.textContent = '0';
    elements.costPerResultElement.textContent = 'R$ 0,00';
    elements.reachElement.textContent = '0';
    elements.impressionsElement.textContent = '0'; // Reset impressions
    elements.cpmElement.textContent = 'R$ 0,00';
    elements.uniqueClicksElement.textContent = '0';
    elements.uniqueCtrElement.textContent = '0%';
    elements.campaignsTableBody.innerHTML = '';

    // Clear and hide chart
    if (metricsChart) {
        metricsChart.destroy();
        metricsChart = null; // Reset chart instance
    }
    const canvas = elements.metricsChartCanvas;
    const context = canvas.getContext('2d');
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
         canvas.style.display = 'none'; // Hide canvas when no data
    }
}

// Display metrics
export function displayMetrics(data) {
    if (!data || !data.totals) {
        resetDataDisplay();
        return;
    }

    console.log("Exibindo métricas:", data); // Log para depuração

    // Função auxiliar para formatar números com separador de milhar
    const formatNumber = (num) => {
        return num.toLocaleString('pt-BR');
    };

    // Display totals, formatted to 2 decimal places where applicable
    elements.amountSpentElement.textContent = `R$ ${data.totals.amountSpent.toFixed(2)}`;
    elements.messagesElement.textContent = data.totals.messages;
    // Handle division by zero for cost per result and CPM
    elements.costPerResultElement.textContent = `R$ ${data.totals.messages > 0 ? (data.totals.amountSpent / data.totals.messages).toFixed(2) : '0.00'}`;
    // Formatar reach e impressions com separador de milhar
    elements.reachElement.textContent = formatNumber(data.totals.reach);
    elements.impressionsElement.textContent = formatNumber(data.totals.impressions);
    // Handle division by zero for CPM (Cost Per Thousand Impressions)
    elements.cpmElement.textContent = `R$ ${data.totals.cpm.toFixed(2)}`;

    elements.uniqueClicksElement.textContent = data.totals.uniqueClicks;
    // Handle division by zero for CTR
    elements.uniqueCtrElement.textContent = `${data.totals.reach > 0 ? (data.totals.uniqueClicks / data.totals.reach * 100).toFixed(2) : '0.00'}%`;


    // Populate campaigns table
    elements.campaignsTableBody.innerHTML = '';
     if (data.campaigns && data.campaigns.length > 0) {
         data.campaigns.forEach(camp => {
             const row = document.createElement('tr');
             row.innerHTML = `
                 <td>${camp.name}</td>
                 <td>R$ ${camp.amountSpent.toFixed(2)}</td>
                 <td>${camp.messages}</td>
                 <td>R$ ${camp.messages > 0 ? (camp.amountSpent / camp.messages).toFixed(2) : '0.00'}</td>
                 <td>${formatNumber(camp.reach)}</td>
                 <td>${formatNumber(camp.impressions)}</td> 
                 <td>R$ ${camp.cpm.toFixed(2)}</td> 
                 <td>${camp.uniqueClicks}</td>
                 <td>${camp.reach > 0 ? (camp.uniqueClicks / camp.reach * 100).toFixed(2) : '0.00'}%</td>
             `;
             elements.campaignsTableBody.appendChild(row);
         });
     } else {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="9" style="text-align:center;">Nenhum dado de campanha encontrado para o período e filtros selecionados.</td>`;
          elements.campaignsTableBody.appendChild(row);
     }


    // Create chart
     if (data.campaigns && data.campaigns.length > 0) {
         createChart(data.campaigns);
         elements.metricsChartCanvas.style.display = 'block'; // Show canvas
     } else {
         // Clear chart if no data
         if (metricsChart) {
             metricsChart.destroy();
             metricsChart = null;
         }
         const canvas = elements.metricsChartCanvas;
         const context = canvas.getContext('2d');
         if (context) {
              context.clearRect(0, 0, canvas.width, canvas.height);
              canvas.style.display = 'none'; // Hide canvas
         }
     }
}

// Create metrics chart
function createChart(campaigns) {
    const ctx = elements.metricsChartCanvas.getContext('2d');

    if (metricsChart) {
        metricsChart.destroy();
    }

    const labels = campaigns.map(c => c.name);
    const datasets = [
        {
            label: 'Valor Usado (R$)',
            data: campaigns.map(c => c.amountSpent),
            backgroundColor: 'rgba(30, 144, 255, 0.6)', // Slightly more opaque
            borderColor: 'rgba(30, 144, 255, 1)',
            borderWidth: 1,
            yAxisID: 'y'
        },
        {
            label: 'Mensagens Iniciadas',
            data: campaigns.map(c => c.messages),
            backgroundColor: 'rgba(100, 255, 218, 0.6)', // Slightly more opaque
            borderColor: 'rgba(100, 255, 218, 1)',
            borderWidth: 1,
            yAxisID: 'y1'
        }
    ];

    metricsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
             plugins: {
                 legend: {
                     labels: {
                         color: 'white' // Legend text color
                     }
                 }
             },
            scales: {
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)' // X-axis label color
                    },
                    grid: {
                         color: 'rgba(100, 255, 218, 0.1)' // X-axis grid color
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                     ticks: {
                        color: 'rgba(255, 255, 255, 0.7)' // Y-axis label color
                    },
                    title: {
                        display: true,
                        text: 'Valor Usado (R$)',
                        color: 'rgba(255, 255, 255, 0.9)' // Y-axis title color
                    },
                     grid: {
                        color: 'rgba(100, 255, 218, 0.1)' // Y-axis grid color
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                     ticks: {
                        color: 'rgba(255, 255, 255, 0.7)' // Y1-axis label color
                    },
                    title: {
                        display: true,
                        text: 'Mensagens Iniciadas',
                        color: 'rgba(255, 255, 255, 0.9)' // Y1-axis title color
                    },
                    grid: {
                        drawOnChartArea: false, // Don't draw grid lines for this axis over the chart
                         color: 'rgba(100, 255, 218, 0.1)' // Y1-axis grid color
                    }
                }
            }
        }
    });
}