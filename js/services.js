/**
 * =================================================================
 * services.js - Lógica para Hub de Servicios (Versión Final)
 * =================================================================
 * Módulo que actúa como un router para los flujos de pago de
 * servicios, recargas, metas y contratación de seguros.
 * =================================================================
 */
const servicesModule = {
    globalState: null,
    appController: null,
    dynamicContainer: null,

    init(globalState, appController, startingScreen = 'services-hub-screen') {
        this.globalState = globalState;
        this.appController = appController;
        this.dynamicContainer = document.getElementById('dynamic-screens-container');
        
        document.querySelectorAll('#app-container > .screen').forEach(s => s.classList.remove('active'));
        document.getElementById('nav-bar').style.display = 'none';
        document.getElementById('app-container').style.paddingBottom = '0';
        
        const screenMap = {
            'pay-services-list-screen': this.renderServicesList,
            'insurance-screen': this.renderInsuranceScreen,
            'default': this.renderHub
        };
        (screenMap[startingScreen] || screenMap['default']).call(this);
    },

    _render(templateId) {
        const template = document.getElementById(templateId);
        const clone = template.content.cloneNode(true);
        this.dynamicContainer.innerHTML = '';
        this.dynamicContainer.appendChild(clone);
        return this.dynamicContainer.firstElementChild;
    },

    renderHub() {
        const screen = this._render('services-hub-screen-template');
        screen.querySelector('.back-to-dashboard').addEventListener('click', () => this.appController.showScreen('dashboard-screen'));
        screen.addEventListener('click', (e) => {
            const flowTarget = e.target.closest('[data-flow]');
            if (!flowTarget) return;
            const flow = flowTarget.dataset.flow;
            const flowActions = {
                'pay-services': () => this.renderServicesList(),
                'topups': () => this.appController.showScreen('topup-form-screen'),
                'savings': () => this.appController.showScreen('savings-goals-list-screen'),
                'insurance': () => this.renderInsuranceScreen()
            };
            if(flowActions[flow]) flowActions[flow]();
        });
    },

    renderServicesList() {
        const screen = this._render('pay-services-list-template');
        screen.querySelector('.back-to-hub').addEventListener('click', () => this.renderHub());
        screen.querySelectorAll('.service-item').forEach(item => {
            item.addEventListener('click', () => {
                this.renderPaymentForm(item.dataset.service, item.querySelector('i').className);
            });
        });
    },

    renderPaymentForm(service, icon) {
        const screen = this._render('pay-service-form-template');
        screen.querySelector('#service-name').textContent = `Pagar ${service}`;
        screen.querySelector('#service-icon').className = icon;
        screen.querySelector('.back-to-list').addEventListener('click', () => this.renderServicesList());
        screen.querySelector('#pay-service-btn').addEventListener('click', () => {
            const amount = parseFloat(screen.querySelector('#service-amount').value);
            if (amount > 0) {
                 this.appController.showModal(`Pago de ${service} por ${this.globalState.renderUtils.formatCurrency(amount)} procesado.`, 'success');
                 setTimeout(() => this.renderHub(), 1500);
            } else {
                 this.appController.showModal('Por favor, introduce un monto válido.');
            }
        });
    },

    renderInsuranceScreen() {
        const screen = this._render('insurance-screen-template');
        screen.querySelector('.back-to-hub').addEventListener('click', () => this.renderHub());
        screen.querySelectorAll('.cotizar-seguro-btn').forEach(button => {
            button.addEventListener('click', e => {
                const tipoSeguro = e.currentTarget.dataset.insuranceType;
                this.appController.showModal(`Iniciando cotización para tu <strong>Seguro de ${tipoSeguro}</strong>. Te contactaremos en breve.`, 'success');
            });
        });
    }
};
