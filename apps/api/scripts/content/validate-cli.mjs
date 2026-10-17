#!/usr/bin/env node
import { validateAllExercises } from './validate.mjs';
import { validateCore15Collection } from './validate-core-15.mjs';

const core15Errors = await validateCore15Collection();
if (core15Errors.length === 0) {
  console.log('OK  core-15 collection');
} else {
  console.error('FAIL core-15 collection');
  for (const error of core15Errors) {
    console.error(`  - ${error}`);
  }
}

const report = await validateAllExercises();
const failures = report.filter((row) => row.errors.length > 0);

for (const row of report) {
  if (row.errors.length === 0) {
    console.log(`OK  ${row.slug}`);
  } else {
    console.error(`FAIL ${row.slug}`);
    for (const error of row.errors) {
      console.error(`  - ${error}`);
    }
  }
}

const exerciseRows = report.filter((row) => row.slug !== 'published-slugs.json');
console.log(`\n${exerciseRows.length} exercises checked, ${failures.length} failed`);

if (failures.length > 0 || core15Errors.length > 0) {
  process.exitCode = 1;
}
