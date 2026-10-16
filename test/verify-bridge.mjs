import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const VERSION=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8')).version;
const script = fs.readFileSync(new URL('../runtime-main.js', import.meta.url), 'utf8')
  .replace("import(new URL('js/store.js', root))", 'Promise.resolve({store:globalThis.__testStore})')
  .replace("import(new URL('js/ui/gameActions.js', root))", 'Promise.resolve({actions:globalThis.__testActions})');
const FLAME='chess_char_4_19_a', GIFT='chess_char_1_19_a', CHEAP='chess_char_1_01_a';
const OTHER='chess_char_2_18_a', FARTH='chess_char_4_20_a';
const SWIRE='chess_char_3_03_a', COIN='chess_item_1_03_e_a', PINECONE='chess_char_3_10_a';
const ECON='chess_char_1_07_a', ECONSALE='chess_char_1_08_a';
const LAYER='chess_char_1_02_a', LATER='chess_char_1_13_a', BAD='chess_char_2_10_a';
const VI_MUEL='chess_char_6_11_a', VI_SAINT='chess_char_6_02_a', VI_LEM='chess_char_6_01_a';
const chess = Object.fromEntries([FLAME,GIFT,OTHER,FARTH,CHEAP,SWIRE,PINECONE,
  ECON,ECONSALE,LAYER,LATER,BAD,VI_MUEL,VI_SAINT,VI_LEM,
  ...Array.from({ length: 30 }, (_,i)=>`chess_char_1_${100+i}_a`)].map(id =>
  [id, {baseId:id, goldenId:id.replace(/_a$/,'_b'), isGolden:false, visible:true,
    upgradeNum:3, tier:Number(id.split('_')[2]),garrisonIds:[
      id===FLAME||id===SWIRE||id===BAD?'gain':
        id===GIFT||id===LAYER||id===OTHER?'layer_gain':
        id===ECON?'econ_gain':id===ECONSALE?'econ_sale':
        id===LATER?'layer_later':id===PINECONE?'pine_sale':
        id===VI_MUEL?'vi_item':id===VI_SAINT?'vi_buff':id===VI_LEM?'vi_combat_bond':'passive']}]));
for (const id of Object.keys(chess)) chess[id.replace(/_a$/,'_b')]={baseId:id,isGolden:true};
const garrisons={passive:{eventType:'IN_BATTLE'},
  gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_EQUIP'},
  layer_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_ADD_BOND_CHESS_ALL'},
  econ_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  econ_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  layer_later:{eventType:'SERVER_PREP_FIN',effectKey:'SERVER_ADD_BOND'},
  pine_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS'},
  vi_item:{eventType:'SERVER_GAIN',effectType:'SERVER_GAIN_EQUIP',effectKey:'SERVER_GAIN_EQUIP'},
  vi_buff:{eventType:'IN_BATTLE',effectType:'GAIN_BUFF',effectKey:'act1autochess_gar_eff_attrByBond'},
  vi_combat_bond:{eventType:'IN_BATTLE',effectType:'ADD_BOND',effectKey:'act1autochess_gar_event_consume_ammo'},
};
const tick=()=>new Promise(resolve => setImmediate(resolve));
function fixture(origin, offered = CHEAP, price = 0, gift = false, reward = false,
  { giveCoin=false, coinMerge=false, pinecone=false, rewardLabel='松果',
    pineChoices=[CHEAP,GIFT], mergeSource='merge', mergeChoices=[CHEAP,OTHER],mergeTier=2,
    garrisonsAvailable=true, itemKind=false, itemsData=null, sp=false } = {}) {
  let current={ connection:{status:'online'},ui:{buildStale:false}, me:{playerId:'me'},
    room:{code:'room1',inMatch:true,seats:[{playerId:'me'}]},
    match:{ public:{phase:'PREP',round:3,players:[{playerId:'me',autoplay:false}]},
      private:{ alive:true,ready:false,funds:10,
        hand:offered===FLAME?[]:[{uid:7,id:GIFT,kind:'chess'}],board:[],temp:[],
        shop:{slots:[{id:offered,kind:itemKind?'item':'chess',price,sold:false}],refreshPrice:1,
          rewardOffer: reward ? {slots:[{id:FLAME}]} : null} } } };
  const listeners=new Set();
  const store={get:()=>current, subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},
    set(next){const before=current;current=next;for(const fn of [...listeners])fn(current,before);} };
  const actions={ buys:0,sells:[],refreshes:0,async buy(index){this.buys++;
    const s=structuredClone(current);s.match.private.shop.slots[index].sold=true;
    s.match.private.funds-=price;
    s.match.private.hand.push({uid:100,id:offered,kind:itemKind?'item':'chess'});
    if(gift){
      const gifted=Array.isArray(gift)?gift:[GIFT];
      if(gifted.length===3 && gifted.every(id=>id===gifted[0])){
        s.match.private.hand.push({uid:104,id:chess[gifted[0]].goldenId,kind:'chess',golden:true});
        s.match.private.shop.rewardOffer={source:mergeSource,label:null,tier:mergeTier,queued:0,
          slots:mergeChoices.map(id=>({id,kind:'chess',price:0,sold:false}))};
      }else gifted.forEach((id,i)=>s.match.private.hand.push({uid:101+i,id,kind:'chess'}));
    }
    if(giveCoin){
      if(coinMerge){s.match.private.hand=s.match.private.hand.filter(x=>x?.id!==COIN);
        s.match.private.hand.push({uid:101,id:'chess_item_1_03_e_b',kind:'item'});}
      else s.match.private.hand.push({uid:101,id:COIN,kind:'item'});
    }
    store.set(s);return true;
  },async sell(uid){this.sells.push(uid);
    const s=structuredClone(current);s.match.private.hand=s.match.private.hand.filter(unit=>unit.uid!==uid);
    if(pinecone && uid===100) s.match.private.shop.rewardOffer={source:'special',label:rewardLabel,
      tier:1,queued:0,slots:pineChoices.map(id=>({id,kind:'chess',price:0,sold:false}))};
    store.set(s);return true;
  },equips:[],picks:[],async equip(itemUid,targetUid){this.equips.push([itemUid,targetUid]);
    const s=structuredClone(current);
    const item=(current.match.private.hand||[]).find(x=>x?.uid===itemUid);
    s.match.private.hand=s.match.private.hand.filter(x=>x?.uid!==itemUid);
    s.match.private.funds+=item?.id==='chess_item_1_03_e_b'?2:1;
    store.set(s);return true;
  },async reward(idx){this.picks.push(idx);
    const s=structuredClone(current),id=s.match.private.shop.rewardOffer?.slots?.[idx]?.id;
    if(!id)return false;
    s.match.private.shop.rewardOffer=null;
    s.match.private.hand.push({uid:offered===FLAME && Array.isArray(gift) && gift.length===3 ? 105 : 102,
      kind:'chess',id});
    store.set(s);return true;
  },async refresh(){this.refreshes++;
    const s=structuredClone(current);s.match.private.funds-=s.match.private.shop.refreshPrice;
    s.match.private.shop.slots=[{id:CHEAP,kind:'chess',price:1,sold:false}];
    store.set(s);return true;
  }};
  const messages=[], receivers=new Set(),nonce='nonce-extension-test-12345678';
  const win={addEventListener(type,fn){if(type==='message')receivers.add(fn);},
    removeEventListener(type,fn){receivers.delete(fn);},
    postMessage(msg,target){assert.equal(target,origin);messages.push(msg);
      for(const fn of [...receivers])fn({source:win,origin,data:msg});
    }};
  const sandbox={document:{querySelector:()=>null},window:win,location:{origin,href:`${origin}/game/index.html`},
    __weiMainConfig:{root:`${origin}/game/`,nonce,version:VERSION},__testStore:store,__testActions:actions,
    fetch:async url=>String(url).endsWith('/data/garrisons.json') ?
      ({ok:garrisonsAvailable,json:async()=>garrisons}) :
      String(url).endsWith('/data/items.json') && itemsData ? ({ok:true,json:async()=>itemsData}) :
      ({ok:true,json:async()=>chess}),
    URL,console,setTimeout,clearTimeout,Promise,Map,Set};
  // 打包版网页：没有源码模块，只能通过游戏自身的 __SP__ 访问同一份 store / net。
  if(sp){
    const intents={'g.buy':f=>actions.buy(f.slot),'g.sell':f=>actions.sell(f.uid),'g.refresh':()=>actions.refresh(),
      'g.equip':f=>actions.equip(f.itemUid,f.targetUid,f.replaceUid),'g.reward':f=>actions.reward(f.idx)};
    sandbox.__SP__={version:1,store,net:{calls:[],async request(t,f){this.calls.push([t,JSON.stringify(f)]);if(!(await intents[t](f)))throw new Error('rejected');return {};}}};
    sandbox.__testStore={get:()=>null,subscribe:()=>()=>{}};sandbox.__testActions={};
  }
  vm.runInNewContext(script,sandbox);
  async function command(type,data={}){
    const rid=`rid${messages.length}`;
    win.postMessage({channel:'wei.runtime.v1',side:'ui',nonce,version:VERSION,type,rid,...data},origin);
    await tick(); await tick();
    return messages.filter(m=>m.type==='response'&&m.rid===rid).at(-1);
  }
  return {messages,actions,store,command,sandbox};
}
// Repeat on two unrelated origins, including an HTTP server: never assumes one fixed host.
for(const origin of ['http://first-server.example:40000','https://second.example:7900']){
  const game=fixture(origin);
  await tick();
  assert(game.messages.some(x=>x.type==='snapshot'&&x.state?.match?.private?.shop?.slots?.[0]?.price===0), JSON.stringify(game.messages));
  assert.equal(game.sandbox.__weiMainBridge.version, VERSION);
  const ignoredRefresh=await game.command('refresh',{expectedPrice:1,expectedSlots:[],version:'0.3.2'});
  assert.equal(ignoredRefresh,undefined,'outdated scripts cannot refresh the game shop');
  assert.equal(game.actions.refreshes,0);
  const stale=await game.command('buy',{slot:0,expectedId:CHEAP,expectedPrice:0,buy:[],keep:[],version:'0.3.1'});
  assert.equal(stale,undefined,'stale scripts must not reach game buy');
  assert.equal(game.actions.buys,0);
  const buy=await game.command('buy',{slot:0,expectedId:CHEAP,expectedPrice:0,buy:[],keep:[]});
  assert.equal(buy?.ok,true,JSON.stringify(buy));
  assert.equal(game.actions.buys,1);
  assert.equal((await game.command('sell',{uid:7,keep:[]})).ok,false,'preexisting operator must not be sold');
  assert.equal((await game.command('sell',{uid:100,keep:[CHEAP]})).ok,false,'current keep list protects purchases');
  assert.equal(game.actions.sells.length,0);
  assert.equal((await game.command('sell',{uid:100,keep:[]})).ok,true);
  assert.deepEqual(game.actions.sells,[100]);
  const beforeRefresh=game.store.get().match.private;
  const expectedSlots=structuredClone(beforeRefresh.shop.slots);
  assert.equal((await game.command('refresh',{expectedPrice:0,expectedSlots})).ok,false,
    'the current displayed refresh price must match');
  assert.equal((await game.command('refresh',{expectedPrice:1,expectedSlots:[]})).ok,false,
    'the shop must not change between preparation and action');
  assert.equal(game.actions.refreshes,0);
  const refreshed=await game.command('refresh',{expectedPrice:1,expectedSlots});
  assert.equal(refreshed?.ok,true,JSON.stringify(refreshed));
  assert.equal(game.actions.refreshes,1);
  assert.equal(game.store.get().match.private.funds,beforeRefresh.funds-1);
  assert.equal(game.store.get().match.private.shop.slots[0].sold,false);
}
const mismatchRefresh=fixture('http://mismatch.example:3000',CHEAP,5);
await tick();
mismatchRefresh.actions.refresh=async function(){this.refreshes++;
  const next=structuredClone(mismatchRefresh.store.get());
  next.match.private.funds-=2;
  next.match.private.shop.slots=[{id:CHEAP,kind:'chess',price:1,sold:false}];
  mismatchRefresh.store.set(next);return true;
};
const mismatchResult=await mismatchRefresh.command('refresh',{
  expectedPrice:1,expectedSlots:structuredClone(mismatchRefresh.store.get().match.private.shop.slots),
});
assert.equal(mismatchResult?.ok,false,'unexpected actual charge must abort the entire refresh chain');
assert.match(mismatchResult?.reason||'',/资金变化/);
assert.equal(mismatchRefresh.actions.refreshes,1,'an acknowledged but anomalous charge must not be retried');
const retained=fixture('http://retained.example:3000',GIFT,2);
await tick();
assert.equal((await retained.command('buy',{slot:0,expectedId:GIFT,expectedPrice:2,buy:[],keep:[GIFT]})).ok,true);
assert.equal((await retained.command('sell',{uid:100,keep:[]})).ok,false,'originally kept UID remains protected');
const gift=fixture('http://gift.example:4000',FLAME,0,true);
await tick();
assert.equal((await gift.command('buy',{slot:0,expectedId:FLAME,expectedPrice:0,buy:[],keep:[GIFT]})).ok,true);
assert.equal((await gift.command('sell',{uid:101,keep:[]})).ok,false,'gift on keep list stays protected');
assert.equal(gift.actions.sells.length,0);

const doubledFlame=fixture('http://investor-double.example:4000',FLAME,2,[GIFT,GIFT]);
await tick();
assert.equal((await doubledFlame.command('buy',{slot:0,expectedId:FLAME,expectedPrice:2,buy:[FLAME],keep:[]})).ok,true);
assert.equal((await doubledFlame.command('sell',{uid:101,keep:[]})).ok,true);
assert.equal((await doubledFlame.command('sell',{uid:102,keep:[]})).ok,true);
assert.equal((await doubledFlame.command('sell',{uid:100,keep:[]})).ok,true);
const tripledFlame=fixture('http://investor-triple.example:4000',FLAME,2,[GIFT,OTHER,GIFT]);
await tick();
assert.equal((await tripledFlame.command('buy',{slot:0,expectedId:FLAME,expectedPrice:2,buy:[FLAME],keep:[]})).ok,true,
  'the parent plus THREE gifts are four known, fresh UIDs');
assert.equal((await tripledFlame.command('sell',{uid:103,keep:[]})).ok,true);
assert.equal((await tripledFlame.command('sell',{uid:7,keep:[]})).ok,false);

const oldGift=fixture('http://old-gift.example:4000',FLAME,2,[OTHER,OTHER]);
await tick();
const withOld=structuredClone(oldGift.store.get());
withOld.match.private.hand.push({uid:7,id:GIFT,kind:'chess'});oldGift.store.set(withOld);
assert.equal((await oldGift.command('buy',{slot:0,expectedId:FLAME,expectedPrice:2,buy:[FLAME],keep:[]})).ok,true,
  'an existing gift no longer prevents buying when ALL old UIDs remain unchanged');
assert.equal((await oldGift.command('sell',{uid:7,keep:[]})).ok,false,'old gift never enters the sale ledger');
assert.equal((await oldGift.command('sell',{uid:101,keep:[]})).ok,true);
assert.equal((await oldGift.command('sell',{uid:102,keep:[]})).ok,true);
assert.equal((await oldGift.command('sell',{uid:100,keep:[]})).ok,true);
const oldGiftMerged=fixture('http://old-gift-merged.example:4000',FLAME,2,[GIFT]);
await tick();
const oldMergedBefore=structuredClone(oldGiftMerged.store.get());
oldMergedBefore.match.private.hand.push({uid:7,id:GIFT,kind:'chess'},
  {uid:8,id:GIFT,kind:'chess'});oldGiftMerged.store.set(oldMergedBefore);
const originalBuy=oldGiftMerged.actions.buy.bind(oldGiftMerged.actions);
oldGiftMerged.actions.buy=async function(index){
  const ok=await originalBuy(index);
  const s=structuredClone(oldGiftMerged.store.get());
  s.match.private.hand=s.match.private.hand.filter(unit=>![7,8,101].includes(unit.uid));
  s.match.private.hand.push({uid:104,id:chess[GIFT].goldenId,kind:'chess',golden:true});
  s.match.private.shop.rewardOffer={source:'merge',label:null,tier:2,queued:0,
    slots:[{id:CHEAP,kind:'chess',price:0,sold:false}]};
  oldGiftMerged.store.set(s);return ok;
};
const mergedResponse=await oldGiftMerged.command('buy',{
  slot:0,expectedId:FLAME,expectedPrice:2,buy:[FLAME],keep:[]});
assert.equal(mergedResponse?.ok,false,'buy may happen but a consumed OLD UID forbids all sales');
assert.equal(oldGiftMerged.actions.buys,1,'the permitted risk is irreversible');
assert.match(mergedResponse?.reason||'',/旧干员|UID/);
assert.equal((await oldGiftMerged.command('sell',{uid:100,keep:[]})).ok,false,
  'a failed post-buy audit must never authorize even the freshly bought parent UID');
assert.deepEqual(oldGiftMerged.actions.sells,[]);

const goldenGift=fixture('http://investor-merge.example:4000',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeChoices:[BAD,CHEAP]});
await tick();
const promotion={slot:0,expectedId:FLAME,expectedPrice:2,buy:[FLAME],keep:[GIFT]};
assert.equal((await goldenGift.command('buy',promotion)).ok,true);
assert.equal(goldenGift.store.get().match.private.shop.rewardOffer.source,'merge');
assert.equal((await goldenGift.command('sell',{uid:100,keep:[]})).ok,false,
  'no sale before this promotion is chosen and audited');
assert.equal((await goldenGift.command('reward',{slot:1,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,false,
  'Pinecone reward cannot reuse Flametail merge proof');
assert.equal((await goldenGift.command('merge-reward',{slot:0,expectedId:BAD,expectedPrice:0,
  buy:[BAD],keep:[BAD]})).ok,false,'equipment-giving onGain cannot be auto-picked even when kept');
assert.equal(goldenGift.actions.picks.length,0);
assert.equal((await goldenGift.command('merge-reward',{slot:1,expectedId:CHEAP,expectedPrice:0,
  buy:[CHEAP],keep:[]})).ok,true,'the ordinary safe promotion card has a fresh UID');
assert.equal((await goldenGift.command('merge-reward',{slot:1,expectedId:CHEAP,expectedPrice:0,
  buy:[CHEAP],keep:[]})).ok,false,'a promotion proof is single-use');
assert.deepEqual(goldenGift.actions.picks,[1]);
assert.equal((await goldenGift.command('sell',{uid:104,keep:[]})).ok,false,
  'the new elite gift was kept at purchase time');
assert.equal((await goldenGift.command('sell',{uid:101,keep:[]})).ok,false,
  'intermediate merge copies were consumed, never attributed for sale');
assert.equal((await goldenGift.command('sell',{uid:105,keep:[]})).ok,true);
assert.equal((await goldenGift.command('sell',{uid:100,keep:[]})).ok,true);

const gainPromotion=fixture('https://pure-gain.example:7900',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeChoices:[OTHER,ECON]});
await tick();
assert.equal((await gainPromotion.command('buy',promotion)).ok,true);
assert.equal((await gainPromotion.command('merge-reward',{slot:1,expectedId:ECON,expectedPrice:0,
  keep:[]})).ok,true,'pure gain-time economy can be claimed with a verified fresh UID');
assert.equal((await gainPromotion.command('sell',{uid:105,keep:[]})).ok,true,
  'the pure economy promotion UID is the only new reward UID sellable');
assert.equal((await gainPromotion.command('sell',{uid:104,keep:[]})).ok,false,
  'the golden gift kept in the purchase proof must stay protected');

const layerPromotion=fixture('http://pure-layer.example:4000',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeChoices:[LAYER,CHEAP]});
await tick();
assert.equal((await layerPromotion.command('buy',promotion)).ok,true);
assert.equal((await layerPromotion.command('merge-reward',{slot:0,expectedId:LAYER,expectedPrice:0,
  keep:[]})).ok,true,'known immediate-layer onGain is safe without new chess/item UIDs');
assert.equal((await layerPromotion.command('sell',{uid:105,keep:[]})).ok,true);

const viOffer=fixture('http://vi-reward.example:4000',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeTier:6,mergeChoices:[VI_MUEL,VI_SAINT,VI_LEM]});
await tick();
assert.equal((await viOffer.command('buy',promotion)).ok,true);
assert.equal((await viOffer.command('merge-reward',{slot:0,expectedId:VI_MUEL,expectedPrice:0,
  keep:[VI_MUEL]})).ok,false,'a kept VI item-grant still must not be claimed automatically');
assert.equal(viOffer.actions.picks.length,0);
assert.equal((await viOffer.command('merge-reward',{slot:1,expectedId:VI_SAINT,expectedPrice:0,
  keep:[]})).ok,true,'IN_BATTLE GAIN_BUFF is a safe ordinary VI card despite key mismatch');
assert.deepEqual(viOffer.actions.picks,[1]);
assert.equal((await viOffer.command('sell',{uid:105,keep:[]})).ok,true);
assert.equal((await viOffer.command('sell',{uid:104,keep:[]})).ok,false,
  'the old keep/golden proof remains protected after a VI reward');
const viLemOffer=fixture('https://vi-lem.example:7900',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeTier:6,mergeChoices:[VI_MUEL,VI_SAINT,VI_LEM]});
await tick();
assert.equal((await viLemOffer.command('buy',promotion)).ok,true);
assert.equal((await viLemOffer.command('merge-reward',{slot:2,expectedId:VI_LEM,expectedPrice:0,
  keep:[VI_LEM]})).ok,true,'combat-only layers do not imply an immediate stacking effect');
assert.equal((await viLemOffer.command('sell',{uid:105,keep:[]})).ok,false,
  'a specifically kept VI reward stays protected');

const noMeta=fixture('http://promotion-no-meta.example:4000',FLAME,2,[GIFT,GIFT,GIFT],false,
  {garrisonsAvailable:false});
await tick();
assert.equal((await noMeta.command('buy',promotion)).ok,true);
assert.equal((await noMeta.command('merge-reward',{slot:0,expectedId:CHEAP,expectedPrice:0,
  buy:[CHEAP],keep:[]})).ok,false,'no trait metadata means the reward must be selected manually');
assert.equal(noMeta.actions.picks.length,0);

const wrongMerge=fixture('http://wrong-merge-source.example:4000',FLAME,2,[GIFT,GIFT,GIFT],false,
  {mergeSource:'special'});
await tick();
assert.equal((await wrongMerge.command('buy',promotion)).ok,false,'wrong reward source cannot prove a Flametail merge');
assert.equal((await wrongMerge.command('merge-reward',{slot:0,expectedId:CHEAP,expectedPrice:0,
  buy:[CHEAP],keep:[]})).ok,false);
assert.equal(wrongMerge.actions.picks.length,0);
assert.equal((await wrongMerge.command('sell',{uid:104,keep:[]})).ok,false);

const manualMerge=fixture('http://manual-merge.example:4000',FLAME,2,[GIFT,GIFT,GIFT]);
await tick();
assert.equal((await manualMerge.command('buy',promotion)).ok,true);
const originally=structuredClone(manualMerge.store.get().match.private.shop.rewardOffer);
const clearedMerge=structuredClone(manualMerge.store.get());clearedMerge.match.private.shop.rewardOffer=null;manualMerge.store.set(clearedMerge);
const repeatedMerge=structuredClone(clearedMerge);repeatedMerge.match.private.shop.rewardOffer=originally;manualMerge.store.set(repeatedMerge);
assert.equal((await manualMerge.command('merge-reward',{slot:0,expectedId:CHEAP,expectedPrice:0,
  buy:[CHEAP],keep:[]})).ok,false,'a manually changed offer burns the proof even if the cards look identical');

const pending=fixture('https://reward.example:4000',CHEAP,0,false,true);
await tick();
assert.equal((await pending.command('buy',{slot:0,expectedId:CHEAP,expectedPrice:0,buy:[],keep:[]})).ok,false);
assert.equal(pending.actions.buys,0,'pending reward blocks all transactions');
// The MAIN-world bridge itself independently proves source UID for both new actions.
const swire=fixture('http://coin.example:4000',SWIRE,1,false,false,{giveCoin:true});
await tick();
assert.equal((await swire.command('coin',{itemUid:101,parentUid:100})).ok,false,'cannot use an unowned future coin');
assert.equal((await swire.command('buy',{slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]})).ok,true);
assert.equal((await swire.command('coin',{itemUid:101,parentUid:999})).ok,false,'coin cannot be equipped onto a non-existent target');
assert.equal((await swire.command('coin',{itemUid:101,parentUid:7})).ok,true,
  'user-confirmed scope: a coin may be used on any owned chess with a free slot');
assert.equal(swire.store.get().match.private.funds,10,'the Swire coin grants +1 funds');
assert.equal((await swire.command('coin',{itemUid:101,parentUid:100})).ok,false,'coin receipt is single-use');
assert.equal((await swire.command('sell',{uid:100,keep:[]})).ok,true);

// A foreign coin that never came from a plugin buy is used as well (all-coin scope).
const foreign=structuredClone(swire.store.get());
foreign.match.private.hand.push({uid:77,id:COIN,kind:'item'});
foreign.match.private.hand.push({uid:78,id:'chess_item_1_03_e_b',kind:'item'});
swire.store.set(foreign);
assert.equal((await swire.command('coin',{itemUid:77,parentUid:7})).ok,true,'a foreign normal coin is used for +1');
assert.equal((await swire.command('coin',{itemUid:78,parentUid:7})).ok,true,'a foreign golden coin is used for +2');
assert.equal(swire.store.get().match.private.funds,13);
const fullCarrier=structuredClone(swire.store.get());
fullCarrier.match.private.hand.find(x=>x.uid===7).items=[{uid:90,id:'a'},{uid:91,id:'b'}];
fullCarrier.match.private.hand.push({uid:79,id:COIN,kind:'item'});
swire.store.set(fullCarrier);
assert.equal((await swire.command('coin',{itemUid:79,parentUid:7})).ok,false,
  'a carrier with both equipment slots full would destroy an equipped item');

const merged=fixture('http://merged.example:4000',SWIRE,1,false,false,{giveCoin:true,coinMerge:true});
await tick();
const ownCoin={slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]};
const old=structuredClone(merged.store.get());old.match.private.hand.push({uid:55,id:COIN,kind:'item'});merged.store.set(old);
assert.equal((await merged.command('buy',ownCoin)).ok,true,
  'a coin merged with an old normal copy becomes the golden coin and is attributed to this buy');
assert.equal((await merged.command('coin',{itemUid:101,parentUid:100})).ok,true);
assert.equal(merged.store.get().match.private.funds,11,'the merged golden coin grants +2 funds');
assert.deepEqual(merged.actions.equips,[[101,100]]);
assert.equal((await merged.command('sell',{uid:100,keep:[]})).ok,true,'the verified Swire is sold despite the merge');

const pine=fixture('http://pinecone.example:4000',PINECONE,1,false,false,{pinecone:true});
await tick();
assert.equal((await pine.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,false,
  'no sale proof means no free pick even if a matching offer is forged');
assert.equal((await pine.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await pine.command('sell',{uid:100,keep:[]})).ok,true);
const pineView=pine.messages.filter(x=>x.type==='snapshot').at(-1).state.match.private.shop.rewardOffer;
assert.deepEqual([pineView.source,pineView.label,pineView.tier,pineView.queued],['special','松果',1,0]);
assert.equal((await pine.command('reward',{slot:0,expectedId:GIFT,expectedPrice:0,keep:[]})).ok,false,
  'a reward slot must match its authoritative operator ID');
assert.equal((await pine.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[CHEAP]})).ok,true);
assert.deepEqual(pine.actions.picks,[0]);
assert.equal((await pine.command('sell',{uid:102,keep:[]})).ok,false,'an originally kept reward UID remains protected');
assert.equal((await pine.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,false,
  'the proof cannot be replayed after one successful reward');

const pineSell=fixture('http://reward-sale.example:4000',PINECONE,1,false,false,{pinecone:true});
await tick();
assert.equal((await pineSell.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await pineSell.command('sell',{uid:100,keep:[]})).ok,true);
assert.equal((await pineSell.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,true);
assert.equal((await pineSell.command('sell',{uid:102,keep:[]})).ok,true,'fresh reward UID is sellable, old UID is not');
assert.equal((await pineSell.command('sell',{uid:7,keep:[]})).ok,false);

const pineEconomy=fixture('https://pine-economy.example:7900',PINECONE,1,false,false,
  {pinecone:true,pineChoices:[LAYER,ECON,ECONSALE,CHEAP]});
await tick();
assert.equal((await pineEconomy.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,
  buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await pineEconomy.command('sell',{uid:100,keep:[]})).ok,true);
assert.equal((await pineEconomy.command('reward',{slot:1,expectedId:ECON,expectedPrice:0,
  keep:[]})).ok,true,'pure free-refresh onGain is independently permitted by MAIN');
assert.equal((await pineEconomy.command('sell',{uid:102,keep:[]})).ok,true,
  'the new economy reward, not any old UID, is sold');
assert.equal((await pineEconomy.command('sell',{uid:7,keep:[]})).ok,false);

const pineSaleEcon=fixture('http://pine-sale-economy.example:4000',PINECONE,1,false,false,
  {pinecone:true,pineChoices:[ECONSALE,LAYER]});
await tick();
assert.equal((await pineSaleEcon.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,
  buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await pineSaleEcon.command('sell',{uid:100,keep:[]})).ok,true);
assert.equal((await pineSaleEcon.command('reward',{slot:0,expectedId:ECONSALE,expectedPrice:0,
  keep:[ECONSALE]})).ok,true);
assert.equal((await pineSaleEcon.command('sell',{uid:102,keep:[]})).ok,false,
  'a free economic card originally on the keep list is protected even when the list later changes');

const pineNoMeta=fixture('http://pine-no-meta.example:4000',PINECONE,1,false,false,
  {pinecone:true,pineChoices:[ECON],garrisonsAvailable:false});
await tick();
assert.equal((await pineNoMeta.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,
  buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await pineNoMeta.command('sell',{uid:100,keep:[]})).ok,true);
assert.equal((await pineNoMeta.command('reward',{slot:0,expectedId:ECON,expectedPrice:0,
  keep:[]})).ok,false,'missing same-origin trait data must stop Pinecone selection too');
assert.equal(pineNoMeta.actions.picks.length,0);

const changedOld=fixture('http://pine-uid-changed.example:4000',PINECONE,1,false,false,
  {pinecone:true,pineChoices:[ECON]});
await tick();
assert.equal((await changedOld.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,
  buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await changedOld.command('sell',{uid:100,keep:[]})).ok,true);
changedOld.actions.reward=async function(idx){this.picks.push(idx);
  const next=structuredClone(changedOld.store.get());
  next.match.private.shop.rewardOffer=null;
  next.match.private.hand.find(x=>x.uid===7).id=CHEAP;
  next.match.private.hand.push({uid:102,id:ECON,kind:'chess'});
  changedOld.store.set(next);return true;
};
assert.equal((await changedOld.command('reward',{slot:0,expectedId:ECON,expectedPrice:0,
  keep:[]})).ok,false,'same old UID with a changed operator ID must stop before registration');
assert.equal((await changedOld.command('sell',{uid:102,keep:[]})).ok,false);

const manualOffer=fixture('http://manual-offer.example:4000',PINECONE,1,false,false,{pinecone:true});
await tick();
assert.equal((await manualOffer.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await manualOffer.command('sell',{uid:100,keep:[]})).ok,true);
const oldOffer=structuredClone(manualOffer.store.get().match.private.shop.rewardOffer);
const cleared=structuredClone(manualOffer.store.get());cleared.match.private.shop.rewardOffer=null;manualOffer.store.set(cleared);
const repeated=structuredClone(cleared);repeated.match.private.shop.rewardOffer=oldOffer;manualOffer.store.set(repeated);
assert.equal((await manualOffer.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,false,
  'a later identical-looking offer cannot reuse an already cleared Pinecone sale proof');

const wrong=fixture('http://unknown-reward.example:4000',PINECONE,1,false,false,{pinecone:true,rewardLabel:'不明奖励'});
await tick();
assert.equal((await wrong.command('buy',{slot:0,expectedId:PINECONE,expectedPrice:1,buy:[PINECONE],keep:[]})).ok,true);
assert.equal((await wrong.command('sell',{uid:100,keep:[]})).ok,false,'unknown reward source must not authorize a pick');
assert.equal((await wrong.command('reward',{slot:0,expectedId:CHEAP,expectedPrice:0,keep:[]})).ok,false);
assert.deepEqual(wrong.actions.picks,[]);
const keepThreshold=fixture('http://keep-threshold.example:4000',GIFT,1);
const emptyKeep=structuredClone(keepThreshold.store.get());emptyKeep.match.private.hand=[];keepThreshold.store.set(emptyKeep);
await tick();
const keepRequest={slot:0,expectedId:GIFT,expectedPrice:1,buy:[],keep:[GIFT],
  keepRules:{[GIFT]:{limit:1,minFunds:10}}};
assert.equal((await keepThreshold.command('buy',keepRequest)).ok,false,'10 is not strictly greater than 10');
assert.equal(keepThreshold.actions.buys,0);
assert.equal((await keepThreshold.command('buy',{...keepRequest,keepRules:{[GIFT]:{used:9999,limit:1,minFunds:9}}})).ok,true,
  'legacy or forged purchase totals do not replace actual live holdings');
const keepCapped=fixture('http://keep-capped.example:4000',GIFT,1);
await tick();
assert.equal((await keepCapped.command('buy',{...keepRequest,keepRules:{[GIFT]:{used:0,limit:1,minFunds:null}}})).ok,false,
  'an existing normal card in hand satisfies the target even when the reported total is zero');
assert.equal(keepCapped.actions.buys,0);
const soldKeep=structuredClone(keepCapped.store.get());soldKeep.match.private.hand=[];keepCapped.store.set(soldKeep);
assert.equal((await keepCapped.command('buy',{...keepRequest,keepRules:{[GIFT]:{limit:1,minFunds:null}}})).ok,true,
  'the unchanged target becomes buyable after its actual holdings decrease');
const keepAndBuy=fixture('http://keep-and-buy.example:4000',GIFT,1);
const bothEmpty=structuredClone(keepAndBuy.store.get());bothEmpty.match.private.hand=[];keepAndBuy.store.set(bothEmpty);
await tick();
assert.equal((await keepAndBuy.command('buy',{...keepRequest,buy:[GIFT]})).ok,false,
  'a funds-gated keep rule also blocks the ordinary buy list for the same operator');
const bothGold=structuredClone(keepAndBuy.store.get());bothGold.match.private.temp=[{kind:'chess',id:chess[GIFT].goldenId,uid:90001}];keepAndBuy.store.set(bothGold);
assert.equal((await keepAndBuy.command('buy',{...keepRequest,buy:[GIFT],
  keepRules:{[GIFT]:{used:0,limit:3,minFunds:null}}})).ok,false,'one elite in temp counts as three and blocks every buy path');
assert.equal(keepAndBuy.actions.buys,0);

const ITEM='chess_item_3_04_e_a',itemRule={id:ITEM,enabled:true,used:0,limit:1,minFunds:10};
const itemGame=fixture('http://item-only.example:4000',ITEM,2,false,false,{itemKind:true});
await tick();
const itemRequest={slot:0,expectedId:ITEM,expectedPrice:2,itemRule};
assert.equal((await itemGame.command('buy',{slot:0,expectedId:ITEM,expectedPrice:2,buy:[ITEM],keep:[]})).ok,false,
  'an item can never pass the chess path');
assert.equal((await itemGame.command('buy-item',itemRequest)).ok,false,'item threshold is strict');
assert.equal((await itemGame.command('buy-item',{...itemRequest,itemRule:{...itemRule,enabled:false,minFunds:9}})).ok,false,
  'a disabled item cannot be bought');
assert.equal(itemGame.actions.buys,0);
const itemOk=await itemGame.command('buy-item',{...itemRequest,itemRule:{...itemRule,minFunds:9}});
assert.equal(itemOk.ok,true);assert.equal(itemOk.result.itemUid,100);
assert.equal(itemGame.actions.buys,1);
assert.equal((await itemGame.command('sell',{uid:100,keep:[]})).ok,false,'item UID is never a chess sale UID');
assert.deepEqual(itemGame.actions.sells,[]);
const itemFree=fixture('http://item-free.example:4000',ITEM,2,false,false,{itemKind:true});
await tick();
assert.equal((await itemFree.command('buy-item',{...itemRequest,itemRule:{...itemRule,limit:undefined,minFunds:null}})).ok,false,
  'a missing item limit fails closed');
const itemFreeOk=await itemFree.command('buy-item',{...itemRequest,itemRule:{...itemRule,used:150,limit:null,minFunds:null}});
assert.equal(itemFreeOk.ok,true,itemFreeOk.reason || 'item limit null means unlimited');
assert.equal(itemFree.actions.buys,1);
const itemMerge=fixture('http://item-merge.example:4000',ITEM,2,false,false,{itemKind:true});
await tick();
const withPair=structuredClone(itemMerge.store.get());withPair.match.private.hand.push(
  {uid:8,id:ITEM,kind:'item'},{uid:9,id:ITEM,kind:'item'});itemMerge.store.set(withPair);
assert.equal((await itemMerge.command('buy-item',{...itemRequest,itemRule:{...itemRule,minFunds:null}})).ok,false,
  'two owned identical items may merge on purchase; never guess a fresh UID');
assert.equal(itemMerge.actions.buys,0);
const itemOldChanged=fixture('http://item-old-changed.example:4000',ITEM,2,false,false,{itemKind:true});
await tick();
const buyOld=itemOldChanged.actions.buy.bind(itemOldChanged.actions);
itemOldChanged.actions.buy=async index=>{const ok=await buyOld(index);const s=structuredClone(itemOldChanged.store.get());
  s.match.private.hand.find(x=>x.uid===7).id=CHEAP;itemOldChanged.store.set(s);return ok;};
assert.equal((await itemOldChanged.command('buy-item',{...itemRequest,itemRule:{...itemRule,minFunds:null}})).ok,false,
  'a purchase affecting an old UID must fail closed even when the game returned true');
assert.equal(itemOldChanged.actions.buys,1);

// 炎国短刀 merges at two identical copies (game data upgradeNum=2).
const ITEM_GOLD='chess_item_3_04_e_b';
const ITEMS_DATA={[ITEM]:{name:'炎国短刀',itemType:'EQUIP',isGolden:false,mergeable:true,upgradeNum:2,upgradeChessId:ITEM_GOLD,goldenId:ITEM_GOLD},
  [ITEM_GOLD]:{name:'炎国短刀',itemType:'EQUIP',isGolden:true,mergeable:false,upgradeNum:0,upgradeChessId:null,goldenId:ITEM_GOLD}};
function itemMergeFixture(name,{equipped=false,serverMerges=true}={}){
  const game=fixture(`http://${name}.example:4000`,ITEM,2,false,false,{itemKind:true,itemsData:ITEMS_DATA});
  const s=structuredClone(game.store.get());
  if(equipped) s.match.private.hand[0].items=[{uid:8,id:ITEM}];
  else s.match.private.hand.push({uid:8,id:ITEM,kind:'item'});
  game.store.set(s);
  game.actions.buy=async function(index){this.buys++;const next=structuredClone(game.store.get());
    next.match.private.shop.slots[index].sold=true;next.match.private.funds-=2;
    if(serverMerges){next.match.private.hand=next.match.private.hand.filter(x=>x.uid!==8);
      next.match.private.hand.push({uid:101,id:ITEM_GOLD,kind:'item'});}
    else next.match.private.hand.push({uid:101,id:ITEM,kind:'item'});
    game.store.set(next);return true;};
  return game;
}
const mergeRequest={...itemRequest,itemRule:{...itemRule,minFunds:null,limit:3},expectMerge:{goldenId:ITEM_GOLD,consumed:[8]}};
const benchMerge=itemMergeFixture('item-bench-merge');
await tick();
const benchMerged=await benchMerge.command('buy-item',mergeRequest);
assert.equal(benchMerged.ok,true,benchMerged.reason);assert.equal(benchMerged.result.itemUid,101);
assert.equal(benchMerged.result.merged,true);
assert.equal(benchMerge.actions.buys,1);
const unexpected=itemMergeFixture('item-merge-unexpected');
await tick();
assert.equal((await unexpected.command('buy-item',{...mergeRequest,expectMerge:null})).ok,false,
  'both worlds must agree that this purchase merges');
assert.equal(unexpected.actions.buys,0);
const issued=itemMergeFixture('item-merge-issued',{equipped:true});
await tick();
assert.equal((await issued.command('buy-item',mergeRequest)).ok,false,'never consume issued equipment');
assert.equal((await issued.command('buy-item',{...mergeRequest,expectMerge:null})).ok,false);
assert.equal(issued.actions.buys,0);
const noMerge=itemMergeFixture('item-merge-missing',{serverMerges:false});
await tick();
assert.equal((await noMerge.command('buy-item',mergeRequest)).ok,false,'an expected merge that did not happen fails closed');
assert.equal(noMerge.actions.buys,1);

// 自选编队 picks reach the workbench as slot → charId only; malformed entries are dropped.
const diyView=fixture('http://diy-view.example:4000',CHEAP,1);
await tick();
const withDiy=structuredClone(diyView.store.get());
withDiy.match.private.diy={chess_char_6_diy1_a:{charId:'char_1050_chen3',skillIndex:2,uniEquipId:'x'},'bad key!':{charId:'char_x'},
  chess_char_5_diy1_a:{charId:42}};
diyView.store.set(withDiy);await tick();
assert.equal(JSON.stringify(diyView.messages.filter(x=>x.type==='snapshot').at(-1).state.match.private.diy),
  JSON.stringify({chess_char_6_diy1_a:{charId:'char_1050_chen3'}}));
console.log('第三批验证通过：主世界桥接的诗怀雅赠币、松果选卡、焰尾三份赠品合成证明与旧UID保护。');
console.log('main bridge: investor ×3 gift UID/merge proof, one-use safe promotion, old-UID protection, Swire/Pinecone passed');

// 自动使用：MAIN 世界独立校验——仅已勾选的装备即消耗道具、目标为战场/手牌且装备栏未满；不发 replaceUid；信标不碰保留/自编
{
  const TICKET='chess_item_2_02_e_a', BEACON='chess_item_5_04_e_a', BLADE='chess_item_3_04_e_a', DOC='chess_item_5_06_e_a';
  const itemsData={items:{
    [TICKET]:{id:TICKET,name:'紧急调度券',itemType:'EQUIP',kind:'consume_on_equip',desc:'装备时销毁，随机获取当前调度中心内的1名干员'},
    [BEACON]:{id:BEACON,name:'信标',itemType:'EQUIP',kind:'consume_on_equip',desc:'装备时，目标干员和本装备销毁并进行一次特殊刷新',
      buffs:[{key:'use_equip_recruit_new_char_and_give_char_to_player_most_bond'}]},
    [BLADE]:{id:BLADE,name:'炎国短刀',itemType:'EQUIP',kind:'stat'},
    [DOC]:{id:DOC,name:'博士投影',itemType:'EQUIP',kind:'consume_on_equip_or_delayed'}}};
  const use=fixture('http://use.example:4000',CHEAP,0,false,false,{itemsData});
  await tick();
  const s=structuredClone(use.store.get());
  s.match.private.hand=[{uid:7,id:GIFT,kind:'chess',items:[]},{uid:50,id:TICKET,kind:'item'},{uid:51,id:BEACON,kind:'item'},
    {uid:52,id:BLADE,kind:'item'},{uid:53,id:DOC,kind:'item'}];
  s.match.private.board=[{uid:8,id:CHEAP,kind:'chess',items:[{uid:60,id:BLADE},{uid:61,id:BLADE}]},
    {uid:9,id:'chess_char_1_100_b',kind:'chess',golden:true,items:[]}];
  use.store.set(s);
  use.actions.equip=async function(itemUid,targetUid,replaceUid){
    this.equips.push([itemUid,targetUid,replaceUid ?? null]);
    const n=structuredClone(use.store.get());
    n.match.private.hand=n.match.private.hand.filter(x=>x?.uid!==itemUid);
    if(itemUid===50) n.match.private.hand.push({uid:70,id:'chess_char_1_101_a',kind:'chess',items:[]});
    use.store.set(n); return true;
  };
  const allowed=[TICKET,BEACON,BLADE,DOC];
  assert.equal((await use.command('use-item',{itemUid:50,targetUid:8,expectedId:TICKET,allowed})).ok,false,'a full carrier is never targeted');
  assert.equal((await use.command('use-item',{itemUid:52,targetUid:7,expectedId:BLADE,allowed})).ok,false,'non-consumables are never auto-used');
  assert.equal((await use.command('use-item',{itemUid:50,targetUid:7,expectedId:TICKET,allowed:[]})).ok,false,'the item must be opted in');
  assert.equal((await use.command('use-item',{itemUid:50,targetUid:7,expectedId:BEACON,allowed})).ok,false,'the expected item ID must match');
  assert.equal((await use.command('use-item',{itemUid:51,targetUid:7,expectedId:BEACON,allowed,keep:[GIFT]})).ok,false,
    '信标 never destroys a kept operator');
  assert.equal((await use.command('use-item',{itemUid:53,targetUid:9,expectedId:DOC,allowed})).ok,false,'博士投影 only on a normal operator');
  assert.equal(use.actions.equips.length,0);
  const done=await use.command('use-item',{itemUid:50,targetUid:7,expectedId:TICKET,allowed});
  assert.equal(done?.ok,true,JSON.stringify(done));
  assert.equal(JSON.stringify(use.actions.equips),'[[50,7,null]]','no replaceUid is ever sent');
  assert.equal(done.result.consumed,true);
  assert.equal((await use.command('use-item',{itemUid:50,targetUid:7,expectedId:TICKET,allowed})).ok,false,'a used item cannot be re-sent');
  console.log('bridge: 道具自动使用的 MAIN 世界校验通过');
}
{
  // 打包版（Vite）网页：优先使用游戏挂出的 __SP__，不能再导入一份新的、未连接的 store。
  const game=fixture('https://bundle.example',CHEAP,0,false,false,{sp:true});
  await tick();
  assert(game.messages.some(x=>x.type==='snapshot'&&x.state?.match?.private?.shop?.slots?.[0]?.price===0),'snapshot from the live __SP__ store');
  const buy=await game.command('buy',{slot:0,expectedId:CHEAP,expectedPrice:0,buy:[],keep:[]});
  assert.equal(buy?.ok,true,JSON.stringify(buy));
  assert.equal(game.actions.buys,1);
  assert.deepEqual(game.sandbox.__SP__.net.calls[0],['g.buy','{"slot":0}']);
  console.log('bridge: 打包版网页通过 __SP__ 连接同一份对局状态与网络通道');
}
