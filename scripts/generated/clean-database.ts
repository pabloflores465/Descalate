import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

/**
 * Script para limpiar la base de datos descalate.db
 * Elimina todos los registros de la tabla users
 */
async function cleanDatabase() {
  try {
    // La base de datos de Expo SQLite se guarda en diferentes ubicaciones según el sistema operativo
    // Para iOS Simulator: ~/Library/Developer/CoreSimulator/Devices/[DEVICE_ID]/data/Containers/Data/Application/[APP_ID]/Library/LocalDatabase/
    // Para Android Emulator: ~/.android/avd/[DEVICE_NAME].avd/data/data/[PACKAGE_NAME]/databases/

    // Intentamos encontrar la base de datos en la ubicación común de desarrollo
    const dbPath = process.argv[2] || path.join(process.cwd(), 'descalate.db');

    console.log('🔄 Conectando a la base de datos...');
    console.log('📂 Ruta:', dbPath);

    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        console.log(
          '\n💡 Uso: npx ts-node scripts/generated/clean-database.ts [ruta-a-descalate.db]'
        );
        process.exit(1);
      }
    });

    const run = promisify(db.run.bind(db));
    const get = promisify(db.get.bind(db));

    console.log('✅ Conexión establecida');

    // Eliminar todos los registros de la tabla users
    console.log('🗑️  Limpiando tabla users...');
    await run('DELETE FROM users;');

    // Verificar que la tabla está vacía
    const result = (await get('SELECT COUNT(*) as count FROM users')) as { count: number };
    console.log(`✅ Tabla users limpiada. Registros restantes: ${result.count}`);

    // Opcional: Resetear el autoincrement
    await run('DELETE FROM sqlite_sequence WHERE name="users";');
    console.log('✅ Auto-increment reseteado');

    db.close((err) => {
      if (err) {
        console.error('❌ Error cerrando la base de datos:', err.message);
      } else {
        console.log('✅ Base de datos limpiada exitosamente');
      }
    });
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    throw error;
  }
}

// Ejecutar el script
cleanDatabase()
  .then(() => {
    console.log('🎉 Script completado');
    setTimeout(() => process.exit(0), 100);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
