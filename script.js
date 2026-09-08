// ==========================================================================
// G3NIE - MOTOR DE DADOS, CRIPTOGRAFIA, IMAGENS E INTERAÇÕES
// ==========================================================================

const STORAGE_KEYS = {
    PORTFOLIO: 'g3d_portfolio_items',
    SERVICES: 'g3d_services_items',
    QUOTES: 'g3d_quotes_list',
    ADMIN_PASS_HASH: 'g3d_admin_pass_hash',
    AUTH_SESSION: 'g3d_admin_session_auth'
};

// Hash criptográfico SHA-256 inicial padrão
const DEFAULT_ADMIN_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';

// Função de Hashing SHA-256 Nativa (Web Crypto API)
async function hashString(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Processamento e compressão de imagens para LocalStorage (evita estouro de cota)
function processImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.82) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject('Arquivo selecionado não é uma imagem válida.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject('Falha ao processar arquivo de imagem.');
            img.src = e.target.result;
        };
        reader.onerror = () => reject('Erro ao ler arquivo.');
        reader.readAsDataURL(file);
    });
}

// Dados Padrão Iniciais
const DEFAULT_DATA = {
    portfolio: [
        {
            id: 'port-1',
            title: 'Case Eletrônico Personalizado',
            description: 'Protótipo funcional com encaixes precisos para placa PCB e conectores externos.',
            category: 'Prototipagem',
            material: 'PETG',
            imageUrl: ''
        },
        {
            id: 'port-2',
            title: 'Estátua Colecionável em Resina',
            description: 'Escultura com acabamento liso e riqueza de microdetalhes.',
            category: 'Colecionáveis',
            material: 'Resina Ultra HD',
            imageUrl: ''
        },
        {
            id: 'port-3',
            title: 'Engrenagem Mecânica de Reposição',
            description: 'Peça técnica para substituição industrial com alta resistência mecânica.',
            category: 'Engenharia',
            material: 'Nylon / ABS',
            imageUrl: ''
        },
        {
            id: 'port-4',
            title: 'Luminária Geométrica Paramétrica',
            description: 'Objeto de decoração impresso em filamento especial translúcido.',
            category: 'Decoração',
            material: 'PLA Silk',
            imageUrl: ''
        }
    ],
    services: [
        {
            id: 'serv-1',
            title: '1. Impressão 3D sob Encomenda',
            description: 'Imprimimos suas peças com base no seu arquivo 3D ou projeto, orientando na escolha do melhor material.',
            items: [
                'Filamentos: PLA (decorativo e geral), PETG (resistente), ABS (resistência térmica), TPU (flexível)',
                'Resina: Para peças com muitos detalhes e acabamento super liso (miniaturas, colecionáveis)'
            ]
        },
        {
            id: 'serv-2',
            title: '2. Modelagem & Ajustes de Arquivo',
            description: 'Não tem o arquivo 3D pronto? Ajudamos a modelar ou fazer pequenas alterações no seu projeto.',
            items: [
                'Criação de modelos a partir de medidas, rascunhos ou fotos',
                'Correções em arquivos com defeitos ou malhas abertas'
            ]
        },
        {
            id: 'serv-3',
            title: '3. Acabamento & Pós-Processamento',
            description: 'Deixamos sua peça pronta para o uso ou apresentação final.',
            items: [
                'Remoção cuidadosa de suportes de impressão',
                'Lixamento básico e aplicação de primer para pintura'
            ]
        }
    ],
    quotes: [
        {
            id: 'quote-101',
            name: 'Carlos Mendes',
            email: 'carlos.mendes@email.com',
            phone: '(11) 98765-4321',
            serviceType: 'Impressão FDM',
            material: 'PETG',
            message: 'Preciso de 4 unidades de uma engrenagem personalizada de 60mm. Tenho arquivo .STL pronto.',
            date: '18/08/2026 14:30',
            status: 'Pendente'
        },
        {
            id: 'quote-102',
            name: 'Mariana Silva',
            email: 'mariana.silva@email.com',
            phone: '(21) 99887-1122',
            serviceType: 'Impressão 3D FDM (Filamento)',
            material: 'PLA Silk',
            message: 'Cotação para impressão de uma luminária decorativa personalizada com filamento translúcido.',
            date: '18/08/2026 16:15',
            status: 'Em Análise'
        }
    ]
};

// Funções de Acesso ao LocalStorage
function getStoredData(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        if (!data) {
            localStorage.setItem(key, JSON.stringify(fallback));
            return fallback;
        }
        return JSON.parse(data);
    } catch (e) {
        console.error('Erro ao ler localStorage', e);
        return fallback;
    }
}

function setStoredData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Erro ao salvar no localStorage', e);
        if (e.name === 'QuotaExceededError') {
            alert('Atenção: Limite de armazenamento do navegador atingido. Tente usar imagens menores.');
        }
    }
}

// Inicializa dados padrão caso vazios
function initDataStorage() {
    getStoredData(STORAGE_KEYS.PORTFOLIO, DEFAULT_DATA.portfolio);
    getStoredData(STORAGE_KEYS.SERVICES, DEFAULT_DATA.services);
    getStoredData(STORAGE_KEYS.QUOTES, DEFAULT_DATA.quotes);
    
    localStorage.removeItem('g3d_admin_password');

    if (!localStorage.getItem(STORAGE_KEYS.ADMIN_PASS_HASH)) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_PASS_HASH, DEFAULT_ADMIN_HASH);
    }
}

// Toast Notifier
function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Função para escapar caracteres especiais em HTML e evitar quebras
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Tratamento seguro quando a imagem não puder ser carregada
window.handleCardImgError = function(img, title) {
    const wrapper = img.parentElement;
    if (wrapper) {
        img.remove();
        if (!wrapper.querySelector('.img-placeholder')) {
            const ph = document.createElement('div');
            ph.className = 'img-placeholder';
            const safeTitle = title || 'Item';
            ph.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z"/></svg><span>[ ${safeTitle} ]</span>`;
            wrapper.appendChild(ph);
        }
    }
};

// ==========================================================================
// RENDERIZAÇÃO DAS PÁGINAS PÚBLICAS
// ==========================================================================

// 1. Renderiza Portfólio (portifolio.html e index.html)
function renderPublicPortfolio() {
    const gallery = document.getElementById('public-portfolio-grid');
    const homePreview = document.getElementById('home-portfolio-preview');
    const portfolio = getStoredData(STORAGE_KEYS.PORTFOLIO, DEFAULT_DATA.portfolio);

    const svgIcon = `<svg viewBox="0 0 24 24"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z"/></svg>`;

    function generateCardHtml(item) {
        const titleEsc = escapeHtml(item.title);
        const descEsc = escapeHtml(item.description);
        const catEsc = escapeHtml(item.category);
        const matEsc = escapeHtml(item.material);
        const imgUrl = item.imageUrl ? String(item.imageUrl).trim() : '';

        const hasValidImg = imgUrl.length > 0;
        const imageElement = hasValidImg
            ? `<img src="${escapeHtml(imgUrl)}" alt="${titleEsc}" class="portfolio-card-img" onerror="handleCardImgError(this, '${titleEsc.replace(/'/g, "\\'")}')">`
            : `<div class="img-placeholder">${svgIcon}<span>[ ${titleEsc} ]</span></div>`;

        const badgeHtml = catEsc ? `<span class="portfolio-card-badge">${catEsc}</span>` : '';
        const metaHtml = matEsc ? `<div class="portfolio-meta"><span><strong>Material:</strong> ${matEsc}</span></div>` : '';

        return `
            <div class="portfolio-card" data-id="${item.id}">
                <div class="portfolio-card-img-wrapper">
                    ${imageElement}
                    ${badgeHtml}
                </div>
                <div class="portfolio-info">
                    <h3 class="portfolio-title">${titleEsc}</h3>
                    <p class="portfolio-desc">${descEsc}</p>
                    ${metaHtml}
                </div>
            </div>
        `;
    }

    if (gallery) {
        if (portfolio.length === 0) {
            gallery.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Nenhum item cadastrado no portfólio no momento.</p>`;
        } else {
            gallery.innerHTML = portfolio.map(generateCardHtml).join('');
        }
    }

    if (homePreview) {
        const recentItems = portfolio.slice(0, 3);
        if (recentItems.length === 0) {
            homePreview.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">Nenhum trabalho recente para exibir.</p>`;
        } else {
            homePreview.innerHTML = recentItems.map(generateCardHtml).join('');
        }
    }
}

// 2. Renderiza Serviços (servico.html)
function renderPublicServices() {
    const servicesList = document.getElementById('public-services-list');
    if (!servicesList) return;

    const services = getStoredData(STORAGE_KEYS.SERVICES, DEFAULT_DATA.services);

    if (services.length === 0) {
        servicesList.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Nenhum serviço cadastrado no momento.</p>`;
        return;
    }

    servicesList.innerHTML = services.map(srv => {
        const itemsHtml = srv.items && srv.items.length > 0 
            ? `<ul class="service-items-list">${srv.items.map(it => `<li>${it}</li>`).join('')}</ul>`
            : '';

        return `
            <div class="service-block" data-id="${srv.id}">
                <h3>${srv.title}</h3>
                <p>${srv.description}</p>
                ${itemsHtml}
            </div>
        `;
    }).join('');
}

// 3. Inicializa Formulário de Orçamento (orcamento.html)
function initQuoteForm() {
    const form = document.getElementById('quote-request-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('quote-name').value.trim();
        const email = document.getElementById('quote-email').value.trim();
        const phone = document.getElementById('quote-phone').value.trim();
        const serviceType = document.getElementById('quote-service-type').value;
        const material = document.getElementById('quote-material').value.trim();
        const message = document.getElementById('quote-message').value.trim();

        if (!name || !email || !message) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const now = new Date();
        const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const newQuote = {
            id: 'quote-' + Date.now(),
            name,
            email,
            phone: phone || 'Não informado',
            serviceType: serviceType || 'Geral',
            material: material || 'A definir',
            message,
            date: formattedDate,
            status: 'Pendente'
        };

        const quotes = getStoredData(STORAGE_KEYS.QUOTES, DEFAULT_DATA.quotes);
        quotes.unshift(newQuote);
        setStoredData(STORAGE_KEYS.QUOTES, quotes);

        form.reset();

        const alertBox = document.getElementById('quote-success-alert');
        if (alertBox) {
            alertBox.style.display = 'block';
            setTimeout(() => {
                alertBox.style.display = 'none';
            }, 6000);
        } else {
            showToast('Orçamento enviado com sucesso!');
        }
    });
}

// ==========================================================================
// PAINEL ADMINISTRATIVO / GESTÃO (admin.html)
// ==========================================================================

function initAdminPanel() {
    const authScreen = document.getElementById('admin-auth-screen');
    const adminDashboard = document.getElementById('admin-dashboard');
    if (!authScreen || !adminDashboard) return;

    const loginForm = document.getElementById('admin-login-form');
    const passInput = document.getElementById('admin-password-input');
    const authError = document.getElementById('admin-auth-error');
    const navLogout = document.getElementById('admin-nav-logout');
    const navChangePass = document.getElementById('admin-nav-change-pass');
    const btnLogout = document.getElementById('btn-admin-logout');
    const btnChangePass = document.getElementById('btn-change-pass');

    // Modals
    const modalOverlay = document.getElementById('admin-modal-overlay');
    const modalTitle = document.getElementById('admin-modal-title');
    const modalBody = document.getElementById('admin-modal-body');
    const modalCloseBtn = document.getElementById('admin-modal-close');

    function openModal(title, contentHtml) {
        if (!modalOverlay) return;
        modalTitle.textContent = title;
        modalBody.innerHTML = contentHtml;
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('active');
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Verifica se já está autenticado na sessão atual
    function checkAuth() {
        const isAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
        if (isAuth) {
            authScreen.style.display = 'none';
            adminDashboard.style.display = 'block';
            if (navLogout) navLogout.style.display = 'inline-block';
            if (navChangePass) navChangePass.style.display = 'inline-block';

            renderAdminPortfolio();
            renderAdminServices();
            renderAdminQuotes();
        } else {
            authScreen.style.display = 'flex';
            adminDashboard.style.display = 'none';
            if (navLogout) navLogout.style.display = 'none';
            if (navChangePass) navChangePass.style.display = 'none';
            if (passInput) passInput.value = '';
        }
    }

    // Login Submit com Criptografia SHA-256
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const enteredPass = passInput.value;
            const enteredHash = await hashString(enteredPass);
            const storedHash = localStorage.getItem(STORAGE_KEYS.ADMIN_PASS_HASH) || DEFAULT_ADMIN_HASH;

            if (enteredHash === storedHash) {
                sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
                if (authError) authError.style.display = 'none';
                checkAuth();
                showToast('Acesso concedido com sucesso!');
            } else {
                if (authError) {
                    authError.style.display = 'block';
                    authError.textContent = 'Senha incorreta. Tente novamente.';
                }
                passInput.select();
            }
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
            checkAuth();
            showToast('Você saiu da área de gestão.');
        });
    }

    // Alterar Senha com Criptografia SHA-256
    if (btnChangePass) {
        btnChangePass.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('Alterar Senha de Acesso', `
                <form id="form-change-password">
                    <div class="form-group">
                        <label>Senha Atual *</label>
                        <input type="password" id="curr-pass" class="form-control" required placeholder="Digite a senha atual">
                    </div>
                    <div class="form-group">
                        <label>Nova Senha * (mínimo 4 caracteres)</label>
                        <input type="password" id="new-pass" class="form-control" required minlength="4" placeholder="Digite a nova senha">
                    </div>
                    <div class="form-group">
                        <label>Confirmar Nova Senha *</label>
                        <input type="password" id="confirm-new-pass" class="form-control" required minlength="4" placeholder="Repita a nova senha">
                    </div>
                    <div id="pass-error-msg" style="color: #f87171; font-size: 0.85rem; margin-bottom: 1rem; display: none;"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-pass">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Salvar Nova Senha</button>
                    </div>
                </form>
            `);

            document.getElementById('btn-cancel-pass').addEventListener('click', closeModal);
            document.getElementById('form-change-password').addEventListener('submit', async (ev) => {
                ev.preventDefault();
                const currPass = document.getElementById('curr-pass').value;
                const newPass = document.getElementById('new-pass').value;
                const confirmNewPass = document.getElementById('confirm-new-pass').value;
                const errorDiv = document.getElementById('pass-error-msg');
                
                const currHash = await hashString(currPass);
                const storedHash = localStorage.getItem(STORAGE_KEYS.ADMIN_PASS_HASH) || DEFAULT_ADMIN_HASH;

                if (currHash !== storedHash) {
                    errorDiv.textContent = 'A senha atual informada está incorreta.';
                    errorDiv.style.display = 'block';
                    return;
                }

                if (newPass !== confirmNewPass) {
                    errorDiv.textContent = 'A confirmação não coincide com a nova senha.';
                    errorDiv.style.display = 'block';
                    return;
                }

                const newHash = await hashString(newPass);
                localStorage.setItem(STORAGE_KEYS.ADMIN_PASS_HASH, newHash);
                closeModal();
                showToast('Senha de acesso alterada com sucesso!');
            });
        });
    }

    // Tabs
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = document.getElementById(btn.getAttribute('data-target'));
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // -------------------------------------------------------------
    // GESTÃO DO PORTFÓLIO (COM UPLOAD / PRÉVIA DE IMAGENS)
    // -------------------------------------------------------------
    function renderAdminPortfolio() {
        const tableBody = document.getElementById('admin-portfolio-table-body');
        if (!tableBody) return;

        const portfolio = getStoredData(STORAGE_KEYS.PORTFOLIO, DEFAULT_DATA.portfolio);

        if (portfolio.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Nenhum item cadastrado no portfólio.</td></tr>`;
            return;
        }

        tableBody.innerHTML = portfolio.map(item => {
            const safeTitle = escapeHtml(item.title);
            const thumbHtml = item.imageUrl
                ? `<img src="${escapeHtml(item.imageUrl)}" class="admin-thumb" alt="${safeTitle}" onerror="this.outerHTML='<span class=\\'admin-thumb-placeholder\\'>Sem foto</span>'">`
                : `<span class="admin-thumb-placeholder">Sem foto</span>`;

            return `
                <tr>
                    <td>${thumbHtml}</td>
                    <td><strong>${safeTitle}</strong></td>
                    <td>${escapeHtml(item.category || '-')}</td>
                    <td>${escapeHtml(item.material || '-')}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.description)}</td>
                    <td>
                        <div class="admin-actions">
                            <button class="btn btn-secondary btn-sm edit-portfolio-btn" data-id="${item.id}">Editar</button>
                            <button class="btn btn-danger btn-sm delete-portfolio-btn" data-id="${item.id}">Excluir</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Eventos de Editar
        tableBody.querySelectorAll('.edit-portfolio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = portfolio.find(p => p.id === id);
                if (!item) return;

                openModal('Editar Item do Portfólio', `
                    <form id="form-edit-portfolio">
                        <div class="form-group">
                            <label>Título do Projeto / Peça *</label>
                            <input type="text" id="edit-port-title" class="form-control" value="${item.title}" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Categoria</label>
                                <input type="text" id="edit-port-category" class="form-control" value="${item.category || ''}" placeholder="Ex: Prototipagem, Decoração">
                            </div>
                            <div class="form-group">
                                <label>Material</label>
                                <input type="text" id="edit-port-material" class="form-control" value="${item.material || ''}" placeholder="Ex: PLA, PETG, Resina">
                            </div>
                        </div>

                        <!-- Seção de Imagem -->
                        <div class="form-group">
                            <label>Imagem da Peça</label>
                            <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                                <div>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">Opção 1: Enviar arquivo do computador</span>
                                    <input type="file" id="edit-port-file" accept="image/*" class="form-control" style="margin-top: 0.3rem;">
                                </div>
                                <div>
                                    <span style="font-size: 0.8rem; color: var(--text-muted);">Opção 2: Ou digite o caminho/link da imagem</span>
                                    <input type="text" id="edit-port-image-url" class="form-control" value="${item.imageUrl || ''}" placeholder="Ex: g3nie_logo.png ou https://..." style="margin-top: 0.3rem;">
                                </div>
                            </div>
                            
                            <!-- Prévia Visual da Imagem -->
                            <div id="edit-preview-box" class="image-preview-container" style="${item.imageUrl ? '' : 'display: none;'}">
                                <img id="edit-preview-img" src="${item.imageUrl || ''}" class="image-preview-thumb" alt="Prévia">
                                <div>
                                    <span style="font-size: 0.85rem; color: #38bdf8;">Imagem carregada</span>
                                    <br>
                                    <button type="button" class="btn btn-danger btn-sm" id="btn-remove-edit-img" style="margin-top: 0.4rem;">Remover Imagem</button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Descrição *</label>
                            <textarea id="edit-port-desc" class="form-control" required>${item.description}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-port">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Alterações</button>
                        </div>
                    </form>
                `);

                let currentImageData = item.imageUrl || '';
                const fileInput = document.getElementById('edit-port-file');
                const urlInput = document.getElementById('edit-port-image-url');
                const previewBox = document.getElementById('edit-preview-box');
                const previewImg = document.getElementById('edit-preview-img');
                const btnRemoveImg = document.getElementById('btn-remove-edit-img');

                function updatePreview(src) {
                    if (src && src.trim().length > 0) {
                        currentImageData = src.trim();
                        previewImg.src = currentImageData;
                        previewBox.style.display = 'flex';
                    } else {
                        currentImageData = '';
                        previewImg.src = '';
                        previewBox.style.display = 'none';
                    }
                }

                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            const dataUrl = await processImageFile(file);
                            urlInput.value = '';
                            updatePreview(dataUrl);
                        } catch (err) {
                            alert(err);
                        }
                    }
                });

                urlInput.addEventListener('input', (e) => {
                    updatePreview(e.target.value);
                });

                btnRemoveImg.addEventListener('click', () => {
                    fileInput.value = '';
                    urlInput.value = '';
                    updatePreview('');
                });

                document.getElementById('btn-cancel-port').addEventListener('click', closeModal);
                document.getElementById('form-edit-portfolio').addEventListener('submit', (e) => {
                    e.preventDefault();
                    item.title = document.getElementById('edit-port-title').value.trim();
                    item.category = document.getElementById('edit-port-category').value.trim();
                    item.material = document.getElementById('edit-port-material').value.trim();
                    item.imageUrl = currentImageData;
                    item.description = document.getElementById('edit-port-desc').value.trim();

                    setStoredData(STORAGE_KEYS.PORTFOLIO, portfolio);
                    closeModal();
                    renderAdminPortfolio();
                    showToast('Item do portfólio atualizado com sucesso!');
                });
            });
        });

        // Eventos de Excluir
        tableBody.querySelectorAll('.delete-portfolio-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Tem certeza de que deseja excluir este item do portfólio?')) {
                    const updated = portfolio.filter(p => p.id !== id);
                    setStoredData(STORAGE_KEYS.PORTFOLIO, updated);
                    renderAdminPortfolio();
                    showToast('Item removido com sucesso!');
                }
            });
        });
    }

    // Botão Adicionar Portfólio
    const addPortfolioBtn = document.getElementById('btn-add-portfolio');
    if (addPortfolioBtn) {
        addPortfolioBtn.addEventListener('click', () => {
            openModal('Novo Item no Portfólio', `
                <form id="form-add-portfolio">
                    <div class="form-group">
                        <label>Título do Projeto / Peça *</label>
                        <input type="text" id="new-port-title" class="form-control" placeholder="Ex: Peça Industrial Sob Medida" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Categoria</label>
                            <input type="text" id="new-port-category" class="form-control" placeholder="Ex: Prototipagem, Colecionáveis">
                        </div>
                        <div class="form-group">
                            <label>Material</label>
                            <input type="text" id="new-port-material" class="form-control" placeholder="Ex: PETG, Resina 8K, ABS">
                        </div>
                    </div>

                    <!-- Seção de Imagem -->
                    <div class="form-group">
                        <label>Imagem da Peça</label>
                        <div style="display: flex; flex-direction: column; gap: 0.6rem;">
                            <div>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">Opção 1: Selecionar arquivo do computador</span>
                                <input type="file" id="new-port-file" accept="image/*" class="form-control" style="margin-top: 0.3rem;">
                            </div>
                            <div>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">Opção 2: Ou digite o caminho/link da imagem</span>
                                <input type="text" id="new-port-image-url" class="form-control" placeholder="Ex: g3nie_logo.png ou https://..." style="margin-top: 0.3rem;">
                            </div>
                        </div>

                        <!-- Prévia Visual da Imagem -->
                        <div id="new-preview-box" class="image-preview-container" style="display: none;">
                            <img id="new-preview-img" src="" class="image-preview-thumb" alt="Prévia">
                            <div>
                                <span style="font-size: 0.85rem; color: #38bdf8;">Imagem carregada</span>
                                <br>
                                <button type="button" class="btn btn-danger btn-sm" id="btn-remove-new-img" style="margin-top: 0.4rem;">Remover Imagem</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Descrição *</label>
                        <textarea id="new-port-desc" class="form-control" placeholder="Descreva a finalidade, dimensões ou características da peça..." required></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-new-port">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar ao Portfólio</button>
                    </div>
                </form>
            `);

            let newImageData = '';
            const fileInput = document.getElementById('new-port-file');
            const urlInput = document.getElementById('new-port-image-url');
            const previewBox = document.getElementById('new-preview-box');
            const previewImg = document.getElementById('new-preview-img');
            const btnRemoveImg = document.getElementById('btn-remove-new-img');

            function updatePreview(src) {
                if (src && src.trim().length > 0) {
                    newImageData = src.trim();
                    previewImg.src = newImageData;
                    previewBox.style.display = 'flex';
                } else {
                    newImageData = '';
                    previewImg.src = '';
                    previewBox.style.display = 'none';
                }
            }

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const dataUrl = await processImageFile(file);
                        urlInput.value = '';
                        updatePreview(dataUrl);
                    } catch (err) {
                        alert(err);
                    }
                }
            });

            urlInput.addEventListener('input', (e) => {
                updatePreview(e.target.value);
            });

            btnRemoveImg.addEventListener('click', () => {
                fileInput.value = '';
                urlInput.value = '';
                updatePreview('');
            });

            document.getElementById('btn-cancel-new-port').addEventListener('click', closeModal);
            document.getElementById('form-add-portfolio').addEventListener('submit', (e) => {
                e.preventDefault();
                const newItem = {
                    id: 'port-' + Date.now(),
                    title: document.getElementById('new-port-title').value.trim(),
                    category: document.getElementById('new-port-category').value.trim() || 'Geral',
                    material: document.getElementById('new-port-material').value.trim(),
                    imageUrl: newImageData,
                    description: document.getElementById('new-port-desc').value.trim()
                };

                const portfolio = getStoredData(STORAGE_KEYS.PORTFOLIO, DEFAULT_DATA.portfolio);
                portfolio.unshift(newItem);
                setStoredData(STORAGE_KEYS.PORTFOLIO, portfolio);
                closeModal();
                renderAdminPortfolio();
                showToast('Item adicionado ao portfólio com sucesso!');
            });
        });
    }

    // -------------------------------------------------------------
    // GESTÃO DOS SERVIÇOS
    // -------------------------------------------------------------
    function renderAdminServices() {
        const tableBody = document.getElementById('admin-services-table-body');
        if (!tableBody) return;

        const services = getStoredData(STORAGE_KEYS.SERVICES, DEFAULT_DATA.services);

        if (services.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">Nenhum serviço cadastrado.</td></tr>`;
            return;
        }

        tableBody.innerHTML = services.map(srv => `
            <tr>
                <td><strong>${srv.title}</strong></td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${srv.description}</td>
                <td>${srv.items ? srv.items.length : 0} tópico(s)</td>
                <td>
                    <div class="admin-actions">
                        <button class="btn btn-secondary btn-sm edit-service-btn" data-id="${srv.id}">Editar</button>
                        <button class="btn btn-danger btn-sm delete-service-btn" data-id="${srv.id}">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Eventos de Editar Serviço
        tableBody.querySelectorAll('.edit-service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const srv = services.find(s => s.id === id);
                if (!srv) return;

                const itemsText = (srv.items || []).join('\n');

                openModal('Editar Serviço', `
                    <form id="form-edit-service">
                        <div class="form-group">
                            <label>Título do Serviço *</label>
                            <input type="text" id="edit-srv-title" class="form-control" value="${srv.title}" required>
                        </div>
                        <div class="form-group">
                            <label>Descrição Geral *</label>
                            <textarea id="edit-srv-desc" class="form-control" required>${srv.description}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Tópicos / Especificações (um por linha)</label>
                            <textarea id="edit-srv-items" class="form-control" rows="4" placeholder="Digite cada detalhe em uma linha">${itemsText}</textarea>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="btn-cancel-srv">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Serviço</button>
                        </div>
                    </form>
                `);

                document.getElementById('btn-cancel-srv').addEventListener('click', closeModal);
                document.getElementById('form-edit-service').addEventListener('submit', (e) => {
                    e.preventDefault();
                    srv.title = document.getElementById('edit-srv-title').value.trim();
                    srv.description = document.getElementById('edit-srv-desc').value.trim();
                    const rawItems = document.getElementById('edit-srv-items').value.split('\n');
                    srv.items = rawItems.map(i => i.trim()).filter(i => i.length > 0);

                    setStoredData(STORAGE_KEYS.SERVICES, services);
                    closeModal();
                    renderAdminServices();
                    showToast('Serviço atualizado com sucesso!');
                });
            });
        });

        // Eventos de Excluir Serviço
        tableBody.querySelectorAll('.delete-service-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Tem certeza de que deseja excluir este serviço?')) {
                    const updated = services.filter(s => s.id !== id);
                    setStoredData(STORAGE_KEYS.SERVICES, updated);
                    renderAdminServices();
                    showToast('Serviço removido com sucesso!');
                }
            });
        });
    }

    // Botão Adicionar Serviço
    const addServiceBtn = document.getElementById('btn-add-service');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            openModal('Novo Serviço', `
                <form id="form-add-service">
                    <div class="form-group">
                        <label>Título do Serviço *</label>
                        <input type="text" id="new-srv-title" class="form-control" placeholder="Ex: 4. Escaneamento 3D" required>
                    </div>
                    <div class="form-group">
                        <label>Descrição Geral *</label>
                        <textarea id="new-srv-desc" class="form-control" placeholder="Descreva brevemente o serviço..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Tópicos / Especificações (um por linha)</label>
                        <textarea id="new-srv-items" class="form-control" rows="4" placeholder="Ex:\nDigitalização de peças físicas\nGeração de malha 3D (.STL)\nInspeção dimensional"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="btn-cancel-new-srv">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Adicionar Serviço</button>
                    </div>
                </form>
            `);

            document.getElementById('btn-cancel-new-srv').addEventListener('click', closeModal);
            document.getElementById('form-add-service').addEventListener('submit', (e) => {
                e.preventDefault();
                const rawItems = document.getElementById('new-srv-items').value.split('\n');
                const newService = {
                    id: 'serv-' + Date.now(),
                    title: document.getElementById('new-srv-title').value.trim(),
                    description: document.getElementById('new-srv-desc').value.trim(),
                    items: rawItems.map(i => i.trim()).filter(i => i.length > 0)
                };

                const services = getStoredData(STORAGE_KEYS.SERVICES, DEFAULT_DATA.services);
                services.push(newService);
                setStoredData(STORAGE_KEYS.SERVICES, services);
                closeModal();
                renderAdminServices();
                showToast('Novo serviço cadastrado com sucesso!');
            });
        });
    }

    // -------------------------------------------------------------
    // GESTÃO DOS ORÇAMENTOS
    // -------------------------------------------------------------
    function renderAdminQuotes() {
        const tableBody = document.getElementById('admin-quotes-table-body');
        if (!tableBody) return;

        const quotes = getStoredData(STORAGE_KEYS.QUOTES, DEFAULT_DATA.quotes);

        if (quotes.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Nenhum orçamento recebido até o momento.</td></tr>`;
            return;
        }

        function getStatusBadgeClass(status) {
            if (status === 'Concluído') return 'status-concluido';
            if (status === 'Em Análise') return 'status-analise';
            return 'status-pendente';
        }

        tableBody.innerHTML = quotes.map(q => `
            <tr>
                <td><small style="color: var(--text-muted);">${q.date || '-'}</small></td>
                <td><strong>${q.name}</strong></td>
                <td>${q.phone || '-'}<br><small style="color: var(--text-muted);">${q.email}</small></td>
                <td>${q.serviceType || 'Geral'}</td>
                <td><span class="status-badge ${getStatusBadgeClass(q.status)}">${q.status || 'Pendente'}</span></td>
                <td>
                    <div class="admin-actions">
                        <button class="btn btn-secondary btn-sm view-quote-btn" data-id="${q.id}">Ver Detalhes</button>
                        <button class="btn btn-danger btn-sm delete-quote-btn" data-id="${q.id}">Excluir</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Evento Ver Detalhes do Orçamento
        tableBody.querySelectorAll('.view-quote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const quote = quotes.find(q => q.id === id);
                if (!quote) return;

                openModal(`Orçamento #${quote.id}`, `
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">Data da Solicitação:</span>
                            <p><strong>${quote.date}</strong></p>
                        </div>
                        <div class="form-row">
                            <div>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Cliente:</span>
                                <p><strong>${quote.name}</strong></p>
                            </div>
                            <div>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Telefone / WhatsApp:</span>
                                <p><a href="https://wa.me/55${(quote.phone || '').replace(/\D/g, '')}" target="_blank" style="color: #38bdf8; text-decoration: none;">${quote.phone} ↗</a></p>
                            </div>
                        </div>
                        <div class="form-row">
                            <div>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">E-mail:</span>
                                <p><a href="mailto:${quote.email}" style="color: #38bdf8; text-decoration: none;">${quote.email}</a></p>
                            </div>
                            <div>
                                <span style="color: var(--text-muted); font-size: 0.85rem;">Serviço / Material:</span>
                                <p>${quote.serviceType} | ${quote.material || 'Padrão'}</p>
                            </div>
                        </div>
                        <div>
                            <span style="color: var(--text-muted); font-size: 0.85rem;">Descrição do Projeto:</span>
                            <div style="background-color: var(--bg-surface); padding: 1rem; border-radius: 6px; border: 1px solid var(--border); margin-top: 0.3rem;">
                                ${quote.message.replace(/\n/g, '<br>')}
                            </div>
                        </div>
                        <div class="form-group" style="margin-top: 0.5rem;">
                            <label>Alterar Status do Orçamento:</label>
                            <select id="change-quote-status" class="form-control">
                                <option value="Pendente" ${quote.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                                <option value="Em Análise" ${quote.status === 'Em Análise' ? 'selected' : ''}>Em Análise</option>
                                <option value="Concluído" ${quote.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="btn-close-quote-view">Fechar</button>
                            <button type="button" class="btn btn-primary" id="btn-save-quote-status">Atualizar Status</button>
                        </div>
                    </div>
                `);

                document.getElementById('btn-close-quote-view').addEventListener('click', closeModal);
                document.getElementById('btn-save-quote-status').addEventListener('click', () => {
                    const newStatus = document.getElementById('change-quote-status').value;
                    quote.status = newStatus;
                    setStoredData(STORAGE_KEYS.QUOTES, quotes);
                    closeModal();
                    renderAdminQuotes();
                    showToast('Status do orçamento atualizado!');
                });
            });
        });

        // Evento Excluir Orçamento
        tableBody.querySelectorAll('.delete-quote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Tem certeza de que deseja excluir este pedido de orçamento?')) {
                    const updated = quotes.filter(q => q.id !== id);
                    setStoredData(STORAGE_KEYS.QUOTES, updated);
                    renderAdminQuotes();
                    showToast('Orçamento excluído com sucesso!');
                }
            });
        });
    }

    // Botão de Restaurar Dados Padrão
    const resetDataBtn = document.getElementById('btn-reset-defaults');
    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('Atenção: Isso irá redefinir os serviços, portfólio e orçamentos para os dados de exemplo padrão. Deseja continuar?')) {
                setStoredData(STORAGE_KEYS.PORTFOLIO, DEFAULT_DATA.portfolio);
                setStoredData(STORAGE_KEYS.SERVICES, DEFAULT_DATA.services);
                setStoredData(STORAGE_KEYS.QUOTES, DEFAULT_DATA.quotes);
                renderAdminPortfolio();
                renderAdminServices();
                renderAdminQuotes();
                showToast('Dados restaurados para o padrão!');
            }
        });
    }

    // Executa verificação inicial de autenticação
    checkAuth();
}

// ==========================================================================
// INICIALIZAÇÃO GERAL
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializa o storage
    initDataStorage();

    // 2. Menu Hambúrguer (Mobile)
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navbar = document.getElementById('navbar');

    if (hamburgerBtn && navbar) {
        hamburgerBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = navbar.classList.toggle('active');
            hamburgerBtn.classList.toggle('active');
            hamburgerBtn.setAttribute('aria-expanded', isOpen);
            hamburgerBtn.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        });

        const navLinks = navbar.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navbar.classList.remove('active');
                hamburgerBtn.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                hamburgerBtn.setAttribute('aria-label', 'Abrir menu');
            });
        });

        document.addEventListener('click', (event) => {
            if (!navbar.contains(event.target) && !hamburgerBtn.contains(event.target) && navbar.classList.contains('active')) {
                navbar.classList.remove('active');
                hamburgerBtn.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                hamburgerBtn.setAttribute('aria-label', 'Abrir menu');
            }
        });
    }

    // 3. Renderiza dados públicos
    renderPublicPortfolio();
    renderPublicServices();
    initQuoteForm();

    // 4. Inicializa o painel administrativo caso presente na página
    initAdminPanel();
});
