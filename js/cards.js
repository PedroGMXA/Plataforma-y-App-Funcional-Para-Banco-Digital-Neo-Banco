/**
 * =================================================================
 * cards.js - Módulo para la Pantalla de "Mis Tarjetas"
 * =================================================================
 * Este módulo gestiona la lógica y el renderizado de la pantalla
 * de tarjetas, incluyendo la visualización, selección y acciones
 * relacionadas.
 * =================================================================
 */
const cardsModule = (() => {
    // Referencias a los elementos del DOM. Se inicializan en _renderInitialStructure.
    const DOM = {};

    let _state = {};
    let _appController = {};
    let _activeCardId = null;

    /**
     * Inicializa el módulo, establece el estado inicial y renderiza la pantalla.
     * @param {object} state - El estado global de la aplicación.
     * @param {object} appController - El controlador principal de la aplicación.
     * @param {object} params - Parámetros iniciales, como el ID de la tarjeta.
     */
    function init(state, appController, params = {}) {
        _state = state;
        _appController = appController;
        _activeCardId = params.cardId ? parseInt(params.cardId, 10) : (_state.cards[0]?.id || null);

        _renderInitialStructure();
        _addEventListeners();
        _updateActiveCard(_activeCardId);
    }

    /**
     * Renderiza la estructura HTML base de la pantalla de tarjetas.
     */
    function _renderInitialStructure() {
        const template = document.getElementById('cards-screen-template');
        if (!template) {
            console.error('La plantilla cards-screen-template no existe.');
            document.getElementById('cards-screen').innerHTML = '<p class="p-6 text-center">Error al cargar la pantalla de tarjetas.</p>';
            return;
        }

        const screenContainer = document.getElementById('cards-screen');
        screenContainer.innerHTML = '';
        screenContainer.appendChild(template.content.cloneNode(true));

        // Almacena las referencias a los elementos una vez que la plantilla ha sido cargada
        DOM.screen = screenContainer;
        DOM.activeCardContainer = screenContainer.querySelector('#active-card-container');
        DOM.otherCardsList = screenContainer.querySelector('#other-cards-list');
    }

    /**
     * Actualiza el contenido de la tarjeta principal y la lista de tarjetas secundarias
     * sin re-renderizar toda la pantalla, lo que mejora el rendimiento.
     * @param {number} cardId - El ID de la tarjeta que se debe mostrar como activa.
     */
    function _updateActiveCard(cardId) {
        const { cards } = _state;
        const activeCard = cards.find(c => c.id === cardId);
        
        if (!activeCard) {
            DOM.screen.querySelector('main').innerHTML = '<p class="p-6 text-center">No tienes tarjetas registradas o la tarjeta no fue encontrada.</p>';
            return;
        }

        _activeCardId = cardId;
        const otherCards = cards.filter(c => c.id !== _activeCardId);

        _renderActiveCard(activeCard);
        _renderOtherCards(otherCards);
    }

    /**
     * Renderiza la tarjeta principal con todos sus detalles en el contenedor.
     * @param {object} card - El objeto de la tarjeta activa.
     */
    function _renderActiveCard(card) {
        if (!DOM.activeCardContainer) return;

        const { name, brand, number, type, balance, used, gradient, texture } = card;
        const displayBalance = type === 'Crédito' ? used : balance;
        const label = type === 'Crédito' ? 'Utilizado' : 'Saldo';

        DOM.activeCardContainer.style.background = gradient;
        DOM.activeCardContainer.innerHTML = `
            <div class="relative z-10 flex flex-col justify-between h-full">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="font-semibold text-lg">${name}</span>
                        <div class="flex items-center gap-2 mt-2">
                            <div class="card-chip"></div>
                            <i class="fas fa-wifi text-xl transform rotate-90"></i>
                        </div>
                    </div>
                    <i class="fab fa-cc-${brand.toLowerCase()} text-4xl opacity-80"></i>
                </div>
                <div>
                    <div class="font-mono text-2xl tracking-widest mb-2">${number.replace(/(.{4})/g, '$1 ')}</div>
                    <div class="text-sm font-semibold">${label}: ${_appController.utils.formatCurrency(displayBalance)}</div>
                </div>
            </div>
            ${texture ? '<div class="absolute inset-0 world-map-texture"></div>' : ''}
        `;
    }

    /**
     * Renderiza la lista de las otras tarjetas seleccionables.
     * @param {Array<object>} cards - El array de tarjetas secundarias.
     */
    function _renderOtherCards(cards) {
        if (!DOM.otherCardsList) return;

        if (cards.length > 0) {
            DOM.otherCardsList.innerHTML = cards.map(card => `
                <div class="other-card-item flex items-center p-3 rounded-xl custom-card cursor-pointer" data-card-id="${card.id}">
                    <div class="w-16 h-10 rounded-md flex-shrink-0" style="background: ${card.gradient};"></div>
                    <div class="ml-4 flex-grow">
                        <p class="font-semibold">${card.name}</p>
                        <p class="text-sm font-mono" style="color: var(--text-secondary);">**** ${card.number.slice(-4)}</p>
                    </div>
                    <i class="fas fa-chevron-right" style="color: var(--text-secondary);"></i>
                </div>
            `).join('');
        } else {
            DOM.otherCardsList.innerHTML = '<p class="text-center text-sm p-4" style="color: var(--text-secondary);">No hay otras tarjetas.</p>';
        }
    }
    
    /**
     * Añade los manejadores de eventos a los elementos de la pantalla de forma delegada.
     */
    function _addEventListeners() {
        DOM.screen.addEventListener('click', (e) => {
            const backBtn = e.target.closest('.back-to-dashboard');
            if (backBtn) {
                _appController.showScreen('dashboard-screen');
                return;
            }

            const otherCard = e.target.closest('.other-card-item');
            if (otherCard) {
                const newActiveId = parseInt(otherCard.dataset.cardId, 10);
                // Llama a la función de actualización en lugar de re-renderizar todo el módulo
                _updateActiveCard(newActiveId);
                return;
            }

            const cvvBtn = e.target.closest('#show-cvv-btn');
            if (cvvBtn) {
                _appController.showModal('CVV: <strong>123</strong><br><small>Por seguridad, este código cambia cada 5 minutos.</small>');
                return;
            }
        });
    }

    return {
        init
    };
})();