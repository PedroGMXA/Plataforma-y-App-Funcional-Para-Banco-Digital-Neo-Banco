/**
 * =================================================================
 * credit.js - Módulo Profesional para la Sección de Crédito
 * =================================================================
 * Gestiona la visualización de la línea de crédito, movimientos
 * y la oferta de nuevos productos crediticios.
 * =================================================================
 */
const creditModule = {
    state: null,
    appController: null,
    screenElement: null,

    init(state, appController) {
        this.state = state;
        this.appController = appController;
        this.screenElement = document.getElementById('credit-screen');
        if (!this.screenElement) {
            console.error("Credit screen element not found!");
            return;
        }
        this.render();
    },

    render() {
        // Generar dinámicamente el contenido para no depender de plantillas HTML
        this.screenElement.innerHTML = this._generateHTML();
        this._populateCreditData();
        this._attachEventListeners();
    },

    _generateHTML() {
        return `
            <header class="p-6 text-white z-10" style="background: var(--header-bg);">
                <div class="flex justify-center items-center relative">
                    <h1 class="text-2xl font-bold">Mi Línea de Crédito</h1>
                </div>
            </header>
            <main class="flex-grow p-6 pb-24">
                <div id="credit-summary-section">
                    <!-- La tarjeta de crédito se renderizará aquí -->
                </div>
                <div id="credit-details-section" class="mt-6">
                    <!-- El resumen y movimientos se renderizarán aquí -->
                </div>
                <div id="credit-products-section" class="mt-8">
                    <h2 class="text-xl font-bold mb-4">Explora otros productos</h2>
                    <!-- Las ofertas de crédito se renderizarán aquí -->
                </div>
            </main>
        `;
    },

    _populateCreditData() {
        const creditCard = this.state.cards.find(c => c.type === 'Crédito');
        
        const summaryContainer = this.screenElement.querySelector('#credit-summary-section');
        const detailsContainer = this.screenElement.querySelector('#credit-details-section');

        if (creditCard) {
            summaryContainer.innerHTML = this._createCardVisual(creditCard);
            detailsContainer.innerHTML = this._createCreditDetails(creditCard) + this._createRecentMovements();
        } else {
            summaryContainer.innerHTML = `
                <div class="text-center p-8 custom-card rounded-2xl">
                    <i class="fas fa-credit-card text-4xl text-[color:var(--text-secondary)] mb-4"></i>
                    <h3 class="text-xl font-bold">Aún no tienes un crédito GMXA</h3>
                    <p class="mt-2" style="color: var(--text-secondary);">Descubre los beneficios que tenemos para ti.</p>
                </div>
            `;
        }
        
        this._populateCreditProducts();
    },
    
    _createCardVisual(card) {
        return `
            <div class="bank-card-visual p-6 w-full max-w-md mx-auto text-white flex flex-col justify-between h-56 rounded-2xl shadow-lg" style="background: linear-gradient(135deg, var(--accent-start), var(--accent-end));">
                <div class="flex justify-between items-start">
                    <span class="font-semibold text-xl">${card.name}</span>
                    <i class="fab fa-cc-${card.brand.toLowerCase()} text-4xl"></i>
                </div>
                <div class="flex flex-col gap-2">
                    <p class="font-mono tracking-widest text-lg">${card.number.replace(/(\d{4})/g, '$1 ').trim()}</p>
                    <div class="flex justify-between items-end">
                        <span class="font-medium text-sm uppercase">${this.state.user.name}</span>
                        <span class="text-xs">EXP ${card.expiryDate}</span>
                    </div>
                </div>
            </div>
        `;
    },
    
    _createCreditDetails(card) {
        const available = card.limit - card.used;
        return `
            <div class="p-5 rounded-2xl custom-card">
                <h3 class="font-bold text-lg mb-4">Resumen de tu Línea</h3>
                <div class="space-y-3">
                    <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Línea de crédito:</span><span class="font-semibold font-mono">${this.appController.utils.formatCurrency(card.limit)}</span></div>
                    <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Crédito utilizado:</span><span class="font-semibold font-mono">${this.appController.utils.formatCurrency(card.used)}</span></div>
                    <div class="flex justify-between text-sm"><span style="color:var(--text-secondary)">Disponible:</span><span class="font-bold font-mono text-green-500">${this.appController.utils.formatCurrency(available)}</span></div>
                </div>
            </div>
        `;
    },

    _createRecentMovements() {
        const creditCard = this.state.cards.find(c => c.type === 'Crédito');
        if (!creditCard) return '';

        const creditTransactions = this.state.transactions
            .filter(t => t.cardId === creditCard.id)
            .slice(0, 3);
            
        let movementsHTML = '<h2 class="text-xl font-bold mt-8 mb-4">Movimientos Recientes</h2>';
        
        if (creditTransactions.length > 0) {
            const itemsHTML = creditTransactions.map(t => {
                const item = this.appController.utils.transactionItem(t);
                return item.outerHTML;
            }).join('');
            movementsHTML += `<div class="space-y-3">${itemsHTML}</div>`;
        } else {
            movementsHTML += '<p class="text-center custom-card p-4 rounded-xl" style="color: var(--text-secondary);">No hay movimientos recientes.</p>';
        }

        return movementsHTML;
    },

    _populateCreditProducts() {
        const container = this.screenElement.querySelector('#credit-products-section');
        const products = [
            { icon: 'fa-star', color: 'text-blue-500', title: 'Tarjeta Clásica', desc: 'Ideal para empezar, sin anualidad.' },
            { icon: 'fa-gift', color: 'text-purple-500', title: 'Tarjeta Rewards', desc: 'Gana cashback en todas tus compras.' },
            { icon: 'fa-plane-departure', color: 'text-teal-500', title: 'Tarjeta Viajero', desc: 'Acceso a salas VIP y MSI en viajes.' },
        ];
        
        const productsHTML = products.map(p => `
            <div class="p-5 rounded-2xl custom-card flex items-center gap-4">
                <i class="fas ${p.icon} text-4xl ${p.color}"></i>
                <div class="flex-grow">
                    <h3 class="font-bold">${p.title} GMXA</h3>
                    <p class="text-sm" style="color: var(--text-secondary);">${p.desc}</p>
                </div>
                <button class="solicitar-credito-btn font-bold text-sm py-2 px-4 rounded-lg text-white" data-card-name="${p.title}" style="background-color: var(--accent-color);">Solicitar</button>
            </div>
        `).join('');

        container.innerHTML += `<div class="space-y-4">${productsHTML}</div>`;
    },

    _attachEventListeners() {
        this.screenElement.addEventListener('click', e => {
            if (e.target.closest('.solicitar-credito-btn')) {
                const cardName = e.target.closest('.solicitar-credito-btn').dataset.cardName;
                this.appController.showModal(`Tu solicitud para la ${cardName} ha sido enviada. Te notificaremos pronto.`, 'success');
            }
        });
    }
};
