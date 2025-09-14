/**
 * =================================================================
 * credit.js - Lógica para la Sección de Crédito (Versión Final)
 * =================================================================
 * Muestra el resumen de la tarjeta de crédito del usuario y
 * una sección de venta para solicitar nuevos productos.
 * =================================================================
 */
const creditModule = {
    globalState: null,
    appController: null,

    init(globalState, appController) {
        this.globalState = globalState;
        this.appController = appController;
        const screenElement = document.getElementById('credit-screen');
        if (!screenElement) return;

        const creditCard = globalState.cards.find(c => c.type === 'Crédito');
        const creditTransactions = creditCard 
            ? globalState.transactions.filter(t => t.cardId === creditCard.id && t.amount < 0).slice(0, 5)
            : [];

        this.render(screenElement, creditCard, creditTransactions);
    },

    render(screenElement, creditCard, transactions) {
        const template = document.getElementById('credit-screen-template');
        if (!template) {
            screenElement.innerHTML = '<h2>Error al cargar plantilla.</h2>';
            return;
        }
        const clone = template.content.cloneNode(true);
        const summarySection = clone.querySelector('#credit-summary-section');

        if (creditCard) {
            const { renderUtils } = this.globalState;
            clone.querySelector('#credit-card-name').textContent = creditCard.name;
            clone.querySelector('#credit-card-number').textContent = creditCard.number;
            clone.querySelector('#credit-card-brand').className = `fab fa-cc-${creditCard.brand} text-4xl opacity-80`;
            clone.querySelector('#credit-limit').textContent = renderUtils.formatCurrency(creditCard.limit);
            clone.querySelector('#credit-used').textContent = renderUtils.formatCurrency(creditCard.used);
            clone.querySelector('#credit-available').textContent = renderUtils.formatCurrency(creditCard.limit - creditCard.used);
            clone.querySelector('#credit-cutoff-date').textContent = '25 de Oct, 2025';
            clone.querySelector('#credit-payment-date').textContent = '15 de Nov, 2025';
            
            const movementsContainer = clone.querySelector('#credit-movements-container');
            if (transactions.length > 0) {
                movementsContainer.innerHTML = '';
                transactions.forEach(t => movementsContainer.appendChild(renderUtils.transactionItem(t)));
            } else {
                movementsContainer.innerHTML = '<p class="text-center p-8 custom-card">No hay movimientos recientes.</p>';
            }
        } else {
            summarySection.style.display = 'none';
        }

        screenElement.innerHTML = '';
        screenElement.appendChild(clone);
        this._addEventListeners(screenElement);
    },

    _addEventListeners(screenElement) {
        screenElement.querySelectorAll('.solicitar-credito-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const cardName = e.currentTarget.dataset.cardName;
                this.appController.showModal(`Tu solicitud para la <strong>${cardName}</strong> ha sido iniciada. Un asesor se pondrá en contacto contigo.`, 'success');
            });
        });
    }
};
