import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password'),
  name: text('name'),
  picture: text('picture'),
  google_id: text('google_id'),
  age: integer('age'),
  gender: text('gender'),
  profile_image: blob('profile_image', { mode: 'buffer' }),
  created_at: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const registerUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().nullable().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const googleUserSchema = insertUserSchema.pick({
  email: true,
  name: true,
  picture: true,
  google_id: true,
});

export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  created_at: true,
});

export type User = {
  id: number;
  email: string;
  password: string | null;
  name: string | null;
  picture: string | null;
  google_id: string | null;
  age: number | null;
  gender: string | null;
  profile_image: Buffer | null;
  created_at: string;
};

export type NewUser = Omit<User, 'id' | 'created_at'>;
export type RegisterUser = {
  email: string;
  password: string;
  name?: string | null;
};
export type LoginUser = {
  email: string;
  password: string;
};
export type GoogleUser = Pick<NewUser, 'email' | 'name' | 'picture' | 'google_id'>;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'created_at'>>;

export const anxietyLogs = sqliteTable('anxiety_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull().references(() => users.id),
  anxiety_level: integer('anxiety_level').notNull(),
  notes: text('notes'),
  created_at: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const selectAnxietyLogSchema = createSelectSchema(anxietyLogs);
export const insertAnxietyLogSchema = createInsertSchema(anxietyLogs);

export type AnxietyLog = {
  id: number;
  user_id: number;
  anxiety_level: number;
  notes: string | null;
  created_at: string;
};

export type NewAnxietyLog = Omit<AnxietyLog, 'id' | 'created_at'>;
