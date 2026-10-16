// 独立临时 Chrome + 仅映射到本机的 HTTP 模拟对局；绝不使用现有浏览器或真实服务器。
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createServer} from 'node:http';
import assert from 'node:assert/strict';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const manifest=JSON.parse(await fs.readFile(path.join(root,'manifest.json'),'utf8'));
const browser=process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'wei-runtime-smoke-'));
const fixtureHost='wei-insecure.test',MID='manual_'+'a'.repeat(32),ROLE='chess_new_manual',ROLE_GOLD='chess_new_manual_elite',HRDOC='chess_item_6_08_e_a';
let child,buffer=Buffer.alloc(0),serial=0;
const pending=new Map(),exceptions=[],servers=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function send(method,params={},sessionId){const id=++serial;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error(method+' timed out'));},16000);pending.set(id,message=>{clearTimeout(timer);pending.delete(id);message.error?reject(new Error(method+': '+message.error.message)):resolve(message.result || {});});child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');});}
async function evaluate(sessionId,expression){const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);return r.result?.value;}
async function until(fn,label='条件'){const end=Date.now()+14000;while(Date.now()<end){const value=await fn();if(value)return value;await pause(100);}throw new Error(label+'等待超时');}
async function attach(targetId){const r=await send('Target.attachToTarget',{targetId,flatten:true});await send('Runtime.enable',{},r.sessionId);return r.sessionId;}
const chess=Object.fromEntries(['chess_char_4_19_a','chess_char_1_19_a',ROLE,...Array.from({length:30},(_,i)=>'chess_fixture_'+i)].map(id=>[id,{name:id===ROLE?'网页新角色':id,baseId:id,isGolden:false,visible:true,isHidden:false,isDiy:false,tier:1,bonds:[]}]));
// 仅内存测试图片；正式扩展从当前游戏的 assets.json 获取真实素材。
for (const rec of Object.values(chess)) rec.charId = 'char_fixture';
chess[ROLE].charId = 'char_fixture_live';
chess[ROLE].goldenId=ROLE_GOLD;
chess[ROLE_GOLD]={...chess[ROLE],baseId:ROLE,isGolden:true};
chess.chess_fixture_0.charId = 'char_missing';
const fixtureIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="#95b9a1"/></svg>';
async function fixture({bundle=false,late=false,icons=true}={}){
  const store=`let state={connection:{status:'online'},ui:{buildStale:false},me:{playerId:'me'},room:{code:'fixture',inMatch:true,seats:[{playerId:'me'}]},match:{public:{phase:'PREP',round:1,players:[{playerId:'me',autoplay:false}]},private:{alive:true,ready:false,funds:20,hand:[{uid:7,id:'chess_char_1_19_a',kind:'chess'}],board:[],temp:[],shop:{slots:[{id:'chess_fixture_0',kind:'chess',price:5,sold:false}],refreshPrice:1,rewardOffer:null}}}};const listeners=new Set();export const store={get:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},set:next=>{const previous=state;state=next;for(const fn of [...listeners])fn(next,previous)}};window.fixtureStore=store;window.fixtureCounts={buy:0,sell:0,refresh:0};window.fixtureNextUid=900;`;
  const actions=`import {store} from '../store.js';export const actions={buy:async slot=>{window.fixtureCounts.buy++;const s=structuredClone(store.get()),offer=s.match.private.shop.slots[slot];s.match.private.funds-=offer.price;offer.sold=true;const twin=offer.kind==='item'&&offer.id==='chess_item_dynamic_true'?s.match.private.hand.findIndex(p=>p&&p.kind==='item'&&p.id===offer.id):-1;if(twin>=0){s.match.private.hand.splice(twin,1);s.match.private.hand.push({uid:++window.fixtureNextUid,id:'chess_item_dynamic_gold',kind:'item'});}else s.match.private.hand.push({uid:++window.fixtureNextUid,id:offer.id,kind:offer.kind});store.set(s);return true;},sell:async uid=>{window.fixtureCounts.sell++;const s=structuredClone(store.get());s.match.private.hand=s.match.private.hand.filter(p=>p.uid!==uid);store.set(s);return true;},refresh:async()=>{window.fixtureCounts.refresh++;const s=structuredClone(store.get());s.match.private.funds-=s.match.private.shop.refreshPrice;s.match.private.shop.slots=[{id:'${ROLE}',kind:'chess',price:1,sold:false}];s.match.private.shop.refreshPrice=99;store.set(s);return true;},equip:async()=>{throw new Error('模拟对局未安排道具装备')},reward:async()=>{throw new Error('模拟对局未安排奖励领取')}};`;
  const server=createServer((req,res)=>{const routes={
    '/':['text/html; charset=utf-8','<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#111d16;color:#d8e9d1;font:16px Microsoft YaHei,sans-serif}.app-root{position:fixed;inset:0;padding:80px 50px}h1{font-size:42px;color:#b8d69d}p{line-height:2;color:#8ea48d}</style></head><body><div class="app-root"><h1>独立模拟对局</h1><p>仅验证功能迁移，不访问真实游戏服务器。<br>原有库存 UID 7 不允许自动出售。<br>模拟商店：刷新 → 买入 → 出售 / 保留。</p></div><script type="module" src="/js/main.js"></script></body></html>'],
    '/js/main.js':['text/javascript',"import {store} from './store.js';window.fixtureLoaded=!!store;"],
    '/js/store.js':['text/javascript',store],'/js/ui/gameActions.js':['text/javascript',actions],'/data/chess.json':['application/json',JSON.stringify(chess)],'/data/bonds.json':['application/json','{}'],
     '/data/items.json':['application/json',JSON.stringify({chess_item_3_04_e_a:{id:'chess_item_3_04_e_a',name:'炎国短刀',tier:3,iconId:'trap_fixture_blade'},chess_item_dynamic_true:{name:'图鉴外测试道具',itemType:'EQUIP',isGolden:false,mergeable:true,upgradeNum:2,upgradeChessId:'chess_item_dynamic_gold'},chess_item_dynamic_gold:{name:'图鉴外测试道具',baseId:'chess_item_dynamic_true',itemType:'EQUIP',isGolden:true,mergeable:false,upgradeNum:0}})],
     '/data/assets.json':['application/json',JSON.stringify({chars:{char_fixture:{avatar:'/assets/operator.svg'},char_fixture_live:{avatar:'/assets/operator-live.svg'},char_missing:{avatar:'/assets/missing.svg'}},items:{trap_fixture_blade:'/assets/item.svg'}})],
     '/assets/operator.svg':['image/svg+xml',fixtureIcon],'/assets/operator-live.svg':['image/svg+xml',fixtureIcon],'/assets/item.svg':['image/svg+xml',fixtureIcon]};
    if(!icons)delete routes['/data/assets.json'];
    // 打包版（Vite）网页：没有 js/main.js 与源码模块，只有游戏自己挂出的 globalThis.__SP__。
    if(bundle){for(const name of ['/js/main.js','/js/store.js','/js/ui/gameActions.js'])delete routes[name];routes['/'][1]=routes['/'][1].replace('/js/main.js','/build/assets/index-test.js');
      routes['/build/assets/store-chunk.js']=['text/javascript',store];routes['/build/assets/actions-chunk.js']=['text/javascript',actions.replace("'../store.js'","'./store-chunk.js'")];
      routes['/build/assets/index-test.js']=['text/javascript',`import {store} from './store-chunk.js';import {actions} from './actions-chunk.js';const intents={'g.buy':f=>actions.buy(f.slot),'g.sell':f=>actions.sell(f.uid),'g.refresh':()=>actions.refresh(),'g.equip':f=>actions.equip(f.itemUid,f.targetUid),'g.reward':f=>actions.reward(f.idx)};const expose=()=>{globalThis.__SP__={store,net:{async request(t,f){if(!(await intents[t](f)))throw new Error('rejected');return {};}},version:1};};window.fixtureLoaded=true;${late?'window.fixtureExpose=expose;':'expose();'}`];}
    const entry=routes[new URL(req.url,'http://fixture').pathname];res.writeHead(entry?200:404,{'Content-Type':entry?.[0] || 'text/plain'});res.end(entry?.[1] || 'not found');});
  servers.push(server);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server.address().port;
}
try {
  await fs.access(browser);
  child=spawn(browser,['--headless=new','--remote-debugging-pipe','--enable-unsafe-extension-debugging',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--no-proxy-server',`--host-resolver-rules=MAP ${fixtureHost} 127.0.0.1`,'about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe'],windowsHide:true});child.stderr.on('data',()=>{});
  child.stdio[4].on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);let end;while((end=buffer.indexOf(0))!==-1){const text=buffer.subarray(0,end).toString();buffer=buffer.subarray(end+1);try{const m=JSON.parse(text);if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);pending.get(m.id)?.(m);}catch{}}});
  console.log('独立功能测试浏览器：',(await send('Browser.getVersion')).product);
  const loaded=await send('Extensions.loadUnpacked',{path:root});assert.ok(loaded.id);
  const worker=await until(async()=> (await send('Target.getTargets',{filter:[{exclude:false}]})).targetInfos.find(t=>t.type==='service_worker'&&t.url===`chrome-extension://${loaded.id}/background.js`),'后台');const workerSession=await attach(worker.targetId);await until(()=>evaluate(workerSession,"chrome.action.onClicked.hasListeners()"),'后台监听');
  // Only this disposable profile gets a pre-existing schema-3 manual role and stale saved draft preference.
  await evaluate(workerSession,`chrome.storage.local.set({'wei.workbench.plan.v1':{schema:3,buy:[${JSON.stringify(MID)}],keep:[],customOperators:[{id:${JSON.stringify(MID)},name:'网页新角色'}],draftEnabled:true}}).then(()=>true)`);
  async function open(port) {
    const origin=`http://${fixtureHost}:${port}`,url=origin+'/';
    const target=await send('Target.createTarget',{url}),game=await attach(target.targetId);
    await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false},game);
    await until(()=>evaluate(game,'Boolean(window.fixtureLoaded)'),'模拟页面');
    const tab=await until(async()=> (await send('Target.getTargets',{filter:[{type:'tab',exclude:false},{exclude:true}]})).targetInfos.find(t=>t.url===url),'标签');
    await send('Extensions.triggerAction',{id:loaded.id,targetId:tab.targetId});
    await until(()=>evaluate(game,"Boolean(document.getElementById('wei-cardkeeper-host-v1'))"),'左侧宿主');
    const frame=await until(async()=> (await send('Target.getTargets',{filter:[{exclude:false}]})).targetInfos.find(t=>t.type==='iframe'&&t.url.startsWith(`chrome-extension://${loaded.id}/panel.html`)&&new URL(t.url).searchParams.get('server')===origin),'界面 iframe');
    const ui=await attach(frame.targetId);
    try { await until(()=>evaluate(ui,'Boolean(window.weiWorkbench?.getRuntimeInfo().ready)'),'网页读取与日志就绪'); }
    catch(error) {
      const panel=await evaluate(ui,"({text:document.body.innerText.slice(0,400),hasWorkbench:!!window.weiWorkbench,info:window.weiWorkbench?.getRuntimeInfo()})").catch(e=>({error:e.message}));
      const page=await evaluate(game,"({host:!!document.getElementById('wei-cardkeeper-host-v1'),script:document.querySelector('script[data-wei-runtime]')?.src})").catch(e=>({error:e.message}));
      console.error('模拟对局启动诊断：',JSON.stringify({panel,page,exceptions}).slice(0,6000));
      throw error;
    }
    return {game,ui,origin,tab};
  }
  const first=await open(await fixture());
  assert.equal(await evaluate(first.game,'isSecureContext'),false);
  assert.equal(await evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')"),'false');
  assert.equal(await evaluate(first.ui,"document.querySelector('.version').textContent"),`v${manifest.version}`);
  assert.equal(await evaluate(first.ui,"document.querySelector('#item-section').hidden"),true);
  assert.deepEqual(await evaluate(first.game,'window.fixtureCounts'),{buy:0,sell:0,refresh:0});
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().matches[${JSON.stringify(MID)}]`),ROLE);
  assert.ok(await evaluate(first.ui,"document.querySelector('.manual-badge').textContent.includes('匹配')"));
  assert.equal(await evaluate(first.game,'globalThis.__spuiMainBridge === globalThis.__weiMainBridge'),true);
  await evaluate(first.ui,"document.querySelector('[data-action=add-open]').click();true");
  assert.equal(await evaluate(first.ui,`document.querySelector('[data-action=add-candidate][data-id="${ROLE}"]').disabled`),true);
  await evaluate(first.ui,"document.querySelector('#manual-name').value='图鉴外未知角色';document.querySelector('#manual-form').requestSubmit();document.querySelector('[data-action=picker-close]').click();true");
  await until(()=>evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().skipped?.length>0'),'未知条目跳过');
  assert.equal(await evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().issues.length'),0);
  assert.ok(await evaluate(first.ui,"document.querySelector('#mapping-note').textContent.includes('待识别')"));
  assert.ok(await evaluate(first.ui,"[...document.querySelectorAll('[data-entry-id]')].find(row=>row.textContent.includes('图鉴外未知角色')).textContent.includes('待识别')"));
  console.log('通过：普通 HTTP 页面自动读取、真实图鉴更新、手动名唯一匹配、旧偏好不启动、未知名持续待识别。');
  await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");
  await until(()=>evaluate(first.game,'window.fixtureCounts.buy===1&&window.fixtureCounts.sell===1&&window.fixtureCounts.refresh===1'),'刷新买卖链');
  assert.deepEqual(await evaluate(first.game,'window.fixtureStore.get().match.private.hand.map(p=>p.uid)'),[7]);
  await until(()=>evaluate(first.ui,"document.getElementById('log-list').textContent.includes('出售已核对')"),'交易日志');
  assert.ok(await evaluate(first.ui,"document.getElementById('log-list').textContent.includes('刷新')"));
  await evaluate(first.ui,"document.querySelector('[data-kind=keep]').click();document.querySelector('[data-action=add-open]').click();document.querySelector('#manual-name').value='网页新角色';document.querySelector('#manual-form').requestSubmit();document.querySelector('[data-action=picker-close]').click();true");
  await until(()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')==='false'"),'名单变更暂停');
  assert.deepEqual(await evaluate(first.ui,'window.weiWorkbench.getPlan().keep'),[MID]);
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.shop.slots=[{id:'${ROLE}',kind:'chess',price:1,sold:false}];s.match.private.funds=20;window.fixtureStore.set(s);return true;})()`);
  await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");
  await until(()=>evaluate(first.game,'window.fixtureCounts.buy===2'),'保留买入');
  await until(()=>evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().kept===1'),'保留核对');
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().keepCounts?.[${JSON.stringify(MID)}]===1`),'保留数量来自实时库存');
  assert.equal(await evaluate(first.ui,"'keepSession' in window.weiWorkbench.getPlan()"),false);
  assert.equal(await evaluate(first.game,'window.fixtureCounts.sell'),1);
  assert.deepEqual(await evaluate(first.game,'window.fixtureStore.get().match.private.hand.map(p=>p.uid)'),[7,902]);
  console.log('通过：手动启动 → 按实价刷新 → 买入 → 只卖新 UID；保留名单阻止出售，旧库存始终保留。');
  await evaluate(first.ui,`(() => {const cap=document.querySelector('[data-keep-limit="${MID}"]');cap.value='1';cap.dispatchEvent(new Event('change',{bubbles:true}));const funds=document.querySelector('[data-keep-funds="${MID}"]');funds.value='20';funds.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
  await until(()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')==='false'"),'保留规则修改暂停');
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.shop.slots=[{id:'${ROLE}',kind:'chess',price:1,sold:false}];s.match.private.funds=21;window.fixtureStore.set(s);return true;})()`);
  await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");await pause(350);
  assert.equal(await evaluate(first.game,'window.fixtureCounts.buy'),2,'达到保留上限后低价与普通买入均不得绕过');
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.getPlan().keepRules[${JSON.stringify(MID)}].minFunds`),20);
  // Reaching a target pauses purchases without disabling the rule or saving a historical total.
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.getPlan().disabled.keep.includes(${JSON.stringify(MID)})`),false);
  assert.equal(await evaluate(first.ui,`document.querySelector('[data-action=disable][data-id="${MID}"]').textContent.trim()`),'启用');
  assert.equal(await evaluate(first.ui,"Boolean(document.querySelector('[data-action=keep-plus],[data-action=keep-minus]'))"),false);
  await evaluate(first.ui,`(() => {if(window.weiWorkbench.getRuntimeInfo().running)document.querySelector('[data-action=draft]').click();window.keepInputBefore=document.querySelector('[data-keep-limit="${MID}"]');window.keepIconBefore=document.querySelector('[data-entry-id="${MID}"] img.game-icon');window.keepInputBefore.focus();window.keepInputBefore.value='5';return true;})()`);
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get());window.fixtureKeepOriginal=structuredClone({hand:s.match.private.hand,board:s.match.private.board,temp:s.match.private.temp});s.match.private.hand=[...s.match.private.hand.filter(p=>p.id!=='${ROLE}'),{uid:9101,id:'${ROLE}',kind:'chess'}];s.match.private.board=[{uid:9100,id:'${ROLE_GOLD}',kind:'chess'}];s.match.private.temp=[{uid:9102,id:'${ROLE}',kind:'chess'}];window.fixtureStore.set(s);return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().keepCounts?.[${JSON.stringify(MID)}]===5&&document.querySelector('[data-keep-owned="${MID}"]').textContent.includes('持有 5 / 1')`),'精二与普通跨三个区域折算');
  assert.ok(await evaluate(first.ui,`window.keepInputBefore===document.querySelector('[data-keep-limit="${MID}"]')&&window.keepInputBefore.value==='5'&&window.keepIconBefore===document.querySelector('[data-entry-id="${MID}"] img.game-icon')`),'数量推送只更新文字，不重建输入框或头像');
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get());for(const area of ['hand','board','temp'])s.match.private[area]=s.match.private[area].filter(p=>p.id!=='${ROLE}'&&p.id!=='${ROLE_GOLD}');window.fixtureStore.set(s);return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().keepCounts?.[${JSON.stringify(MID)}]===0&&!window.weiWorkbench.getPlan().disabled.keep.includes(${JSON.stringify(MID)})`),'持有减少不会锁死补抓开关');
  await evaluate(first.game,"(() => {const s=structuredClone(window.fixtureStore.get());Object.assign(s.match.private,window.fixtureKeepOriginal);window.fixtureStore.set(s);return true;})()");
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().keepCounts?.[${JSON.stringify(MID)}]===1`),'恢复原模拟库存');
  await evaluate(first.ui,"window.keepInputBefore.value='1';true");
  assert.equal(await evaluate(first.ui,"document.querySelector('#item-section').hidden"),true);
  await evaluate(first.ui,"document.querySelector('#tab-items').click();true");
  await until(()=>evaluate(first.ui,"document.querySelector('#item-section').hidden===false&&document.querySelector('#operator-panel').hidden===true"),'道具标签页');
  await evaluate(first.ui,"document.querySelector('#item-section [data-action=item-picker-open]').click();true");
  assert.equal(await evaluate(first.ui,"document.querySelector('.item-picker-backdrop').hidden"),false);
  await evaluate(first.ui,`document.querySelector('[data-item-pick=chess_item_3_04_e_a]').click();document.querySelector('[data-item-pick="${HRDOC}"]').click();true`);
  assert.equal(await evaluate(first.ui,"document.querySelector('[data-item-pick=chess_item_3_04_e_a]').disabled"),true);
  assert.equal(await evaluate(first.ui,`document.querySelector('[data-item-pick="${HRDOC}"]').disabled`),true);
  await evaluate(first.ui,"document.querySelector('#item-manual-name').value='图鉴外测试道具';document.querySelector('#item-manual-form').requestSubmit();true");
  await evaluate(first.ui,"document.querySelector('[data-action=item-picker-close]').click();true");
  assert.equal(await evaluate(first.ui,'window.weiWorkbench.getPlan().items.length'),3);
  assert.ok(await evaluate(first.ui,"window.weiWorkbench.getPlan().items.every(item=>item.enabled===false)"));
  assert.ok(await evaluate(first.ui,"window.weiWorkbench.getPlan().items.every(item=>item.limit===null)")); // 新增道具抓取默认不限
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get()),blade='chess_item_3_04_e_a';s.match.private.hand=[{uid:7,id:'chess_char_1_19_a',kind:'chess'},{uid:9202,id:blade,kind:'item'},{uid:9203,id:'${HRDOC}',kind:'item'}];s.match.private.board=[{uid:9200,id:'chess_char_4_19_a',kind:'chess',items:[{uid:9201,id:blade,kind:'item'}]}];s.match.private.temp=[{uid:9204,id:blade,kind:'item'}];window.fixtureStore.set(s);return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().itemOwnedCounts?.['chess_item_3_04_e_a']===3&&window.weiWorkbench.getRuntimeInfo().itemOwnedCounts?.[${JSON.stringify(HRDOC)}]===1&&document.querySelector('[data-item-owned="chess_item_3_04_e_a"]').textContent.includes('本局持有 3')`),'干员身上、手牌、临时区道具实时统计');
  await evaluate(first.ui,`document.querySelector('[data-action=item-plus][data-id="${HRDOC}"]').click();true`);
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.getPlan().itemSession.used[${JSON.stringify(HRDOC)}]`),1);
  await evaluate(first.game,`(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.hand=s.match.private.hand.filter(item=>item.id!=='${HRDOC}');s.match.private.board[0].items.push({uid:9205,id:'${HRDOC}',kind:'item'});window.fixtureStore.set(s);return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().itemOwnedCounts?.[${JSON.stringify(HRDOC)}]===0&&window.weiWorkbench.getPlan().itemSession.used[${JSON.stringify(HRDOC)}]===1&&document.querySelector('[data-item-owned="${HRDOC}"]').textContent.includes('本局持有 0')`),'人事部文档用后永久生效不作为本局持有');
  await evaluate(first.ui,"document.querySelector('#item-section [data-action=icons]').click();true");
  await until(()=>evaluate(first.ui,"window.weiWorkbench.getPlan().iconOnly===true"),'道具图标模式');
  assert.equal(await evaluate(first.ui,"document.querySelector('.item-icon-tile [data-item-owned=chess_item_3_04_e_a]').textContent"),'3');
  assert.equal(await evaluate(first.ui,`document.querySelector('.item-icon-tile [data-item-owned="${HRDOC}"]').textContent`),'0');
  await evaluate(first.ui,"document.querySelector('#item-section [data-action=icons]').click();true");
  await until(()=>evaluate(first.ui,"window.weiWorkbench.getPlan().iconOnly===false"),'恢复道具普通列表');
  await evaluate(first.ui,`(() => {const input=document.querySelector('[data-item-limit="chess_item_3_04_e_a"]');input.value='2';input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-action=item-plus][data-id="chess_item_3_04_e_a"]').click();document.querySelector('[data-action=item-plus][data-id="chess_item_3_04_e_a"]').click();return true;})()`);
  assert.equal(await evaluate(first.ui,"window.weiWorkbench.getPlan().itemSession.used.chess_item_3_04_e_a"),2);
  assert.ok(await evaluate(first.ui,`document.querySelector('[data-action=item-plus][data-id="chess_item_3_04_e_a"]').disabled`));
  await evaluate(first.ui,'window.weiWorkbench.settled().then(()=>true)');
  assert.equal(await evaluate(workerSession,"chrome.storage.local.get('wei.workbench.plan.v1').then(v=>v['wei.workbench.plan.v1'].itemSession.used.chess_item_3_04_e_a)"),2);
  await evaluate(first.ui,"document.querySelector('[data-action=item-next]').click();true");
  assert.equal(await evaluate(first.ui,"window.weiWorkbench.getPlan().itemSession.used.chess_item_3_04_e_a"),2);
  await evaluate(first.ui,"document.querySelector('[data-action=item-next]').click();true");
  assert.deepEqual(await evaluate(first.ui,'window.weiWorkbench.getPlan().itemSession.used'),{});
  assert.equal(await evaluate(first.ui,"window.weiWorkbench.getPlan().items[0].limit"),2);
  await until(()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')==='false'"),'手动下一对局暂停');
  assert.equal(await evaluate(first.ui,"'keepSession' in window.weiWorkbench.getPlan()"),false);
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().keepCounts?.[${JSON.stringify(MID)}]`),1);
  console.log('通过：道具仍按累计购买次数保存与手动清零；干员始终按实时库存折算，下一对局按钮不会篡改持有量。');
  const itemKey=await evaluate(first.ui,"window.weiWorkbench.getPlan().items.find(item=>item.name==='图鉴外测试道具').id");
  await evaluate(first.ui,`(() => {const cap=document.querySelector('[data-item-limit="${itemKey}"]');cap.value='1';cap.dispatchEvent(new Event('change',{bubbles:true}));const input=document.querySelector('[data-item-funds="${itemKey}"]');input.value='6';input.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-action=item-toggle][data-id="${itemKey}"]').click();return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().itemMatches[${JSON.stringify(itemKey)}]==='chess_item_dynamic_true'`),'图鉴外道具真实 ID');
  await evaluate(first.game,"(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.shop.slots=[{id:'chess_item_dynamic_true',kind:'item',price:3,sold:false}];s.match.private.funds=6;window.fixtureStore.set(s);return true;})()");
  await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");await pause(250);
  assert.equal(await evaluate(first.game,'window.fixtureCounts.buy'),2); // 6 is NOT strictly greater than 6.
  await evaluate(first.game,"(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.funds=7;window.fixtureStore.set(s);return true;})()");
  await until(()=>evaluate(first.game,'window.fixtureCounts.buy===3'),'道具买入');
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getRuntimeInfo().itemOwnedCounts?.[${JSON.stringify(itemKey)}]===1&&document.querySelector('[data-item-owned="${itemKey}"]').textContent.includes('本局持有 1')`),'图鉴外道具本局持有实时统计');
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getPlan().itemSession.used[${JSON.stringify(itemKey)}]===1`),'道具次数自动保存');
  assert.equal(await evaluate(first.game,"window.fixtureStore.get().match.private.hand.filter(item=>item.kind==='item'&&item.id==='chess_item_dynamic_true').length"),1);
  assert.equal(await evaluate(first.game,'window.fixtureCounts.sell'),1); // Item is never sold as a chess UID.
  await evaluate(first.game,"(() => {const s=structuredClone(window.fixtureStore.get());s.match.private.shop.slots=[{id:'chess_item_dynamic_true',kind:'item',price:1,sold:false}];s.match.private.funds=9;window.fixtureStore.set(s);return true;})()");
  await pause(350);assert.equal(await evaluate(first.game,'window.fixtureCounts.buy'),3); // Per-match cap 1.
  // Cap reached → the item is disabled automatically; raising the cap alone does not re-arm it.
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getPlan().items.find(item=>item.id===${JSON.stringify(itemKey)}).enabled===false`),'道具达到上限自动禁用');
  assert.equal(await evaluate(first.ui,`document.querySelector('[data-action=item-toggle][data-id="${itemKey}"]').textContent.trim()`),'已满');
  // Game data: two identical copies merge. The owned hand copy is consumed; the golden item is counted as one purchase.
  await evaluate(first.ui,`(() => {const input=document.querySelector('[data-item-limit="${itemKey}"]');input.value='2';input.dispatchEvent(new Event('change',{bubbles:true}));return true;})()`);
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getPlan().items.find(item=>item.id===${JSON.stringify(itemKey)}).limit===2`),'道具上限改为 2');
  await pause(350);assert.equal(await evaluate(first.game,'window.fixtureCounts.buy'),3);
  // Manual enable clears this match's count and re-arms the item (a plan change: the run pauses).
  await evaluate(first.ui,`document.querySelector('[data-action=item-toggle][data-id="${itemKey}"]').click();true`);
  await until(()=>evaluate(first.ui,`(p=>p.items.find(item=>item.id===${JSON.stringify(itemKey)}).enabled&&!p.itemSession.used[${JSON.stringify(itemKey)}])(window.weiWorkbench.getPlan())`),'手动启用道具清零');
  await until(()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')==='false'"),'交易方案变更后暂停');
  await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");
  await until(()=>evaluate(first.game,'window.fixtureCounts.buy===4'),'同名道具合成买入');
  await until(()=>evaluate(first.ui,`window.weiWorkbench.getPlan().itemSession.used[${JSON.stringify(itemKey)}]===1`),'合成买入计次');
  assert.deepEqual(await evaluate(first.game,"window.fixtureStore.get().match.private.hand.filter(item=>item.kind==='item').map(item=>item.id)"),['chess_item_dynamic_gold']);
  await pause(350);assert.equal(await evaluate(first.game,'window.fixtureCounts.buy'),4);
  console.log('通过：游戏数据唯一识别图鉴外道具、资金严格 > 门槛、独立 UID 买入与持久次数；达到上限不再下单；手牌同名件按游戏规则合成并计 1 次。');
  // 启停快捷键：游戏画面里真实按下 F8 立即停止；再按一次走工作台同一套校验重新启动，且不会被“手动操作暂停”吞掉。
  const pressF8=async()=>{for(const type of ['rawKeyDown','keyUp'])await send('Input.dispatchKeyEvent',{type,key:'F8',code:'F8',windowsVirtualKeyCode:119,nativeVirtualKeyCode:119},first.game);};
  const running=()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')");
  assert.equal(await running(),'true');await pressF8();
  await until(async()=>await running()==='false','快捷键 F8 停止');
  await pause(450);await pressF8();
  await until(async()=>await running()==='true','快捷键 F8 启动');
  await pause(300);assert.equal(await running(),'true');
  console.log('通过：快捷键 F8 在游戏画面中停止并重新启动自动倒转，不触发手动操作暂停。');
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:950,y:700,button:'left',buttons:1,clickCount:1},first.game);await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:950,y:700,button:'left',buttons:0,clickCount:1},first.game);
  await until(()=>evaluate(first.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')==='false'"),'手动操作暂停');
  await evaluate(first.game,"(() => {const s=structuredClone(window.fixtureStore.get());s.match.public.phase='BATTLE';window.fixtureStore.set(s);return true;})()");
  const counts=await evaluate(first.game,'window.fixtureCounts');await evaluate(first.ui,"document.querySelector('[data-action=draft]').click();true");await pause(200);assert.deepEqual(await evaluate(first.game,'window.fixtureCounts'),counts);
  await evaluate(first.ui,"document.querySelector('[data-action=open-log]').click();true");
  assert.ok(await evaluate(first.ui,"!document.querySelector('.utility-backdrop').hidden&&document.querySelector('.main').inert"));
  assert.ok(await evaluate(first.ui,"document.querySelector('.utility-foot [data-action=draft]').hidden"));await pause(2900);
  await fs.mkdir(path.join(root,'test','.artifacts'),{recursive:true});const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},first.game);await fs.writeFile(path.join(root,'test','.artifacts','runtime-live.png'),Buffer.from(shot.data,'base64'));
  await evaluate(first.ui,"window.weiWorkbench.settled().then(()=>true)");
  const logCount=await evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().logCount');assert.ok(logCount>5);
  await evaluate(first.ui,"document.querySelector('[data-action=utility-close]').click();document.querySelector('[data-action=open-health]').click();document.querySelector('[data-action=health-check]').click();true");await pause(100);assert.deepEqual(await evaluate(first.game,'window.fixtureCounts'),counts);
  const downloads=path.join(profile,'downloads');await fs.mkdir(downloads,{recursive:true});await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});
  await evaluate(first.ui,"document.querySelector('[data-action=utility-close]').click();document.querySelector('[data-action=open-log]').click();document.querySelector('[data-action=log-export]').click();true");const exported=await until(async()=> (await fs.readdir(downloads)).find(name=>name.endsWith('.json')),'日志导出');const journal=JSON.parse(await fs.readFile(path.join(downloads,exported),'utf8'));assert.equal(journal.server,first.origin);assert.ok(journal.entries.length>5);
  await evaluate(first.ui,"document.querySelector('[data-action=log-clear]').click();true");await pause(100);assert.ok(await evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().logCount>0'));
  await evaluate(first.ui,"document.querySelector('[data-action=log-clear]').click();true");await until(()=>evaluate(first.ui,'window.weiWorkbench.getRuntimeInfo().logCount===0'),'二次确认清空日志');assert.deepEqual(await evaluate(first.game,'window.fixtureCounts'),counts);
  // 配置文件：导出真实 JSON 文件，整份导入覆盖前自动备份；本局已抓次数保留。
  const planBefore=await evaluate(first.ui,'JSON.stringify(window.weiWorkbench.getPlan())');
  await evaluate(first.ui,"document.querySelector('[data-action=utility-close]').click();document.querySelector('[data-action=settings]').click();document.querySelector('[data-action=config-export]').click();true");
  const configName=await until(async()=> (await fs.readdir(downloads)).find(name=>name.startsWith('卫戍协议拿牌器配置-')&&name.endsWith('.json')),'配置导出');
  const configText=await until(async()=>{try{const text=await fs.readFile(path.join(downloads,configName),'utf8');JSON.parse(text);return text;}catch{return '';}},'配置文件写入');
  const config=JSON.parse(configText);assert.equal(config.format,'wei-cardkeeper-config');assert.deepEqual(config.plan.keep,[MID]);assert.equal(config.plan.items.length,2);
  assert.ok(!('itemSession' in config.plan)&&!('keepSession' in config.plan)&&!('draftEnabled' in config.plan));
  assert.equal(await evaluate(first.ui,"window.weiWorkbench.importConfig('{\"hello\":1}').then(r=>r.reason)"),'format');
  assert.equal(await evaluate(first.ui,`window.weiWorkbench.importConfig(${JSON.stringify(configText)}).then(r=>r.ok)`),true);
  assert.equal(await evaluate(first.ui,'JSON.stringify(window.weiWorkbench.getPlan())'),planBefore);
  assert.ok(await evaluate(first.ui,"chrome.storage.local.get('wei.workbench.plan.backup.v1').then(v=>v['wei.workbench.plan.backup.v1']?.config?.format==='wei-cardkeeper-config')"));
  assert.equal(await evaluate(first.ui,"document.querySelector('.config-restore').hidden"),false);
  await evaluate(first.ui,"window.weiWorkbench.settled().then(()=>true)");
  await evaluate(first.ui,"document.querySelector('[data-action=settings-close]').click();true");
  assert.deepEqual(await evaluate(first.game,'window.fixtureCounts'),counts);
  console.log('通过：自检不启动交易，日志导出真实 JSON、清空需二次确认，辅助工具独立打开，返回后名单完整；配置导出 / 导入覆盖前自动备份。');
  // Same saved plan, different HTTP origin: no log mixing and no automatic resume.
  const second=await open(await fixture());assert.deepEqual(await evaluate(second.ui,'window.weiWorkbench.getPlan().keep'),[MID]);assert.equal(await evaluate(second.ui,'window.weiWorkbench.getRuntimeInfo().logCount'),0);assert.deepEqual(await evaluate(second.game,'window.fixtureCounts'),{buy:0,sell:0,refresh:0});
  assert.equal(await evaluate(second.ui,'window.weiWorkbench.getPlan().items.length'),2);
  assert.equal(await evaluate(second.ui,`window.weiWorkbench.getPlan().itemSession.used[${JSON.stringify(itemKey)}]`),1); // Manual re-enable cleared the plain purchase; the merged one counts 1.
  assert.equal(await evaluate(second.ui,"document.querySelector('[data-action=draft]').getAttribute('aria-checked')"),'false');
  await evaluate(second.ui,"document.querySelector('[data-action=close]').click();true");await until(()=>evaluate(second.game,"!document.getElementById('wei-cardkeeper-host-v1')"),'关闭清理');
  await until(()=>evaluate(second.game,'!globalThis.__weiMainBridge && !globalThis.__spuiMainBridge'),'桥接清理');
  console.log('通过：名单变更及真实鼠标手动操作暂停，非整备拒绝启动，跨服名单复用、日志隔离、关闭释放桥接。');
  {
    // 打包版网页 + 打开工作台时游戏还没就绪：先提示原因，游戏就绪后在「运行自检」点“重新检查”即可连上。
    const origin=`http://${fixtureHost}:${await fixture({bundle:true,late:true})}`,url=origin+'/';
    const target=await send('Target.createTarget',{url}),game=await attach(target.targetId);
    await until(()=>evaluate(game,'Boolean(window.fixtureLoaded)'),'打包版模拟页面');
    const tab=await until(async()=> (await send('Target.getTargets',{filter:[{type:'tab',exclude:false},{exclude:true}]})).targetInfos.find(t=>t.url===url),'打包版标签');
    await send('Extensions.triggerAction',{id:loaded.id,targetId:tab.targetId});
    const findFrame=skip=>until(async()=> (await send('Target.getTargets',{filter:[{exclude:false}]})).targetInfos.find(t=>t.type==='iframe'&&t.targetId!==skip&&t.url.startsWith(`chrome-extension://${loaded.id}/panel.html`)&&new URL(t.url).searchParams.get('server')===origin),'打包版界面');
    const firstFrame=await findFrame(null),early=await attach(firstFrame.targetId);
    await until(()=>evaluate(early,"Boolean(window.weiWorkbench)&&/没有发现卫戍协议游戏接口/.test(window.weiWorkbench.getRuntimeInfo().message||'')"),'未就绪提示');
    assert.equal(await evaluate(early,'window.weiWorkbench.getRuntimeInfo().ready'),false);
    await evaluate(game,'window.fixtureExpose();true');
    await evaluate(early,"document.querySelector('[data-action=open-health]').click();document.querySelector('[data-action=health-check]').click();true");
    const nextFrame=await findFrame(firstFrame.targetId),bundled=await attach(nextFrame.targetId);
    await until(()=>evaluate(bundled,'Boolean(window.weiWorkbench?.getRuntimeInfo().ready)'),'打包版重新检查后就绪');
    assert.equal(await evaluate(bundled,'window.weiWorkbench.getRuntimeInfo().funds'),20);
    assert.equal(await evaluate(game,"document.querySelectorAll('#wei-cardkeeper-host-v1').length"),1);
    await evaluate(bundled,"document.querySelector('[data-action=close]').click();true");await until(()=>evaluate(game,"!document.getElementById('wei-cardkeeper-host-v1')&&!globalThis.__weiMainBridge"),'打包版关闭清理');
    console.log('通过：打包版网页（无 js/main.js）经 __SP__ 连接；游戏未就绪时提示原因，“重新检查”后自动重新连接。');
  }
  // 图标回归：覆盖真实扩展 iframe、当前 HTTP 服清单、手动匹配、四个入口及缺图回退。
  {
    const reset = `chrome.storage.local.set({'wei.workbench.plan.v1':{schema:3,buy:[${JSON.stringify(MID)}],keep:[],customOperators:[{id:${JSON.stringify(MID)},name:'网页新角色'}],items:[],draftEnabled:false}}).then(()=>true)`;
    await evaluate(workerSession, reset);
    const page = await open(await fixture());
    const roleRow = `[data-entry-id="${MID}"]`;
    await until(() => evaluate(page.ui, `Boolean(document.querySelector('${roleRow} .game-icon.is-loaded')?.naturalWidth)`), '手动匹配干员头像');
    assert.equal(await evaluate(page.ui, `document.querySelector('${roleRow} .game-icon').src`), page.origin + '/assets/operator-live.svg');
    assert.equal(await evaluate(page.ui, `getComputedStyle(document.querySelector('${roleRow} .game-icon')).objectFit`), 'cover');
    assert.equal(await evaluate(page.ui, `getComputedStyle(document.querySelector('${roleRow} .avatar-fallback')).visibility`), 'hidden');
    await evaluate(page.ui, `(() => {document.querySelector('[data-action=add-open]').click();const img=document.querySelector('[data-action=add-candidate][data-id="${ROLE}"] .game-icon');img.loading='eager';img.scrollIntoView({block:'center'});return true;})()`);
    await until(() => evaluate(page.ui, `Boolean(document.querySelector('[data-action=add-candidate][data-id="${ROLE}"] .game-icon.is-loaded')?.naturalWidth)`), '候选干员头像');
    await evaluate(page.ui, `(() => {const img=document.querySelector('[data-action=add-candidate][data-id="chess_fixture_0"] .game-icon');if(img){img.loading='eager';img.scrollIntoView({block:'center'});}true;return true;})()`);
    await until(() => evaluate(page.ui, `!document.querySelector('[data-action=add-candidate][data-id="chess_fixture_0"] .game-icon')`), '缺图首字回退');
    await evaluate(page.ui, `window.weiWorkbench.updateRuntime({message:'图标刷新验证'});true`);
    assert.equal(await evaluate(page.ui, `document.querySelector('[data-action=add-candidate][data-id="chess_fixture_0"] .game-icon')===null`), true);
    await evaluate(page.ui, `(() => {document.querySelector('[data-action=picker-close]').click();document.querySelector('[data-view=items]').click();document.querySelector('[data-action=item-picker-open]').click();const img=document.querySelector('[data-item-pick="chess_item_3_04_e_a"] .game-icon');img.loading='eager';img.scrollIntoView({block:'center'});return true;})()`);
    await until(() => evaluate(page.ui, `Boolean(document.querySelector('[data-item-pick="chess_item_3_04_e_a"] .game-icon.is-loaded')?.naturalWidth)`), '候选道具图标');
    assert.equal(await evaluate(page.ui, `getComputedStyle(document.querySelector('[data-item-pick="chess_item_3_04_e_a"] .game-icon')).objectFit`), 'contain');
    await evaluate(page.ui, `document.querySelector('[data-item-pick="chess_item_3_04_e_a"]').click();document.querySelector('[data-action=item-picker-close]').click();true`);
    await until(() => evaluate(page.ui, `Boolean(document.querySelector('[data-item-id="chess_item_3_04_e_a"] .game-icon.is-loaded')?.naturalWidth)`), '已添加道具图标');
    assert.equal(await evaluate(page.ui, `document.querySelector('[data-item-id="chess_item_3_04_e_a"] .game-icon').src`), page.origin + '/assets/item.svg');
    assert.equal(await evaluate(page.ui, `window.weiWorkbench.getPlan().items.find(item=>item.id==='chess_item_3_04_e_a').enabled`), false);
    assert.deepEqual(await evaluate(page.game, 'window.fixtureCounts'), {buy:0,sell:0,refresh:0});
    await evaluate(page.ui, `document.querySelector('[data-action=close]').click();true`);
    await until(() => evaluate(page.game, `!document.getElementById('wei-cardkeeper-host-v1')`), '图标测试页面关闭');
    await evaluate(workerSession, reset);
    const missing = await open(await fixture({icons:false}));
    assert.equal(await evaluate(missing.ui, `document.querySelector('${roleRow} .game-icon')===null`), true);
    assert.ok(await evaluate(missing.ui, `document.querySelector('${roleRow} .avatar-fallback').textContent`));
    assert.deepEqual(await evaluate(missing.game, 'window.fixtureCounts'), {buy:0,sell:0,refresh:0});
    await evaluate(missing.ui, `document.querySelector('[data-action=close]').click();true`);
    console.log('通过：干员 / 道具的名单与候选列表真实图片加载；手动匹配头像、裁切模式、破图回退、缺失清单不阻断，未触发游戏操作。');
  }
  assert.deepEqual(exceptions,[]);console.log('功能迁移浏览器验证通过，无脚本异常；未访问真实游戏服务器。');
} finally {
  if(child){try{await send('Browser.close');}catch{}await pause(350);if(child.exitCode===null)child.kill();}
  for(const server of servers)await new Promise(resolve=>server.close(resolve));
  await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:250}).catch(()=>{});
}
