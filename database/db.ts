import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const expoDb = openDatabaseSync('descalate.db');
export const db = drizzle(expoDb, { schema });

export async function resetDatabase() {
  try {
    await expoDb.execAsync(`
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS anxiety_logs;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS migrations;
    `);
    console.log('Database tables dropped successfully');

    const { runMigrations } = await import('./migrations');
    await runMigrations(expoDb);
    console.log('Migrations re-run successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}
