// ═══════════════════════════════════════════════
// facebook-api.js — Integração Meta Ads API
// ═══════════════════════════════════════════════
import { getApiKey } from './admin.js';

const BACKEND_URL = 'http://168.231.92.68:5000/api/facebook';

async function fbPost(body) {
  const response = await fetch(BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const ct = response.headers.get('content-type');
  if (!ct || !ct.includes('application/json')) {
    const text = await response.text();
    throw new Error('Resposta inválida do servidor: ' + text.substring(0, 100));
  }
  const data = await response.json();
  if (!data.success) throw new Error(data.error || 'Erro na API');
  return data.data;
}

export async function getCampaigns(accountId) {
  return fbPost({ action: 'getCampaigns', accountId });
}

export async function getAds(campaignId) {
  return fbPost({ action: 'getAds', campaignId });
}

export async function getMetrics(accountId, campaignId, adId, startDate, endDate) {
  return fbPost({ action: 'getMetrics', accountId, campaignId: campaignId || null, adId: adId || null, startDate, endDate });
}

export async function getPageInsights(accountId, startDate, endDate) {
  try {
    return await fbPost({ action: 'getPageInsights', accountId, startDate, endDate });
  } catch {
    return null; // Opcional
  }
}

export function updateApiKey() { return true; }
