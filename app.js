// State Management
let state = {
    region: 'all',
    totalBudget: 2000,
    allocation: {
        olx: 400,
        fb: 600,
        ig: 1000
    },
    inventory: [],
    campaigns: []
};

// Initial Mock Data
const INITIAL_CARS = [
    { id: 1, model: "Jeep Renegade 1.8 Flex Automático", year: "2020/2020", price: 82000, km: 54000, status: "active", image: "img_suv", hot: true },
    { id: 2, model: "Chevrolet Onix 1.0 Turbo LTZ", year: "2021/2022", price: 74900, km: 38000, status: "active", image: "img_hatch", hot: false },
    { id: 3, model: "Toyota Hilux 2.8 D-4D Diesel SRX", year: "2019/2019", price: 189000, km: 92000, status: "stock", image: "img_pickup", hot: true },
    { id: 4, model: "Honda Civic 2.0 EXL Automático", year: "2018/2019", price: 98000, km: 71000, status: "stock", image: "img_sedan", hot: false },
    { id: 5, model: "Hyundai Creta 1.6 Pulse Plus", year: "2021/2021", price: 89900, km: 42000, status: "active", image: "img_suv", hot: false },
    { id: 6, model: "Fiat Strada 1.3 Firefly Volcano", year: "2022/2023", price: 92000, km: 23000, status: "sold", image: "img_pickup", hot: false }
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
    img_pickup: 'assets/pickup_robust.jpg'
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
        ig_cpl: 13.50, // Instagram performa melhor/mais barato na Grande Vitória
        tip: "<strong>Dica para Grande Vitória:</strong> Pessoas buscam agilidade. Campanhas de Instagram focadas em vídeos curtos mostrando detalhes internos (painel, teto solar, espaço) funcionam muito bem. Anuncie Onix, HB20 e SUVs médios."
    },
    linhares: {
        olx_cpl: 18.00, // OLX mais barato na região norte para utilitários
        fb_cpl: 13.00, // Facebook Marketplace orgânico e pago muito forte
        ig_cpl: 18.00, // Instagram tem CPL ligeiramente maior
        tip: "<strong>Dica para Linhares & Região Norte:</strong> O público de agro e comércio local valoriza picapes e carros para trabalho (Strada, Toro, Hilux). Anúncios na OLX com títulos detalhados de manutenção e pneus geram muitos leads."
    }
};

// App Initialization
document.addEventListener("DOMContentLoaded", () => {
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
    }

    // Initialize Lucide Icons
    lucide.createIcons();

    // Set preview image for modal initial state
    previewSelectedImage();

    // Initial render
    renderAll();
});

// Save states helper functions
function saveInventoryToStorage() {
    localStorage.setItem("automarketing_inventory", JSON.stringify(state.inventory));
}

function saveCampaignsToStorage() {
    localStorage.setItem("automarketing_campaigns", JSON.stringify(state.campaigns));
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
        simulator: "Simulador de Verba",
        "olx-manager": "Gerenciador do Plano OLX",
        "campaign-tracker": "Rastreamento de Performance Real",
        integrations: "Conexões de API & Planilhas",
        "local-insights": "Insights de Mercado Regional (ES)"
    };
    document.getElementById("main-title").innerText = titles[tabId] || "Sua Garagem Marketing";
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
    calculateBudgetSimulation(false); // Update simulator projections with current state budget
    renderPerformanceChart();
    renderKanban();
    renderCampaignTable();
    updateTips();
}

// Update Top Stats Card
function renderStats() {
    // 1. Budget
    document.getElementById("stat-budget").innerText = `R$ ${state.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 2. Projected Leads & CPL based on region metrics and current allocation
    const benchmarks = REGION_BENCHMARKS[state.region];
    
    const olxLeads = state.allocation.olx / benchmarks.olx_cpl;
    const fbLeads = state.allocation.fb / benchmarks.fb_cpl;
    const igLeads = state.allocation.ig / benchmarks.ig_cpl;
    const totalLeads = Math.round(olxLeads + fbLeads + igLeads);
    
    document.getElementById("stat-leads").innerText = totalLeads;
    
    const avgCPL = totalLeads > 0 ? (state.totalBudget / totalLeads) : 0;
    document.getElementById("stat-cpl").innerText = `R$ ${avgCPL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // 3. OLX Filling Status
    const activeOLXCount = state.inventory.filter(car => car.status === 'active').length;
    document.getElementById("stat-olx-fill").innerText = `${activeOLXCount} / 10`;

    const badge = document.getElementById("stat-olx-badge");
    if (activeOLXCount > 10) {
        badge.innerText = "Limite Excedido!";
        badge.className = "stat-change negative";
    } else if (activeOLXCount === 10) {
        badge.innerText = "Plano 100% Preenchido";
        badge.className = "stat-change positive";
    } else {
        badge.innerText = `${10 - activeOLXCount} slots disponíveis`;
        badge.className = "stat-change neutral";
    }
}

// Render Overview Budget Bars
function renderDistributionBars() {
    const total = state.totalBudget;
    const olxPct = total > 0 ? Math.round((state.allocation.olx / total) * 100) : 0;
    const fbPct = total > 0 ? Math.round((state.allocation.fb / total) * 100) : 0;
    const igPct = total > 0 ? Math.round((state.allocation.ig / total) * 100) : 0;

    // Update Label texts
    document.getElementById("dist-val-olx").innerText = `R$ ${state.allocation.olx} (${olxPct}%)`;
    document.getElementById("dist-val-fb").innerText = `R$ ${state.allocation.fb} (${fbPct}%)`;
    document.getElementById("dist-val-ig").innerText = `R$ ${state.allocation.ig} (${igPct}%)`;

    // Update Progress Bars
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

    // Render 10 slots
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

// Budget Simulation Calculators
function calculateBudgetSimulation(isManualInput = false) {
    const rangeSlider = document.getElementById("totalBudgetRange");
    if (!rangeSlider) return;
    
    const inputOlx = document.getElementById("sim-olx");
    const inputFb = document.getElementById("sim-fb");
    const inputIg = document.getElementById("sim-ig");

    if (!isManualInput) {
        // Range slider changed, update allocation automatically (OLX fixo + remaining split)
        state.totalBudget = parseInt(rangeSlider.value);
        document.getElementById("budgetRangeValue").innerText = `R$ ${state.totalBudget.toLocaleString('pt-BR')}`;
        
        // Fixed OLX cost default R$ 400 (minimum 300)
        state.allocation.olx = Math.min(400, Math.round(state.totalBudget * 0.2));
        if (state.allocation.olx < 300) state.allocation.olx = 300;
        
        const remaining = state.totalBudget - state.allocation.olx;
        // Split remaining: 60% Instagram, 40% Facebook Marketplace Ads
        state.allocation.ig = Math.round(remaining * 0.6);
        state.allocation.fb = remaining - state.allocation.ig;

        // Update input values on page
        if (inputOlx) inputOlx.value = state.allocation.olx;
        if (inputFb) inputFb.value = state.allocation.fb;
        if (inputIg) inputIg.value = state.allocation.ig;
    } else {
        // Manual numeric input changed, sum total budget
        state.allocation.olx = parseInt(inputOlx.value) || 0;
        state.allocation.fb = parseInt(inputFb.value) || 0;
        state.allocation.ig = parseInt(inputIg.value) || 0;

        state.totalBudget = state.allocation.olx + state.allocation.fb + state.allocation.ig;
        rangeSlider.value = state.totalBudget;
        document.getElementById("budgetRangeValue").innerText = `R$ ${state.totalBudget.toLocaleString('pt-BR')}`;
    }

    // Recalculate projections on Simulator view
    const benchmarks = REGION_BENCHMARKS[state.region];

    // OLX projections
    const olxLeads = state.allocation.olx / benchmarks.olx_cpl;
    const projOlxLeads = document.getElementById("proj-olx-leads");
    const projOlxCpl = document.getElementById("proj-olx-cpl");
    if (projOlxLeads) projOlxLeads.innerText = Math.round(olxLeads);
    if (projOlxCpl) projOlxCpl.innerText = `R$ ${benchmarks.olx_cpl.toFixed(2)}`;

    // Facebook Marketplace projections
    const fbLeads = state.allocation.fb / benchmarks.fb_cpl;
    const projFbLeads = document.getElementById("proj-fb-leads");
    const projFbCpl = document.getElementById("proj-fb-cpl");
    if (projFbLeads) projFbLeads.innerText = Math.round(fbLeads);
    if (projFbCpl) projFbCpl.innerText = `R$ ${benchmarks.fb_cpl.toFixed(2)}`;

    // Instagram projections
    const igLeads = state.allocation.ig / benchmarks.ig_cpl;
    const projIgLeads = document.getElementById("proj-ig-leads");
    const projIgCpl = document.getElementById("proj-ig-cpl");
    if (projIgLeads) projIgLeads.innerText = Math.round(igLeads);
    if (projIgCpl) projIgCpl.innerText = `R$ ${benchmarks.ig_cpl.toFixed(2)}`;

    // Update main stats summary as well since total budget modified
    document.getElementById("stat-budget").innerText = `R$ ${state.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const totalLeads = Math.round(olxLeads + fbLeads + igLeads);
    document.getElementById("stat-leads").innerText = totalLeads;
    const avgCPL = totalLeads > 0 ? (state.totalBudget / totalLeads) : 0;
    document.getElementById("stat-cpl").innerText = `R$ ${avgCPL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Render distribution visual bars
    renderDistributionBars();
}

// Draw dynamic SVG Performance Chart on Overview Tab
function renderPerformanceChart() {
    const svg = document.getElementById("performanceChart");
    if (!svg) return;
    svg.innerHTML = "";

    // If campaigns is empty, show empty state
    if (state.campaigns.length === 0) {
        svg.innerHTML = `<text x="400" y="100" fill="var(--text-muted)" font-family="var(--font-body)" font-size="14" text-anchor="middle">Sem dados de campanhas registrados no momento.</text>`;
        return;
    }

    // Sort campaigns by date ascending
    const campaigns = [...state.campaigns].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Get unique dates
    const dates = [...new Set(campaigns.map(c => c.date))];
    if (dates.length < 2) {
        // Add a mock start point if there's only 1 date to make it draw a line
        const dateObj = new Date(dates[0]);
        dateObj.setDate(dateObj.getDate() - 5);
        dates.unshift(dateObj.toISOString().split('T')[0]);
    }

    // Determine max leads to scale Y-axis
    let maxLeads = 10;
    campaigns.forEach(c => {
        if (c.leads > maxLeads) maxLeads = c.leads;
    });
    maxLeads = Math.ceil(maxLeads / 10) * 10; // round up to multiple of 10

    const width = 800;
    const height = 200;
    const paddingLeft = 50;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Helper to get Y coordinate for a lead value
    const getY = (val) => {
        return paddingTop + chartHeight - (val / maxLeads) * chartHeight;
    };

    // Helper to get X coordinate for date index
    const getX = (index) => {
        return paddingLeft + (index / (dates.length - 1)) * chartWidth;
    };

    // Draw Gridlines and Y Labels
    const gridLinesCount = 4;
    for (let i = 0; i <= gridLinesCount; i++) {
        const val = (maxLeads / gridLinesCount) * i;
        const y = getY(val);

        // Line
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", paddingLeft);
        line.setAttribute("y1", y);
        line.setAttribute("x2", width - paddingRight);
        line.setAttribute("y2", y);
        line.setAttribute("stroke", "rgba(255, 255, 255, 0.04)");
        line.setAttribute("stroke-dasharray", "4,4");
        svg.appendChild(line);

        // Text label
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

    // Draw X Labels (Dates)
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

    // Channels configuration
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

        // Generate line path
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

        // Area path (close it to bottom)
        if (points.length > 0) {
            const first = points[0];
            const last = points[points.length - 1];
            const areaD = `${pathD} L ${last.x} ${getY(0)} L ${first.x} ${getY(0)} Z`;

            // Draw Area
            const areaEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            areaEl.setAttribute("d", areaD);
            areaEl.setAttribute("fill", `url(#${ch.gradientId})`);
            svg.appendChild(areaEl);

            // Draw Line
            const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
            lineEl.setAttribute("d", pathD);
            lineEl.setAttribute("fill", "none");
            lineEl.setAttribute("stroke", ch.color);
            lineEl.setAttribute("stroke-width", "2.5");
            lineEl.setAttribute("stroke-linecap", "round");
            svg.appendChild(lineEl);

            // Draw Dots
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

// KANBAN SYSTEM (OLX 10 CAR PLANNERS)
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
        // Apply Search and Category/Type filters
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

    // Update column counters
    document.getElementById("count-stock").innerText = stockCount;
    document.getElementById("count-active").innerText = `${activeCount} / 10`;
    document.getElementById("count-sold").innerText = soldCount;

    // Active limit warning check
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

// Create Card DOM Element
function createCarCard(car, index) {
    const cardEl = document.createElement("div");
    cardEl.className = "car-card";
    cardEl.draggable = true;
    cardEl.setAttribute("ondragstart", `drag(event, ${index})`);
    
    const formattedPrice = car.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formattedKm = car.km.toLocaleString('pt-BR');
    const imagePath = IMAGE_MAP[car.image] || IMAGE_MAP.img_suv;

    // Controls depending on column status
    let actionButtons = "";
    if (car.status === "stock") {
        actionButtons = `
            <button class="btn btn-outline btn-sm" onclick="moveCar(${index}, 'active')" title="Ativar no plano OLX">
                Ativar OLX <i data-lucide="arrow-right"></i>
            </button>
        `;
    } else if (car.status === "active") {
        actionButtons = `
            <button class="btn btn-outline btn-sm" onclick="moveCar(${index}, 'stock')" title="Mover de volta para estoque">
                <i data-lucide="arrow-left"></i> Estoque
            </button>
            <button class="btn btn-primary btn-sm" onclick="moveCar(${index}, 'sold')" title="Marcar como vendido">
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
            <img src="${imagePath}" alt="${car.model}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
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

    // Instantiate newly created icons in the card
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

// Move Car Status
function moveCar(index, newStatus) {
    state.inventory[index].status = newStatus;
    saveInventoryToStorage();
    renderAll();
}

// Car Modal Add / Edit UI controller
function openAddCarModal() {
    document.getElementById("modalTitle").innerText = "Adicionar Carro ao Estoque";
    document.getElementById("carForm").reset();
    document.getElementById("carIndex").value = "";
    previewSelectedImage();
    
    document.getElementById("carModal").classList.add("active");
}

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

    const carData = { model, year, price, km, status, image, hot };

    if (indexVal === "") {
        // Add new
        carData.id = Date.now();
        state.inventory.push(carData);
    } else {
        // Edit existing
        const index = parseInt(indexVal);
        carData.id = state.inventory[index].id;
        state.inventory[index] = carData;
    }

    saveInventoryToStorage();
    closeCarModal();
    renderAll();
}

// Delete Car from Inventory
function deleteCar(index) {
    if (confirm("Deseja realmente excluir este veículo do estoque?")) {
        state.inventory.splice(index, 1);
        saveInventoryToStorage();
        renderAll();
    }
}

// CAMPAIGN LOGS TRACKER SYSTEM
function renderCampaignTable() {
    const tbody = document.getElementById("campaignTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";

    // Sort campaigns by date descending
    const sorted = [...state.campaigns].sort((a, b) => new Date(b.date) - new Date(a.date));

    sorted.forEach(camp => {
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
}

// Save logged campaigns
function saveCampaign(event) {
    event.preventDefault();

    const date = document.getElementById("camp-date").value;
    const channel = document.getElementById("camp-channel").value;
    const spent = parseFloat(document.getElementById("camp-spent").value);
    const leads = parseInt(document.getElementById("camp-leads").value);
    const sales = parseInt(document.getElementById("camp-sales").value);

    const newCamp = { date, channel, spent, leads, sales };
    state.campaigns.push(newCamp);

    saveCampaignsToStorage();
    document.getElementById("campaignForm").reset();
    renderAll();
}

function clearCampaignHistory() {
    if (confirm("Deseja realmente apagar todo o histórico de campanhas?")) {
        state.campaigns = [];
        saveCampaignsToStorage();
        renderAll();
    }
}

// Integration Mock System with LocalStorage persistence
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
            
            // Persist locally
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
        
        btn.innerText = "Integrando...";
        btn.disabled = true;
        
        setTimeout(() => {
            badge.innerText = "Sincronizado";
            badge.style.background = "rgba(16, 185, 129, 0.1)";
            badge.style.borderColor = "rgba(16, 185, 129, 0.2)";
            badge.style.color = "var(--success)";
            
            btn.innerText = "Desconectar";
            btn.disabled = false;
            btn.className = "btn btn-outline btn-sm";
            btn.onclick = () => disconnectMockAPI('sheets');
            
            // Persist locally
            localStorage.setItem("suagaragem_sheets_url", url);
            
            alert("Planilha sincronizada! Os novos contatos de leads cairão diretamente nesta planilha.");
        }, 1200);
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
        
        // Remove from storage
        localStorage.removeItem("suagaragem_meta_token");
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
        
        // Remove from storage
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
