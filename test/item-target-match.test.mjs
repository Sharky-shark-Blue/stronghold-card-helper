import test from 'node:test';
import assert from 'node:assert/strict';
import * as Model from '../src/model.js';
import { itemHoldingAllows, pickItemCandidate } from '../src/engine/item-policy.js';

const id = Model.ITEMS[0].id;
const snapshot = (round=1, inMatch=true, code='A') => ({connection:{status:'online'},me:{playerId:'me'},
  room:{code,inMatch,seats:[{playerId:'me'}]},match:{public:{round,players:[{playerId:'me'}]},private:{hand:[],board:[],temp:[]}}});
test('新局检测：首次只绑定，重连和进回合不清零，离局重开/换房/回到开局清零',()=>{
  const start=Model.normalizePlan({items:[{id,enabled:true,limit:null}],itemSession:{used:{[id]:2},epoch:4}});
  const baseline=Model.observeItemMatch(start,snapshot(3),'server');
  assert.equal(baseline.newMatch,false);assert.equal(baseline.plan.itemSession.used[id],2);
  assert.equal(Model.observeItemMatch(baseline.plan,snapshot(3),'server').changed,false);
  assert.equal(Model.observeItemMatch(baseline.plan,{connection:{status:'offline'}},'server').changed,false);
  const later=Model.observeItemMatch(baseline.plan,snapshot(4),'server').plan;
  assert.equal(later.itemSession.used[id],2);
  const restarted=Model.observeItemMatch(later,snapshot(1),'server');
  assert.equal(restarted.newMatch,true);assert.deepEqual(restarted.plan.itemSession.used,{});
  assert.equal(restarted.plan.itemSession.epoch,5);assert.equal(restarted.plan.items[0].enabled,true);
  const lobby=Model.observeItemMatch(baseline.plan,snapshot(3,false),'server').plan;
  assert.equal(Model.observeItemMatch(lobby,snapshot(3),'server').newMatch,true);
  assert.equal(Model.observeItemMatch(baseline.plan,snapshot(3,true,'B'),'server').newMatch,true);
  assert.equal(Model.observeItemMatch(baseline.plan,snapshot(3),'other-server').newMatch,true);
  assert.equal(Model.observeItemMatch(Model.normalizePlan(later),snapshot(1),'server').newMatch,true);
  const disabled=Model.normalizePlan({...later,items:[{...later.items[0],enabled:false}]});
  assert.equal(Model.observeItemMatch(disabled,snapshot(1),'server').plan.items[0].enabled,false);
});
test('道具实时持有目标独立于抓取上限，消耗后恢复，变体和已装备物品计入',()=>{
  const rule={id:'normal',sourceId:id,limit:3,used:0,minFunds:null,ownedTarget:2,targetIds:['normal','gold'],merge:{mergeable:false}};
  const ctx={ok:true,hand:[],funds:10,slots:[{kind:'item',id:'normal',price:1}],items:[]};
  assert.ok(pickItemCandidate(ctx,{items:[rule]}));
  assert.equal(pickItemCandidate({...ctx,items:[{id:'normal'},{id:'gold',area:'equipped'}]},{items:[rule]}),null);
  assert.ok(pickItemCandidate({...ctx,items:[{id:'gold'}]},{items:[rule]}));
  assert.equal(pickItemCandidate(ctx,{items:[{...rule,used:3}]}),null);
  assert.equal(itemHoldingAllows(null,rule),false);
  assert.equal(itemHoldingAllows([{id:'normal',area:'equipped'}],{...rule,ownedTarget:1,excludeEquipped:true}),true);
  const plan=Model.setItemOwnedTarget(Model.normalizePlan({items:[{id,enabled:true}]}),id,2).plan;
  assert.equal(Model.normalizePlan(plan).items[0].ownedTarget,2);
  assert.equal(Model.exportConfig(plan).plan.items[0].ownedTarget,2);
  assert.equal(Model.setItemOwnedTarget(plan,id,null).plan.items[0].ownedTarget,undefined);
});

test('买满暂停只作用于本局，新局恢复；手动禁用绝不自动恢复',()=>{
  let p=Model.normalizePlan({items:[{id,limit:1,enabled:true,ownedTarget:3,autoUse:true}],itemSession:{used:{},epoch:0}});
  p=Model.recordItemPurchase(p,id,1).plan;
  assert.equal(p.items[0].enabled,false);assert.equal(p.items[0].capPaused,true);
  p=Model.normalizePlan(JSON.parse(JSON.stringify(p)));
  const next=Model.nextItemMatch(p).plan;
  assert.equal(next.items[0].enabled,true);assert.equal(next.items[0].capPaused,undefined);
  assert.equal(next.items[0].ownedTarget,3);assert.equal(next.items[0].autoUse,true);
  assert.deepEqual(next.itemSession.used,{});
  assert.equal(Model.recordItemPurchase(next,id,1).plan.items[0].capPaused,true);
  const off=Model.setItemEnabled(p,id,false).plan;
  assert.equal(off.items[0].capPaused,undefined);assert.equal(off.itemSession.used[id],1);
  assert.equal(Model.nextItemMatch(off).plan.items[0].enabled,false);
  const saved=Model.exportConfig(p).plan.items[0];
  assert.equal(saved.enabled,true);assert.equal(saved.capPaused,undefined);
  assert.equal(Model.importConfig(Model.exportConfig(p),p).plan.items[0].capPaused,true);
  const legacy=Model.normalizePlan({items:[{id,limit:1,enabled:false}],itemSession:{used:{[id]:1}}});
  assert.equal(Model.nextItemMatch(legacy).plan.items[0].enabled,false);
  const baseline=Model.observeItemMatch(p,snapshot(4),'server').plan;
  const detected=Model.observeItemMatch(baseline,snapshot(1),'server').plan;
  assert.equal(detected.items[0].enabled,true);assert.deepEqual(detected.itemSession.used,{});
});
