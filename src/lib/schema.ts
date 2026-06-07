import { pgTable, uuid, text, integer, real, date, timestamp, boolean } from 'drizzle-orm/pg-core';

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  room: text('room').notNull(),
  type: text('type', { enum: ['individual', 'shop'] }).notNull(),
  sweepingRole: text('sweeping_role', { enum: ['pay', 'sweep'] }),
  phone: text('phone'),
  altContact: text('alt_contact'),
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

// Electricity: Top-ups (when you buy units)
export const electricityTopups = pgTable('electricity_topups', {
  id: uuid('id').defaultRandom().primaryKey(),
  amountNaira: integer('amount_naira').notNull(),
  unitsKwh: real('units_kwh').notNull(),
  rateUsed: real('rate_used').notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Electricity: Meter observations (two independent screens)
export const electricityReadings = pgTable('electricity_readings', {
  id: uuid('id').defaultRandom().primaryKey(),
  meterReading: real('meter_reading'),          // screen 1: cumulative kWh
  readingTime: timestamp('reading_time'),        // when screen 1 was observed
  unitsRemaining: real('units_remaining'),       // screen 2: kWh remaining
  remainingTime: timestamp('remaining_time'),    // when screen 2 was observed
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Keep old table reference for migration compatibility
export const electricityUsage = pgTable('electricity_usage', {
  id: uuid('id').defaultRandom().primaryKey(),
  date: date('date').notNull(),
  meterReading: integer('meter_reading').notNull(),
  unitsUsed: integer('units_used').notNull(),
  bought: integer('bought').notNull(),
  remaining: integer('remaining').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
