<?php
session_start();
// Capa de seguridad en el servidor para redirigir si no hay sesión activa.
if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
    header('Location: login.html');
    exit;
}

// Guardamos datos del usuario para usarlos en la interfaz.
$userName = htmlspecialchars($_SESSION['user_name'] ?? 'Usuario');

// Lógica mejorada para iniciales: toma la primera letra del primer y segundo nombre.
// Es compatible con caracteres multi-byte (acentos, etc.).
$nameParts = explode(' ', $userName);
$userInitials = mb_strtoupper(
    mb_substr($nameParts[0], 0, 1) . 
    (isset($nameParts[1]) ? mb_substr($nameParts[1], 0, 1) : '')
);
?>
<!DOCTYPE html>
<html lang="es" class="theme-light">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>GMXA | Tu Banca Inteligente</title>
    <meta name="description" content="Accede a tu banca digital GMXA para gestionar tus cuentas, tarjetas y realizar transferencias de forma segura.">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23FF9900;'/%3E%3Cstop offset='100%25' style='stop-color:%23FF6600;'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath fill='url(%23g)' d='M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z'/%3E%3Ctext x='50' y='60' font-size='38' fill='white' font-family='Poppins, sans-serif' font-weight='bold' text-anchor='middle'%3EGX%3C/text%3E%3C/svg%3E">
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <script src="https://cdn.tailwindcss.com"></script>
    
    <style>
        :root {
            --header-bg-light: linear-gradient(135deg, #FF9900, #FF6600); --body-bg-light: #f5f7fa; --text-primary-light: #2c3e50; --text-secondary-light: #5a677d; --card-bg-light: #ffffff; --accent-color-light: #FF7F00; --nav-bg-light: rgba(255, 255, 255, 0.8); --border-light: #e2e8f0; --shadow-light: rgba(44, 62, 80, 0.1); --skeleton-bg-light: #e2e8f0; --modal-bg-light: #ffffff;
            --header-bg-dark: linear-gradient(135deg, #1A2A3A, #2C3E50); --body-bg-dark: #121212; --text-primary-dark: #ecf0f1; --text-secondary-dark: #a0aec0; --card-bg-dark: #2d3748; --accent-color-dark: #FF8C00; --nav-bg-dark: rgba(45, 55, 72, 0.8); --border-dark: #4a5568; --shadow-dark: rgba(0, 0, 0, 0.25); --skeleton-bg-dark: #3c5064; --modal-bg-dark: #1e1e1e;
        }
        .theme-light { --header-bg: var(--header-bg-light); --body-bg: var(--body-bg-light); --text-primary: var(--text-primary-light); --text-secondary: var(--text-secondary-light); --card-bg: var(--card-bg-light); --accent-color: var(--accent-color-light); --nav-bg: var(--nav-bg-light); --border-color: var(--border-light); --shadow-color: var(--shadow-light); --skeleton-bg: var(--skeleton-bg-light); --modal-bg: var(--modal-bg-light); }
        .theme-dark { --header-bg: var(--header-bg-dark); --body-bg: var(--body-bg-dark); --text-primary: var(--text-primary-dark); --text-secondary: var(--text-secondary-dark); --card-bg: var(--card-bg-dark); --accent-color: var(--accent-color-dark); --nav-bg: var(--nav-bg-dark); --border-color: var(--border-dark); --shadow-color: var(--shadow-dark); --skeleton-bg: var(--skeleton-bg-dark); --modal-bg: var(--modal-bg-dark); }
        body { font-family: 'Inter', sans-serif; background-color: var(--body-bg); color: var(--text-primary); transition: background-color 0.3s ease, color 0.3s ease; -webkit-tap-highlight-color: transparent; }
        
        #app-container { position: relative; min-height: 100vh; }
        #app-container > .screen, #dynamic-screens-container {
            position: absolute; top: 0; left: 0; width: 100%; min-height: 100%;
            opacity: 0; visibility: hidden; pointer-events: none;
            transition: opacity 0.3s ease-in-out;
            display: flex; flex-direction: column;
        }
        #app-container > .screen.active, #dynamic-screens-container.active {
            position: relative; opacity: 1; visibility: visible; pointer-events: auto;
        }
        .nav-bar, .custom-card, .modal-content { box-shadow: 0 5px 20px var(--shadow-color); }
        .custom-card { background-color: var(--card-bg); transition: all 0.3s ease; }
        .nav-item.active { color: var(--accent-color); }
        .bank-card { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.2); transition: transform 0.3s ease; }
        .bank-card:active { transform: scale(0.97); }
        .card-chip { width: 40px; height: 32px; background: linear-gradient(135deg, #d4af37, #f7d26b, #b8860b); border-radius: 4px; }
        .world-map-texture { background-image: url('https://www.transparenttextures.com/patterns/world-map.png'); opacity: 0.1; }
        .success-checkmark__circle { stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 3; stroke: #4BB543; fill: none; animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards; }
        .success-checkmark__check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; stroke: #4BB543; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        .skeleton { animation: shimmer 1.5s infinite linear; background: linear-gradient(90deg, var(--skeleton-bg) 25%, #f7fafc 50%, var(--skeleton-bg) 75%); background-size: 200% 100%; }
        .theme-dark .skeleton { background: linear-gradient(90deg, var(--skeleton-bg) 25%, #4a5a6a 50%, var(--skeleton-bg) 75%); background-size: 200% 100%;}
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); z-index: 1000; display: flex; justify-content: center; align-items: flex-end; animation: fadeInModal 0.3s ease-out forwards; opacity: 0; }
        @keyframes fadeInModal { to { opacity: 1; } }
        .modal-content { background-color: var(--modal-bg); width: 100%; max-width: 480px; border-top-left-radius: 1.5rem; border-top-right-radius: 1.5rem; animation: slideUpModal 0.4s cubic-bezier(0.25, 0.8, 0.25, 1) forwards; transform: translateY(100%); }
        @keyframes slideUpModal { to { transform: translateY(0); } }
        .scroll-hidden::-webkit-scrollbar { display: none; }
        .scroll-hidden { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
</head>
<body class="theme-light">

    <div id="app-container">
        
        <main id="dashboard-screen" class="screen active"></main>
        <section id="cards-screen" class="screen"></section>
        <section id="credit-screen" class="screen"></section>
        <section id="promotions-screen" class="screen"></section>
        <section id="profile-screen" class="screen"></section>
        
        <div id="dynamic-screens-container"></div>

        <nav id="nav-bar" class="fixed bottom-0 left-0 w-full flex justify-around items-center py-2 z-50 rounded-t-2xl backdrop-blur-sm" style="background-color: var(--nav-bg);">
            <button class="nav-item active flex-1 flex flex-col items-center justify-center" data-screen="dashboard-screen"><i class="fas fa-home text-xl"></i><span class="text-xs font-medium mt-1">Inicio</span></button>
            <button class="nav-item flex-1 flex flex-col items-center justify-center" data-screen="cards-screen"><i class="fas fa-credit-card text-xl"></i><span class="text-xs font-medium mt-1">Tarjetas</span></button>
            
            <button id="action-menu-btn" class="w-16 h-16 -mt-8 rounded-full flex items-center justify-center text-white text-2xl shadow-lg active:scale-95 transition-transform duration-100" style="background-color: var(--accent-color);">
                <i class="fas fa-plus"></i>
            </button>
            
            <button class="nav-item flex-1 flex flex-col items-center justify-center" data-screen="credit-screen"><i class="fas fa-hand-holding-usd text-xl"></i><span class="text-xs font-medium mt-1">Crédito</span></button>
            <button class="nav-item flex-1 flex flex-col items-center justify-center" data-screen="profile-screen"><i class="fas fa-user-circle text-xl"></i><span class="text-xs font-medium mt-1">Perfil</span></button>
        </nav>
    </div>

    <div id="modal-container"></div>
    
    <!-- Plantillas HTML para toda la aplicación -->
    <template id="dashboard-screen-template">
        <header class="p-6 pb-20 text-white relative z-10" style="background: var(--header-bg);">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                        <span id="user-initials"></span>
                    </div>
                    <div>
                        <p class="font-semibold text-lg leading-tight">Hola, <span id="user-firstname"></span></p>
                        <p class="text-xs text-white/80">Bienvenido a tu banca</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <button id="theme-toggle-btn" class="w-11 h-11 flex items-center justify-center text-xl"><i class="fas fa-moon"></i></button>
                    <button class="w-11 h-11 flex items-center justify-center text-xl"><i class="fas fa-bell"></i></button>
                </div>
            </div>
        </header>
        <main class="flex-grow p-6 -mt-16 z-20 rounded-t-3xl pb-24" style="background-color: var(--body-bg);">
            <div id="balance-card" class="p-6 rounded-2xl custom-card text-center">
                <p class="text-sm font-medium" style="color: var(--text-secondary);">Saldo Disponible</p>
                <div id="balance-skeleton" class="h-10 my-1 w-48 mx-auto skeleton rounded-lg"></div>
                <p id="balance-amount" class="text-4xl font-bold my-2 hidden"></p>
                <p id="balance-clabe" class="text-sm font-mono tracking-wider" style="color: var(--text-secondary);"></p>
            </div>
            
            <div class="grid grid-cols-4 gap-4 text-center my-6">
                 <div data-screen-link="move-money-hub-screen" class="quick-action cursor-pointer"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 custom-card"><i class="fas fa-paper-plane text-xl" style="color: var(--accent-color);"></i></div><p class="text-xs font-semibold">Enviar</p></div>
                 <div data-screen-link="services-hub-screen" class="quick-action cursor-pointer"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 custom-card"><i class="fas fa-file-invoice-dollar text-xl" style="color: var(--accent-color);"></i></div><p class="text-xs font-semibold">Servicios</p></div>
                 <div data-screen-link="savings-goals-list-screen" class="quick-action cursor-pointer"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 custom-card"><i class="fas fa-piggy-bank text-xl" style="color: var(--accent-color);"></i></div><p class="text-xs font-semibold">Metas</p></div>
                 <div data-screen-link="movements-screen" class="quick-action cursor-pointer"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2 custom-card"><i class="fas fa-receipt text-xl" style="color: var(--accent-color);"></i></div><p class="text-xs font-semibold">Movimientos</p></div>
            </div>

            <div class="flex justify-between items-center mb-4">
                <h3 class="font-bold text-lg">Movimientos Recientes</h3>
                <a href="#" data-screen-link="movements-screen" class="text-sm font-semibold" style="color: var(--accent-color);">Ver todos</a>
            </div>
            <div id="recent-movements-list" class="space-y-3">
                <!-- Skeleton Loader for movements -->
                <div class="flex items-center gap-4 p-3 rounded-xl custom-card">
                    <div class="w-11 h-11 skeleton rounded-full"></div>
                    <div class="flex-grow space-y-2">
                        <div class="h-4 w-3/4 skeleton rounded"></div>
                        <div class="h-3 w-1/2 skeleton rounded"></div>
                    </div>
                    <div class="h-5 w-16 skeleton rounded"></div>
                </div>
                 <div class="flex items-center gap-4 p-3 rounded-xl custom-card">
                    <div class="w-11 h-11 skeleton rounded-full"></div>
                    <div class="flex-grow space-y-2">
                        <div class="h-4 w-3/4 skeleton rounded"></div>
                        <div class="h-3 w-1/2 skeleton rounded"></div>
                    </div>
                    <div class="h-5 w-16 skeleton rounded"></div>
                </div>
            </div>
        </main>
    </template>
    <template id="action-menu-modal-template">
        <div class="p-6">
            <h2 class="text-xl font-bold text-center mb-6">Acciones Rápidas</h2>
            <div class="grid grid-cols-2 gap-4 text-center">
                <div data-screen-link="move-money-hub-screen" class="quick-action cursor-pointer p-4 rounded-xl custom-card"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color:var(--body-bg);"><i class="fas fa-exchange-alt text-2xl" style="color: var(--accent-color);"></i></div><p class="font-medium">Mover Dinero</p></div>
                <div data-screen-link="services-hub-screen" class="quick-action cursor-pointer p-4 rounded-xl custom-card"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color:var(--body-bg);"><i class="fas fa-file-invoice-dollar text-2xl" style="color: var(--accent-color);"></i></div><p class="font-medium">Pagar Servicios</p></div>
                <div data-screen-link="promotions-screen" class="quick-action cursor-pointer p-4 rounded-xl custom-card"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color:var(--body-bg);"><i class="fas fa-tags text-2xl" style="color: var(--accent-color);"></i></div><p class="font-medium">Ofertas</p></div>
                <div data-screen-link="savings-goals-list-screen" class="quick-action cursor-pointer p-4 rounded-xl custom-card"><div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-2" style="background-color:var(--body-bg);"><i class="fas fa-piggy-bank text-2xl" style="color: var(--accent-color);"></i></div><p class="font-medium">Metas</p></div>
            </div>
        </div>
    </template>
    
    <template id="cards-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);">
            <div class="flex justify-between items-center">
                <i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i>
                <h1 class="text-2xl font-bold">Mis Tarjetas</h1>
                <div class="w-6"></div>
            </div>
        </header>
        <main class="flex-grow p-6 pb-24 space-y-4">
            <div id="cards-list-container" class="space-y-4"></div>
            <div id="card-details-container" class="hidden">
                <div class="p-5 rounded-2xl text-white flex flex-col justify-between h-56 relative overflow-hidden custom-card" style="background: linear-gradient(135deg, #4b6cb7, #182848);">
                    <div class="relative z-10">
                        <div class="flex justify-between items-center">
                            <span class="font-semibold text-xl">Tarjeta Débito</span>
                            <i class="fab fa-cc-mastercard text-3xl"></i>
                        </div>
                    </div>
                    <div class="relative z-10 space-y-2">
                        <div class="flex items-center gap-3">
                            <div class="card-chip"></div>
                            <p class="font-mono text-xl tracking-widest" id="card-number-display"></p>
                        </div>
                        <div class="flex justify-between items-center">
                            <div>
                                <p class="text-sm">Titular</p>
                                <p class="font-semibold text-lg" id="card-holder-name"></p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm">Vence</p>
                                <p class="font-semibold text-lg" id="card-expiry-date"></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-4 mt-6">
                    <button class="flex-1 p-4 rounded-xl custom-card text-center text-sm font-semibold active:scale-95 transition-transform">
                        <i class="fas fa-lock block text-xl mb-2" style="color:var(--text-secondary);"></i>Congelar
                    </button>
                    <button class="flex-1 p-4 rounded-xl custom-card text-center text-sm font-semibold active:scale-95 transition-transform">
                        <i class="fas fa-cogs block text-xl mb-2" style="color:var(--text-secondary);"></i>Configuración
                    </button>
                    <button class="flex-1 p-4 rounded-xl custom-card text-center text-sm font-semibold active:scale-95 transition-transform">
                        <i class="fas fa-list-alt block text-xl mb-2" style="color:var(--text-secondary);"></i>Reporte
                    </button>
                </div>
                <h3 class="font-bold text-lg mt-6 mb-4">Últimos Movimientos</h3>
                <div id="card-transactions-list" class="space-y-3"></div>
            </div>
        </main>
    </template>

    <template id="credit-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);">
            <div class="flex justify-between items-center">
                <i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i>
                <h1 class="text-2xl font-bold">Crédito GMXA</h1>
                <div class="w-6"></div>
            </div>
        </header>
        <main class="flex-grow p-6 pb-24">
            <div id="credit-summary-card" class="text-center p-6 rounded-2xl custom-card space-y-2">
                <p class="text-sm" style="color: var(--text-secondary);">Línea de Crédito Disponible</p>
                <p id="credit-available" class="text-4xl font-bold text-green-500"></p>
                <p class="text-sm" style="color: var(--text-secondary);">De un total de <span id="credit-limit" class="font-semibold"></span></p>
                <div class="w-full h-2 rounded-full mt-4 bg-gray-200 overflow-hidden" style="background-color: var(--border-color);">
                    <div id="credit-usage-bar" class="h-full bg-red-500 rounded-full" style="width: 0%;"></div>
                </div>
                <p id="credit-used-amount" class="text-sm mt-2 font-semibold"></p>
            </div>
            <h3 class="font-bold text-xl mt-8 mb-4">Acciones de Crédito</h3>
            <div class="space-y-4">
                <div class="p-5 rounded-2xl custom-card flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                    <div class="flex items-center gap-4">
                        <i class="fas fa-file-invoice-dollar text-2xl" style="color: var(--accent-color);"></i>
                        <div><p class="font-semibold">Pagar Tarjeta</p><p class="text-sm" style="color:var(--text-secondary);">Paga tu saldo al instante.</p></div>
                    </div>
                    <i class="fas fa-chevron-right text-sm" style="color:var(--text-secondary);"></i>
                </div>
                <div class="p-5 rounded-2xl custom-card flex items-center justify-between cursor-pointer active:scale-95 transition-transform">
                    <div class="flex items-center gap-4">
                        <i class="fas fa-chart-line text-2xl" style="color: var(--accent-color);"></i>
                        <div><p class="font-semibold">Historial de Pagos</p><p class="text-sm" style="color:var(--text-secondary);">Revisa tus estados de cuenta.</p></div>
                    </div>
                    <i class="fas fa-chevron-right text-sm" style="color:var(--text-secondary);"></i>
                </div>
            </div>
        </main>
    </template>

    <template id="promotions-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);">
            <div class="flex justify-between items-center">
                <i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i>
                <h1 class="text-2xl font-bold">Promociones</h1>
                <div class="w-6"></div>
            </div>
        </header>
        <main class="flex-grow p-6 pb-24">
            <div id="promotions-list" class="space-y-6"></div>
        </main>
    </template>
    
    <template id="profile-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);">
            <div class="flex justify-between items-center">
                <i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i>
                <h1 class="text-2xl font-bold">Mi Perfil</h1>
                <i id="edit-profile-btn" class="fas fa-edit text-xl cursor-pointer"></i>
            </div>
        </header>
        <main class="flex-grow p-6 pb-24">
            <div class="flex flex-col items-center justify-center p-6 rounded-2xl custom-card mb-6">
                <div class="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-4xl font-bold text-gray-600 mb-4">
                    <span id="profile-initials"></span>
                </div>
                <h2 id="profile-name" class="text-xl font-bold"></h2>
                <p id="profile-email" class="text-sm mt-1" style="color:var(--text-secondary);"></p>
            </div>
            <div class="space-y-4">
                <div class="p-5 rounded-2xl custom-card flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <i class="fas fa-phone-alt text-2xl" style="color: var(--accent-color);"></i>
                        <div><p class="font-semibold">Teléfono</p><p id="profile-phone" class="text-sm" style="color:var(--text-secondary);"></p></div>
                    </div>
                    <i class="fas fa-chevron-right text-sm" style="color:var(--text-secondary);"></i>
                </div>
                <div class="p-5 rounded-2xl custom-card flex justify-between items-center">
                    <div class="flex items-center gap-4">
                        <i class="fas fa-wallet text-2xl" style="color: var(--accent-color);"></i>
                        <div><p class="font-semibold">CLABE Interbancaria</p><p id="profile-clabe" class="text-sm font-mono tracking-widest" style="color:var(--text-secondary);"></p></div>
                    </div>
                    <i class="fas fa-copy text-sm copy-button" data-copy="" style="color:var(--accent-color);"></i>
                </div>
                <button id="logout-btn" class="w-full font-bold py-3 px-6 rounded-lg custom-card mt-4" style="color: var(--accent-color);">Cerrar Sesión</button>
            </div>
        </main>
    </template>

    <!-- === INICIO: Plantillas para Mover Dinero === -->
    <template id="move-money-hub-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i><h1 class="text-2xl font-bold">Mover Dinero</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 pb-24"><div class="space-y-6"><div class="p-6 rounded-2xl cursor-pointer custom-card" data-action="send"><div class="flex items-center gap-5"><div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: var(--body-bg);"><i class="fas fa-arrow-up text-2xl" style="color: var(--accent-color);"></i></div><div><h3 class="font-bold text-lg">Enviar Dinero</h3><p class="text-sm" style="color:var(--text-secondary);">Transfiere a tus contactos.</p></div></div></div><div class="p-6 rounded-2xl cursor-pointer custom-card" data-action="receive"><div class="flex items-center gap-5"><div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: var(--body-bg);"><i class="fas fa-arrow-down text-2xl" style="color: var(--accent-color);"></i></div><div><h3 class="font-bold text-lg">Recibir Dinero</h3><p class="text-sm" style="color:var(--text-secondary);">Comparte tu CLABE o QR.</p></div></div></div></div></main>
    </template>
    <template id="deposit-screen-template">
        <header class="p-6 pb-12 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-hub"></i><h1 class="text-2xl font-bold">Recibir Dinero</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 -mt-8 z-20 rounded-t-3xl pb-24" style="background-color: var(--body-bg);"><div class="text-center p-6 rounded-2xl mb-6 custom-card"><h3 class="font-bold text-lg">CLABE de tu Cuenta</h3><p id="deposit-clabe" class="font-mono text-xl font-semibold my-3 tracking-wider" style="color: var(--accent-color);"></p><button class="copy-button text-sm font-semibold py-2 px-4 rounded-lg" style="background-color: var(--body-bg); border: 1px solid var(--border-color);" data-copy=""><i class="far fa-copy mr-2"></i>Copiar CLABE</button></div><div class="text-center p-6 rounded-2xl custom-card"><h3 class="font-bold text-lg mb-4">Código QR para Depósitos</h3><div id="qr-code-container" class="w-60 h-60 mx-auto rounded-lg"></div></div></main>
    </template>
    <template id="transfer-screen-1-template">
        <header class="p-6 flex items-center sticky top-0 z-20" style="background-color:var(--body-bg);"><i class="fas fa-arrow-left text-xl cursor-pointer back-to-hub"></i><h2 class="text-lg font-bold mx-auto">Enviar Dinero a</h2><div class="w-6"></div></header><div class="px-6 pb-4 sticky top-16 z-20" style="background-color: var(--body-bg);"><input type="search" id="contact-search" placeholder="Buscar por nombre o CLABE..." class="w-full p-3 rounded-lg border" style="background-color: var(--card-bg); border-color: var(--border-color);"></div><main id="contacts-section" class="flex-grow p-6 flex flex-col pt-0"></main><footer class="p-6 sticky bottom-0" style="background-color: var(--body-bg);"><button id="add-new-contact-btn" class="w-full flex items-center justify-center p-4 rounded-lg custom-card font-semibold"><i class="fas fa-plus-circle mr-3" style="color: var(--accent-color);"></i>Añadir nueva cuenta</button></footer>
    </template>
    <template id="new-contact-template">
        <header class="p-6 flex items-center sticky top-0" style="background-color:var(--body-bg);"><i class="fas fa-arrow-left text-xl cursor-pointer back-to-transfer-1"></i><h2 class="text-lg font-bold mx-auto">Nueva Cuenta</h2><div class="w-6"></div></header><main class="flex-grow p-6 flex flex-col justify-between"><form onsubmit="return false;"><div class="mb-4"><label for="contact-name" class="block text-sm font-medium mb-1">Nombre del Titular</label><input type="text" id="contact-name" class="w-full p-3 rounded-lg border" style="background-color:var(--card-bg); border-color:var(--border-color);" required></div><div><label for="contact-clabe" class="block text-sm font-medium mb-1">CLABE (18 dígitos)</label><input type="text" id="contact-clabe" inputmode="numeric" class="w-full p-3 rounded-lg border" style="background-color:var(--card-bg); border-color:var(--border-color);" required minlength="18" maxlength="18"></div><div class="mt-4"><label for="contact-bank" class="block text-sm font-medium mb-1">Banco Receptor</label><input type="text" id="contact-bank" class="w-full p-3 rounded-lg border" style="background-color:var(--card-bg); border-color:var(--border-color);" required></div></form><button id="save-contact-btn" class="w-full font-bold py-4 px-6 rounded-lg text-white mt-8" style="background-color:var(--accent-color);">Guardar Contacto</button></main>
    </template>
    <template id="transfer-screen-2-template">
        <header class="p-6 flex items-center sticky top-0" style="background-color:var(--body-bg);"><i class="fas fa-arrow-left text-xl cursor-pointer back-to-transfer-1"></i><h2 class="text-lg font-bold mx-auto">Monto y concepto</h2><div class="w-6"></div></header><main class="flex-grow p-6 flex flex-col justify-between"><div><div class="text-center mb-6 p-4 rounded-lg"><p class="text-sm" style="color:var(--text-secondary);">Enviar a:</p><p id="recipient-name" class="font-bold text-lg"></p></div><div class="text-center"><input type="text" id="transfer-amount-display" class="text-5xl font-bold bg-transparent text-center w-full border-none outline-none p-0" placeholder="$0.00"><input type="hidden" id="transfer-amount"><p id="available-balance" class="text-sm mt-2 font-semibold" style="color:var(--text-secondary);"></p></div><div id="quick-amounts" class="flex items-center gap-2 mt-4 justify-center"><button class="quick-amount-btn flex-1 p-2 border rounded-lg" style="border-color:var(--border-color);">$100</button><button class="quick-amount-btn flex-1 p-2 border rounded-lg" style="border-color:var(--border-color);">$250</button><button class="quick-amount-btn flex-1 p-2 border rounded-lg" style="border-color:var(--border-color);">$500</button></div><div class="mt-6"><input type="text" id="transfer-concept" class="w-full p-3 rounded-lg border" style="background-color:var(--card-bg); border-color:var(--border-color);" placeholder="Concepto (Opcional)"></div></div><button id="continue-to-confirm" class="w-full font-bold py-4 px-6 rounded-lg text-white mt-8" style="background-color:var(--accent-color);">Continuar</button></main>
    </template>
    <template id="transfer-screen-3-template">
        <header class="p-6 flex items-center sticky top-0" style="background-color:var(--body-bg);"><i class="fas fa-arrow-left text-xl cursor-pointer back-to-transfer-2"></i><h2 class="text-lg font-bold mx-auto">Confirmar</h2><div class="w-6"></div></header><main class="flex-grow p-6 flex flex-col justify-between"><div><div class="text-center mb-8"><p class="text-sm" style="color:var(--text-secondary);">Monto a Enviar</p><p id="confirm-amount" class="text-5xl font-bold"></p></div><div class="p-4 rounded-lg space-y-3 custom-card"><div class="flex justify-between items-center"><span class="text-sm" style="color:var(--text-secondary);">De:</span><div class="text-right"><p id="sender-name" class="font-semibold"></p><p id="sender-account" class="text-xs font-mono"></p></div></div><div class="border-t my-2" style="border-color: var(--border-color);"></div><div class="flex justify-between items-center"><span class="text-sm" style="color:var(--text-secondary);">Para:</span><div class="text-right"><p id="recipient-name-confirm" class="font-semibold"></p><p id="recipient-account-confirm" class="text-xs font-mono"></p></div></div><div class="border-t my-2" style="border-color: var(--border-color);"></div><div class="flex justify-between"><span>Concepto:</span><span id="concept-confirm" class="font-semibold"></span></div></div></div><button id="confirm-transfer-btn" class="w-full font-bold py-4 px-6 rounded-lg text-white mt-8" style="background-color:var(--accent-color);">Confirmar y Enviar</button></main>
    </template>
    <template id="success-screen-template">
        <main class="flex-grow flex flex-col justify-between items-center p-6 text-center">
            <div class="w-full max-w-md">
                <svg class="success-checkmark w-20 h-20 mx-auto mt-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <h2 class="text-2xl font-bold mt-6">¡Transferencia Exitosa!</h2>
                <div id="receipt-container" class="p-5 rounded-2xl space-y-4 text-left mt-6 w-full custom-card border" style="border-color: var(--border-color);">
                    <div class="text-center pb-3 border-b" style="border-color: var(--border-color);">
                        <p class="text-sm" style="color: var(--text-secondary);">Monto Enviado</p>
                        <p id="success-amount" class="text-4xl font-bold"></p>
                    </div>
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">De:</span><span id="success-sender-name" class="font-semibold text-sm text-right"></span></div>
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Cuenta Origen:</span><span id="success-sender-account" class="font-semibold text-sm text-right font-mono"></span></div>
                    <hr style="border-color: var(--border-color); opacity: 0.5; border-style: dashed; margin: 1rem 0;">
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Para:</span><span id="success-recipient-name" class="font-semibold text-sm text-right"></span></div>
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Cuenta Destino:</span><span id="success-recipient-account" class="font-semibold text-sm text-right font-mono"></span></div>
                     <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Banco Destino:</span><span id="success-bank" class="font-semibold text-sm text-right"></span></div>
                    <hr style="border-color: var(--border-color); opacity: 0.5; border-style: dashed; margin: 1rem 0;">
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Concepto:</span><span id="success-concept" class="font-semibold text-sm text-right"></span></div>
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Fecha y Hora:</span><span id="success-date" class="font-semibold text-sm text-right"></span></div>
                    <div class="flex justify-between"><span class="text-sm" style="color:var(--text-secondary)">Folio:</span><span id="success-folio" class="font-semibold text-sm text-right"></span></div>
                </div>
            </div>
            <div class="w-full max-w-md pb-6 space-y-3 mt-6">
                <button id="share-receipt-btn" class="w-full font-bold py-3 px-6 rounded-lg custom-card active:scale-95 transition-transform"><i class="fas fa-share-alt mr-2"></i>Compartir Comprobante</button>
                <button id="new-transfer-btn" class="w-full font-bold py-3 px-6 rounded-lg text-white active:scale-95 transition-transform" style="background-color: var(--accent-color);">Hacer otra transferencia</button>
                <button class="w-full font-bold py-3 px-6 rounded-lg custom-card active:scale-95 transition-transform back-to-dashboard">Volver al Inicio</button>
            </div>
        </main>
    </template>
    <!-- === FIN: Plantillas para Mover Dinero === -->
    
    <!-- ***** INICIO: PLANTILLAS COMPLETAS PARA OTRAS FUNCIONES ***** -->
    <template id="services-hub-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i><h1 class="text-2xl font-bold">Servicios</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 pb-24"><div class="space-y-6"><div class="p-6 rounded-2xl cursor-pointer custom-card" data-action="pay-services"><div class="flex items-center gap-5"><div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: var(--body-bg);"><i class="fas fa-file-invoice-dollar text-2xl" style="color: var(--accent-color);"></i></div><div><h3 class="font-bold text-lg">Pagar Servicios</h3><p class="text-sm" style="color:var(--text-secondary);">Agua, luz, internet y más.</p></div></div></div><div class="p-6 rounded-2xl cursor-pointer custom-card" data-action="topups"><div class="flex items-center gap-5"><div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: var(--body-bg);"><i class="fas fa-mobile-alt text-2xl" style="color: var(--accent-color);"></i></div><div><h3 class="font-bold text-lg">Recargas Telefónicas</h3><p class="text-sm" style="color:var(--text-secondary);">Recarga tiempo aire fácil y rápido.</p></div></div></div><div class="p-6 rounded-2xl cursor-pointer custom-card" data-action="insurance"><div class="flex items-center gap-5"><div class="w-16 h-16 rounded-full flex items-center justify-center" style="background-color: var(--body-bg);"><i class="fas fa-shield-alt text-2xl" style="color: var(--accent-color);"></i></div><div><h3 class="font-bold text-lg">Contratar Seguros</h3><p class="text-sm" style="color:var(--text-secondary);">Protege tu auto, tu vida y tu hogar.</p></div></div></div></div></main>
    </template>
    <template id="pay-services-list-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-hub"></i><h1 class="text-2xl font-bold">Pagar Servicio</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 pb-24"><h3 class="font-bold mb-4">Selecciona el servicio a pagar:</h3><div class="grid grid-cols-3 sm:grid-cols-4 gap-4 text-center"><div class="service-item p-3 rounded-xl flex flex-col items-center justify-center custom-card cursor-pointer" data-service="Luz"><i class="fas fa-lightbulb block text-3xl mb-2 text-yellow-400"></i><span class="text-xs font-medium">Luz</span></div><div class="service-item p-3 rounded-xl flex flex-col items-center justify-center custom-card cursor-pointer" data-service="Agua"><i class="fas fa-tint block text-3xl mb-2 text-blue-400"></i><span class="text-xs font-medium">Agua</span></div><div class="service-item p-3 rounded-xl flex flex-col items-center justify-center custom-card cursor-pointer" data-service="Internet"><i class="fas fa-wifi block text-3xl mb-2 text-indigo-400"></i><span class="text-xs font-medium">Internet</span></div></div></main>
    </template>
    <template id="pay-service-form-template">
         <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-list"></i><h1 id="service-name" class="text-2xl font-bold"></h1><div class="w-6"></div></div></header><main class="flex-grow p-6"><form onsubmit="return false;" class="p-5 rounded-xl custom-card space-y-4"><div><label for="service-ref" class="block text-sm font-medium mb-1">Referencia</label><input type="text" id="service-ref" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);"></div><div><label for="service-amount" class="block text-sm font-medium mb-1">Monto a Pagar</label><input type="text" id="service-amount" inputmode="decimal" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);"></div><button id="pay-service-btn" class="w-full font-bold py-3 px-6 rounded-lg text-white mt-4" style="background-color:var(--accent-color);">Pagar</button></form></main>
    </template>
    <template id="topup-form-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-hub"></i><h1 class="text-2xl font-bold">Recarga Telefónica</h1><div class="w-6"></div></div></header><main class="flex-grow p-6"><form id="topup-form" onsubmit="return false;" class="p-5 rounded-xl custom-card space-y-4"><div><label for="phone-number" class="block text-sm font-medium mb-1">Número de Teléfono</label><input type="tel" id="phone-number" class="w-full p-3 rounded-lg border" placeholder="10 dígitos" style="background-color:var(--body-bg); border-color:var(--border-color);" required maxlength="10"></div><div><label for="topup-amount" class="block text-sm font-medium mb-1">Monto</label><div class="flex items-center gap-2 mt-2"><button type="button" class="quick-amount-btn flex-1 p-2 border rounded-lg" data-amount="50" style="border-color:var(--border-color);">$50</button><button type="button" class="quick-amount-btn flex-1 p-2 border rounded-lg" data-amount="100" style="border-color:var(--border-color);">$100</button><button type="button" class="quick-amount-btn flex-1 p-2 border rounded-lg" data-amount="200" style="border-color:var(--border-color);">$200</button></div></div><button id="perform-topup-btn" type="button" class="w-full font-bold py-3 px-6 rounded-lg text-white mt-4" style="background-color:var(--accent-color);">Recargar</button></form></main>
    </template>
    <template id="savings-goals-list-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i><h1 class="text-2xl font-bold">Metas de Ahorro</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 pb-24"><div id="goals-container" class="space-y-4"></div><button id="add-new-goal-btn" class="w-full font-bold py-3 px-6 rounded-lg mt-6" style="background-color:var(--card-bg); color:var(--accent-color);"><i class="fas fa-plus mr-2"></i>Crear Nueva Meta</button></main>
    </template>
    <template id="new-goal-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-goals"></i><h1 class="text-2xl font-bold">Nueva Meta</h1><div class="w-6"></div></div></header><main class="flex-grow p-6"><form onsubmit="return false;" class="p-5 rounded-xl custom-card space-y-4"><div><label for="goal-name" class="block text-sm font-medium mb-1">Nombre de la meta</label><input type="text" id="goal-name" placeholder="Ej. Viaje a la playa" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);"></div><div><label for="goal-target" class="block text-sm font-medium mb-1">Monto Objetivo</label><input type="number" id="goal-target" placeholder="Ej. 10000" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);"></div><button id="save-goal-btn" class="w-full font-bold py-3 px-6 rounded-lg text-white mt-4" style="background-color:var(--accent-color);">Guardar Meta</button></form></main>
    </template>
    <template id="add-funds-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-goals"></i><h1 id="add-funds-title" class="text-2xl font-bold">Abonar a Meta</h1><div class="w-6"></div></div></header><main class="flex-grow p-6"><form onsubmit="return false;" class="p-5 rounded-xl custom-card space-y-4"><div><label for="funds-amount" class="block text-sm font-medium mb-1">Monto a abonar</label><input type="number" id="funds-amount" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);"></div><button id="add-funds-btn" class="w-full font-bold py-3 px-6 rounded-lg text-white mt-4" style="background-color:var(--accent-color);">Abonar Dinero</button></form></main>
    </template>
    <template id="movements-screen-template">
        <header class="p-6 text-white z-10" style="background: var(--header-bg);"><div class="flex justify-between items-center"><i class="fas fa-arrow-left text-2xl cursor-pointer back-to-dashboard"></i><h1 class="text-2xl font-bold">Movimientos</h1><div class="w-6"></div></div></header><main class="flex-grow p-6 pb-24"><div id="movements-list" class="space-y-3"></div></main>
    </template>
    <!-- ***** FIN: PLANTILLAS COMPLETAS ***** -->
    
    <template id="edit-contact-modal-template">
        <div class="p-6">
            <div class="flex justify-between items-center mb-6"><h2 class="text-xl font-bold">Editar Contacto</h2><i class="fas fa-times text-xl cursor-pointer"></i></div>
            <form id="edit-contact-form" onsubmit="return false;" class="space-y-4">
                <input type="hidden" id="edit-contact-id">
                <div><label for="edit-contact-name" class="block text-sm font-medium mb-1">Nombre</label><input type="text" id="edit-contact-name" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);" required></div>
                <div><label class="block text-sm font-medium mb-1">CLABE</label><p id="edit-contact-clabe" class="w-full p-3 rounded-lg font-mono" style="background-color:var(--body-bg);"></p></div>
                <div class="flex gap-4 pt-4">
                    <button id="delete-contact-btn" type="button" class="w-1/3 font-bold py-3 px-4 rounded-lg text-red-500 custom-card active:scale-95 transition-transform">Eliminar</button>
                    <button id="update-contact-btn" type="submit" class="w-2/3 font-bold py-3 px-6 rounded-lg text-white active:scale-95 transition-transform" style="background-color:var(--accent-color);">Guardar</button>
                </div>
            </form>
        </div>
    </template>
    <template id="edit-profile-modal-template">
        <div class="p-6">
            <div class="flex justify-between items-center mb-6"><h2 class="text-xl font-bold">Información Personal</h2><i class="fas fa-times text-xl cursor-pointer"></i></div>
            <form id="edit-profile-form" onsubmit="return false;" class="space-y-4">
                <div><label for="profile-edit-name" class="block text-sm font-medium mb-1">Nombre</label><input type="text" id="profile-edit-name" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);" required></div>
                <div><label for="profile-edit-phone" class="block text-sm font-medium mb-1">Teléfono</label><input type="tel" id="profile-edit-phone" maxlength="10" class="w-full p-3 rounded-lg border" style="background-color:var(--body-bg); border-color:var(--border-color);" required></div>
                <button id="update-profile-btn" type="submit" class="w-full font-bold py-3 px-6 rounded-lg text-white mt-4 active:scale-95 transition-transform" style="background-color:var(--accent-color);">Guardar Cambios</button>
            </form>
        </div>
    </template>

    <script>
        // Pass PHP data to JavaScript
        const GMXA_USER_DATA = {
            name: '<?php echo $userName; ?>',
            initials: '<?php echo $userInitials; ?>'
        };
    </script>
    <script type="module">
        import { QRCodeCanvas } from "https://cdn.jsdelivr.net/npm/qrcode-canvas@3.0.0/dist/esm/index.js";
        window.QRCodeCanvas = QRCodeCanvas;
    </script>

    <script src="js/dashboard.js"></script>
    <script src="js/cards.js"></script>
    <script src="js/credit.js"></script>
    <script src="js/promotions.js"></script>
    <script src="js/profile.js"></script>
    <script src="js/move-money.js"></script>
    <script src="js/movements.js"></script>
    <script src="js/services.js"></script>
    <script src="js/topups.js"></script>
    <script src="js/savings-goals.js"></script>
    <script src="js/app.js"></script>
</body>
</html>
