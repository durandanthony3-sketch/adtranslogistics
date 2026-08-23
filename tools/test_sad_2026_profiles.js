#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, 'sad_2026_profiles.js'), 'utf8'), context);

const meta = context.window.SAD_2026_META;
const groups = context.window.SAD_2026_PROFILES;
assert(meta && groups, 'generated SAD data must expose metadata and profiles');
assert.strictEqual(meta.acceptedObservations, 424);
assert.strictEqual(meta.vehicleYearProfiles, 244);
assert.strictEqual(Object.keys(groups).length, meta.vehicleYearProfiles);

const rates = { A: 0.20, B: 0.20, C: 0.10, D: 0.05 };
function liquidate(caf, category) {
  const base = 0.70 * caf;
  const dd = Math.round(base * rates[category]);
  const community = Math.round(base * 0.03);
  const vatBase = base * (1 + rates[category] + 0.03);
  const vat = Math.round(vatBase * 0.18);
  const excise = category === 'A' ? Math.round(vatBase * 0.10) : 0;
  return dd + community + vat + excise + 98600;
}

let observations = 0;
for (const [key, group] of Object.entries(groups)) {
  assert(/^.+\|.+\|(19|20)\d{2}$/.test(key), `invalid profile key: ${key}`);
  assert(group.profiles.length >= 1, `${key} has no public profile`);
  assert.strictEqual(group.defaultId, group.profiles[0].id, `${key} must default to the prudent profile`);
  assert.strictEqual(
    group.profiles[0].officialTaxes,
    Math.max(...group.profiles.map((profile) => profile.officialTaxes)),
    `${key} default is not the highest observed liquidation`
  );
  for (const profile of group.profiles) {
    assert(['A', 'B', 'C', 'D'].includes(profile.cat), `${key} has an invalid category`);
    assert(profile.useOfficialCaf === true && profile.officialCaf > 0 && profile.officialTaxes > 0);
    assert(
      Math.abs(liquidate(profile.officialCaf, profile.cat) - profile.officialTaxes) <= meta.formulaToleranceXof,
      `${key}/${profile.id} is outside the accepted formula tolerance`
    );
    assert(!('declaration' in profile) && !('liquidationDate' in profile), `${key} leaks dossier metadata`);
    observations += profile.observedCount;
  }
}
assert.strictEqual(observations, meta.acceptedObservations);

const rav2013 = groups['TOYOTA|RAV4|2013'];
assert(rav2013, 'Toyota RAV4 2013 observed profile is missing');
assert.strictEqual(rav2013.profiles[0].officialTaxes, 2410275);
assert.strictEqual(rav2013.profiles.reduce((sum, profile) => sum + profile.observedCount, 0), 7);
assert(!groups['HYUNDAI|TUCSON|2017'], 'special-regime Tucson 2017 must stay excluded');
assert(!groups['TOYOTA|FORTUNER|2024'], 'special-regime Fortuner 2024 must stay excluded');

console.log(`SAD 2026 profiles OK: ${observations} observations, ${Object.keys(groups).length} vehicle-year groups.`);
