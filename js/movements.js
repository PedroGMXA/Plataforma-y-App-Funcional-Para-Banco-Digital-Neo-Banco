/**
 * =================================================================
 * movements.js - Módulo para la Pantalla de Movimientos
 * =================================================================
 * Gestiona la visualización de la lista completa de transacciones
 * del usuario, incluyendo filtros y paginación (a futuro).
 * =================================================================
 */
const movementsModule = (function() {

    let state, controller;

    function init(_state, _controller) {
        state = _state;
        controller = _controller;
        render();
        attachEventListeners();
    }

    function render() {
        const dynamicContainer = document.getElementById('dynamic-screens-container');
        if (!dynamicContainer) return;

        const allTransactionsHTML = state.transactions.length > 0
            ? state.transactions.map(t => controller.utils.transactionItem(t).outerHTML).join('')
            : '<p class="text-center custom-card p-4 rounded-xl">No tienes ningún movimiento registrado.</p>';

        dynamicContainer.innerHTML = `
            <div id="movements-screen" class="screen active">
                <header class="p-6 text-white z-10" style="background: var(--header-bg);">
                    <div class="flex justify-between items-center">
                        <i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i>
                        <h1 class="text-2xl font-bold">Todos los Movimientos</h1>
                        <div class="w-6"></div>
                    </div>
                </header>
                <main class="flex-grow p-6 pb-24">
                    <div class="space-y-3">
                        ${allTransactionsHTML}
                    </div>
                </main>
            </div>
        `;
    }

    function attachEventListeners() {
        const screen = document.getElementById('movements-screen');
        if (!screen) return;

        // No es necesario agregar listeners a los items de transacción aquí
        // porque el listener global en app.js ya se encarga de eso.
    }

    return {
        init
    };

})();
