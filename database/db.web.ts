// Web stub for expo-sqlite — used only for web preview builds.
// expo-sqlite does not support web; this file prevents crashes so the UI can be previewed.

import * as schema from './schema';

const noop = () => Promise.resolve();

const stubQuery = {
  all: () => [],
  get: () => undefined,
  run: noop,
  values: () => [],
};

export const expoDb = {
  execAsync: noop,
  runAsync: noop,
  getAllAsync: () => Promise.resolve([]),
  getFirstAsync: () => Promise.resolve(null),
  closeAsync: noop,
  withTransactionAsync: async (fn: () => Promise<void>) => fn(),
} as unknown as import('expo-sqlite').SQLiteDatabase;

export const db = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([]) }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  delete: () => ({ where: () => Promise.resolve([]) }),
  query: Object.fromEntries(
    Object.keys(schema).map((k) => [k, { findFirst: () => Promise.resolve(null), findMany: () => Promise.resolve([]) }])
  ),
} as unknown as import('drizzle-orm/expo-sqlite').ExpoSQLiteDatabase<typeof schema>;

export async function resetDatabase() {
  // no-op on web
}
