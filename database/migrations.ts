import * as SQLite from 'expo-sqlite';

const MIGRATIONS = [
  {
    version: 1,
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          name TEXT,
          picture TEXT,
          google_id TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      `);
    },
  },
];

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY
      );
    `);

    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT MAX(version) as version FROM migrations'
    );

    return result?.version || 0;
  } catch (error) {
    console.error('Error getting current version:', error);
    return 0;
  }
}

async function setVersion(db: SQLite.SQLiteDatabase, version: number) {
  await db.runAsync('INSERT INTO migrations (version) VALUES (?)', [version]);
}

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  const currentVersion = await getCurrentVersion(db);
  console.log(`Current database version: ${currentVersion}`);

  const pendingMigrations = MIGRATIONS.filter((m) => m.version > currentVersion);

  if (pendingMigrations.length === 0) {
    console.log('Database is up to date');
    return;
  }

  console.log(`Running ${pendingMigrations.length} migrations...`);

  for (const migration of pendingMigrations) {
    try {
      console.log(`Running migration ${migration.version}...`);
      await migration.up(db);
      await setVersion(db, migration.version);
      console.log(`Migration ${migration.version} completed`);
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error);
      throw error;
    }
  }

  console.log('All migrations completed successfully');
}
