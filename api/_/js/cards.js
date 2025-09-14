/**
 * =================================================================
 * cards.js - Lógica para la Sección de Tarjetas
 * =================================================================
 */
const cardsModule = {
    globalState: null,
    appController: null,
    screenElement: null,

    init(globalState, appController, params = {}) {
        this.globalState = globalState;
        this.appController = appController;
        this.screenElement = document.getElementById('cards-screen');
        if (!this.screenElement) {
            console.error('Cards screen element not found!');
            return;
        }
        
        const activeCardId = params.cardId || (globalState.cards.length > 0 ? globalState.cards[0].id : null);
        this.render(activeCardId);
    },

    render(activeCardId) {
        const template = document.getElementById('cards-screen-template');
        if (!template) {
            this.screenElement.innerHTML = '<h2>Error: Plantilla de tarjetas no encontrada.</h2>';
            return;
        }
        
        if (!activeCardId) {
            this.screenElement.innerHTML = '<h2>No se encontraron tarjetas.</h2>';
            return;
        }
        
        const activeCard = this.globalState.cards.find(c => c.id == activeCardId);
        if (!activeCard) {
            this.screenElement.innerHTML = '<h2>Tarjeta no encontrada.</h2>';
            return;
        }

        const clone = template.content.cloneNode(true);

        // Renderizar tarjeta activa
        const activeCardContainer = clone.querySelector('#active-card-container');
        activeCardContainer.style.background = activeCard.gradient;
        activeCardContainer.innerHTML = this._getActiveCardHTML(activeCard);
        
        // Ajustar botón de CVV
        const cvvBtn = clone.querySelector('#show-cvv-btn');
        if (activeCard.type !== 'Digital') {
            cvvBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }

        // Renderizar lista de otras tarjetas
        const otherCardsList = clone.querySelector('#other-cards-list');
        otherCardsList.innerHTML = '';
        this.globalState.cards.forEach(card => {
            otherCardsList.appendChild(this._getOtherCardElement(card, activeCard.id));
        });

        this.screenElement.innerHTML = '';
        this.screenElement.appendChild(clone);
        this._addEventListeners();
    },

    _addEventListeners() {
        this.screenElement.querySelectorAll('.switch-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const cardId = e.currentTarget.dataset.cardId;
                this.render(cardId); // Re-renderizar con la nueva tarjeta activa
            });
        });
        
        const cvvBtn = this.screenElement.querySelector('#show-cvv-btn');
        if (cvvBtn && !cvvBtn.classList.contains('cursor-not-allowed')) {
            cvvBtn.addEventListener('click', () => this.appController.showCvvModal());
        }
    },
    
    _getActiveCardHTML(card) {
        return `${card.texture ? '<div class="absolute inset-0 world-map-texture"></div>' : ''}
                <div class="relative z-10 flex flex-col justify-between h-full">
                    <div class="flex justify-between items-start">
                        <div>
                            <span class="font-semibold text-lg">${card.name}</span>
                            <div class="flex items-center gap-2 mt-2"><div class="card-chip"></div></div>
                        </div>
                        <i class="fab fa-cc-${card.brand} text-4xl opacity-80"></i>
                    </div>
                    <div>
                        <div class="font-mono text-2xl tracking-widest">${card.number}</div>
                        <div class="flex justify-between text-sm mt-4">
                            <span>${this.globalState.user.name.toUpperCase()}</span>
                            <span>EXP ${card.expiryDate || '12/28'}</span>
                        </div>
                    </div>
                </div>`;
    },

    _getOtherCardElement(card, activeCardId) {
        const cardItem = document.createElement('div');
        cardItem.className = `p-3 rounded-xl flex items-center gap-4 custom-card switch-card-btn cursor-pointer ${card.id == activeCardId ? 'ring-2' : ''}`;
        cardItem.style.setProperty('--tw-ring-color', 'var(--accent-color)');
        cardItem.dataset.cardId = card.id;
        cardItem.innerHTML = `<div class="w-12 h-8 rounded flex items-center justify-end p-1" style="background: ${card.gradient};"><i class="fab fa-cc-${card.brand} text-white"></i></div>
                              <div class="flex-grow">
                                  <p class="font-semibold text-sm">${card.name}</p>
                                  <p class="text-xs font-mono" style="color:var(--text-secondary);">${card.number}</p>
                              </div>`;
        return cardItem;
    }
};
