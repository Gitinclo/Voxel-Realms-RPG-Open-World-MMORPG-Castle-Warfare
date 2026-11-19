/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { relations } from 'drizzle-orm';
import { integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull().default('Sovereign Vanguard'),
  role: text('role').notNull().default('player'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const commanderProfiles = pgTable('commander_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  commanderName: text('commander_name').notNull().default('Sovereign Vanguard'),
  allianceTag: text('alliance_tag').notNull().default('SOL'),
  castleLevel: integer('castle_level').notNull().default(1),
  cultivationRealmIndex: integer('cultivation_realm_index').notNull().default(0),
  vipTier: integer('vip_tier').notNull().default(0),
  karma: integer('karma').notNull().default(0),
  garrisonTroopsWire: text('garrison_troops_wire').notNull().default('0'),
  discoveredCodexCount: integer('discovered_codex_count').notNull().default(0),
  preferredRegion: text('preferred_region').notNull().default('us-east-solara-1'),
  activeSector: text('active_sector').notNull().default('B2'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const realmSaves = pgTable('realm_saves', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull()
    .unique(),
  snapshotJson: text('snapshot_json').notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  category: text('category').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('open'),
  createdAt: timestamp('created_at').defaultNow(),
});

/**
 * Authoritative commander economy state stored in PostgreSQL with optimistic concurrency `version`
 * and row-level locking (`SELECT ... FOR UPDATE`) for multi-instance deployments.
 */
export const economyAccounts = pgTable('economy_accounts', {
  id: serial('id').primaryKey(),
  commanderId: text('commander_id').notNull().unique(),
  castleLevel: integer('castle_level').notNull().default(1),
  balancesJson: jsonb('balances_json').$type<Record<string, string>>().notNull(),
  troopsJson: jsonb('troops_json').$type<Record<string, Record<number, number>>>().notNull(),
  totalTaxCollectedWire: text('total_tax_collected_wire').notNull().default('0'),
  lastActionClaimJson: jsonb('last_action_claim_json').$type<Record<string, number>>().notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

/**
 * Append-only SHA-256 hash-chained ledger entries with a database-enforced
 * UNIQUE (commander_id, idempotency_key) constraint preventing duplicate mint/spend races.
 */
export const economyLedgerEntries = pgTable(
  'economy_ledger_entries',
  {
    id: serial('id').primaryKey(),
    commanderId: text('commander_id')
      .references(() => economyAccounts.commanderId)
      .notNull(),
    seq: integer('seq').notNull(),
    txId: text('tx_id').notNull().unique(),
    eventId: text('event_id').notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    resource: text('resource').notNull(),
    direction: text('direction').notNull(),
    amountWire: text('amount_wire').notNull(),
    balanceAfterWire: text('balance_after_wire').notNull(),
    reason: text('reason').notNull(),
    prevHash: text('prev_hash').notNull(),
    entryHash: text('entry_hash').notNull(),
    createdAtIso: text('created_at_iso').notNull(),
  },
  (table) => [
    uniqueIndex('economy_ledger_cmdr_idem_uidx').on(table.commanderId, table.idempotencyKey),
  ]
);

/**
 * Authoritative multi-region realm sector snapshots for crash-safe externalized persistence.
 */
export const realmSnapshots = pgTable('realm_snapshots', {
  id: serial('id').primaryKey(),
  clusterId: text('cluster_id').notNull(),
  sectorCode: text('sector_code').notNull().unique(),
  snapshotJson: jsonb('snapshot_json').$type<Record<string, unknown>>().notNull(),
  checksumSha256: text('checksum_sha256').notNull(),
  version: integer('version').notNull().default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  commanderProfile: one(commanderProfiles, {
    fields: [users.id],
    references: [commanderProfiles.userId],
  }),
  realmSave: one(realmSaves, {
    fields: [users.id],
    references: [realmSaves.userId],
  }),
  supportTickets: many(supportTickets),
}));

export const commanderProfilesRelations = relations(commanderProfiles, ({ one }) => ({
  owner: one(users, {
    fields: [commanderProfiles.userId],
    references: [users.id],
  }),
}));

export const realmSavesRelations = relations(realmSaves, ({ one }) => ({
  owner: one(users, {
    fields: [realmSaves.userId],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  author: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
}));

export const economyAccountsRelations = relations(economyAccounts, ({ many }) => ({
  ledgerEntries: many(economyLedgerEntries),
}));

export const economyLedgerEntriesRelations = relations(economyLedgerEntries, ({ one }) => ({
  account: one(economyAccounts, {
    fields: [economyLedgerEntries.commanderId],
    references: [economyAccounts.commanderId],
  }),
}));
