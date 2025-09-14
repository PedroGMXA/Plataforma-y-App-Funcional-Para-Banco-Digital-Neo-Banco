/**
 * =================================================================
 * promotions.js - Módulo Profesional para Promociones y Ofertas
 * =================================================================
 * Este módulo se encarga de renderizar una pantalla de promociones
 * visualmente atractiva y funcional, mostrando ofertas obtenidas
 * del estado global de la aplicación.
 * =================================================================
 */
const promotionsModule = {
    globalState: null,
    appController: null,
    screenElement: null,

    /**
     * Inicializa el módulo de promociones.
     * @param {object} globalState - El estado global de la aplicación.
     * @param {object} appController - El controlador principal.
     */
    init(globalState, appController) {
        this.globalState = globalState;
        this.appController = appController;
        this.screenElement = document.getElementById('promotions-screen');
        this.render();
    },

    /**
     * Renderiza el contenido completo de la pantalla de promociones.
     */
    render() {
        if (!this.screenElement) {
            console.error('Promotions screen element not found!');
            return;
        }

        const { offers } = this.globalState;
        const featuredOffer = offers[0];
        const otherOffers = offers.slice(1);

        this.screenElement.innerHTML = `
            <div class="p-6">
                <header class="mb-6">
                    <h1 class="text-3xl font-bold">Promociones</h1>
                    <p style="color: var(--text-secondary);">Ofertas exclusivas para ti</p>
                </header>

                <main>
                    ${featuredOffer ? this._createFeaturedOffer(featuredOffer) : ''}
                    
                    <h2 class="text-xl font-bold mt-8 mb-4">Más Ofertas</h2>
                    <div class="space-y-4">
                        ${otherOffers.length > 0 ? otherOffers.map(offer => this._createOfferCard(offer)).join('') : '<p>No hay más ofertas por el momento.</p>'}
                    </div>
                </main>
            </div>
        `;
        this._attachEventListeners();
    },

    /**
     * Crea el HTML para la tarjeta de la oferta destacada.
     * @param {object} offer - El objeto de la oferta.
     * @returns {string} El HTML de la tarjeta destacada.
     */
    _createFeaturedOffer(offer) {
        return `
            <div class="rounded-2xl p-6 text-white flex flex-col justify-between h-56 relative overflow-hidden cursor-pointer shadow-lg" 
                 style="background: ${offer.gradient || 'linear-gradient(to right, #6a11cb, #2575fc)'};"
                 data-offer-id="${offer.id}">
                <div class="relative z-10">
                    <h2 class="text-2xl font-bold mb-2">${offer.title}</h2>
                    <p class="text-sm">${offer.description}</p>
                </div>
                <div class="relative z-10 self-start">
                    <button class="bg-white text-black font-bold py-2 px-4 rounded-lg text-sm">
                        ${offer.cta || 'Ver más'}
                    </button>
                </div>
                 <div class="absolute inset-0 world-map-texture opacity-20"></div>
            </div>`;
    },

    /**
     * Crea el HTML para una tarjeta de oferta estándar.
     * @param {object} offer - El objeto de la oferta.
     * @returns {string} El HTML de la tarjeta de oferta.
     */
    _createOfferCard(offer) {
        return `
            <div class="custom-card p-4 rounded-xl flex items-center gap-4 cursor-pointer" data-offer-id="${offer.id}">
                <div class="w-16 h-16 rounded-lg flex items-center justify-center" style="background: ${offer.gradient || '#ccc'};">
                    <i class="fas fa-tag text-white text-2xl"></i>
                </div>
                <div>
                    <h3 class="font-bold">${offer.title}</h3>
                    <p class="text-sm" style="color: var(--text-secondary);">${offer.description}</p>
                </div>
            </div>
        `;
    },
    
    /**
     * Adjunta el manejador de eventos para las tarjetas de oferta.
     */
    _attachEventListeners() {
        this.screenElement.addEventListener('click', (e) => {
            const offerCard = e.target.closest('[data-offer-id]');
            if (offerCard) {
                this._showOfferDetailsModal(offerCard.dataset.offerId);
            }
        });
    },

    /**
     * Muestra un modal con los detalles de la oferta seleccionada.
     * @param {string} offerId - El ID de la oferta.
     */
    _showOfferDetailsModal(offerId) {
        const offer = this.globalState.offers.find(o => o.id == offerId);
        if (!offer) return;

        const modalHTML = `
            <div class="p-6 text-center">
                 <div class="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4" style="background: ${offer.gradient || '#ccc'};">
                    <i class="fas fa-gift text-white text-4xl"></i>
                </div>
                <h2 class="text-2xl font-bold mb-2">${offer.title}</h2>
                <p class="mb-6">${offer.description}</p>
                <button class="w-full py-3 rounded-lg text-white font-bold" style="background-color: var(--accent-color);">
                    ${offer.cta || 'Aprovechar Oferta'}
                </button>
            </div>
        `;
        this.appController.showModal(modalHTML, 'custom');
    }
};
