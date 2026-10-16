import { auditFlametailPurchase } from './flametail-audit.js';
import { sameUnitWithPlacement } from './placement.js';
import { auditOrdinaryPurchase, planRetainedMerge } from './trade-audit.js';
import { auditPackagingSale, isPackagingMergeOffer, isPineconeSaleOffer } from './packaging.js';
import { operatorBaseId, inspectInventory } from './inventory.js';

// Public-site auto reversal: pure decisions and UID auditing. Never sends game commands.
// Unknown state / effects always fail closed; a list lock only locks editing, never weakens the keep rule.
export const FLAMETAIL_ID = 'chess_char_4_19_a';
export const FLAMETAIL_GIFT_IDS = Object.freeze([
  'chess_char_1_19_a', // 野鬃
  'chess_char_2_18_a', // 灰毫
  'chess_char_4_20_a', // 远牙
]);
export const SWIRE_ID = 'chess_char_3_03_a';
export const SWIRE_COIN_ID = 'chess_item_1_03_e_a';
export const SWIRE_COIN_GOLDEN_ID = 'chess_item_1_03_e_b';
export const PINECONE_ID = 'chess_char_3_10_a';
const HAND_SIZE = 10;

export const baseId = operatorBaseId;

export function keepBases(plan, chess) {
  return new Set((Array.isArray(plan?.keep) ? plan.keep : [])
    .map(id => baseId(id, chess)).filter(Boolean));
}

// 持有目标是实时库存门槛，不写入禁用名单；数量减少后自然恢复可买。
function keepRuleAllows(ctx, base, rule, copies = 1) {
  if (!rule) return true;
  if (rule.minFunds != null && (!Number.isSafeInteger(rule.minFunds) || ctx?.funds <= rule.minFunds)) return false;
  if (rule.limit == null) return true;
  const held = ctx?.ownedCopies?.[base] ?? 0;
  return !!ctx?.ownedCopies && Number.isInteger(rule.limit) && rule.limit > 0 && rule.limit <= 99 &&
    Number.isInteger(held) && held >= 0 && held + copies <= rule.limit;
}

export function eligibleKeepBases(ctx, plan, chess) {
  const eligible = keepBases(plan, chess), blocked = new Set();
  for (const base of eligible) {
    if (!keepRuleAllows(ctx, base, plan?.keepRules?.[base])) { eligible.delete(base); blocked.add(base); }
  }
  return { eligible, blocked };
}

export function inspectMatch(state, chess, { allowReward = false } = {}) {
  const fail = reason => ({ ok: false, reason });
  if (!state || state.connection?.status !== 'online') return fail('游戏连接尚未就绪或已经断开');
  if (state.ui?.buildStale) return fail('游戏页面版本已过期');
  const me = state.me?.playerId;
  const room = state.room;
  const pub = state.match?.public;
  const priv = state.match?.private;
  if (typeof me !== 'string' || !me || !room?.inMatch || typeof room.code !== 'string' ||
      !Array.isArray(room.seats) || !room.seats.some(seat => seat?.playerId === me)) {
    return fail('无法确认本人在当前对局的座位');
  }
  if (pub?.phase !== 'PREP' || !Number.isInteger(pub.round) || !Array.isArray(pub.players) ||
      !pub.players.some(player => player?.playerId === me)) return fail('尚未进入本人的整备回合');
  if (pub.players.find(player => player?.playerId === me)?.autoplay === true) {
    return fail('AI 托管中，不能同时运行另一套自动买卖');
  }
  if (!priv || priv.alive === false || priv.ready !== false) return fail('已准备或不具备买卖权限');
  const rewardOffer = priv.shop?.rewardOffer;
  if (Array.isArray(rewardOffer?.slots) && rewardOffer.slots.length && !allowReward) {
    return fail('有晋升或特殊招募奖励待选择，先由你处理');
  }
  if (!priv.shop || !Array.isArray(priv.shop.slots) ||
      !Array.isArray(priv.hand) || !Array.isArray(priv.board) || !Array.isArray(priv.temp) ||
      !Number.isInteger(priv.funds) || priv.funds < 0 || !chess || typeof chess !== 'object') {
    return fail('游戏的私有商店或库存快照不完整');
  }
  const inventory = inspectInventory(priv, chess);
  if (!inventory.ok) return inventory;
  return { ...inventory, identity: `${room.code}|${me}|${pub.round}`,
    funds: priv.funds, slots: priv.shop.slots, refreshPrice: priv.shop.refreshPrice, shopLevel:priv.shop.level,
    rewardOffer: Array.isArray(rewardOffer?.slots) && rewardOffer.slots.length ? rewardOffer : null };
}

function mergeOnNext(ctx, id, chess) {
  const rec = chess[id];
  if (!rec || rec.isGolden || !rec.goldenId || !chess[rec.goldenId]) return false;
  const need = Number.isInteger(rec.upgradeNum) && rec.upgradeNum > 1 ? rec.upgradeNum : 3;
  const base = baseId(id, chess);
  return ctx.units.filter(unit => unit.base === base && !unit.golden).length + 1 >= need;
}

export function pickCandidate(ctx, plan, chess) {
  if (!ctx?.ok || !plan || !chess || ctx.hand.length >= HAND_SIZE && ctx.hand.every(Boolean)) return null;
  const { eligible: keep, blocked } = eligibleKeepBases(ctx, plan, chess);
  const custom = new Set((Array.isArray(plan.buy) ? plan.buy : [])
    .map(id => baseId(id, chess)).filter(Boolean));
  const excluded = new Set((Array.isArray(plan.excludedBuy) ? plan.excludedBuy : [])
    .map(id => baseId(id, chess)).filter(Boolean));
  const found = [];
  for (const [slot, offer] of ctx.slots.entries()) {
    if (!offer || offer.kind !== 'chess' || offer.sold || !chess[offer.id] ||
        typeof offer.price !== 'number' || !Number.isInteger(offer.price) ||
        offer.price < 0 || offer.price > ctx.funds) continue;
    const id = offer.id;
    const rec = chess[id];
    const base = baseId(id, chess);
    if (!base) continue;
    // User-confirmed priority: an active keep rule owns its operator. When its funds gate
    // is unmet or its current holding target is met, the operator is not bought at all — the
    // ordinary buy list and the cheap (price 0/1) path cannot buy it either.
    if (blocked.has(base)) continue;
    const retain = keep.has(base);
    if (retain && !keepRuleAllows(ctx, base, plan.keepRules?.[base], offer.golden === true || rec.isGolden === true ? 3 : 1)) continue;
    if (!retain && excluded.has(base)) continue; // A disabled buy rule never overrides an active keep rule.
    // Hidden/DIY/elite cards may only be bought when specifically kept AND actually offered by the real shop.
    const ordinary = rec.isGolden !== true && rec.visible === true && rec.isHidden !== true && rec.isDiy !== true;
    if (!retain && !ordinary) continue;
    const customBuy = ordinary && custom.has(base);
    const cheap = ordinary && offer.price <= 1;
    if (!retain && !customBuy && !cheap) continue;
    const keepMerge=retain ? planRetainedMerge(ctx,id,chess) : null;
    if (mergeOnNext(ctx,id,chess) && (!retain || !keepMerge)) continue; // Do not consume an existing unit to sell a new one.
    if (base === FLAMETAIL_ID) {
      // Elite Flametail gifts 2× the normal amount per trigger. Until its own
      // multi-merge proof is implemented, never purchase it automatically.
      if (id !== FLAMETAIL_ID ||
          FLAMETAIL_GIFT_IDS.some(gift => !chess[gift]?.goldenId || !chess[chess[gift].goldenId]) ||
          mergeOnNext(ctx, id, chess)) continue;
      // Old normal gifts may participate in one exactly accounted gift merge.
      // Its new elite can be sold subject to keep targets; other old UID changes fail closed.
    }
    found.push({ slot, id, base, price: offer.price, reason: retain ? '保留' : customBuy ? '自定义' : '低价',
      priority: retain ? 0 : customBuy ? 1 : 2, ...(keepMerge ? {keepMerge} : {}) });
  }
  found.sort((a, b) => a.priority - b.priority || a.slot - b.slot);
  return found[0] || null;
}

// A special offer is only ours when the bridge saw THIS run sell a freshly bought Pinecone.
// The UI independently checks the authoritative source, label, tier and every free slot.
export const isPineconeOffer = isPineconeSaleOffer;

// The same-origin game's trait metadata decides which free card pays during
// this transaction. Do not guess from names, cost or future-round passives:
// non-kept rewards are sold immediately, so a PREP_FIN trait gives no value.
// Keep this allowlist in sync with runtime-main.js's independent safety check.
const REWARD_ECONOMY = new Set(['SERVER_ONCE_GOLD', 'SERVER_GAIN_FREE_REFRESH_COUNT']);
const REWARD_LAYERS = new Set([
  'SERVER_ADD_BOND', 'SERVER_ADD_BOND_CHESS_ALL', 'SERVER_ADD_BOND_METHOD',
  'SERVER_ADD_MULTIPLE_BOND', 'SERVER_ADD_BOND_ACTIVATED_MOST_LAYER',
]);
const REWARD_LATER_EVENTS = new Set([
  'IN_BATTLE', 'SERVER_PREP_FIN', 'SERVER_PREP_START', 'SERVER_REFRESH_SHOP', 'SERVER_PRICE',
]);

export function rewardTraitRank(id, chess, garrisons) {
  const rec = chess?.[id];
  if (!rec || !garrisons || typeof garrisons !== 'object' || !Array.isArray(rec.garrisonIds)) return null;
  let economy = false, layers = false;
  for (const gid of rec.garrisonIds) {
    const trait = typeof gid === 'string' ? garrisons[gid] : null;
    if (!trait || typeof trait.eventType !== 'string') return null;
    if (trait.eventType === 'SERVER_GAIN' || trait.eventType === 'SERVER_CHESS_SOLD') {
      // Only immediate server effects use effectType as their executable key.
      // For IN_BATTLE, effectType is a broad category (e.g. GAIN_BUFF) and
      // effectKey is the concrete handler; inequality there is NORMAL.
      if (typeof trait.effectType === 'string' && trait.effectType !== trait.effectKey) return null;
      if (REWARD_ECONOMY.has(trait.effectKey)) economy = true;
      else if (REWARD_LAYERS.has(trait.effectKey)) layers = true;
      else if (id === PINECONE_ID && trait.eventType === 'SERVER_CHESS_SOLD' &&
               trait.effectKey === 'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS') {
        // Existing, separately proven Pinecone-sale → tier-I-offer path.
      } else return null; // No surprise equipment, chess, unknown on-gain or on-sale effects.
    } else if (!REWARD_LATER_EVENTS.has(trait.eventType)) return null;
  }
  return economy ? 0 : layers ? 1 : 2;
}

export function pickPineconeReward(ctx, plan, chess, garrisons) {
  if (!ctx?.ok || !isPineconeOffer(ctx.rewardOffer, chess) ||
      ctx.hand.length >= HAND_SIZE && ctx.hand.every(Boolean)) return null;
  const safe = ctx.rewardOffer.slots.map((offer, slot) => ({ id: offer.id, slot,
    base: baseId(offer.id, chess), rank: rewardTraitRank(offer.id, chess, garrisons) }))
    .filter(x => x.base && x.rank !== null && !mergeOnNext(ctx, x.id, chess));
  // Explicit user choice: economy → immediate layers → other; the keep and buy
  // lists do NOT change the pick. The keep list still protects the claimed UID.
  safe.sort((a, b) => a.rank - b.rank || a.slot - b.slot);
  return safe[0] ? { ...safe[0], reason: ['经济', '叠层', '普通'][safe[0].rank] } : null;
}

// Only a uniquely proved gift merge grants this run a one-use reward allowance.
// Match the game's ordinary free three-choice promotion, including the shop-level tier.
export function isFlametailMergeOffer(offer, chess, shopLevel) {
  return isPackagingMergeOffer(offer,chess,shopLevel);
}

// A reward with a proven pure economy/layer trait may fire on gain. Every other
// gain-time effect (including equipment or extra chess) is excluded BEFORE
// claiming it; UID/item/funds checks after the claim still fail closed.
export function pickFlametailMergeReward(ctx, plan, chess, garrisons) {
  if (!ctx?.ok || !isFlametailMergeOffer(ctx.rewardOffer, chess,ctx.shopLevel) ||
      ctx.hand.length >= HAND_SIZE && ctx.hand.every(Boolean)) return null;
  const keep = eligibleKeepBases(ctx, plan, chess).eligible;
  const safe = ctx.rewardOffer.slots.map((offer, slot) => ({ id: offer.id, slot,
    base: baseId(offer.id, chess), rank: rewardTraitRank(offer.id, chess, garrisons) }))
    .filter(x => {
      const rec = chess[x.id];
      return x.base && x.rank !== null && !mergeOnNext(ctx, x.id, chess) &&
        (rec.visible === true && rec.isHidden !== true && rec.isDiy !== true || keep.has(x.base));
    });
  // Economic value has priority, not the keep list. Prefer the user's named example
  // only after this server's actual effects prove it economic; otherwise preserve slot order.
  const named=x=>x.rank===0 && chess[x.id].name==='新约能天使' ? 0 : 1;
  safe.sort((a,b)=>a.rank-b.rank || named(a)-named(b) || a.slot-b.slot);
  return safe[0] ? {...safe[0],reason:['经济','叠层','普通'][safe[0].rank]} : null;
}

export function auditFlametailMergeReward(before, after, chosen, chess) {
  const fail = reason => ({ ok: false, reason });
  if (!before?.ok || !after?.ok || before.identity !== after.identity ||
      !isFlametailMergeOffer(before.rewardOffer, chess,before.shopLevel) || after.rewardOffer) {
    return fail('晋升奖励前后对局或待选项不一致');
  }
  if (after.funds < before.funds) return fail('免费晋升奖励后资金减少，已停止');
  const fresh = after.units.filter(x => !before.unitByUid.has(x.uid));
  const changedOld = before.units.some(x => !sameUnitWithPlacement(x,after.unitByUid.get(x.uid)));
  const gainedItems = after.items.filter(x => !before.itemByUid.has(x.uid));
  const changedItems = before.items.some(x => {
    const next = after.itemByUid.get(x.uid);
    return !next || next.id !== x.id || next.area !== x.area || next.carrierUid !== x.carrierUid;
  });
  if (fresh.length !== 1 || fresh[0].id !== chosen.id || fresh[0].equipped!==0 || fresh[0].golden ||
      !['hand','temp','board'].includes(fresh[0].area) || changedOld || gainedItems.length || changedItems) return fail('晋升选卡的 UID 或库存变化无法确认');
  return { ok: true, unit: fresh[0] };
}

export function auditReward(before, after, chosen) {
  const fail = reason => ({ ok: false, reason });
  if (!before?.ok || !after?.ok || before.identity !== after.identity ||
      !before.rewardOffer || after.rewardOffer) return fail('松果选卡前后对局或待选项不一致');
  if (after.funds < before.funds) return fail('免费选卡后资金减少，已停止');
  const fresh = after.units.filter(x => !before.unitByUid.has(x.uid));
  const changedOld = before.units.some(x => after.unitByUid.get(x.uid)?.id !== x.id);
  const gainedItems = after.items.filter(x => !before.itemByUid.has(x.uid));
  const changedItems = before.items.some(x => {
    const next = after.itemByUid.get(x.uid);
    return !next || next.id !== x.id || next.area !== x.area || next.carrierUid !== x.carrierUid;
  });
  if (fresh.length !== 1 || fresh[0].id !== chosen.id || changedOld ||
      gainedItems.length || changedItems) return fail('松果免费选卡的 UID 或库存变化无法确认');
  return { ok: true, unit: fresh[0] };
}

export function auditCoinUse(before, after, parent, coin) {
  const fail = reason => ({ ok: false, reason });
  const gain = coin?.id === SWIRE_COIN_GOLDEN_ID ? 2 : 1;
  if (!before?.ok || !after?.ok || before.identity !== after.identity ||
      after.funds !== before.funds + gain ||
      (coin.id !== SWIRE_COIN_ID && coin.id !== SWIRE_COIN_GOLDEN_ID) ||
      after.itemByUid.has(coin.uid) || after.unitByUid.get(parent.uid)?.id !== parent.id) {
    return fail('盟约之币使用后的资金或 UID 无法核对');
  }
  if (before.units.length !== after.units.length ||
      before.units.some(x => after.unitByUid.get(x.uid)?.id !== x.id) ||
      after.items.length !== before.items.length - 1 ||
      before.items.some(x => x.uid !== coin.uid &&
        (after.itemByUid.get(x.uid)?.id !== x.id || after.itemByUid.get(x.uid)?.carrierUid !== x.carrierUid))) {
    return fail('盟约之币使用后库存出现额外变化');
  }
  return { ok: true, gain };
}

/** Every normal/golden 盟约之币 sitting in hand or temp, normal coins first. */
export function usableCoins(ctx) {
  if (!ctx?.ok) return [];
  return ctx.items
    .filter(item => (item.id === SWIRE_COIN_ID || item.id === SWIRE_COIN_GOLDEN_ID) &&
      (item.area === 'hand' || item.area === 'temp'))
    .sort((a, b) => (a.id === SWIRE_COIN_ID ? 0 : 1) - (b.id === SWIRE_COIN_ID ? 0 : 1) ||
      a.uid - b.uid);
}

/**
 * A coin is consumed on equip, and equipping onto a carrier whose equipment slots are
 * full would DESTROY one of its equipped items (the server replace rule). Only a chess
 * with a free slot may receive a coin; preferred UIDs are checked first.
 */
export function pickCoinTarget(ctx, preferUids = []) {
  if (!ctx?.ok) return null;
  const safe = unit => !!unit && Number.isInteger(unit.equipped) && unit.equipped >= 0 && unit.equipped < 2;
  for (const uid of Array.isArray(preferUids) ? preferUids : []) {
    const unit = ctx.unitByUid.get(uid);
    if (safe(unit)) return unit;
  }
  return ctx.units.find(safe) || null;
}

export function auditPurchase(before, after, candidate, plan, chess) {
  const retain=keepBases(plan,chess).has(candidate.base);
  if(candidate.id===FLAMETAIL_ID){
    const checked=auditFlametailPurchase(before,after,candidate,{chess});
    return checked.ok ? {...checked,retain} : checked;
  }
  const checked=auditOrdinaryPurchase(before,after,candidate,{chess,retained:retain});
  return checked.ok ? {...checked,gifts:[],mergedGift:false,retain} : checked;
}

export const auditSale = auditPackagingSale;

export function pickPackagingMergeReward(ctx, plan, chess, garrisons) {
  return ctx?.ok && isPackagingMergeOffer(ctx.rewardOffer,chess,ctx.shopLevel) ?
    pickFlametailMergeReward(ctx,plan,chess,garrisons) : null;
}
