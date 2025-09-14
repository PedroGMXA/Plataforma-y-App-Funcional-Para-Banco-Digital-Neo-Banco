/**
 * =================================================================
 * savings-goals.js - Lógica para Metas de Ahorro (Versión Final Conectada a API)
 * =================================================================
 * Módulo para crear, visualizar y añadir fondos a metas de ahorro,
 * consumiendo datos reales desde la API.
 * =================================================================
 */
const savingsGoalsModule = {
    globalState: null,
    appController: null,
    dynamicContainer: null,
    goals: [], // Los datos se cargarán desde la API, ya no son simulados.

    async init(globalState, appController) {
        this.globalState = globalState;
        this.appController = appController;
        this.dynamicContainer = document.getElementById('dynamic-screens-container');
        
        // Inicia la renderización de la lista de metas
        await this.renderGoalsList();
    },

    _render(templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`Template ${templateId} not found!`);
            return null;
        }
        const clone = template.content.cloneNode(true);
        this.dynamicContainer.innerHTML = '';
        this.dynamicContainer.appendChild(clone);
        return this.dynamicContainer.firstElementChild;
    },

    async renderGoalsList() {
        const screen = this._render('savings-goals-list-template');
        if (!screen) return;
        
        const container = screen.querySelector('#goals-container');
        container.innerHTML = `<div class="custom-card p-6 text-center">Cargando metas...</div>`;
        
        try {
            // Llama a la API para obtener las metas del usuario
            this.goals = await this.appController.api.getSavingsGoals();
            container.innerHTML = ''; 
            if (this.goals.length > 0) {
                this.goals.forEach(goal => container.appendChild(this._createGoalElement(goal)));
            } else {
                container.innerHTML = `<p class="custom-card p-6 text-center">Aún no tienes metas de ahorro. ¡Crea una para empezar!</p>`;
            }
        } catch(error) {
            container.innerHTML = `<p class="custom-card p-6 text-center text-red-500">No se pudieron cargar las metas.</p>`;
        }
        
        screen.querySelector('.back-to-hub').addEventListener('click', () => this.appController.showScreen('services-hub-screen'));
        screen.querySelector('#add-new-goal-btn').addEventListener('click', () => this.renderNewGoalForm());
        container.addEventListener('click', e => {
            const button = e.target.closest('.add-funds-btn');
            if (button) {
                const goalId = parseInt(button.dataset.goalId, 10);
                this.renderAddFundsForm(goalId);
            }
        });
    },

    renderNewGoalForm() {
        const screen = this._render('new-goal-template');
        if (!screen) return;
        screen.querySelector('#save-goal-btn').addEventListener('click', () => this.saveNewGoal());
        screen.querySelector('.back-to-goals').addEventListener('click', () => this.renderGoalsList());
    },
    
    renderAddFundsForm(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return this.renderGoalsList(); 

        const screen = this._render('add-funds-template');
        if (!screen) return;
        screen.querySelector('#add-funds-title').textContent = `Abonar a "${goal.nombre}"`;
        screen.querySelector('.back-to-goals').addEventListener('click', () => this.renderGoalsList());
        screen.querySelector('#add-funds-btn').addEventListener('click', () => this.addFunds(goalId));
    },

    async saveNewGoal() {
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);

        if (!name || !(target > 0)) {
            this.appController.showModal('Por favor, completa todos los campos correctamente.');
            return;
        }
        
        try {
            // Llama a la API para crear una nueva meta
            await this.appController.api.addSavingsGoal({ name, target });
            this.appController.showModal('¡Meta creada con éxito!', 'success');
            setTimeout(() => this.renderGoalsList(), 1500);
        } catch (error) {
            this.appController.showModal(error.message || 'No se pudo crear la meta.');
        }
    },
    
    async addFunds(goalId) {
        const amount = parseFloat(document.getElementById('funds-amount').value);
        if (!(amount > 0)) {
             this.appController.showModal('Ingresa un monto válido.');
             return;
        }

        try {
            // Llama a la API para abonar a la meta
            await this.appController.api.updateSavingsGoal(goalId, { amount });
            this.appController.showModal(`Has abonado ${this.appController.utils.formatCurrency(amount)} a tu meta.`, 'success');
            
            // Recarga todos los datos de la app para que el nuevo saldo se refleje en el dashboard
            await this.appController.initializeApp();
            setTimeout(() => this.renderGoalsList(), 1500);

        } catch (error) {
            this.appController.showModal(error.message || 'No se pudo realizar el abono.');
        }
    },

    _createGoalElement(goal) {
        const div = document.createElement('div');
        div.className = 'p-5 rounded-2xl custom-card';
        const percentage = Math.min((goal.current / goal.target) * 100, 100);
        div.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div>
                    <div class="flex items-center gap-3">
                        <i class="fas ${goal.icon} text-xl" style="color: var(--accent-color);"></i>
                        <h3 class="font-bold text-lg">${goal.nombre}</h3>
                    </div>
                    <p class="text-sm font-mono mt-1">${this.appController.utils.formatCurrency(goal.current)} / ${this.appController.utils.formatCurrency(goal.target)}</p>
                </div>
                <button class="add-funds-btn text-sm font-bold py-2 px-4 rounded-lg" data-goal-id="${goal.id}" style="background-color: var(--body-bg); border: 1px solid var(--border-color);">Abonar</button>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="h-2.5 rounded-full" style="width: ${percentage}%; background-color: var(--accent-color);"></div>
            </div>`;
        return div;
    }
};

