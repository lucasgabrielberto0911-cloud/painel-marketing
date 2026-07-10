// State Management
let state = {
    region: 'all',
    inventory: [],
    campaigns: [],
    historico: [],
    config: {
        planoOlxMensal: 672.99
    }
};

// Global Store for real-time fetched Meta insights
window.latestMetaInsights = [];

// Initial Mock Data
const INITIAL_CARS = [
    { id: 1, model: "Jeep Renegade 1.8 Flex Automático", year: "2020/2020", price: 82000, km: 54000, status: "active", image: "img_suv", hot: true, data_olx: "2026-06-15", custo_olx: 97.90, leads: 12, verba_mensal: 500 },
    { id: 2, model: "Chevrolet Onix 1.0 Turbo LTZ", year: "2021/2022", price: 74900, km: 38000, status: "active", image: "img_hatch", hot: false, data_olx: "2026-06-28", custo_olx: 97.90, leads: 6, verba_mensal: 350 },
    { id: 3, model: "Toyota Hilux 2.8 D-4D Diesel SRX", year: "2019/2019", price: 189000, km: 92000, status: "stock", image: "img_pickup", hot: true, leads: 0, verba_mensal: 600 },
    { id: 4, model: "Honda Civic 2.0 EXL Automático", year: "2018/2019", price: 98000, km: 71000, status: "stock", image: "img_sedan", hot: false, leads: 0, verba_mensal: 400 },
    { id: 5, model: "Hyundai Creta 1.6 Pulse Plus", year: "2021/2021", price: 89900, km: 42000, status: "active", image: "img_suv", hot: false, data_olx: "2026-07-02", custo_olx: 97.90, leads: 8, verba_mensal: 400 },
    { id: 6, model: "Fiat Strada 1.3 Firefly Volcano", year: "2022/2023", price: 92000, km: 23000, status: "sold", image: "img_pickup", hot: false, leads: 0, verba_mensal: 300 }
];

const INITIAL_CAMPAIGNS = [
    { date: "2026-06-01", channel: "Instagram Ads", spent: 800, leads: 52, sales: 2 },
    { date: "2026-06-05", channel: "Facebook Marketplace", spent: 450, leads: 32, sales: 1 },
    { date: "2026-06-10", channel: "OLX", spent: 400, leads: 18, sales: 3 }
];

// Map image identifiers to generated image file paths
const IMAGE_MAP = {
    img_suv: 'assets/suv_modern.jpg',
    img_sedan: 'assets/sedan_elegant.jpg',
    img_hatch: 'assets/hatch_economic.jpg',
    img_pickup: 'assets/pickup_robust.jpg',
    img_conversivel: 'assets/conversivel_esportivo.jpg',
    img_utilitario: 'assets/utilitario_van.jpg'
};

// Region Benchmarks (CPL - Custo por Lead e Conversão)
const REGION_BENCHMARKS = {
    all: {
        olx_cpl: 20.00,
        fb_cpl: 15.00,
        ig_cpl: 15.62,
        tip: "<strong>Vitória & Linhares:</strong> Aproveite a força regional da OLX para pickups na região norte (Linhares) e invista pesado no Instagram Reels para SUVs e Hatchbacks urbanos na Grande Vitória."
    },
    vitoria: {
        olx_cpl: 22.00,
        fb_cpl: 16.00,
        ig_cpl: 13.50,
        tip: "<strong>Dica para Grande Vitória:</strong> Pessoas buscam agilidade. Campanhas de Instagram focadas em vídeos curtos mostrando detalhes internos (painel, teto solar, espaço) funcionam muito bem. Anuncie Onix, HB20 e SUVs médios."
    },
    linhares: {
        olx_cpl: 18.00,
        fb_cpl: 13.00,
        ig_cpl: 18.00,
        tip: "<strong>Dica para Linhares & Região Norte:</strong> O público de agro e comércio local valoriza picapes e carros para trabalho (Strada, Toro, Hilux). Anúncios na OLX com títulos detalhados de manutenção e pneus geram muitos leads."
    }
};

// Debounce helper to optimize rendering on input searches
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Toast Notification System
function showToast(message) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px;";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast-card glass";
    toast.style.cssText = "background: rgba(10, 11, 15, 0.95); border: 1px solid var(--primary); color: #fff; padding: 12px 20px; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.6); font-family: var(--font-body); font-size: 0.82rem; font-weight: 500; display: flex; align-items: center; gap: 8px; animation: toastSlideIn 0.25s ease forwards;";
    toast.innerHTML = `<span style="color: var(--success); font-weight: bold; font-size: 1rem;">✔</span> ${message}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastSlideOut 0.25s ease forwards";
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
    // Load configuration first, then initialize the rest
    fetchConfig().then(() => {
        // Load local storage or use defaults
        const storedInventory = localStorage.getItem("automarketing_inventory");
        if (storedInventory) {
            state.inventory = JSON.parse(storedInventory);
        } else {
            state.inventory = [...INITIAL_CARS];
            saveInventoryToStorage();
        }

        const storedCampaigns = localStorage.getItem("automarketing_campaigns");
        if (storedCampaigns) {
            state.campaigns = JSON.parse(storedCampaigns);
        } else {
            state.campaigns = [...INITIAL_CAMPAIGNS];
            saveCampaignsToStorage();
        }

        const storedHistorico = localStorage.getItem("automarketing_historico");
        if (storedHistorico) {
            state.historico = JSON.parse(storedHistorico);
        }

        // Load integration states from localStorage if they exist
        const storedMetaToken = localStorage.getItem("suagaragem_meta_token");
        if (storedMetaToken) {
            const tokenInput = document.getElementById("meta-token");
            if (tokenInput) tokenInput.value = storedMetaToken;
            const badge = document.getElementById("badge-meta");
            const btn = document.getElementById("btn-connect-meta");
            if (badge && btn) {
                badge.innerText = "Conectado";
                badge.style.background = "rgba(16, 185, 129, 0.1)";
                badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
                badge.style.color = "var(--success)";
                btn.innerText = "Desconectar";
                btn.className = "btn btn-outline btn-sm";
                btn.onclick = () => disconnectMockAPI('meta');
            }
        }

        const storedSheetsUrl = localStorage.getItem("suagaragem_sheets_url");
        if (storedSheetsUrl) {
            const urlInput = document.getElementById("sheets-url");
            if (urlInput) urlInput.value = storedSheetsUrl;
            const badge = document.getElementById("badge-sheets");
            const btn = document.getElementById("btn-connect-sheets");
            if (badge && btn) {
                badge.innerText = "Sincronizado";
                badge.style.background = "rgba(16, 185, 129, 0.1)";
                badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
                badge.style.color = "var(--success)";
                btn.innerText = "Desconectar";
                btn.className = "btn btn-outline btn-sm";
                btn.onclick = () => disconnectMockAPI('sheets');
            }

            // Sincronismo inicial silencioso em background
            Promise.all([
                fetch('/api/sheets-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheetUrl: storedSheetsUrl, sheetName: 'Estoque' })
                }).then(res => res.json()),
                fetch('/api/sheets-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheetUrl: storedSheetsUrl, sheetName: 'Campanhas' })
                }).then(res => res.json()),
                fetch('/api/sheets-read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ spreadsheetUrl: storedSheetsUrl, sheetName: 'Historico' })
                }).then(res => res.json()).catch(() => ({ success: false }))
            ])
            .then(([resEstoque, resCampanhas, resHistorico]) => {
                if (resEstoque.success && resCampanhas.success) {
                    processEstoqueData(resEstoque.data);
                    processCampanhaData(resCampanhas.data);
                    if (resHistorico && resHistorico.success) {
                        processHistoricoData(resHistorico.data);
                    }
                    renderAll();
                }
            })
            .catch(err => console.error("Erro no sincronismo inicial com as abas:", err));
        }

        // Debounced Search Event Listener (reduces rendering calls)
        const searchInput = document.getElementById("kanbanSearch");
        if (searchInput) {
            searchInput.addEventListener("input", debounce(() => {
                renderKanban();
            }, 300));
        }

        // Initialize Lucide Icons
        lucide.createIcons();

        // Set preview image for modal initial state
        previewSelectedImage();

        // Initial render
        renderAll();
    });
});

// Save inventory to storage
function saveInventoryToStorage() {
    localStorage.setItem("automarketing_inventory", JSON.stringify(state.inventory));
}

// Save campaigns to storage
function saveCampaignsToStorage() {
    localStorage.setItem("automarketing_campaigns", JSON.stringify(state.campaigns));
}

// Calculate days on OLX
function calcularDiasNaOlx(dataOlx) {
    if (!dataOlx) return null;
    const dataEntrada = new Date(dataOlx + "T00:00:00");
    if (isNaN(dataEntrada.getTime())) return null;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataEntrada.setHours(0, 0, 0, 0);

    const diferencaMs = hoje - dataEntrada;
    const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    return dias >= 0 ? dias : 0;
}

// Calculate accumulated cost on OLX
function calcularCustoAcumulado(custoOlx, diasNaOlx) {
    if (diasNaOlx === null || diasNaOlx === undefined) return 0;
    const custo = custoOlx || (state.config.planoOlxMensal / 10);
    return (custo / 30) * diasNaOlx;
}

// Parse data for 'Estoque' sheet tab
function processEstoqueData(rows) {
    if (!rows || rows.length < 2) return;

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const newInventory = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue;

        const car = {};
        car.rowIndex = i + 1;

        headers.forEach((header, index) => {
            const val = row[index];
            if (val === undefined || val === null) return;

            if (header === 'modelo' || header === 'model') {
                car.model = val.toString();
            } else if (header === 'ano' || header === 'year') {
                car.year = val.toString();
            } else if (header === 'preco' || header === 'price') {
                car.price = parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
            } else if (header === 'km') {
                car.km = parseInt(val.toString().replace(/[^0-9]/g, '')) || 0;
            } else if (header === 'status') {
                const statusVal = val.toString().toLowerCase().trim();
                if (['active', 'ativo', 'olx'].includes(statusVal)) car.status = 'active';
                else if (['sold', 'vendido'].includes(statusVal)) car.status = 'sold';
                else car.status = 'stock';
            } else if (header === 'imagem' || header === 'image') {
                car.image = val.toString();
            } else if (header === 'destaque' || header === 'hot') {
                const hotVal = val.toString().toLowerCase().trim();
                car.hot = hotVal === 'true' || hotVal === '1' || hotVal === 'sim';
            } else if (header === 'data_olx' || header === 'data olx' || header === 'data') {
                car.data_olx = val.toString().trim();
            } else if (header === 'custo_olx' || header === 'custo olx' || header === 'custo') {
                car.custo_olx = parseFloat(val.toString().replace(/[^0-9.]/g, '')) || (state.config.planoOlxMensal / 10);
            } else if (header === 'leads' || header === 'contatos') {
                car.leads = parseInt(val.toString().replace(/[^0-9]/g, '')) || 0;
            } else if (header === 'verba_mensal' || header === 'verba' || header === 'verba mensal') {
                car.verba_mensal = parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
            }
        });

        if (car.model) {
            car.id = car.id || (Date.now() + i);
            car.year = car.year || '2020/2020';
            car.price = car.price || 0;
            car.km = car.km || 0;
            car.status = car.status || 'stock';
            car.image = car.image || 'img_suv';
            car.hot = car.hot || false;
            car.custo_olx = car.custo_olx !== undefined ? car.custo_olx : (state.config.planoOlxMensal / 10);
            car.leads = car.leads || 0;
            car.verba_mensal = car.verba_mensal || 0;
            newInventory.push(car);
        }
    }

    if (newInventory.length > 0) {
        state.inventory = newInventory;
        saveInventoryToStorage();
    }
}

// Parse data for 'Campanhas' sheet tab
function processCampanhaData(rows) {
    if (!rows || rows.length < 2) return;

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const newCampaigns = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue;

        const camp = {};
        headers.forEach((header, index) => {
            const val = row[index];
            if (val === undefined || val === null) return;

            if (header === 'date' || header === 'data') {
                camp.date = val.toString();
            } else if (header === 'channel' || header === 'canal') {
                camp.channel = val.toString();
            } else if (header === 'spent' || header === 'gasto' || header === 'valor') {
                camp.spent = parseFloat(val.toString().replace(/[^0-9.]/g, '')) || 0;
            } else if (header === 'leads' || header === 'contatos') {
                camp.leads = parseInt(val.toString().replace(/[^0-9]/g, '')) || 0;
            } else if (header === 'sales' || header === 'vendas') {
                camp.sales = parseInt(val.toString().replace(/[^0-9]/g, '')) || 0;
            }
        });

        if (camp.date && camp.channel) {
            camp.spent = camp.spent || 0;
            camp.leads = camp.leads || 0;
            camp.sales = camp.sales || 0;
            newCampaigns.push(camp);
        }
    }

    if (newCampaigns.length > 0) {
        state.campaigns = newCampaigns;
        saveCampaignsToStorage();
    }
}

// Parse data for 'Historico' sheet tab
function processHistoricoData(rows) {
    if (!rows || rows.length < 2) {
        state.historico = [];
        return;
    }

    const headers = rows[0].map(h => h.toString().toLowerCase().trim());
    const newHistory = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length === 0 || !row[0]) continue;

        const snap = {};
        snap.rowIndex = i + 1; // 1-based index

        headers.forEach((header, index) => {
            const val = row[index];
            if (val === undefined || val === null) return;

            if (header === 'data' || header === 'date') {
                snap.data = val.toString().trim();
            } else if (header === 'total_carros_ativos') {
                snap.total_carros_ativos = parseInt(val) || 0;
            } else if (header === 'total_carros_vendidos_mes') {
                snap.total_carros_vendidos_mes = parseInt(val) || 0;
            } else if (header === 'verba_planejada_total') {
                snap.verba_planejada_total = parseFloat(val) || 0;
            } else if (header === 'gasto_real_total_meta') {
                snap.gasto_real_total_meta = parseFloat(val) || 0;
            } else if (header === 'leads_total_mes') {
                snap.leads_total_mes = parseInt(val) || 0;
            } else if (header === 'vendas_total_mes') {
                snap.vendas_total_mes = parseInt(val) || 0;
            }
        });

        if (snap.data) {
            newHistory.push(snap);
        }
    }

    state.historico = newHistory;
    localStorage.setItem("automarketing_historico", JSON.stringify(state.historico));
}

// Navigation / Tabs System
function switchTab(tabId) {
    // Hide all sections
    document.querySelectorAll(".tab-content").forEach(el => {
        el.classList.remove("active");
    });
    
    // Show selected section
    document.getElementById(`tab-${tabId}`).classList.add("active");
    
    // Update navigation active states
    document.querySelectorAll(".nav-item").forEach(el => {
        el.classList.remove("active");
    });
    
    // Set clicked as active
    document.getElementById(`nav-${tabId}`).classList.add("active");
    
    // Update main header title contextually
    const titles = {
        overview: "Visão Geral do Marketing",
        history: "Histórico & Tendências",
        simulator: "Verba Real por Carro",
        ranking: "Ranking de Performance",
        "olx-manager": "Meus Carros (Plano OLX)",
        "olx-rotation": "Painel de Rotação OLX",
        "meta-ads": "Campanhas",
        integrations: "Conexões de API & Planilhas",
        settings: "Configurações do Plano",
        "local-insights": "Insights de Mercado Regional (ES)"
    };
    document.getElementById("main-title").innerText = titles[tabId] || "Sua Garagem Marketing";

    // Auto-fetch Meta Ads data on entering tabs
    if (tabId === 'meta-ads') {
        syncMetaAdsData(true);
    } else if (tabId === 'simulator' || tabId === 'ranking') {
        if (!window.latestMetaInsights || window.latestMetaInsights.length === 0) {
            syncMetaAdsData(true);
        } else {
            if (tabId === 'simulator') renderVerbaRealPorCarro();
            if (tabId === 'ranking') renderRanking();
        }
    } else if (tabId === 'history') {
        renderHistoryTrends();
    } else if (tabId === 'settings') {
        const settingsInput = document.getElementById("config-plano-olx");
        if (settingsInput) {
            settingsInput.value = state.config.planoOlxMensal.toFixed(2);
        }
    }
}

// Switch Region and Recalculate
function updateRegionDashboard() {
    state.region = document.getElementById("regionFilter").value;
    renderAll();
}

// Render All Components
function renderAll() {
    renderStats();
    renderDistributionBars();
    renderOLXOverviewSlots();
    renderPerformanceChart();
    renderKanban();
    renderOLXRotation();
    renderCampaignTable();
    updateTips();
    renderVerbaRealPorCarro();
    renderHistoryTrends();
    renderRanking();
    renderAlerts();
}

// Update Top Stats Card
function renderStats() {
    // 1. Budget: Planned Budget of active OLX inventory (sum of verba_mensal)
    const activeCars = state.inventory.filter(car => car.status === 'active');
    const totalPlanned = activeCars.reduce((sum, c) => sum + (c.verba_mensal || 0), 0);
    document.getElementById("stat-budget").innerText = totalPlanned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // 2. Real Leads of active OLX inventory
    const totalLeads = activeCars.reduce((sum, c) => sum + (c.leads || 0), 0);
    document.getElementById("stat-leads").innerText = totalLeads;
    
    // 3. Average Cost Per Lead (CPL) for active slots (Accumulated OLX plan cost / leads)
    const totalAccumulatedCusto = activeCars.reduce((sum, c) => {
        const dias = c.data_olx ? calcularDiasNaOlx(c.data_olx) : null;
        const custo = c.custo_olx || (state.config.planoOlxMensal / 10);
        return sum + (dias !== null ? calcularCustoAcumulado(custo, dias) : 0);
    }, 0);
    const avgCPL = totalLeads > 0 ? (totalAccumulatedCusto / totalLeads) : 0;
    document.getElementById("stat-cpl").innerText = avgCPL > 0 
        ? avgCPL.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        : "—";

    // 4. OLX Filling Status
    document.getElementById("stat-olx-fill").innerText = `${activeCars.length} / 10`;

    const badge = document.getElementById("stat-olx-badge");
    if (activeCars.length > 10) {
        badge.innerText = "Limite Excedido!";
        badge.className = "stat-change negative";
    } else if (activeCars.length === 10) {
        badge.innerText = "Plano 100% Preenchido";
        badge.className = "stat-change positive";
    } else {
        badge.innerText = `${10 - activeCars.length} slots disponíveis`;
        badge.className = "stat-change neutral";
    }
}

// Render Overview Real Spend Distribution by Channel
function renderDistributionBars() {
    const olxSpent = state.campaigns.filter(c => c.channel === 'OLX').reduce((sum, c) => sum + c.spent, 0);
    const fbSpent = state.campaigns.filter(c => c.channel === 'Facebook Marketplace').reduce((sum, c) => sum + c.spent, 0);
    const igSpent = state.campaigns.filter(c => c.channel === 'Instagram Ads').reduce((sum, c) => sum + c.spent, 0);
    const total = olxSpent + fbSpent + igSpent;

    const olxPct = total > 0 ? Math.round((olxSpent / total) * 100) : 0;
    const fbPct = total > 0 ? Math.round((fbSpent / total) * 100) : 0;
    const igPct = total > 0 ? Math.round((igSpent / total) * 100) : 0;

    document.getElementById("dist-val-olx").innerText = `R$ ${olxSpent.toFixed(2)} (${olxPct}%)`;
    document.getElementById("dist-val-fb").innerText = `R$ ${fbSpent.toFixed(2)} (${fbPct}%)`;
    document.getElementById("dist-val-ig").innerText = `R$ ${igSpent.toFixed(2)} (${igPct}%)`;

    document.getElementById("pb-olx").style.width = `${olxPct}%`;
    document.getElementById("pb-fb").style.width = `${fbPct}%`;
    document.getElementById("pb-ig").style.width = `${igPct}%`;
}

// Render the 10 small slot indicators on home overview card
function renderOLXOverviewSlots() {
    const activeCars = state.inventory.filter(car => car.status === 'active');
    const container = document.getElementById("olx-overview-slots");
    if (!container) return;
    container.innerHTML = "";

    document.getElementById("olx-slots-count").innerText = `${activeCars.length} de 10 Usados`;

    for (let i = 0; i < 10; i++) {
        const slotEl = document.createElement("div");
        slotEl.className = "olx-slot";
        
        if (i < activeCars.length) {
            slotEl.classList.add("filled");
            slotEl.innerText = i + 1;
            slotEl.title = activeCars[i].model;
        } else {
            slotEl.innerText = "";
            slotEl.title = "Slot Livre";
        }
        
        container.appendChild(slotEl);
    }
}

// Update local tip box based on region
function updateTips() {
    const benchmarks = REGION_BENCHMARKS[state.region];
    const tipText = document.getElementById("tip-text");
    if (tipText) tipText.innerHTML = benchmarks.tip;
}

// Draw dynamic SVG Performance Chart on Overview Tab
function renderPerformanceChart() {
    const svg = document.getElementById("performanceChart");
    if (!svg) return;
    svg.innerHTML = "";

    if (state.campaigns.length === 0) {
        svg.innerHTML = `<text x="400" y="100" fill="var(--text-muted)" font-family="var(--font-body)" font-size="14" text-anchor="middle">Sem dados de campanhas registrados no momento.</text>`;
        return;
    }

    const campaigns = [...state.campaigns].sort((a, b) => new Date(a.date) - new Date(b.date));

    const dates = [...new Set(campaigns.map(c => c.date))];
    if (dates.length < 2) {
        const dateObj = new Date(dates[0]);
        dateObj.setDate(dateObj.getDate() - 5);
        dates.unshift(dateObj.toISOString().split('T')[0]);
    }

    let maxLeads = 10;
    campaigns.forEach(c => {
        if (c.leads > maxLeads) maxLeads = c.leads;
    });
    maxLeads = Math.ceil(maxLeads / 10) * 10;

    const width = 800;
    const height = 200;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const getY = (val) => {
        return paddingTop + chartHeight - (val / maxLeads) * chartHeight;
    };

    const getX = (index) => {
        return paddingLeft + (index / (dates.length - 1)) * chartWidth;
    };

    // Draw Gridlines and Y Labels
    const gridLinesCount = 4;
    for (let i = 0; i <= gridLinesCount; i++) {
        const val = (maxLeads / gridLinesCount) * i;
        const y = getY(val);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.04)");
        line.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", paddingLeft - 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("fill", "var(--text-muted)");
        label.setAttribute("font-size", "10");
        label.setAttribute("font-family", "var(--font-body)");
        label.setAttribute("text-anchor", "end");
        label.textContent = Math.round(val);
        svg.appendChild(label);
    }

    // Draw X Labels
    dates.forEach((d, idx) => {
        const x = getX(idx);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x);
        label.setAttribute("y", height - 10);
        label.setAttribute("fill", "var(--text-muted)");
        label.setAttribute("font-size", "10");
        label.setAttribute("font-family", "var(--font-body)");
        label.setAttribute("text-anchor", "middle");

        const formatted = new Date(d + "T00:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        label.textContent = formatted;
        svg.appendChild(label);
    });

    const channels = [
        { name: "OLX", color: "var(--olx-color)", gradientId: "grad-olx" },
        { name: "Facebook Marketplace", color: "var(--fb-color)", gradientId: "grad-fb" },
        { name: "Instagram Ads", color: "var(--ig-color)", gradientId: "grad-ig" }
    ];

    // Define Gradients in SVG
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    channels.forEach(ch => {
        const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
        grad.setAttribute("id", ch.gradientId);
        grad.setAttribute("x1", "0");
        grad.setAttribute("y1", "0");
        grad.setAttribute("x2", "0");
        grad.setAttribute("y2", "1");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        
        let hexColor = "rgba(220, 38, 38, 0.25)";
        if (ch.name.includes("OLX")) hexColor = "rgba(240, 100, 0, 0.25)";
        else if (ch.name.includes("Facebook")) hexColor = "rgba(24, 119, 242, 0.25)";
        else if (ch.name.includes("Instagram")) hexColor = "rgba(225, 48, 108, 0.25)";
        
        stop1.setAttribute("stop-color", hexColor);
        grad.appendChild(stop1);

        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "rgba(0, 0, 0, 0)");
        grad.appendChild(stop2);
        defs.appendChild(grad);
    });
    svg.appendChild(defs);

    // Draw lines and areas
    channels.forEach(ch => {
        const points = [];
        dates.forEach((d, idx) => {
            const matches = campaigns.filter(c => c.date === d && c.channel === ch.name);
            const totalLeadsOnDate = matches.reduce((sum, curr) => sum + curr.leads, 0);
            points.push({ x: getX(idx), y: getY(totalLeadsOnDate), val: totalLeadsOnDate });
        });

        let pathD = "";
        points.forEach((p, idx) => {
            if (idx === 0) pathD += `M ${p.x} ${p.y}`;
            else {
                const prev = points[idx - 1];
                const cp1x = prev.x + (p.x - prev.x) / 3;
                const cp2x = prev.x + 2 * (p.x - prev.x) / 3;
                pathD += ` C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
            }
        });

        if (points.length > 0) {
            const first = points[0];
            const last = points[points.length - 1];
            const areaD = `${pathD} L ${last.x} ${getY(0)} L ${first.x} ${getY(0)} Z`;

            const areaEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            areaEl.setAttribute("d", areaD);
            areaEl.setAttribute("fill", `url(#${ch.gradientId})`);
            svg.appendChild(areaEl);

            const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            lineEl.setAttribute("d", pathD);
            lineEl.setAttribute("fill", "none");
            lineEl.setAttribute("stroke", ch.color);
            lineEl.setAttribute("stroke-width", "2.5");
            lineEl.setAttribute("stroke-linecap", "round");
            svg.appendChild(lineEl);

            points.forEach(p => {
                if (p.val > 0) {
                    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    dot.setAttribute("cx", p.x);
                    dot.setAttribute("cy", p.y);
                    dot.setAttribute("r", "4");
                    dot.setAttribute("fill", ch.color);
                    dot.setAttribute("stroke", "var(--bg-card)");
                    dot.setAttribute("stroke-width", "1.5");
                    
                    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
                    title.textContent = `${ch.name}: ${p.val} leads`;
                    dot.appendChild(title);

                    svg.appendChild(dot);
                }
            });
        }
    });
}

// KANBAN SYSTEM
function renderKanban() {
    const stockContainer = document.getElementById("cards-stock");
    const activeContainer = document.getElementById("cards-active");
    const soldContainer = document.getElementById("cards-sold");

    if (!stockContainer || !activeContainer || !soldContainer) return;

    stockContainer.innerHTML = "";
    activeContainer.innerHTML = "";
    soldContainer.innerHTML = "";

    const query = (document.getElementById("kanbanSearch")?.value || "").toLowerCase().trim();
    const typeFilter = document.getElementById("kanbanTypeFilter")?.value || "all";

    let stockCount = 0;
    let activeCount = 0;
    let soldCount = 0;

    state.inventory.forEach((car, index) => {
        const matchesQuery = car.model.toLowerCase().includes(query) || car.year.includes(query) || car.price.toString().includes(query);
        const matchesType = typeFilter === "all" || car.image === typeFilter;

        if (!matchesQuery || !matchesType) {
            return;
        }

        const card = createCarCard(car, index);

        if (car.status === "stock") {
            stockContainer.appendChild(card);
            stockCount++;
        } else if (car.status === "active") {
            activeContainer.appendChild(card);
            activeCount++;
        } else if (car.status === "sold") {
            soldContainer.appendChild(card);
            soldCount++;
        }
    });

    document.getElementById("count-stock").innerText = stockCount;
    document.getElementById("count-active").innerText = `${activeCount} / 10`;
    document.getElementById("count-sold").innerText = soldCount;

    const warningBanner = document.getElementById("olx-limit-alert");
    const badgeActive = document.getElementById("count-active");

    if (activeCount > 10) {
        if (warningBanner) warningBanner.style.display = "flex";
        if (badgeActive) badgeActive.classList.add("negative");
    } else {
        if (warningBanner) warningBanner.style.display = "none";
        if (badgeActive) badgeActive.classList.remove("negative");
    }
}

// Render the OLX Rotation table list
function renderOLXRotation() {
    const tbody = document.getElementById("olxRotationTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const calculatedCars = state.inventory
        .map((car, index) => ({ ...car, originalIndex: index }))
        .filter(car => car.status === 'active')
        .map(car => {
            const dias = car.data_olx ? calcularDiasNaOlx(car.data_olx) : null;
            const custo = car.custo_olx || (state.config.planoOlxMensal / 10);
            const custoAcumulado = dias !== null ? calcularCustoAcumulado(custo, dias) : 0;
            return {
                ...car,
                dias,
                custoAcumulado
            };
        });

    calculatedCars.sort((a, b) => {
        if (a.dias === null && b.dias === null) return 0;
        if (a.dias === null) return 1;
        if (b.dias === null) return -1;
        return b.dias - a.dias;
    });

    let totalCustoAcumulado = 0;

    calculatedCars.forEach(car => {
        totalCustoAcumulado += car.custoAcumulado;
        
        const tr = document.createElement("tr");
        
        const formattedCusto = car.dias !== null 
            ? car.custoAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
            : "—";
            
        const formattedDate = car.data_olx 
            ? new Date(car.data_olx + "T00:00:00").toLocaleDateString('pt-BR') 
            : "—";
            
        const diasText = car.dias !== null ? `${car.dias} dias` : "—";
        
        const carLeads = car.leads || 0;
        
        const cplVaga = (car.dias !== null && carLeads > 0) ? (car.custoAcumulado / carLeads) : null;
        const formattedCplVaga = cplVaga !== null ? cplVaga.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : "—";
        
        let recommendationText = "";
        if (car.dias === null) {
            recommendationText = `<span class="badge" style="color: var(--warning) !important; background: var(--warning-bg) !important; border-color: rgba(217, 119, 6, 0.2) !important;">⚠️ Sem data de anúncio</span>`;
        } else if (car.dias > 20) {
            tr.className = "row-alert";
            recommendationText = `<span class="badge badge-alert">⚠️ Substituir - ${car.dias} dias parado</span>`;
        } else {
            recommendationText = `<span class="badge" style="color: var(--success) !important; background: var(--success-bg) !important; border-color: rgba(22, 163, 74, 0.2) !important;">Ok - Ativo</span>`;
        }

        tr.innerHTML = `
            <td><strong>${car.model}</strong></td>
            <td>${formattedDate}</td>
            <td>${diasText}</td>
            <td><strong>${carLeads}</strong> contatos</td>
            <td>${formattedCusto}</td>
            <td><strong>${formattedCplVaga}</strong></td>
            <td>${recommendationText}</td>
            <td>
                <div style="display: flex; gap: 0.4rem;">
                    <button class="btn btn-outline btn-sm" onclick="editCar(${car.originalIndex})" title="Editar veículo" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; gap: 0.2rem; min-height: auto;"><i data-lucide="edit"></i> Editar</button>
                    <button class="btn btn-primary btn-sm" onclick="markAsSoldQuick(${car.originalIndex})" title="Marcar como vendido" style="padding: 0.25rem 0.5rem; font-size: 0.72rem; gap: 0.2rem; min-height: auto;"><i data-lucide="check"></i> Vendido</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const totalOcupadas = calculatedCars.length;
    document.getElementById("rot-stat-vagas").innerText = `${totalOcupadas} / 10`;
    document.getElementById("rot-stat-custo-total").innerText = totalCustoAcumulado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const subText = document.getElementById("rot-stat-vagas-sub");
    if (subText) {
        if (totalOcupadas > 10) {
            subText.innerHTML = `<span class="text-danger">Limite de 10 Vagas Excedido!</span>`;
        } else {
            subText.innerText = "Vagas ativas no plano";
        }
    }

    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }, 0);
}

// Create Card DOM Element
function createCarCard(car, index) {
    const cardEl = document.createElement("div");
    cardEl.className = "car-card";
    cardEl.draggable = true;
    cardEl.setAttribute("ondragstart", `drag(event, ${index})`);
    
    const formattedPrice = car.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedKm = car.km.toLocaleString('pt-BR');
    const imagePath = IMAGE_MAP[car.image] || IMAGE_MAP.img_suv;

    let actionButtons = "";
    if (car.status === "stock") {
        actionButtons = `
            <button class="btn btn-outline btn-sm" onclick="moveCar(${index}, 'active')" title="Ativar no plano OLX">
                Ativar OLX <i data-lucide="arrow-right"></i>
            </button>
            <button class="btn btn-outline btn-sm" onclick="markAsSoldQuick(${index})" title="Marcar como vendido">
                <i data-lucide="check"></i> Vendido
            </button>
        `;
    } else if (car.status === "active") {
        actionButtons = `
            <button class="btn btn-outline btn-sm" onclick="moveCar(${index}, 'stock')" title="Mover de volta para estoque">
                <i data-lucide="arrow-left"></i> Estoque
            </button>
            <button class="btn btn-primary btn-sm" onclick="markAsSoldQuick(${index})" title="Marcar como vendido">
                <i data-lucide="check"></i> Vendido
            </button>
        `;
    } else if (car.status === "sold") {
        actionButtons = `
            <button class="btn btn-outline btn-sm" onclick="moveCar(${index}, 'stock')" title="Mover de volta para estoque">
                Reativar Estoque
            </button>
        `;
    }

    cardEl.innerHTML = `
        <div class="car-card-header">
            <span class="car-model-name">${car.model}</span>
            ${car.hot ? '<span class="car-hot-badge">Giro Rápido</span>' : ''}
        </div>
        <div class="car-img-wrapper">
            <img src="${imagePath}" alt="${car.model}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <i data-lucide="car" style="display:none;"></i>
        </div>
        <div class="car-info-grid">
            <div>Ano: <strong>${car.year}</strong></div>
            <div>KM: <strong>${formattedKm}</strong></div>
        </div>
        <div class="car-price">${formattedPrice}</div>
        
        <div class="car-actions-row">
            <div class="car-actions-buttons">
                ${actionButtons}
            </div>
            <div class="car-action-btn-group">
                <button class="car-action-btn" onclick="editCar(${index})" title="Editar veículo"><i data-lucide="edit"></i></button>
                <button class="car-action-btn delete" onclick="deleteCar(${index})" title="Excluir veículo"><i data-lucide="trash-2"></i></button>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({
                attrs: {
                    class: 'lucide-card-icon'
                },
                nameAttr: 'data-lucide'
            });
        }
    }, 0);

    return cardEl;
}

// Drag & Drop Functionality
function drag(ev, index) {
    ev.dataTransfer.setData("text/plain", index);
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dragEnter(ev, columnId) {
    ev.preventDefault();
    const column = document.getElementById(`col-${columnId}`);
    if (column) column.classList.add("drag-over");
}

function dragLeave(ev, columnId) {
    ev.preventDefault();
    const column = document.getElementById(`col-${columnId}`);
    if (column) column.classList.remove("drag-over");
}

function drop(ev, targetStatus) {
    ev.preventDefault();
    const column = document.getElementById(`col-${targetStatus}`);
    if (column) column.classList.remove("drag-over");
    
    const index = ev.dataTransfer.getData("text/plain");
    if (index !== "") {
        moveCar(parseInt(index), targetStatus);
    }
}

// Car Modal Add / Edit UI controller
function openAddCarModal() {
    document.getElementById("modalTitle").innerText = "Adicionar Carro ao Estoque";
    document.getElementById("carForm").reset();
    document.getElementById("carIndex").value = "";
    document.getElementById("car-data-olx").value = "";
    document.getElementById("car-custo-olx").value = "";
    document.getElementById("car-verba-mensal").value = "";
    previewSelectedImage();
    
    document.getElementById("carModal").classList.add("active");
}

// Edit Car from Kanban
function editCar(index) {
    const car = state.inventory[index];
    document.getElementById("modalTitle").innerText = "Editar Carro";
    document.getElementById("carIndex").value = index;
    
    document.getElementById("car-model").value = car.model;
    document.getElementById("car-year").value = car.year;
    document.getElementById("car-price").value = car.price;
    document.getElementById("car-km").value = car.km;
    document.getElementById("car-status").value = car.status;
    document.getElementById("car-image").value = car.image;
    document.getElementById("car-hot").checked = car.hot;
    document.getElementById("car-data-olx").value = car.data_olx || "";
    document.getElementById("car-custo-olx").value = car.custo_olx || "";
    document.getElementById("car-verba-mensal").value = car.verba_mensal || "";

    previewSelectedImage();
    document.getElementById("carModal").classList.add("active");
}

function closeCarModal() {
    document.getElementById("carModal").classList.remove("active");
}

function previewSelectedImage() {
    const selected = document.getElementById("car-image").value;
    const preview = document.getElementById("car-img-preview");
    
    if (IMAGE_MAP[selected]) {
        preview.src = IMAGE_MAP[selected];
        preview.style.display = "block";
    } else {
        preview.style.display = "none";
    }
}

// Save or Update Car from Modal Form
function handleCarFormSubmit(event) {
    event.preventDefault();

    const indexVal = document.getElementById("carIndex").value;
    const model = document.getElementById("car-model").value;
    const year = document.getElementById("car-year").value;
    const price = parseFloat(document.getElementById("car-price").value);
    const km = parseInt(document.getElementById("car-km").value);
    const status = document.getElementById("car-status").value;
    const image = document.getElementById("car-image").value;
    const hot = document.getElementById("car-hot").checked;
    const data_olx = document.getElementById("car-data-olx").value;
    const custo_olx_val = document.getElementById("car-custo-olx").value;
    const custo_olx = custo_olx_val !== "" ? parseFloat(custo_olx_val) : "";
    const verba_mensal_val = document.getElementById("car-verba-mensal").value;
    const verba_mensal = verba_mensal_val !== "" ? parseFloat(verba_mensal_val) : 0;

    const rowData = {
        modelo: model,
        ano: year,
        preco: price,
        km: km,
        status: status,
        imagem: image,
        hot: hot,
        data_olx: data_olx || "",
        custo_olx: custo_olx !== "" ? custo_olx : "",
        leads: indexVal !== "" ? (state.inventory[parseInt(indexVal)].leads || 0) : 0,
        verba_mensal: verba_mensal
    };

    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url");

    if (sheetsUrl) {
        const submitBtn = document.querySelector("#carForm button[type='submit']");
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> Salvando...`;

        const action = indexVal === "" ? "add" : "update";
        const rowIndex = indexVal !== "" ? state.inventory[parseInt(indexVal)].rowIndex : null;

        fetch('/api/sheets-write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetUrl: sheetsUrl,
                sheetName: "Estoque",
                action,
                rowData,
                rowIndex
            })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.success) {
                throw new Error(res.error || "Erro de escrita no Google Sheets.");
            }
            
            showToast("Carro salvo com sucesso no Google Sheets!");
            closeCarModal();

            connectMockAPI('sheets');
        })
        .catch(err => {
            alert(`Erro ao salvar no Google Sheets:\n${err.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        });

    } else {
        const carData = { 
            model, 
            year, 
            price, 
            km, 
            status, 
            image, 
            hot, 
            data_olx: data_olx || "", 
            custo_olx: custo_olx !== "" ? custo_olx : "", 
            leads: indexVal !== "" ? (state.inventory[parseInt(indexVal)].leads || 0) : 0,
            verba_mensal: verba_mensal
        };

        if (indexVal === "") {
            carData.id = Date.now();
            state.inventory.push(carData);
        } else {
            const index = parseInt(indexVal);
            carData.id = state.inventory[index].id;
            state.inventory[index] = carData;
        }

        saveInventoryToStorage();
        closeCarModal();
        renderAll();
        showToast("Salvo localmente no navegador!");
    }
}

// Delete Car from Inventory
function deleteCar(index) {
    const car = state.inventory[index];
    const carName = car ? car.model : "este veículo";
    openConfirmDeleteModal({
        title: "Excluir veículo",
        message: `Você está prestes a excluir permanentemente <strong>${carName}</strong> do estoque. Este registro será removido de forma definitiva, incluindo os dados sincronizados com a planilha do Google Sheets.`,
        confirmLabel: "Excluir veículo",
        onConfirm: () => {
            state.inventory.splice(index, 1);
            saveInventoryToStorage();
            renderAll();
            showToast("Carro excluído localmente!");
        }
    });
}

// Write/Update status action back to Sheets
function updateCarStatusSheets(index, targetStatus) {
    const car = state.inventory[index];
    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url");

    if (!sheetsUrl) {
        car.status = targetStatus;
        saveInventoryToStorage();
        renderAll();
        showToast("Status atualizado localmente!");
        return;
    }

    const rowData = {
        modelo: car.model,
        ano: car.year,
        preco: car.price,
        km: car.km,
        status: targetStatus,
        imagem: car.image,
        hot: car.hot,
        data_olx: car.data_olx || "",
        custo_olx: car.custo_olx !== undefined ? car.custo_olx : "",
        leads: car.leads || 0,
        verba_mensal: car.verba_mensal || 0
    };

    const originalStatus = car.status;
    car.status = targetStatus;
    renderAll();

    fetch('/api/sheets-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            spreadsheetUrl: sheetsUrl,
            sheetName: "Estoque",
            action: "update",
            rowData,
            rowIndex: car.rowIndex
        })
    })
    .then(res => res.json())
    .then(res => {
        if (!res.success) {
            throw new Error(res.error || "Erro ao salvar alteração no Google Sheets.");
        }
        saveInventoryToStorage();
        showToast("Status atualizado no Google Sheets com sucesso!");
    })
    .catch(err => {
        car.status = originalStatus;
        renderAll();
        alert(`Falha ao salvar alteração no Google Sheets:\n${err.message}`);
    });
}

// Quick status actions
window.markAsSoldQuick = function(index) {
    if (confirm("Deseja realmente marcar este veículo como Vendido?")) {
        updateCarStatusSheets(index, 'sold');
    }
};

window.moveCar = function(index, targetStatus) {
    updateCarStatusSheets(index, targetStatus);
};

// CAMPAIGN LOGS TRACKER SYSTEM
function renderCampaignTable() {
    const tbody = document.getElementById("campaignTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let totalSpent = 0;
    let totalLeads = 0;
    let totalSales = 0;

    const sorted = [...state.campaigns].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(camp => {
        totalSpent += camp.spent;
        totalLeads += camp.leads;
        totalSales += camp.sales;

        const cpl = camp.leads > 0 ? (camp.spent / camp.leads) : 0;
        const formattedDate = new Date(camp.date + "T00:00:00").toLocaleDateString('pt-BR');
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${camp.channel}</strong></td>
            <td>R$ ${camp.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            <td>${camp.leads} contatos</td>
            <td class="${cpl > 20 ? 'text-warning' : 'text-success'}">R$ ${cpl.toFixed(2)}</td>
            <td>${camp.sales} vendas</td>
        `;
        tbody.appendChild(row);
    });

    const gastoContainer = document.getElementById("camp-stat-gasto");
    const leadsContainer = document.getElementById("camp-stat-leads");
    const vendasContainer = document.getElementById("camp-stat-vendas");
    const convContainer = document.getElementById("camp-stat-conversao");

    if (gastoContainer) gastoContainer.innerText = totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    if (leadsContainer) leadsContainer.innerText = `${totalLeads} contatos`;
    if (vendasContainer) vendasContainer.innerText = `${totalSales} vendas`;

    const convRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;
    if (convContainer) convContainer.innerText = `${convRate.toFixed(2)}%`;
}

// Modal Open/Close Controls for Campaign Registration
window.openCampaignModal = function() {
    document.getElementById("campaignForm").reset();
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById("camp-date").value = hoje;
    document.getElementById("campaignModal").classList.add("active");
};

window.closeCampaignModal = function() {
    document.getElementById("campaignModal").classList.remove("active");
};

// Save logged campaigns (sends to sheets-write if integrated)
function saveCampaign(event) {
    event.preventDefault();

    const date = document.getElementById("camp-date").value;
    const channel = document.getElementById("camp-channel").value;
    const spent = parseFloat(document.getElementById("camp-spent").value);
    const leads = parseInt(document.getElementById("camp-leads").value);
    const sales = parseInt(document.getElementById("camp-sales").value);

    const rowData = {
        date: date,
        channel: channel,
        spent: spent,
        leads: leads,
        sales: sales
    };

    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url");

    if (sheetsUrl) {
        const submitBtn = document.querySelector("#campaignForm button[type='submit']");
        const originalHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner"></span> Salvando...`;

        fetch('/api/sheets-write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetUrl: sheetsUrl,
                sheetName: "Campanhas",
                action: "add",
                rowData
            })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.success) {
                throw new Error(res.error || "Erro de escrita no Google Sheets.");
            }
            
            showToast("Campanha registrada com sucesso no Google Sheets!");
            closeCampaignModal();

            connectMockAPI('sheets');
        })
        .catch(err => {
            alert(`Erro ao salvar campanha no Google Sheets:\n${err.message}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalHtml;
        });

    } else {
        const newCamp = { date, channel, spent, leads, sales };
        state.campaigns.push(newCamp);

        saveCampaignsToStorage();
        closeCampaignModal();
        renderAll();
        showToast("Campanha salva localmente!");
    }
}

function clearCampaignHistory() {
    openConfirmDeleteModal({
        title: "Limpar histórico de campanhas",
        message: "Você está prestes a apagar <strong>todo o histórico de desempenho de campanhas</strong>. Esta ação é irreversível e vai apagar permanentemente os dados reais registrados, incluindo os dados sincronizados com a planilha do Google Sheets.",
        confirmLabel: "Apagar histórico",
        onConfirm: () => {
            state.campaigns = [];
            saveCampaignsToStorage();
            renderAll();
        }
    });
}

// ============================================================
// Reinforced Confirmation Modal for permanent/destructive actions
// Requires the user to type "CONFIRMAR" before enabling the action.
// ============================================================
const CONFIRM_DELETE_WORD = "CONFIRMAR";
let pendingConfirmAction = null;

function openConfirmDeleteModal({ title, message, confirmLabel, onConfirm }) {
    pendingConfirmAction = typeof onConfirm === "function" ? onConfirm : null;

    document.querySelector("#confirmDeleteTitle span").innerText = title || "Confirmar exclusão";
    document.getElementById("confirmDeleteMessage").innerHTML = message || "Esta ação é irreversível.";

    const confirmBtn = document.getElementById("confirmDeleteBtn");
    confirmBtn.innerText = confirmLabel || "Excluir definitivamente";
    confirmBtn.disabled = true;

    const input = document.getElementById("confirmDeleteInput");
    input.value = "";

    document.getElementById("confirmDeleteModal").classList.add("active");

    // Refresh icons that were injected into the modal
    if (typeof lucide !== "undefined") lucide.createIcons();

    setTimeout(() => input.focus(), 50);
}

function validateConfirmDeleteInput() {
    const input = document.getElementById("confirmDeleteInput");
    const confirmBtn = document.getElementById("confirmDeleteBtn");
    confirmBtn.disabled = input.value.trim().toUpperCase() !== CONFIRM_DELETE_WORD;
}

function executeConfirmDelete() {
    const input = document.getElementById("confirmDeleteInput");
    if (input.value.trim().toUpperCase() !== CONFIRM_DELETE_WORD) return;

    if (typeof pendingConfirmAction === "function") {
        pendingConfirmAction();
    }
    closeConfirmDeleteModal();
}

function closeConfirmDeleteModal() {
    document.getElementById("confirmDeleteModal").classList.remove("active");
    pendingConfirmAction = null;
}

// Fetch and display real Meta Ads API data
function syncMetaAdsData(silent = false) {
    const errorBox = document.getElementById("meta-api-error-box");
    const loadingSkeleton = document.getElementById("meta-loading-skeleton");
    const tableWrapper = document.getElementById("meta-table-wrapper");
    const syncBtn = document.getElementById("btn-sync-meta-api");

    if (errorBox) errorBox.style.display = "none";
    
    if (!silent) {
        if (loadingSkeleton) loadingSkeleton.style.display = "block";
        if (tableWrapper) tableWrapper.style.display = "none";
    }

    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.innerHTML = `<span class="spinner"></span> Sincronizando...`;
    }

    Promise.all([
        fetch('/api/meta-campaigns').then(res => res.json()),
        fetch('/api/meta-insights').then(res => res.json())
    ])
    .then(([resCamp, resIns]) => {
        if (!resCamp.success) {
            throw new Error(resCamp.error || "Falha ao obter campanhas do Meta Ads.");
        }
        if (!resIns.success) {
            throw new Error(resIns.error || "Falha ao obter dados de insights do Meta Ads.");
        }

        window.latestMetaInsights = resIns.data || [];

        renderMetaAdsTable(resCamp.data, resIns.data);
        renderVerbaRealPorCarro();
        renderRanking();

        if (loadingSkeleton) loadingSkeleton.style.display = "none";
        if (tableWrapper) tableWrapper.style.display = "block";
    })
    .catch(err => {
        console.error("Erro na integração com Meta API:", err);
        if (errorBox) {
            const errorMsg = document.getElementById("meta-api-error-msg");
            if (errorMsg) errorMsg.innerText = err.message || "Erro na conexão com a API do Meta Ads.";
            errorBox.style.display = "flex";
        }
        if (loadingSkeleton) loadingSkeleton.style.display = "none";
        if (tableWrapper) tableWrapper.style.display = "none";
    })
    .finally(() => {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = `<i data-lucide="refresh-cw"></i> Atualizar dados do Meta`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });
}

// Render dynamic campaign rows in Meta API view
function renderMetaAdsTable(campaigns, insights) {
    const tbody = document.getElementById("metaCampaignTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!campaigns || campaigns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhuma campanha ativa encontrada na conta de anúncios do Meta.</td></tr>`;
        return;
    }

    campaigns.forEach(camp => {
        const statusRaw = (camp.status || "").toUpperCase().trim();
        let statusText = "Pausada";
        let statusBadgeClass = "style='color: var(--primary-light) !important; background: rgba(220, 38, 38, 0.08) !important; border-color: rgba(220, 38, 38, 0.2) !important;'";
        
        if (statusRaw === 'ACTIVE') {
            statusText = "Ativa";
            statusBadgeClass = "style='color: var(--success) !important; background: var(--success-bg) !important; border-color: rgba(22, 163, 74, 0.2) !important;'";
        }

        let budgetText = "—";
        if (camp.daily_budget) {
            const budgetVal = parseFloat(camp.daily_budget) / 100;
            budgetText = budgetVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        const matched = insights.find(ins => ins.campaign_name === camp.name);

        let spentText = "Sem dados no período";
        let impressionsText = "—";
        let clicksText = "—";
        let ctrText = "—";

        if (matched) {
            const spent = parseFloat(matched.spend) || 0;
            spentText = spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            
            const impressions = parseInt(matched.impressions) || 0;
            impressionsText = impressions.toLocaleString('pt-BR');
            
            const clicks = parseInt(matched.clicks) || 0;
            clicksText = clicks.toLocaleString('pt-BR');

            if (impressions > 0) {
                const ctr = (clicks / impressions) * 100;
                ctrText = `${ctr.toFixed(2)}%`;
            }
        }

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${camp.name}</strong></td>
            <td><span class="badge" ${statusBadgeClass}>${statusText}</span></td>
            <td>${camp.objective || "—"}</td>
            <td>${budgetText}</td>
            <td>${spentText}</td>
            <td>${impressionsText}</td>
            <td>${clicksText}</td>
            <td><strong>${ctrText}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// Model & Campaign Cross-Reference Engine
function matchModelWithCampaign(carModel, campaignName) {
    if (!carModel || !campaignName) return false;
    const modelClean = carModel.toLowerCase();
    const campClean = campaignName.toLowerCase();
    
    const excludeWords = ['flex', 'automático', 'automatico', 'diesel', 'manual', 'turbo', 'd-4d', 'srx', 'ltz', 'plus', 'volcano', 'firefly', '1.0', '1.6', '1.8', '2.0', '2.8', '4x4', 'veículos', 'veiculo', 'carro'];
    
    const words = modelClean.split(/[\s,./-]+/)
        .filter(w => w.length >= 3 && !excludeWords.includes(w));
    
    if (words.length === 0) return false;

    return words.some(word => campClean.includes(word));
}

// Render "Verba Real por Carro" Comparison Dashboard
function renderVerbaRealPorCarro() {
    const tbody = document.getElementById("verbaCarroTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const activeCars = state.inventory.filter(car => car.status === 'active');
    const insightsList = window.latestMetaInsights || [];

    let totalPlanned = 0;
    let totalRealGasto = 0;

    if (activeCars.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum carro ativo na OLX no momento. Ative carros no Kanban para planejar verbas.</td></tr>`;
        return;
    }

    activeCars.forEach(car => {
        const planned = car.verba_mensal || 0;
        totalPlanned += planned;

        const matchingCampaigns = insightsList.filter(ins => matchModelWithCampaign(car.model, ins.campaign_name));
        const hasCampaign = matchingCampaigns.length > 0;
        
        let realGasto = 0;
        if (hasCampaign) {
            realGasto = matchingCampaigns.reduce((sum, ins) => sum + (parseFloat(ins.spend) || 0), 0);
            totalRealGasto += realGasto;
        }

        const diff = planned - realGasto;
        
        const formattedPlanned = planned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const formattedReal = hasCampaign 
            ? realGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : `<span style="color: var(--text-muted); font-style: italic; font-size: 0.78rem;">Nenhuma campanha Meta encontrada para este carro</span>`;
        
        const formattedDiff = diff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const diffClass = diff >= 0 ? 'text-success' : 'text-danger';

        const matchCountText = hasCampaign 
            ? `<span class="badge" style="color: var(--success) !important; background: var(--success-bg) !important; border-color: rgba(22, 163, 74, 0.2) !important;">${matchingCampaigns.length} campanha(s)</span>`
            : `<span class="badge badge-alert">Sem anúncios</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${car.model}</strong></td>
            <td>${formattedPlanned}</td>
            <td>${formattedReal}</td>
            <td class="${diffClass}"><strong>${formattedDiff}</strong></td>
            <td>${matchCountText}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("verba-stat-planejado").innerText = totalPlanned.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById("verba-stat-gasto-real").innerText = totalRealGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const totalDiff = totalPlanned - totalRealGasto;
    const saldoEl = document.getElementById("verba-stat-saldo");
    saldoEl.innerText = totalDiff.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    const saldoSub = document.getElementById("verba-stat-saldo-sub");
    if (totalDiff >= 0) {
        saldoEl.style.color = "var(--success)";
        saldoSub.innerHTML = `<span class="text-success">Dentro da verba planejada</span>`;
    } else {
        saldoEl.style.color = "var(--primary-light)";
        saldoSub.innerHTML = `<span class="text-danger">Orçamento global estourado</span>`;
    }
}

// Save Snapshot of current marketing status manually
window.saveManualSnapshot = function() {
    const hoje = new Date().toISOString().split('T')[0];
    
    const activeCars = state.inventory.filter(car => car.status === 'active');
    const totalCarrosAtivos = activeCars.length;
    const totalCarrosVendidosMes = state.inventory.filter(car => car.status === 'sold').length;
    const verbaPlanejadaTotal = activeCars.reduce((sum, c) => sum + (c.verba_mensal || 0), 0);
    
    const insightsList = window.latestMetaInsights || [];
    let gastoRealTotalMeta = 0;
    activeCars.forEach(car => {
        const matches = insightsList.filter(ins => matchModelWithCampaign(car.model, ins.campaign_name));
        if (matches.length > 0) {
            gastoRealTotalMeta += matches.reduce((sum, ins) => sum + (parseFloat(ins.spend) || 0), 0);
        }
    });

    const leadsTotalMes = state.campaigns.reduce((sum, c) => sum + c.leads, 0);
    const vendasTotalMes = state.campaigns.reduce((sum, c) => sum + c.sales, 0);

    const rowData = {
        data: hoje,
        total_carros_ativos: totalCarrosAtivos,
        total_carros_vendidos_mes: totalCarrosVendidosMes,
        verba_planejada_total: verbaPlanejadaTotal,
        gasto_real_total_meta: gastoRealTotalMeta,
        leads_total_mes: leadsTotalMes,
        vendas_total_mes: vendasTotalMes
    };

    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url");

    if (!sheetsUrl) {
        alert("A integração com o Google Sheets não está conectada. Conecte nas configurações para salvar snapshots.");
        return;
    }

    const existingSnap = state.historico.find(snap => snap.data === hoje);
    let action = "add";
    let rowIndex = null;

    if (existingSnap) {
        if (!confirm(`Já existe um snapshot com a data de hoje (${hoje}). Deseja substituir os dados existentes?`)) {
            return;
        }
        action = "update";
        rowIndex = existingSnap.rowIndex;
    } else {
        if (!confirm("Confirmar a criação do snapshot de hoje do painel?")) {
            return;
        }
    }

    const btn = document.getElementById("btn-save-snapshot");
    const originalHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Gravando...`;

    fetch('/api/sheets-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            spreadsheetUrl: sheetsUrl,
            sheetName: "Historico",
            action,
            rowData,
            rowIndex
        })
    })
    .then(res => res.json())
    .then(res => {
        if (!res.success) {
            throw new Error(res.error || "Erro ao gravar snapshot.");
        }
        
        showToast("Snapshot gravado com sucesso no Google Sheets!");
        
        return Promise.all([
            fetch('/api/sheets-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spreadsheetUrl: sheetsUrl, sheetName: 'Historico' })
            }).then(r => r.json())
        ]);
    })
    .then(([resHistory]) => {
        if (resHistory.success) {
            processHistoricoData(resHistory.data);
        }
        renderAll();
    })
    .catch(err => {
        alert(`Falha ao salvar snapshot:\n${err.message}`);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
};

// Render Historical line charts (SVG native crisp format)
function renderHistoryTrends() {
    const emptyState = document.getElementById("history-empty-state");
    const contentArea = document.getElementById("history-content");
    if (!emptyState || !contentArea) return;

    if (!state.historico || state.historico.length < 2) {
        emptyState.style.display = "block";
        contentArea.style.display = "none";
        return;
    }

    emptyState.style.display = "none";
    contentArea.style.display = "block";

    const sorted = [...state.historico].sort((a, b) => new Date(a.data) - new Date(b.data));

    plotTrendChart("chartBudgetTrend", sorted, 'verba_planejada_total', 'gasto_real_total_meta', 'var(--primary)', 'var(--fb-color)');
    plotTrendChart("chartLeadsSalesTrend", sorted, 'vendas_total_mes', 'leads_total_mes', 'var(--success)', '#6366f1');
}

function plotTrendChart(svgId, data, key1, key2, color1, color2) {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    svg.innerHTML = "";

    const width = 800;
    const height = 200;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    let maxVal = 10;
    data.forEach(d => {
        if (d[key1] > maxVal) maxVal = d[key1];
        if (d[key2] > maxVal) maxVal = d[key2];
    });
    maxVal = Math.ceil(maxVal / 10) * 10;

    const getY = (val) => {
        return paddingTop + chartHeight - (val / maxVal) * chartHeight;
    };

    const getX = (index) => {
        return paddingLeft + (index / (data.length - 1)) * chartWidth;
    };

    // Draw Gridlines and Y labels
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
        const val = (maxVal / gridCount) * i;
        const y = getY(val);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255,255,255,0.03)");
        line.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(line);

        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", paddingLeft - 10);
        label.setAttribute("y", y + 4);
        label.setAttribute("fill", "var(--text-muted)");
        label.setAttribute("font-size", "10");
        label.setAttribute("font-family", "var(--font-body)");
        label.setAttribute("text-anchor", "end");
        label.textContent = val >= 1000 ? `${(val/1000).toFixed(1)}k` : Math.round(val);
        svg.appendChild(label);
    }

    // Draw dates
    data.forEach((d, idx) => {
        const x = getX(idx);
        const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
        label.setAttribute("x", x);
        label.setAttribute("y", height - 10);
        label.setAttribute("fill", "var(--text-muted)");
        label.setAttribute("font-size", "9");
        label.setAttribute("font-family", "var(--font-body)");
        label.setAttribute("text-anchor", "middle");
        
        const dateObj = new Date(d.data + "T00:00:00");
        label.textContent = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        svg.appendChild(label);
    });

    const drawLine = (key, color) => {
        let pathD = "";
        const points = data.map((d, idx) => ({ x: getX(idx), y: getY(d[key]), val: d[key] }));
        
        points.forEach((p, idx) => {
            if (idx === 0) pathD += `M ${p.x} ${p.y}`;
            else {
                const prev = points[idx - 1];
                const cp1x = prev.x + (p.x - prev.x) / 3;
                const cp2x = prev.x + 2 * (p.x - prev.x) / 3;
                pathD += ` C ${cp1x} ${prev.y}, ${cp2x} ${p.y}, ${p.x} ${p.y}`;
            }
        });

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "2.5");
        path.setAttribute("stroke-linecap", "round");
        svg.appendChild(path);

        points.forEach(p => {
            const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            dot.setAttribute("cx", p.x);
            dot.setAttribute("cy", p.y);
            dot.setAttribute("r", "3.5");
            dot.setAttribute("fill", color);
            dot.setAttribute("stroke", "var(--bg-card)");
            dot.setAttribute("stroke-width", "1.5");
            
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = p.val.toLocaleString('pt-BR');
            dot.appendChild(title);

            svg.appendChild(dot);
        });
    };

    drawLine(key1, color1);
    drawLine(key2, color2);
}

// Render "Ranking de Performance" comparison
function renderRanking() {
    const tbody = document.getElementById("rankingTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const activeCars = state.inventory.filter(car => car.status === 'active');
    if (activeCars.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">Nenhum carro ativo no momento para exibir no ranking.</td></tr>`;
        return;
    }

    const insightsList = window.latestMetaInsights || [];

    // Calculate raw metrics for all active cars
    const carMetrics = activeCars.map(car => {
        // 1. CPL (Custo por Lead)
        const dias = car.data_olx ? calcularDiasNaOlx(car.data_olx) : null;
        const custo = car.custo_olx || (state.config.planoOlxMensal / 10);
        const custoAcumulado = dias !== null ? (custo / 30) * dias : 0;
        const leads = car.leads || 0;
        const cpl = leads > 0 ? (custoAcumulado / leads) : null;

        // 2. Dias na OLX
        const diasVal = dias;

        // 3. Adherence Deviation
        let spentReal = 0;
        const matchingCampaigns = insightsList.filter(ins => matchModelWithCampaign(car.model, ins.campaign_name));
        if (matchingCampaigns.length > 0) {
            spentReal = matchingCampaigns.reduce((sum, ins) => sum + (parseFloat(ins.spend) || 0), 0);
        }
        const verbaPlanejada = car.verba_mensal || 0;
        const adhDev = verbaPlanejada > 0 ? Math.abs(1 - (spentReal / verbaPlanejada)) : null;

        return {
            car,
            cpl,
            custoAcumulado,
            dias: diasVal,
            spentReal,
            verbaPlanejada,
            adhDev
        };
    });

    // Extract valid arrays to compute min/max
    const validCpls = carMetrics.map(m => m.cpl).filter(v => v !== null);
    const validDias = carMetrics.map(m => m.dias).filter(v => v !== null);
    const validAdhDevs = carMetrics.map(m => m.adhDev).filter(v => v !== null);

    const minCpl = validCpls.length > 0 ? Math.min(...validCpls) : 0;
    const maxCpl = validCpls.length > 0 ? Math.max(...validCpls) : 0;

    const minDias = validDias.length > 0 ? Math.min(...validDias) : 0;
    const maxDias = validDias.length > 0 ? Math.max(...validDias) : 0;

    const minAdhDev = validAdhDevs.length > 0 ? Math.min(...validAdhDevs) : 0;
    const maxAdhDev = validAdhDevs.length > 0 ? Math.max(...validAdhDevs) : 0;

    // Calculate final scores
    const scoredCars = carMetrics.map(item => {
        const scores = [];

        // Normalize CPL (lower is better, i.e., min is best)
        if (item.cpl !== null) {
            let score = 100;
            if (maxCpl !== minCpl) {
                score = ((maxCpl - item.cpl) / (maxCpl - minCpl)) * 100;
            }
            scores.push(score);
        }

        // Normalize Dias (lower is better, i.e., min is best)
        if (item.dias !== null) {
            let score = 100;
            if (maxDias !== minDias) {
                score = ((maxDias - item.dias) / (maxDias - minDias)) * 100;
            }
            scores.push(score);
        }

        // Normalize Adherence Deviation (lower is better, deviation closer to 0 is best)
        if (item.adhDev !== null) {
            let score = 100;
            if (maxAdhDev !== minAdhDev) {
                score = ((maxAdhDev - item.adhDev) / (maxAdhDev - minAdhDev)) * 100;
            }
            scores.push(score);
        }

        // Final score: average of available normalized factors
        const finalScore = scores.length > 0 
            ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
            : 50; // default to middle score if no indicators are available

        return {
            ...item,
            finalScore
        };
    });

    // Sort by finalScore descending (highest score first)
    scoredCars.sort((a, b) => b.finalScore - a.finalScore);

    // Render rows in the ranking table
    scoredCars.forEach((item, index) => {
        const position = index + 1;
        let positionHtml = `<span class="rank-position">${position}º</span>`;
        if (position === 1) {
            positionHtml = `<span class="rank-position" style="color: #fbbf24;"><span class="rank-medal">🏆</span> 1º</span>`;
        } else if (position === 2) {
            positionHtml = `<span class="rank-position" style="color: #9ca3af;"><span class="rank-medal">🥈</span> 2º</span>`;
        } else if (position === 3) {
            positionHtml = `<span class="rank-position" style="color: #b45309;"><span class="rank-medal">🥉</span> 3º</span>`;
        }

        const isLow = item.finalScore < 40;
        
        // Progress bar visual color classification
        let barColor = "var(--success)"; // Green
        if (item.finalScore < 40) {
            barColor = "var(--primary)"; // Red
        } else if (item.finalScore < 70) {
            barColor = "#eab308"; // Yellow
        }

        const formattedCpl = item.cpl !== null 
            ? item.cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : `<span style="color: var(--text-muted); font-style: italic;">Sem leads</span>`;

        const formattedDias = item.dias !== null 
            ? `${item.dias} dias`
            : `<span style="color: var(--text-muted); font-style: italic;">—</span>`;

        let formattedAdh = "—";
        if (item.verbaPlanejada > 0) {
            const ratio = (item.spentReal / item.verbaPlanejada) * 100;
            formattedAdh = `<strong>${Math.round(ratio)}%</strong> <span style="font-size: 0.72rem; color: var(--text-muted);">(${item.spentReal.toFixed(0)}/${item.verbaPlanejada.toFixed(0)})</span>`;
        } else {
            formattedAdh = `<span style="color: var(--text-muted); font-style: italic;">Sem verba</span>`;
        }

        const tr = document.createElement("tr");
        if (isLow) tr.className = "rank-row-low";

        tr.innerHTML = `
            <td>${positionHtml}</td>
            <td><strong>${item.car.model}</strong></td>
            <td>
                <div class="rank-progress-wrapper">
                    <span class="rank-score" style="color: ${barColor};">${item.finalScore}</span>
                    <div class="rank-progress-bar">
                        <div class="rank-progress-fill" style="width: ${item.finalScore}%; background: ${barColor};"></div>
                    </div>
                </div>
            </td>
            <td>${formattedCpl}</td>
            <td>${formattedDias}</td>
            <td>${formattedAdh}</td>
        `;
        tbody.appendChild(tr);
    });

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Integration Real API System (Google Sheets Live Auth & Read)
function connectMockAPI(type) {
    if (type === 'meta') {
        const token = document.getElementById("meta-token").value.trim();
        const badge = document.getElementById("badge-meta");
        const btn = document.getElementById("btn-connect-meta");
        
        if (!token) {
            alert("Por favor, insira um Access Token do Meta Ads válido.");
            return;
        }
        
        btn.innerText = "Conectando...";
        btn.disabled = true;
        
        setTimeout(() => {
            badge.innerText = "Conectado";
            badge.style.background = "rgba(16, 185, 129, 0.1)";
            badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
            badge.style.color = "var(--success)";
            
            btn.innerText = "Desconectar";
            btn.disabled = false;
            btn.className = "btn btn-outline btn-sm";
            btn.onclick = () => disconnectMockAPI('meta');
            
            localStorage.setItem("suagaragem_meta_token", token);
            
            alert("Meta Ads integrado com sucesso! Campanhas e Leads serão sincronizados em tempo real.");
        }, 1200);
    } else if (type === 'sheets') {
        const url = document.getElementById("sheets-url").value.trim();
        const badge = document.getElementById("badge-sheets");
        const btn = document.getElementById("btn-connect-sheets");
        
        if (!url || !url.includes("docs.google.com/spreadsheets")) {
            alert("Por favor, insira uma URL de planilha do Google Sheets válida.");
            return;
        }
        
        btn.innerHTML = `<span class="spinner"></span> Sincronizando...`;
        btn.disabled = true;

        const fetchEstoque = fetch('/api/sheets-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spreadsheetUrl: url, sheetName: 'Estoque' })
        }).then(res => res.json());

        const fetchCampanhas = fetch('/api/sheets-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spreadsheetUrl: url, sheetName: 'Campanhas' })
        }).then(res => res.json());

        const fetchHistorico = fetch('/api/sheets-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ spreadsheetUrl: url, sheetName: 'Historico' })
        }).then(res => res.json()).catch(() => ({ success: false }));

        Promise.all([fetchEstoque, fetchCampanhas, fetchHistorico])
            .then(([resEstoque, resCampanhas, resHistorico]) => {
                if (!resEstoque.success) {
                    throw new Error(`Aba 'Estoque': ${resEstoque.error}`);
                }
                if (!resCampanhas.success) {
                    throw new Error(`Aba 'Campanhas': ${resCampanhas.error}`);
                }

                processEstoqueData(resEstoque.data);
                processCampanhaData(resCampanhas.data);
                if (resHistorico && resHistorico.success) {
                    processHistoricoData(resHistorico.data);
                }

                badge.innerText = "Sincronizado";
                badge.style.background = "rgba(16, 185, 129, 0.1)";
                badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
                badge.style.color = "var(--success)";
                
                btn.innerText = "Desconectar";
                btn.disabled = false;
                btn.className = "btn btn-outline btn-sm";
                btn.onclick = () => disconnectMockAPI('sheets');

                localStorage.setItem("suagaragem_sheets_url", url);
                
                fetchConfig().then(() => {
                    renderAll();
                    showToast("Dados do Google Sheets sincronizados!");
                });
            })
            .catch(err => {
                badge.innerText = "Erro";
                badge.style.background = "rgba(229, 9, 20, 0.1)";
                badge.style.borderColor = "rgba(229, 9, 20, 0.2)";
                badge.style.color = "var(--primary)";
                
                btn.innerText = "Integrar Planilha";
                btn.disabled = false;
                
                alert(`Falha na integração:\n${err.message}`);
            });
        }
}

function disconnectMockAPI(type) {
    if (type === 'meta') {
        const badge = document.getElementById("badge-meta");
        const btn = document.getElementById("btn-connect-meta");
        document.getElementById("meta-token").value = "";
        
        badge.innerText = "Desconectado";
        badge.style.background = "rgba(229, 9, 20, 0.1)";
        badge.style.borderColor = "rgba(229, 9, 20, 0.2)";
        badge.style.color = "var(--primary)";
        
        btn.innerText = "Conectar Conta";
        btn.className = "btn btn-primary btn-sm";
        btn.onclick = () => connectMockAPI('meta');
        
        localStorage.removeItem("suagaragem_meta_token");
        window.latestMetaInsights = [];
        renderAll();
    } else if (type === 'sheets') {
        const badge = document.getElementById("badge-sheets");
        const btn = document.getElementById("btn-connect-sheets");
        document.getElementById("sheets-url").value = "";
        
        badge.innerText = "Desconectado";
        badge.style.background = "rgba(229, 9, 20, 0.1)";
        badge.style.borderColor = "rgba(229, 9, 20, 0.2)";
        badge.style.color = "var(--primary)";
        
        btn.innerText = "Integrar Planilha";
        btn.className = "btn btn-primary btn-sm";
        btn.onclick = () => connectMockAPI('sheets');
        
        localStorage.removeItem("suagaragem_sheets_url");
    }
}

function copyFeedURL() {
    const feedInput = document.getElementById("olx-feed-url");
    feedInput.select();
    feedInput.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(feedInput.value)
        .then(() => alert("URL do Feed XML da OLX copiada para a área de transferência!"))
        .catch(err => console.error("Erro ao copiar URL do feed: ", err));
}

// REAL DYNAMIC XML FEED GENERATOR
function generateXMLContent() {
    const activeCars = state.inventory.filter(car => car.status === 'active');
    
    let xml = `<?xml version="1.0" encoding="utf-8"?>\n`;
    xml += `<carga>\n`;
    xml += `  <anunciante>\n`;
    xml += `    <codigo_anunciante>suagaragem</codigo_anunciante>\n`;
    xml += `    <nome>Sua Garagem Veículos</nome>\n`;
    xml += `    <uf>ES</uf>\n`;
    xml += `  </anunciante>\n`;
    xml += `  <anuncios>\n`;
    
    activeCars.forEach(car => {
        const imagePath = window.location.origin + '/' + (IMAGE_MAP[car.image] || IMAGE_MAP.img_suv);
        xml += `    <anuncio>\n`;
        xml += `      <codigo>${car.id}</codigo>\n`;
        xml += `      <titulo><![CDATA[${car.model}]]></titulo>\n`;
        xml += `      <ano>${car.year.split('/')[0]}</ano>\n`;
        xml += `      <preco>${car.price}</preco>\n`;
        xml += `      <quilometragem>${car.km}</quilometragem>\n`;
        xml += `      <descricao><![CDATA[${car.model} | Ano ${car.year} | ${car.km.toLocaleString('pt-BR')} KM | Valor: R$ ${car.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Veículo com procedência e vistoria cautelar aprovada. Fale conosco!]]></descricao>\n`;
        xml += `      <imagens>\n`;
        xml += `        <imagem>${imagePath}</imagem>\n`;
        xml += `      </imagens>\n`;
        if (car.hot) {
            xml += `      <prioridade>destaque</prioridade>\n`;
        }
        xml += `    </anuncio>\n`;
    });
    
    xml += `  </anuncios>\n`;
    xml += `</carga>`;
    
    return xml;
}

// XML Modal Actions
function openXMLModal() {
    const xml = generateXMLContent();
    const xmlContainer = document.getElementById("xmlFeedContent");
    if (xmlContainer) xmlContainer.textContent = xml;
    const modal = document.getElementById("xmlModal");
    if (modal) modal.classList.add("active");
}

function closeXMLModal() {
    const modal = document.getElementById("xmlModal");
    if (modal) modal.classList.remove("active");
}

function copyXMLContent() {
    const xml = generateXMLContent();
    navigator.clipboard.writeText(xml)
        .then(() => alert("Conteúdo do XML copiado para a área de transferência!"))
        .catch(err => alert("Erro ao copiar XML: " + err));
}

function downloadXMLFeed() {
    const xml = generateXMLContent();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "olx-feed-suagaragem.xml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Global Move Car helper to easily allow dragging columns
window.moveCar = function(index, targetStatus) {
    updateCarStatusSheets(index, targetStatus);
};

// Fetch configuration from Vercel config-read serverless function
function fetchConfig() {
    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url") || "";
    const url = `/api/config-read?spreadsheetUrl=${encodeURIComponent(sheetsUrl)}`;

    return fetch(url)
        .then(res => res.json())
        .then(res => {
            if (res.success && res.config && res.config.plano_olx_mensal !== undefined) {
                state.config.planoOlxMensal = parseFloat(res.config.plano_olx_mensal) || 672.99;
            } else {
                state.config.planoOlxMensal = 672.99;
            }
        })
        .catch(err => {
            console.error("Erro ao ler configuração do Sheets, usando fallback:", err);
            state.config.planoOlxMensal = 672.99;
        })
        .finally(() => {
            const settingsInput = document.getElementById("config-plano-olx");
            if (settingsInput) {
                settingsInput.value = state.config.planoOlxMensal.toFixed(2);
            }
        });
}

// Save configuration back to Google Sheets via config-write
window.saveSettings = function(event) {
    event.preventDefault();

    const planoOlxInput = document.getElementById("config-plano-olx");
    if (!planoOlxInput) return;

    const valor = parseFloat(planoOlxInput.value);
    if (isNaN(valor) || valor < 0) {
        alert("Por favor, insira um valor numérico válido.");
        return;
    }

    const sheetsUrl = localStorage.getItem("suagaragem_sheets_url");

    if (sheetsUrl) {
        const btn = document.getElementById("btn-save-settings");
        const originalHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Salvando...`;

        fetch('/api/config-write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                spreadsheetUrl: sheetsUrl,
                chave: "plano_olx_mensal",
                valor: valor
            })
        })
        .then(res => res.json())
        .then(res => {
            if (!res.success) {
                throw new Error(res.error || "Erro ao salvar configurações no Sheets.");
            }
            state.config.planoOlxMensal = valor;
            renderAll();
            showToast("Configurações salvas no Google Sheets!");
        })
        .catch(err => {
            alert(`Falha ao salvar no Google Sheets:\n${err.message}`);
        })
        .finally(() => {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        });

    } else {
        // Fallback local
        state.config.planoOlxMensal = valor;
        renderAll();
        showToast("Configurações salvas localmente!");
    }
};

// Open Quick Sold Modal and populate dropdown with active cars
window.openQuickSoldModal = function() {
    const select = document.getElementById("quick-sold-car-select");
    if (!select) return;
    select.innerHTML = "";

    const activeCars = state.inventory
        .map((car, index) => ({ ...car, originalIndex: index }))
        .filter(car => car.status === 'active');

    if (activeCars.length === 0) {
        const option = document.createElement("option");
        option.value = "";
        option.disabled = true;
        option.selected = true;
        option.innerText = "Nenhum carro ativo no momento.";
        select.appendChild(option);
    } else {
        activeCars.forEach(car => {
            const option = document.createElement("option");
            option.value = car.originalIndex;
            option.innerText = car.model;
            select.appendChild(option);
        });
    }

    document.getElementById("quickSoldModal").classList.add("active");
};

// Close Quick Mark as Sold Modal
window.closeQuickSoldModal = function() {
    document.getElementById("quickSoldModal").classList.remove("active");
};

// Handle Form Submission for Quick Mark as Sold
window.handleQuickSoldSubmit = function(event) {
    event.preventDefault();
    const select = document.getElementById("quick-sold-car-select");
    if (!select || select.value === "") return;

    const index = parseInt(select.value);
    closeQuickSoldModal();
    
    // Trigger existing markAsSoldQuick logic
    markAsSoldQuick(index);
};

// Generate Today's Alerts list based on inventory state
function renderAlerts() {
    const container = document.getElementById("overview-alerts-container");
    if (!container) return;
    container.innerHTML = "";

    const alertsList = [];

    // 1. Check for OLX stagnation (> 20 days)
    const rotationCount = state.inventory.filter(car => {
        if (car.status !== 'active') return false;
        const dias = car.data_olx ? calcularDiasNaOlx(car.data_olx) : null;
        return dias !== null && dias > 20;
    }).length;

    if (rotationCount > 0) {
        alertsList.push({
            type: 'warning',
            text: `${rotationCount} carro${rotationCount > 1 ? 's' : ''} precisando de rotação na OLX (mais de 20 dias).`,
            action: () => switchTab('olx-rotation')
        });
    }

    // 2. Check for budget adherence overflow
    const activeCars = state.inventory.filter(car => car.status === 'active');
    const insightsList = window.latestMetaInsights || [];
    let overspentCount = 0;

    activeCars.forEach(car => {
        const verbaPlanejada = car.verba_mensal || 0;
        if (verbaPlanejada > 0) {
            const matchingCampaigns = insightsList.filter(ins => matchModelWithCampaign(car.model, ins.campaign_name));
            const spentReal = matchingCampaigns.reduce((sum, ins) => sum + (parseFloat(ins.spend) || 0), 0);
            if (spentReal > verbaPlanejada) {
                overspentCount++;
            }
        }
    });

    if (overspentCount > 0) {
        alertsList.push({
            type: 'danger',
            text: `${overspentCount} carro${overspentCount > 1 ? 's' : ''} estourando o orçamento planejado no Meta Ads.`,
            action: () => switchTab('simulator')
        });
    }

    // 3. Render
    if (alertsList.length === 0) {
        const okBox = document.createElement("div");
        okBox.style.cssText = "display: flex; align-items: center; gap: 0.5rem; color: var(--success); font-size: 0.82rem; font-weight: 500;";
        okBox.innerHTML = `<i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Tudo em ordem hoje`;
        container.appendChild(okBox);
    } else {
        alertsList.forEach(alertItem => {
            const alertEl = document.createElement("div");
            alertEl.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem 0.75rem; font-size: 0.82rem; cursor: pointer; transition: background 0.2s;";
            alertEl.onclick = alertItem.action;
            alertEl.onmouseenter = () => alertEl.style.background = "rgba(255, 255, 255, 0.05)";
            alertEl.onmouseleave = () => alertEl.style.background = "rgba(255, 255, 255, 0.02)";

            const iconColor = alertItem.type === 'danger' ? 'var(--primary-light)' : 'var(--warning)';
            const iconName = alertItem.type === 'danger' ? 'alert-triangle' : 'clock';

            alertEl.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="${iconName}" style="color: ${iconColor}; width: 15px; height: 15px; flex-shrink: 0;"></i>
                    <span>${alertItem.text}</span>
                </div>
                <span style="color: var(--text-muted); font-size: 0.72rem; display: flex; align-items: center; gap: 0.2rem;">Ver <i data-lucide="chevron-right" style="width: 12px; height: 12px;"></i></span>
            `;
            container.appendChild(alertEl);
        });
    }

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Toggle manual campaigns section under Settings tab
window.toggleManualCampaignsSection = function() {
    const content = document.getElementById("manual-campaigns-collapsible-content");
    const icon = document.getElementById("manual-campaigns-toggle-icon");
    const badge = document.getElementById("manual-campaigns-toggle-badge");
    if (!content || !icon || !badge) return;

    if (content.style.display === "none") {
        content.style.display = "block";
        icon.style.transform = "rotate(180deg)";
        badge.innerText = "Recolher";
    } else {
        content.style.display = "none";
        icon.style.transform = "rotate(0deg)";
        badge.innerText = "Expandir";
    }
};
