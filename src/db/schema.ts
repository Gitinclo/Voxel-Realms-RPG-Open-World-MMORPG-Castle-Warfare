/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

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
