/**
 * =================================================================
 * savings-goals.js - Lógica para Metas de Ahorro (Versión Final)
 * =================================================================
 * Módulo para crear, visualizar y añadir fondos a metas de ahorro.
 * =================================================================
 */
const savingsGoalsModule = {
    globalState: null,
    appController: null,
    dynamicContainer: null,
    // Simulación de datos de metas
    goals: [
        { id: 1, name: 'Viaje a Cancún', current: 7500, target: 10000, icon: 'fa-umbrella-beach' },
        { id: 2, name: 'Nueva Laptop', current: 8000, target: 25000, icon: 'fa-laptop' },
        { id: 3, name: 'Fondo de Emergencia', current: 15000, target: 50000, icon: 'fa-shield-alt' }
    ],

    init(globalState, appController, startingScreen = 'savings-goals-list-screen') {
        this.globalState = globalState;
        this.appController = appController;
        this.dynamicContainer = document.getElementById('dynamic-screens-container');

        const screenMap = {
            'new-goal-screen': this.renderNewGoalForm,
            'add-funds-screen': this.renderAddFundsForm, // Este caso requiere un ID
            'default': this.renderGoalsList
        };

        // Si la pantalla es para añadir fondos, necesita un `goalId`
        if (startingScreen === 'add-funds-screen' && globalState.params) {
            this.renderAddFundsForm(globalState.params.goalId);
        } else {
            (screenMap[startingScreen] || screenMap['default']).call(this);
        }
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

    renderGoalsList() {
        const screen = this._render('savings-goals-list-template');
        if (!screen) return;
        const container = screen.querySelector('#goals-container');
        if (!container) return;

        container.innerHTML = ''; 
        if (this.goals.length > 0) {
            this.goals.forEach(goal => container.appendChild(this._createGoalElement(goal)));
        } else {
            container.innerHTML = `<p class="custom-card p-6 text-center">Aún no tienes metas de ahorro. ¡Crea una para empezar!</p>`;
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
        if (!goal) return this.renderGoalsList(); // Si no hay goal, volver a la lista

        const screen = this._render('add-funds-template');
        if (!screen) return;
        screen.querySelector('#add-funds-title').textContent = `Abonar a "${goal.name}"`;
        screen.querySelector('.back-to-goals').addEventListener('click', () => this.renderGoalsList());
        screen.querySelector('#add-funds-btn').addEventListener('click', () => this.addFunds(goalId));
    },

    saveNewGoal() {
        const name = document.getElementById('goal-name').value;
        const target = parseFloat(document.getElementById('goal-target').value);
        if (!name || !(target > 0)) {
            this.appController.showModal('Por favor, completa todos los campos correctamente.');
            return;
        }
        const newGoal = { id: Date.now(), name, target, current: 0, icon: 'fa-star' };
        this.goals.push(newGoal);
        this.appController.showModal('¡Meta creada con éxito!', 'success');
        setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
            this.renderGoalsList();
        }, 1500);
    },
    
    addFunds(goalId) {
        const amount = parseFloat(document.getElementById('funds-amount').value);
        if (!(amount > 0)) {
             this.appController.showModal('Ingresa un monto válido.');
             return;
        }
        const goal = this.goals.find(g => g.id === goalId);
        if (goal) {
            goal.current += amount;
            // Aquí iría la lógica para transferir el dinero desde la cuenta de débito (API)
            this.appController.showModal(`Has abonado ${this.globalState.renderUtils.formatCurrency(amount)} a tu meta.`, 'success');
            setTimeout(() => {
                document.getElementById('modal-container').innerHTML = '';
                this.renderGoalsList();
            }, 1500);
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
                        <h3 class="font-bold text-lg">${goal.name}</h3>
                    </div>
                    <p class="text-sm font-mono mt-1">${this.globalState.renderUtils.formatCurrency(goal.current)} / ${this.globalState.renderUtils.formatCurrency(goal.target)}</p>
                </div>
                <button class="add-funds-btn text-sm font-bold py-2 px-4 rounded-lg" data-goal-id="${goal.id}" style="background-color: var(--body-bg); border: 1px solid var(--border-color);">Abonar</button>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="h-2.5 rounded-full" style="width: ${percentage}%; background-color: var(--accent-color);"></div>
            </div>`;
        return div;
    }
};
