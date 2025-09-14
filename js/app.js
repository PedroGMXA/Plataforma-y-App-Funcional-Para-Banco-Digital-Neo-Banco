/**
 * =================================================================
 * app.js - Lógica Principal de la Aplicación de Banca GMXA (Versión Completa y Corregida)
 * =================================================================
 * Este archivo constituye el núcleo de la Single-Page Application (SPA).
 * Actúa como un orquestador que gestiona el estado global, la comunicación
 * con la API y delega el renderizado y la lógica de cada sección a
 * los scripts correspondientes.
 * =================================================================
 */
document.addEventListener('DOMContentLoaded', function() {

    // =================================================================
    // 1. CAPA DE API (Comunicación Centralizada con el Backend)
    // =================================================================
    const api = {
        async request(endpoint, options = {}) {
            try {
                const config = {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    ...options
                };
                if (config.body && typeof config.body !== 'string' && !(config.body instanceof FormData)) {
                    config.body = JSON.stringify(config.body);
                }
                const response = await fetch(`api/${endpoint}`, config);
                if (response.status === 401) {
                    window.location.href = 'login.html';
                    throw new Error('No autorizado');
                }
                const responseData = await response.json().catch(() => {
                    throw new Error('El servidor devolvió una respuesta inválida.');
                });
                if (!response.ok || !responseData.success) {
                    throw new Error(responseData.message || `Error del servidor (HTTP ${response.status})`);
                }
                return responseData.data;
            } catch (error) {
                console.error(`Error en API request a ${endpoint}:`, error);
                if (error.message !== 'No autorizado') {
                    render.showModal(error.message || 'Hubo un problema de conexión con el servidor.');
                }
                throw error;
            }
        },
        getProfile: () => api.request('profile.php'),
        updateProfile: (profileData) => api.request('profile.php', { method: 'POST', body: profileData }),
        getCards: () => api.request('cards.php'),
        getTransactions: () => api.request('transactions.php'),
        getContacts: () => api.request('contacts.php?action=list'),
        addContact: (contactData) => api.request('contacts.php', { method: 'POST', body: contactData }),
        updateContact: (id, contactData) => api.request(`contacts.php?id=${id}`, { method: 'PUT', body: contactData }),
        deleteContact: (id) => api.request(`contacts.php?id=${id}`, { method: 'DELETE' }),
        performTransfer: (transferData) => api.request('transfers.php', { method: 'POST', body: transferData }),
        getOffers: () => api.request('offers.php'),
        logout: () => api.request('logout.php'),
        getSavingsGoals: () => api.request('savings_goals.php?action=list'),
        addSavingsGoal: (goalData) => api.request('savings_goals.php', { method: 'POST', body: goalData }),
        updateSavingsGoal: (id, goalData) => api.request(`savings_goals.php?id=${id}`, { method: 'PUT', body: goalData })
    };

    // =================================================================
    // 2. ESTADO GLOBAL DE LA APLICACIÓN
    // =================================================================
    const state = {
        theme: 'light', user: {}, cards: [], contacts: [],
        transactions: [], offers: [], currentTransfer: {},
        previousBalances: {},
        swRegistration: null,
        autoRefreshInterval: null
    };

    const body = document.body;
    const appContainer = document.getElementById('app-container');
    const navBar = document.getElementById('nav-bar');
    const dynamicContainer = document.getElementById('dynamic-screens-container');
    const modalContainer = document.getElementById('modal-container');

    // =================================================================
    // 2.5. CAPA DE MAPEADO DE DATOS (Traduce la API a un formato consistente)
    // =================================================================
    const mappers = {
        mapCardFromAPI: (apiCard) => ({
            id: apiCard.id, name: apiCard.nombre, type: apiCard.tipo, brand: apiCard.marca,
            number: apiCard.numero, balance: parseFloat(apiCard.saldo), used: parseFloat(apiCard.usado),
            limit: parseFloat(apiCard.limite), expiryDate: apiCard.fecha_expiracion,
            gradient: apiCard.gradient, texture: apiCard.texture
        }),
        mapTransactionFromAPI: (apiTransaction) => ({
            id: apiTransaction.id, name: apiTransaction.nombre, amount: parseFloat(apiTransaction.monto),
            date: apiTransaction.fecha, concept: apiTransaction.concepto, folio: apiTransaction.folio,
            icon: apiTransaction.icon, color: apiTransaction.color, cardId: apiTransaction.card_id
        }),
        mapContactFromAPI: (apiContact) => ({
            id: apiContact.id,
            nombre_contacto: apiContact.nombre_contacto,
            clabe_contacto: apiContact.clabe_contacto,
            banco: apiContact.banco_receptor
        }),
        mapUserFromAPI: (apiUser) => ({
            name: apiUser.nombre, email: apiUser.email, phone: apiUser.telefono, clabe: apiUser.clabe
        }),
        mapOfferFromAPI: (apiOffer) => ({
            id: apiOffer.id, title: apiOffer.titulo, description: apiOffer.descripcion,
            gradient: apiOffer.gradiente, cta: apiOffer.cta_texto, category: apiOffer.categoria
        })
    };

    // =================================================================
    // 3. CAPA CONTROLADORA (Orquestación de Módulos y Lógica Principal)
    // =================================================================
    const appController = {
        showScreen: (screenId, params = {}) => controller.showScreen(screenId, params),
        showModal: (content, type = 'alert') => render.showModal(content, type),
        handleLogout: () => controller.handleLogout(),
        initializeApp: (isInitialLoad = false) => controller.initializeApp(isInitialLoad),
        requestNotificationPermission: () => notifications.requestPermission(),
        handleUpdateProfile: (formData) => controller.handleUpdateProfile(formData),
        handleSaveContact: (contactData) => controller.handleSaveContact(contactData),
        handleUpdateContact: (id, contactData) => controller.handleUpdateContact(id, contactData),
        handleDeleteContact: (id) => controller.handleDeleteContact(id),
        handleConfirmTransfer: () => controller.handleConfirmTransfer(),
        shareReceipt: (receiptDetails) => controller.shareReceipt(receiptDetails),
        utils: {
            formatCurrency: (amount) => render.formatCurrency(amount),
            formatDate: (date, format) => render.formatDate(date, format),
            transactionItem: (act) => render.transactionItem(act),
            copyToClipboard: (text, button) => render.copyToClipboard(text, button)
        },
        api: api
    };

    const controller = {
        navMap: {
            'dashboard-screen': 'dashboard-screen',
            'cards-screen': 'cards-screen',
            'credit-screen': 'credit-screen',
            'profile-screen': 'profile-screen',
            'promotions-screen': 'promotions-screen',
        },

        async initializeApp(isInitialLoad = false) {
            if (isInitialLoad) render.skeletonDashboard();
            try {
                const [user, cards, transactions, contacts, offers] = await Promise.all([
                    api.getProfile(), api.getCards(), api.getTransactions(),
                    api.getContacts(), api.getOffers()
                ]);

                state.user = mappers.mapUserFromAPI(user);
                state.cards = cards.map(mappers.mapCardFromAPI);
                state.transactions = transactions.map(mappers.mapTransactionFromAPI);
                state.contacts = contacts.map(mappers.mapContactFromAPI);
                state.offers = offers.map(mappers.mapOfferFromAPI);

                state.cards.forEach(card => {
                    if (card.type === 'Débito' || card.type === 'Digital') {
                        if (isInitialLoad || state.previousBalances[card.id] === undefined) {
                            state.previousBalances[card.id] = card.balance;
                        }
                    }
                });

                render.dashboard(!isInitialLoad);
            } catch (error) {
                console.error("Error fatal al inicializar la aplicación:", error.message);
            }
        },

        showScreen(screenId, params = {}) {
            const isStaticScreen = !!document.getElementById(screenId);
            const transitionDuration = 300;

            const currentActive = document.querySelector('.screen.active, #dynamic-screens-container.active');
            if (currentActive) {
                if ((currentActive.id === screenId) || (currentActive.id === 'dynamic-screens-container' && !isStaticScreen)) return;
                currentActive.classList.remove('active');
                if (currentActive.id === 'dynamic-screens-container') {
                    setTimeout(() => currentActive.innerHTML = '', transitionDuration);
                }
            }

            if (isStaticScreen) {
                const newScreen = document.getElementById(screenId);
                newScreen.classList.add('active');
                appContainer.style.paddingBottom = '80px';
                navBar.style.display = 'flex';

                switch (screenId) {
                    case 'dashboard-screen': render.dashboard(true); break;
                    case 'cards-screen': cardsModule.init(state, appController, params); break;
                    case 'credit-screen': creditModule.init(state, appController); break;
                    case 'promotions-screen': promotionsModule.init(state, appController); break;
                    case 'profile-screen': profileModule.init(state, appController); break;
                }
            } else {
                appContainer.style.paddingBottom = '0';
                navBar.style.display = 'none';

                const flow = this.getFlowForScreen(screenId);
                if (flow) {
                    flow.module.init(state, appController, screenId, params);
                    dynamicContainer.classList.add('active');
                } else {
                    dynamicContainer.innerHTML = `<p class="p-6">Error: Módulo para '${screenId}' no encontrado.</p>`;
                    dynamicContainer.classList.add('active');
                }
            }

            const activeNavScreen = this.navMap[screenId] || screenId;
            document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.screen === activeNavScreen));
        },

        getFlowForScreen(screenId) {
            const flows = [
                { name: 'moveMoney', screens: ['move-money-hub-screen', 'deposit-screen', 'transfer-screen-1', 'new-contact-screen', 'transfer-screen-2', 'transfer-screen-3', 'success-screen'], module: moveMoneyModule },
                { name: 'services', screens: ['services-hub-screen', 'pay-services-list-screen', 'pay-service-form-screen', 'insurance-screen'], module: servicesModule },
                { name: 'topups', screens: ['topup-form-screen'], module: topupsModule },
                { name: 'savings', screens: ['savings-goals-list-screen', 'new-goal-screen', 'add-funds-screen'], module: savingsGoalsModule },
                { name: 'movements', screens: ['movements-screen'], module: movementsModule }
            ];
            return flows.find(f => f.screens.includes(screenId));
        },

        async handleUpdateProfile(formData) {
            const updateBtn = document.getElementById('update-profile-btn');
            if(updateBtn) { updateBtn.disabled = true; updateBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...`; }
            try {
                const profileObject = {};
                formData.forEach((value, key) => profileObject[key] = value);

                const updatedData = await api.updateProfile(profileObject);
                state.user.name = updatedData.nombre;
                state.user.phone = updatedData.telefono;
                document.querySelector('.modal-overlay')?.remove();
                this.showScreen('profile-screen');
            } finally {
                if(updateBtn) { updateBtn.disabled = false; updateBtn.innerHTML = 'Guardar Cambios'; }
            }
        },

        async handleSaveContact(contactData) {
            try {
                const newContact = await api.addContact(contactData);
                state.contacts.push(mappers.mapContactFromAPI(newContact));
                state.contacts.sort((a, b) => a.nombre_contacto.localeCompare(b.nombre_contacto));
                moveMoneyModule.init(state, appController, 'transfer-screen-1');
            } catch(error) { /* Error manejado por api.request */ }
        },

        async handleUpdateContact(id, contactData) {
            try {
                const updatedContact = await api.updateContact(id, contactData);
                const index = state.contacts.findIndex(c => c.id == id);
                if (index !== -1) {
                    state.contacts[index].nombre_contacto = updatedContact.nombre_contacto;
                }
                document.querySelector('.modal-overlay')?.remove();
                moveMoneyModule._renderContactList();
            } catch(error) { /* Error manejado por api.request */ }
        },

        async handleDeleteContact(id) {
            try {
                await api.deleteContact(id);
                state.contacts = state.contacts.filter(c => c.id != id);
                document.querySelector('.modal-overlay')?.remove();
                moveMoneyModule._renderContactList();
            } catch(error) { /* Error manejado por api.request */ }
        },

        async handleConfirmTransfer() {
            const confirmBtn = document.getElementById('confirm-transfer-btn');
            if (!confirmBtn) return;

            confirmBtn.disabled = true;
            confirmBtn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Procesando...`;
            try {
                state.cards.forEach(card => {
                    if (card.type === 'Débito' || card.type === 'Digital') {
                        state.previousBalances[card.id] = card.balance;
                    }
                });

                const result = await api.performTransfer({
                    contactId: state.currentTransfer.contact.id,
                    amount: state.currentTransfer.amount,
                    concept: state.currentTransfer.concept
                });
                state.currentTransfer.folio = result.folio;
                state.currentTransfer.date = result.date;

                await this.initializeApp();
                moveMoneyModule.init(state, appController, 'success-screen', { transferResult: result });
            } finally {
                if(confirmBtn) {
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = `Confirmar y Enviar`;
                }
            }
        },

        async shareReceipt(receipt) {
            const receiptText = `¡Comprobante de Transferencia GMXA!\n---------------------------------\nMonto: ${receipt.amount}\nPara: ${receipt.recipient}\nFecha: ${receipt.date}\nFolio: ${receipt.folio}\n---------------------------------\nGracias por usar GMXA.`.trim();
            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Comprobante de Transferencia', text: receiptText });
                } catch (err) {
                    render.copyToClipboard(receiptText, document.getElementById('share-receipt-btn'));
                }
            } else {
                render.copyToClipboard(receiptText, document.getElementById('share-receipt-btn'));
            }
        },

        async handleLogout() {
            try {
                await api.logout();
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
            } finally {
                window.location.href = 'login.html';
            }
        }
    };

    // =================================================================
    // 3.5. MÓDULO DE NOTIFICACIONES
    // =================================================================
    const notifications = {
        publicKey: 'BElzabyfl33chaU-0dhsB3l2iRQLds62d_Yde3t5CAnzsoXyO0Z6-s4Jc_x4FfaeT7s2Yvh2LIj-RE2a-o9_y-s',
        init() {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                navigator.serviceWorker.register('sw.js')
                    .then(swReg => { state.swRegistration = swReg; })
                    .catch(error => console.error('Error en Service Worker', error));
            } else { console.warn('Push messaging is not supported'); }
        },
        async requestPermission() {
            if (!('Notification' in window)) return;
            const permission = await window.Notification.requestPermission();
            if (permission === 'granted') return this.subscribeUser();
        },
        async subscribeUser() {
            if (!state.swRegistration) return;
            try {
                const subscription = await state.swRegistration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.publicKey)
                });
                await api.saveSubscription(subscription);
                render.showModal('¡Te has suscrito a las notificaciones!', 'success');
            } catch (err) {
                console.error('Fallo al suscribir al usuario: ', err);
                render.showModal('Error al suscribirse a las notificaciones.');
            }
        },
        urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4);
            const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
            const rawData = window.atob(base64);
            const outputArray = new Uint8Array(rawData.length);
            for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
            return outputArray;
        }
    };

    // =================================================================
    // 4. CAPA DE RENDERIZADO Y UTILIDADES GLOBALES
    // =================================================================
    const render = {
        formatCurrency: (amount = 0) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount),
        formatDate: (dateString, format = 'short') => {
            if (!dateString) return '';
            const date = new Date(dateString);
            if (isNaN(date)) return 'Fecha inválida';
            return format === 'short'
                ? date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                : date.toLocaleString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        },
        setTheme: (theme) => {
            body.className = `theme-${theme}`;
            document.documentElement.className = `theme-${theme}`;
            const themeToggle = document.getElementById('theme-toggle');
            if(themeToggle) themeToggle.className = `fas cursor-pointer ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
            state.theme = theme;
            localStorage.setItem('bankTheme', theme);
        },
        copyToClipboard: (text, button) => {
            if (!text) return;
            const originalHTML = button.innerHTML;
            navigator.clipboard.writeText(text).then(() => {
                button.innerHTML = `<i class="fas fa-check mr-2"></i> Copiado`;
                setTimeout(() => { if (button) button.innerHTML = originalHTML; }, 2000);
            }).catch(() => render.showModal('Error al copiar.'));
        },
        animateValue: (element, start, end, duration, cardId) => {
            if (!element) return;
            if (start === end) {
                element.innerHTML = render.formatCurrency(end);
                return;
            }
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
                const currentVal = easedProgress * (end - start) + start;
                element.innerHTML = render.formatCurrency(currentVal);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    element.innerHTML = render.formatCurrency(end);
                    if (cardId) {
                        state.previousBalances[cardId] = end;
                    }
                }
            };
            window.requestAnimationFrame(step);
        },
        showModal: (contentHTML, type = 'alert') => {
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove() };

            overlay.innerHTML = type === 'alert'
                ? `<div class="modal-content p-6 pb-8 text-center" onclick="event.stopPropagation()"><p class="text-lg font-semibold">${contentHTML}</p><button class="mt-4 px-6 py-2 rounded-lg text-white font-bold active:scale-95" style="background-color: var(--accent-color);">OK</button></div>`
                : `<div class="modal-content" onclick="event.stopPropagation()">${contentHTML}</div>`;

            const closeTrigger = overlay.querySelector('button, .fa-times');
            if (closeTrigger) closeTrigger.addEventListener('click', () => overlay.remove());

            modalContainer.innerHTML = '';
            modalContainer.appendChild(overlay);
        },
        showMovementDetailsModal(transactionId) {
            const transaction = state.transactions.find(t => t.id == transactionId);
            if (!transaction) return;
            const modalHTML = `
                <div class="p-6 pb-8">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center ${transaction.color}"><i class="fas ${transaction.icon} text-xl text-white"></i></div>
                            <div>
                                <p class="font-bold text-lg">${transaction.name}</p>
                                <p class="text-3xl font-bold ${transaction.amount > 0 ? 'text-green-500' : ''}">${render.formatCurrency(transaction.amount)}</p>
                            </div>
                        </div>
                        <i class="fas fa-times text-xl cursor-pointer"></i>
                    </div>
                    <div class="space-y-3 py-4 border-t border-b" style="border-color: var(--border-color);">
                        <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Estado:</span><span class="font-semibold text-green-500">Aprobada</span></div>
                        <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Fecha y Hora:</span><span class="font-semibold">${render.formatDate(transaction.date, 'long')}</span></div>
                        <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Concepto:</span><span class="font-semibold">${transaction.concept || 'N/A'}</span></div>
                        <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Folio:</span><span class="font-semibold">${transaction.folio || 'N/A'}</span></div>
                    </div>
                </div>
            `;
            render.showModal(modalHTML, 'custom');
        },
        transactionItem: (act) => {
            const item = document.createElement('div');
            item.className = "transaction-item flex items-center p-3 rounded-xl custom-card cursor-pointer";
            item.dataset.transactionId = act.id;
            item.innerHTML = `
                <div class="w-11 h-11 rounded-full flex items-center justify-center ${act.color || 'bg-gray-200'}"><i class="fas ${act.icon || 'fa-question'} text-white"></i></div>
                <div class="ml-4 flex-grow">
                    <p class="font-semibold">${act.name}</p>
                    <p class="text-sm" style="color: var(--text-secondary);">${render.formatDate(act.date)}</p>
                </div>
                <p class="font-bold text-base ${act.amount > 0 ? 'text-green-500' : ''}">${act.amount > 0 ? '+' : ''}${render.formatCurrency(act.amount)}</p>
            `;
            return item;
        },
        dashboard: (animate = false) => {
            const screen = document.getElementById('dashboard-screen');
            if(!screen) return;

            const nameParts = state.user.name ? state.user.name.split(' ') : ['Usuario'];
            const firstName = nameParts[0];
            const initials = (state.user.name || '..').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

            screen.innerHTML = `
                <header class="p-6 pb-20 rounded-b-3xl text-white z-10" style="background: var(--header-bg);">
                    <div class="flex justify-between items-center mb-6">
                        <div class="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white/30">${initials}</div>
                        <div class="flex items-center gap-5 text-2xl">
                             <i class="fas fa-bell cursor-pointer"></i>
                            <i id="theme-toggle" class="fas ${state.theme === 'dark' ? 'fa-sun' : 'fa-moon'} cursor-pointer"></i>
                        </div>
                    </div>
                    <h1 class="text-3xl font-bold">¡Hola, ${firstName}!</h1>
                </header>
                <main class="flex-grow p-6 -mt-16 z-20 pb-24" id="dashboard-content-container"></main>
            `;

            const dashboardContentContainer = document.getElementById('dashboard-content-container');
            const cardsHTML = state.cards.map(card => `
                <div class="bank-card flex-none w-4/5 rounded-2xl p-5 text-white flex flex-col justify-between h-48 relative overflow-hidden cursor-pointer" style="background: ${card.gradient}; scroll-snap-align: start;" data-screen-link="cards-screen" data-card-id="${card.id}">
                    <div class="relative z-10"><div class="flex justify-between items-center"><span class="font-semibold">${card.name}</span><i class="fab fa-cc-${card.brand.toLowerCase()} text-3xl"></i></div></div>
                    <div class="relative z-10">
                        <p class="text-sm">${card.type === 'Débito' || card.type === 'Digital' ? 'Saldo disponible' : 'Saldo utilizado'}</p>
                        <p class="text-3xl font-bold" id="dashboard-balance-${card.id}">${render.formatCurrency(card.type === 'Débito' || card.type === 'Digital' ? card.balance : card.used)}</p>
                    </div>
                </div>`).join('');

            const recentActivityHTML = state.transactions.length > 0
                ? state.transactions.slice(0, 3).map(t => render.transactionItem(t).outerHTML).join('')
                : '<p class="text-center custom-card p-4 rounded-xl">No hay movimientos recientes.</p>';

            dashboardContentContainer.innerHTML = `
                <h2 class="text-xl font-bold mb-4">Mis Cuentas</h2>
                <div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6" style="scroll-snap-type: x mandatory; -ms-overflow-style: none; scrollbar-width: none;">
                    <style>.flex.overflow-x-auto::-webkit-scrollbar { display: none; }</style>
                    ${cardsHTML || '<div class="h-48 w-full flex-none skeleton rounded-2xl"></div>'}
                </div>
                <div class="grid grid-cols-4 gap-4 text-center my-8">
                    <div class="quick-action cursor-pointer p-2" data-screen-link="move-money-hub-screen"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto custom-card"><i class="fas fa-exchange-alt text-2xl" style="color: var(--accent-color);"></i></div><p class="text-xs mt-2 font-medium">Mover Dinero</p></div>
                    <div class="quick-action cursor-pointer p-2" data-screen-link="services-hub-screen"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto custom-card"><i class="fas fa-file-invoice-dollar text-2xl" style="color: var(--accent-color);"></i></div><p class="text-xs mt-2 font-medium">Servicios</p></div>
                    <div class="quick-action cursor-pointer p-2" data-screen-link="topup-form-screen"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto custom-card"><i class="fas fa-mobile-alt text-2xl" style="color: var(--accent-color);"></i></div><p class="text-xs mt-2 font-medium">Recargas</p></div>
                    <div class="quick-action cursor-pointer p-2" data-screen-link="savings-goals-list-screen"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto custom-card"><i class="fas fa-piggy-bank text-2xl" style="color: var(--accent-color);"></i></div><p class="text-xs mt-2 font-medium">Metas</p></div>
                </div>
                <div data-screen-link="promotions-screen" class="p-5 mt-8 rounded-2xl custom-card cursor-pointer" style="background: linear-gradient(135deg, var(--accent-color), #ff6600)">
                    <h3 class="font-bold text-white text-lg">Descubre beneficios exclusivos</h3>
                    <p class="text-sm text-white/80">Recompensas, descuentos y más te esperan.</p>
                </div>
                <div class="flex justify-between items-center mt-8 mb-4"><h2 class="text-xl font-bold">Actividad Reciente</h2><a href="#" class="text-sm font-semibold" style="color: var(--accent-color);" data-screen-link="movements-screen">Ver todo</a></div>
                <div class="space-y-3">${recentActivityHTML}</div>
            `;

            state.cards.forEach(card => {
                if (card.type === 'Débito' || card.type === 'Digital') {
                    const balanceEl = document.getElementById(`dashboard-balance-${card.id}`);
                    if (balanceEl) {
                        const previousBalance = state.previousBalances[card.id] ?? card.balance;
                        if (animate) {
                            render.animateValue(balanceEl, previousBalance, card.balance, 1200, card.id);
                        } else {
                            balanceEl.innerHTML = render.formatCurrency(card.balance);
                        }
                    }
                }
            });
        },
        skeletonDashboard: () => {
             const screen = document.getElementById('dashboard-screen');
             if (screen) screen.innerHTML = `<header class="p-6 pb-20 rounded-b-3xl z-10 skeleton"><div class="h-12 w-12 mb-6 rounded-full"></div><div class="h-8 w-1/2 rounded"></div></header><main class="flex-grow p-6 -mt-16 z-20 pb-24"><div class="h-6 w-1/2 mb-4 skeleton rounded"></div><div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6"><div class="flex-none w-4/5 h-48 rounded-2xl skeleton"></div></div><div class="grid grid-cols-4 gap-4 text-center my-8"><div class="space-y-2"><div class="w-14 h-14 rounded-full mx-auto skeleton"></div><div class="h-3 w-12 mx-auto skeleton rounded"></div></div><div class="space-y-2"><div class="w-14 h-14 rounded-full mx-auto skeleton"></div><div class="h-3 w-12 mx-auto skeleton rounded"></div></div><div class="space-y-2"><div class="w-14 h-14 rounded-full mx-auto skeleton"></div><div class="h-3 w-12 mx-auto skeleton rounded"></div></div><div class="space-y-2"><div class="w-14 h-14 rounded-full mx-auto skeleton"></div><div class="h-3 w-12 mx-auto skeleton rounded"></div></div></div><div class="h-6 w-1/2 mt-8 mb-4 skeleton rounded"></div><div class="space-y-3"><div class="h-16 w-full skeleton rounded-xl"></div><div class="h-16 w-full skeleton rounded-xl"></div></div></main>`;
        }
    };

    // =================================================================
    // 5. INICIALIZACIÓN Y MANEJADORES DE EVENTOS GLOBALES
    // =================================================================
    function setupEventListeners() {
        document.body.addEventListener('click', (e) => {
            const target = e.target;
            const screenLink = target.closest('[data-screen-link]');
            if (screenLink) {
                e.preventDefault();
                const modal = target.closest('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
                controller.showScreen(screenLink.dataset.screenLink, { cardId: screenLink.dataset.cardId });
                return;
            }

            const navItem = target.closest('.nav-item');
            if (navItem) {
                e.preventDefault();
                controller.showScreen(navItem.dataset.screen);
                return;
            }

            if (target.closest('.back-to-dashboard')) {
                controller.showScreen('dashboard-screen');
                return;
            }

            if (target.closest('#action-menu-btn')) {
                const template = document.getElementById('action-menu-modal-template');
                if (template) render.showModal(template.innerHTML, 'custom');
                return;
            }

            if (target.closest('#theme-toggle')) render.setTheme(state.theme === 'light' ? 'dark' : 'light');

            const transactionItem = target.closest('.transaction-item');
            if (transactionItem) render.showMovementDetailsModal(parseInt(transactionItem.dataset.transactionId, 10));

            const copyBtn = target.closest('.copy-button');
            if (copyBtn) appController.utils.copyToClipboard(copyBtn.dataset.copy, copyBtn);
        });
    }

    function startAutoRefresh() {
        if (state.autoRefreshInterval) {
            clearInterval(state.autoRefreshInterval);
        }

        state.autoRefreshInterval = setInterval(() => {
            console.log("Auto-refrescando datos del dashboard...");
            state.cards.forEach(card => {
                if (card.type === 'Débito' || card.type === 'Digital') {
                    state.previousBalances[card.id] = card.balance;
                }
            });
            controller.initializeApp(false);
        }, 15000); // Refresca cada 15 segundos
    }

    function init() {
        notifications.init();
        render.setTheme(localStorage.getItem('bankTheme') || 'light');
        if (appContainer) {
            controller.initializeApp(true);
            startAutoRefresh();
        } else {
            console.error('App container not found!');
        }
        setupEventListeners();
    }

    init();
});
