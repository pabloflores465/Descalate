import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  password: text('password'),
  name: text('name'),
  picture: text('picture'),
  google_id: text('google_id'),
  created_at: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
});

export const selectUserSchema = createSelectSchema(users);
export const insertUserSchema = createInsertSchema(users);

export const registerUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
  name: true,
});

export const loginUserSchema = insertUserSchema.pick({
  email: true,
  password: true,
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
  created_at: string;
};

export type NewUser = Omit<User, 'id' | 'created_at'>;
export type RegisterUser = Pick<NewUser, 'email' | 'password' | 'name'>;
export type LoginUser = Pick<NewUser, 'email' | 'password'>;
export type GoogleUser = Pick<NewUser, 'email' | 'name' | 'picture' | 'google_id'>;
export type UpdateUser = Partial<Omit<NewUser, 'id' | 'created_at'>>;
