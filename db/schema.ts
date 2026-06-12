import { pgTable, text, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
});

export const components = pgTable('components', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: numeric('price', { precision: 15, scale: 2 }).notNull(),
});

export const productionLogs = pgTable('production_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  componentId: text('component_id').references(() => components.id),
  qty: integer('qty').notNull(),
  priceSnapshot: numeric('price_snapshot', { precision: 15, scale: 2 }).notNull(),
  total: numeric('total', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  type: text('type').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const appUsers = pgTable('app_users', {
  username: text('username').primaryKey(),
  password: text('password').notNull(),
  role: text('role').notNull(),
  employeeId: text('employee_id').references(() => employees.id),
  fullName: text('full_name'),
});
