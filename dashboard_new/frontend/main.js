// ═══════════════════════════════════════════════
// main.js — Ponto de entrada da aplicação
// ═══════════════════════════════════════════════
import { checkAuth, login, logout, getUser } from './auth.js';
import { getClients, getAccounts, createClient, updateClient, deleteClient, createAccount, updateAccount, deleteAccount, getApiKey, setApiKey } from './admin.js';
import { getMetrics, getCampaigns } from './facebook-api.js';

// ── UTILS ──────────────────────────────────────
const $ = id => document.getElementById(id);
const fmtBRL  = v => 'R$ ' + (v||0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum  = v => (v||0).toLocaleString('pt-BR');
const fmtPct  = v => (v||0).toFixed(2) + '%';
const today   = () => new Date().toISOString().slice(0, 10);
const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

// Chart instances
let charts = {};
function destroyChart(key) { if (charts[key]) { charts[key].destroy(); delete charts[key]; } }

const CHART_OPTS = {
  font: { family: "'DM Sans', sans-serif" },
  tickColor: 'rgba(255,255,255,.28)',
  gridColor: 'rgba(255,255,255,.05)',
  palette: ['#3a8af5','#30d158','#f5a623','#bf5af2','#ff453a','#5ce1e6','#ff9f43','#fd79a8'],
};

// ── STATE ──────────────────────────────────────
let metaData    = null;
let googleData  = null;
let finData     = [];

// ══════════════════════════════════════════════
// AUTH & NAVIGATION
// ══════════════════════════════════════════════
function showLogin() {
  $('login-view').style.display = 'flex';
  $('app-view').style.display   = 'none';
}

function showApp(user) {
  $('login-view').style.display = 'none';
  $('app-view').style.display   = 'flex';

  // Update sidebar
  const name = user.username || 'Usuário';
  $('sb-client-name').textContent = user.isAdmin ? 'X4GROWTH Admin' : name;
  $('sb-client-role').textContent = user.isAdmin ? 'Administrador' : 'Cliente';
  $('sb-client-avatar').textContent = name[0].toUpperCase();

  if (user.isAdmin) {
    $('admin-panel-btn').style.display = 'flex';
  } else {
    $('admin-panel-btn').style.display = 'none';
  }

  // Navigate to meta by default
  navigateTo('meta');
  if (user.isAdmin || true) autoLoadMeta();
}

function navigateTo(page) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sb-link').forEach(l => l.classList.remove('active'));

  $('page-' + page).classList.add('active');
  document.querySelector(`.sb-link[data-page="${page}"]`)?.classList.add('active');
}

// ── LOGIN ──
$('login-btn').addEventListener('click', handleLogin);
$('password').addEventListener('keypress', e => { if (e.key === 'Enter') handleLogin(); });

function handleLogin() {
  const u = $('username').value.trim();
  const p = $('password').value.trim();
  const user = login(u, p);
  if (user) { showApp(user); }
  else {
    $('password').value = '';
    $('password').style.borderColor = '#ff453a';
    setTimeout(() => $('password').style.borderColor = '', 1500);
  }
}

// ── LOGOUT ──
$('logout-btn').addEventListener('click', () => {
  logout();
  showLogin();
  $('username').value = '';
  $('password').value = '';
});

// ── SIDEBAR NAVIGATION ──
document.querySelectorAll('.sb-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    navigateTo(page);
    if (page === 'meta'   && !metaData)   autoLoadMeta();
    if (page === 'google' && !googleData) autoLoadGoogle();
    if (page === 'financeiro')            initFinanceiro();
  });
});

// ══════════════════════════════════════════════
// DATE SHORTCUTS HELPER
// ══════════════════════════════════════════════
function setupDateShortcuts(containerSelector, startId, endId, customDatesId, onSelect) {
  const btns = document.querySelectorAll(containerSelector + ' .ds-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.dataset.days);
      if (days === -1) {
        $(customDatesId).style.display = 'flex';
      } else {
        $(customDatesId).style.display = 'none';
        const end   = today();
        const start = days === 0 ? today() : daysAgo(days);
        $(startId).value = start;
        $(endId).value   = end;
        if (onSelect) onSelect(start, end);
      }
    });
  });
  // Default: today
  $(startId).value = today();
  $(endId).value   = today();
}

// ══════════════════════════════════════════════
// META ADS
// ══════════════════════════════════════════════
setupDateShortcuts('.date-shortcuts', 'meta-start-date', 'meta-end-date', 'meta-custom-dates', () => fetchMetaData());

$('meta-fetch-btn').addEventListener('click', fetchMetaData);

function getMetaAccounts() {
  const user = getUser();
  if (!user) return [];
  return user.isAdmin ? getAccounts() : getAccounts(user.clientId);
}

function autoLoadMeta() {
  $('meta-start-date').value = today();
  $('meta-end-date').value   = today();
  fetchMetaData();
}

async function fetchMetaData() {
  const accounts = getMetaAccounts();
  if (!accounts.length) {
    renderMetaEmpty();
    return;
  }
  const startDate = $('meta-start-date').value || today();
  const endDate   = $('meta-end-date').value   || today();

  $('meta-loading').style.display = 'flex';

  try {
    // Fetch all accounts and aggregate
    const results = await Promise.allSettled(
      accounts.map(acc => getMetrics(acc.accountId, null, null, startDate, endDate))
    );

    const combined = { totals: { amountSpent: 0, messages: 0, reach: 0, impressions: 0, cpm: 0, uniqueClicks: 0, followers: 0, leads: 0 }, campaigns: [] };
    let cpmCount = 0;

    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) {
        const d = r.value;
        if (d.totals) {
          combined.totals.amountSpent  += d.totals.amountSpent  || 0;
          combined.totals.messages     += d.totals.messages     || 0;
          combined.totals.reach        += d.totals.reach        || 0;
          combined.totals.impressions  += d.totals.impressions  || 0;
          combined.totals.uniqueClicks += d.totals.uniqueClicks || 0;
          combined.totals.followers    += d.totals.followers    || 0;
          combined.totals.leads        += d.totals.leads        || 0;
          if (d.totals.cpm) { combined.totals.cpm += d.totals.cpm; cpmCount++; }
        }
        if (d.campaigns) combined.campaigns.push(...d.campaigns);
      }
    });
    if (cpmCount > 1) combined.totals.cpm /= cpmCount;

    metaData = combined;
    renderMetaMetrics(combined);
    renderMetaCharts(combined);
    renderMetaTable(combined);
  } catch (err) {
    console.error('Meta fetch error:', err);
    renderMetaError(err.message);
  } finally {
    $('meta-loading').style.display = 'none';
  }
}

function renderMetaMetrics(d) {
  const t = d.totals;
  const spent   = t.amountSpent || 0;
  const msgs    = t.messages    || 0;
  const clicks  = t.uniqueClicks || 0;
  const reach   = t.reach       || 0;
  const impr    = t.impressions || 0;
  const follows = t.followers   || 0;
  const leads   = t.leads       || 0;

  $('m-spent').textContent        = fmtBRL(spent);
  $('m-spent-sub').textContent    = `período selecionado`;
  $('m-clicks').textContent       = fmtNum(clicks);
  $('m-followers').textContent    = fmtNum(follows);
  $('m-cost-follower').textContent = follows > 0 ? `Custo/seguidor: ${fmtBRL(spent / follows)}` : 'Custo/seguidor: —';
  $('m-messages').textContent     = fmtNum(msgs);
  $('m-cost-msg').textContent     = msgs > 0 ? `Custo/mensagem: ${fmtBRL(spent / msgs)}` : 'Custo/mensagem: —';
  $('m-leads').textContent        = fmtNum(leads);
  $('m-cost-lead').textContent    = leads > 0 ? `Custo/lead: ${fmtBRL(spent / leads)}` : 'Custo/lead: —';
  $('m-reach').textContent        = fmtNum(reach);
  $('m-impressions-sub').textContent = `Impressões: ${fmtNum(impr)}`;
  $('m-cpm').textContent          = fmtBRL(t.cpm || 0);
  $('m-ctr').textContent          = reach > 0 ? fmtPct(clicks / reach * 100) : '0%';
}

function renderMetaCharts(d) {
  const camps = (d.campaigns || []).slice(0, 8);

  // Chart 1: investment per campaign
  destroyChart('metaCamps');
  if (camps.length) {
    const ctx = $('meta-chart-campaigns').getContext('2d');
    charts.metaCamps = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: camps.map(c => c.name || 'Campanha'),
        datasets: [{
          data: camps.map(c => c.amountSpent || 0),
          backgroundColor: 'rgba(58,138,245,0.25)',
          borderColor: '#3a8af5',
          borderWidth: 1.5,
          borderRadius: 6,
          hoverBackgroundColor: 'rgba(58,138,245,0.4)',
        }]
      },
      options: barChartOptions('R$')
    });
  }

  // Chart 2: results distribution
  destroyChart('metaResults');
  const msgs = d.totals?.messages || 0;
  const leads = d.totals?.leads || 0;
  const clicks = d.totals?.uniqueClicks || 0;

  if (msgs + leads + clicks > 0) {
    const ctx2 = $('meta-chart-results').getContext('2d');
    charts.metaResults = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Mensagens', 'Leads', 'Cliques'],
        datasets: [{
          data: [msgs, leads, clicks],
          backgroundColor: ['rgba(58,138,245,0.3)', 'rgba(48,209,88,0.3)', 'rgba(245,166,35,0.3)'],
          borderColor: ['#3a8af5', '#30d158', '#f5a623'],
          borderWidth: 1.5,
        }]
      },
      options: doughnutChartOptions()
    });
  }
}

function renderMetaTable(d) {
  const camps = d.campaigns || [];
  $('meta-count-pill').textContent = camps.length + ' campanha' + (camps.length !== 1 ? 's' : '');
  $('meta-campaigns-tbody').innerHTML = camps.length ? camps.map(c => {
    const msgs = c.messages || 0;
    const spent = c.amountSpent || 0;
    const reach = c.reach || 0;
    const clicks = c.uniqueClicks || 0;
    return `<tr>
      <td title="${c.name}">${c.name}</td>
      <td>${fmtBRL(spent)}</td>
      <td>${fmtNum(msgs)}</td>
      <td>${msgs > 0 ? fmtBRL(spent / msgs) : '—'}</td>
      <td>${fmtNum(reach)}</td>
      <td>${fmtNum(c.impressions || 0)}</td>
      <td>${fmtBRL(c.cpm || 0)}</td>
      <td>${fmtNum(clicks)}</td>
      <td>${reach > 0 ? fmtPct(clicks / reach * 100) : '0%'}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text-3);padding:20px">Nenhuma campanha encontrada</td></tr>';
}

function renderMetaEmpty() {
  $('meta-campaigns-tbody').innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-3);padding:20px">Nenhuma conta de anúncio configurada</td></tr>';
}
function renderMetaError(msg) {
  $('meta-campaigns-tbody').innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--red);padding:20px">Erro: ${msg}</td></tr>`;
}

// ── META AI ANALYSIS ──
$('meta-ai-btn').addEventListener('click', () => generateAIAnalysis('meta'));

// ══════════════════════════════════════════════
// GOOGLE ADS (placeholder estruturado)
// ══════════════════════════════════════════════
setupDateShortcuts('#google-shortcuts', 'google-start-date', 'google-end-date', 'google-custom-dates', () => fetchGoogleData());

$('google-fetch-btn').addEventListener('click', fetchGoogleData);

function autoLoadGoogle() {
  $('google-start-date').value = today();
  $('google-end-date').value   = today();
  fetchGoogleData();
}

async function fetchGoogleData() {
  $('google-loading').style.display = 'flex';

  // Simulated structure — connect real Google Ads API here
  await new Promise(r => setTimeout(r, 800));

  googleData = {
    totals: { spent: 0, impressions: 0, clicks: 0, cpc: 0, conversions: 0, costPerConversion: 0, cities: 0 },
    dailyClicks: [],
    citiesData: [],
    keywords: []
  };

  renderGoogleMetrics(googleData);
  renderGoogleCharts(googleData);
  renderGoogleKeywords(googleData);
  $('google-loading').style.display = 'none';
}

function renderGoogleMetrics(d) {
  const t = d.totals;
  $('g-spent').textContent      = fmtBRL(t.spent);
  $('g-spent-sub').textContent  = 'período selecionado';
  $('g-impressions').textContent = fmtNum(t.impressions);
  $('g-clicks').textContent     = fmtNum(t.clicks);
  $('g-ctr-sub').textContent    = t.impressions > 0 ? `CTR: ${fmtPct(t.clicks / t.impressions * 100)}` : 'CTR: —';
  $('g-cpc').textContent        = fmtBRL(t.cpc);
  $('g-conversions').textContent = fmtNum(t.conversions);
  $('g-cost-conv').textContent  = t.conversions > 0 ? `Custo/conversão: ${fmtBRL(t.spent / t.conversions)}` : 'Custo/conversão: —';
  $('g-cities').textContent     = t.cities;
}

function renderGoogleCharts(d) {
  // Chart: daily clicks
  destroyChart('googleClicks');
  const ctx = $('google-chart-clicks').getContext('2d');
  charts.googleClicks = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.dailyClicks.map(p => p.date) || ['Sem dados'],
      datasets: [{
        data: d.dailyClicks.map(p => p.clicks) || [0],
        borderColor: '#30d158',
        backgroundColor: 'rgba(48,209,88,0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#30d158',
      }]
    },
    options: lineChartOptions()
  });

  // Chart: cities
  destroyChart('googleCities');
  const ctx2 = $('google-chart-cities').getContext('2d');
  charts.googleCities = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: d.citiesData.map(c => c.city) || ['Sem dados'],
      datasets: [{
        data: d.citiesData.map(c => c.conversions) || [0],
        backgroundColor: 'rgba(48,209,88,0.25)',
        borderColor: '#30d158',
        borderWidth: 1.5,
        borderRadius: 6,
      }]
    },
    options: { ...barChartOptions(''), indexAxis: 'y' }
  });
}

function renderGoogleKeywords(d) {
  const kws = d.keywords || [];
  $('google-kw-pill').textContent = kws.length + ' palavra' + (kws.length !== 1 ? 's' : '');
  $('google-kw-tbody').innerHTML = kws.length ? kws.map(k => `<tr>
    <td>${k.keyword}</td>
    <td>${fmtNum(k.impressions)}</td>
    <td>${fmtNum(k.clicks)}</td>
    <td>${fmtNum(k.conversions)}</td>
    <td>${fmtBRL(k.cost)}</td>
    <td>${fmtPct(k.ctr)}</td>
    <td>${fmtBRL(k.cpc)}</td>
  </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:20px">Configure a API do Google Ads para visualizar palavras-chave</td></tr>';
}

$('google-ai-btn').addEventListener('click', () => generateAIAnalysis('google'));

// ══════════════════════════════════════════════
// FINANCEIRO (Google Sheets)
// ══════════════════════════════════════════════
const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1cQmELpOq9eXwVpTRHUf9xAi00I7_W_q1M1T9Zxhz5Kg/gviz/tq?tqx=out:json';

function initFinanceiro() {
  const user = getUser();
  const url = user?.sheetsUrl || SHEETS_URL;
  setFinDates();
  fetchFinData(url);
}

function setFinDates() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  $('fin-start-date').value = start.toISOString().slice(0,10);
  $('fin-end-date').value   = today();
}

$('fin-fetch-btn').addEventListener('click', () => {
  const user = getUser();
  const url = user?.sheetsUrl || SHEETS_URL;
  fetchFinData(url);
});

async function fetchFinData(url) {
  $('fin-loading').style.display = 'flex';
  try {
    const res  = await fetch(url + '&t=' + Date.now());
    const text = await res.text();
    const json = JSON.parse(text.replace(/^[^(]+\(/, '').replace(/\);?$/, ''));
    const rows = json.table.rows;

    finData = rows.map(r => {
      const c = r.c || [];
      return {
        nome:         c[0]?.v || '',
        sdr:          c[1]?.v || '—',
        fonte:        c[2]?.v || '—',
        procedimento: c[3]?.v || '—',
        fechamento:   c[4]?.v ? fmtSheetDate(c[4].v) : '',
        valor:        parseFloat(c[5]?.v) || 0,
      };
    }).filter(r => r.nome);

    populateFinFilters();
    applyFinFilters();
  } catch (err) {
    console.error('Sheets error:', err);
    finData = [];
    applyFinFilters();
  } finally {
    $('fin-loading').style.display = 'none';
  }
}

function fmtSheetDate(v) {
  if (!v) return '';
  const m = String(v).match(/Date\((\d+),(\d+),(\d+)\)/);
  if (m) {
    const d = new Date(+m[1], +m[2], +m[3]);
    return d.toISOString().slice(0,10);
  }
  return String(v);
}

function populateFinFilters() {
  const sdrs   = [...new Set(finData.map(r => r.sdr).filter(s => s && s !== '—'))];
  const fontes = [...new Set(finData.map(r => r.fonte).filter(f => f && f !== '—'))];

  const sdrSel = $('fin-sdr-filter');
  sdrSel.innerHTML = '<option value="">Todos os SDRs</option>' + sdrs.map(s => `<option value="${s}">${s}</option>`).join('');

  const fonteSel = $('fin-fonte-filter');
  fonteSel.innerHTML = '<option value="">Todas as fontes</option>' + fontes.map(f => `<option value="${f}">${f}</option>`).join('');
}

function applyFinFilters() {
  const sdr    = $('fin-sdr-filter').value;
  const fonte  = $('fin-fonte-filter').value;
  const start  = $('fin-start-date').value;
  const end    = $('fin-end-date').value;

  let data = [...finData];
  if (sdr)   data = data.filter(r => r.sdr   === sdr);
  if (fonte) data = data.filter(r => r.fonte === fonte);
  if (start) data = data.filter(r => r.fechamento >= start);
  if (end)   data = data.filter(r => r.fechamento <= end);

  renderFinMetrics(data);
  renderFinCharts(data);
  renderFinRankings(data);
  renderFinTable(data);
}

$('fin-sdr-filter').addEventListener('change', applyFinFilters);
$('fin-fonte-filter').addEventListener('change', applyFinFilters);
$('fin-start-date').addEventListener('change', applyFinFilters);
$('fin-end-date').addEventListener('change', applyFinFilters);

function renderFinMetrics(data) {
  const totalFat   = data.reduce((s, r) => s + r.valor, 0);
  const unique     = [...new Set(data.map(r => r.nome))].length;
  const vendas     = data.filter(r => r.valor > 0).length;
  const taxa       = unique > 0 ? Math.round(vendas / unique * 100) : 0;
  const ticket     = vendas > 0 ? totalFat / vendas : 0;
  const hojeStr    = today();
  const fatHoje    = data.filter(r => r.fechamento === hojeStr).reduce((s, r) => s + r.valor, 0);
  const vendasHoje = data.filter(r => r.fechamento === hojeStr && r.valor > 0).length;

  $('f-faturado').textContent  = fmtBRL(totalFat);
  $('f-procs').textContent     = vendas + ' procedimentos';
  $('f-convertidos').textContent = vendas;
  $('f-conv-rate').textContent = `de ${unique} leads · ${taxa}% conversão`;
  $('f-ticket').textContent    = fmtBRL(ticket);
  $('f-hoje').textContent      = fmtBRL(fatHoje);
  $('f-hoje-sub').textContent  = vendasHoje > 0 ? `${vendasHoje} fechamento${vendasHoje > 1 ? 's' : ''} hoje` : 'sem movimento hoje';
}

function renderFinCharts(data) {
  // Monthly
  destroyChart('finMensal');
  const months = {};
  data.forEach(r => {
    if (!r.fechamento || r.valor <= 0) return;
    const m = r.fechamento.slice(0, 7);
    months[m] = (months[m] || 0) + r.valor;
  });
  const mKeys = Object.keys(months).sort();
  const mNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const mLabels = mKeys.map(k => mNames[+k.split('-')[1]-1] + "'" + k.split('-')[0].slice(2));

  const ctx1 = $('fin-chart-mensal').getContext('2d');
  charts.finMensal = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: mLabels,
      datasets: [{
        data: mKeys.map(k => Math.round(months[k])),
        backgroundColor: 'rgba(245,166,35,0.22)',
        borderColor: '#f5a623',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(245,166,35,0.38)',
      }]
    },
    options: barChartOptions('R$')
  });

  // Source donut
  destroyChart('finFonte');
  const fontes = {};
  data.forEach(r => { if (r.fonte && r.fonte !== '—') fontes[r.fonte] = (fontes[r.fonte] || 0) + 1; });
  const palette = CHART_OPTS.palette;

  const ctx2 = $('fin-chart-fonte').getContext('2d');
  charts.finFonte = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: Object.keys(fontes),
      datasets: [{
        data: Object.values(fontes),
        backgroundColor: palette.map(c => c + '44'),
        borderColor: palette,
        borderWidth: 1.5,
      }]
    },
    options: doughnutChartOptions()
  });
}

function renderFinRankings(data) {
  // SDR ranking
  const sdrMap = {};
  data.forEach(r => { if (r.sdr && r.sdr !== '—') sdrMap[r.sdr] = (sdrMap[r.sdr] || 0) + r.valor; });
  const sdrSorted = Object.entries(sdrMap).sort((a,b) => b[1]-a[1]).slice(0,6);
  const sdrMax = sdrSorted[0]?.[1] || 1;
  $('fin-sdr-rank').innerHTML = sdrSorted.length ? `<div class="rank-list">${sdrSorted.map(([n,v]) => `
    <div class="rank-item">
      <span class="rank-name" title="${n}">${n}</span>
      <div class="rank-bar-wrap"><div class="rank-bar blue" style="width:${Math.round(v/sdrMax*100)}%"></div></div>
      <span class="rank-val">${fmtBRL(v)}</span>
    </div>`).join('')}</div>` : '<p style="color:var(--text-3);font-size:13px">Sem dados</p>';

  // Procedure ranking
  const procMap = {};
  data.forEach(r => { if (r.procedimento && r.procedimento !== '—') procMap[r.procedimento] = (procMap[r.procedimento] || 0) + 1; });
  const procSorted = Object.entries(procMap).sort((a,b) => b[1]-a[1]).slice(0,6);
  const procMax = procSorted[0]?.[1] || 1;
  $('fin-proc-rank').innerHTML = procSorted.length ? `<div class="rank-list">${procSorted.map(([n,v]) => `
    <div class="rank-item">
      <span class="rank-name" title="${n}">${n}</span>
      <div class="rank-bar-wrap"><div class="rank-bar purple" style="width:${Math.round(v/procMax*100)}%"></div></div>
      <span class="rank-val">${v} lead${v !== 1 ? 's' : ''}</span>
    </div>`).join('')}</div>` : '<p style="color:var(--text-3);font-size:13px">Sem dados</p>';
}

const FONTE_MAP = { 'meta ads': 'f-meta', 'facebook ads': 'f-meta', 'facebook': 'f-meta', 'instagram': 'f-insta', 'google ads': 'f-google', 'google': 'f-google', 'indicação': 'f-indicacao', 'indicacao': 'f-indicacao' };
const fonteClass = f => FONTE_MAP[(f||'').toLowerCase()] || 'f-outro';
const fmtDate = s => { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; };

function renderFinTable(data) {
  $('fin-count-pill').textContent = data.length + ' registro' + (data.length !== 1 ? 's' : '');
  $('fin-tbody').innerHTML = data.map(r => `<tr>
    <td title="${r.nome}">${r.nome}</td>
    <td>${r.sdr}</td>
    <td><span class="fonte-tag ${fonteClass(r.fonte)}">${r.fonte}</span></td>
    <td>${r.procedimento}</td>
    <td>${fmtDate(r.fechamento)}</td>
    <td>${r.valor > 0 ? fmtBRL(r.valor) : '—'}</td>
    <td><span class="status-dot ${r.valor > 0 ? 's-pago' : 's-pendente'}"></span>${r.valor > 0 ? 'Pago' : 'Pendente'}</td>
  </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-3);padding:20px">Nenhum registro no período</td></tr>';
}

// ══════════════════════════════════════════════
// AI ANALYSIS via Claude API
// ══════════════════════════════════════════════
async function generateAIAnalysis(platform) {
  const bodyId = platform + '-ai-body';
  const body   = $(bodyId);

  body.innerHTML = `<div class="ai-loading"><div class="spinner"></div> Analisando dados com IA…</div>`;

  try {
    const context = buildAIContext(platform);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Você é um especialista sênior em marketing digital com foco em ${platform === 'meta' ? 'Meta Ads (Facebook/Instagram)' : 'Google Ads'}. 
Sua função é analisar métricas de campanhas e fornecer insights acionáveis e profissionais em português.
Seja específico, direto e estratégico. Foque em:
1. Diagnóstico do período analisado
2. Pontos positivos de performance
3. Pontos de atenção e riscos
4. Recomendações concretas de otimização

Responda APENAS em JSON no formato:
{
  "resumo": "texto do resumo executivo",
  "positivos": "texto dos pontos positivos",
  "atencao": "texto dos pontos de atenção",
  "acoes": "texto das ações recomendadas"
}`,
        messages: [{ role: 'user', content: context }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(i => i.text || '').join('') || '';

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      body.innerHTML = `<div class="ai-analysis"><div class="ai-section summary"><div class="ai-section-label">📊 Análise</div><p>${text}</p></div></div>`;
      return;
    }

    body.innerHTML = `<div class="ai-analysis">
      <div class="ai-section summary">
        <div class="ai-section-label">📊 Resumo Executivo</div>
        <p>${parsed.resumo || '—'}</p>
      </div>
      <div class="ai-section positive">
        <div class="ai-section-label">✅ Pontos Positivos</div>
        <p>${parsed.positivos || '—'}</p>
      </div>
      <div class="ai-section warning">
        <div class="ai-section-label">⚠️ Pontos de Atenção</div>
        <p>${parsed.atencao || '—'}</p>
      </div>
      <div class="ai-section action">
        <div class="ai-section-label">🎯 Ações Recomendadas</div>
        <p>${parsed.acoes || '—'}</p>
      </div>
    </div>`;
  } catch (err) {
    body.innerHTML = `<div class="ai-placeholder" style="color:var(--red)">Erro ao gerar análise: ${err.message}</div>`;
  }
}

function buildAIContext(platform) {
  if (platform === 'meta' && metaData) {
    const t = metaData.totals;
    const startDate = $('meta-start-date').value;
    const endDate   = $('meta-end-date').value;
    return `Analise as seguintes métricas de Meta Ads:

Período: ${startDate} a ${endDate}
Valor Investido: ${fmtBRL(t.amountSpent || 0)}
Visitas (Cliques Únicos): ${fmtNum(t.uniqueClicks || 0)}
Novos Seguidores: ${fmtNum(t.followers || 0)}
Custo por Seguidor: ${t.followers > 0 ? fmtBRL((t.amountSpent||0) / t.followers) : 'N/A'}
Novas Mensagens: ${fmtNum(t.messages || 0)}
Custo por Mensagem: ${t.messages > 0 ? fmtBRL((t.amountSpent||0) / t.messages) : 'N/A'}
Leads Formulário: ${fmtNum(t.leads || 0)}
Custo por Lead: ${t.leads > 0 ? fmtBRL((t.amountSpent||0) / t.leads) : 'N/A'}
Alcance: ${fmtNum(t.reach || 0)}
Impressões: ${fmtNum(t.impressions || 0)}
CPM: ${fmtBRL(t.cpm || 0)}
CTR Único: ${t.reach > 0 ? fmtPct((t.uniqueClicks||0) / t.reach * 100) : '0%'}
Número de Campanhas: ${(metaData.campaigns || []).length}`;
  }

  if (platform === 'google' && googleData) {
    const t = googleData.totals;
    const startDate = $('google-start-date').value;
    const endDate   = $('google-end-date').value;
    return `Analise as seguintes métricas de Google Ads:

Período: ${startDate} a ${endDate}
Investimento: ${fmtBRL(t.spent || 0)}
Impressões: ${fmtNum(t.impressions || 0)}
Cliques: ${fmtNum(t.clicks || 0)}
CTR: ${t.impressions > 0 ? fmtPct((t.clicks||0) / t.impressions * 100) : '0%'}
CPC Médio: ${fmtBRL(t.cpc || 0)}
Conversões: ${fmtNum(t.conversions || 0)}
Custo por Conversão: ${t.conversions > 0 ? fmtBRL((t.spent||0) / t.conversions) : 'N/A'}
Cidades Ativas: ${t.cities || 0}`;
  }

  return 'Dados insuficientes para análise. Por favor, carregue os dados primeiro.';
}

// ══════════════════════════════════════════════
// ADMIN PANEL
// ══════════════════════════════════════════════
$('admin-panel-btn').addEventListener('click', () => {
  openAdminModal();
});

$('close-admin-modal').addEventListener('click', () => {
  $('admin-modal').style.display = 'none';
});

$('admin-modal').addEventListener('click', e => {
  if (e.target === $('admin-modal')) $('admin-modal').style.display = 'none';
});

document.querySelectorAll('.mtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mtab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.mtab-content[data-tab="${tab.dataset.tab}"]`).classList.add('active');
    if (tab.dataset.tab === 'clients')  renderClientsTable();
    if (tab.dataset.tab === 'accounts') renderAccountsTable();
    if (tab.dataset.tab === 'api')      $('api-key').value = getApiKey();
  });
});

function openAdminModal() {
  $('admin-modal').style.display = 'flex';
  renderClientsTable();
  renderAccountsTable();
  $('api-key').value = getApiKey();
}

// Clients
function renderClientsTable() {
  const clients = getClients();
  $('clients-table').innerHTML = clients.map(c => `<tr>
    <td>${c.name}</td>
    <td style="font-family:monospace;font-size:12px;color:var(--text-3)">${c.password}</td>
    <td>
      <button class="btn-edit edit-client-btn" data-id="${c.id}">Editar</button>
      <button class="btn-del delete-client-btn" data-id="${c.id}">Excluir</button>
    </td>
  </tr>`).join('');
}

$('clients-table').addEventListener('click', e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  if (btn.classList.contains('edit-client-btn')) {
    const c = getClients().find(x => x.id === id);
    if (c) openClientModal(c);
  } else if (btn.classList.contains('delete-client-btn')) {
    if (confirm('Excluir este cliente?')) {
      deleteClient(id);
      renderClientsTable();
    }
  }
});

$('add-client-btn').addEventListener('click', () => openClientModal(null));

function openClientModal(client) {
  $('client-id').value          = client?.id || '';
  $('client-modal-title').textContent = client ? 'Editar Cliente' : 'Adicionar Cliente';
  $('client-name').value        = client?.name     || '';
  $('client-password').value    = client?.password || '';
  $('client-sheets-url').value  = client?.sheetsUrl || '';
  $('client-modal').style.display = 'flex';
}

$('close-client-modal').addEventListener('click', () => $('client-modal').style.display = 'none');
$('client-modal').addEventListener('click', e => { if (e.target === $('client-modal')) $('client-modal').style.display = 'none'; });

$('save-client-btn').addEventListener('click', () => {
  const id   = $('client-id').value ? parseInt($('client-id').value) : null;
  const name = $('client-name').value.trim();
  const pass = $('client-password').value;
  const url  = $('client-sheets-url').value.trim();
  if (!name) return alert('Nome obrigatório');
  if (!id && !pass) return alert('Senha obrigatória');
  if (id) updateClient(id, { name, password: pass || undefined, sheetsUrl: url });
  else    createClient({ name, password: pass, sheetsUrl: url });
  renderClientsTable();
  $('client-modal').style.display = 'none';
});

// Accounts
function renderAccountsTable() {
  const clients  = getClients();
  const accounts = getAccounts();
  $('accounts-table').innerHTML = accounts.map(a => {
    const client = clients.find(c => c.id === a.clientId);
    return `<tr>
      <td>${client?.name || '—'}</td>
      <td>${a.name}</td>
      <td style="font-family:monospace;font-size:12px;color:var(--text-3)">${a.accountId}</td>
      <td>
        <button class="btn-edit edit-account-btn" data-id="${a.id}">Editar</button>
        <button class="btn-del delete-account-btn" data-id="${a.id}">Excluir</button>
      </td>
    </tr>`;
  }).join('');
}

$('accounts-table').addEventListener('click', e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = parseInt(btn.dataset.id);
  if (btn.classList.contains('edit-account-btn')) {
    const a = getAccounts().find(x => x.id === id);
    if (a) openAccountModal(a);
  } else if (btn.classList.contains('delete-account-btn')) {
    if (confirm('Excluir esta conta de anúncio?')) {
      deleteAccount(id);
      renderAccountsTable();
    }
  }
});

$('add-account-btn').addEventListener('click', () => openAccountModal(null));

function openAccountModal(account) {
  const clients = getClients();
  $('account-client-select').innerHTML = '<option value="">Selecione um cliente</option>' +
    clients.map(c => `<option value="${c.id}" ${account?.clientId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
  $('account-id').value           = account?.id || '';
  $('account-modal-title').textContent = account ? 'Editar Conta' : 'Adicionar Conta';
  $('account-name').value         = account?.name      || '';
  $('account-id-input').value     = account?.accountId || '';
  $('account-modal').style.display = 'flex';
}

$('close-account-modal').addEventListener('click', () => $('account-modal').style.display = 'none');
$('account-modal').addEventListener('click', e => { if (e.target === $('account-modal')) $('account-modal').style.display = 'none'; });

$('save-account-btn').addEventListener('click', () => {
  const id        = $('account-id').value ? parseInt($('account-id').value) : null;
  const clientId  = parseInt($('account-client-select').value);
  const name      = $('account-name').value.trim();
  const accountId = $('account-id-input').value.trim();
  if (!clientId || !name || !accountId) return alert('Todos os campos são obrigatórios');
  if (!accountId.startsWith('act_')) return alert('ID deve começar com act_');
  if (id) updateAccount(id, { clientId, name, accountId });
  else    createAccount({ clientId, name, accountId });
  renderAccountsTable();
  $('account-modal').style.display = 'none';
});

// API Key
$('save-api-btn').addEventListener('click', () => {
  setApiKey($('api-key').value.trim());
  alert('Token salvo!');
});

// ══════════════════════════════════════════════
// CHART HELPERS
// ══════════════════════════════════════════════
function barChartOptions(prefix) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: CHART_OPTS.tickColor, font: { size: 11, family: 'DM Sans' }, maxRotation: 35 },
        grid: { color: CHART_OPTS.gridColor },
        border: { color: 'transparent' }
      },
      y: {
        ticks: {
          color: CHART_OPTS.tickColor,
          font: { size: 11, family: 'DM Sans' },
          callback: v => prefix ? (prefix + ' ' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v)) : v
        },
        grid: { color: CHART_OPTS.gridColor },
        border: { color: 'transparent' }
      }
    }
  };
}

function lineChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: CHART_OPTS.tickColor, font: { size: 11 }, maxRotation: 35 }, grid: { color: CHART_OPTS.gridColor }, border: { color: 'transparent' } },
      y: { ticks: { color: CHART_OPTS.tickColor, font: { size: 11 } }, grid: { color: CHART_OPTS.gridColor }, border: { color: 'transparent' } }
    }
  };
}

function doughnutChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { color: 'rgba(255,255,255,.38)', font: { size: 11, family: 'DM Sans' }, boxWidth: 10, boxHeight: 10, padding: 12 }
      }
    }
  };
}

// ══════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════
(function init() {
  const user = checkAuth();
  if (user) showApp(user);
  else      showLogin();
})();
