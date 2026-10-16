import assert from 'node:assert/strict';
import {
  FLAMETAIL_ID, SWIRE_ID, SWIRE_COIN_ID, PINECONE_ID,
  baseId, inspectMatch, keepBases, isPineconeOffer, pickPineconeReward, rewardTraitRank,
  pickCandidate, auditPurchase, auditSale, auditCoinUse, auditReward, usableCoins, pickCoinTarget,
  isFlametailMergeOffer, pickFlametailMergeReward, auditFlametailMergeReward,
} from '../src/engine/auto-policy.js';

const ids = {
  cheap: 'chess_char_1_01_a', custom: 'chess_char_2_01_a', keep: 'chess_char_3_01_a',
  gift: 'chess_char_1_19_a', rare: 'chess_char_4_20_a', other: 'chess_char_2_18_a',
  hidden: 'chess_char_3_02_a', diy: 'chess_char_3_07_a', flame: FLAMETAIL_ID, swire:SWIRE_ID, pinecone:PINECONE_ID,
  econGain: 'chess_char_1_07_a', econSale: 'chess_char_1_08_a', econNext: 'chess_char_1_14_a',
  layerGain: 'chess_char_1_02_a', layerLater: 'chess_char_1_13_a',
  unknownGain: 'chess_char_1_04_a', unknownSale: 'chess_char_1_05_a',
  viMuel: 'chess_char_6_11_a', viSaint: 'chess_char_6_02_a', viLem: 'chess_char_6_01_a',
};
const chess = {};
for (const id of Object.values(ids)) {
  chess[id] = { baseId: id, goldenId: id.slice(0, -1) + 'b',
    upgradeNum: 3, isGolden: false, visible: true, isHidden: false, isDiy: false,
    garrisonIds: [id === ids.flame || id === ids.swire ? 'gain_gift' : 'passive'],
    tier:Number(id.split('_')[2]) };
  chess[chess[id].goldenId] = { baseId: id, isGolden: true, visible: true };
}
chess[ids.hidden].isHidden = true;
chess[ids.diy].isDiy = true;
const garrisons = {
  passive:{eventType:'IN_BATTLE'}, gain_gift:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_EQUIP'},
  econ_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  econ_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT'},
  econ_next:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_ONCE_GOLD'},
  layer_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_ADD_BOND_CHESS_ALL'},
  layer_later:{eventType:'SERVER_PREP_FIN',effectKey:'SERVER_ADD_BOND'},
  unknown_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_POOL_CHAR'},
  unknown_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_TRIGGER_ANOTHER'},
  pinecone_sale:{eventType:'SERVER_CHESS_SOLD',effectKey:'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS'},
  garrison_05_a:{eventType:'IN_BATTLE',effectType:'GAIN_BUFF',
    effectKey:'act1autochess_gar_eff_attrByBond'}, // 圣聆初雪
  garrison_24_a:{eventType:'IN_BATTLE',effectType:'ADD_BOND',
    effectKey:'act1autochess_gar_event_consume_ammo'}, // 蕾缪安: combat layers, not immediate stacking
  garrison_76_a:{eventType:'SERVER_GAIN',effectType:'SERVER_GAIN_EQUIP',
    effectKey:'SERVER_GAIN_EQUIP'}, // 缪尔赛思: a gifted item, still excluded
};
for (const [id,trait] of [
  [ids.econGain,'econ_gain'],[ids.econSale,'econ_sale'],[ids.econNext,'econ_next'],
  [ids.layerGain,'layer_gain'],[ids.gift,'layer_gain'],[ids.layerLater,'layer_later'],
  [ids.unknownGain,'unknown_gain'],[ids.unknownSale,'unknown_sale'],[ids.pinecone,'pinecone_sale'],
  [ids.viMuel,'garrison_76_a'],[ids.viSaint,'garrison_05_a'],[ids.viLem,'garrison_24_a'],
]) chess[id].garrisonIds = [trait];
const op = (uid, id, golden = false) => ({ uid, id, kind: 'chess', golden });
const offer = (id, price, sold = false) => ({ kind: 'chess', id, price, sold });
const coin = uid => ({ uid, id: SWIRE_COIN_ID, kind: 'item' });
const pineconeOffer = ids => ({ source:'special', label:'松果', tier:1, queued:0,
  slots:ids.map(id=>offer(id,0)) });
function state({ hand = [], board = [], temp = [], slots = [], funds = 8, phase = 'PREP', round = 1, rewardOffer=null } = {}) {
  return { connection: { status: 'online' }, ui: {}, me: { playerId: 'me' },
    room: { code: 'MATCH', inMatch: true, seats: [{ playerId: 'me' }] },
    match: { public: { phase, round, players: [{ playerId: 'me' }] },
      private: { alive: true, ready: false, funds, hand, board, temp, shop: { slots, rewardOffer } } } };
}
const ctx = props => inspectMatch(state(props), chess);
const plan = (buy = [], keep = [], excludedBuy = []) => ({ buy, keep, excludedBuy });

// Only gain/sale-time pure funds/free refresh and immediate layer effects matter
// when a non-kept free reward is sold at once. Delayed layer effects rank ordinary.
for (const [id,rank] of [[ids.econGain,0],[ids.econSale,0],[ids.econNext,0],
  [ids.layerGain,1],[ids.gift,1],[ids.layerLater,2],[ids.cheap,2],[ids.pinecone,2],
  [ids.viMuel,null],[ids.viSaint,2],[ids.viLem,2],
  [ids.swire,null],[ids.flame,null],[ids.unknownGain,null],[ids.unknownSale,null]]) {
  assert.equal(rewardTraitRank(id,chess,garrisons),rank,`free reward rank: ${id}`);
}
assert.equal(rewardTraitRank(ids.econGain,chess,null),null,'missing same-origin trait catalogue must not guess');
assert.equal(rewardTraitRank(ids.econGain,chess,{}),null,'missing trait ID must not guess');
assert.equal(rewardTraitRank(ids.econGain,chess,{econ_gain:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_EQUIP'}}),null,
  'unknown item grants must not count as pure economy');
assert.equal(rewardTraitRank(ids.econGain,chess,{econ_gain:{eventType:'SERVER_GAIN',
  effectKey:'SERVER_GAIN_FREE_REFRESH_COUNT',effectType:'SERVER_POOL_CHAR'}}),null,
  'a server whose effectType contradicts its effectKey cannot prove pure economy');
assert.equal(baseId(chess[ids.keep].goldenId, chess), ids.keep);
assert.deepEqual([...keepBases(plan([], [chess[ids.keep].goldenId]), chess)], [ids.keep]);
assert.equal(inspectMatch(state({ phase: 'COMBAT' }), chess).ok, false);
const rewardPending = state(); rewardPending.match.private.shop.rewardOffer = { slots: [offer(ids.keep,0)] };
assert.equal(inspectMatch(rewardPending, chess).ok, false);
assert.equal(inspectMatch({ ...state(), connection: { status: 'offline' } }, chess).ok, false);
assert.equal(inspectMatch(state({ hand: [op(1, ids.keep), op(1, ids.cheap)] }), chess).ok, false);

// Current slot price, not catalogue base price; keep > custom > cheap, then shop order.
let before = ctx({ slots: [offer(ids.cheap, 0), offer(ids.custom, 3), offer(ids.keep, 5)] });
assert.deepEqual([pickCandidate(before, plan([ids.custom], [ids.keep]), chess).id,
  pickCandidate(before, plan([ids.custom]), chess).id,
  pickCandidate(before, plan(), chess).id], [ids.keep, ids.custom, ids.cheap]);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.cheap, 2)] }), plan(), chess), null);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.cheap, 1)] }), plan(), chess).price, 1);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.custom, 5)], funds: 4 }), plan([ids.custom]), chess), null);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.hidden, 0)] }), plan(), chess), null);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.hidden, 3)] }), plan([], [ids.hidden]), chess).reason, '保留');
assert.equal(pickCandidate(ctx({ slots: [offer(ids.diy, 3)] }), plan([], [ids.diy]), chess).reason, '保留');
assert.equal(pickCandidate(ctx({ slots: [offer(ids.cheap, 0)], hand: Array.from({length:10}, (_,i)=>op(i+1,ids.keep)) }), plan(), chess), null);
// A disabled custom-buy rule never overrides itself, and never overrides an active keep rule.
assert.equal(pickCandidate(ctx({ slots: [offer(ids.custom, 1)] }), plan([ids.custom], [], [ids.custom]), chess), null,
  'an excluded custom buy must not be purchased');
assert.equal(pickCandidate(ctx({ slots: [offer(ids.keep, 5)] }), plan([], [ids.keep], [ids.keep]), chess).reason, '保留',
  'an excluded buy rule never overrides an active keep rule');
// Do not merge old non-kept copies into an elite just to sell the purchased unit.
assert.equal(pickCandidate(ctx({ slots: [offer(ids.cheap, 1)], hand: [op(1,ids.cheap),op(2,ids.cheap)] }), plan(), chess), null);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.keep, 4)], hand: [op(1,ids.keep),op(2,ids.keep)] }), plan([], [ids.keep]), chess).id, ids.keep);
// Explicitly accept the irreversible risk of an old gift merging; after buying,
// old UIDs must remain unchanged or the entire sale/reward chain stops.
assert.equal(pickCandidate(ctx({ slots: [offer(ids.flame, 1)], hand: [op(1,ids.gift),op(2,ids.gift)] }), plan([ids.flame]), chess).id, ids.flame);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.flame, 1)], hand: [op(1,ids.gift)] }), plan([ids.flame]), chess).id, ids.flame);
assert.equal(pickCandidate(ctx({ slots: [offer(ids.flame, 1)], hand: [op(1,ids.flame),op(2,ids.flame)] }), plan([ids.flame], [ids.flame]), chess), null,
  'an old Flametail parent merge is still outside the explicit gift-risk approval');
assert.equal(pickCandidate(ctx({ slots: [offer(chess[ids.flame].goldenId, 1)] }),
  plan([], [ids.flame]), chess), null, 'elite Flametail has 2–6 gifts and is not yet covered');

before = ctx({ slots: [offer(ids.custom, 3)], hand: [op(1, ids.custom)] });
let after = ctx({ slots: [offer(ids.custom, 3, true)], hand: [op(1, ids.custom), op(2, ids.custom)], funds: 5 });
const target = pickCandidate(before, plan([ids.custom]), chess);
assert.equal(auditPurchase(before, after, target, plan([ids.custom]), chess).parent.uid, 2);
assert.equal(auditPurchase(before, after, target, plan([ids.custom]), chess).retain, false);
assert.equal(auditSale(after, ctx({ slots: [offer(ids.custom, 3, true)], hand: [op(1,ids.custom)] }), 2).ok, true);
assert.equal(auditSale(after, ctx({ slots: [offer(ids.custom, 3, true)], hand: [] }), 2).ok, false);

before = ctx({ slots: [offer(ids.keep, 3)], hand: [op(1,ids.keep),op(2,ids.keep)] });
after = ctx({ slots: [offer(ids.keep, 3, true)], hand: [op(3,chess[ids.keep].goldenId,true)], funds: 5 });
assert.equal(auditPurchase(before, after, pickCandidate(before,plan([], [ids.keep]),chess), plan([], [ids.keep]),chess).merged, true);

before = ctx({ slots: [offer(ids.flame, 1)] });
after = ctx({ slots: [offer(ids.flame, 1, true)], hand: [op(3,ids.flame),op(4,ids.gift)], funds: 7 });
const flame = pickCandidate(before, plan([ids.flame], [ids.gift]), chess);
const result = auditPurchase(before, after, flame, plan([ids.flame], [ids.gift]), chess);
assert.deepEqual([result.ok, result.gifts[0].uid, keepBases(plan([], [ids.gift]), chess).has(result.gifts[0].base)], [true, 4, true]);
assert.equal(auditPurchase(before, ctx({ slots: [offer(ids.flame, 1, true)], hand: [op(3,ids.flame)] }), flame, plan([ids.flame]), chess).ok, false);
assert.equal(auditPurchase(before, ctx({ slots: [offer(ids.flame, 1, true)], hand: [op(3,ids.flame),op(4,ids.cheap)] }), flame, plan([ids.flame]), chess).ok, false);
assert.equal(auditPurchase(before, ctx({ slots: [offer(ids.flame, 1)] }), flame, plan([ids.flame]), chess).ok, false);
const doubled = ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(4,ids.gift),op(5,ids.gift)],funds:7});
assert.equal(auditPurchase(before,doubled,flame,plan([ids.flame]),chess).gifts.length,2,
  'investor ×2 may grant two identical normal gifts without a merge');
const tripled = ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(4,ids.gift),op(5,ids.other),op(6,ids.gift)],funds:7});
assert.deepEqual(auditPurchase(before,tripled,flame,plan([ids.flame]),chess).gifts.map(x=>x.uid),[4,5,6]);
assert.equal(auditPurchase(before,ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(4,ids.gift),op(5,ids.gift),op(6,ids.gift)]}),flame,plan([ids.flame]),chess).ok,false,
  'three same normal gifts without an actual merge are incompatible');
const promotion={source:'merge',label:null,tier:4,queued:0,
  slots:[offer(ids.flame,0),offer(ids.other,0),offer(ids.custom,0)]};
const golden=ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)],funds:7,rewardOffer:promotion});
assert.equal(golden.ok,false,'pending promotion must not be treated like an ordinary shop');
const goldenAllowed=inspectMatch(state({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)],funds:7,rewardOffer:promotion}),chess,{allowReward:true});
const goldenBuy=auditPurchase(before,goldenAllowed,flame,plan([ids.flame]),chess);
assert.deepEqual([goldenBuy.ok,goldenBuy.mergedGift,goldenBuy.gifts[0].uid],[true,true,5]);
assert.equal(isFlametailMergeOffer(promotion,chess),true);
assert.equal(pickFlametailMergeReward(goldenAllowed,plan([ids.custom],[ids.other]),chess,garrisons).id,ids.other,
  'keep always outranks economy/layers/ordinary regardless of buy list');
assert.equal(pickFlametailMergeReward(goldenAllowed,plan([ids.custom]),chess,garrisons).id,ids.other,
  'the custom buy list no longer affects free reward priority');
assert.equal(pickFlametailMergeReward(goldenAllowed,plan(),chess,garrisons).id,ids.other);
const withPromotion = rewardOffer => inspectMatch(state({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)],funds:7,rewardOffer}),chess,{allowReward:true});
const orderedPromotion={source:'merge',label:null,tier:4,queued:0,
  slots:[offer(ids.layerGain,0),offer(ids.econNext,0),offer(ids.keep,0),offer(ids.layerLater,0)]};
const ordered=withPromotion(orderedPromotion);
assert.deepEqual([pickFlametailMergeReward(ordered,plan([], [ids.keep]),chess,garrisons)?.id,
  pickFlametailMergeReward(ordered,plan([ids.keep]),chess,garrisons)?.id],
  [ids.keep,ids.econNext], 'promotion: keep → economy → immediate layer → other; buy does not win');
assert.equal(pickFlametailMergeReward(ordered,plan([], [ids.keep]),chess,garrisons)?.reason,'保留');
assert.equal(pickFlametailMergeReward(ordered,plan(),chess,garrisons)?.reason,'经济');
const stacked=withPromotion({...orderedPromotion,slots:[offer(ids.layerGain,0),offer(ids.layerLater,0)]});
assert.deepEqual([pickFlametailMergeReward(stacked,plan(),chess,garrisons)?.id,
  pickFlametailMergeReward(stacked,plan(),chess,garrisons)?.reason],
  [ids.layerGain,'叠层'],'delayed-only layer cannot outrank immediate stacking');
const customHidden=withPromotion({...orderedPromotion,slots:[offer(ids.hidden,0),offer(ids.layerLater,0)]});
assert.equal(pickFlametailMergeReward(customHidden,plan([ids.hidden]),chess,garrisons)?.id,ids.layerLater,
  'hidden cards in a custom buy list are not ordinary free rewards');
assert.equal(pickFlametailMergeReward(customHidden,plan([], [ids.hidden]),chess,garrisons)?.id,ids.hidden,
  'a specifically kept hidden option remains eligible if it is safe');
// Screenshot regression: 缪尔赛思 gifts an item; 圣聆初雪 and 蕾缪安 only
// have IN_BATTLE traits. Their effectType is a broad category and intentionally
// differs from effectKey, so both must remain selectable as ordinary cards.
const viOffer={source:'merge',label:null,tier:6,queued:0,
  slots:[offer(ids.viMuel,0),offer(ids.viSaint,0),offer(ids.viLem,0)]};
const viCtx=withPromotion(viOffer);
assert.equal(isFlametailMergeOffer(viOffer,chess),true);
assert.deepEqual([rewardTraitRank(ids.viMuel,chess,garrisons),
  rewardTraitRank(ids.viSaint,chess,garrisons),rewardTraitRank(ids.viLem,chess,garrisons)],
  [null,2,2]);
assert.deepEqual([pickFlametailMergeReward(viCtx,plan(),chess,garrisons)?.id,
  pickFlametailMergeReward(viCtx,plan(),chess,garrisons)?.reason,
  pickFlametailMergeReward(viCtx,plan([], [ids.viLem]),chess,garrisons)?.id],
  [ids.viSaint,'普通',ids.viLem], 'keep wins; otherwise choose the first safe VI card');
const viOld=inspectMatch(state({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true),op(7,ids.viSaint),op(8,ids.viSaint)],
  rewardOffer:viOffer}),chess,{allowReward:true});
assert.equal(pickFlametailMergeReward(viOld,plan([], [ids.viSaint]),chess,garrisons)?.id,ids.viLem,
  'a kept card that would merge old copies is still skipped');
const viClaimed=ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true),op(6,ids.viSaint)]});
assert.equal(auditFlametailMergeReward(viCtx,viClaimed,{id:ids.viSaint},chess).unit.uid,6);
assert.equal(auditSale(viClaimed,ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)]}),6).ok,true);
assert.equal(pickFlametailMergeReward(goldenAllowed,plan(),chess,null),null,
  'if the server lacks garrison metadata, the user must choose manually');
const claimed=ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true),op(6,ids.other)],funds:7});
assert.equal(auditFlametailMergeReward(goldenAllowed,claimed,{id:ids.other},chess).unit.uid,6);
assert.equal(auditFlametailMergeReward(goldenAllowed,ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true),op(6,ids.other),op(7,ids.custom)]}),
  {id:ids.other},chess).ok,false,'unexpected reward side effects cannot enter the sale queue');
assert.equal(auditFlametailMergeReward(goldenAllowed,ctx({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,ids.gift),op(6,ids.other)]}),{id:ids.other},chess).ok,false,
  'an old unit whose UID survived but ID changed must not be ignored');
for (const forged of [{...promotion,source:'special'},{...promotion,queued:1},
  {...promotion,label:'其他奖励'}, {...promotion,slots:[offer(ids.other,0),offer(ids.other,0)]}]) {
  assert.equal(isFlametailMergeOffer(forged,chess),false);
  const unexpected=inspectMatch(state({slots:[offer(ids.flame,1,true)],
    hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)],rewardOffer:forged}),chess,{allowReward:true});
  assert.equal(auditPurchase(before,unexpected,flame,plan([ids.flame]),chess).ok,false);
}
const oldUnit=ctx({slots:[offer(ids.flame,1)],hand:[op(1,ids.gift)]});
const consumed=inspectMatch(state({slots:[offer(ids.flame,1,true)],
  hand:[op(3,ids.flame),op(5,chess[ids.gift].goldenId,true)],rewardOffer:promotion}),chess,{allowReward:true});
assert.equal(auditPurchase(oldUnit,consumed,{...flame},plan([ids.flame]),chess).ok,false,
  'a disappearing old UID can NEVER be attributed to a newly merged gift');
const oldGiftSafe = ctx({slots:[offer(ids.flame,1)],hand:[op(1,ids.gift),coin(9)]});
const chosenFlame = pickCandidate(oldGiftSafe,plan([ids.flame]),chess);
const oldGiftUnchanged = ctx({slots:[offer(ids.flame,1,true)],funds:7,
  hand:[op(1,ids.gift),coin(9),op(3,ids.flame),op(4,ids.other)]});
assert.deepEqual([chosenFlame.id,
  auditPurchase(oldGiftSafe,oldGiftUnchanged,chosenFlame,plan([ids.flame]),chess).gifts[0].uid],
  [ids.flame,4], 'an old gift can coexist with verified NEW, unmerged gifts');
assert.equal(auditPurchase(oldGiftSafe,ctx({slots:[offer(ids.flame,1,true)],funds:7,
  hand:[op(1,chess[ids.gift].goldenId,true),coin(9),op(3,ids.flame),op(4,ids.other)]}),
  chosenFlame,plan([ids.flame]),chess).ok,false, 'same old UID with a changed card ID is never sold');
assert.equal(auditPurchase(oldGiftSafe,ctx({slots:[offer(ids.flame,1,true)],funds:7,
  board:[op(1,ids.gift)],hand:[coin(9),op(3,ids.flame),op(4,ids.other)]}),
  chosenFlame,plan([ids.flame]),chess).ok,false, 'an old card moved during purchase invalidates the sale');
assert.equal(auditPurchase(oldGiftSafe,ctx({slots:[offer(ids.flame,1,true)],funds:7,
  hand:[op(1,ids.gift),op(3,ids.flame),op(4,ids.other)]}),
  chosenFlame,plan([ids.flame]),chess).ok,false, 'old equipment disappearance invalidates the sale');
const safeOldMerge=inspectMatch(state({slots:[offer(ids.flame,1,true)],funds:7,
  hand:[op(1,ids.gift),coin(9),op(3,ids.flame),op(5,chess[ids.other].goldenId,true)],
  rewardOffer:promotion}),chess,{allowReward:true});
assert.equal(auditPurchase(oldGiftSafe,safeOldMerge,chosenFlame,plan([ids.flame]),chess).mergedGift,true,
  'three new matching gifts may merge while an unrelated OLD gift UID remains unchanged');
// Swire gives exactly one newly attributed coin. A coin merged with an identical old
// normal copy becomes the golden coin (+2 funds) and is still attributed to this buy;
// any other shape (e.g. a full bench destroyed it) leaves the coin unused but never
// blocks the verified sale.
before = ctx({ slots:[offer(ids.swire,1)],hand:[coin(1)] });
after = ctx({ slots:[offer(ids.swire,1,true)],hand:[coin(1),op(10,ids.swire),coin(11)],funds:7 });
const swire = pickCandidate(before,plan([ids.swire]),chess);
const gotCoin = auditPurchase(before,after,swire,plan([ids.swire]),chess);
assert.deepEqual([gotCoin.ok,gotCoin.parent.uid,gotCoin.coin.uid,gotCoin.coin.gain],[true,10,11,1]);
const coinSpent = ctx({slots:[offer(ids.swire,1,true)],hand:[coin(1),op(10,ids.swire)],funds:8});
assert.equal(auditCoinUse(after,coinSpent,gotCoin.parent,gotCoin.coin).ok,true);
assert.equal(auditCoinUse(after,ctx({slots:[offer(ids.swire,1,true)],hand:[coin(1),op(10,ids.swire)],funds:9}),gotCoin.parent,gotCoin.coin).ok,false);
const mergedCoin = ctx({slots:[offer(ids.swire,1,true)],hand:[op(10,ids.swire),{uid:11,id:'chess_item_1_03_e_b',kind:'item'}],funds:7});
const gotMerged = auditPurchase(before,mergedCoin,swire,plan([ids.swire]),chess);
assert.deepEqual([gotMerged.ok,gotMerged.coin.uid,gotMerged.coin.gain,gotMerged.coin.merged],[true,11,2,true]);
assert.equal(auditCoinUse(mergedCoin,ctx({slots:[offer(ids.swire,1,true)],hand:[op(10,ids.swire)],funds:9}),gotMerged.parent,gotMerged.coin).ok,true);
assert.equal(auditCoinUse(mergedCoin,ctx({slots:[offer(ids.swire,1,true)],hand:[op(10,ids.swire)],funds:8}),gotMerged.parent,gotMerged.coin).ok,false,
  'the golden coin must be audited as +2 funds');
const gotNone = auditPurchase(before,ctx({slots:[offer(ids.swire,1,true)],hand:[op(10,ids.swire)],funds:7}),swire,plan([ids.swire]),chess);
assert.deepEqual([gotNone.ok,gotNone.coin,gotNone.parent.uid],[true,null,10],
  'an unaccounted coin never blocks the verified Swire sale');
// Every normal/golden coin in hand or temp is usable; only a chess with a free
// equipment slot may receive one (a full carrier would destroy an equipped item).
assert.deepEqual(usableCoins(after).map(x=>x.uid),[1,11]);
assert.deepEqual(usableCoins(mergedCoin).map(x=>[x.uid,x.id]),[[11,'chess_item_1_03_e_b']]);
assert.equal(pickCoinTarget(after,[10]).uid,10);
assert.equal(pickCoinTarget(after,[1]).uid,10,'an item uid is never a target; any free-slot chess is used');
assert.equal(pickCoinTarget(ctx({slots:[offer(ids.swire,1,true)],
  hand:[{...op(10,ids.swire),items:[{uid:20,id:'a'},{uid:21,id:'b'}]},coin(11)]}),[10]),null,
  'a carrier with both equipment slots full must never receive a coin');
assert.equal(inspectMatch(state({hand:[coin(1),coin(1)]}),chess).ok,false,'duplicate item UIDs are unsafe');

// Only a proven Pinecone sale may offer a free pick. Economic gains/sales rank
// before immediate layers, then ordinary; keep affects sale protection only.
const reward = pineconeOffer([ids.cheap,ids.gift,ids.rare]);
assert.equal(inspectMatch(state({rewardOffer:reward}),chess).ok,false);
assert.equal(isPineconeOffer(reward,chess),false,'tier-4 card cannot masquerade as a tier-I reward');
const genuine=pineconeOffer([ids.cheap,ids.gift]);
const offered=inspectMatch(state({rewardOffer:genuine}),chess,{allowReward:true});
assert.equal(isPineconeOffer(offered.rewardOffer,chess),true);
assert.equal(pickPineconeReward(offered,plan([ids.cheap],[ids.gift]),chess,garrisons).id,ids.gift);
assert.equal(pickPineconeReward(offered,plan([ids.gift]),chess,garrisons).id,ids.gift);
assert.equal(pickPineconeReward(offered,plan([], [ids.cheap]),chess,garrisons).id,ids.gift,
  'a kept ordinary card must NOT beat a non-kept stacking reward');
const economics=pineconeOffer([ids.layerGain,ids.econSale,ids.econGain,ids.cheap]);
const economicChoice=inspectMatch(state({rewardOffer:economics}),chess,{allowReward:true});
assert.deepEqual([pickPineconeReward(economicChoice,plan([ids.layerGain],[ids.layerGain]),chess,garrisons)?.id,
  pickPineconeReward(economicChoice,plan([ids.layerGain],[ids.layerGain]),chess,garrisons)?.reason],
  [ids.econSale,'经济'],'sale-time economy outranks kept stacking; tie by slot');
assert.equal(pickPineconeReward(economicChoice,plan(),chess,null),null,
  'no garrison metadata: never guess a free choice');
const economyRisk=inspectMatch(state({rewardOffer:economics,hand:[op(1,ids.econSale),op(2,ids.econSale)]}),chess,{allowReward:true});
assert.equal(pickPineconeReward(economyRisk,plan(),chess,garrisons)?.id,ids.econGain,
  'a risky economic slot is skipped in favor of another safe economic slot');
const stackFallback=inspectMatch(state({rewardOffer:pineconeOffer([ids.unknownGain,ids.layerGain,ids.layerLater])}),chess,{allowReward:true});
assert.equal(pickPineconeReward(stackFallback,plan(),chess,garrisons)?.id,ids.layerGain);
const risk=inspectMatch(state({rewardOffer:genuine,hand:[op(1,ids.gift),op(2,ids.gift)]}),chess,{allowReward:true});
assert.equal(pickPineconeReward(risk,plan([], [ids.gift]),chess,garrisons).id,ids.cheap);
const allRisk=inspectMatch(state({rewardOffer:pineconeOffer([ids.cheap]),hand:[op(1,ids.cheap),op(2,ids.cheap)]}),chess,{allowReward:true});
assert.equal(pickPineconeReward(allRisk,plan(),chess,garrisons),null);
const chosen={id:ids.gift,slot:1};
const received=ctx({hand:[op(3,ids.gift)]});
assert.equal(auditReward(offered,received,chosen).unit.uid,3);
assert.equal(auditReward(offered,ctx({hand:[op(3,ids.gift),op(4,ids.cheap)]}),chosen).ok,false);
const pineBeforeOld=inspectMatch(state({rewardOffer:genuine,hand:[op(1,ids.cheap)]}),chess,{allowReward:true});
assert.equal(auditReward(pineBeforeOld,ctx({hand:[op(1,ids.econGain),op(3,ids.gift)]}),chosen).ok,false,
  'a preexisting UID must keep the same ID after a pure-gain reward');
assert.equal(isPineconeOffer({...genuine,label:'未知'},chess),false);
assert.equal(isPineconeOffer({...genuine,queued:1},chess),false);
console.log('auto-policy: investor ×2/×3 Flametail gifts + proven new-only merge reward, old-UID guards, Swire/Pinecone checks passed');
