#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testDir = __dirname;
const testFiles = fs.readdirSync(testDir)
  .filter(f => f.startsWith('test-') && f.endsWith('.js'))
  .sort();

let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

console.log('🧪 Running tests...\n');

testFiles.forEach(file => {
  const testPath = path.join(testDir, file);
  console.log(`\n📋 ${file}:`);

  try {
    const result = require(testPath);
    if (result && typeof result === 'object') {
      Object.entries(result).forEach(([name, fn]) => {
        totalTests++;
        try {
          fn();
          console.log(`  ✅ ${name}`);
          totalPassed++;
        } catch (err) {
          console.log(`  ❌ ${name}`);
          console.log(`     ${err.message}`);
          totalFailed++;
        }
      });
    }
  } catch (err) {
    console.error(`  Error loading test: ${err.message}`);
    totalFailed++;
  }
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Tests: ${totalTests} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
console.log(`${'='.repeat(50)}\n`);

process.exit(totalFailed > 0 ? 1 : 0);
