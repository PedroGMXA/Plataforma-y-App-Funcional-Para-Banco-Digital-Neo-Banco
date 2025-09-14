/**
 * =================================================================
 * promotions.js - Módulo Profesional para Promociones (Versión Premium)
 * =================================================================
 * Renderiza una experiencia de promociones única y llamativa, con un
 * carrusel interactivo para ofertas destacadas y un diseño de
 * tarjetas mejorado.
 * =================================================================
 */
const promotionsModule = {
    state: null,
    appController: null,
    screenElement: null,
    carouselInterval: null, // Para manejar el autoplay del carrusel

    init(state, appController) {
        this.state = state;
        this.appController = appController;
        this.screenElement = document.getElementById('promotions-screen');
        this.render();
    },

    render() {
        if (!this.screenElement) {
            console.error('Promotions screen element not found!');
            return;
        }

        const offers = this.state.offers || [];
        // Las primeras 3 ofertas son para el carrusel, el resto para la lista
        const featuredOffers = offers.slice(0, 3);
        const otherOffers = offers.slice(3);

        this.screenElement.innerHTML = `
            <header class="p-6 text-white z-10" style="background: var(--header-bg);">
                <div class="flex justify-center items-center relative">
                    <h1 class="text-2xl font-bold">Beneficios GMXA</h1>
                </div>
            </header>
            <main class="pb-24">
                ${featuredOffers.length > 0 ? this._createCarousel(featuredOffers) : ''}
                
                <div class="p-6">
                    <h2 class="text-xl font-bold mb-4">Más Promociones</h2>
                    <div id="other-offers-grid" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        ${otherOffers.length > 0 ? otherOffers.map(offer => this._createOfferCard(offer)).join('') : '<p class="custom-card p-4 rounded-xl text-center sm:col-span-2">No hay más ofertas por el momento.</p>'}
                    </div>
                </div>
            </main>
        `;
        this._attachEventListeners();
        if (featuredOffers.length > 1) {
            this._setupCarousel();
        }
    },

    /**
     * Crea el HTML para el carrusel de ofertas destacadas.
     */
    _createCarousel(offers) {
        return `
            <div id="promo-carousel" class="relative w-full overflow-hidden p-6">
                <div class="flex transition-transform duration-500 ease-in-out">
                    ${offers.map(offer => this._createFeaturedCard(offer)).join('')}
                </div>
                <div class="carousel-dots absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                    ${offers.map((_, index) => `<button class="carousel-dot h-2 w-2 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'}" data-slide-to="${index}"></button>`).join('')}
                </div>
            </div>
        `;
    },
    
    _createFeaturedCard(offer) {
        return `
            <div class="carousel-item flex-shrink-0 w-full rounded-2xl p-6 text-white flex flex-col justify-between h-56 relative overflow-hidden shadow-lg" 
                 style="background: ${offer.gradient || 'linear-gradient(to right, #6a11cb, #2575fc)'};"
                 data-offer-id="${offer.id}">
                <div class="relative z-10">
                     <span class="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2 py-1 rounded-full">${offer.category || 'Destacado'}</span>
                    <h2 class="text-2xl font-bold mt-3 mb-2">${offer.title}</h2>
                    <p class="text-sm opacity-90">${offer.description}</p>
                </div>
                <div class="relative z-10 self-start">
                    <button class="bg-white/90 text-black font-bold py-2 px-5 rounded-lg text-sm backdrop-blur-sm">
                        ${offer.cta || 'Ver más'}
                    </button>
                </div>
            </div>`;
    },

    /**
     * Crea el HTML para una tarjeta de oferta estándar en la cuadrícula.
     */
    _createOfferCard(offer) {
        const categoryIcons = {
            'Viajes': 'fa-plane-departure', 'Comida': 'fa-utensils', 'Entretenimiento': 'fa-film',
            'Compras': 'fa-shopping-bag', 'Tecnología': 'fa-laptop-code', 'default': 'fa-tag'
        };
        const icon = categoryIcons[offer.category] || categoryIcons['default'];

        return `
            <div class="custom-card p-4 rounded-xl flex flex-col text-center items-center gap-3 cursor-pointer" data-offer-id="${offer.id}">
                <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl" style="background: ${offer.gradient || 'var(--accent-color)'};">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="flex-grow">
                    <h3 class="font-bold">${offer.title}</h3>
                    <p class="text-xs mt-1" style="color: var(--text-secondary);">${offer.category}</p>
                </div>
            </div>
        `;
    },
    
    /**
     * Configura la lógica del carrusel (navegación y autoplay).
     */
    _setupCarousel() {
        const carousel = this.screenElement.querySelector('#promo-carousel .flex');
        const dots = this.screenElement.querySelectorAll('.carousel-dot');
        let currentIndex = 0;
        
        const goToSlide = (slideIndex) => {
            currentIndex = slideIndex;
            const offset = -slideIndex * 100;
            carousel.style.transform = `translateX(${offset}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('bg-white', index === currentIndex);
                dot.classList.toggle('bg-white/50', index !== currentIndex);
            });
        };

        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                goToSlide(parseInt(dot.dataset.slideTo));
            });
        });
        
        // Autoplay
        if(this.carouselInterval) clearInterval(this.carouselInterval);
        this.carouselInterval = setInterval(() => {
            let nextIndex = (currentIndex + 1) % dots.length;
            goToSlide(nextIndex);
        }, 5000); // Cambia de slide cada 5 segundos
    },

    _attachEventListeners() {
        this.screenElement.addEventListener('click', (e) => {
            const offerCard = e.target.closest('[data-offer-id]');
            if (offerCard) {
                // Detener el carrusel al interactuar para evitar bugs
                if(this.carouselInterval) clearInterval(this.carouselInterval);
                this._showOfferDetailsModal(offerCard.dataset.offerId);
            }
        });
    },

    _showOfferDetailsModal(offerId) {
        // (El código del modal se mantiene igual, ya era bastante bueno)
        const offer = this.state.offers.find(o => o.id == offerId);
        if (!offer) return;

        const categoryIcons = {
            'Viajes': 'fa-plane-departure', 'Comida': 'fa-utensils', 'Entretenimiento': 'fa-film', 
            'Compras': 'fa-shopping-bag', 'Tecnología': 'fa-laptop-code', 'default': 'fa-gift'
        };
        const icon = categoryIcons[offer.category] || categoryIcons['default'];

        const modalHTML = `
            <div class="p-6 text-center">
                 <div class="w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 text-white text-4xl" style="background: ${offer.gradient || '#ccc'};">
                    <i class="fas ${icon}"></i>
                </div>
                <h2 class="text-2xl font-bold mb-2">${offer.title}</h2>
                <p class="mb-6" style="color: var(--text-secondary);">${offer.description}</p>
                <button class="w-full py-3 rounded-lg text-white font-bold" style="background-color: var(--accent-color);">
                    ${offer.cta || 'Aprovechar Oferta'}
                </button>
            </div>
        `;
        this.appController.showModal(modalHTML, 'custom');
    }
};

