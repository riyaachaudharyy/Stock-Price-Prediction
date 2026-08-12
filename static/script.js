/**
 * ============================================================
 * EQUITYLENS — FRONTEND ENGINE (SPINNER, AUTO-RESIZE & ACCORDION)
 * ============================================================
 */

const AppState = {
    currentUser: null,
    theme: localStorage.getItem('equitylens_theme') || 'dark',
    activeTicker: null,
    activeTimeframe: '1M',
    stockData: null,
    predictions: null,
    watchlist: [],
    analysisMetrics: {
        rsi: null,
        macd: null,
        volumeSignal: null,
        emaSignal: null
    },
    compareData: null,
    activeCompareTickers: [],
    autoRefreshTimer: null,
    autoRefreshIntervalMs: 120000
};

const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById('themeToggle'),
    themeIcon: document.getElementById('themeIcon'),
    mobileToggle: document.getElementById('mobileToggle'),
    navLinks: document.getElementById('navLinks'),
    guestControls: document.getElementById('guestControls'),
    userControls: document.getElementById('userControls'),
    loginBtn: document.getElementById('loginBtn'),
    signupBtn: document.getElementById('signupBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    userAvatar: document.getElementById('userAvatar'),
    usernameDisplay: document.getElementById('usernameDisplay'),
    authModal: document.getElementById('authModal'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    tabLoginBtn: document.getElementById('tabLoginBtn'),
    tabSignupBtn: document.getElementById('tabSignupBtn'),
    loginForm: document.getElementById('loginForm'),
    signupForm: document.getElementById('signupForm'),
    authAlert: document.getElementById('authAlert'),
    loginUsername: document.getElementById('loginUsername'),
    loginPassword: document.getElementById('loginPassword'),
    signupUsername: document.getElementById('signupUsername'),
    signupEmail: document.getElementById('signupEmail'),
    signupPassword: document.getElementById('signupPassword'),
    stockSearchForm: document.getElementById('stockSearchForm'),
    tickerInput: document.getElementById('tickerInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),
    searchSpinner: document.getElementById('searchSpinner'),
    trendingChips: document.getElementById('trendingChips'),
    analysisWorkspace: document.getElementById('analysisWorkspace'),
    overviewTicker: document.getElementById('overviewTicker'),
    overviewPrice: document.getElementById('overviewPrice'),
    overviewChange: document.getElementById('overviewChange'),
    overviewPrevClose: document.getElementById('overviewPrevClose'),
    overviewOpen: document.getElementById('overviewOpen'),
    overviewDayRange: document.getElementById('overviewDayRange'),
    overviewVolume: document.getElementById('overviewVolume'),
    low52: document.getElementById('low52'),
    high52: document.getElementById('high52'),
    range52Fill: document.getElementById('range52Fill'),
    addWatchlistBtn: document.getElementById('addWatchlistBtn'),
    watchlistStar: document.getElementById('watchlistStar'),
    timeframeSelector: document.getElementById('timeframeSelector'),
    emaToggles: document.getElementById('emaToggles'),
    sigEma: document.getElementById('sigEma'),
    sigRsi: document.getElementById('sigRsi'),
    sigMacd: document.getElementById('sigMacd'),
    sigVolume: document.getElementById('sigVolume'),
    consensusBadge: document.getElementById('consensusBadge'),
    consensusDesc: document.getElementById('consensusDesc'),
    saveAnalysisBtn: document.getElementById('saveAnalysisBtn'),
    metricMae: document.getElementById('metricMae'),
    metricRmse: document.getElementById('metricRmse'),
    metricR2: document.getElementById('metricR2'),
    toggleStatsBtn: document.getElementById('toggleStatsBtn'),
    statsChevron: document.getElementById('statsChevron'),
    statsContent: document.getElementById('statsContent'),
    statMean: document.getElementById('statMean'),
    statMedian: document.getElementById('statMedian'),
    statStd: document.getElementById('statStd'),
    statMin: document.getElementById('statMin'),
    statMax: document.getElementById('statMax'),
    statQ1: document.getElementById('statQ1'),
    statQ3: document.getElementById('statQ3'),
    exportHistoryCsvBtn: document.getElementById('exportHistoryCsvBtn'),
    exportForecastCsvBtn: document.getElementById('exportForecastCsvBtn'),
    exportFullJsonBtn: document.getElementById('exportFullJsonBtn'),
    compareForm: document.getElementById('compareForm'),
    compareTicker1: document.getElementById('compareTicker1'),
    compareTicker2: document.getElementById('compareTicker2'),
    compareTicker3: document.getElementById('compareTicker3'),
    runCompareBtn: document.getElementById('runCompareBtn'),
    compareSpinner: document.getElementById('compareSpinner'),
    compareWorkspace: document.getElementById('compareWorkspace'),
    compareMetricsTable: document.getElementById('compareMetricsTable'),
    compTh1: document.getElementById('compTh1'),
    compTh2: document.getElementById('compTh2'),
    compTh3: document.getElementById('compTh3'),
    compareTableBody: document.getElementById('compareTableBody'),
    individualChartsGrid: document.getElementById('individualChartsGrid'),
    watchlistTableBody: document.getElementById('watchlistTableBody'),
    inlineAddWatchlistBtn: document.getElementById('inlineAddWatchlistBtn'),
    addWatchlistInput: document.getElementById('addWatchlistInput'),
    historyTableBody: document.getElementById('historyTableBody'),
    dashWatchlistCount: document.getElementById('dashWatchlistCount'),
    dashAnalysisCount: document.getElementById('dashAnalysisCount'),
    toastContainer: document.getElementById('toastContainer')
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEventListeners();
    checkAuthentication();
    startAutoRefreshLoop();

    window.addEventListener('resize', () => {
        if (AppState.stockData) renderCharts();
        if (AppState.compareData) renderComparisonCharts(AppState.compareData);
    });
});

function safeText(element, value) {
    if (element) element.textContent = value ?? '';
}

function formatNumber(value, decimals = 2) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return number.toFixed(decimals);
}

function formatCurrency(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '--';
    return `$${number.toFixed(2)}`;
}

function normalizeTicker(ticker) {
    return String(ticker || '').trim().toUpperCase().replace(/[^A-Z0-9.\-]/g, '');
}

async function apiRequest(url, options = {}) {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });

    let data;
    try {
        data = await response.json();
    } catch {
        data = { success: false, message: `Server returned HTTP ${response.status}` };
    }

    if (!response.ok && data.success !== true) {
        throw new Error(data.message || `Request failed with HTTP ${response.status}`);
    }
    return data;
}

function initTheme() {
    if (DOM.html) {
        DOM.html.setAttribute('data-theme', AppState.theme);
        updateThemeIcon();
    }
}

function toggleTheme() {
    AppState.theme = AppState.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('equitylens_theme', AppState.theme);
    DOM.html?.setAttribute('data-theme', AppState.theme);
    updateThemeIcon();
    if (AppState.stockData) renderCharts();
    if (AppState.compareData) renderComparisonCharts(AppState.compareData);
}

function updateThemeIcon() {
    if (DOM.themeIcon) {
        DOM.themeIcon.className = AppState.theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
}

function showToast(message, type = 'success') {
    if (!DOM.toastContainer) return;
    const existing = Array.from(DOM.toastContainer.children);
    if (existing.some(t => t.textContent.includes(message))) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-circle-info"></i><span>${escapeHtml(message)}</span>`;

    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function checkAuthentication() {
    try {
        const data = await apiRequest('/check-auth');
        if (data.authenticated) setAuthenticatedUI(data.user);
        else setGuestUI();
    } catch (error) {
        setGuestUI();
    }
}

function setAuthenticatedUI(user) {
    AppState.currentUser = user;
    DOM.guestControls?.classList.add('hidden');
    DOM.userControls?.classList.remove('hidden');

    safeText(DOM.usernameDisplay, user?.username || 'User');
    safeText(DOM.userAvatar, (user?.username || 'U').charAt(0).toUpperCase());

    document.querySelectorAll('.auth-required').forEach(el => {
        el.style.display = 'block';
        el.classList.remove('hidden');
    });

    loadWatchlist();
    loadAnalysisHistory();
}

function setGuestUI() {
    AppState.currentUser = null;
    AppState.watchlist = [];
    DOM.guestControls?.classList.remove('hidden');
    DOM.userControls?.classList.add('hidden');

    document.querySelectorAll('.auth-required').forEach(el => el.style.display = 'none');
}

/* SMART AUTO-REFRESH ENGINE */
function startAutoRefreshLoop() {
    if (AppState.autoRefreshTimer) clearInterval(AppState.autoRefreshTimer);

    AppState.autoRefreshTimer = setInterval(() => {
        if (AppState.activeTicker) {
            executeStockAnalysis(AppState.activeTicker, true);
        }

        if (AppState.activeCompareTickers && AppState.activeCompareTickers.length >= 2) {
            executeStockComparison(AppState.activeCompareTickers, true);
        }

        if (AppState.currentUser) {
            loadWatchlist();
        }
    }, AppState.autoRefreshIntervalMs);
}

/* TECHNICAL INDICATORS */
function calculateEMA(prices, period) {
    if (!Array.isArray(prices) || prices.length === 0) return [];
    period = Math.max(1, Number(period));
    const ema = [];
    const multiplier = 2 / (period + 1);
    let previous = Number(prices[0]);
    ema.push(previous);

    for (let i = 1; i < prices.length; i++) {
        const current = Number(prices[i]);
        previous = (current - previous) * multiplier + previous;
        ema.push(previous);
    }
    return ema;
}

function calculateRSI(prices, period = 14) {
    if (!Array.isArray(prices) || prices.length < 2) return [];
    period = Math.max(1, Number(period));
    const rsi = new Array(prices.length).fill(50);
    if (prices.length <= period) return rsi;

    let gains = 0, losses = 0;
    for (let i = 1; i <= period; i++) {
        const diff = Number(prices[i]) - Number(prices[i - 1]);
        if (diff >= 0) gains += diff; else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    const getRSI = (g, l) => l === 0 ? 100 : 100 - (100 / (1 + (g / l)));
    rsi[period] = getRSI(avgGain, avgLoss);

    for (let i = period + 1; i < prices.length; i++) {
        const diff = Number(prices[i]) - Number(prices[i - 1]);
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? Math.abs(diff) : 0;
        avgGain = ((avgGain * (period - 1)) + gain) / period;
        avgLoss = ((avgLoss * (period - 1)) + loss) / period;
        rsi[i] = getRSI(avgGain, avgLoss);
    }
    return rsi;
}

function calculateMACD(prices) {
    if (!Array.isArray(prices) || prices.length === 0) return { macdLine: [], signalLine: [] };
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12.map((v, i) => v - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    return { macdLine, signalLine };
}

/* STOCK ANALYSIS ENGINE WITH VISIBLE PULSING SPINNER */
async function executeStockAnalysis(ticker, isSilentAutoRefresh = false) {
    ticker = normalizeTicker(ticker);
    if (!ticker) {
        if (!isSilentAutoRefresh) showToast('Please enter a valid stock ticker.', 'error');
        return;
    }

    if (!isSilentAutoRefresh) {
        DOM.searchSpinner?.classList.remove('hidden');
    }

    try {
        const data = await apiRequest(`/api/stock/${encodeURIComponent(ticker)}`);
        if (!data || !data.success || !Array.isArray(data.history)) {
            throw new Error(data.message || 'Invalid stock response');
        }

        AppState.stockData = data;
        AppState.activeTicker = ticker;

        try {
            const predData = await apiRequest('/api/predict', {
                method: 'POST',
                body: JSON.stringify({ ticker })
            });
            if (predData && predData.success) {
                AppState.predictions = predData;
            }
        } catch (predErr) {
            console.warn('Prediction API failed:', predErr);
        }

        renderOverview(data);
        renderSignalsAndConsensus(data);
        renderDescriptiveStatistics(data.history);
        renderCharts();
        updateWatchlistButton();

        DOM.analysisWorkspace?.classList.remove('hidden');
        if (!isSilentAutoRefresh) {
            DOM.analysisWorkspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            showToast(`Auto-refreshed live market data for ${ticker}`, 'info');
        }

    } catch (error) {
        if (!isSilentAutoRefresh) showToast(error.message || 'Unable to analyze stock ticker.', 'error');
    } finally {
        if (!isSilentAutoRefresh) {
            DOM.searchSpinner?.classList.add('hidden');
        }
    }
}

function renderOverview(data) {
    safeText(DOM.overviewTicker, data.ticker);
    safeText(DOM.overviewPrice, formatCurrency(data.current_price));

    const history = data.history;
    const latest = history[history.length - 1];
    const prev = history.length > 1 ? history[history.length - 2].close : latest.close;
    const change = data.current_price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    const isPositive = change >= 0;

    if (DOM.overviewChange) {
        DOM.overviewChange.className = `price-change-pill ${isPositive ? 'positive' : 'negative'}`;
        DOM.overviewChange.textContent = `${isPositive ? '+' : ''}${formatNumber(change)} (${isPositive ? '+' : ''}${formatNumber(changePct)}%)`;
    }

    safeText(DOM.overviewPrevClose, formatCurrency(prev));
    safeText(DOM.overviewOpen, formatCurrency(latest.open));
    safeText(DOM.overviewDayRange, `${formatCurrency(latest.low)} - ${formatCurrency(latest.high)}`);
    safeText(DOM.overviewVolume, Number(latest.volume || 0).toLocaleString());

    const closes = history.map(i => i.close);
    const low52 = Math.min(...closes);
    const high52 = Math.max(...closes);

    safeText(DOM.low52, formatCurrency(low52));
    safeText(DOM.high52, formatCurrency(high52));

    if (DOM.range52Fill) {
        const range = high52 - low52;
        let pct = range > 0 ? ((data.current_price - low52) / range) * 100 : 50;
        DOM.range52Fill.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }
}

function renderSignalsAndConsensus(data) {
    const closes = data.history.map(item => Number(item.close)).filter(Number.isFinite);
    if (!closes.length) return;

    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const rsiArray = calculateRSI(closes, 14);
    const lastRsi = rsiArray.length ? rsiArray[rsiArray.length - 1] : 50;
    const { macdLine, signalLine } = calculateMACD(closes);
    const lastMacd = macdLine.length ? macdLine[macdLine.length - 1] : 0;
    const lastSignal = signalLine.length ? signalLine[signalLine.length - 1] : 0;

    const emaBullish = ema20[ema20.length - 1] > ema50[ema50.length - 1];
    safeText(DOM.sigEma, emaBullish ? 'Bullish (20 > 50)' : 'Bearish (20 < 50)');

    let rsiText = 'Neutral';
    if (lastRsi > 70) rsiText = `Overbought (${formatNumber(lastRsi, 1)})`;
    else if (lastRsi < 30) rsiText = `Oversold (${formatNumber(lastRsi, 1)})`;
    else rsiText = `Neutral (${formatNumber(lastRsi, 1)})`;
    safeText(DOM.sigRsi, rsiText);

    const macdBullish = lastMacd > lastSignal;
    safeText(DOM.sigMacd, macdBullish ? 'Bullish Crossover' : 'Bearish Crossover');
    safeText(DOM.sigVolume, 'Normal Volume');

    let score = (emaBullish ? 2 : -2) + (macdBullish ? 2 : -2) + (lastRsi < 30 ? 1 : lastRsi > 70 ? -1 : 0);
    let badge = '🟡 Neutral';
    if (score >= 2) badge = '🟢 Bullish';
    else if (score <= -2) badge = '🔴 Bearish';

    safeText(DOM.consensusBadge, badge);
}

function renderDescriptiveStatistics(history) {
    const closes = history.map(i => Number(i.close)).filter(Number.isFinite).sort((a, b) => a - b);
    const n = closes.length;
    if (!n) return;

    const mean = closes.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 0 ? (closes[n/2 - 1] + closes[n/2]) / 2 : closes[Math.floor(n/2)];
    const variance = closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    safeText(DOM.statMean, formatCurrency(mean));
    safeText(DOM.statMedian, formatCurrency(median));
    safeText(DOM.statStd, formatCurrency(std));
    safeText(DOM.statMin, formatCurrency(closes[0]));
    safeText(DOM.statMax, formatCurrency(closes[n - 1]));
    safeText(DOM.statQ1, formatCurrency(closes[Math.floor((n - 1) * 0.25)]));
    safeText(DOM.statQ3, formatCurrency(closes[Math.floor((n - 1) * 0.75)]));
}

function getTimeframeData(history) {
    if (!Array.isArray(history) || history.length === 0) return [];
    const sizeMap = {
        '1D': 1,
        '1W': 7,
        '1M': 30,
        '3M': 90,
        '6M': 180,
        '1Y': 365,
        'ALL': history.length
    };
    const count = sizeMap[AppState.activeTimeframe] || 30;
    return history.slice(-Math.min(count, history.length));
}

function renderCharts() {
    if (!AppState.stockData || typeof Plotly === 'undefined') return;

    const history = getTimeframeData(AppState.stockData.history);
    const isDark = AppState.theme === 'dark';
    const bg = isDark ? '#0D121E' : '#FFFFFF';
    const textColor = isDark ? '#F1F5F9' : '#0F172A';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    const dates = history.map(i => i.date);
    const opens = history.map(i => i.open);
    const highs = history.map(i => i.high);
    const lows = history.map(i => i.low);
    const closes = history.map(i => i.close);
    const volumes = history.map(i => i.volume);

    const candleTrace = {
        x: dates, open: opens, high: highs, low: lows, close: closes,
        type: 'candlestick',
        increasing: { line: { color: '#00E676', width: 1.5 } },
        decreasing: { line: { color: '#FF5252', width: 1.5 } },
        name: 'OHLC'
    };

    const dataTraces = [candleTrace];
    const selectedEMAs = DOM.emaToggles ? Array.from(DOM.emaToggles.querySelectorAll('input:checked')).map(cb => Number(cb.value)) : [];
    const emaColors = { 20: '#00f2fe', 50: '#FFAB00', 100: '#D500F9', 200: '#00E676' };

    selectedEMAs.forEach(period => {
        if (closes.length >= period) {
            const ema = calculateEMA(closes, period);
            dataTraces.push({
                x: dates, y: ema, type: 'scatter', mode: 'lines',
                line: { color: emaColors[period] || '#FFF', width: 1.5 },
                name: `EMA ${period}`
            });
        }
    });

    const layout = {
        autosize: true,
        paper_bgcolor: bg, plot_bgcolor: bg,
        font: { color: textColor, family: 'Inter, sans-serif', size: 11 },
        margin: { t: 15, r: 15, l: 40, b: 25 },
        xaxis: { gridcolor: gridColor, rangeslider: { visible: false } },
        yaxis: { gridcolor: gridColor, fixedrange: false },
        legend: { orientation: 'h', y: 1.15 }
    };

    Plotly.react('plotlyMainChart', dataTraces, layout, { responsive: true, displayModeBar: false });

    // Volume Chart
    const volTrace = {
        x: dates, y: volumes, type: 'bar',
        marker: { color: 'rgba(0, 242, 254, 0.35)' },
        name: 'Volume'
    };
    Plotly.react('plotlyVolumeChart', [volTrace], { ...layout, margin: { t: 5, r: 15, l: 40, b: 20 } }, { responsive: true, displayModeBar: false });

    // Forecast Chart
    if (AppState.predictions) {
        const futDates = AppState.predictions.future_dates || [];
        const preds = AppState.predictions.predictions || [];

        const forecastTrace = {
            x: futDates, y: preds,
            type: 'scatter', mode: 'lines+markers',
            line: { color: '#D500F9', width: 2, dash: 'dot' },
            name: 'LSTM Forecast'
        };

        Plotly.react('plotlyForecastChart', [forecastTrace], layout, { responsive: true, displayModeBar: false });

        safeText(DOM.metricMae, formatMetric(AppState.predictions.mae));
        safeText(DOM.metricRmse, formatMetric(AppState.predictions.rmse));
        safeText(DOM.metricR2, formatMetric(AppState.predictions.r2));
    }
}

function formatMetric(val) {
    const num = Number(val);
    return Number.isFinite(num) ? num.toFixed(4) : '--';
}

/* STOCK COMPARISON ENGINE WITH VISIBLE SPINNER AND RESIZE TRIGGER */
async function executeStockComparison(tickers, isSilentAutoRefresh = false) {
    if (!Array.isArray(tickers) || tickers.length < 2) {
        if (!isSilentAutoRefresh) showToast('Please enter at least 2 tickers to compare.', 'error');
        return;
    }
    if (tickers.length > 3) {
        if (!isSilentAutoRefresh) showToast('Maximum 3 tickers allowed for comparison.', 'error');
        return;
    }

    AppState.activeCompareTickers = tickers;
    if (!isSilentAutoRefresh) {
        DOM.compareSpinner?.classList.remove('hidden');
    }

    try {
        const data = await apiRequest('/api/compare', {
            method: 'POST',
            body: JSON.stringify({ tickers })
        });

        if (!data || !data.success || !Array.isArray(data.results)) {
            throw new Error(data.message || 'Comparison failed');
        }

        AppState.compareData = data.results;
        renderComparisonWorkspace(data.results, isSilentAutoRefresh);
        if (!isSilentAutoRefresh) showToast(`Successfully compared ${data.results.length} stocks.`);

    } catch (error) {
        if (!isSilentAutoRefresh) showToast(error.message || 'Error executing stock comparison.', 'error');
    } finally {
        if (!isSilentAutoRefresh) {
            DOM.compareSpinner?.classList.add('hidden');
        }
    }
}

function renderComparisonWorkspace(results, isSilentAutoRefresh = false) {
    DOM.compareWorkspace?.classList.remove('hidden');
    renderIndividualStockGraphs(results);
    renderComparisonTable(results);
    renderComparisonCharts(results);
    if (!isSilentAutoRefresh) {
        DOM.compareWorkspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/* SIDE-BY-SIDE INDIVIDUAL CHARTS RENDERER WITH RESIZE TRIGGER */
function renderIndividualStockGraphs(results) {
    if (!DOM.individualChartsGrid) return;
    DOM.individualChartsGrid.innerHTML = '';

    results.forEach((item, index) => {
        const cardId = `indiv_chart_${index}`;
        const card = document.createElement('div');
        card.className = 'individual-stock-card';
        card.innerHTML = `
            <div class="individual-stock-header">
                <span class="individual-stock-title">${escapeHtml(item.ticker)}</span>
                <span class="badge-tag">${formatCurrency(item.current_price)}</span>
            </div>
            <div id="${cardId}" class="individual-chart-box"></div>
        `;
        DOM.individualChartsGrid.appendChild(card);

        const history = item.history || [];
        const isDark = AppState.theme === 'dark';
        const bg = isDark ? '#0D121E' : '#FFFFFF';
        const textColor = isDark ? '#F1F5F9' : '#0F172A';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

        const trace = {
            x: history.map(h => h.date),
            y: history.map(h => h.close),
            type: 'scatter', mode: 'lines',
            line: { color: index === 0 ? '#00f2fe' : index === 1 ? '#D500F9' : '#00E676', width: 2 },
            name: `${item.ticker} Close`
        };

        const layout = {
            autosize: true,
            paper_bgcolor: bg, plot_bgcolor: bg,
            font: { color: textColor, family: 'Inter, sans-serif', size: 10 },
            margin: { t: 10, r: 10, l: 30, b: 20 },
            xaxis: { gridcolor: gridColor },
            yaxis: { gridcolor: gridColor }
        };

        Plotly.react(cardId, [trace], layout, { responsive: true, displayModeBar: false });

        // Trigger resize after rendering to ensure side-by-side fit
        setTimeout(() => {
            const container = document.getElementById(cardId);
            if (container) Plotly.Plots.resize(container);
        }, 100);
    });
}

function renderComparisonTable(results) {
    if (!DOM.compareTableBody) return;

    safeText(DOM.compTh1, results[0] ? results[0].ticker : 'Stock 1');
    safeText(DOM.compTh2, results[1] ? results[1].ticker : 'Stock 2');

    if (results[2]) {
        DOM.compTh3?.classList.remove('hidden');
        safeText(DOM.compTh3, results[2].ticker);
    } else {
        DOM.compTh3?.classList.add('hidden');
    }

    const rows = [
        { label: 'Current Price', key: 'current_price', fmt: v => formatCurrency(v) },
        { label: 'LSTM Predicted Price', key: 'predicted_price', fmt: v => formatCurrency(v) },
        { label: 'Expected Change (%)', key: 'expected_change_pct', fmt: v => `${v > 0 ? '+' : ''}${formatNumber(v)}%` },
        { label: 'Model Signal', key: 'signal', fmt: v => v },
        { label: 'Model MAE', key: 'mae', fmt: v => formatMetric(v) },
        { label: 'Model RMSE', key: 'rmse', fmt: v => formatMetric(v) },
        { label: 'Model R²', key: 'r2', fmt: v => formatMetric(v) }
    ];

    DOM.compareTableBody.innerHTML = '';

    rows.forEach(r => {
        const tr = document.createElement('tr');
        const v1 = results[0] ? r.fmt(results[0][r.key]) : '--';
        const v2 = results[1] ? r.fmt(results[1][r.key]) : '--';
        const v3 = results[2] ? r.fmt(results[2][r.key]) : null;

        tr.innerHTML = `
            <td><strong>${escapeHtml(r.label)}</strong></td>
            <td>${escapeHtml(v1)}</td>
            <td>${escapeHtml(v2)}</td>
            ${v3 !== null ? `<td>${escapeHtml(v3)}</td>` : ''}
        `;
        DOM.compareTableBody.appendChild(tr);
    });
}

function renderComparisonCharts(results) {
    if (typeof Plotly === 'undefined') return;

    const isDark = AppState.theme === 'dark';
    const bg = isDark ? '#0D121E' : '#FFFFFF';
    const textColor = isDark ? '#F1F5F9' : '#0F172A';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const colors = ['#00f2fe', '#D500F9', '#00E676'];

    const layoutBase = {
        autosize: true,
        paper_bgcolor: bg, plot_bgcolor: bg,
        font: { color: textColor, family: 'Inter, sans-serif', size: 11 },
        margin: { t: 15, r: 15, l: 40, b: 25 },
        xaxis: { gridcolor: gridColor },
        yaxis: { gridcolor: gridColor },
        legend: { orientation: 'h', y: 1.15 }
    };

    const normTraces = results.map((item, idx) => {
        const history = item.history || [];
        const base = history[0] ? history[0].close : 1;
        const normY = history.map(h => (h.close / base) * 100);

        return {
            x: history.map(h => h.date),
            y: normY,
            type: 'scatter', mode: 'lines',
            line: { color: colors[idx % colors.length], width: 2 },
            name: `${item.ticker} (Base=100)`
        };
    });
    Plotly.react('plotlyCompareNormalized', normTraces, layoutBase, { responsive: true, displayModeBar: false });

    const priceTraces = results.map((item, idx) => ({
        x: item.history.map(h => h.date),
        y: item.history.map(h => h.close),
        type: 'scatter', mode: 'lines',
        line: { color: colors[idx % colors.length], width: 2 },
        name: item.ticker
    }));
    Plotly.react('plotlyComparePrices', priceTraces, layoutBase, { responsive: true, displayModeBar: false });

    const forecastTraces = results.map((item, idx) => ({
        x: item.future_dates || [],
        y: item.predictions || [],
        type: 'scatter', mode: 'lines+markers',
        line: { color: colors[idx % colors.length], width: 2, dash: 'dash' },
        name: `${item.ticker} Forecast`
    }));
    Plotly.react('plotlyCompareForecasts', forecastTraces, layoutBase, { responsive: true, displayModeBar: false });
}

/* WATCHLIST & HISTORY */
async function loadWatchlist() {
    if (!AppState.currentUser) return;
    try {
        const data = await apiRequest('/api/watchlist');
        if (data.success) {
            AppState.watchlist = data.watchlist || [];
            renderWatchlistTable(AppState.watchlist);
            safeText(DOM.dashWatchlistCount, AppState.watchlist.length);
            updateWatchlistButton();
        }
    } catch (err) {
        console.warn('Load watchlist error:', err);
    }
}

function renderWatchlistTable(items) {
    if (!DOM.watchlistTableBody) return;
    DOM.watchlistTableBody.innerHTML = '';

    if (!items.length) {
        DOM.watchlistTableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Watchlist is empty. Add tickers above!</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        const ticker = escapeHtml(item.ticker);
        const added = escapeHtml(String(item.added_at || '').split(' ')[0]);

        tr.innerHTML = `
            <td><strong>${ticker}</strong></td>
            <td>${added}</td>
            <td>
                <button class="btn btn-sm btn-outline analyze-wl-btn" data-ticker="${ticker}">Analyze</button>
                <button class="btn btn-sm btn-outline remove-wl-btn" data-ticker="${ticker}"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        DOM.watchlistTableBody.appendChild(tr);
    });
}

DOM.watchlistTableBody?.addEventListener('click', e => {
    const analyzeBtn = e.target.closest('.analyze-wl-btn');
    const removeBtn = e.target.closest('.remove-wl-btn');
    if (analyzeBtn) executeStockAnalysis(analyzeBtn.dataset.ticker);
    if (removeBtn) removeWatchlist(removeBtn.dataset.ticker);
});

async function removeWatchlist(ticker) {
    try {
        const data = await apiRequest('/api/watchlist', {
            method: 'DELETE',
            body: JSON.stringify({ ticker })
        });
        if (data.success) {
            showToast(`${ticker} removed from watchlist.`);
            loadWatchlist();
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function updateWatchlistButton() {
    if (!AppState.activeTicker) return;
    const exists = AppState.watchlist.some(i => normalizeTicker(i.ticker) === normalizeTicker(AppState.activeTicker));
    if (DOM.watchlistStar) DOM.watchlistStar.className = exists ? 'fa-solid fa-star' : 'fa-regular fa-star';
}

async function loadAnalysisHistory() {
    if (!AppState.currentUser) return;
    try {
        const data = await apiRequest('/api/analyses');
        if (data.success) {
            renderHistoryTable(data.analyses || []);
            safeText(DOM.dashAnalysisCount, (data.analyses || []).length);
        }
    } catch (err) {
        console.warn('Load history error:', err);
    }
}

function renderHistoryTable(items) {
    if (!DOM.historyTableBody) return;
    DOM.historyTableBody.innerHTML = '';

    if (!items.length) {
        DOM.historyTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No saved analyses found.</td></tr>`;
        return;
    }

    items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${escapeHtml(item.ticker)}</strong></td>
            <td>${escapeHtml(String(item.analyzed_at || '').split(' ')[0])}</td>
            <td>${formatCurrency(item.current_price)}</td>
            <td><span class="sig-value badge-bull">${escapeHtml(item.signal || 'Neutral')}</span></td>
            <td>${formatCurrency(item.predicted_price)}</td>
            <td><button class="btn btn-sm btn-outline history-re-btn" data-ticker="${escapeHtml(item.ticker)}">Re-Analyze</button></td>
        `;
        DOM.historyTableBody.appendChild(tr);
    });
}

DOM.historyTableBody?.addEventListener('click', e => {
    const btn = e.target.closest('.history-re-btn');
    if (btn) executeStockAnalysis(btn.dataset.ticker);
});

/* EVENT LISTENERS */
function initEventListeners() {
    DOM.themeToggle?.addEventListener('click', toggleTheme);
    DOM.mobileToggle?.addEventListener('click', () => DOM.navLinks?.classList.toggle('active'));

    DOM.loginBtn?.addEventListener('click', () => { DOM.authModal?.classList.remove('hidden'); DOM.tabLoginBtn?.click(); });
    DOM.signupBtn?.addEventListener('click', () => { DOM.authModal?.classList.remove('hidden'); DOM.tabSignupBtn?.click(); });
    DOM.modalCloseBtn?.addEventListener('click', () => DOM.authModal?.classList.add('hidden'));

    DOM.tabLoginBtn?.addEventListener('click', () => {
        DOM.tabLoginBtn.classList.add('active'); DOM.tabSignupBtn.classList.remove('active');
        DOM.loginForm.classList.remove('hidden'); DOM.signupForm.classList.add('hidden');
    });

    DOM.tabSignupBtn?.addEventListener('click', () => {
        DOM.tabSignupBtn.classList.add('active'); DOM.tabLoginBtn.classList.remove('active');
        DOM.signupForm.classList.remove('hidden'); DOM.loginForm.classList.add('hidden');
    });

    DOM.loginForm?.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            const data = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username: DOM.loginUsername.value, password: DOM.loginPassword.value })
            });
            if (data.success) {
                showToast('Signed in successfully.');
                DOM.authModal?.classList.add('hidden');
                setAuthenticatedUI(data.user);
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    DOM.signupForm?.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            const data = await apiRequest('/signup', {
                method: 'POST',
                body: JSON.stringify({
                    username: DOM.signupUsername.value,
                    email: DOM.signupEmail.value,
                    password: DOM.signupPassword.value
                })
            });
            if (data.success) {
                showToast('Account created successfully.');
                DOM.authModal?.classList.add('hidden');
                setAuthenticatedUI(data.user);
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    DOM.logoutBtn?.addEventListener('click', async () => {
        await apiRequest('/logout', { method: 'POST' });
        showToast('Logged out.');
        setGuestUI();
    });

    DOM.stockSearchForm?.addEventListener('submit', e => {
        e.preventDefault();
        if (DOM.tickerInput?.value) executeStockAnalysis(DOM.tickerInput.value);
    });

    DOM.trendingChips?.addEventListener('click', e => {
        const btn = e.target.closest('.chip-btn');
        if (btn) {
            const sym = btn.dataset.symbol;
            if (DOM.tickerInput) DOM.tickerInput.value = sym;
            executeStockAnalysis(sym);
        }
    });

    DOM.timeframeSelector?.addEventListener('click', e => {
        const btn = e.target.closest('.tf-btn');
        if (!btn) return;
        DOM.timeframeSelector.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.activeTimeframe = btn.dataset.tf || '1M';
        if (AppState.stockData) renderCharts();
    });

    DOM.toggleStatsBtn?.addEventListener('click', () => {
        DOM.statsContent?.classList.toggle('hidden');
        DOM.statsChevron?.classList.toggle('fa-chevron-down');
        DOM.statsChevron?.classList.toggle('fa-chevron-up');
    });

    DOM.compareForm?.addEventListener('submit', e => {
        e.preventDefault();
        const t1 = DOM.compareTicker1?.value;
        const t2 = DOM.compareTicker2?.value;
        const t3 = DOM.compareTicker3?.value;
        const tickers = [t1, t2, t3].filter(Boolean);
        executeStockComparison(tickers);
    });

    DOM.addWatchlistBtn?.addEventListener('click', async () => {
        if (!AppState.currentUser) return showToast('Login required for watchlist.', 'error');
        if (!AppState.activeTicker) return;

        try {
            const data = await apiRequest('/api/watchlist', {
                method: 'POST',
                body: JSON.stringify({ ticker: AppState.activeTicker })
            });
            showToast(data.message);
            loadWatchlist();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });

    DOM.inlineAddWatchlistBtn?.addEventListener('click', async () => {
        if (!AppState.currentUser) return showToast('Login required for watchlist.', 'error');
        const sym = DOM.addWatchlistInput?.value.trim();
        if (!sym) return showToast('Please enter a ticker symbol.', 'error');

        try {
            const data = await apiRequest('/api/watchlist', {
                method: 'POST',
                body: JSON.stringify({ ticker: sym })
            });
            showToast(data.message);
            DOM.addWatchlistInput.value = '';
            loadWatchlist();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}
