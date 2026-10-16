import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectInventory, countItemCopies, countTrackedItemCopies } from '../src/engine/inventory.js';
import { inspectMatch, pickCandidate, eligibleKeepBases } from '../src/engine/auto-policy.js';
import { createAutoController } from '../src/engine/auto-controller.js';
import { resolveGamePlan, tradePlanKey } from '../src/engine/plan-adapter.js';
import * as Model from '../src/model.js';

const K='chess_test', G='chess_test_elite', OTHER='chess_other';
const chess={
  [K]:{name:'测试干员',baseId:K,goldenId:G,upgradeNum:3,isGolden:false,visible:true,isHidden:false,isDiy:false,tier:2,bonds:[],garrisonIds:[],sellPrice:1},
  [G]:{name:'测试干员',baseId:K,isGolden:true,visible:true,tier:2,garrisonIds:[],sellPrice:5},
  [OTHER]:{name:'其他干员',baseId:OTHER,isGolden:false,visible:true,tier:2,garrisonIds:[]},
};
const normal=uid=>({uid,id:K,kind:'chess',items:[]});
const elite=uid=>({uid,id:G,kind:'chess',items:[]});
function state({hand=[],board=[],temp=[],funds=20,offered=K,price=1,phase='PREP'}={}) {
  return {connection:{status:'online'},ui:{buildStale:false},me:{playerId:'me'},room:{inMatch:true,code:'room',seats:[{playerId:'me'}]},
    match:{public:{phase,round:1,players:[{playerId:'me'}]},private:{alive:true,ready:false,funds,hand,board,temp,
      shop:{slots:[{id:offered,kind:'chess',price,sold:false}],refreshPrice:1,rewardOffer:null}}}};
}
const snapshot=options=>inspectMatch(state(options),chess);
const plan=(limit=3,minFunds=null)=>({buy:[K],keep:[K],excludedBuy:[],items:[],useItems:[],keepRules:{[K]:{limit,minFunds,sourceId:K}}});

test('战场、手牌和临时区统一统计：一精二加两普通等于5，装备不算干员',()=>{
  const ctx=snapshot({board:[elite(1)],hand:[normal(2),{uid:20,kind:'item',id:'item'}],temp:[normal(3)]});
  assert.equal(ctx.ok,true);assert.equal(ctx.ownedCopies[K],5);assert.equal(ctx.units.length,3);assert.equal(ctx.items.length,1);
  assert.equal(Object.getPrototypeOf(ctx.ownedCopies),null);
});

test('本局道具持有按仍存在的 UID 统计手牌、临时区与已装备项；已用文档的永久效果不计作持有',()=>{
  const item='chess_item_3_04_e_a',gold='chess_item_3_04_e_b',document='chess_item_6_08_e_a';
  const ctx=inspectInventory({hand:[normal(1),{uid:30,id:item,kind:'item'},{uid:31,id:document,kind:'item'}],
    board:[{...normal(2),items:[{uid:32,id:item,kind:'item'},{uid:34,id:document,kind:'item'}]}],temp:[{uid:33,id:gold,kind:'item'}]},chess);
  assert.equal(countItemCopies(ctx,[item]),2);assert.equal(countItemCopies(ctx,[document]),2);
  const planItems=[{id:item},{id:document},{id:'manual_unknown'}],gameItems={
    [item]:{id:item,goldenId:gold},[gold]:{id:gold,baseId:item,isGolden:true},[document]:{id:document}};
  const owned=countTrackedItemCopies(ctx,planItems,{},[item,document],gameItems);
  assert.equal(owned[item],3);assert.equal(owned[document],1);assert.equal(owned.manual_unknown,null);
  const afterUse=inspectInventory({hand:[normal(1)],board:[{...normal(2),items:[{uid:35,id:document,kind:'item'}]}],temp:[]},chess);
  assert.equal(countTrackedItemCopies(afterUse,planItems.slice(1,2),{},[document],gameItems)[document],0,
    'permanent effect after use is not a remaining item UID');
  assert.equal(countTrackedItemCopies({...afterUse,ok:false},planItems,{},[item,document],gameItems),null,
    'unreadable inventory is unknown, not zero');
});

test('精二按图鉴或明确 golden 标记判定，不靠名称或后缀猜测',()=>{
  const ctx=snapshot({board:[elite(1)],hand:[{...normal(2),golden:true}]});
  assert.equal(ctx.ownedCopies[K],6);
});

test('已持有的干员直接满足目标，普通、低价买入路径都不能绕过',()=>{
  for (const price of [0,1,3]) assert.equal(pickCandidate(snapshot({board:[elite(1)],price}),plan(3),chess),null);
});

test('同一启用方案在卖出后自动重新满足购买条件，不需要清零或切换开关',()=>{
  const p=plan(3),key=JSON.stringify(p);
  assert.equal(pickCandidate(snapshot({board:[elite(1)]}),p,chess),null);
  assert.equal(pickCandidate(snapshot(),p,chess)?.reason,'保留');
  assert.equal(JSON.stringify(p),key);
});

test('三张普通合成一张精二，持有折算保持3，不会误触发补抓',()=>{
  const before=snapshot({board:[normal(1)],hand:[normal(2)],temp:[normal(3)]});
  const after=snapshot({board:[elite(4)]});
  assert.equal(before.ownedCopies[K],3);assert.equal(after.ownedCopies[K],3);
  assert.equal(pickCandidate(after,plan(3),chess),null);
});

test('跨区域移动不会改变折算，同 UID 同时出现在两个区域则拒绝快照',()=>{
  assert.equal(snapshot({hand:[elite(1)]}).ownedCopies[K],snapshot({temp:[elite(1)]}).ownedCopies[K]);
  const dup=snapshot({hand:[normal(1)],board:[normal(1)]});assert.equal(dup.ok,false);assert.match(dup.reason,/UID/);
});

test('缺失库存区域不能当作持有为零',()=>{
  const raw=state();delete raw.match.private.temp;
  assert.equal(inspectInventory(raw.match.private,chess).ok,false);assert.equal(inspectMatch(raw,chess).ok,false);
});

test('未知干员或无法归并的精二使数量待核对，有目标时不能按零持有购买',()=>{
  const unknown=snapshot({board:[{uid:1,id:'unknown',kind:'chess'}]});
  assert.equal(unknown.ok,true);assert.equal(unknown.ownedCopies,null);assert.equal(pickCandidate(unknown,plan(3),chess),null);
  const ambiguous={...chess,orphan:{isGolden:true}};
  const ctx=inspectMatch(state({board:[{uid:1,id:'orphan',kind:'chess'}]}),ambiguous);
  assert.equal(ctx.ownedCopies,null);assert.equal(pickCandidate(ctx,plan(3),ambiguous),null);
});

test('可核对的空库存是0而不是未知，非整备期也可只读统计但绝不允许交易',()=>{
  assert.equal(pickCandidate(snapshot(),plan(1),chess)?.reason,'保留');
  const raw=state({phase:'BATTLE',board:[elite(1)]});
  assert.equal(inspectInventory(raw.match.private,chess).ownedCopies[K],3);assert.equal(inspectMatch(raw,chess).ok,false);
});

test('商店精二本身按3份检查，不能因只缺一份而超目标买入精二',()=>{
  assert.equal(pickCandidate(snapshot({board:[elite(1)],offered:G}),plan(5),chess),null);
  assert.equal(pickCandidate(snapshot({board:[elite(1)]}),plan(5),chess)?.id,K);
  assert.equal(pickCandidate(snapshot({offered:G}),plan(3),chess)?.id,G);
});

test('持有目标未满时购买前资金仍须严格大于门槛',()=>{
  assert.equal(pickCandidate(snapshot({funds:10}),plan(3,10),chess),null);
  assert.equal(pickCandidate(snapshot({funds:11}),plan(3,10),chess)?.reason,'保留');
});

test('手动名字映射到同一真实干员后，仍按其全部普通与精二持有量判断',()=>{
  const id='manual_'+'a'.repeat(32);
  const p=Model.normalizePlan({keep:[id],customOperators:[{id,name:'测试干员'}],keepRules:{[id]:{limit:3}}});
  const mapped=resolveGamePlan(p,chess);
  assert.equal(mapped.matches[id],K);assert.equal(mapped.plan.keepRules[K].sourceId,id);
  assert.equal(pickCandidate(snapshot({temp:[elite(1)]}),mapped.plan,chess),null);
  assert.equal(pickCandidate(snapshot(),mapped.plan,chess)?.reason,'保留');
  assert.equal(tradePlanKey(p),tradePlanKey({...p,keepSession:{used:{[id]:999}}}));
});

test('手动禁用不会被实时计数或自动补抓重新开启',()=>{
  const p=Model.normalizePlan({keep:[K],disabled:{keep:[K]},keepRules:{[K]:{limit:3}},keepSession:{used:{[K]:99}}});
  const mapped=resolveGamePlan(p,chess);
  assert.deepEqual(p.disabled.keep,[K]);assert.deepEqual(mapped.plan.keep,[]);
  assert.equal(pickCandidate(snapshot({price:3}),mapped.plan,chess),null);
  assert.equal(eligibleKeepBases(snapshot({board:[elite(1)]}),plan(3),chess).blocked.has(K),true);
});

test('控制器保留购买无需界面累计确认；旧普通合成精二后保留且到目标即停买', {timeout:3000}, async()=>{
  let current=state({board:[normal(1)],hand:[normal(2)],price:2}),buys=0,sells=0,seenRunning=false,controller,timer;
  const listeners=new Set(),p=plan(3);
  let resolveDone,rejectDone;
  const done=new Promise((resolve,reject)=>{resolveDone=resolve;rejectDone=reject;});
  const publish=next=>{const previous=current;current=next;for(const listener of listeners)listener(current,previous);};
  controller=createAutoController({read:()=>current,subscribe:listener=>{listeners.add(listener);return()=>listeners.delete(listener);},
    getPlan:()=>p,chess,acquireLock:async()=>()=>{},onAudit:async()=>true,
    onStatus:status=>{if(status.running)seenRunning=true;if(seenRunning&&!status.running&&!status.starting)resolveDone(status);},
    buy:async()=>{buys++;const next=structuredClone(current);next.match.private.funds-=2;next.match.private.board=[elite(100)];next.match.private.hand=[];
      next.match.private.shop.slots[0].sold=true;publish(next);return true;},
    sell:async()=>{sells++;return false;},refresh:async()=>false,
    useCoin:async()=>false,reward:async()=>false,mergeReward:async()=>false});
  timer=setTimeout(()=>{rejectDone(new Error('controller fixture timed out'));controller.stop('fixture timeout');},1800);
  try {
    assert.equal(await controller.start(),true);const last=await done;
    assert.equal(buys,1);assert.equal(sells,0);assert.equal(last.bought,1);assert.equal(last.kept,1);
    assert.equal(inspectMatch(current,chess).ownedCopies[K],3);
  } finally {clearTimeout(timer);controller.stop('fixture complete');}
});
