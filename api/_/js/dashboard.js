/**
 * =================================================================
 * app.js - Lógica Principal de la Aplicación de Banca (Versión API)
 * =================================================================
 */
document.addEventListener('DOMContentLoaded', function() {

    // =================================================================
    // 1. CAPA DE API (Comunicación con el Backend)
    // =================================================================
    const api = {
        async request(endpoint, options = {}) {
            try {
                const config = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    ...options
                };
                if (config.body && typeof config.body !== 'string') {
                    config.body = JSON.stringify(config.body);
                }

                const response = await fetch(`api/${endpoint}`, config);

                if (response.status === 401) {
                    controller.showLoginScreen();
                    throw new Error('No autorizado');
                }
                
                const responseData = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(responseData.message || `Error HTTP ${response.status}`);
                }
                
                return responseData;

            } catch (error) {
                console.error(`Error en API request a ${endpoint}:`, error);
                if (error.message !== 'No autorizado') {
                    render.showModal(error.message || 'Hubo un problema de conexión.');
                }
                throw error;
            }
        },
        
        getProfile: () => api.request('profile.php'),
        getCards: () => api.request('cards.php?action=list'),
        getTransactions: () => api.request('transactions.php'),
        getContacts: () => api.request('contacts.php?action=list'),
        addContact: (contactData) => api.request('contacts.php?action=add', { method: 'POST', body: contactData }),
        performTransfer: (transferData) => api.request('transfers.php', { method: 'POST', body: transferData }),
        getDynamicCvv: () => api.request('cards.php?action=cvv'),
        login: (formData) => fetch('api/auth.php', { method: 'POST', body: formData }),
        logout: () => api.request('logout.php')
    };
    
    // =================================================================
    // 2. ESTADO DE LA APLICACIÓN Y ELEMENTOS DEL DOM
    // =================================================================
    const state = { 
        theme: 'light', user: {}, cards: [], contacts: [], 
        transactions: [], currentTransfer: {}, previousBalance: 0,
        activeCardIndex: 0
    };

    const body = document.body;
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const navBar = document.getElementById('nav-bar');
    const dynamicContainer = document.getElementById('dynamic-screens-container');
    const modalContainer = document.getElementById('modal-container');
    
    // =================================================================
    // 3. CAPA CONTROLADORA (Lógica Principal)
    // =================================================================
    const controller = {
        async initializeApp(isInitialLoad = false) {
            render.skeletonDashboard();
            try {
                const [profileData, cardsData, transactionsData, contactsData] = await Promise.all([
                    api.getProfile(), api.getCards(), api.getTransactions(), api.getContacts()
                ]);

                if (profileData?.success) state.user = profileData.data;
                if (cardsData?.success) state.cards = cardsData.data;
                if (transactionsData?.success) state.transactions = transactionsData.data;
                if (contactsData?.success) state.contacts = contactsData.data;
                
                const debitCard = state.cards.find(c => c.tipo === 'Débito');
                if (debitCard) {
                    // Store the initial balance only on the first load to animate from it.
                    // On subsequent reloads, we want the current balance to avoid confusion.
                    state.previousBalance = isInitialLoad ? debitCard.balance : state.previousBalance;
                }
                render.dashboard(!isInitialLoad);
            } catch (error) {
                console.error("Error al inicializar la aplicación:", error);
                // The API layer already handles showing a modal for non-auth errors.
            }
        },
        
        showAppScreen() {
            loginScreen.classList.remove('active');
            loginScreen.style.display = 'none';
            appContainer.style.display = 'block';
            controller.showScreen('dashboard-screen');
        },
        
        showLoginScreen() {
            appContainer.style.display = 'none';
            loginScreen.style.display = 'flex';
            setTimeout(() => loginScreen.classList.add('active'), 10);
        },

        showScreen(screenId, params = {}) { 
            render.showScreen(screenId, params);
        },

        initializeTransferFlow(targetScreen = 'transfer-1') {
             // Reset transfer state
            state.currentTransfer = {};
            const screenMap = {
                'transfer-1': 'getTransferScreen1HTML',
                'transfer-2': 'getTransferScreen2HTML',
                'transfer-3': 'getTransferScreen3HTML',
                'new-contact': 'getNewContactScreenHTML',
            };
            const renderFunction = render[screenMap[targetScreen]];
            if(renderFunction) {
                dynamicContainer.innerHTML = renderFunction();
            }
        },

        async handleConfirmTransfer() {
            const confirmButton = document.getElementById('confirm-transfer-btn');
            confirmButton.disabled = true;
            confirmButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Procesando...`;
            
            try {
                const transferData = {
                    contactId: state.currentTransfer.contact.id,
                    amount: state.currentTransfer.amount,
                    concept: state.currentTransfer.concept
                };
                const result = await api.performTransfer(transferData);
                
                if (result.success) {
                    state.currentTransfer.receipt = result.receipt;
                    // Update balance on debit card
                    const debitCard = state.cards.find(c => c.tipo === 'Débito');
                    if (debitCard) {
                        state.previousBalance = debitCard.balance; // Store old balance for animation
                        debitCard.balance = result.newBalance;
                    }
                    // Show success screen
                    dynamicContainer.innerHTML = render.getSuccessScreenHTML();
                } else {
                    render.showModal(result.message || 'La transferencia no pudo ser completada.');
                    confirmButton.disabled = false;
                    confirmButton.innerHTML = 'Confirmar Transferencia';
                }
            } catch (error) {
                render.showModal(error.message || 'Ocurrió un error inesperado.');
                confirmButton.disabled = false;
                confirmButton.innerHTML = 'Confirmar Transferencia';
            }
        },

        async handleSaveContact() {
            const saveButton = document.getElementById('save-contact-btn');
            const form = document.getElementById('new-contact-form');
            const nameInput = form.querySelector('input[name="name"]');
            const clabeInput = form.querySelector('input[name="clabe"]');

            const contactData = {
                name: nameInput.value.trim(),
                clabe: clabeInput.value.trim()
            };

            if (!contactData.name || !contactData.clabe) {
                render.showModal('Por favor, completa todos los campos.');
                return;
            }

            saveButton.disabled = true;
            saveButton.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Guardando...`;

            try {
                const result = await api.addContact(contactData);
                if (result.success) {
                    render.showModal('Contacto guardado con éxito', 'success');
                    // Refresh contacts and go back to transfer screen
                    const contactsData = await api.getContacts();
                    if(contactsData.success) state.contacts = contactsData.data;
                    controller.initializeTransferFlow('transfer-1');
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                render.showModal(error.message || 'No se pudo guardar el contacto.');
                saveButton.disabled = false;
                saveButton.textContent = 'Guardar Contacto';
            }
        },
    };
    
    // =================================================================
    // 4. CAPA DE RENDERIZADO Y UTILIDADES
    // =================================================================
    const render = {
        formatCurrency: (amount = 0) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount),
        
        formatDate: (dateString, format = 'short') => {
            const date = new Date(dateString);
            const options = {};
            if (format === 'short') {
                options.month = 'short';
                options.day = 'numeric';
            } else { // 'long'
                options.weekday = 'long';
                options.year = 'numeric';
                options.month = 'long';
                options.day = 'numeric';
            }
            return new Intl.DateTimeFormat('es-MX', options).format(date);
        },

        getCardGradient: (type) => {
            const gradients = {
                'Débito': 'from-sky-500 to-indigo-500',
                'Crédito': 'from-rose-400 via-fuchsia-500 to-indigo-500',
                'default': 'from-gray-700 to-gray-900'
            };
            return gradients[type] || gradients['default'];
        },

        copyToClipboard: (text, button) => {
            const input = document.createElement('input');
            input.style.position = 'absolute';
            input.style.left = '-9999px';
            input.value = text;
            document.body.appendChild(input);
            input.select();
            try {
                document.execCommand('copy');
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copiado';
                button.classList.add('bg-green-500');
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.classList.remove('bg-green-500');
                }, 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
                render.showModal('No se pudo copiar el texto.');
            }
            document.body.removeChild(input);
        },

        animateValue: (element, start, end, duration) => {
             if (!element) return;
             if (start === end) {
                 element.textContent = render.formatCurrency(end);
                 return;
             }
             const range = end - start;
             let current = start;
             const increment = end > start ? 1 : -1;
             const stepTime = Math.abs(Math.floor(duration / range));
             const timer = setInterval(() => {
                 current += increment * Math.max(1, Math.abs(Math.floor(range / 100)));
                 if ((increment === 1 && current >= end) || (increment === -1 && current <= end)) {
                     current = end;
                     clearInterval(timer);
                 }
                 element.textContent = render.formatCurrency(current);
             }, stepTime > 0 ? stepTime : 1);
        },

        showModal: (contentHTML, type = 'alert') => {
            modalContainer.innerHTML = ''; // Clear previous modals
            const modalDialog = document.createElement('div');
            modalDialog.className = `modal-dialog ${type}`;
            
            let icon = '<i class="fas fa-exclamation-circle text-red-500"></i>';
            if (type === 'success') icon = '<i class="fas fa-check-circle text-green-500"></i>';

            modalDialog.innerHTML = `
                <div class="modal-content">
                    <div class="modal-icon">${icon}</div>
                    <div class="modal-body">${contentHTML}</div>
                    <button class="modal-close-btn" data-action="close-modal">&times;</button>
                </div>
            `;
            modalContainer.appendChild(modalDialog);
            modalContainer.classList.add('active');
            
            setTimeout(() => {
                modalDialog.classList.add('active');
            }, 10);
            
            // Auto-close for success messages
            if (type === 'success') {
                setTimeout(() => {
                    if (modalContainer.contains(modalDialog)) {
                       modalDialog.classList.remove('active');
                       setTimeout(() => modalContainer.classList.remove('active'), 300);
                    }
                }, 3000);
            }
        },

        showMovementDetailsModal: (transactionId) => {
            const transaction = state.transactions.find(t => t.id == transactionId);
            if (!transaction) return;
            const content = `
                <h3 class="text-lg font-bold mb-2">Detalle del Movimiento</h3>
                <p><strong>Concepto:</strong> ${transaction.name}</p>
                <p><strong>Monto:</strong> <span class="font-bold ${transaction.amount < 0 ? 'text-red-500' : 'text-green-500'}">${render.formatCurrency(transaction.amount)}</span></p>
                <p><strong>Fecha:</strong> ${render.formatDate(transaction.date, 'long')}</p>
                <p><strong>Folio:</strong> ${transaction.folio_operacion || 'N/A'}</p>
                 <button data-action="share-receipt" data-transaction-id="${transactionId}" class="btn-primary mt-4 w-full">Compartir Recibo</button>
            `;
            render.showModal(content);
        },

        showCvvModal: async () => {
             render.showModal(`
                <h3 class="text-lg font-bold mb-2">CVV Dinámico</h3>
                <div id="cvv-container" class="text-center">
                    <i class="fas fa-spinner fa-spin fa-2x"></i>
                    <p>Generando CVV...</p>
                </div>
            `);
            try {
                const result = await api.getDynamicCvv();
                if (result.success) {
                    const cvvContainer = document.getElementById('cvv-container');
                    cvvContainer.innerHTML = `
                        <p class="text-3xl font-bold tracking-widest">${result.cvv}</p>
                        <p id="cvv-timer" class="text-sm text-gray-500 mt-2">Expira en ${result.expires_in_seconds} segundos.</p>
                    `;
                    let timeLeft = result.expires_in_seconds;
                    const timerEl = document.getElementById('cvv-timer');
                    const interval = setInterval(() => {
                        timeLeft--;
                        if (timeLeft <= 0) {
                            clearInterval(interval);
                            cvvContainer.innerHTML = '<p class="text-red-500">CVV Expirado</p>';
                        } else {
                            timerEl.textContent = `Expira en ${timeLeft} segundos.`;
                        }
                    }, 1000);
                }
            } catch(e) {
                 document.getElementById('cvv-container').innerHTML = '<p class="text-red-500">Error al obtener CVV.</p>';
            }
        },

        shareReceipt: (transfer) => {
            if (navigator.share) {
                navigator.share({
                    title: 'Comprobante de Transferencia',
                    text: `¡Hola! Te comparto el comprobante de una transferencia.\n\nFolio: ${transfer.folio}\nBeneficiario: ${transfer.recipientName}\nMonto: ${render.formatCurrency(transfer.amount)}\nFecha: ${render.formatDate(transfer.date, 'long')}`
                }).catch(console.error);
            } else {
                render.showModal('La función de compartir no está disponible en este navegador.');
            }
        },
        
        setTheme: (theme) => {
            state.theme = theme;
            body.className = theme; // Replaces all classes
            localStorage.setItem('bankTheme', theme);
            const themeToggle = document.getElementById('theme-toggle');
            if(themeToggle) {
                themeToggle.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
            }
        },
        
        dashboard: (animate = false) => {
             const dashboardContent = document.getElementById('dashboard-content');
             if(!dashboardContent) return;

             document.getElementById('user-welcome').textContent = `¡Hola, ${state.user.nombre || 'Usuario'}!`;
             const initials = (state.user.nombre || '..').split(' ').map(n=>n[0]).slice(0, 2).join('').toUpperCase();
             document.getElementById('user-initials').textContent = initials;
             
             const debitCard = state.cards.find(card => card.tipo === 'Débito') || { balance: 0 };
             const balanceEl = document.getElementById('main-balance');

             if(animate) {
                 render.animateValue(balanceEl, state.previousBalance, debitCard.balance, 1000);
                 state.previousBalance = debitCard.balance; // Update for next animation
             } else {
                 balanceEl.textContent = render.formatCurrency(debitCard.balance);
             }

             const movementsContainer = document.getElementById('recent-movements');
             if(state.transactions.length > 0) {
                movementsContainer.innerHTML = state.transactions.slice(0, 5).map(t => `
                    <div class="movement-item" data-action="movement-details" data-transaction-id="${t.id}">
                        <div class="movement-icon ${t.color}">
                            <i class="fas ${t.icon}"></i>
                        </div>
                        <div class="movement-details">
                            <p class="movement-name">${t.name}</p>
                            <p class="movement-date">${render.formatDate(t.date)}</p>
                        </div>
                        <div class="movement-amount ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}">
                            ${render.formatCurrency(t.amount)}
                        </div>
                    </div>
                `).join('');
             } else {
                 movementsContainer.innerHTML = '<p class="text-center text-gray-500 py-4">No hay movimientos recientes.</p>';
             }
        },
        
        skeletonDashboard: () => {
             document.getElementById('user-welcome').textContent = 'Cargando...';
             document.getElementById('user-initials').textContent = '..';
             document.getElementById('main-balance').textContent = '$...';
             const movementsContainer = document.getElementById('recent-movements');
             movementsContainer.innerHTML = Array(4).fill(0).map(() => `
                <div class="movement-item animate-pulse">
                    <div class="movement-icon bg-gray-200"></div>
                    <div class="movement-details">
                        <p class="movement-name bg-gray-200 h-4 w-3/4 rounded"></p>
                        <p class="movement-date bg-gray-200 h-3 w-1/2 rounded mt-1"></p>
                    </div>
                    <div class="movement-amount bg-gray-200 h-4 w-1/4 rounded"></div>
                </div>
             `).join('');
        },
        
        getCardsScreenHTML: (activeCardId = 1) => { 
            state.activeCardIndex = state.cards.findIndex(c => c.id == activeCardId) || 0;
            if (state.activeCardIndex === -1) state.activeCardIndex = 0;
            
            const activeCard = state.cards[state.activeCardIndex];

            return `
            <div id="cards-screen" class="screen">
                <div class="card-carousel">
                    ${state.cards.map((card, index) => `
                        <div class="card-item ${render.getCardGradient(card.tipo)} ${index === state.activeCardIndex ? 'active' : ''}" data-card-index="${index}">
                            <div class="card-header">
                                <span class="card-type">${card.nombre_tarjeta}</span>
                                <i class="fab fa-cc-${card.marca.toLowerCase()} fa-2x"></i>
                            </div>
                            <div class="card-number">
                                <span>****</span><span>****</span><span>****</span><span>${card.ultimos_4_digitos}</span>
                            </div>
                            <div class="card-footer">
                                <span class="card-holder">${state.user.nombre}</span>
                                <span class="card-balance-label">${card.tipo === 'Crédito' ? 'Utilizado' : 'Saldo Disponible'}</span>
                                <span class="card-balance">${render.formatCurrency(card.tipo === 'Crédito' ? card.saldo_utilizado : card.balance)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                 <div class="carousel-dots">
                    ${state.cards.map((_, index) => `<span class="dot ${index === state.activeCardIndex ? 'active' : ''}" data-card-index="${index}"></span>`).join('')}
                </div>
                <div class="card-actions">
                     <button class="action-btn" data-action="show-cvv"><i class="fas fa-lock"></i><span>CVV</span></button>
                     <button class="action-btn"><i class="fas fa-cog"></i><span>Ajustes</span></button>
                     <button class="action-btn"><i class="fas fa-ban"></i><span>Bloquear</span></button>
                     <button class="action-btn"><i class="fas fa-info-circle"></i><span>Info</span></button>
                </div>
            </div>
            `;
        },

        getServicesScreenHTML: () => `<div id="services-screen" class="screen placeholder-screen"><i class="fas fa-tools"></i><h3>Servicios</h3><p>Esta sección está en construcción.</p></div>`,
        
        getMoveMoneyHubHTML: () => {
             return `
                <div id="move-money-hub" class="screen">
                    <h3>Mover Dinero</h3>
                    <div class="hub-options">
                        <div class="hub-option" data-action="init-transfer">
                            <i class="fas fa-exchange-alt"></i>
                            <span>Transferir</span>
                        </div>
                        <div class="hub-option" data-action="show-screen" data-screen="deposit-screen">
                            <i class="fas fa-piggy-bank"></i>
                            <span>Depositar</span>
                        </div>
                         <div class="hub-option" data-action="show-screen" data-screen="credit-screen">
                            <i class="fas fa-credit-card"></i>
                            <span>Pagar Tarjeta</span>
                        </div>
                    </div>
                </div>
             `;
        },

        getDepositScreenHTML: () => {
            const debitCard = state.cards.find(c => c.tipo === 'Débito');
            return `
            <div id="deposit-screen" class="screen text-center">
                <h3>Depositar a tu cuenta</h3>
                <p class="mb-4">Usa estos datos para recibir dinero:</p>
                <div class="info-box">
                    <p>CLABE</p>
                    <strong id="clabe-number">${debitCard.clabe || '012345678901234567'}</strong>
                    <button class="btn-secondary mt-2" data-action="copy-clabe" data-clabe="${debitCard.clabe || '012345678901234567'}">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <div class="info-box mt-4">
                    <p>Número de Tarjeta</p>
                    <strong>**** **** **** ${debitCard.ultimos_4_digitos || '0000'}</strong>
                </div>
            </div>`;
        },
        
        getCreditScreenHTML: () => `<div id="credit-screen" class="screen placeholder-screen"><i class="fas fa-credit-card"></i><h3>Pagar Tarjeta</h3><p>Esta sección está en construcción.</p></div>`,
        
        getProfileScreenHTML: () => {
             return `
                <div id="profile-screen" class="screen">
                     <div class="profile-header">
                        <div class="profile-avatar">${state.user.initials || '..'}</div>
                        <h3>${state.user.nombre || ''}</h3>
                        <p>${state.user.email || ''}</p>
                    </div>
                    <div class="profile-options">
                        <div class="profile-option"><span><i class="fas fa-user-shield"></i> Seguridad</span> <i class="fas fa-chevron-right"></i></div>
                        <div class="profile-option"><span><i class="fas fa-bell"></i> Notificaciones</span> <i class="fas fa-chevron-right"></i></div>
                        <div class="profile-option"><span><i class="fas fa-question-circle"></i> Ayuda</span> <i class="fas fa-chevron-right"></i></div>
                        <div class="profile-option" id="theme-toggle" data-action="toggle-theme">
                           <span><i class="fas ${state.theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i> Modo ${state.theme === 'light' ? 'Oscuro' : 'Claro'}</span>
                        </div>
                        <div class="profile-option text-red-500" data-action="logout">
                            <span><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</span>
                        </div>
                    </div>
                </div>
             `;
        },

        getMovementsScreenHTML: () => {
             const grouped = state.transactions.reduce((acc, t) => {
                const date = new Date(t.date).toISOString().split('T')[0];
                if (!acc[date]) acc[date] = [];
                acc[date].push(t);
                return acc;
            }, {});

            let html = '<div id="movements-screen" class="screen"><h3>Movimientos</h3>';
            for (const date in grouped) {
                html += `<div class="date-group">
                            <p class="date-header">${render.formatDate(date, 'long')}</p>
                            ${grouped[date].map(t => `
                                <div class="movement-item" data-action="movement-details" data-transaction-id="${t.id}">
                                    <div class="movement-icon ${t.color}"><i class="fas ${t.icon}"></i></div>
                                    <div class="movement-details">
                                        <p class="movement-name">${t.name}</p>
                                    </div>
                                    <div class="movement-amount ${t.amount < 0 ? 'text-red-500' : 'text-green-500'}">
                                        ${render.formatCurrency(t.amount)}
                                    </div>
                                </div>
                            `).join('')}
                         </div>`;
            }
            html += '</div>';
            return html;
        },
        
        getTransferScreen1HTML: () => { // Select Contact
            return `
            <div id="transfer-1" class="screen transfer-flow">
                <div class="transfer-header">
                    <button data-action="show-screen" data-screen="move-money-hub"><i class="fas fa-arrow-left"></i></button>
                    <h3>Enviar Dinero</h3>
                </div>
                <input type="search" id="contact-search" placeholder="Buscar contacto..." class="search-input">
                <div id="contact-list" class="contact-list">
                    ${state.contacts.map(c => `
                    <div class="contact-item" data-action="select-contact" data-contact-id="${c.id}">
                        <div class="contact-avatar">${c.nombre_contacto.charAt(0)}</div>
                        <p>${c.nombre_contacto}</p>
                    </div>`).join('')}
                </div>
                <button class="btn-secondary fab" data-action="init-transfer" data-target="new-contact"><i class="fas fa-plus"></i> Nuevo Contacto</button>
            </div>
            `;
        },

        getTransferScreen2HTML: () => { // Enter Amount
            const { contact } = state.currentTransfer;
            return `
            <div id="transfer-2" class="screen transfer-flow">
                 <div class="transfer-header">
                    <button data-action="init-transfer" data-target="transfer-1"><i class="fas fa-arrow-left"></i></button>
                    <h3>Enviar a ${contact.nombre_contacto}</h3>
                </div>
                <div class="amount-input-container">
                    <span>$</span>
                    <input type="number" id="transfer-amount" placeholder="0.00" inputmode="decimal">
                </div>
                <input type="text" id="transfer-concept" placeholder="Concepto (opcional)" class="text-input">
                <button id="continue-transfer-2" class="btn-primary" data-action="continue-transfer" data-target="transfer-3" disabled>Continuar</button>
            </div>
            `;
        },

        getTransferScreen3HTML: () => { // Confirm
            const { contact, amount, concept } = state.currentTransfer;
            const debitCard = state.cards.find(c => c.tipo === 'Débito');
            return `
             <div id="transfer-3" class="screen transfer-flow">
                 <div class="transfer-header">
                    <button data-action="init-transfer" data-target="transfer-2"><i class="fas fa-arrow-left"></i></button>
                    <h3>Confirmar</h3>
                </div>
                <div class="confirmation-summary">
                    <p class="summary-label">Monto a Enviar</p>
                    <p class="summary-amount">${render.formatCurrency(amount)}</p>
                    <div class="summary-details">
                        <p><span>De:</span> <strong>Tu cuenta • ${debitCard.ultimos_4_digitos}</strong></p>
                        <p><span>Para:</span> <strong>${contact.nombre_contacto}</strong></p>
                        <p><span>CLABE:</span> <strong>${contact.clabe_contacto}</strong></p>
                        ${concept ? `<p><span>Concepto:</span> <strong>${concept}</strong></p>` : ''}
                    </div>
                </div>
                <button id="confirm-transfer-btn" class="btn-primary" data-action="confirm-transfer">Confirmar Transferencia</button>
             </div>
            `;
        },

        getSuccessScreenHTML: () => {
             const { receipt } = state.currentTransfer;
             return `
                <div id="success-screen" class="screen transfer-flow text-center">
                    <div class="success-icon"><i class="fas fa-check-circle"></i></div>
                    <h2>¡Transferencia Exitosa!</h2>
                    <p class="text-gray-500 mb-4">Se enviaron ${render.formatCurrency(receipt.amount)} a ${receipt.recipientName}</p>
                    <div class="receipt-info">
                        <p><strong>Folio:</strong> ${receipt.folio}</p>
                        <p><strong>Fecha:</strong> ${render.formatDate(receipt.date, 'long')}</p>
                    </div>
                    <button class="btn-secondary mt-4" data-action="share-receipt"><i class="fas fa-share-alt"></i> Compartir</button>
                    <button class="btn-primary mt-2" data-action="show-screen" data-screen="dashboard-screen">Finalizar</button>
                </div>
             `;
        },

        getNewContactScreenHTML: () => {
            return `
            <div id="new-contact-screen" class="screen transfer-flow">
                <div class="transfer-header">
                    <button data-action="init-transfer" data-target="transfer-1"><i class="fas fa-arrow-left"></i></button>
                    <h3>Nuevo Contacto</h3>
                </div>
                <form id="new-contact-form" class="p-4">
                    <input type="text" name="name" placeholder="Nombre completo" class="text-input" required>
                    <input type="text" name="clabe" placeholder="CLABE (18) o Tarjeta (16)" class="text-input" inputmode="numeric" required>
                    <button type="button" id="save-contact-btn" class="btn-primary mt-4" data-action="save-contact">Guardar Contacto</button>
                </form>
            </div>
            `;
        },
    };
    
    // Asignamos las funciones de renderizado al controlador donde se necesitan
    controller.showScreen = render.showScreen = function(screenId, params = {}) {
        const screenMap = {
            'dashboard-screen': () => {
                // Dashboard is always in the DOM, just refresh it
                controller.initializeApp();
                dynamicContainer.innerHTML = '';
            },
            'cards-screen': () => {
                dynamicContainer.innerHTML = render.getCardsScreenHTML(params.cardId);
            },
            'services-screen': () => {
                dynamicContainer.innerHTML = render.getServicesScreenHTML();
            },
            'move-money-hub': () => {
                dynamicContainer.innerHTML = render.getMoveMoneyHubHTML();
            },
            'deposit-screen': () => {
                dynamicContainer.innerHTML = render.getDepositScreenHTML();
            },
            'credit-screen': () => {
                dynamicContainer.innerHTML = render.getCreditScreenHTML();
            },
            'profile-screen': () => {
                dynamicContainer.innerHTML = render.getProfileScreenHTML();
            },
             'movements-screen': () => {
                dynamicContainer.innerHTML = render.getMovementsScreenHTML();
            },
        };
        
        // Clear dynamic container for all except dashboard
        if (screenId !== 'dashboard-screen') {
            document.getElementById('dashboard-content').style.display = 'none';
            dynamicContainer.style.display = 'block';
        } else {
            document.getElementById('dashboard-content').style.display = 'block';
            dynamicContainer.style.display = 'none';
        }

        // Execute the render function
        const renderFunc = screenMap[screenId];
        if (renderFunc) {
            renderFunc();
        }

        // Update active nav item
        document.querySelectorAll('#nav-bar .nav-item').forEach(item => {
            item.classList.remove('active');
            if(item.getAttribute('data-screen') === screenId) {
                item.classList.add('active');
            }
        });
    };
    
    // =================================================================
    // 5. INICIALIZACIÓN Y MANEJADORES DE EVENTOS
    // =================================================================
    function setupEventListeners() {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            try {
                const response = await api.login(new FormData(e.target));
                if (response.redirected && response.url.includes('clientes.php')) {
                    window.location.reload();
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Credenciales inválidas.' }));
                    throw new Error(errorData.message);
                }
            } catch (error) {
                render.showModal(error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Iniciar Sesión';
            }
        });
        
        document.body.addEventListener('click', async (e) => {
            const actionTarget = e.target.closest('[data-action]');
            if (!actionTarget) return;

            const action = actionTarget.dataset.action;
            
            switch (action) {
                case 'show-screen':
                    controller.showScreen(actionTarget.dataset.screen);
                    break;
                case 'close-modal':
                    const modalDialog = actionTarget.closest('.modal-dialog');
                    if(modalDialog) modalDialog.classList.remove('active');
                    setTimeout(() => modalContainer.classList.remove('active'), 300);
                    break;
                case 'logout':
                    await api.logout();
                    window.location.reload();
                    break;
                case 'toggle-theme':
                    render.setTheme(state.theme === 'light' ? 'dark' : 'light');
                    break;
                case 'movement-details':
                    render.showMovementDetailsModal(actionTarget.dataset.transactionId);
                    break;
                case 'copy-clabe':
                    render.copyToClipboard(actionTarget.dataset.clabe, actionTarget);
                    break;
                case 'show-cvv':
                    render.showCvvModal();
                    break;
                case 'init-transfer':
                    controller.initializeTransferFlow(actionTarget.dataset.target || 'transfer-1');
                    break;
                case 'select-contact':
                    const contactId = actionTarget.dataset.contactId;
                    state.currentTransfer.contact = state.contacts.find(c => c.id == contactId);
                    dynamicContainer.innerHTML = render.getTransferScreen2HTML();
                    break;
                case 'continue-transfer':
                    state.currentTransfer.amount = parseFloat(document.getElementById('transfer-amount').value);
                    state.currentTransfer.concept = document.getElementById('transfer-concept').value.trim();
                    dynamicContainer.innerHTML = render.getTransferScreen3HTML();
                    break;
                case 'confirm-transfer':
                    controller.handleConfirmTransfer();
                    break;
                case 'save-contact':
                    controller.handleSaveContact();
                    break;
                case 'share-receipt':
                    render.shareReceipt(state.currentTransfer.receipt);
                    break;

            }
        });
        
        document.body.addEventListener('input', (e) => {
            // Live contact search
            if (e.target.id === 'contact-search') {
                const searchTerm = e.target.value.toLowerCase();
                document.querySelectorAll('.contact-item').forEach(item => {
                    const name = item.textContent.toLowerCase();
                    item.style.display = name.includes(searchTerm) ? 'flex' : 'none';
                });
            }
             // Enable continue button in transfer flow
            if (e.target.id === 'transfer-amount') {
                const amount = parseFloat(e.target.value);
                const continueBtn = document.getElementById('continue-transfer-2');
                if (continueBtn) {
                   continueBtn.disabled = !(amount > 0);
                }
            }
        });
    }

    async function init() {
        setupEventListeners();
        try {
            // Check for an active session by trying to fetch the profile
            await api.getProfile(); 
            controller.showAppScreen();
            render.setTheme(localStorage.getItem('bankTheme') || 'light');
            await controller.initializeApp(true);
        } catch (error) {
            console.log("No hay sesión activa. Mostrando pantalla de login.");
            controller.showLoginScreen();
        }
    }
    
    // Iniciar la aplicación
    init();
});
