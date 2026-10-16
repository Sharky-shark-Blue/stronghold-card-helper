import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { createAuditLog } from '../src/engine/audit-log.js';
const VERSION = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8')).version;
const items = new Map();
let handler;
const area = { async get(key){return {[key]:items.get(key)};},
  async set(object){for(const [key,value] of Object.entries(object))items.set(key,value);},
  async remove(key){items.delete(key);} };
const chrome = {storage:{session:area,local:area},runtime:{getManifest:()=>({version:VERSION}),onMessage:{addListener(fn){handler=fn;}}}};
vm.runInNewContext(fs.readFileSync(new URL('../background.js',import.meta.url),'utf8'),
  {chrome,crypto:webcrypto,URL,Date,Map,Promise,Set,console});
const a='http://one.example:4000/play',b='https://another.example:7000/game/';
const rawCall=(message,tabId=1,url=a)=>new Promise(resolve=>handler(message,{tab:{id:tabId,url},url},
  response=>resolve(structuredClone(response)))); // Chrome runtime serializes across worlds
const call=(message,tabId=1,url=a)=>rawCall({clientVersion:VERSION,...message},tabId,url);
let updates=0;
const first=createAuditLog({origin:'http://one.example:4000',clientVersion:VERSION,sendMessage:m=>call(m),onChange:()=>updates++});
const secondTab=createAuditLog({origin:'http://one.example:4000',clientVersion:VERSION,sendMessage:m=>call(m,2,a)});
const different=createAuditLog({origin:'https://another.example:7000',clientVersion:VERSION,sendMessage:m=>call(m,3,b)});
assert.match((await rawCall({type:'log.append',entry:{kind:'start',summary:'stale'}},1,a)).reason,/版本不匹配/);
assert.match((await rawCall({type:'log.read',clientVersion:'0.3.1'},1,a)).reason,/版本不匹配/);
assert.deepEqual(await first.load(),[]);
let result=await first.append({kind:'buy_request',summary:'Authorization: secret123 http://site.example/?token=x 买入',
  meta:{uid:7,operatorId:'chess_char_1_19_a',token:'do-not-keep',price:1},server:'forged.example'});
assert.equal(result.length,1);
assert.equal(result[0].server,'http://one.example:4000','server must be derived from sender');
assert(!JSON.stringify(result).includes('secret123') && !JSON.stringify(result).includes('site.example'));
assert.equal(result[0].meta.uid,7);
assert.equal(result[0].meta.token,undefined);
assert.equal(typeof result[0].id,'string');
await Promise.all([
  first.append({kind:'buy_ok',summary:'买入已核对',meta:{uid:8}}),
  secondTab.append({kind:'sell_request',summary:'准备出售 UID 8',meta:{uid:8}}),
]);
assert.equal((await secondTab.load()).length,3,'concurrent tabs must not lose entries');
assert.deepEqual(await different.load(),[],'different origin has separate storage');
await different.append({kind:'start',summary:'另一台服务器启动'});
assert.equal((await first.load()).length,3);
await first.append({kind:'wait',summary:'无合格商店槽位'});
await first.append({kind:'wait',summary:'无合格商店槽位'});
assert.equal((await first.load()).length,4,'repeated idle log entries are deduplicated');
await first.append({kind:'refresh_request',summary:'准备刷新 · 实价 1',meta:{price:1,refreshed:0}});
await first.append({kind:'refresh_ok',summary:'刷新已核对 · 实付 1',meta:{price:1,refreshed:1}});
assert.equal((await first.load()).at(-1).meta.refreshed,1);
assert.equal((await call({type:'log.append',entry:{kind:'buy_ok',summary:'x',meta:{password:'secret'}}})).entries.at(-1).meta,undefined);
assert.equal((await call({type:'log.append',entry:{kind:'unknown',summary:'ignored'}})).ok,false);
assert(updates>=5);
// The worker bounds each server independently to prevent storage growing without limit.
// Every kind the controller writes must be accepted; unknown kinds stay rejected.
for (const [kind, meta] of [
  ['coin_request', { operatorId: 'chess_char_1_06_a', uid: 8, itemUid: 9 }],
  ['coin_ok', { operatorId: 'chess_char_1_06_a', uid: 8, itemUid: 9, amount: 1 }],
  ['coin_warn', { itemUid: 9, gain: 1 }],
  ['reward_request', { operatorId: 'chess_char_1_19_a', slot: 1, price: 0 }],
  ['reward_ok', { operatorId: 'chess_char_1_19_a', uid: 12 }],
]) {
  const response = await call({ type: 'log.append', entry: { kind, summary: '松果免费选卡 · 测试', meta } });
  assert.equal(response.ok, true, 'audit kind ' + kind + ' must be accepted: ' + response.reason);
  assert.equal(response.entries.at(-1).kind, kind);
}
assert.equal((await call({ type: 'log.append', entry: { kind: 'reward_pick', summary: 'x' } })).ok, false);
for(let i=0;i<304;i++) await call({type:'log.append',entry:{kind:'info',summary:`测试 ${i}`}});
assert.equal((await first.load()).length,300);
assert.equal((await different.load()).length,1);
await first.clear();
assert.equal((await first.load()).length,0);
assert.equal((await different.load()).length,1);
let failures=0;
const broken=createAuditLog({origin:'http://one.example:4000',clientVersion:VERSION,
  sendMessage:async()=>({ok:false,reason:'写入失败'}),onError:()=>{failures++;}});
await assert.rejects(()=>broken.append({kind:'start',summary:'启动'}),/写入失败/);
await assert.rejects(()=>broken.load(),/写入失败/);
assert.equal(failures,2);
let exportedBlob,downloadName='';
const originalCreate = URL.createObjectURL;
URL.createObjectURL = blob => {exportedBlob=blob;return 'blob:unit-test';};
globalThis.document = {body:{append(){}},createElement(){return {
  hidden:false,href:'',download:'',click(){downloadName=this.download;},remove(){},
};}};
assert.equal(await different.exportJSON(),1);
const payload=JSON.parse(await exportedBlob.text());
assert.equal(payload.server,'https://another.example:7000');
assert.equal(payload.entries.length,1);
assert(downloadName.endsWith('.json'));
URL.createObjectURL=originalCreate;
delete globalThis.document;
console.log('audit log: bounded per-origin persistence, concurrent writes, JSON export, sanitization and failure propagation passed');
