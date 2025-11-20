import * as SQLite from 'expo-sqlite';
import { runMigrations } from '../database/migrations';

async function main() {
  try {
    console.log('Opening database...');
    const db = await SQLite.openDatabaseAsync('descalate.db');

    console.log('Running migrations...');
    await runMigrations(db);

    console.log('Migrations completed successfully!');

    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM migrations'
    );

    console.log(`Current database version: ${result?.version || 0}`);

    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );

    console.log('\nAvailable tables:');
    tables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    const anxietyLogsCount = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM anxiety_logs'
    );

    console.log(`\nAnxiety logs in database: ${anxietyLogsCount?.count || 0}`);

  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

main();
