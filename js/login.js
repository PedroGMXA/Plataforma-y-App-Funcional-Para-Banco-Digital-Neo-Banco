/**
 * =================================================================
 * login.js - Lógica para el formulario de inicio de sesión
 * =================================================================
 * Este script maneja el envío del formulario de login.html,
 * llama a la API de autenticación y gestiona la respuesta sin
 * recargar la página.
 */
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const feedbackDiv = document.getElementById('login-feedback');
    const submitButton = loginForm.querySelector('button[type="submit"]');

    if (!loginForm) {
        console.error('El formulario de login no fue encontrado.');
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        // 1. Prevenir el envío tradicional del formulario que recarga la página
        e.preventDefault(); 

        // 2. Desactivar el botón y mostrar estado de carga para feedback visual
        submitButton.disabled = true;
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Verificando...`;
        
        // Limpiar mensajes de error anteriores
        feedbackDiv.innerHTML = '';

        try {
            // 3. Crear los datos del formulario para enviar a la API
            const formData = new FormData(loginForm);

            // 4. Realizar la petición a la API de autenticación
            const response = await fetch('api/auth.php', {
                method: 'POST',
                body: formData
            });

            // 5. Convertir la respuesta de la API a formato JSON
            const result = await response.json();

            // 6. Gestionar la respuesta
            if (result.success) {
                // Éxito: Mostrar un mensaje de éxito y redirigir al dashboard
                feedbackDiv.innerHTML = `<p class="text-green-500 text-sm">${result.data.message || 'Éxito. Redirigiendo...'}</p>`;
                setTimeout(() => {
                    window.location.href = 'dashboard.php';
                }, 1000); // Pequeña demora para que el usuario vea el mensaje

            } else {
                // Error: Mostrar el mensaje de error que devuelve la API
                feedbackDiv.innerHTML = `<p class="text-red-500 text-sm">${result.message || 'Ocurrió un error inesperado.'}</p>`;
            }

        } catch (error) {
            // Error de red o si la respuesta no es un JSON válido
            console.error('Error en el proceso de login:', error);
            feedbackDiv.innerHTML = `<p class="text-red-500 text-sm">No se pudo conectar con el servidor.</p>`;
        } finally {
            // 7. Reactivar el botón, excepto si la redirección ya está en marcha
            if (!feedbackDiv.querySelector('.text-green-500')) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            }
        }
    });
});

