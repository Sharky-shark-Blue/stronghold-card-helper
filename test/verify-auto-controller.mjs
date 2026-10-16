import assert from 'node:assert/strict';
import { createAutoController } from '../src/engine/auto-controller.js';
import { FLAMETAIL_ID, SWIRE_ID, SWIRE_COIN_ID, PINECONE_ID } from '../src/engine/auto-policy.js';

const cheap = 'chess_char_1_01_a';
const keep = 'chess_char_2_01_a';
const gift = 'chess_char_1_19_a';
const other = 'chess_char_2_18_a';
const farth = 'chess_char_4_20_a';
const carnelian = 'chess_char_4_24_a';
const econGain = 'chess_char_1_07_a'; // 获得时免费刷新
const econSale = 'chess_char_1_08_a'; // 售出时免费刷新
const layerGain = 'chess_char_1_02_a'; // 获得时叠层
const layerLater = 'chess_char_1_13_a'; // 休整期结束才叠层：普通优先级
const unsafeEquip = 'chess_char_2_10_a'; // 获得时赠道具，不应自动选
const econNext = 'chess_char_3_01_a'; // 获得时下个休整期收入
const viMuel = 'chess_char_6_11_a', viSaint = 'chess_char_6_02_a', viLem = 'chess_char_6_01_a';
const normal=[cheap,keep,gift,other,farth,carnelian,econGain,econSale,layerGain,layerLater,
  unsafeEquip,econNext,viMuel,viSaint,viLem,FLAMETAIL_ID,SWIRE_ID,PINECONE_ID];
const chess = Object.fromEntries(normal.map(id => [id,
  { baseId:id, goldenId:id.replace(/_a$/,'_b'), isGolden:false,
    visible:true, isHidden:false, isDiy:false, upgradeNum:3, name:id,
    garrisonIds:[id===FLAMETAIL_ID||id===SWIRE_ID||id===unsafeEquip?'gain':
      id===econGain?'econ_gain':id===econSale?'econ_sale':id===econNext?'econ_next':
      id===layerGain||id===gift||id===other?'layer_gain':
      id===layerLater?'layer_later':id===PINECONE_ID?'pine_sale':
      id===viMuel?'vi_item':id===viSaint?'vi_buff':id===viLem?'vi_combat_bond':'passive'],
    tier:Number(id.split('_')[2]) }]));
for (const id of normal) chess[chess[id].goldenId]={baseId:id,isGolden:true,name:`精锐${id}`};
const garrisons={
  passive:{eventType:'IN_BATTLE'},gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_EQUIP'},
  econ_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  econ_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  econ_next:{eventType:'SERVER_GAIN',effectKey:'SERVER_ONCE_GOLD'},
  layer_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_ADD_BOND_CHESS_ALL'},
  layer_later:{eventType:'SERVER_PREP_FIN',effectKey:'SERVER_ADD_BOND'},
  pine_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS'},
  vi_item:{eventType:'SERVER_GAIN',effectType:'SERVER_GAIN_EQUIP',effectKey:'SERVER_GAIN_EQUIP'},
  vi_buff:{eventType:'IN_BATTLE',effectType:'GAIN_BUFF',effectKey:'act1autochess_gar_eff_attrByBond'},
  vi_combat_bond:{eventType:'IN_BATTLE',effectType:'ADD_BOND',effectKey:'act1autochess_gar_event_consume_ammo'},
};
const op=(uid,id)=>({ uid,id,kind:'chess',golden:false });
const offer=(id,price)=>({kind:'chess',id,price,sold:false});
const coin=uid=>({uid,id:SWIRE_COIN_ID,kind:'item'});
const pineconeOffer=(choices=[cheap,gift])=>({source:'special',label:'松果',tier:1,queued:0,
  slots:choices.map(id=>offer(id,0))});
const mergeOffer=(choices=[cheap,keep],tier=2)=>({source:'merge',label:null,tier,queued:0,
  slots:choices.map(id=>offer(id,0))});
const plan=(buy=[],keepList=[])=>({autoPlanOn:true,buy,keep:keepList}); // stale UI switch must NOT auto-start
const state=(slots,hand=[],{funds=20,refreshPrice}={})=>({
  connection:{status:'online'},ui:{},me:{playerId:'me'},
  room:{code:'ABCD',inMatch:true,seats:[{playerId:'me'}]},
  match:{public:{phase:'PREP',round:1,players:[{playerId:'me'}]},
    private:{alive:true,ready:false,funds,hand,board:[],temp:[],shop:{slots,refreshPrice}}},
});
const until=async(predicate,timeout=600)=>{
  const start=Date.now();
  while(!predicate()) { if(Date.now()-start>timeout)throw new Error('mock controller timed out');
    await new Promise(resolve=>setTimeout(resolve,3)); }
};
function harness(initial,{ selection=plan(),giftOf=null,giftItem=null,coinOf=null,coinMerge=false,
  rewardChoices=[cheap,gift],mergeChoices=[cheap,keep],mergeTier=2,onBuy=null,onSell=null,onReward=null,
  onMergeReward=null,onCoin=null,garrisonData=garrisons,
  auditSink=async()=>{},onRefresh=null }={}) {
  let current=initial, releaseCount=0, nextUid=100;
  const listeners=new Set(), actions=[], statuses=[], audits=[];
  const read=()=>current;
  const set=(update)=>{const previous=current;current=update;for(const fn of [...listeners])fn(current,previous);};
  const change=(fn)=>{const next=structuredClone(current);fn(next.match.private,next);set(next);};
  const ctrl=createAutoController({read,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)},
    buy:async (slot,expected)=>{
      const offered=current.match.private.shop.slots[slot];
      assert.deepEqual(expected,{id:offered.id,price:offered.price});
      actions.push(['buy',slot,offered.id]);
      change((p)=>{
        p.shop.slots[slot].sold=true;
        p.funds-=offered.price;
        p.hand.push(op(nextUid++,offered.id));
        if(giftOf) {
          const gifts=Array.isArray(giftOf)?giftOf:[giftOf];
          const newGiftUids=[];
          for(const id of gifts) {newGiftUids.push(nextUid);p.hand.push(op(nextUid++,id));}
          if(gifts.length===3 && gifts.every(id=>id===gifts[0])) {
            p.hand=p.hand.filter(unit=>!newGiftUids.includes(unit.uid));
            p.hand.push(op(nextUid++,chess[gifts[0]].goldenId));
            p.shop.rewardOffer=mergeOffer(mergeChoices,mergeTier);
          }
        }
        if(giftItem) p.hand.push({uid:nextUid++,id:giftItem,kind:'item'});
        if(coinOf && offered.id===SWIRE_ID) {
          if(coinMerge) {
            p.hand=p.hand.filter(x=>x?.id!==SWIRE_COIN_ID);
            p.hand.push({uid:nextUid++,kind:'item',id:'chess_item_1_03_e_b'});
          } else p.hand.push(coin(nextUid++));
        }
        if(onBuy) onBuy({p,offered});
      });
      return true;
    },
    sell:async uid=>{
      actions.push(['sell',uid]);
      change((p,s)=>{
        const sold=p.hand.find(piece=>piece?.uid===uid);
        p.hand=p.hand.filter(piece=>piece?.uid!==uid);
        if (sold?.id===PINECONE_ID && rewardChoices) {
          p.shop.rewardOffer=pineconeOffer(rewardChoices);
        }
        if (onSell) onSell({p,s,uid,sold});
      });
      return true;
    },
    useCoin:async(itemUid,parentUid)=>{
      actions.push(['coin',itemUid,parentUid]);
      if(onCoin) return onCoin({itemUid,parentUid,change,read});
      change(p=>{const item=p.hand.find(x=>x?.uid===itemUid);
        p.hand=p.hand.filter(x=>x?.uid!==itemUid);
        p.funds+=item?.id==='chess_item_1_03_e_b'?2:1;});
      return true;
    },
    reward:async(slot,expected)=>{
      actions.push(['reward',slot,expected.id]);
      if(onReward) return onReward({slot,expected,change,read});
      change(p=>{
        assert.equal(p.shop.rewardOffer?.slots?.[slot]?.id,expected.id);
        p.shop.rewardOffer=null;
        p.hand.push(op(nextUid++,expected.id));
      });
      return true;
    },
    mergeReward:async(slot,expected)=>{
      actions.push(['merge-reward',slot,expected.id]);
      assert.equal(expected.source,'merge');
      if(onMergeReward) return onMergeReward({slot,expected,change,read});
      change(p=>{
        assert.equal(p.shop.rewardOffer?.slots?.[slot]?.id,expected.id);
        p.shop.rewardOffer=null;
        p.hand.push(op(nextUid++,expected.id));
      });
      return true;
    },
    refresh:async expected=>{
      actions.push(['refresh',expected.price]);
      assert.equal(expected.slots.length,current.match.private.shop.slots.length);
      if(!onRefresh)throw new Error('unexpected refresh');
      return onRefresh({expected,change,read});
    },
    acquireLock:async()=>()=>{releaseCount++},getPlan:()=>selection,chess,garrisons:garrisonData,
    onStatus:status=>statuses.push(status),
    onAudit:async entry=>{audits.push(entry);await auditSink(entry);},
  });
  return {ctrl,read,set,change,actions,statuses,audits,get releaseCount(){return releaseCount;}};
}

const a=harness(state([offer(cheap,1)],[op(1,cheap)]));
await new Promise(resolve=>setTimeout(resolve,20));
assert.deepEqual(a.actions,[],'saved autoPlanOn must not auto-run');
assert.equal(await a.ctrl.start(),true);
await until(()=>a.actions.length===2 && a.ctrl.busy===false);
assert.deepEqual(a.actions,[['buy',0,cheap],['sell',100]]);
assert.deepEqual(a.read().match.private.hand.map(x=>x.uid),[1]);
a.ctrl.stop('test');
assert.equal(a.releaseCount,1);

const b=harness(state([offer(cheap,0),offer(keep,4)]),{selection:plan([], [keep])});
await b.ctrl.start();
await until(()=>b.actions.length===3 && b.ctrl.busy===false);
assert.deepEqual(b.actions,[['buy',1,keep],['buy',0,cheap],['sell',101]]);
assert.deepEqual(b.read().match.private.hand.map(x=>x.id),[keep]);
b.ctrl.stop('test');

const c=harness(state([offer(FLAMETAIL_ID,3)]),{selection:plan([FLAMETAIL_ID],[gift]),giftOf:gift});
await c.ctrl.start();
await until(()=>c.actions.length===2 && c.ctrl.busy===false);
assert.deepEqual(c.actions,[['buy',0,FLAMETAIL_ID],['sell',100]],'gift must be kept, only parent sold');
assert.deepEqual(c.read().match.private.hand.map(x=>x.id),[gift]);
c.ctrl.stop('test');

const d=harness(state([offer(FLAMETAIL_ID,3)]),{selection:plan([], [FLAMETAIL_ID]),giftOf:gift});
await d.ctrl.start();
await until(()=>d.actions.length===2 && d.ctrl.busy===false);
assert.deepEqual(d.actions,[['buy',0,FLAMETAIL_ID],['sell',101]],'gift sold, parent kept');
assert.deepEqual(d.read().match.private.hand.map(x=>x.id),[FLAMETAIL_ID]);
d.ctrl.stop('test');

const e=harness(state([offer(FLAMETAIL_ID,3)]),{selection:plan([FLAMETAIL_ID]),giftOf:cheap});
await e.ctrl.start();
await until(()=>!e.ctrl.running);
assert.equal(e.actions.length,1,'unknown gift cannot cause a sale');
assert.match(e.statuses.at(-1).message,/附赠/);
assert.equal(e.releaseCount,1);

const investorTwo=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID],[gift]),giftOf:[gift,gift],
});
await investorTwo.ctrl.start();
await until(()=>investorTwo.actions.length===2 && !investorTwo.ctrl.busy);
assert.deepEqual(investorTwo.actions,[['buy',0,FLAMETAIL_ID],['sell',100]],
  'investor ×2 keeps both proven new gifts and only sells the parent');
assert.deepEqual(investorTwo.read().match.private.hand.map(x=>x.uid),[101,102]);
assert.equal(investorTwo.audits.filter(x=>x.kind==='gift').length,2);
investorTwo.ctrl.stop('test');

const investorThree=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID],[other]),giftOf:[gift,other,gift],
});
await investorThree.ctrl.start();
await until(()=>investorThree.actions.length===4 && !investorThree.ctrl.busy);
assert.deepEqual(investorThree.actions,[['buy',0,FLAMETAIL_ID],['sell',101],['sell',103],['sell',100]]);
assert.deepEqual(investorThree.read().match.private.hand.map(x=>x.uid),[102]);
assert.equal(investorThree.audits.filter(x=>x.kind==='gift').length,3);
investorThree.ctrl.stop('test');

const mergedThree=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID,cheap],[gift]),giftOf:[gift,gift,gift],
});
await mergedThree.ctrl.start();
await until(()=>mergedThree.actions.length===4 && !mergedThree.ctrl.busy);
assert.deepEqual(mergedThree.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',0,cheap],
  ['sell',105],['sell',100]],'a custom reward is claimed and processed; the new golden gift is kept');
assert.deepEqual(mergedThree.read().match.private.hand.map(x=>x.uid),[104]);
assert(mergedThree.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('焰尾')));
assert(mergedThree.audits.some(x=>x.kind==='reward_ok'&&x.meta.uid===105));
mergedThree.ctrl.stop('test');

const mergedFallback=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],
});
await mergedFallback.ctrl.start();
await until(()=>mergedFallback.actions.length===5 && !mergedFallback.ctrl.busy);
assert.deepEqual(mergedFallback.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',0,cheap],
  ['sell',104],['sell',105],['sell',100]],'only three actually owned, newly attributed UIDs are sold');
assert.deepEqual(mergedFallback.read().match.private.hand,[]);
mergedFallback.ctrl.stop('test');

const mergeEconomy=harness(state([offer(FLAMETAIL_ID,2)],[op(7,cheap)],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],mergeChoices:[other,econGain],
});
await mergeEconomy.ctrl.start();
await until(()=>mergeEconomy.actions.length===5 && !mergeEconomy.ctrl.busy);
assert.deepEqual(mergeEconomy.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',1,econGain],
  ['sell',104],['sell',105],['sell',100]],
  'the pure economy reward beats the stacking reward and only three new UIDs may be sold');
assert.deepEqual(mergeEconomy.read().match.private.hand.map(x=>x.uid),[7],
  'a preexisting non-gift UID is never touched');
assert(mergeEconomy.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('经济优先')));
mergeEconomy.ctrl.stop('test');

const mergeKept=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID],[other]),giftOf:[gift,gift,gift],mergeChoices:[other,econGain],
});
await mergeKept.ctrl.start();
await until(()=>mergeKept.actions.length===4 && !mergeKept.ctrl.busy);
assert.deepEqual(mergeKept.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',0,other],
  ['sell',104],['sell',100]], 'retained stacking reward outranks economy and is kept');
assert.deepEqual(mergeKept.read().match.private.hand.map(x=>x.uid),[105]);
assert(mergeKept.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('保留优先')));
mergeKept.ctrl.stop('test');

const mergeStack=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID,layerLater]),giftOf:[gift,gift,gift],mergeChoices:[layerLater,other],
});
await mergeStack.ctrl.start();
await until(()=>mergeStack.actions.length===5 && !mergeStack.ctrl.busy);
assert.equal(mergeStack.actions[1][2],other,
  'an immediate stacking card beats a custom-buy card that only stacks at prep end');
assert(mergeStack.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('叠层优先')));
mergeStack.ctrl.stop('test');

// Real VI-tier screenshot: first option gifts an item and must be excluded;
// the other two differ in effectType/effectKey because their effects are IN_BATTLE.
const viFallback=harness(state([offer(FLAMETAIL_ID,2)],[op(7,cheap)],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],mergeTier:6,
  mergeChoices:[viMuel,viSaint,viLem],
});
await viFallback.ctrl.start();
await until(()=>viFallback.actions.length===5 && !viFallback.ctrl.busy);
assert.deepEqual(viFallback.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',1,viSaint],
  ['sell',104],['sell',105],['sell',100]],
  'ignore VI item gift; select first safe battle-only operator, sell only three new UIDs');
assert.deepEqual(viFallback.read().match.private.hand.map(x=>x.uid),[7]);
viFallback.ctrl.stop('test');

const viKeep=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID],[viLem]),giftOf:[gift,gift,gift],mergeTier:6,
  mergeChoices:[viMuel,viSaint,viLem],
});
await viKeep.ctrl.start();
await until(()=>viKeep.actions.length===4 && !viKeep.ctrl.busy);
assert.deepEqual(viKeep.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',2,viLem],
  ['sell',104],['sell',100]], 'safe kept battle-only operator outranks first safe card');
assert.deepEqual(viKeep.read().match.private.hand.map(x=>x.uid),[105]);
viKeep.ctrl.stop('test');

const viOnlyItem=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID],[viMuel]),giftOf:[gift,gift,gift],mergeTier:6,
  mergeChoices:[viMuel],
});
await viOnlyItem.ctrl.start();
await until(()=>!viOnlyItem.ctrl.running);
assert.deepEqual(viOnlyItem.actions,[['buy',0,FLAMETAIL_ID]],
  'do not choose VI item gift even when it is kept and nothing else is available');

const unsafeReward=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],mergeChoices:[unsafeEquip],
});
await unsafeReward.ctrl.start();
await until(()=>!unsafeReward.ctrl.running);
assert.deepEqual(unsafeReward.actions,[['buy',0,FLAMETAIL_ID]],
  'a reward with an item-giving onGain trait must be left for the player');
assert(unsafeReward.read().match.private.shop.rewardOffer);
assert.match(unsafeReward.statuses.at(-1).message,/安全的选项/);

const unknownGarrisons=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],garrisonData:null,
});
await unknownGarrisons.ctrl.start();
await until(()=>!unknownGarrisons.ctrl.running);
assert.deepEqual(unknownGarrisons.actions,[['buy',0,FLAMETAIL_ID]],
  'unavailable server trait metadata cannot authorize a promotion pick');

const forgedPromotion=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],
  onBuy:({p})=>{p.shop.rewardOffer.source='special'},
});
await forgedPromotion.ctrl.start();
await until(()=>!forgedPromotion.ctrl.running);
assert.deepEqual(forgedPromotion.actions,[['buy',0,FLAMETAIL_ID]],
  'wrong-source offer cannot be selected or produce a sale');

const malformedPromotion=harness(state([offer(FLAMETAIL_ID,2)],[],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,gift,gift],
  onMergeReward:({change})=>{change(p=>{p.shop.rewardOffer=null;
    p.hand.push(op(106,cheap),op(107,keep));});return true},
});
await malformedPromotion.ctrl.start();
await until(()=>!malformedPromotion.ctrl.running);
assert.deepEqual(malformedPromotion.actions.map(x=>x[0]),['buy','merge-reward'],
  'a reward that brings unexpected additional UIDs cannot authorize any sale');

const oldGiftSafe=harness(state([offer(FLAMETAIL_ID,2)],[op(7,gift)],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[other,other,farth],
});
await oldGiftSafe.ctrl.start();
await until(()=>oldGiftSafe.statuses.some(x=>x.message?.includes('刷新需 21')));
assert.deepEqual(oldGiftSafe.actions,[['buy',0,FLAMETAIL_ID],
  ['sell',101],['sell',102],['sell',103],['sell',100]],
  'old normal gift coexists; only four NEW UIDs are sold after independent verification');
assert.deepEqual(oldGiftSafe.read().match.private.hand.map(x=>x.uid),[7]);
oldGiftSafe.ctrl.stop('test');
const oldGiftPromotion=harness(state([offer(FLAMETAIL_ID,2)],[op(7,gift)],{funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[other,other,other],mergeChoices:[cheap,econGain],
});
await oldGiftPromotion.ctrl.start();
await until(()=>oldGiftPromotion.statuses.some(x=>x.message?.includes('刷新需 21')));
assert.deepEqual(oldGiftPromotion.actions,[['buy',0,FLAMETAIL_ID],['merge-reward',1,econGain],
  ['sell',104],['sell',105],['sell',100]],
  'unrelated OLD gift remains unchanged while three NEW matching gifts produce a safe reward');
assert.deepEqual(oldGiftPromotion.read().match.private.hand.map(x=>x.uid),[7]);
oldGiftPromotion.ctrl.stop('test');
const oldGiftMerged=harness(state([offer(FLAMETAIL_ID,2)],[op(7,gift),op(8,gift)],
  {funds:20,refreshPrice:21}),{
  selection:plan([FLAMETAIL_ID]),giftOf:[gift,other,farth],
  onBuy:({p})=>{
    p.hand=p.hand.filter(unit=>![7,8,101].includes(unit.uid));
    p.hand.push(op(104,chess[gift].goldenId));
    p.shop.rewardOffer=mergeOffer();
  },
});
await oldGiftMerged.ctrl.start();
await until(()=>!oldGiftMerged.ctrl.running);
assert.deepEqual(oldGiftMerged.actions,[['buy',0,FLAMETAIL_ID]],
  'a gift merging two OLD card UIDs stops before selecting a reward or selling any UID');
assert(oldGiftMerged.statuses.at(-1).message.includes('UID'));

const f=harness(state([offer(cheap,1)]));
const stateBefore=f.read();
f.change((_p,s)=>{s.match.public.phase='COMBAT'});
assert.equal(await f.ctrl.start(),false);
assert.deepEqual(f.actions,[]);
assert.equal(stateBefore.match.public.phase,'PREP');

let unblockLock;
let lockReleased=0;
const g=createAutoController({read:()=>state([offer(cheap,1)]),subscribe:()=>()=>{},
  buy:async()=>{throw new Error('should not buy')},sell:async()=>false,refresh:async()=>{throw new Error('must not refresh')},
  useCoin:async()=>{throw new Error('must not use coin')}, reward:async()=>{throw new Error('must not choose')}, mergeReward:async()=>{throw new Error('must not choose promotion')},
  acquireLock:()=>new Promise(resolve=>{unblockLock=resolve}),getPlan:()=>plan(),chess,onStatus:()=>{}});
const starting=g.start();
g.stop('stop while waiting for the lock');
unblockLock(()=>{lockReleased++});
assert.equal(await starting,false);
assert.equal(g.running,false);
assert.equal(lockReleased,1);

const h=harness(state([offer(cheap,1)]), {auditSink:async entry=>{
  if(entry.kind==='buy_request')throw new Error('本地日志已满');
}});
assert.equal(await h.ctrl.start(),true);
await until(()=>!h.ctrl.running);
assert.deepEqual(h.actions,[],'log write failure must block the buy request');
assert.match(h.statuses.at(-1).message,/无法写入日志/);

let changed;
const i=harness(state([offer(cheap,0)]), {auditSink:async entry=>{
  if(entry.kind==='buy_request' && !changed){
    changed=true;
    i.change(p=>{p.shop.slots[0]=offer(other,0);});
  }
}});
assert.equal(await i.ctrl.start(),true);
await until(()=>!i.ctrl.running);
assert.deepEqual(i.actions,[],'a changed slot must never be bought after async logging');
assert.match(i.statuses.at(-1).message,/商店或库存已变化/);

const j=harness(state([offer(cheap,1)]));
assert.equal(await j.ctrl.start(),true);
await until(()=>j.actions.length===2 && j.ctrl.busy===false);
assert(j.audits.some(x=>x.kind==='buy_request' && x.meta.price===1));
assert(j.audits.some(x=>x.kind==='buy_ok' && x.meta.uid===100));
assert(j.audits.some(x=>x.kind==='sell_request' && x.meta.uid===100));
assert(j.audits.some(x=>x.kind==='sell_ok' && x.meta.uid===100));
j.ctrl.stop('test');
const lockMessages=[];
const k=createAutoController({read:()=>state([offer(cheap,1)]),subscribe:()=>()=>{},
  buy:async()=>{throw new Error('must not buy')},sell:async()=>false,refresh:async()=>{throw new Error('must not refresh')},
  useCoin:async()=>{throw new Error('must not use coin')}, reward:async()=>{throw new Error('must not choose')}, mergeReward:async()=>{throw new Error('must not choose promotion')},
  acquireLock:async()=>{throw new Error('插件脚本版本不匹配，请刷新游戏页')},
  getPlan:()=>plan(),chess,onStatus:status=>lockMessages.push(status),onAudit:async()=>{}});
assert.equal(await k.start(),false);
assert.match(lockMessages.at(-1).message,/插件脚本版本不匹配/,'the UI must show the true lock failure');
// Auto-refresh is armed only after a manual start; it consumes the shop's actual price,
// resumes buying when a candidate appears, and remains serial with buy/sell.
const refreshCase=harness(state([offer(other,5)],[],{funds:6,refreshPrice:1}),{onRefresh:({expected,change})=>{
  assert.equal(expected.price,1);
  change(p=>{p.funds-=1;p.shop.slots=[offer(cheap,1)];p.shop.refreshPrice=9;});
  return true;
}});
await new Promise(resolve=>setTimeout(resolve,15));
assert.deepEqual(refreshCase.actions,[], 'opening a workbench must not refresh without manual start');
assert.equal(await refreshCase.ctrl.start(),true);
await until(()=>refreshCase.actions.length===3 && !refreshCase.ctrl.busy,1200);
assert.deepEqual(refreshCase.actions,[['refresh',1],['buy',0,cheap],['sell',100]]);
assert(refreshCase.audits.some(x=>x.kind==='refresh_request'&&x.meta.price===1));
assert(refreshCase.audits.some(x=>x.kind==='refresh_ok'&&x.meta.refreshed===1));
assert(refreshCase.statuses.some(x=>x.refreshed===1));
refreshCase.ctrl.stop('test');

const rejected=harness(state([offer(other,5)],[],{funds:10,refreshPrice:2}),{onRefresh:()=>false});
await rejected.ctrl.start();
await until(()=>!rejected.ctrl.running);
assert.deepEqual(rejected.actions,[['refresh',2]],'a rejected refresh must not be blindly retried');
assert.match(rejected.statuses.at(-1).message,/不会自动重试/);

const priceMismatch=harness(state([offer(other,5)],[],{funds:10,refreshPrice:1}),{onRefresh:({change})=>{
  change(p=>{p.funds-=2;p.shop.slots=[offer(cheap,1)]});return true;
}});
await priceMismatch.ctrl.start();
await until(()=>!priceMismatch.ctrl.running);
assert.deepEqual(priceMismatch.actions,[['refresh',1]],'unexpected spending stops before buying');
assert.match(priceMismatch.statuses.at(-1).message,/扣费无法核对/);

let changedDuringAudit=false;
const auditChanged=harness(state([offer(other,5)],[],{funds:10,refreshPrice:1}),{
  auditSink:async entry=>{if(entry.kind==='refresh_request'&&!changedDuringAudit){
    changedDuringAudit=true;auditChanged.change(p=>{p.shop.refreshPrice=2});
  }},
  onRefresh:()=>{throw new Error('must not refresh after a price change')},
});
await auditChanged.ctrl.start();
await until(()=>!auditChanged.ctrl.running);
assert.deepEqual(auditChanged.actions,[], 'a changed cost during audit must block the refresh');
assert.match(auditChanged.statuses.at(-1).message,/刷新价已变化/);

const insufficient=harness(state([offer(other,5)],[],{funds:0,refreshPrice:1}),{
  onRefresh:()=>{throw new Error('must not spend more than current funds')},
});
assert.equal(await insufficient.ctrl.start(),true);
await until(()=>insufficient.statuses.some(x=>x.message?.includes('刷新需 1 资金')));
assert.deepEqual(insufficient.actions,[]);
insufficient.ctrl.stop('test');

let finishRefresh;
const pendingRefresh=harness(state([offer(other,5)],[],{funds:10,refreshPrice:1}),{
  onRefresh:()=>new Promise(resolve=>{finishRefresh=resolve}),
});
await pendingRefresh.ctrl.start();
await until(()=>!!finishRefresh);
pendingRefresh.ctrl.stop('test');
finishRefresh(true);
await new Promise(resolve=>setTimeout(resolve,10));
assert.deepEqual(pendingRefresh.actions,[['refresh',1]],'stopping an in-flight refresh cannot start a later buy');

let freeCalls=0;
const free=harness(state([offer(other,5)],[],{funds:10,refreshPrice:0}),{onRefresh:({change})=>{
  ++freeCalls;
  change(p=>{p.shop.slots=[offer(freeCalls%2?gift:other,5)];p.shop.refreshPrice=freeCalls>=3?11:0});
  return true;
}});
await free.ctrl.start();
await until(()=>freeCalls===3 && !free.ctrl.busy,3500);
assert.equal(free.actions.length,3,'free refresh must continue beyond one attempt without a hard total-cost cap');
assert(free.statuses.some(x=>x.refreshed===3));
free.ctrl.stop('test');

// Regression: the old per-start 40-buy ceiling must not stop either buy/sell or
// the subsequent refresh. Many zero-price fixture slots keep this test fast and
// avoid spending a real game's funds. Refresh is still only armed by manual start.
let afterFortyRefreshes=0;
const beyondForty=harness(state(Array.from({length:45},()=>offer(cheap,0)),[],{funds:20,refreshPrice:1}),{
  onRefresh:({expected,change})=>{
    afterFortyRefreshes++;
    assert.equal(expected.price,1);
    change(p=>{p.funds-=1;p.shop.slots=[offer(cheap,0)];p.shop.refreshPrice=21;});
    return true;
  },
});
await new Promise(resolve=>setTimeout(resolve,10));
assert.deepEqual(beyondForty.actions,[],'unlimited buying still requires manual activation');
assert.equal(await beyondForty.ctrl.start(),true);
await until(()=>beyondForty.actions.filter(x=>x[0]==='buy').length===46&&
  beyondForty.actions.filter(x=>x[0]==='sell').length===46&&
  beyondForty.actions.filter(x=>x[0]==='refresh').length===1&&
  !beyondForty.ctrl.busy,6000);
assert.equal(afterFortyRefreshes,1,'refresh must continue after more than 40 purchases');
assert.equal(beyondForty.read().match.private.hand.length,0,'all purchases still sell only freshly created UIDs');
assert.equal(beyondForty.read().match.private.funds,19);
assert(beyondForty.statuses.some(x=>x.bought===46&&x.sold===46));
beyondForty.ctrl.stop('test');
// Regression: no artificial 40-purchase ceiling; old inventory never joins the sale queue.
const repeat=harness(state([offer(cheap,0)],[op(1,keep)],{funds:20,refreshPrice:99}),{
  onSell:({p})=>{if(repeat.actions.filter(a=>a[0]==='buy').length<45)p.shop.slots=[offer(cheap,0)];},
});
assert.deepEqual(repeat.actions,[]);
assert.equal(await repeat.ctrl.start(),true);
await until(()=>repeat.actions.filter(a=>a[0]==='sell').length===45&&!repeat.ctrl.busy,2500);
assert.equal(repeat.actions.filter(a=>a[0]==='buy').length,45);
assert.equal(new Set(repeat.actions.filter(a=>a[0]==='sell').map(a=>a[1])).size,45);
assert.deepEqual(repeat.read().match.private.hand.map(x=>x.uid),[1]);
assert(repeat.statuses.some(s=>s.bought===45));
repeat.ctrl.stop('test');
assert.equal(repeat.releaseCount,1);
// The coin must be generated by THIS Swire purchase, used on that fresh unit without replacing
// equipment, checked as +1 funds, then and only then can that purchased UID be sold.
const swireCase=harness(state([offer(SWIRE_ID,1)],[],{funds:20,refreshPrice:21}),{coinOf:SWIRE_COIN_ID});
await swireCase.ctrl.start();
await until(()=>swireCase.actions.length===3 && !swireCase.ctrl.busy);
assert.deepEqual(swireCase.actions,[['buy',0,SWIRE_ID],['coin',101,100],['sell',100]]);
assert.equal(swireCase.read().match.private.funds,20);
assert.equal(swireCase.read().match.private.hand.length,0);
assert(swireCase.audits.some(x=>x.kind==='coin_request'&&x.meta.itemUid===101));
assert(swireCase.audits.some(x=>x.kind==='coin_ok'&&x.meta.amount===1));
swireCase.ctrl.stop('test');

const retainedSwire=harness(state([offer(SWIRE_ID,3)],[],{funds:20,refreshPrice:21}),
  {selection:plan([], [SWIRE_ID]),coinOf:SWIRE_COIN_ID});
await retainedSwire.ctrl.start();
await until(()=>retainedSwire.actions.length===2 && !retainedSwire.ctrl.busy);
assert.deepEqual(retainedSwire.actions,[['buy',0,SWIRE_ID],['coin',101,100]],'keep protects the purchased Swire after coin use');
assert.deepEqual(retainedSwire.read().match.private.hand.map(x=>x.id),[SWIRE_ID]);
retainedSwire.ctrl.stop('test');

const coinMerged=harness(state([offer(SWIRE_ID,1)],[coin(1)],{funds:20,refreshPrice:25}),
  {coinOf:SWIRE_COIN_ID,coinMerge:true});
await coinMerged.ctrl.start();
await until(()=>coinMerged.actions.length===3 && !coinMerged.ctrl.busy);
assert.deepEqual(coinMerged.actions,[['buy',0,SWIRE_ID],['coin',101,100],['sell',100]],
  'the merged golden coin is used (+2) and the verified Swire is still sold');
assert(coinMerged.audits.some(x=>x.kind==='coin_ok'&&x.meta.amount===2));
assert.equal(coinMerged.read().match.private.funds,21);
assert.equal(coinMerged.read().match.private.hand.length,0);
coinMerged.ctrl.stop('test');

const incorrectCoin=harness(state([offer(SWIRE_ID,1)],[],{funds:20,refreshPrice:25}),{
  coinOf:SWIRE_COIN_ID,onCoin:({itemUid,change})=>{
    change(p=>{p.hand=p.hand.filter(x=>x.uid!==itemUid);p.funds+=2});return true;
  },
});
await incorrectCoin.ctrl.start();
await until(()=>incorrectCoin.actions.length===3 && !incorrectCoin.ctrl.busy);
assert.deepEqual(incorrectCoin.actions.map(x=>x[0]),['buy','coin','sell'],
  'a wrong coin receipt downgrades to a warning; the verified sale continues');
assert(incorrectCoin.audits.some(x=>x.kind==='coin_warn'&&/资金/.test(x.summary)));
assert(incorrectCoin.audits.some(x=>x.kind==='sell_ok'));
incorrectCoin.ctrl.stop('test');

// User-confirmed scope: every coin in hand (any origin) is converted to funds before buying.
const drained=harness(state([offer(cheap,1)],[coin(1),{uid:2,id:'chess_item_1_03_e_b',kind:'item'},op(9,cheap)],
  {funds:20,refreshPrice:25}),{selection:plan([cheap])});
await drained.ctrl.start();
await until(()=>drained.actions.length===4 && !drained.ctrl.busy);
assert.deepEqual(drained.actions,[['coin',1,9],['coin',2,9],['buy',0,cheap],['sell',100]]);
assert.equal(drained.read().match.private.funds,22);
assert(drained.audits.some(x=>x.kind==='coin_ok'&&x.meta.amount===2));
drained.ctrl.stop('test');

// No chess with a free equipment slot: warn once, never retry that coin, keep trading.
const noTarget=harness(state([offer(cheap,1)],[coin(1)],{funds:20,refreshPrice:25}),{selection:plan([cheap])});
await noTarget.ctrl.start();
await until(()=>noTarget.actions.length===2 && !noTarget.ctrl.busy);
assert.deepEqual(noTarget.actions.map(x=>x[0]),['buy','sell']);
assert(noTarget.audits.some(x=>x.kind==='coin_warn'),'no safe carrier: warn and continue');
assert.equal(noTarget.audits.filter(x=>x.kind==='coin_warn').length,1,'the failed coin uid is never retried');
noTarget.ctrl.stop('test');

// Ordinary equipment gifts are left in inventory untouched, as the user requested.
const equipment=harness(state([offer(carnelian,1)],[],{funds:20,refreshPrice:21}),
  {giftItem:'chess_item_3_05_e_a'});
await equipment.ctrl.start();
await until(()=>equipment.actions.length===2 && !equipment.ctrl.busy);
assert.deepEqual(equipment.actions,[['buy',0,carnelian],['sell',100]]);
assert.deepEqual(equipment.read().match.private.hand.map(x=>x.id),['chess_item_3_05_e_a']);
equipment.ctrl.stop('test');

// Pinecone's offer must come from THIS newly bought UID's sale. Economic
// rewards outrank stacking/kept ordinary options; only the new picked UID is sold.
const pineKeep=harness(state([offer(PINECONE_ID,1)],[],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID,cheap],[econGain]),rewardChoices:[gift,econGain,cheap],
});
await pineKeep.ctrl.start();
await until(()=>pineKeep.actions.length===3 && !pineKeep.ctrl.busy);
assert.deepEqual(pineKeep.actions,[['buy',0,PINECONE_ID],['sell',100],['reward',1,econGain]]);
assert.equal(pineKeep.read().match.private.hand[0].id,econGain,'the economic reward on the keep list must not be sold');
assert(pineKeep.audits.some(x=>x.kind==='reward_ok'&&x.meta.uid===101));
pineKeep.ctrl.stop('test');

const pineEconomySale=harness(state([offer(PINECONE_ID,1)],[op(7,cheap)],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID,econSale],[gift]),rewardChoices:[gift,econSale,cheap],
});
await pineEconomySale.ctrl.start();
await until(()=>pineEconomySale.actions.length===4 && !pineEconomySale.ctrl.busy);
assert.deepEqual(pineEconomySale.actions,[['buy',0,PINECONE_ID],['sell',100],
  ['reward',1,econSale],['sell',101]],
  'economy triggered on sale beats kept stacking and custom-buy options; sell only new UID');
assert.deepEqual(pineEconomySale.read().match.private.hand.map(x=>x.uid),[7]);
assert(pineEconomySale.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('经济优先')));
pineEconomySale.ctrl.stop('test');

const pineLayer=harness(state([offer(PINECONE_ID,1)],[],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID,cheap],[cheap]),rewardChoices:[cheap,layerGain,layerLater],
});
await pineLayer.ctrl.start();
await until(()=>pineLayer.actions.length===4 && !pineLayer.ctrl.busy);
assert.deepEqual(pineLayer.actions,[['buy',0,PINECONE_ID],['sell',100],
  ['reward',1,layerGain],['sell',101]], 'immediate layers outrank a kept ordinary card');
assert(pineLayer.audits.some(x=>x.kind==='reward_request'&&x.summary.includes('叠层优先')));
pineLayer.ctrl.stop('test');

const pineFallback=harness(state([offer(PINECONE_ID,1)],[],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID]),rewardChoices:[cheap,layerLater],
});
await pineFallback.ctrl.start();
await until(()=>pineFallback.actions.length===4 && !pineFallback.ctrl.busy);
assert.deepEqual(pineFallback.actions,[['buy',0,PINECONE_ID],['sell',100],['reward',0,cheap],['sell',101]],
  'a free reward not on keep list may sell only its newly attributed UID');
assert.equal(pineFallback.read().match.private.hand.length,0);
pineFallback.ctrl.stop('test');

const pineNoTraits=harness(state([offer(PINECONE_ID,1)],[],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID]),rewardChoices:[econGain,cheap],garrisonData:null,
});
await pineNoTraits.ctrl.start();
await until(()=>!pineNoTraits.ctrl.running);
assert.deepEqual(pineNoTraits.actions,[['buy',0,PINECONE_ID],['sell',100]],
  'unknown trait metadata cannot silently choose a Pinecone reward');
assert(pineNoTraits.read().match.private.shop.rewardOffer);
assert.match(pineNoTraits.statuses.at(-1).message,/特质图鉴缺失/);

const fakePine=harness(state([offer(PINECONE_ID,1)],[],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID]),onSell:({p})=>{p.shop.rewardOffer.label='不是松果';},
});
await fakePine.ctrl.start();
await until(()=>!fakePine.ctrl.running);
assert.deepEqual(fakePine.actions.map(x=>x[0]),['buy','sell'],'unknown reward must never be auto-picked');

const mergePine=harness(state([offer(PINECONE_ID,1)],[op(1,cheap),op(2,cheap)],{funds:20,refreshPrice:21}),{
  selection:plan([PINECONE_ID]),rewardChoices:[cheap],
});
await mergePine.ctrl.start();
await until(()=>!mergePine.ctrl.running);
assert.deepEqual(mergePine.actions.map(x=>x[0]),['buy','sell'],'a reward that would merge old copies is left to the user');
assert.match(mergePine.statuses.at(-1).message,/合成旧干员/);
assert(mergePine.read().match.private.shop.rewardOffer?.slots.length===1);

const preexistingPine=state([offer(PINECONE_ID,1)]);
preexistingPine.match.private.shop.rewardOffer=pineconeOffer([cheap]);
const oldReward=harness(preexistingPine,{selection:plan([PINECONE_ID])});
assert.equal(await oldReward.ctrl.start(),false);
assert.deepEqual(oldReward.actions,[],'an already-pending reward cannot be claimed on startup');

// Source and timed regression: 300 ms is a minimum gap, not a blind retry timer.
const {readFile}=await import('node:fs/promises');
const controllerSource=await readFile(new URL('../src/engine/auto-controller.js',import.meta.url),'utf8');
assert.match(controllerSource,/const REFRESH_GAP_MS = 300;/);
// No overlapping or unverified refreshes, but the fixed minimum is now ~300ms instead of 900ms.
const times=[];
const paced=harness(state([offer(other,5)],[],{funds:10,refreshPrice:0}),{onRefresh:({change})=>{
  times.push(Date.now());
  change(p=>{p.shop.slots=[offer(times.length%2?gift:other,5)];p.shop.refreshPrice=times.length>=2?11:0});
  return true;
}});
await paced.ctrl.start();
await until(()=>times.length===2 && !paced.ctrl.busy,1400);
assert(times[1]-times[0]>=275 && times[1]-times[0]<850,
  `refresh gap should be fast, ACK-gated and paced: ${times[1]-times[0]}ms`);
assert.equal(paced.actions.filter(x=>x[0]==='refresh').length,2);
paced.ctrl.stop('test');
console.log('第二批验证通过：诗怀雅赠币、松果免费选卡、焰尾多份赠品及合成奖励、连续45次买卖与300毫秒刷新节奏。');
console.log('auto-controller: investor ×2/×3 gifts, owned-only merge reward/UID sales and abort guards, Swire/Pinecone and 300ms refresh passed');

// 自动使用：消耗类道具装备给最近获得的干员（战场优先），装备栏满跳过，被拒换下一名，绝不替换已佩戴装备
{
  const TICKET='chess_item_2_02_e_a';
  const rule={id:TICKET,sourceId:TICKET,name:'紧急调度券',usable:true,kind:'consume_on_equip',
    destroysCarrier:false,needsNormal:false,staysEquipped:false,promotes:false};
  let current=state([offer(cheap,99)],[op(1,cheap),{uid:50,id:TICKET,kind:'item'}],{funds:5,refreshPrice:50});
  current.match.private.board=[{...op(2,gift),items:[{uid:60,id:'chess_item_x'},{uid:61,id:'chess_item_y'}]},
    {...op(3,keep),items:[]},{...op(4,other),items:[]}];
  const ranks={1:10,2:9,4:8,3:5};
  const listeners=new Set(), calls=[], audits=[];
  const set=next=>{const prev=current;current=next;for(const fn of [...listeners])fn(current,prev);};
  const ctrl=createAutoController({read:()=>current,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    buy:async()=>{throw new Error('must not buy')},sell:async()=>{throw new Error('must not sell')},
    refresh:async()=>{throw new Error('must not refresh')},useCoin:async()=>{throw new Error('must not use coin')},
    reward:async()=>{throw new Error('must not choose')},mergeReward:async()=>{throw new Error('must not choose')},
    useItem:async(itemUid,targetUid,expectedId)=>{
      calls.push([itemUid,targetUid,expectedId]);
      if(targetUid===4) throw new Error('道具使用被游戏拒绝');
      const next=structuredClone(current);
      next.match.private.hand=next.match.private.hand.filter(x=>x?.uid!==itemUid);
      next.match.private.hand.push(op(70,farth)); // the ticket grants one shop operator
      set(next); return {consumed:true,reward:false};
    },
    recency:uid=>ranks[uid]??0,acquireLock:async()=>()=>{},getPlan:()=>({...plan(),useItems:[rule]}),chess,
    onStatus:()=>{},onAudit:async entry=>{audits.push(entry);}});
  assert.equal(await ctrl.start(),true);
  await until(()=>audits.some(x=>x.kind==='use_ok') && !ctrl.busy);
  assert.deepEqual(calls,[[50,4,TICKET],[50,3,TICKET]],
    'board first by recency; the full carrier (UID 2) is skipped; a refusal moves on to the next operator');
  assert(audits.some(x=>x.kind==='use_warn' && x.meta.targetUid===4));
  assert(audits.some(x=>x.kind==='use_ok' && x.meta.itemUid===50 && x.meta.targetUid===3));
  assert.equal(ctrl.running,true,'a verified auto-use keeps the run going');
  ctrl.stop('test');

  // A used item that opens a free pick (寻呼模块/信标) pauses for the user.
  const PAGER='chess_item_4_01_e_a';
  let cur2=state([offer(cheap,99)],[op(1,cheap),{uid:51,id:PAGER,kind:'item'}],{funds:5,refreshPrice:50});
  const l2=new Set();
  const set2=next=>{const prev=cur2;cur2=next;for(const fn of [...l2])fn(cur2,prev);};
  const c2=createAutoController({read:()=>cur2,subscribe:fn=>{l2.add(fn);return()=>l2.delete(fn);},
    buy:async()=>{throw new Error('must not buy')},sell:async()=>false,refresh:async()=>{throw new Error('must not refresh')},
    useCoin:async()=>{throw new Error('x')},reward:async()=>{throw new Error('x')},mergeReward:async()=>{throw new Error('x')},
    useItem:async itemUid=>{const next=structuredClone(cur2);
      next.match.private.hand=next.match.private.hand.filter(x=>x?.uid!==itemUid);
      next.match.private.shop.rewardOffer={source:'special',label:'寻呼模块',tier:1,queued:0,slots:[offer(gift,0),offer(other,0)]};
      set2(next);return {consumed:true,reward:true};},
    recency:()=>0,acquireLock:async()=>()=>{},chess,onStatus:()=>{},
    getPlan:()=>({...plan(),useItems:[{...rule,id:PAGER,name:'寻呼模块'}]})});
  assert.equal(await c2.start(),true);
  await until(()=>!c2.running);
  assert.equal(c2.running,false);
}
console.log('auto-controller: 道具自动使用（最近干员、满栏跳过、被拒换人、免费选卡暂停）通过');
