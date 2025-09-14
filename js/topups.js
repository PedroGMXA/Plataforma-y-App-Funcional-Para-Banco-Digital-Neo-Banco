/**
 * =================================================================
 * topups.js - Lógica Profesional para Recargas Telefónicas
 * =================================================================
 * Módulo rediseñado para una mejor experiencia de usuario, con
 * validación en tiempo real y una interfaz más limpia.
 * =================================================================
 */
const topupsModule = {
    globalState: null,
    appController: null,
    dynamicContainer: null,

    init(globalState, appController, screenId) {
        this.globalState = globalState;
        this.appController = appController;
        this.dynamicContainer = document.getElementById('dynamic-screens-container');
        this.render();
    },

    render() {
        // Usamos el template directamente desde el HTML principal
        const template = document.getElementById('topup-form-template');
        if (!template) {
            this.dynamicContainer.innerHTML = '<p class="p-6 text-center">Error: No se pudo cargar la interfaz de recargas.</p>';
            return;
        }
        const clone = template.content.cloneNode(true);
        this.dynamicContainer.innerHTML = '';
        this.dynamicContainer.appendChild(clone);
        this._attachEventListeners();
    },

    _attachEventListeners() {
        // Botón para regresar al hub de servicios
        this.dynamicContainer.querySelector('.back-to-hub').addEventListener('click', () => {
            this.appController.showScreen('services-hub-screen');
        });

        // Botones de monto rápido
        this.dynamicContainer.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // Desmarcar otros botones y marcar el actual
                this.dynamicContainer.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active-amount'));
                btn.classList.add('active-amount');
                // Actualizar el valor oculto
                this.dynamicContainer.querySelector('#topup-amount-hidden').value = btn.dataset.amount;
            });
        });

        // Botón principal para realizar la recarga
        this.dynamicContainer.querySelector('#perform-topup-btn').addEventListener('click', () => {
            this._performTopup();
        });
    },

    _performTopup() {
        const phoneInput = this.dynamicContainer.querySelector('#phone-number');
        const amountInput = this.dynamicContainer.querySelector('#topup-amount-hidden');
        
        const phone = phoneInput.value.trim();
        const amount = amountInput.value;

        // Validaciones
        if (!/^\d{10}$/.test(phone)) {
            this.appController.showModal('Por favor, introduce un número de teléfono válido de 10 dígitos.');
            return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            this.appController.showModal('Por favor, selecciona un monto para la recarga.');
            return;
        }

        // Aquí iría la llamada a la API real
        // Simulación de éxito
        const successMessage = `
            <div class="text-center p-4">
                <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                <h2 class="text-xl font-bold">¡Recarga Exitosa!</h2>
                <p class="mt-2">Se ha realizado una recarga de <strong>${this.appController.utils.formatCurrency(amount)}</strong> al número <strong>${phone}</strong>.</p>
            </div>
        `;
        this.appController.showModal(successMessage, 'custom');
        
        // Limpiar formulario después de una recarga exitosa
        phoneInput.value = '';
        amountInput.value = '';
        this.dynamicContainer.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active-amount'));
    }
};
