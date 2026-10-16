import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectMatch} from '../src/engine/auto-policy.js';
import {pickItemCandidate,auditItemPurchase,itemMergeRule,planItemMerge} from '../src/engine/item-policy.js';

const ITEM='chess_item_3_04_e_a',CHESS='chess_char_1_01_a';
const chess={[CHESS]:{baseId:CHESS}};
const unit={uid:1,id:CHESS,kind:'chess'};
const tool=(uid=2,id=ITEM)=>({uid,id,kind:'item'});
const snapshot=(funds,sold,hand=[unit])=>inspectMatch({connection:{status:'online'},ui:{},
  me:{playerId:'me'},room:{code:'fixture',inMatch:true,seats:[{playerId:'me'}]},
  match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},
    private:{alive:true,ready:false,funds,hand,board:[],temp:[],
      shop:{slots:[{id:ITEM,kind:'item',price:2,sold}],refreshPrice:1}}}},chess);
const rule=(minFunds=null,used=0)=>({items:[{id:ITEM,sourceId:'manual_item_saved',
  name:'测试道具',limit:1,used,minFunds}]});

test('道具策略按独立启用条目的剩余次数和购买前资金严格大于门槛决定',()=>{
  const before=snapshot(10,false);
  assert.equal(pickItemCandidate(before,rule(10)),null);
  assert.equal(pickItemCandidate(before,rule(null,1)),null);
  assert.deepEqual(pickItemCandidate(before,rule(9)),
    {slot:0,id:ITEM,price:2,sourceId:'manual_item_saved',name:'测试道具'});
});
test('道具 UID、库存及扣款独立审计；旧 UID 改动和异常新增都拒绝',()=>{
  const before=snapshot(10,false),candidate=pickItemCandidate(before,rule());
  const good=snapshot(8,true,[unit,tool()]);
  assert.deepEqual(auditItemPurchase(before,good,candidate),{ok:true,item:{uid:2,id:ITEM,area:'hand',carrierUid:null}});
  assert.equal(auditItemPurchase(before,snapshot(9,true,[unit,tool()]),candidate).ok,false);
  assert.equal(auditItemPurchase(before,snapshot(8,true,[{...unit,id:'chess_char_other'},tool()]),candidate).ok,false);
  assert.equal(auditItemPurchase(before,snapshot(8,true,[unit,tool(2,'other')]),candidate).ok,false);
  assert.equal(auditItemPurchase(before,snapshot(8,true,[unit,tool(2),tool(3)]),candidate).ok,false);
});

// Mirrors the game's data/items.json: 炎国短刀 merges at 2 identical copies.
const GOLD='chess_item_3_04_e_b';
const ITEMS={[ITEM]:{name:'炎国短刀',itemType:'EQUIP',isGolden:false,mergeable:true,upgradeNum:2,upgradeChessId:GOLD,goldenId:GOLD},
  [GOLD]:{name:'炎国短刀',itemType:'EQUIP',isGolden:true,mergeable:false,upgradeNum:0,upgradeChessId:null,goldenId:GOLD}};
const lookup=id=>ITEMS[id]||null;
const mergeRule=itemMergeRule(ITEM,lookup);
const mergePlan=(used=0)=>({items:[{...rule(null,used).items[0],limit:3,merge:mergeRule}]});
const snap=(funds,sold,hand,board=[],temp=[])=>inspectMatch({connection:{status:'online'},ui:{},
  me:{playerId:'me'},room:{code:'fixture',inMatch:true,seats:[{playerId:'me'}]},
  match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},
    private:{alive:true,ready:false,funds,hand,board,temp,
      shop:{slots:[{id:ITEM,kind:'item',price:2,sold}],refreshPrice:1}}}},chess);

test('道具合成规则读取游戏数据：普通可合成装备按 upgradeNum，精锐与未知数据不合成或拒绝',()=>{
  assert.deepEqual(mergeRule,{mergeable:true,need:2,goldenId:GOLD});
  assert.deepEqual(itemMergeRule(GOLD,lookup),{mergeable:false});
  assert.equal(itemMergeRule('chess_item_missing',lookup),null);
  assert.deepEqual(itemMergeRule(ITEM,id=>id===ITEM?ITEMS[ITEM]:null),{mergeable:false},'golden record missing');
  const ctx=snap(10,false,[unit,tool(2)]);
  assert.equal(planItemMerge(ctx,ITEM,null).ok,false,'unknown rule with an owned copy fails closed');
  assert.deepEqual(planItemMerge(snap(10,false,[unit]),ITEM,null),{ok:true,merge:null});
  assert.deepEqual(planItemMerge(ctx,ITEM,{mergeable:false}),{ok:true,merge:null});
});
test('手牌或整备区已有同名道具时允许买入合成，计划消耗旧 UID 并合成精锐',()=>{
  const before=snap(10,false,[unit,tool(2)]);
  const candidate=pickItemCandidate(before,mergePlan());
  assert.deepEqual(candidate.merge,{need:2,goldenId:GOLD,consumed:[2]});
  const tempFirst=pickItemCandidate(snap(10,false,[unit],[],[tool(5)]),mergePlan());
  assert.deepEqual(tempFirst.merge.consumed,[5]);
  const merged=snap(8,true,[unit,tool(9,GOLD)]);
  assert.deepEqual(auditItemPurchase(before,merged,candidate),
    {ok:true,item:{uid:9,id:GOLD,area:'hand',carrierUid:null},merged:true});
  assert.equal(auditItemPurchase(before,snap(8,true,[unit,tool(2),tool(9,GOLD)]),candidate).ok,false,'old copy must vanish');
  assert.equal(auditItemPurchase(before,snap(8,true,[unit,tool(9)]),candidate).ok,false,'a plain copy is not the golden item');
  assert.equal(auditItemPurchase(before,snap(9,true,[unit,tool(9,GOLD)]),candidate).ok,false,'exact price only');
  assert.equal(auditItemPurchase(before,snap(8,true,[unit,tool(9,GOLD),tool(10)]),candidate).ok,false,'no extra item');
  assert.equal(auditItemPurchase(before,merged,{...candidate,merge:{...candidate.merge,consumed:[7]}}).ok,false,
    'the consumed UID must be the planned old copy');
});
test('同名道具已配发在干员身上时，买入会消耗该装备，跳过不买',()=>{
  const carrier={...unit,items:[{uid:2,id:ITEM,kind:'item'}]};
  assert.equal(pickItemCandidate(snap(10,false,[carrier]),mergePlan()),null);
  assert.equal(pickItemCandidate(snap(10,false,[],[carrier]),mergePlan()),null);
  assert.match(planItemMerge(snap(10,false,[carrier]),ITEM,mergeRule).reason,/已配发/);
  // Not owned at all: an ordinary purchase with no merge expectation.
  assert.equal(pickItemCandidate(snap(10,false,[unit]),mergePlan()).merge,undefined);
});

// ---- 自动使用 ----
import {itemUseRule,createRecency,pickItemUse,auditItemUse} from '../src/engine/item-policy.js';
const RECS={
  chess_item_2_02_e_a:{itemType:'EQUIP',kind:'consume_on_equip',desc:'装备时销毁，随机获取当前调度中心内的1名干员'},
  chess_item_5_04_e_a:{itemType:'EQUIP',kind:'consume_on_equip',desc:'装备时，目标干员和本装备销毁并进行一次特殊刷新',
    buffs:[{key:'use_equip_recruit_new_char_and_give_char_to_player_most_bond'}]},
  chess_item_5_06_e_a:{itemType:'EQUIP',kind:'consume_on_equip_or_delayed',isGolden:false},
  chess_item_3_04_e_a:{itemType:'EQUIP',kind:'stat'},
};
const useLookup=id=>RECS[id]||null;
test('自动使用只认游戏数据中装备即消耗的道具，并识别信标与博士投影的限制',()=>{
  assert.equal(itemUseRule('chess_item_9_99_e_a',useLookup),null);
  assert.equal(itemUseRule('chess_item_3_04_e_a',useLookup).usable,false);
  assert.equal(itemUseRule('chess_item_2_02_e_a',useLookup).destroysCarrier,false);
  assert.equal(itemUseRule('chess_item_5_04_e_a',useLookup).destroysCarrier,true);
  const doc=itemUseRule('chess_item_5_06_e_a',useLookup);
  assert.equal(doc.needsNormal,true); assert.equal(doc.staysEquipped,true);
});
test('最近获得顺序：首次出现与上场都会刷新时间戳，换房间重新起算',()=>{
  const r=createRecency();
  const st=(board,hand,code='A')=>({room:{code},me:{playerId:'me'},match:{private:{board,hand,temp:[]}}});
  const c=uid=>({uid,id:CHESS,kind:'chess'});
  r.observe(st([c(5)],[c(3)]));
  assert(r.rank(5)>r.rank(3),'seeded in UID order');
  r.observe(st([c(5)],[c(3),c(9)]));
  assert(r.rank(9)>r.rank(5),'a new UID is the most recent');
  r.observe(st([c(5),c(3)],[c(9)]));
  assert(r.rank(3)>r.rank(9),'placing an operator on the board (上场) makes it the most recent');
  r.observe(st([c(1)],[],'B'));
  assert.equal(r.rank(9),0);
});
const useCtx=(board,hand,extra={})=>inspectMatch({connection:{status:'online'},ui:{},
  me:{playerId:'me'},room:{code:'fixture',inMatch:true,seats:[{playerId:'me'}]},
  match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},
    private:{alive:true,ready:false,funds:extra.funds??5,hand,board,temp:extra.temp||[],
      shop:{slots:[],refreshPrice:1,rewardOffer:extra.reward||null}}}},
  {[CHESS]:{baseId:CHESS},chess_char_2_01_a:{baseId:'chess_char_2_01_a'},chess_char_1_01_b:{baseId:CHESS,isGolden:true},
   chess_char_diy:{baseId:'chess_char_diy',isDiy:true}},{allowReward:true});
const ticket={id:'chess_item_2_02_e_a',name:'紧急调度券',...itemUseRule('chess_item_2_02_e_a',useLookup)};
const beacon={id:'chess_item_5_04_e_a',name:'信标',...itemUseRule('chess_item_5_04_e_a',useLookup)};
test('自动使用目标：战场优先、按最近顺序；装备栏满跳过；信标不选保留/自编干员；博士投影不选精锐',()=>{
  const full={uid:2,id:CHESS,kind:'chess',items:[{uid:80,id:'a'},{uid:81,id:'b'}]};
  const ctx=useCtx([full,{uid:3,id:'chess_char_2_01_a',kind:'chess',items:[]},{uid:4,id:CHESS,kind:'chess',items:[]}],
    [{uid:6,id:CHESS,kind:'chess'},{uid:50,id:ticket.id,kind:'item'}]);
  const rank=uid=>({2:9,3:5,4:8,6:10})[uid]??0, chessMap={[CHESS]:{},chess_char_2_01_a:{}};
  assert.equal(pickItemUse(ctx,{useItems:[ticket]},chessMap,rank).target.uid,4);
  assert.equal(pickItemUse(ctx,{useItems:[ticket]},chessMap,rank,{tried:new Set(['50:4'])}).target.uid,3);
  assert.equal(pickItemUse(ctx,{useItems:[ticket]},chessMap,rank,{tried:new Set(['50:4','50:3'])}).target.uid,6,'then the hand');
  assert.equal(pickItemUse(ctx,{useItems:[ticket]},chessMap,rank,{done:new Set([50])}),null);
  assert.equal(pickItemUse(ctx,{useItems:[]},chessMap,rank),null);
  const b=useCtx([{uid:3,id:'chess_char_2_01_a',kind:'chess',items:[]},{uid:7,id:'chess_char_diy',kind:'chess',items:[]}],
    [{uid:51,id:beacon.id,kind:'item'}]);
  assert.equal(pickItemUse(b,{useItems:[beacon]},{chess_char_diy:{isDiy:true}},uid=>uid,{keep:new Set(['chess_char_2_01_a'])}),null,
    '信标 never destroys a kept or DIY operator');
  const doc={id:'chess_item_5_06_e_a',...itemUseRule('chess_item_5_06_e_a',useLookup)};
  const d=useCtx([{uid:9,id:'chess_char_1_01_b',kind:'chess',golden:true,items:[]}],[{uid:52,id:doc.id,kind:'item'}]);
  assert.equal(pickItemUse(d,{useItems:[doc]},{},()=>0),null,'博士投影 skips elites');
  assert.equal(pickItemUse(useCtx([],[{uid:6,id:CHESS,kind:'chess'},{uid:50,id:ticket.id,kind:'item'}],
    {reward:{slots:[{id:CHESS}]}}),{useItems:[ticket]},{},()=>0),null,'never while a free pick is open');
});
test('自动使用审计：道具离开手牌、其他道具不丢、资金不减、干员只按预期消失',()=>{
  const before=useCtx([{uid:4,id:CHESS,kind:'chess',items:[{uid:80,id:'a'}]}],[{uid:50,id:ticket.id,kind:'item'}]);
  const pick={item:{uid:50,id:ticket.id},rule:ticket,target:{uid:4,id:CHESS}};
  const good=useCtx([{uid:4,id:CHESS,kind:'chess',items:[{uid:80,id:'a'}]}],[{uid:70,id:'chess_char_2_01_a',kind:'chess'}]);
  const ok=auditItemUse(before,good,pick);
  assert.equal(ok.ok,true); assert.equal(ok.fresh.length,1);
  assert.equal(auditItemUse(before,before,pick).ok,false,'item still in hand');
  assert.equal(auditItemUse(before,useCtx([{uid:4,id:CHESS,kind:'chess',items:[]}],[]),pick).ok,false,'an equipped item vanished');
  assert.equal(auditItemUse(before,useCtx([],[]),pick).ok,false,'the carrier vanished unexpectedly');
  const bPick={item:{uid:50,id:beacon.id},rule:beacon,target:{uid:4,id:CHESS}};
  const bBefore=useCtx([{uid:4,id:CHESS,kind:'chess',items:[]}],[{uid:50,id:beacon.id,kind:'item'}]);
  const bAfter=useCtx([],[],{reward:{slots:[{id:CHESS}]}});
  const r=auditItemUse(bBefore,bAfter,bPick);
  assert.equal(r.ok,true); assert.equal(r.reward,true);
});
test('道具抓取上限 null 表示不限；缺失或无效上限仍拒绝',()=>{
  const before=snapshot(10,false),free=(used,limit)=>({items:[{...rule(null,used).items[0],limit}]});
  assert.equal(pickItemCandidate(before,free(150,null))?.id,ITEM);
  assert.equal(pickItemCandidate(before,free(9999,null)),null);
  assert.equal(pickItemCandidate(before,free(0,undefined)),null);
  assert.equal(pickItemCandidate(before,free(0,0)),null);
});
