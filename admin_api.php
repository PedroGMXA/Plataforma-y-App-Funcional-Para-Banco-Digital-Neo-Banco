<?php
session_start();
header('Content-Type: application/json');

// Incluir configuración de la base de datos
require_once '../config.php';

// --- Verificación de seguridad ---
// Solo administradores pueden acceder a esta API.
if (!isset($_SESSION['loggedin']) || $_SESSION['user_role'] !== 'admin') {
    http_response_code(403); // Forbidden
    echo json_encode(['success' => false, 'message' => 'Acceso denegado.']);
    exit;
}

// Función para enviar respuestas JSON estandarizadas
function json_response($success, $message, $data = null) {
    $response = ['success' => $success, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    echo json_encode($response);
    exit;
}

$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true);

try {
    switch ($action) {
        case 'list_users':
            $stmt = $dbh->query("SELECT id, nombre, email, rol FROM usuarios ORDER BY id DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            json_response(true, 'Usuarios obtenidos correctamente.', $users);
            break;

        case 'get_user':
            $id = $_GET['id'] ?? 0;
            $stmt = $dbh->prepare("SELECT id, nombre, email, rol FROM usuarios WHERE id = ?");
            $stmt->execute([$id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                json_response(true, 'Usuario obtenido.', $user);
            } else {
                json_response(false, 'Usuario no encontrado.');
            }
            break;

        case 'create_user':
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $rol = $input['rol'] ?? 'cliente';

            if (empty($nombre) || empty($email) || empty($password)) {
                json_response(false, 'Nombre, email y contraseña son obligatorios.');
            }

            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $dbh->prepare("INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)");
            if ($stmt->execute([$nombre, $email, $hashed_password, $rol])) {
                json_response(true, 'Usuario creado exitosamente.');
            } else {
                json_response(false, 'Error al crear el usuario.');
            }
            break;

        case 'update_user':
            $id = $input['id'] ?? 0;
            $nombre = $input['nombre'] ?? '';
            $email = $input['email'] ?? '';
            $password = $input['password'] ?? '';
            $rol = $input['rol'] ?? 'cliente';

            if (empty($id) || empty($nombre) || empty($email)) {
                json_response(false, 'ID, nombre y email son obligatorios.');
            }

            if (!empty($password)) {
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                $stmt = $dbh->prepare("UPDATE usuarios SET nombre = ?, email = ?, password = ?, rol = ? WHERE id = ?");
                $stmt->execute([$nombre, $email, $hashed_password, $rol, $id]);
            } else {
                $stmt = $dbh->prepare("UPDATE usuarios SET nombre = ?, email = ?, rol = ? WHERE id = ?");
                $stmt->execute([$nombre, $email, $rol, $id]);
            }
            
            json_response(true, 'Usuario actualizado correctamente.');
            break;

        case 'delete_user':
            $id = $input['id'] ?? 0;
            if (empty($id)) {
                json_response(false, 'Se requiere un ID de usuario.');
            }
            $stmt = $dbh->prepare("DELETE FROM usuarios WHERE id = ?");
            if ($stmt->execute([$id])) {
                json_response(true, 'Usuario eliminado exitosamente.');
            } else {
                json_response(false, 'Error al eliminar el usuario.');
            }
            break;

        default:
            json_response(false, 'Acción no válida.');
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    json_response(false, 'Error en la base de datos: ' . $e->getMessage());
}

