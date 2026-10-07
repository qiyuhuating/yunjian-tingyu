import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
export const phoneStates=sqliteTable('phone_states',{userId:text('user_id').primaryKey(),state:text('state').notNull(),version:integer('version').notNull().default(0),updatedAt:integer('updated_at').notNull()});
export const rateWindows=sqliteTable('rate_windows',{userId:text('user_id').primaryKey(),window:integer('window').notNull(),count:integer('count').notNull()});
export const aiKeys=sqliteTable('ai_keys',{userId:text('user_id').primaryKey(),ciphertext:text('ciphertext').notNull()});
export const assets=sqliteTable('assets',{id:text('id').primaryKey(),userId:text('user_id').notNull(),mime:text('mime').notNull(),size:integer('size').notNull(),name:text('name').notNull()},t=>[index('idx_assets_user').on(t.userId)]);
