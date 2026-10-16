import test from 'node:test';
import assert from 'node:assert/strict';
import * as Model from '../src/model.js';
import {resolveGamePlan,tradePlanKey} from '../src/engine/plan-adapter.js';
import {inspectMatch,pickCandidate} from '../src/engine/auto-policy.js';
import {pickItemCandidate} from '../src/engine/item-policy.js';
import {buildCatalogue,diySlotLabels,withDiyLabels} from '../src/engine/catalogue.js';
const MID='manual_'+'a'.repeat(32);
const record=(name,extra={})=>({name,tier:1,visible:true,isGolden:false,bonds:[],...extra});
const chess={chess_new:record('新干员'),chess_other:record('其他干员')};
const manual=(patch={})=>Model.normalizePlan({buy:[MID],customOperators:[{id:MID,name:'新干员'}],...patch});
const context=(id='chess_new')=>inspectMatch({connection:{status:'online'},ui:{buildStale:false},me:{playerId:'me'},room:{inMatch:true,code:'room',seats:[{playerId:'me'}]},match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},private:{alive:true,ready:false,funds:10,hand:[],board:[],temp:[],shop:{slots:[{id,kind:'chess',price:1,sold:false}],refreshPrice:1}}}},chess);
test('手动名字按当前服务器真实图鉴唯一匹配，不改原手动记录',()=>{const p=manual(),r=resolveGamePlan(p,chess);assert.deepEqual(r.plan.buy,['chess_new']);assert.equal(r.matches[MID],'chess_new');assert.equal(r.issues.length,0);assert.deepEqual(p.buy,[MID]);assert.equal(p.customOperators[0].name,'新干员');});
test('匹配支持规范化空白和大小写',()=>{const p=manual({customOperators:[{id:MID,name:'New Hero'}]});assert.equal(resolveGamePlan(p,{chess_new:record('  NEW   HERO  ')}).matches[MID],'chess_new');});
test('本服未收录的启用名字保持待识别而不猜 ID，其他规则继续',()=>{const r=resolveGamePlan(manual({buy:[MID,'chess_other']}),{chess_other:record('其他干员')});assert.deepEqual(r.plan.buy,['chess_other']);assert.deepEqual(r.issues,[]);assert.match(r.skipped[0],/待识别.*未找到/);assert.equal(r.pending[0].id,MID);assert.equal(r.matches[MID],undefined);});
test('同名对应多个真实角色时只将歧义项标为待识别',()=>{const r=resolveGamePlan(manual(),{...chess,chess_duplicate:record('新干员')});assert.deepEqual(r.issues,[]);assert.match(r.skipped[0],/待识别.*同名/);assert.equal(r.matches[MID],undefined);});
test('金卡与基础卡不会导致同名歧义，保留使用基础 ID',()=>{const r=resolveGamePlan(manual({buy:[],keep:[MID]}),{...chess,chess_new_gold:record('新干员',{baseId:'chess_new',isGolden:true})});assert.deepEqual(r.plan.keep,['chess_new']);assert.deepEqual(r.issues,[]);});
test('禁用未匹配的手动项不产生运行提示',()=>{const r=resolveGamePlan(manual({disabled:{buy:[MID]}}),{chess_other:record('其他干员')});assert.deepEqual(r.issues,[]);assert.deepEqual(r.skipped,[]);assert.deepEqual(r.plan.buy,[]);});
test('禁用买入排除该角色的低价与普通买入',()=>{const r=resolveGamePlan(manual({disabled:{buy:[MID]}}),chess);assert.deepEqual(r.plan.excludedBuy,['chess_new']);assert.equal(pickCandidate(context(),r.plan,chess),null);});
test('独立启用的保留名单优先于禁用的买入名单',()=>{const r=resolveGamePlan(manual({keep:[MID],disabled:{buy:[MID]}}),chess);assert.equal(pickCandidate(context(),r.plan,chess).reason,'保留');});
test('禁用保留仅关闭该保留规则，不影响独立买入',()=>{const r=resolveGamePlan(manual({keep:[MID],disabled:{keep:[MID]}}),chess);assert.deepEqual(r.plan.keep,[]);assert.deepEqual(r.plan.buy,['chess_new']);});
test('旧真实 ID 在本服不存在时保留记录但跳过交易',()=>{const r=resolveGamePlan(Model.normalizePlan({buy:['chess_missing','chess_new']}),chess);assert.deepEqual(r.plan.buy,['chess_new']);assert.deepEqual(r.issues,[]);assert.match(r.skipped[0],/未找到/);});
test('真实 ID 与手动绑定同一角色时去重',()=>{const r=resolveGamePlan(manual({buy:[MID,'chess_new']}),chess);assert.deepEqual(r.plan.buy,['chess_new']);});
test('隐藏手动角色跳过普通买入，但可以明确保留',()=>{const hidden={...chess,chess_new:record('新干员',{visible:false,isHidden:true})};assert.match(resolveGamePlan(manual(),hidden).skipped[0],/普通可买入/);assert.deepEqual(resolveGamePlan(manual({buy:[],keep:[MID]}),hidden).plan.keep,['chess_new']);});
test('筛选和宽度变化不触发交易方案变化，禁用变化会触发',()=>{const p=manual();assert.equal(tradePlanKey(p),tradePlanKey({...p,width:440,active:'keep',filters:{buy:{query:'x'},keep:{}}}));assert.notEqual(tradePlanKey(p),tradePlanKey({...p,disabled:{buy:[MID]}}));});
test('旧 UI 保存的开关偏好不属于真实交易方案',()=>{const p=manual();assert.equal(tradePlanKey(p),tradePlanKey({...p,draftEnabled:true}));});

test('禁用自定义干员后不买入，保存读取后保持禁用，启用后恢复买入',()=>{let p=manual();assert.equal(pickCandidate(context(),resolveGamePlan(p,chess).plan,chess).reason,'自定义');p=Model.toggleDisabled(p,MID,'buy').plan;p=Model.normalizePlan(JSON.parse(JSON.stringify(p)));let r=resolveGamePlan(p,chess);assert.deepEqual(r.plan.excludedBuy,['chess_new']);assert.equal(pickCandidate(context(),r.plan,chess),null);p=Model.toggleDisabled(p,MID,'buy').plan;r=resolveGamePlan(p,chess);assert.equal(pickCandidate(context(),r.plan,chess).reason,'自定义');});

test('保留名单禁用后按正常规则处理，低价可买且不被保留规则拦截',()=>{const p=manual({buy:[],keep:[MID],disabled:{keep:[MID]}});const r=resolveGamePlan(p,chess);assert.deepEqual(r.plan.keep,[]);const pick=pickCandidate(context(),r.plan,chess);assert.notEqual(pick,null);assert.notEqual(pick.reason,'保留');});

test('错放在干员名单的道具名称提示转移到道具区，也不进入干员买入', () => {
  const p = Model.normalizePlan({buy:[MID],customOperators:[{id:MID,name:'炎国短刀'}]});
  const r = resolveGamePlan(p, chess);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.plan.buy, []);
  assert.match(r.skipped[0],/道具区/);
});
test('新道具默认关闭；启用后配置属于交易方案，已买计数不打断运行', () => {
  const base = Model.normalizePlan({});
  const added = Model.addItem(base, 'chess_item_3_04_e_a').plan;
  const set = Model.setItemLimit(added, 'chess_item_3_04_e_a', 2).plan;
  assert.deepEqual(set.items, [{id:'chess_item_3_04_e_a', limit:2,enabled:false,minFunds:null}]);
  assert.equal(tradePlanKey(base), tradePlanKey(set));
  const enabled=Model.setItemEnabled(set,'chess_item_3_04_e_a',true).plan;
  assert.notEqual(tradePlanKey(set),tradePlanKey(enabled));
  assert.equal(tradePlanKey(enabled),tradePlanKey(Model.recordItemPurchase(enabled,'chess_item_3_04_e_a',1).plan));
  assert.notEqual(tradePlanKey(enabled),tradePlanKey(Model.setItemMinFunds(enabled,'chess_item_3_04_e_a',10).plan));
  assert.notEqual(tradePlanKey(enabled),tradePlanKey(Model.nextItemMatch(enabled).plan));
  assert.throws(() => Model.setItemLimit(set, 'chess_item_3_04_e_a', 0));
  assert.deepEqual(Model.normalizePlan({items:[{id:'chess_new',limit:3}]}).items, []);
});
test('保留干员逐条资金严格大于 X，当前持有达到目标时低价路径也不能绕过',()=>{
  let p=Model.normalizePlan({keep:['chess_new']});
  p=Model.setKeepMinFunds(p,'chess_new',10).plan;p=Model.setKeepLimit(p,'chess_new',1).plan;
  let r=resolveGamePlan(p,chess);
  assert.equal(pickCandidate(context(),r.plan,chess),null);
  assert.deepEqual(r.plan.keepRules.chess_new,{limit:1,minFunds:10,sourceId:'chess_new'});
  p=Model.setKeepMinFunds(p,'chess_new',null).plan;r=resolveGamePlan(p,chess);
  assert.equal(pickCandidate({...context(),ownedCopies:{chess_new:1}},r.plan,chess),null);
  assert.equal(pickCandidate(context(),r.plan,chess)?.reason,'保留');
  assert.deepEqual(p.disabled.keep,[]);
  assert.equal(tradePlanKey(p),tradePlanKey({...p,keepSession:{used:{chess_new:999}}}));
});
test('图鉴外道具仅由当前游戏数据唯一识别，资金门槛按买入前严格大于判断',()=>{
  const key='manual_item_new',id='chess_item_new_true';
  let p=Model.addNamedItem(Model.normalizePlan({buy:['chess_other']}),'新道具',key).plan;
  p=Model.setItemEnabled(p,key,true).plan;
  p=Model.setItemMinFunds(p,key,10).plan;
  const items={[id]:{name:'新道具'},chess_item_other:{name:'其他道具'}};
  const mapped=resolveGamePlan(p,chess,{},items);
  assert.equal(mapped.itemMatches[key],id);assert.deepEqual(mapped.plan.buy,['chess_other']);
  assert.equal(mapped.plan.items[0].id,id);
  const snapshot=funds=>inspectMatch({connection:{status:'online'},ui:{},me:{playerId:'me'},
    room:{code:'room',inMatch:true,seats:[{playerId:'me'}]},
    match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},private:{alive:true,ready:false,funds,hand:[],board:[],temp:[],shop:{slots:[{id,kind:'item',price:1,sold:false}],refreshPrice:1}}}},chess);
  assert.equal(pickItemCandidate(snapshot(10),mapped.plan),null);
  assert.equal(pickItemCandidate(snapshot(11),mapped.plan)?.id,id);
  assert.deepEqual(resolveGamePlan(p,chess,{},null).plan.items,[]);
  const ambiguous=resolveGamePlan(p,chess,{}, {...items,chess_item_duplicate:{name:'新道具'}});
  assert.equal(ambiguous.plan.items.length,0);assert.equal(ambiguous.pending[0].kind,'item');
});
test('启用道具携带当前游戏数据的合成规则；没有游戏道具数据时规则未知',()=>{
  const ITEM='chess_item_3_04_e_a',GOLD='chess_item_3_04_e_b';
  const p=Model.setItemEnabled(Model.addItem(Model.normalizePlan({}),ITEM).plan,ITEM,true).plan;
  const items={[ITEM]:{name:'炎国短刀',itemType:'EQUIP',isGolden:false,mergeable:true,upgradeNum:2,upgradeChessId:GOLD},
    [GOLD]:{name:'炎国短刀',itemType:'EQUIP',isGolden:true,mergeable:false,upgradeNum:0}};
  assert.deepEqual(resolveGamePlan(p,chess,{},items).plan.items[0].merge,{mergeable:true,need:2,goldenId:GOLD});
  assert.equal(resolveGamePlan(p,chess,{},null).plan.items[0].merge,null);
});
test('自选编队干员按本局选入的甄选槽位匹配手动名字，保留名单可自动买入，买入名单明确提示',()=>{
  const SLOT='chess_char_6_diy1_a',GOLD='chess_char_6_diy1_b';
  const diyChess={...chess,[SLOT]:record('甄选干员',{tier:6,visible:false,isDiy:true,chessType:'DIY',goldenId:GOLD,upgradeNum:3}),
    [GOLD]:record('甄选干员',{tier:6,visible:false,isDiy:true,isGolden:true,baseId:SLOT})};
  const names={char_1050_chen3:'赤刃明霄陈',char_003_kalts:'凯尔希'};
  const diy={picks:{[SLOT]:{charId:'char_1050_chen3'}},names};
  const keepPlan=Model.normalizePlan({keep:[MID],customOperators:[{id:MID,name:'赤刃明霄陈'}]});
  const r=resolveGamePlan(keepPlan,diyChess,{},null,diy);
  assert.equal(r.matches[MID],SLOT);assert.deepEqual(r.plan.keep,[SLOT]);assert.deepEqual(r.pending,[]);
  const shop=funds=>({...context(),funds,slots:[{id:SLOT,kind:'chess',price:4,sold:false}]});
  assert.equal(pickCandidate(shop(10),r.plan,diyChess)?.reason,'保留');
  // Not picked this match (or before the match starts): pending with an explicit 自选 reason, never a guess.
  const before=resolveGamePlan(keepPlan,diyChess,{},null,{picks:null,names});
  assert.deepEqual(before.plan.keep,[]);assert.match(before.pending[0].reason,/自选编队/);
  assert.match(resolveGamePlan(keepPlan,diyChess,{},null,null).pending[0].reason,/本服图鉴未找到/);
  // Another player's slot record without isDiy, or an unknown slot, is ignored.
  assert.deepEqual(resolveGamePlan(keepPlan,diyChess,{},null,{picks:{chess_new:{charId:'char_1050_chen3'}},names}).plan.keep,[]);
  // The buy list sells what it buys: a 自选 operator there is pending and never bought.
  const buyPlan=Model.normalizePlan({buy:[MID],customOperators:[{id:MID,name:'赤刃明霄陈'}]});
  const b=resolveGamePlan(buyPlan,diyChess,{},null,diy);
  assert.deepEqual(b.plan.buy,[]);assert.match(b.pending[0].reason,/保留名单/);
  assert.equal(pickCandidate(shop(10),b.plan,diyChess),null);
});
test('同一干员同时在买入与保留名单：保留门槛未满足或持有已达目标时一律不买',()=>{
  let p=Model.normalizePlan({buy:['chess_new'],keep:['chess_new']});
  p=Model.setKeepMinFunds(p,'chess_new',10).plan;
  let r=resolveGamePlan(p,chess);
  assert.deepEqual(r.plan.buy,['chess_new']);assert.deepEqual(r.plan.keep,['chess_new']);
  // Funds 10 is not strictly greater than 10: neither the buy list nor the price-1 path may buy it.
  assert.equal(pickCandidate(context(),r.plan,chess),null);
  const pricey=funds=>({...context(),funds,slots:[{id:'chess_new',kind:'chess',price:3,sold:false}]});
  assert.equal(pickCandidate(pricey(10),r.plan,chess),null);
  assert.equal(pickCandidate({...context(),funds:11},r.plan,chess)?.reason,'保留');
  // A reached live target still blocks the normal/cheap paths, without latching the switch off.
  p=Model.setKeepMinFunds(p,'chess_new',null).plan;p=Model.setKeepLimit(p,'chess_new',1).plan;
  r=resolveGamePlan(p,chess);
  assert.equal('used' in r.plan.keepRules.chess_new,false);
  assert.equal(pickCandidate({...context(),ownedCopies:{chess_new:1}},r.plan,chess),null);
  assert.equal(pickCandidate({...pricey(99),ownedCopies:{chess_new:1}},r.plan,chess),null);
  assert.deepEqual(p.disabled.keep,[]);
  assert.equal(tradePlanKey(p),tradePlanKey(Model.normalizePlan(JSON.parse(JSON.stringify(p)))));
  // Selling makes the same unchanged enabled rule eligible again.
  assert.equal(pickCandidate(pricey(10),r.plan,chess)?.reason,'保留');
  // An explicit manual disable still releases the independent ordinary buy rule.
  const freed=resolveGamePlan(Model.toggleDisabled(p,'chess_new','keep').plan,chess);
  assert.deepEqual(freed.plan.keep,[]);
  assert.equal(pickCandidate(pricey(10),freed.plan,chess)?.reason,'自定义');
});
test('道具达到抓取上限自动禁用；手动启用清零本局次数后可继续抓取',()=>{
  const ITEM='chess_item_3_04_e_a';
  let p=Model.setItemEnabled(Model.addItem(Model.normalizePlan({}),ITEM).plan,ITEM,true).plan;
  p=Model.setItemLimit(p,ITEM,2).plan;
  p=Model.recordItemPurchase(p,ITEM,1).plan;assert.equal(p.items[0].enabled,true);
  p=Model.recordItemPurchase(p,ITEM,1).plan;assert.equal(p.items[0].enabled,false);assert.equal(p.itemSession.used[ITEM],2);
  assert.equal(Model.itemCapReached(p,p.items[0]),true);
  assert.deepEqual(resolveGamePlan(p,chess).plan.items,[]);
  // Raising the cap alone does not re-arm it; only the manual enable does, and it clears the count.
  p=Model.setItemLimit(p,ITEM,3).plan;assert.equal(p.items[0].enabled,false);
  const on=Model.toggleItemEnabled(p,ITEM);
  assert.equal(on.cleared,true);assert.equal(on.plan.items[0].enabled,true);assert.equal(on.plan.itemSession.used[ITEM],undefined);
  assert.equal(resolveGamePlan(on.plan,chess).plan.items[0].used,0);
  // A manual disable below the cap keeps the count.
  const partial=Model.recordItemPurchase(on.plan,ITEM,1).plan, off=Model.toggleItemEnabled(partial,ITEM);
  assert.equal(off.plan.items[0].enabled,false);assert.equal(off.plan.itemSession.used[ITEM],1);
  // A stored plan already at its cap loads disabled.
  assert.equal(Model.normalizePlan({items:[{id:ITEM,limit:1,enabled:true}],itemSession:{used:{[ITEM]:1}}}).items[0].enabled,false);
});
test('旧累计次数不再禁用干员；实时持有目标控制购买，手动禁用设置仍保留',()=>{
  const p=Model.normalizePlan({buy:['chess_new'],keep:['chess_new'],keepRules:{chess_new:{limit:2}},keepSession:{used:{chess_new:999}}});
  assert.deepEqual(p.disabled.keep,[]);assert.ok(!('keepSession' in p));
  const r=resolveGamePlan(p,chess);
  assert.deepEqual(r.plan.keep,['chess_new']);assert.deepEqual(r.plan.keepRules.chess_new,{limit:2,minFunds:null,sourceId:'chess_new'});
  assert.equal(pickCandidate({...context(),ownedCopies:{chess_new:2}},r.plan,chess),null);
  assert.equal(pickCandidate({...context(),ownedCopies:{chess_new:1}},r.plan,chess)?.reason,'保留');
  const q=Model.normalizePlan({...p,disabled:{keep:['chess_new']},keepSession:{used:{chess_new:999}}});
  assert.deepEqual(q.disabled.keep,['chess_new']);assert.deepEqual(resolveGamePlan(q,chess).plan.keep,[]);
});
test('甄选槽位在列表中显示所选干员名，未选显示“无”',()=>{
  const diyChess={...chess,chess_char_6_diy1_a:record('甄选干员',{tier:6,visible:false,isDiy:true}),chess_char_6_diy2_a:record('甄选干员',{tier:6,visible:false,isDiy:true}),
    chess_char_6_diy1_b:record('甄选干员',{tier:6,visible:false,isDiy:true,isGolden:true,baseId:'chess_char_6_diy1_a'})};
  const operators={char_1050_chen3:{name:'赤刃明霄陈',bonds:['yanShip']}}, bonds={yanShip:{name:'炎'}};
  const cat=buildCatalogue(diyChess,bonds);
  const inMatch=diySlotLabels(diyChess,{matchPicks:{chess_char_6_diy1_a:{charId:'char_1050_chen3'}},storedPicks:{chess_char_6_diy2_a:{charId:'char_1050_chen3'}},operators});
  assert.deepEqual(Object.keys(inMatch).sort(),['chess_char_6_diy1_a','chess_char_6_diy2_a']);
  const view=withDiyLabels(cat,inMatch,bonds), slot=id=>view.operators.find(op=>op.id===id);
  assert.equal(slot('chess_char_6_diy1_a').name,'赤刃明霄陈');assert.deepEqual(slot('chess_char_6_diy1_a').bondNames,['炎']);
  assert.match(slot('chess_char_6_diy1_a').diyNote,/六阶自选 1 号.*本局编队/);
  // In a match only the server's picks count: the browser setting does not fill another slot.
  assert.equal(slot('chess_char_6_diy2_a').name,'无');assert.match(slot('chess_char_6_diy2_a').diyNote,/未选择干员/);
  assert.equal(slot('chess_new').name,'新干员');
  // Out of a match: the page's saved 自选编队 setting (next match).
  const setting=withDiyLabels(cat,diySlotLabels(diyChess,{matchPicks:null,storedPicks:{chess_char_6_diy2_a:{charId:'char_1050_chen3'}},operators}),bonds);
  assert.equal(setting.operators.find(op=>op.id==='chess_char_6_diy2_a').name,'赤刃明霄陈');
  assert.match(setting.operators.find(op=>op.id==='chess_char_6_diy2_a').diyNote,/下局生效/);
  assert.equal(setting.operators.find(op=>op.id==='chess_char_6_diy1_a').name,'无');
  // Nothing known at all → every slot shows 无; junk picks never leak into names.
  const none=diySlotLabels(diyChess,{matchPicks:null,storedPicks:{chess_char_6_diy1_a:{charId:'<b>x'}},operators});
  assert.equal(none.chess_char_6_diy1_a.name,'无');assert.equal(none.chess_char_6_diy2_a.name,'无');
  // The stored plan keeps the slot id: the label is display only.
  assert.deepEqual(resolveGamePlan(Model.normalizePlan({keep:['chess_char_6_diy1_a']}),diyChess).plan.keep,['chess_char_6_diy1_a']);
});
test('道具自动使用独立于买入启用：仅装备即消耗的道具进入 useItems（含精锐版），非消耗类只提示不阻止启动',()=>{
  const T='chess_item_2_02_e_a',TG='chess_item_2_02_e_b',B='chess_item_3_04_e_a';
  const gameItems={items:{[T]:{id:T,name:'紧急调度券',itemType:'EQUIP',kind:'consume_on_equip',goldenId:TG},
    [TG]:{id:TG,baseId:T,isGolden:true,name:'紧急调度券',itemType:'EQUIP',kind:'consume_on_equip'},
    [B]:{id:B,name:'炎国短刀',itemType:'EQUIP',kind:'stat'}}};
  const base=Model.normalizePlan({items:[{id:T,limit:1,enabled:false},{id:B,limit:1,enabled:false,autoUse:true}]});
  assert.equal(base.items[0].autoUse,undefined,'auto-use defaults to off');
  assert.equal(Model.setItemAutoUse(base,T,false).changed,false);
  const p=Model.setItemAutoUse(base,T,true).plan;
  assert.equal(Model.normalizePlan(p).items[0].autoUse,true,'the option survives normalization');
  const r=resolveGamePlan(p,chess,{},gameItems);
  assert.deepEqual(r.plan.items,[],'auto-use never enables buying');
  assert.deepEqual(r.plan.useItems.map(x=>x.id),[T,TG]);
  assert.equal(r.plan.useItems[0].destroysCarrier,false);
  assert.match(r.useNotes[B],/不是装备即消耗/);
  assert.deepEqual(r.issues,[]);
  assert.notEqual(tradePlanKey(p),tradePlanKey(base),'toggling auto-use is a trade-plan change');
  assert.equal(resolveGamePlan(p,chess).plan.useItems.length,0,'without live item data nothing is auto-used');
});
