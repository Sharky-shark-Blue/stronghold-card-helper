import test from 'node:test';
import assert from 'node:assert/strict';
import * as policy from '../src/engine/auto-policy.js';
import { runCoinStaticCases } from './coin-static-cases.mjs';
for (const result of runCoinStaticCases(policy)) {
  test(result.name, () => assert.equal(result.pass, true, JSON.stringify(result)));
}
