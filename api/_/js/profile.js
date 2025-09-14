/**
 * =================================================================
 * profile.js - Lógica Profesional para la Pantalla de Perfil
 * =================================================================
 * Este módulo está diseñado para ser robusto y mantenible. Gestiona
 * la renderización de la pantalla de perfil, la visualización de
 * datos del usuario y maneja todas las interacciones, incluyendo la
 * edición de datos a través de un modal.
 * =================================================================
 */
const profileModule = {
    globalState: null,
    appController: null,
    screenElement: null,

    /**
     * Punto de entrada del módulo.
     * @param {object} globalState - El estado global de la aplicación.
     * @param {object} appController - El controlador principal de la aplicación.
     */
    init(globalState, appController) {
        this.globalState = globalState;
        this.appController = appController;
        this.screenElement = document.getElementById('profile-screen');
        this.render();
    },

    /**
     * Renderiza la pantalla de perfil completa y adjunta los manejadores de eventos.
     */
    render() {
        if (!this.screenElement) {
            console.error('Profile screen element not found!');
            return;
        }

        const { user, theme } = this.globalState;
        const initials = (user.name || '..').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

        this.screenElement.innerHTML = `
            <div class="p-6">
                <header class="flex items-center gap-4 mb-8">
                    <div class="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-blue-500">
                        ${initials}
                    </div>
                    <div>
                        <h1 class="text-2xl font-bold">${user.name || 'Usuario'}</h1>
                        <p class="text-sm" style="color: var(--text-secondary);">${user.email || 'Sin email'}</p>
                    </div>
                </header>

                <main>
                    <div class="custom-card p-4 rounded-xl space-y-2">
                        ${this._createProfileDetailRow('Nombre', user.name)}
                        ${this._createProfileDetailRow('Teléfono', user.phone, true)}
                        ${this._createProfileDetailRow('CLABE', `**** ${(user.clabe || '0000').slice(-4)}`, false, user.clabe)}
                    </div>

                    <div class="mt-6 space-y-1">
                        ${this._createActionItem('edit-profile', 'fa-user-edit', 'Editar Perfil')}
                        ${this._createActionItem('toggle-theme', theme === 'dark' ? 'fa-sun' : 'fa-moon', `Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`)}
                        ${this._createActionItem('request-notifications', 'fa-bell', 'Activar Notificaciones')}
                        ${this._createActionItem('logout', 'fa-sign-out-alt', 'Cerrar Sesión', true)}
                    </div>
                </main>
            </div>`;

        this._attachEventListeners();
    },
    
    /**
     * Helper para crear una fila de detalle de perfil.
     * @param {string} label - La etiqueta para el dato.
     * @param {string} value - El valor del dato.
     * @param {boolean} isPhone - Formatea el valor como teléfono si es true.
     * @param {string} copyValue - El valor a copiar al portapapeles.
     * @returns {string} - El HTML de la fila.
     */
    _createProfileDetailRow(label, value, isPhone = false, copyValue = null) {
        let displayValue = value || 'No establecido';
        if (isPhone && value) {
            displayValue = value.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
        }
        
        return `
            <div class="flex justify-between items-center py-2 border-b last:border-b-0" style="border-color: var(--border-color);">
                <span style="color: var(--text-secondary);">${label}</span>
                <div class="flex items-center gap-2">
                    <span class="font-semibold">${displayValue}</span>
                    ${copyValue ? `<button class="copy-button p-1" data-copy="${copyValue}"><i class="fas fa-copy text-sm"></i></button>` : ''}
                </div>
            </div>`;
    },

    /**
     * Helper para crear un botón de acción.
     * @param {string} action - El identificador de la acción.
     * @param {string} icon - La clase del icono de FontAwesome.
     * @param {string} text - El texto del botón.
     * @param {boolean} isDestructive - Aplica estilos de peligro si es true.
     * @returns {string} - El HTML del botón.
     */
    _createActionItem(action, icon, text, isDestructive = false) {
        const textColor = isDestructive ? 'text-red-500' : '';
        const iconColor = isDestructive ? '' : 'style="color: var(--accent-color);"';
        
        return `
            <button data-action="${action}" class="w-full text-left py-3 px-2 flex items-center gap-4 text-lg rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 ${textColor}">
                <i class="fas ${icon} w-6 text-center" ${iconColor}></i>
                <span>${text}</span>
            </button>`;
    },

    /**
     * Adjunta un único manejador de eventos al contenedor principal para delegación.
     */
    _attachEventListeners() {
        this.screenElement.addEventListener('click', (e) => {
            // Este es el listener global para los botones de acción del perfil.
            const actionButton = e.target.closest('button[data-action]');
            if (actionButton) {
                const action = actionButton.dataset.action;
                switch (action) {
                    case 'edit-profile':
                        this._showEditModal();
                        break;
                    case 'toggle-theme':
                        // Dispara el evento en el botón global del tema
                        document.getElementById('theme-toggle')?.click();
                        break;
                    case 'request-notifications':
                        this.appController.requestNotificationPermission();
                        break;
                    case 'logout':
                        this.appController.handleLogout();
                        break;
                }
            }
            
            // Este listener es específico para los botones de copiar
            const copyButton = e.target.closest('.copy-button');
            if(copyButton) {
                 this.appController.utils.copyToClipboard(copyButton.dataset.copy, copyButton);
            }
        });
    },

    /**
     * Construye y muestra el modal para editar el perfil del usuario.
     */
    _showEditModal() {
        const { user } = this.globalState;
        const modalHTML = `
            <form id="edit-profile-form" class="p-6">
                <div class="flex justify-between items-center mb-4">
                   <h2 class="text-xl font-bold">Editar Perfil</h2>
                   <button type="button" class="modal-close-btn text-2xl">&times;</button>
                </div>
                <div class="mb-4">
                    <label for="profile-name-input" class="block text-sm font-medium mb-1">Nombre Completo</label>
                    <input type="text" id="profile-name-input" name="nombre" class="w-full p-3 border rounded-lg" style="background-color: var(--background-color); border-color: var(--border-color);" value="${user.name || ''}" required>
                </div>
                <div class="mb-6">
                    <label for="profile-phone-input" class="block text-sm font-medium mb-1">Teléfono (10 dígitos)</label>
                    <input type="tel" id="profile-phone-input" name="telefono" class="w-full p-3 border rounded-lg" style="background-color: var(--background-color); border-color: var(--border-color);" value="${user.phone || ''}" required pattern="[0-9]{10}" title="Introduce 10 dígitos sin espacios ni guiones.">
                </div>
                <div class="flex justify-end gap-3">
                     <button type="button" class="px-4 py-2 rounded-lg font-bold modal-close-btn" style="background-color: var(--border-color);">Cancelar</button>
                    <button type="submit" id="update-profile-btn" class="px-6 py-2 rounded-lg text-white font-bold active:scale-95 transition-colors" style="background-color: var(--accent-color);">Guardar Cambios</button>
                </div>
            </form>
        `;
        this.appController.showModal(modalHTML, 'custom');
        
        const form = document.getElementById('edit-profile-form');
        const modalOverlay = form.closest('.modal-overlay');

        // Cerrar modal
        modalOverlay.querySelectorAll('.modal-close-btn').forEach(btn => {
            btn.addEventListener('click', () => modalOverlay.remove());
        });

        // Manejar envío
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.appController.handleUpdateProfile(formData);
        });
    }
};

