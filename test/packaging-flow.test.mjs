import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createAutoController} from '../src/engine/auto-controller.js';
import {inspectMatch} from '../src/engine/auto-policy.js';
import {auditPackagingSale,packagingGiftDisposition} from '../src/engine/packaging.js';
import {makeSaleIntent} from '../src/engine/trade-audit.js';
import {runPackagingStaticCases} from './packaging-static-cases.mjs';
for(const result of runPackagingStaticCases({inspectMatch,auditPackagingSale,packagingGiftDisposition}))
  test('静态包装：'+result.name,()=>assert.equal(result.pass,true,JSON.stringify(result)));

const VERSION=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url))).version;
const code=fs.readFileSync(new URL('../runtime-main.js',import.meta.url),'utf8');
const A='chess_char_1_01_a',B='chess_char_1_02_a',G='chess_char_1_01_b',PACK='chess_item_5_07_e_a';
const op=(uid,id=A,items=[])=>({uid,id,kind:'chess',items});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const until=async fn=>{const end=Date.now()+1500;while(!fn()){if(Date.now()>end)throw Error('static flow timed out');await new Promise(r=>setTimeout(r,3));}};
async function fixture({keep=[],wrong=false,merge=false,chain=1,protectedBoard=false,authorizeIngredients=false,onAudit=null}={}) {
  const chess={[A]:{baseId:A,goldenId:G,upgradeNum:3,isGolden:false,tier:1,visible:true,garrisonIds:['passive']},
    [G]:{baseId:A,isGolden:true},[B]:{baseId:B,isGolden:false,tier:1,visible:true,garrisonIds:['passive']}};
  for(const id of ['chess_char_4_19_a','chess_char_1_19_a',...Array.from({length:22},(_,i)=>'chess_static_'+i)])
    chess[id]={baseId:id,isGolden:false,tier:1,visible:true,garrisonIds:['passive']};
  if(authorizeIngredients){chess[A].bonds=['pack_bond'];chess[B].bonds=['pack_bond'];}
  const gameItems={[PACK]:{name:'商业包装方案',desc:authorizeIngredients?
    '每出售8名干员，额外获得一个此装备携带者的同盟约初始干员':
    '每出售8名干员，额外获得一个此装备携带者的初始同名干员'}};
  let plan={buy:[B],keep},state={connection:{status:'online'},ui:{},me:{playerId:'static'},room:{code:'static',inMatch:true,seats:[{playerId:'static'}]},
    match:{public:{phase:'PREP',round:1,players:[{playerId:'static',autoplay:false}]},private:{alive:true,ready:false,funds:20,
      hand:authorizeIngredients?[]:[op(7),...(merge?[op(8)]:[])],board:[op(10,authorizeIngredients?B:A,[{uid:100,id:PACK}])],temp:[],
      shop:{level:2,slots:(authorizeIngredients?[A,A,B]:[B]).map(id=>({kind:'chess',id,price:0,sold:false})),refreshPrice:1,rewardOffer:null}}}};
  const listeners=new Set(),messages=[],receivers=new Set(),calls=[],audits=[],statuses=[];
  const store={get:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  let gifted=0;
  const net={async request(type,fields){calls.push({type,uid:fields.uid});const next=structuredClone(state),p=next.match.private;
    if(type==='g.buy'){const slot=p.shop.slots[fields.slot];slot.sold=true;
      p.hand.push(op(authorizeIngredients&&fields.slot<2?7+fields.slot:1000,slot.id));}
    else if(type==='g.sell'){
      p.hand=p.hand.filter(x=>x?.uid!==fields.uid);
      if(gifted<chain){gifted++;if(merge){p.hand=p.hand.filter(x=>![7,8].includes(x.uid));p.hand.push(op(2000,G));}
        else if(protectedBoard)p.board.push(op(2000));
        else p.hand.push(op(1999+gifted,wrong?B:A));}
    }else throw Error('Unexpected static intent '+type);
    const old=state;state=next;for(const fn of [...listeners])fn(state,old);return {};
  }};
  const origin='https://static-packaging.example',nonce='static-packaging-nonce-123456789';
  const win={addEventListener(t,fn){if(t==='message')receivers.add(fn);},removeEventListener(t,fn){receivers.delete(fn);},
    postMessage(msg,target){assert.equal(target,origin);messages.push(msg);for(const fn of [...receivers])fn({source:win,origin,data:msg});}};
  const garrisons={passive:{eventType:'IN_BATTLE'}};
  const sandbox={window:win,document:{querySelector:()=>null},location:{origin,href:origin+'/game/'},__SP__:{version:1,store,net},
    __weiMainConfig:{root:origin+'/game/',nonce,version:VERSION},URL,console,setTimeout,clearTimeout,Promise,Map,Set,
    fetch:async url=>({ok:true,json:async()=>String(url).includes('garrisons.json')?garrisons:String(url).includes('items.json')?gameItems:chess})};
  vm.runInNewContext(code,sandbox);await tick();await tick();
  async function command(type,data){const rid='static-'+messages.length;win.postMessage({channel:'wei.runtime.v1',side:'ui',nonce,version:VERSION,type,rid,...data},origin);await tick();await tick();return messages.findLast(x=>x.type==='response'&&x.rid===rid);}
  const ctrl=createAutoController({read:store.get,subscribe:store.subscribe,
    buy:async(slot,expected)=>(await command('buy',{slot,expectedId:expected.id,expectedPrice:expected.price,buy:plan.buy,keep:plan.keep}))?.ok===true,
    sell:async(uid,expectedSale)=>{const r=await command('sell',{uid,expectedSale,keep:plan.keep});if(!r?.ok)throw Error(r?.reason);return true;},
    refresh:async()=>{throw Error('Static refresh not expected');},useCoin:async()=>false,reward:async()=>false,mergeReward:async()=>false,
    acquireLock:async()=>()=>{},getPlan:()=>plan,chess,garrisons,gameItems,onStatus:s=>statuses.push(s),
    onAudit:async entry=>{audits.push(entry);await onAudit?.(entry,()=>{plan={...plan,keep:[A]};});}});
  return {ctrl,command,calls,audits,statuses,store,chess,dispose(){ctrl.stop('static test');sandbox.__weiMainBridge?.dispose();}};
}
for(const spec of [{name:'名单外赠员出售且旧UID保留',keep:[],sold:[1000,2000]},
  {name:'名单内赠员保留',keep:[A],sold:[1000]},
  {name:'连续两次包装赠员均出售',chain:2,sold:[1000,2000,2001]},
  {name:'混入旧库存的合成结果不盲卖',merge:true,sold:[1000]},
  {name:'新赠员位于棋盘时受部署保护',protectedBoard:true,sold:[1000]},
  {name:'错名新UID不获MAIN出售授权',wrong:true,sold:[1000]},
  {name:'赠员出售前添加保留项立即拦截',onAudit:async(entry,protect)=>{if(entry.kind==='sell_request'&&entry.meta.uid===2000)protect();},sold:[1000]}])test('控制器+真实生成MAIN静态集成：'+spec.name,async()=>{
  const f=await fixture(spec);try{
    assert.equal(await f.ctrl.start(),true);await until(()=>f.calls.some(c=>c.type==='g.sell')&&!f.ctrl.busy);
    assert.deepEqual(f.calls.filter(c=>c.type==='g.sell').map(c=>c.uid),spec.sold,JSON.stringify(f.statuses));
    if(!spec.merge)assert(f.store.get().match.private.hand.some(x=>x.uid===7));
    const snapshot=inspectMatch(f.store.get(),f.chess,{allowReward:true});
    const result=await f.command('sell',{uid:7,expectedSale:makeSaleIntent(snapshot,7),keep:[]});
    assert.equal(result?.ok,false,'preexisting operator must never be authorized');
    assert(!f.calls.some(c=>c.type==='g.sell'&&c.uid===7));
  }finally{f.dispose();}
});
test('MAIN独立拒绝保留名单中的已核验赠员',async()=>{
  const f=await fixture();try{
    assert.equal((await f.command('buy',{slot:0,expectedId:B,expectedPrice:0,buy:[B],keep:[]}))?.ok,true);
    let snapshot=inspectMatch(f.store.get(),f.chess);
    assert.equal((await f.command('sell',{uid:1000,expectedSale:makeSaleIntent(snapshot,1000),keep:[]}))?.ok,true);
    snapshot=inspectMatch(f.store.get(),f.chess);
    assert.equal((await f.command('sell',{uid:2000,expectedSale:makeSaleIntent(snapshot,2000),keep:[A]}))?.ok,false);
    assert.deepEqual(f.calls.filter(c=>c.type==='g.sell').map(c=>c.uid),[1000]);
  }finally{f.dispose();}
});
test('MAIN独立授权全为本次买入材料的包装精锐，消耗旧UID不得重售',async()=>{
  const f=await fixture({merge:true,authorizeIngredients:true});try{
    for(const [slot,id] of [[0,A],[1,A],[2,B]])
      assert.equal((await f.command('buy',{slot,expectedId:id,expectedPrice:0,buy:[A,B],keep:[]}))?.ok,true);
    let snapshot=inspectMatch(f.store.get(),f.chess);
    assert.equal((await f.command('sell',{uid:1000,expectedSale:makeSaleIntent(snapshot,1000),keep:[]}))?.ok,true);
    snapshot=inspectMatch(f.store.get(),f.chess);
    assert.equal((await f.command('sell',{uid:7,keep:[]}))?.ok,false);
    assert.equal((await f.command('sell',{uid:2000,expectedSale:makeSaleIntent(snapshot,2000),keep:[]}))?.ok,true);
    assert.equal((await f.command('sell',{uid:2000,keep:[]}))?.ok,false);
    assert.deepEqual(f.calls.filter(c=>c.type==='g.sell').map(c=>c.uid),[1000,2000]);
  }finally{f.dispose();}
});
