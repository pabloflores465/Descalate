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
  {
    version: 2,
    up: async (db: SQLite.SQLiteDatabase) => {
      await db.execAsync(`
        DROP TABLE IF EXISTS users;
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT,
          name TEXT,
          picture TEXT,
          google_id TEXT,
          age INTEGER,
          gender TEXT,
          profile_image TEXT,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_users_email ON users(email);
      `);
    },
  },
  {
    version: 3,
    up: async (db: SQLite.SQLiteDatabase) => {
      try {
        await db.execAsync(`
          ALTER TABLE users ADD COLUMN age INTEGER;
        `);
        console.log('Migration v3: age column added successfully');
      } catch (error) {
        console.log('Migration v3: age column might already exist, skipping...');
      }
      try {
        await db.execAsync(`
          ALTER TABLE users ADD COLUMN gender TEXT;
        `);
        console.log('Migration v3: gender column added successfully');
      } catch (error) {
        console.log('Migration v3: gender column might already exist, skipping...');
      }
    },
  },
  {
    version: 4,
    up: async (db: SQLite.SQLiteDatabase) => {
      try {
        await db.execAsync(`
          ALTER TABLE users ADD COLUMN profile_image TEXT;
        `);
        console.log('Migration v4: profile_image column added successfully');
      } catch (error) {
        console.log('Migration v4: Column might already exist, skipping...', error);
      }
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
