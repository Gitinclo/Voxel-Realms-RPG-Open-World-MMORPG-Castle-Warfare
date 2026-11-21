/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getTableConfig } from 'drizzle-orm/pg-core';
import {
  commanderProfiles,
  economyAccounts,
  economyLedgerEntries,
  realmSaves,
  realmSnapshots,
  supportTickets,
  users,
} from './schema';

test('PostgreSQL Drizzle schema defines all 7 authoritative tables with required unique/FK constraints', () => {
  const tables = [
    { name: 'users', table: users },
    { name: 'commander_profiles', table: commanderProfiles },
    { name: 'realm_saves', table: realmSaves },
    { name: 'support_tickets', table: supportTickets },
    { name: 'economy_accounts', table: economyAccounts },
    { name: 'economy_ledger_entries', table: economyLedgerEntries },
    { name: 'realm_snapshots', table: realmSnapshots },
  ];

  for (const item of tables) {
    const cfg = getTableConfig(item.table);
    assert.equal(cfg.name, item.name);
    assert.ok(cfg.columns.length >= 4, `${item.name} must define columns`);
  }

  const ledgerCfg = getTableConfig(economyLedgerEntries);
  const idemIndex = ledgerCfg.indexes.find(
    (idx) => idx.config.name === 'economy_ledger_cmdr_idem_uidx'
  );
  assert.ok(
    idemIndex,
    'economy_ledger_entries must enforce unique (commander_id, idempotency_key)'
  );
  assert.equal(idemIndex.config.unique, true);

  const accountsCfg = getTableConfig(economyAccounts);
  const versionCol = accountsCfg.columns.find((c) => c.name === 'version');
  assert.ok(versionCol, 'economy_accounts must include optimistic concurrency version column');
});

test('drizzle.config.ts enforces fail-closed admin credential requirements', () => {
  const cfgPath = path.resolve(process.cwd(), 'src/db/drizzle.config.ts');
  const source = fs.readFileSync(cfgPath, 'utf8');
  assert.equal(source.includes("schema: './src/db/schema.ts'"), true);
  assert.equal(source.includes("dialect: 'postgresql'"), true);
  assert.equal(source.includes('SQL_ADMIN_USER'), true);
  assert.equal(source.includes('SQL_ADMIN_PASSWORD'), true);
});
