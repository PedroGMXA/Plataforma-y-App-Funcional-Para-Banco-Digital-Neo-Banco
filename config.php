<?php
/**
 * =================================================================
 * config.php - El Corazón de la Aplicación
 * =================================================================
 * Responsabilidades:
 * 1. Definir credenciales de la base de datos.
 * 2. Crear la conexión a la base de datos ($dbh).
 * 3. Iniciar la sesión.
 *
 * NOTA: Este archivo debe estar en la carpeta raíz de tu proyecto,
 * NO dentro de la carpeta /api/.
 */

// --- 1. CONFIGURACIÓN DE LA BASE DE DATOS ---
$db_host = 'db5018598653.hosting-data.io';
$db_name = 'dbs14750809';
$db_user = 'dbu3231128';
$db_pass = 'p12ns0202'; // ¡Verifica que esta sea tu contraseña correcta!
$db_charset = 'utf8mb4';

// --- 2. OPCIONES DE CONEXIÓN (PDO) ---
// Configuración para mayor seguridad y manejo de errores.
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Lanza excepciones en errores
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Devuelve arrays asociativos
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Usa preparaciones nativas de la BD
];

// --- 3. CREACIÓN DE LA CONEXIÓN ---
$dsn = "mysql:host=$db_host;dbname=$db_name;charset=$db_charset";
try {
    // Variable de conexión que usarán todos los scripts
    $dbh = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    // Si la conexión falla, se detiene todo y se muestra un error genérico.
    http_response_code(500);
    // No se muestra el error real ($e->getMessage()) por seguridad.
    die(json_encode(['success' => false, 'message' => 'Error de conexión con el servidor.']));
}

// --- 4. INICIO DE SESIÓN ---
// Iniciar la sesión aquí asegura que esté disponible para todos los scripts
// que incluyan este archivo de configuración.
session_start();

