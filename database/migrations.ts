import type * as SQLite from 'expo-sqlite';

async function addColumnIfMissing(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
) {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((existingColumn) => existingColumn.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

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
  {
    version: 2,
    up: async (db: SQLite.SQLiteDatabase) => {
      // Never recreate this table: doing so deletes every existing profile
      // during an app upgrade. These additions are intentionally tolerant so
      // fresh databases and partially migrated databases both remain valid.
      await addColumnIfMissing(db, 'users', 'age', 'INTEGER');
      await addColumnIfMissing(db, 'users', 'gender', 'TEXT');
      await addColumnIfMissing(db, 'users', 'profile_image', 'TEXT');

      await db.execAsync('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    },
  },
  {
    version: 3,
    up: async (db: SQLite.SQLiteDatabase) => {
      await addColumnIfMissing(db, 'users', 'age', 'INTEGER');
      await addColumnIfMissing(db, 'users', 'gender', 'TEXT');
    },
  },
  {
    version: 4,
    up: async (db: SQLite.SQLiteDatabase) => {
      await addColumnIfMissing(db, 'users', 'profile_image', 'TEXT');
    },
  },
  {
    version: 5,
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS anxiety_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          anxiety_level INTEGER NOT NULL,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_anxiety_logs_user_id ON anxiety_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_anxiety_logs_created_at ON anxiety_logs(created_at);
      `);
    },
  },
  {
    version: 6,
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          anxiety_level INTEGER NOT NULL,
          selected_exercises TEXT,
          tip_id INTEGER,
          tip_title TEXT,
          tip_category TEXT,
          final_action TEXT,
          duration_seconds INTEGER,
          completed_at TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
        CREATE INDEX IF NOT EXISTS idx_sessions_anxiety_level ON sessions(anxiety_level);
      `);
    },
  },
  {
    version: 7,
    up: async (db: SQLite.SQLiteDatabase) => {
      await addColumnIfMissing(db, 'users', 'onboarding_completed', 'INTEGER NOT NULL DEFAULT 0');
      await addColumnIfMissing(db, 'users', 'profile_completed', 'INTEGER NOT NULL DEFAULT 0');
      await addColumnIfMissing(db, 'users', 'tutorial_completed', 'INTEGER NOT NULL DEFAULT 0');

      // Users from versions prior to v7 already passed the introductory
      // screens. A non-empty name is reliable evidence of a saved profile.
      await db.execAsync(`
        UPDATE users
        SET onboarding_completed = 1,
            profile_completed = CASE
              WHEN name IS NOT NULL AND TRIM(name) <> '' THEN 1
              ELSE profile_completed
            END
      `);
    },
  },
  {
    version: 8,
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS active_sessions (
          user_id INTEGER PRIMARY KEY,
          anxiety_level INTEGER NOT NULL,
          selected_exercises TEXT,
          tip_id INTEGER,
          tip_title TEXT,
          tip_category TEXT,
          start_time INTEGER NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    },
  },
];

async function getCurrentVersion(db: SQLite.SQLiteDatabase): Promise<number> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS migrations (
      version INTEGER PRIMARY KEY
    );
  `);

  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) as version FROM migrations'
  );

  return result?.version || 0;
}

async function setVersion(db: SQLite.SQLiteDatabase, version: number) {
  await db.runAsync('INSERT INTO migrations (version) VALUES (?)', [version]);
}

export async function runMigrations(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON');
  await db.execAsync('PRAGMA journal_mode = WAL');

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
