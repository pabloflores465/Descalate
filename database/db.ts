import * as SQLite from 'expo-sqlite';

// Singleton: Una sola instancia de la base de datos
let db: SQLite.SQLiteDatabase | null = null;

/**
 * Inicializar base de datos
 */
export async function initDatabase() {
  if (db) return db; // Si ya existe, retornarla

  console.log('🔵 Inicializando base de datos...');

  db = await SQLite.openDatabaseAsync('descalate.db');

  // Crear tabla de usuarios con constraints de seguridad
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `);

  console.log('✅ Base de datos inicializada');
  return db;
}

/**
 * Obtener instancia de la base de datos
 */
export function getDatabase() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initDatabase() primero.');
  }
  return db;
}

/**
 * Hash simple de contraseña (para desarrollo)
 * IMPORTANTE: En producción usa expo-crypto con:
 * npx expo install expo-crypto
 */
async function hashPassword(password: string): Promise<string> {
  // Simple hash para desarrollo
  // TODO: Instalar expo-crypto para producción
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `hash_${hash.toString(16)}`;
}

/**
 * Registrar nuevo usuario (SEGURO - usa parámetros preparados)
 */
export async function registerUser(email: string, password: string) {
  const database = getDatabase();

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos' };
  }

  if (password.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  try {
    const passwordHash = await hashPassword(password);

    // ✅ SEGURO: Usa parámetros preparados (?)
    const result = await database.runAsync(
      'INSERT INTO users (email, password_hash) VALUES (?, ?)',
      email.toLowerCase().trim(),
      passwordHash
    );

    console.log('✅ Usuario registrado:', email);
    return {
      success: true,
      userId: result.lastInsertRowId,
    };
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return { success: false, error: 'Este email ya está registrado' };
    }
    console.error('❌ Error al registrar:', error);
    return { success: false, error: 'Error al registrar usuario' };
  }
}

/**
 * Login de usuario (SEGURO - usa parámetros preparados)
 */
export async function loginUser(email: string, password: string) {
  const database = getDatabase();

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos' };
  }

  try {
    const passwordHash = await hashPassword(password);

    // ✅ SEGURO: Usa parámetros preparados (?)
    const user = await database.getFirstAsync<{
      id: number;
      email: string;
      created_at: number;
    }>(
      'SELECT id, email, created_at FROM users WHERE email = ? AND password_hash = ?',
      email.toLowerCase().trim(),
      passwordHash
    );

    if (user) {
      console.log('✅ Login exitoso:', email);
      return { success: true, user };
    } else {
      console.log('❌ Credenciales incorrectas');
      return { success: false, error: 'Email o contraseña incorrectos' };
    }
  } catch (error) {
    console.error('❌ Error al hacer login:', error);
    return { success: false, error: 'Error al iniciar sesión' };
  }
}

/**
 * Verificar si un email existe
 */
export async function emailExists(email: string): Promise<boolean> {
  const database = getDatabase();

  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM users WHERE email = ?',
    email.toLowerCase().trim()
  );

  return (result?.count || 0) > 0;
}

/**
 * Obtener todos los usuarios (solo para desarrollo/debug)
 */
export async function getAllUsers() {
  const database = getDatabase();

  // ✅ No retorna las contraseñas
  const users = await database.getAllAsync<{
    id: number;
    email: string;
    created_at: number;
  }>('SELECT id, email, created_at FROM users');

  return users;
}

/**
 * Eliminar usuario (para testing)
 */
export async function deleteUser(email: string) {
  const database = getDatabase();

  await database.runAsync('DELETE FROM users WHERE email = ?', email.toLowerCase().trim());

  console.log('🗑️ Usuario eliminado:', email);
}

/**
 * Limpiar toda la base de datos (solo para desarrollo)
 */
export async function clearDatabase() {
  const database = getDatabase();

  await database.execAsync('DELETE FROM users');
  console.log('🗑️ Base de datos limpiada');
}
