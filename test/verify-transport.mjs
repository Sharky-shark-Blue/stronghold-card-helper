import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createSpuiTransport } from '../src/engine/transport.js';
import fs from 'node:fs';
const VERSION=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8')).version;
let runtimeVersion=VERSION;
// Reproduce a regular HTTP page: randomUUID() is absent, but getRandomValues() is allowed.
const cryptoDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
Object.defineProperty(globalThis, 'crypto', { configurable: true,
  value: { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) } });
assert.equal(typeof crypto.randomUUID, 'undefined');
const origin = 'http://another-game.example:4000';
globalThis.location = { origin };
const handlers = new Set();
const calls = [];
let lost = false;
let rejectLockVersion = false;
globalThis.window = {
  addEventListener(type, fn) { if (type === 'message') handlers.add(fn); },
  postMessage(message, target) {
    assert.equal(target, origin);
    calls.push(message);
    if (message.side === 'ui' && message.type === 'snapshot-request') {
      queueMicrotask(() => receive({ side: 'game', nonce: message.nonce, type: 'snapshot',
        version: message.version, state: { match: { private: { funds: 4, shop: { refreshPrice: 1, slots: [{ id: 'chess_char_1_01_a', kind: 'chess', price: 1, sold: false }] } } } } }));
    }
    if (message.side === 'ui' && ['buy','sell','refresh','coin','reward','merge-reward'].includes(message.type)) {
      queueMicrotask(() => receive({ side: 'game', nonce: message.nonce, version:message.version, type: 'response', rid: message.rid, ok: true }));
    }
  },
};
function receive(fields, eventOrigin = origin) {
  const data = { channel: 'wei.runtime.v1', version: VERSION, ...fields };
  for (const fn of [...handlers]) fn({ source: window, origin: eventOrigin, data });
}
const lockMessages = [];
globalThis.chrome = { runtime: { getManifest:() => ({version:runtimeVersion}), async sendMessage(message) {
  lockMessages.push(message);
  if (message.type === 'lock.acquire') return rejectLockVersion ? {ok:false,reason:'插件脚本版本不匹配'} : { ok: true, token: 'issued-token' };
  if (message.type === 'lock.renew') return { ok: !lost };
  if (message.type === 'lock.release') return { ok: true };
  throw new Error('unexpected lock action');
} } };
const nonce = 'nonce-unique-browser-extension-test';
const transport = createSpuiTransport({ nonce, version: VERSION }, () => ({ buy:['chess_char_2_18_a'], keep:['chess_char_1_19_a'] }));
assert.equal(await transport.ready(), true);
assert.equal(transport.read().match.private.shop.slots[0].price, 1);
const release = await transport.acquireLock();
assert.equal(typeof release, 'function');
assert.equal(await transport.buy(0, {id:'chess_char_1_01_a',price:1}), true);
await assert.rejects(() => transport.buy(0, {id:'chess_char_1_01_a',price:0}), /实际价格已变化/);
await assert.rejects(() => transport.buy(0, {id:'chess_char_2_18_a',price:1}), /干员或实际价格已变化/);
assert.equal(await transport.sell(31), true);
const expectedSlots=structuredClone(transport.read().match.private.shop.slots);
assert.equal(await transport.refresh({price:1,slots:expectedSlots}),true);
await assert.rejects(() => transport.refresh({price:2,slots:expectedSlots}),/价格、资金或商店槽位已变化/);
await assert.rejects(() => transport.refresh({price:1,slots:[]}),/价格、资金或商店槽位已变化/);
const gameCommands = calls.filter(x => ['buy', 'sell'].includes(x.type));
assert(gameCommands.every(x => /^[0-9a-f]{32}$/.test(x.rid) && x.version===VERSION), 'HTTP-compatible request IDs must use 128-bit random bytes and current build stamp');
assert(lockMessages.every(x => x.clientVersion === VERSION));
const refreshCommands=calls.filter(x => x.type==='refresh');
assert.equal(refreshCommands.length,1);
assert.deepEqual(refreshCommands[0].expectedSlots,expectedSlots);
assert.equal(refreshCommands[0].expectedPrice,1);
assert.match(refreshCommands[0].rid,/^[0-9a-f]{32}$/);
await assert.rejects(()=>transport.useCoin(101,100), /盟约之币或装备目标状态已变化/);
const coinState={match:{private:{funds:10,hand:[
  {uid:100,id:'chess_char_3_03_a',kind:'chess',items:[]},
  {uid:101,id:'chess_item_1_03_e_a',kind:'item'},
  {uid:102,id:'chess_item_1_03_e_b',kind:'item'}],board:[],temp:[],
  shop:{slots:expectedSlots,refreshPrice:1,rewardOffer:null}}}};
receive({side:'game',nonce,type:'snapshot',state:coinState});
assert.equal(await transport.useCoin(101,100),true);
const coinCalls=calls.filter(x=>x.type==='coin');
assert.deepEqual([coinCalls[0].itemUid,coinCalls[0].parentUid],[101,100]);
assert.match(coinCalls[0].rid,/^[0-9a-f]{32}$/);
assert.equal(await transport.useCoin(102,100),true,'the golden coin is accepted too');
await assert.rejects(()=>transport.useCoin(101,7),/状态已变化/);
receive({side:'game',nonce,type:'snapshot',state:{match:{private:{...coinState.match.private,
  hand:[{uid:100,id:'chess_char_3_03_a',kind:'chess',items:[{uid:9,id:'old'}]},coinState.match.private.hand[1],coinState.match.private.hand[2]]}}}});
assert.equal(await transport.useCoin(101,100),true,'a carrier with one free slot may receive a coin');
receive({side:'game',nonce,type:'snapshot',state:{match:{private:{...coinState.match.private,
  hand:[{uid:100,id:'chess_char_3_03_a',kind:'chess',items:[{uid:9,id:'old'},{uid:10,id:'old2'}]},coinState.match.private.hand[1],coinState.match.private.hand[2]]}}}});
await assert.rejects(()=>transport.useCoin(101,100),/替换或销毁/);

const pineSlots=[{id:'chess_char_1_01_a',kind:'chess',price:0,sold:false}];
const pineOffer={source:'special',label:'松果',tier:1,queued:0,slots:pineSlots};
receive({side:'game',nonce,type:'snapshot',state:{match:{private:{...coinState.match.private,
  shop:{...coinState.match.private.shop,rewardOffer:pineOffer}}}}});
assert.equal(await transport.reward(0,{...pineOffer,id:'chess_char_1_01_a'}),true);
const rewardCalls=calls.filter(x=>x.type==='reward');
assert.deepEqual([rewardCalls[0].slot,rewardCalls[0].expectedId,rewardCalls[0].expectedPrice],
  [0,'chess_char_1_01_a',0]);
await assert.rejects(()=>transport.reward(0,{...pineOffer,id:'wrong'}),/选卡在请求前已变化/);
await assert.rejects(()=>transport.reward(0,{...pineOffer,id:'chess_char_1_01_a',slots:[]}),/选卡在请求前已变化/);

const mergeOffer={source:'merge',label:null,tier:2,queued:0,slots:pineSlots};
receive({side:'game',nonce,type:'snapshot',state:{match:{private:{...coinState.match.private,
  shop:{...coinState.match.private.shop,rewardOffer:mergeOffer}}}}});
assert.equal(await transport.mergeReward(0,{...mergeOffer,id:'chess_char_1_01_a'}),true);
const mergeCalls=calls.filter(x=>x.type==='merge-reward');
assert.equal(mergeCalls.length,1);
assert.deepEqual([mergeCalls[0].slot,mergeCalls[0].expectedId,mergeCalls[0].expectedPrice,
  mergeCalls[0].buy,mergeCalls[0].keep[0]],
  [0,'chess_char_1_01_a',0,undefined,'chess_char_1_19_a'],
  'custom buy list must not affect a free promotion choice');
await assert.rejects(()=>transport.mergeReward(0,{...mergeOffer,queued:1,id:'chess_char_1_01_a'}),/选卡在请求前已变化/);
await assert.rejects(()=>transport.mergeReward(0,{...mergeOffer,id:'chess_char_1_01_a',slots:[]}),/选卡在请求前已变化/);

Object.defineProperty(globalThis, 'crypto', { configurable: true, value: {} });
await assert.rejects(() => transport.sell(32), /安全随机数/);
assert.equal(calls.filter(x => ['buy', 'sell'].includes(x.type)).length, gameCommands.length,
  'without secure random bytes, fail before posting a game action');
await assert.rejects(() => transport.refresh({price:1,slots:expectedSlots}),/安全随机数/);
assert.equal(calls.filter(x=>x.type==='refresh').length,1,'no secure random bytes, no refresh request');
Object.defineProperty(globalThis, 'crypto', { configurable: true,
  value: { getRandomValues: webcrypto.getRandomValues.bind(webcrypto) } });
assert(calls.some(x => x.type === 'buy' && x.expectedPrice === 1 && x.expectedId === 'chess_char_1_01_a' && x.buy[0] === 'chess_char_2_18_a'));
assert(calls.some(x => x.type === 'sell' && x.uid === 31 && x.keep[0] === 'chess_char_1_19_a'));
assert(lockMessages.filter(x => x.type === 'lock.renew').length >= 3);
receive({ side: 'game', nonce, version: '0.3.1', type: 'snapshot', state: { replaced: true } });
assert.equal(transport.read().replaced, undefined, 'stale bridge snapshot must not replace current game state');
runtimeVersion='0.3.1';
await assert.rejects(() => transport.sell(32), /版本不匹配/);
assert.equal(calls.filter(x=>['buy','sell'].includes(x.type)).length, gameCommands.length,
  'a stale script must not emit game commands');
runtimeVersion=VERSION;
receive({ side: 'game', nonce, type: 'snapshot', state: { replaced: true } }, 'https://forged-origin.invalid');
assert.equal(transport.read().replaced, undefined, 'cross-origin message cannot overwrite game snapshot');
release();
rejectLockVersion=true;
await assert.rejects(() => transport.acquireLock(), /插件脚本版本不匹配/);
assert.equal(calls.filter(x=>['buy','sell'].includes(x.type)).length, gameCommands.length,
  'version mismatch in the worker must not emit game trade requests');
await assert.rejects(() => transport.sell(32), /未持有.*运行锁/);
// MAIN-world incompatibility must surface quickly, rather than silently arming a broken bridge.
const faulty = createSpuiTransport({ nonce: 'different-nonce-for-failure-test', version: VERSION }, () => ({}));
const ready = faulty.ready(1000);
receive({ side: 'game', nonce: 'different-nonce-for-failure-test', type: 'bridge-error', reason: '不兼容' });
await assert.rejects(ready, /不兼容/);
Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
console.log('transport: versioned buy/sell/refresh/coin/reward/merge-reward IDs, actual price, offer and shop guards passed');
