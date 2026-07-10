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
    document.getElementById("main-title").innerText = titles[tabId] || "AutoMarketing Dashboard";
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
    
    const avgCPL = state.totalBudget / totalLeads;
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
    const olxPct = Math.round((state.allocation.olx / total) * 100);
    const fbPct = Math.round((state.allocation.fb / total) * 100);
    const igPct = Math.round((state.allocation.ig / total) * 100);

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
    document.getElementById("tip-text").innerHTML = benchmarks.tip;
}

// Budget Simulation Calculators
function calculateBudgetSimulation(isManualInput = false) {
    const rangeSlider = document.getElementById("totalBudgetRange");
    
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
        inputOlx.value = state.allocation.olx;
        inputFb.value = state.allocation.fb;
        inputIg.value = state.allocation.ig;
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
    document.getElementById("proj-olx-leads").innerText = Math.round(olxLeads);
    document.getElementById("proj-olx-cpl").innerText = `R$ ${benchmarks.olx_cpl.toFixed(2)}`;

    // Facebook Marketplace projections
    const fbLeads = state.allocation.fb / benchmarks.fb_cpl;
    document.getElementById("proj-fb-leads").innerText = Math.round(fbLeads);
    document.getElementById("proj-fb-cpl").innerText = `R$ ${benchmarks.fb_cpl.toFixed(2)}`;

    // Instagram projections
    const igLeads = state.allocation.ig / benchmarks.ig_cpl;
    document.getElementById("proj-ig-leads").innerText = Math.round(igLeads);
    document.getElementById("proj-ig-cpl").innerText = `R$ ${benchmarks.ig_cpl.toFixed(2)}`;

    // Update main stats summary as well since total budget modified
    document.getElementById("stat-budget").innerText = `R$ ${state.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    const totalLeads = Math.round(olxLeads + fbLeads + igLeads);
    document.getElementById("stat-leads").innerText = totalLeads;
    const avgCPL = totalLeads > 0 ? (state.totalBudget / totalLeads) : 0;
    document.getElementById("stat-cpl").innerText = `R$ ${avgCPL.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Render distribution visual bars
    renderDistributionBars();
}

// KANBAN SYSTEM (OLX 10 CAR PLANNERS)
function renderKanban() {
    const stockContainer = document.getElementById("cards-stock");
    const activeContainer = document.getElementById("cards-active");
    const soldContainer = document.getElementById("cards-sold");

    stockContainer.innerHTML = "";
    activeContainer.innerHTML = "";
    soldContainer.innerHTML = "";

    let stockCount = 0;
    let activeCount = 0;
    let soldCount = 0;

    state.inventory.forEach((car, index) => {
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
        warningBanner.style.display = "flex";
        badgeActive.classList.add("negative");
    } else {
        warningBanner.style.display = "none";
        badgeActive.classList.remove("negative");
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

function drop(ev, targetStatus) {
    ev.preventDefault();
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
        }
    });
}

// CAMPAIGN LOGS TRACKER SYSTEM
function renderCampaignTable() {
    const tbody = document.getElementById("campaignTableBody");
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

// Integration Mock System
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
            
            alert("Meta Ads integrado com sucesso! Campanhas e Leads serão sincronizados em tempo real.");
        }, 1500);
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
            
            alert("Planilha sincronizada! Os novos contatos de leads cairão diretamente nesta planilha.");
        }, 1500);
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
    }
}

function copyFeedURL() {
    const feedInput = document.getElementById("olx-feed-url");
    feedInput.select();
    feedInput.setSelectionRange(0, 99999); /* For mobile devices */
    
    navigator.clipboard.writeText(feedInput.value)
        .then(() => {
            alert("URL do Feed XML da OLX copiada para a área de transferência!");
        })
        .catch(err => {
            console.error("Erro ao copiar URL do feed: ", err);
        });
}
