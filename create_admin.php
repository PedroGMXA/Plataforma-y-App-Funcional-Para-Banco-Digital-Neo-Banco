<?php
// =================================================================
// create_admin.php - Script Temporal para Crear Usuario Administrador
// ADVERTENCIA: ¡Eliminar este archivo inmediatamente después de usarlo!
// =================================================================

$message = '';

// El script solo se ejecuta cuando se envía el formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Incluir la configuración de la base de datos desde la raíz
    require_once 'config.php'; 

    // --- Obtener datos del formulario ---
    $admin_username = $_POST['username'] ?? '';
    $admin_email = $_POST['email'] ?? '';
    $admin_password_plain = $_POST['password'] ?? '';

    if (empty($admin_username) || empty($admin_email) || empty($admin_password_plain)) {
        $message = '<p style="color: red;">Todos los campos son obligatorios.</p>';
    } else {
        try {
            // CORRECCIÓN: Se cambió "name" por "nombre" para que coincida con la base de datos.
            $stmt = $dbh->prepare("SELECT id FROM usuarios WHERE email = ? OR nombre = ?"); 
            $stmt->execute([$admin_email, $admin_username]);

            if ($stmt->fetch()) {
                $message = '<p style="color: orange;">El nombre de usuario o el correo electrónico ya existen. No se creó ningún usuario.</p>';
            } else {
                // Hashear la contraseña para almacenamiento seguro
                $password_hash = password_hash($admin_password_plain, PASSWORD_DEFAULT);
                
                // CORRECCIÓN: Se ajustó la consulta para que coincida con las columnas reales de la tabla 'usuarios'.
                $sql = "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)";
                $stmt = $dbh->prepare($sql);
                
                $role = 'admin';

                // Ejecutar la sentencia
                if ($stmt->execute([$admin_username, $admin_email, $password_hash, $role])) {
                     $message = '
                        <div style="background-color: #d4edda; color: #155724; padding: 20px; border-radius: 5px; border: 1px solid #c3e6cb;">
                            <h2 style="margin-top: 0;">¡Administrador Creado!</h2>
                            <p>El usuario <strong>'.htmlspecialchars($admin_username).'</strong> ha sido creado exitosamente.</p>
                            <p style="font-weight: bold; color: #c0392b; margin-top: 15px;">ACCIÓN CRÍTICA: ¡BORRA ESTE ARCHIVO (`create_admin.php`) AHORA!</p>
                        </div>';
                } else {
                    $message = '<p style="color: red;">Error: No se pudo crear el usuario administrador en la base de datos.</p>';
                }
            }
        } catch (PDOException $e) {
            $message = '<p style="color: red;">Error de Conexión: ' . $e->getMessage() . '</p>';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Crear Usuario Administrador</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-200 flex items-center justify-center min-h-screen">
    <div class="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 class="text-2xl font-bold text-center text-gray-800 mb-4">Crear Administrador</h1>
        <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
            <p class="font-bold">¡Atención! Script de Alto Riesgo</p>
            <p>Este formulario crea un usuario administrador. Debes eliminar este archivo de tu servidor inmediatamente después de usarlo.</p>
        </div>

        <?php if (!empty($message)) echo "<div class='mb-4'>{$message}</div>"; ?>

        <form action="create_admin.php" method="POST" class="space-y-4">
            <div>
                <label for="username" class="block font-medium">Nombre de Usuario:</label>
                <input type="text" id="username" name="username" required class="w-full px-4 py-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500" value="admin">
            </div>
             <div>
                <label for="email" class="block font-medium">Correo Electrónico:</label>
                <input type="email" id="email" name="email" required class="w-full px-4 py-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500" value="admin@gmxa.com">
            </div>
            <div>
                <label for="password" class="block font-medium">Contraseña:</label>
                <input type="password" id="password" name="password" required class="w-full px-4 py-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500">
            </div>
            <button type="submit" class="w-full font-bold py-3 px-6 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition">
                Crear Administrador
            </button>
        </form>
    </div>
</body>
</html>

