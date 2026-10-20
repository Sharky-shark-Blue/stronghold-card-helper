import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import * as Model from '../src/model.js';import * as Item from '../src/engine/item-policy.js';import {inspectInventory,operatorBaseId} from '../src/engine/inventory.js';
import {resolveGamePlan,tradePlanKey} from '../src/engine/plan-adapter.js';import {createSpuiTransport} from '../src/engine/transport.js';
import {createAutoController} from '../src/engine/auto-controller.js';import {runPackagingItemMergeCases} from './packaging-item-merge-static-cases.mjs';
for(const result of runPackagingItemMergeCases({...Item,inspectInventory}))test('包装装备合成黑盒：'+result.name,()=>assert.equal(result.pass,true,JSON.stringify(result)));
const ID='chess_item_5_07_e_a',GOLD='chess_item_5_07_e_b',ROLE='chess_fixture_carrier',OTHER='chess_item_fixture_other';
const VERSION=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8')).version;
const records={[ID]:{name:'商业包装方案',itemType:'EQUIP',baseId:ID,mergeable:true,upgradeNum:2,upgradeChessId:GOLD},[GOLD]:{name:'商业包装方案',itemType:'EQUIP',baseId:ID,isGolden:true,mergeable:false}};
const chess=Object.fromEntries([ROLE,'chess_char_4_19_a','chess_char_1_19_a',...Array.from({length:22},(_,i)=>'chess_fixture_'+i)].map(id=>[id,{baseId:id,isGolden:false,tier:1,name:'STATIC',visible:true,garrisonIds:[]}]));
const saved=(allow=false)=>Model.normalizePlan({items:[{id:ID,enabled:true,ownedTarget:2,allowEquippedMerge:allow}]});
test('包装专属授权默认关闭、可持久化且不隐式开启买入或自动使用',()=>{
 let plan=Model.normalizePlan({items:[{id:ID,enabled:false,ownedTarget:2}]});assert.equal(plan.items[0].allowEquippedMerge,undefined);
 plan=Model.setItemEquippedMerge(plan,ID,true).plan;assert.equal(plan.items[0].allowEquippedMerge,true);assert.equal(plan.items[0].enabled,false);assert.equal(plan.items[0].autoUse,undefined);
 assert.equal(Model.normalizePlan(JSON.parse(JSON.stringify(plan))).items[0].allowEquippedMerge,true);
 assert.equal(Model.setItemEquippedMerge(plan,ID,false).plan.items[0].allowEquippedMerge,undefined);
 assert.equal(Model.normalizePlan({items:[{id:'chess_item_3_04_e_a',allowEquippedMerge:true}]}).items[0].allowEquippedMerge,undefined);
 assert.equal(Model.setItemEquippedMerge(plan,'chess_item_3_04_e_a',true).changed,false);
});
test('授权编译到运行规则，改变授权必须改变交易配置签名',()=>{
 const a=saved(),b=saved(true),rule=resolveGamePlan(b,chess,{},records).plan.items[0];assert.equal(rule.allowEquippedMerge,true);assert.notEqual(tradePlanKey(a),tradePlanKey(b));
 assert.equal(resolveGamePlan(a,chess,{},records).plan.items[0].allowEquippedMerge,false);
});
const tick=()=>new Promise(r=>setImmediate(r));
async function fixture({id=ID,allow=true,corrupt=false}={}){
 let state={connection:{status:'online'},ui:{},me:{playerId:'static'},room:{code:'static',inMatch:true,seats:[{playerId:'static'}]},match:{public:{phase:'PREP',round:1,players:[{playerId:'static'}]},private:{alive:true,ready:false,funds:10,hand:[],board:[{uid:7,id:ROLE,kind:'chess',items:[{uid:20,id},{uid:21,id:OTHER}]}],temp:[],shop:{level:2,refreshPrice:1,slots:[{id,kind:'item',price:3,sold:false}],rewardOffer:null}}}};
 const listeners=new Set(),receivers=new Set(),messages=[],calls=[],origin='https://static-packaging.example',nonce='static-packaging-merge-test-123456789';
 const store={get:()=>state,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
 const win={addEventListener(t,fn){if(t==='message')receivers.add(fn);},removeEventListener(t,fn){receivers.delete(fn);},postMessage(msg,target){assert.equal(target,origin);messages.push(msg);for(const fn of [...receivers])fn({source:win,origin,data:msg});}};
 const net={async request(type,fields){calls.push({type,fields});if(type!=='g.buy')throw Error('forbidden static intent '+type);const next=structuredClone(state),p=next.match.private;p.funds-=3;p.shop.slots[0].sold=true;p.board[0].items=p.board[0].items.filter(i=>i.uid!==20&&(!corrupt||i.uid!==21));p.hand.push({uid:100,id:GOLD,kind:'item'});const old=state;state=next;for(const fn of [...listeners])fn(state,old);return {};}};
 const sandbox={window:win,document:{querySelector:()=>null},location:{origin,href:origin+'/game/'},__SP__:{version:1,store,net},__weiMainConfig:{root:origin+'/game/',nonce,version:VERSION},URL,console,setTimeout,clearTimeout,Promise,Map,Set,fetch:async url=>({ok:true,json:async()=>String(url).includes('items.json')?records:String(url).includes('garrisons.json')?{}:chess})};
 vm.runInNewContext(fs.readFileSync(new URL('../runtime-main.js',import.meta.url),'utf8'),sandbox);await tick();await tick();
 assert(!messages.some(message=>message.type==='bridge-error'),JSON.stringify(messages));
 const plan=resolveGamePlan(saved(allow),chess,{},records).plan;
 async function command(type,data){const rid='static-'+messages.length;win.postMessage({channel:'wei.runtime.v1',side:'ui',nonce,version:VERSION,type,rid,...data},origin);await tick();await tick();return messages.findLast(m=>m.type==='response'&&m.rid===rid);}
 const globals=Object.fromEntries(['window','location','chrome'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));let transport;
 return {store,calls,plan,command,async transport(){Object.assign(globalThis,{window:win,location:{origin},chrome:{runtime:{getManifest:()=>({version:VERSION}),sendMessage:async m=>({ok:true,...(m.type==='lock.acquire'?{token:'STATIC-LOCK'}:{})})}}});transport=createSpuiTransport({nonce,version:VERSION},()=>plan,chess);await transport.ready();await transport.acquireLock();return transport;},dispose(){transport?.dispose();sandbox.__weiMainBridge?.dispose();for(const[k,d]of Object.entries(globals))if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}};
}
function message(allow=true,equipped=[{uid:20,carrierUid:7}]){return {slot:0,expectedId:ID,expectedPrice:3,itemRule:{id:ID,enabled:true,limit:null,used:0,minFunds:null,ownedTarget:2,allowEquippedMerge:allow},expectMerge:{need:2,goldenId:GOLD,consumed:[20],equipped}};}
test('实际生成MAIN：专属授权后仅发送一次买入、核对产物并继续保护原携带者',async()=>{
 const f=await fixture();try{const reply=await f.command('buy-item',message());assert.equal(reply?.ok,true,JSON.stringify(reply));assert.equal(reply.result.itemUid,100);assert.equal(f.calls.length,1);assert.equal(f.store.get().match.private.board[0].items[0].uid,21);
 assert.equal((await f.command('sell',{uid:7,keep:[]}))?.result?.cancelled,'placement');assert.equal(f.calls.length,1);
 }finally{f.dispose();}
});
for(const spec of [{allow:false},{equipped:[{uid:20,carrierUid:8}]}])test('实际生成MAIN：拒绝未授权或伪造携带者，不发送买入 '+JSON.stringify(spec),async()=>{
 const f=await fixture();try{assert.equal((await f.command('buy-item',message(spec.allow??true,spec.equipped)))?.ok,false);assert.equal(f.calls.length,0);}finally{f.dispose();}
});
test('实际生成MAIN：购买后无关装备丢失须报错且不重试',async()=>{
 const f=await fixture({corrupt:true});try{assert.equal((await f.command('buy-item',message()))?.ok,false);assert.equal(f.calls.length,1);}finally{f.dispose();}
});
test('真实transport→生成MAIN：授权与材料证明贯通，未被旧的已配发校验阻挡',async()=>{
 const f=await fixture();try{const tr=await f.transport(),before={...inspectInventory(f.store.get().match.private,chess),funds:10,slots:[{id:ID,kind:'item',price:3,sold:false}]};const pick=Item.pickItemCandidate(before,f.plan);const receipt=await tr.buyItem(0,{...pick,planStamp:JSON.stringify(f.plan)});assert.equal(receipt.uid,100);assert.equal(f.calls.length,1);}finally{f.dispose();}
});
test('真实transport：关闭授权后即使传入旧证明也不下单',async()=>{
 const f=await fixture({allow:false});try{const tr=await f.transport();await assert.rejects(tr.buyItem(0,{id:ID,price:3,merge:message().expectMerge}),/已配发|已装备/);assert.equal(f.calls.length,0);}finally{f.dispose();}
});
test('控制器→transport→生成MAIN：完整静态购买合成只记一次抓取，不装备、不卖出或刷新',async()=>{
 const f=await fixture();let controller,counted=0;try{const tr=await f.transport();const forbidden=async()=>{throw Error('forbidden non-item intent');};controller=createAutoController({read:()=>f.store.get(),subscribe:f.store.subscribe,chess,getPlan:()=>f.plan,buyItem:(...a)=>tr.buyItem(...a),acquireLock:()=>tr.acquireLock(),onAudit:async()=>{},onRecordPurchase:async()=>{counted++;controller.stop('static finished');return{counted:true};},buy:forbidden,sell:forbidden,refresh:forbidden,useCoin:forbidden,reward:forbidden,mergeReward:forbidden});
 await controller.start();for(let i=0;i<30&&!counted;i++)await new Promise(r=>setTimeout(r,10));assert.equal(counted,1);assert.equal(f.calls.length,1);assert.equal(f.calls[0].type,'g.buy');
 }finally{controller?.stop('static cleanup');f.dispose();}
});
