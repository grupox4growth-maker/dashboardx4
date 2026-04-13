// Configuração básica da API
const API_URL = 'http://168.231.92.68:5000/api/facebook';

/**
 * Obtém as campanhas para uma conta específica
 * @param {string} accountId - ID da conta de anúncios
 * @returns {Promise<Array>} - Lista de campanhas
 */
export async function getCampaigns(accountId) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getCampaigns',
                accountId: accountId
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Falha ao obter campanhas');
        }
        
        return data.data;
    } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
        throw error;
    }
}

/**
 * Obtém os anúncios para uma campanha específica
 * @param {string} campaignId - ID da campanha
 * @returns {Promise<Array>} - Lista de anúncios
 */
export async function getAds(campaignId) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getAds',
                campaignId: campaignId
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Falha ao obter anúncios');
        }
        
        return data.data;
    } catch (error) {
        console.error('Erro ao buscar anúncios:', error);
        throw error;
    }
}

/**
 * Obtém métricas com base nos filtros selecionados
 * @param {string} accountId - ID da conta
 * @param {string|null} campaignId - ID da campanha (opcional)
 * @param {string|null} adId - ID do anúncio (opcional)
 * @param {string} startDate - Data de início no formato YYYY-MM-DD
 * @param {string} endDate - Data de fim no formato YYYY-MM-DD
 * @returns {Promise<Object>} - Dados de métricas
 */
export async function getMetrics(accountId, campaignId, adId, startDate, endDate) {
    console.log('Buscando métricas com params:', {accountId, campaignId, adId, startDate, endDate});

    // Validação do formato das datas
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new Error('Formato de data inválido. Use YYYY-MM-DD.');
    }

    // Validação da ordem das datas
    if (new Date(startDate) > new Date(endDate)) {
        throw new Error('A data de início deve ser anterior à data de fim.');
    }

    try {
        // Usar abordagem simplificada - enviar as datas diretamente no formato que o backend espera
        const requestBody = {
            action: 'getMetrics',
            accountId: accountId,
            campaignId: campaignId || null,
            adId: adId || null,
            // Enviar as datas diretamente
            startDate: startDate,
            endDate: endDate
        };

        console.log('Enviando request:', JSON.stringify(requestBody));

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        // Verificar se a resposta é JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Resposta não-JSON recebida:', text);
            throw new Error(`Resposta não-JSON recebida: ${text.substring(0, 100)}...`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Falha ao obter métricas');
        }
        
        // Retornar os dados
        return data.data;
    } catch (error) {
        console.error('Erro ao buscar métricas:', error);
        throw error;
    }
}

/**
 * Obtém contas de anúncio
 * @returns {Promise<Array>} - Lista de contas de anúncio
 */
export async function getAdAccounts() {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getAdAccounts'
            })
        });

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Falha ao obter contas de anúncios');
        }
        
        return data.data;
    } catch (error) {
        console.error('Erro ao buscar contas de anúncios:', error);
        throw error;
    }
}

/**
 * Atualiza a chave da API no backend
 * Esta função é chamada pelo admin-handlers.js quando a chave da API é atualizada
 * @returns {boolean} - Indica se a atualização foi bem-sucedida
 */
export function updateApiKey() {
    // Em uma implementação real, você poderia enviar a nova chave para o backend
    console.log('API Key atualizada');
    return true;
}
