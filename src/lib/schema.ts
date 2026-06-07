import { pgTable, uuid, text, integer, real, date, timestamp, boolean } from 'drizzle-orm/pg-core';

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  room: text('room').notNull(),
  type: text('type', { enum: ['individual', 'shop'] }).notNull(),
  sweepingRole: text('sweeping_role', { enum: ['pay', 'sweep'] }),
  lightBillAmount: integer('light_bill_amount'),   // per-member override (NULL = use default)
  phone: text('phone'),
  altContact: text('alt_contact'),
  notes: text('notes'),                             // admin-only notes
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const lightBillPayments = pgTable('light_bill_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  period: text('period').notNull(),
  amount: integer('amount').notNull(),
  datePaid: date('date_paid').notNull(),
  method: text('method'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sweepingPayments = pgTable('sweeping_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  period: text('period').notNull(),
  amount: integer('amount'),
  datePaid: date('date_paid'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const environmentalPayments = pgTable('environmental_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: uuid('member_id').references(() => members.id).notNull(),
  period: text('period').notNull(),
  amount: integer('amount').notNull(),
  datePaid: date('date_paid').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Electricity: one table for every observation, fully decoupled
export const electricityObservations = pgTable('electricity_observations', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type', { enum: ['meter_reading', 'units_remaining', 'current_load', 'topup'] }).notNull(),
  value: real('value').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Old tables removed — all observation data lives in electricity_observations

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
