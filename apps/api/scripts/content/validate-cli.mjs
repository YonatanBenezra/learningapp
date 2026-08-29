#!/usr/bin/env node
import { validateAllExercises } from './validate.mjs';

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

console.log(`\n${report.length} exercises checked, ${failures.length} failed`);

if (failures.length > 0) {
  process.exitCode = 1;
}
