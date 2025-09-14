/**
 * =================================================================
 * move-money.js - Lógica Profesional para Flujo de Mover Dinero
 * =================================================================
 * Módulo que maneja las pantallas para transferir, recibir
 * dinero y gestionar contactos con funcionalidad CRUD completa.
 * =================================================================
 */
const moveMoneyModule = {
    globalState: null,
    appController: null,
    dynamicContainer: null,

    init(globalState, appController, startingScreen = 'move-money-hub-screen', params = {}) {
        this.globalState = globalState;
        this.appController = appController;
        this.dynamicContainer = document.getElementById('dynamic-screens-container');
        
        const screenMap = {
            'deposit-screen': this.renderDepositScreen,
            'transfer-screen-1': this.renderTransferStep1,
            'new-contact-screen': this.renderNewContactScreen,
            'transfer-screen-2': this.renderTransferStep2,
            'transfer-screen-3': this.renderTransferStep3,
            'success-screen': this.renderSuccessScreen,
            'default': this.renderHub
        };
        (screenMap[startingScreen] || screenMap['default']).call(this, params);
    },

    _render(templateId) {
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`Template ${templateId} not found!`);
            this.dynamicContainer.innerHTML = `<p class="p-6 text-center">Error: No se pudo cargar la interfaz. Plantilla no encontrada.</p>`;
            return;
        }
        const clone = template.content.cloneNode(true);
        this.dynamicContainer.innerHTML = '';
        this.dynamicContainer.appendChild(clone);
    },
    
    renderHub() {
        this._render('move-money-hub-template');
        this.dynamicContainer.querySelector('.back-to-dashboard').addEventListener('click', () => this.appController.showScreen('dashboard-screen'));
        this.dynamicContainer.querySelector('[data-action="send"]').addEventListener('click', () => this.init(this.globalState, this.appController, 'transfer-screen-1'));
        this.dynamicContainer.querySelector('[data-action="receive"]').addEventListener('click', () => this.init(this.globalState, this.appController, 'deposit-screen'));
    },

    renderDepositScreen() {
        this._render('deposit-screen-template');
        const { user } = this.globalState;
        const clabe = user.clabe || 'No disponible';
        
        this.dynamicContainer.querySelector('#deposit-clabe').textContent = clabe.replace(/(\d{4})/g, '$1 ').trim();
        this.dynamicContainer.querySelector('.copy-button').dataset.copy = clabe;
        
        const qrImg = this.dynamicContainer.querySelector('#qr-code');
        const qrData = `CLABE:${clabe},BENEFICIARIO:${user.name}`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&qzone=2`;
        
        this.dynamicContainer.querySelector('.back-to-hub').addEventListener('click', () => this.init(this.globalState, this.appController, 'move-money-hub-screen'));
    },

    renderTransferStep1() {
        this._render('transfer-screen-1-template');
        this._renderContactList();

        this.dynamicContainer.querySelector('#contact-search').addEventListener('input', this._filterContacts.bind(this));
        this.dynamicContainer.querySelector('#add-new-contact-btn').addEventListener('click', () => this.init(this.globalState, this.appController, 'new-contact-screen'));
        this.dynamicContainer.querySelector('.back-to-hub').addEventListener('click', () => this.init(this.globalState, this.appController, 'move-money-hub-screen'));
    },

    _renderContactList() {
        const contactsSection = this.dynamicContainer.querySelector('#contacts-section');
        if (!contactsSection) return;

        const { contacts } = this.globalState;
        contactsSection.innerHTML = '';

        if (contacts.length === 0) {
            contactsSection.innerHTML = '<div class="text-center p-8 custom-card"><p class="font-semibold">Sin Contactos</p><p class="text-sm">Añade tu primer contacto para empezar a transferir.</p></div>';
            return;
        }
        
        const recentContacts = contacts.slice(0, 5);
        
        let contentHTML = `
            <h3 class="text-lg font-bold mb-4">Recientes</h3>
            <div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6">
                ${recentContacts.map(c => this._getContactHTML(c, 'recent')).join('')}
            </div>
            <h3 class="text-lg font-bold mb-4 mt-4">Todos los Contactos</h3>
            <div id="all-contacts-container" class="space-y-3">
                ${contacts.map(c => this._getContactHTML(c, 'all')).join('')}
            </div>
        `;
        contactsSection.innerHTML = contentHTML;

        contactsSection.addEventListener('click', e => {
            const contactItem = e.target.closest('.contact-item');
            if (contactItem) {
                this.handleContactSelection(contactItem.dataset.contactId);
            }
            const editBtn = e.target.closest('.edit-contact-btn');
            if(editBtn) {
                e.stopPropagation();
                this._showEditContactModal(editBtn.dataset.contactId);
            }
        });
    },
    
    renderNewContactScreen() {
        this._render('new-contact-template');
        this.dynamicContainer.querySelector('#save-contact-btn').addEventListener('click', () => {
            const name = this.dynamicContainer.querySelector('#contact-name').value;
            const clabe = this.dynamicContainer.querySelector('#contact-clabe').value;
            this.appController.handleSaveContact({ nombre_contacto: name, clabe_contacto: clabe });
        });
        this.dynamicContainer.querySelector('.back-to-transfer-1').addEventListener('click', () => this.init(this.globalState, this.appController, 'transfer-screen-1'));
    },
    
    renderTransferStep2(contact) {
        this._render('transfer-screen-2-template');
        const { cards } = this.globalState;
        const debitCard = cards.find(c => c.type === 'Débito');
        
        this.dynamicContainer.querySelector('#recipient-name').textContent = contact.name;
        const availableBalance = debitCard ? debitCard.balance : 0;
        this.dynamicContainer.querySelector('#available-balance').textContent = `Balance disponible: ${this.appController.utils.formatCurrency(availableBalance)}`;
        
        const continueBtn = this.dynamicContainer.querySelector('#continue-to-confirm');
        if(continueBtn) {
            continueBtn.disabled = true;
            continueBtn.addEventListener('click', () => this.handleContinueToConfirm());
        }

        this.dynamicContainer.querySelector('.back-to-transfer-1').addEventListener('click', () => this.init(this.globalState, this.appController, 'transfer-screen-1'));
        this.dynamicContainer.querySelector('#quick-amounts').addEventListener('click', this._handleQuickAmount.bind(this));
        this.dynamicContainer.querySelector('#transfer-amount-display').addEventListener('input', this._formatAmountInput.bind(this));
    },

    renderTransferStep3() {
        this._render('transfer-screen-3-template');
        const { user, cards, currentTransfer } = this.globalState;
        const debitCard = cards.find(c => c.type === 'Débito');
        
        // =================================================================
        // CORRECCIÓN: Se añade manejo defensivo para la cuenta de origen.
        // Si no se encuentra la tarjeta, se muestra un texto alternativo.
        // =================================================================
        const senderAccountText = debitCard && debitCard.number 
            ? `Débito GMXA **** ${debitCard.number.slice(-4)}` 
            : 'Cuenta de origen no disponible';

        this.dynamicContainer.querySelector('#confirm-amount').textContent = this.appController.utils.formatCurrency(currentTransfer.amount);
        this.dynamicContainer.querySelector('#sender-name').textContent = user.name;
        this.dynamicContainer.querySelector('#sender-account').textContent = senderAccountText;
        this.dynamicContainer.querySelector('#recipient-name-confirm').textContent = currentTransfer.contact.name;
        this.dynamicContainer.querySelector('#recipient-account-confirm').textContent = `**** ${currentTransfer.contact.clabe.slice(-4)}`;
        this.dynamicContainer.querySelector('#concept-confirm').textContent = currentTransfer.concept;
        this.dynamicContainer.querySelector('#confirm-transfer-btn').addEventListener('click', () => this.appController.handleConfirmTransfer());
        this.dynamicContainer.querySelector('.back-to-transfer-2').addEventListener('click', () => this.renderTransferStep2(this.globalState.currentTransfer.contact));
    },

    renderSuccessScreen() {
        this._render('success-screen-template');
        const { currentTransfer } = this.globalState;
        
        this.dynamicContainer.querySelector('#success-amount').textContent = this.appController.utils.formatCurrency(currentTransfer.amount);
        this.dynamicContainer.querySelector('#success-recipient').textContent = currentTransfer.contact.name;
        this.dynamicContainer.querySelector('#success-date').textContent = this.appController.utils.formatDate(currentTransfer.date, 'long');
        this.dynamicContainer.querySelector('#success-folio').textContent = currentTransfer.folio;
        this.dynamicContainer.querySelector('#new-transfer-btn').addEventListener('click', () => this.init(this.globalState, this.appController, 'transfer-screen-1'));
        this.dynamicContainer.querySelector('#share-receipt-btn').addEventListener('click', () => this.appController.shareReceipt());
    },

    handleContactSelection(contactId) {
        this.globalState.currentTransfer = {};
        const contactData = this.globalState.contacts.find(c => c.id == contactId);
        if (contactData) {
            const contact = {
                id: contactData.id,
                name: contactData.nombre_contacto,
                clabe: contactData.clabe_contacto
            };
            this.globalState.currentTransfer.contact = contact;
            this.renderTransferStep2(contact);
        }
    },

    handleContinueToConfirm() {
        const amount = parseFloat(this.dynamicContainer.querySelector('#transfer-amount').value) || 0;
        const debitCard = this.globalState.cards.find(c => c.type === 'Débito');
        if (amount <= 0) { this.appController.showModal('El monto debe ser mayor a cero.'); return; }
        if (!debitCard || amount > debitCard.balance) { this.appController.showModal('No tienes saldo suficiente.'); return; }
        this.globalState.currentTransfer.amount = amount;
        this.globalState.currentTransfer.concept = this.dynamicContainer.querySelector('#transfer-concept').value.trim() || 'Transferencia';
        this.renderTransferStep3();
    },

    _getContactHTML(contact, type) {
        const initials = (contact.nombre_contacto || '..').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        if (type === 'recent') {
            return `<div class="contact-item flex-none flex flex-col items-center w-20 text-center cursor-pointer" data-contact-id='${contact.id}'>
                        <div class="w-16 h-16 rounded-full flex items-center justify-center font-bold text-white bg-blue-500 text-2xl">${initials}</div>
                        <p class="text-xs mt-2 font-semibold truncate w-full">${contact.nombre_contacto.split(' ')[0]}</p>
                    </div>`;
        }
        return `<div class="contact-item flex items-center p-3 rounded-lg cursor-pointer custom-card" data-contact-id='${contact.id}'>
                    <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white bg-blue-500">${initials}</div>
                    <p class="ml-4 font-semibold flex-grow">${contact.nombre_contacto}</p>
                    <button class="edit-contact-btn p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700" data-contact-id="${contact.id}"><i class="fas fa-ellipsis-h"></i></button>
                </div>`;
    },
    
     _filterContacts(e) {
        const searchTerm = e.target.value.toLowerCase();
        this.dynamicContainer.querySelectorAll('#all-contacts-container .contact-item').forEach(item => {
            const name = item.querySelector('p').textContent.toLowerCase();
            const contactData = this.globalState.contacts.find(c => c.id == item.dataset.contactId);
            const clabe = contactData ? contactData.clabe_contacto : '';
            item.style.display = (name.includes(searchTerm) || clabe.includes(searchTerm)) ? 'flex' : 'none';
        });
    },
    
    _handleQuickAmount(e) {
        const quickAmountBtn = e.target.closest('.quick-amount-btn');
        if (!quickAmountBtn) return;
        const amountValue = parseFloat(quickAmountBtn.textContent.replace(/[^0-9]/g, ''));
        const display = this.dynamicContainer.querySelector('#transfer-amount-display');
        const hiddenInput = this.dynamicContainer.querySelector('#transfer-amount');
        if (display && hiddenInput) {
            hiddenInput.value = amountValue.toFixed(2);
            display.value = this.appController.utils.formatCurrency(amountValue);
            
            const continueBtn = this.dynamicContainer.querySelector('#continue-to-confirm');
            if (continueBtn) continueBtn.disabled = false;
        }
    },

    _formatAmountInput(e) {
        const display = e.target;
        const hiddenInput = this.dynamicContainer.querySelector('#transfer-amount');
        const continueBtn = this.dynamicContainer.querySelector('#continue-to-confirm');
        
        let digits = display.value.replace(/\D/g, '');
        let realValue = digits ? parseInt(digits, 10) / 100 : 0;
        
        hiddenInput.value = realValue.toFixed(2);
        display.value = this.appController.utils.formatCurrency(realValue);

        if (continueBtn) {
            continueBtn.disabled = realValue <= 0;
        }
    },

    _showEditContactModal(contactId) {
        const contact = this.globalState.contacts.find(c => c.id == contactId);
        if (!contact) return;

        const template = document.getElementById('edit-contact-modal-template');
        const content = template.content.cloneNode(true).firstElementChild.outerHTML;
        this.appController.showModal(content, 'custom');

        document.getElementById('edit-contact-id').value = contact.id;
        document.getElementById('edit-contact-name').value = contact.nombre_contacto;
        document.getElementById('edit-contact-clabe').textContent = contact.clabe_contacto.replace(/(\d{4})/g, '$1 ').trim();

        document.getElementById('update-contact-btn').onclick = () => {
            const id = document.getElementById('edit-contact-id').value;
            const name = document.getElementById('edit-contact-name').value;
            this.appController.handleUpdateContact(id, { nombre_contacto: name });
        };
        
        document.getElementById('delete-contact-btn').onclick = () => {
            const id = document.getElementById('edit-contact-id').value;
            if (confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
                this.appController.handleDeleteContact(id);
            }
        };
    }
};

