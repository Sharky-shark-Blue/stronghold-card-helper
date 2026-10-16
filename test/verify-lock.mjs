import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
const filename = new URL('../background.js', import.meta.url);
const VERSION = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')).version;
const items = new Map();
let listener;
const chrome = {
  storage: { session: {
    async get(key) { return { [key]: items.get(key) }; },
    async set(object) { for (const [key, value] of Object.entries(object)) items.set(key, value); },
    async remove(key) { items.delete(key); },
  } },
  runtime: { getManifest: () => ({ version: VERSION }), onMessage: { addListener(fn) { listener = fn; } } },
};
vm.runInNewContext(fs.readFileSync(filename, 'utf8'), { chrome, crypto: webcrypto, URL, Date, Map, Promise, console });
async function rawCall(message, tabId, url) {
  return await new Promise(resolve => listener(message, { tab: { id: tabId, url }, url }, resolve));
}
const call = (message, tabId, url) => rawCall({ clientVersion: VERSION, ...message }, tabId, url);
const a = 'http://game1.example:4000/index.html';
const b = 'https://game2.example:4999/game/index.html';
assert.match((await rawCall({ type:'lock.acquire' }, 1, a)).reason, /版本不匹配/,
  'a stale pre-update content script must not obtain a lock');
assert.match((await rawCall({ type:'lock.acquire', clientVersion:'0.3.1' }, 1, a)).reason, /版本不匹配/);
assert.equal((await call({type:'health.check'},1,a)).version, VERSION);
const t1 = await call({ type:'lock.acquire' }, 1, a);
assert.equal(t1.ok, true);
assert.equal((await call({ type:'lock.acquire' }, 2, a)).ok, false, 'same origin is exclusive across tabs');
assert.equal((await call({ type:'lock.renew', token:'not-our-token' }, 2, a)).ok, false);
const other = await call({ type:'lock.acquire' }, 3, b);
assert.equal(other.ok, true, 'a different server has an independent lock');
assert.equal((await rawCall({ type:'lock.renew', token:t1.token, clientVersion:'0.3.1' }, 1, a)).ok, false,
  'old scripts must not renew a new worker lock');
assert.equal((await call({ type:'lock.renew', token: t1.token }, 1, a)).ok, true);
assert.equal((await call({ type:'lock.release', token: t1.token }, 2, a)).ok, false);
assert.equal((await call({ type:'lock.release', token: t1.token }, 1, a)).ok, true);
assert.equal((await call({ type:'lock.acquire' }, 2, a)).ok, true);
assert.equal((await call({ type:'lock.acquire' }, 4, 'file:///local/index.html')).ok, false);
console.log('service-worker: per-origin lease, cross-tab exclusion, token ownership and HTTP support passed');
