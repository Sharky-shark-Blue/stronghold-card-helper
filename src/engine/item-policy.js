import { sameUnitWithPlacement } from './placement.js';
// Independent item policy. A shop item is never fed to the chess buy/sell path.
const ITEM_HAND_SIZE = 10;
const DEFAULT_ITEM_MERGE_COUNT = 2; // Game default (gamedata itemMergeCount) when a record has no upgradeNum.

// Mirrors the game server's _itemMergeable / completesItemMerge: a normal, mergeable EQUIP item
// whose golden record exists merges as soon as `need` identical copies would be owned.
// `lookup(id)` returns the game's own items.json record. null = rule unknown (fail closed).
export function itemMergeRule(id, lookup) {
  const rec = typeof lookup === 'function' ? lookup(id) : null;
  if (!rec || typeof rec !== 'object') return null;
  if (rec.isGolden === true || rec.itemType !== 'EQUIP' || rec.mergeable !== true) return { mergeable: false };
  const need = Number.isInteger(rec.upgradeNum) ? rec.upgradeNum : DEFAULT_ITEM_MERGE_COUNT;
  const goldenId = rec.upgradeChessId || rec.goldenId;
  if (!(need > 1 && need < 100) || typeof goldenId !== 'string' || goldenId === id || !lookup(goldenId)) {
    return { mergeable: false };
  }
  return { mergeable: true, need, goldenId };
}

// User choice: buying may merge with identical copies lying in hand/temp, but never with
// equipment already issued to an operator. The server consumes temp copies, then hand, then equipped.
export function planItemMerge(ctx, id, rule) {
  const copies = (ctx?.items || []).filter(item => item.id === id);
  if (rule === null || rule === undefined) {
    return copies.length ? { ok: false, reason: '游戏道具数据缺少合成规则，已持有同名道具时不自动买入' }
      : { ok: true, merge: null };
  }
  if (rule.mergeable !== true || copies.length + 1 < rule.need) return { ok: true, merge: null };
  if (copies.length + 1 > rule.need) return { ok: false, reason: '同名道具数量已达合成数却未合成，状态无法确认' };
  const bench = [...copies.filter(item => item.area === 'temp'), ...copies.filter(item => item.area === 'hand')];
  if (bench.length < rule.need - 1) return { ok: false, reason: '买入会与干员身上已配发的同名装备合成，已跳过' };
  return { ok: true, merge: { need: rule.need, goldenId: rule.goldenId,
    consumed: bench.slice(0, rule.need - 1).map(item => item.uid) } };
}

export function itemHoldingAllows(items, rule) {
  if (rule?.ownedTarget == null) return true;
  if (!Number.isInteger(rule.ownedTarget) || rule.ownedTarget < 1 || rule.ownedTarget > 99 ||
      !Array.isArray(items) || !Array.isArray(rule.targetIds) || !rule.targetIds.includes(rule.id)) return false;
  const held = items.filter(item => rule.targetIds.includes(item.id) && !(rule.excludeEquipped && item.area === 'equipped')).length;
  return held < rule.ownedTarget;
}
export function pickItemCandidate(ctx, plan) {
  if (!ctx?.ok || !Array.isArray(plan?.items) ||
      ctx.hand.length >= ITEM_HAND_SIZE && ctx.hand.every(Boolean)) return null;
  const allowed = new Map(plan.items.map(item => [item.id, item]));
  for (const [slot, offer] of ctx.slots.entries()) {
    if (!offer || offer.kind !== 'item' || offer.sold === true ||
        !Number.isSafeInteger(offer.price) || offer.price < 0 || offer.price > ctx.funds) continue;
    const rule = allowed.get(offer.id);
    if (!rule || rule.limit !== null && (!Number.isInteger(rule.limit) || rule.limit < 1) || // null = 不限
        !Number.isInteger(rule.used) || rule.used < 0 || rule.used >= (rule.limit ?? 9999) ||
        rule.minFunds !== null && ctx.funds <= rule.minFunds) continue;
    if (!itemHoldingAllows(ctx.items, rule)) continue;
    const merging = planItemMerge(ctx, offer.id, rule.merge);
    if (!merging.ok) continue; // e.g. would consume issued equipment: skip, do not stop the run.
    return {slot, id:offer.id, price:offer.price, sourceId:rule.sourceId, name:rule.name,
      ...(merging.merge ? { merge: merging.merge } : {})};
  }
  return null;
}

export function auditItemPurchase(before, after, chosen) {
  const fail = reason => ({ok:false,reason});
  const original = before?.slots?.[chosen?.slot], current = after?.slots?.[chosen?.slot];
  if (!before?.ok || !after?.ok || before.identity !== after.identity ||
      !original || original.kind !== 'item' || original.id !== chosen.id || original.price !== chosen.price || original.sold === true ||
      !current || current.kind !== 'item' || current.id !== chosen.id || current.sold !== true ||
      after.funds !== before.funds - chosen.price || after.rewardOffer) {
    return fail('道具购买前后商店、资金或对局不一致');
  }
  if (before.slots.length !== after.slots.length || before.slots.some((offer,index) => index !== chosen.slot &&
      (offer?.id !== after.slots[index]?.id || offer?.kind !== after.slots[index]?.kind ||
       offer?.price !== after.slots[index]?.price || offer?.sold !== after.slots[index]?.sold))) {
    return fail('道具购买时其他商店槽发生变化');
  }
  if (before.units.length !== after.units.length || before.units.some(unit => {
    const found = after.unitByUid.get(unit.uid);
    return !sameUnitWithPlacement(unit,found);
  })) return fail('道具购买时干员 UID 或装备发生变化');
  const merge = chosen.merge || null, consumed = new Set(merge ? merge.consumed : []);
  if (merge && (!Array.isArray(merge.consumed) || consumed.size !== merge.need - 1 ||
      typeof merge.goldenId !== 'string')) return fail('道具合成预期不完整');
  if (merge && [...consumed].some(uid => {
    const old = before.itemByUid.get(uid);
    return !old || old.id !== chosen.id || (old.area !== 'hand' && old.area !== 'temp') || after.itemByUid.has(uid);
  })) return fail('道具合成消耗的旧 UID 与预期不符');
  if (before.items.some(item => {
    if (consumed.has(item.uid)) return false;
    const found = after.itemByUid.get(item.uid);
    return !found || found.id !== item.id || found.area !== item.area || found.carrierUid !== item.carrierUid;
  })) return fail('道具购买时原有道具 UID 或位置发生变化');
  const fresh = after.items.filter(item => !before.itemByUid.has(item.uid));
  if (merge) {
    if (fresh.length !== 1 || fresh[0].id !== merge.goldenId || (fresh[0].area !== 'hand' && fresh[0].area !== 'temp') ||
        fresh[0].carrierUid !== null || after.items.length !== before.items.length - consumed.size + 1) {
      return fail('道具合成后的精锐 UID、ID 或位置无法唯一核对');
    }
    return {ok:true,item:fresh[0],merged:true};
  }
  if (fresh.length !== 1 || fresh[0].id !== chosen.id || fresh[0].area !== 'hand' ||
      fresh[0].carrierUid !== null || after.items.length !== before.items.length + 1) {
    return fail('新购道具的 UID、ID 或手牌位置无法唯一核对');
  }
  return {ok:true,item:fresh[0]};
}

// ---- 自动使用（消耗类道具 → 最近获得的干员） ----
const BENCH = new Set(['hand', 'temp']);
const MAX_EQUIPPED = 2; // Game equipPerChess. A full carrier would DESTROY its oldest item: never target it.

/** Game items.json facts that decide whether / how an item may be auto-used. null = unknown (fail closed). */
export function itemUseRule(id, lookup) {
  const rec = typeof lookup === 'function' ? lookup(id) : null;
  if (!rec || typeof rec !== 'object') return null;
  const kind = typeof rec.kind === 'string' ? rec.kind : '';
  if (rec.itemType !== 'EQUIP' || !kind.startsWith('consume_on_equip')) return { usable: false };
  const desc = typeof rec.desc === 'string' ? rec.desc : '';
  const keys = Array.isArray(rec.buffs) ? rec.buffs.map(buff => String(buff?.key || '')) : [];
  // 信标: "装备时，目标干员和本装备销毁…" — the carrier itself is destroyed.
  const destroysCarrier = /目标干员.{0,6}销毁|销毁.{0,6}目标干员/.test(desc) ||
    keys.some(key => key.startsWith('use_equip_recruit_new_char'));
  const delayed = kind === 'consume_on_equip_or_delayed'; // 博士投影: promotes a NORMAL operator to elite.
  return { usable: true, kind, destroysCarrier, needsNormal: delayed,
    staysEquipped: delayed && rec.isGolden !== true, promotes: delayed };
}

/**
 * Per-match order of "最近获得的干员": a chess UID is stamped when it is first seen anywhere
 * and again whenever it newly enters the board (上场). UIDs already present when the page
 * starts observing are seeded in UID order (the server issues UIDs incrementally).
 */
export function createRecency() {
  let scope = '', seq = 0;
  const stamp = new Map(), lastArea = new Map();
  function observe(state) {
    const p = state?.match?.private;
    if (!p || ![p.hand, p.board, p.temp].every(Array.isArray)) return;
    const now = new Map();
    for (const [area, list] of [['board', p.board], ['hand', p.hand], ['temp', p.temp]]) {
      for (const piece of list) if (piece?.kind === 'chess' && Number.isInteger(piece.uid)) now.set(piece.uid, area);
    }
    const key = `${state?.room?.code ?? ''}|${state?.me?.playerId ?? ''}`;
    const ordered = [...now.keys()].sort((a, b) => a - b);
    if (key !== scope) {
      scope = key; seq = 0; stamp.clear();
      for (const uid of ordered) stamp.set(uid, ++seq);
    } else {
      for (const uid of ordered) {
        if (!stamp.has(uid) || (now.get(uid) === 'board' && lastArea.get(uid) !== 'board')) stamp.set(uid, ++seq);
      }
      for (const uid of [...stamp.keys()]) if (!now.has(uid)) stamp.delete(uid);
    }
    lastArea.clear();
    for (const [uid, area] of now) lastArea.set(uid, area);
  }
  return { observe, rank: uid => stamp.get(uid) ?? 0 };
}

/**
 * Next (item, target) pair: an auto-use consumable in hand/temp, onto the most recent board
 * operator, then the most recent hand operator, that has a free equipment slot. Full
 * carriers are skipped (equipment is never replaced). `tried` holds "itemUid:targetUid"
 * pairs refused earlier this run; `done` holds item UIDs that must not be retried.
 */
export function pickItemUse(ctx, plan, chess, rank, { tried, done, keep } = {}) {
  if (!ctx?.ok || ctx.rewardOffer || !Array.isArray(plan?.useItems) || !plan.useItems.length) return null;
  const rules = new Map(plan.useItems.filter(rule => rule?.usable === true).map(rule => [rule.id, rule]));
  const order = typeof rank === 'function' ? rank : () => 0;
  const byRecency = area => ctx.units.filter(unit => unit.area === area)
    .sort((a, b) => (order(b.uid) - order(a.uid)) || b.uid - a.uid);
  const targets = [...byRecency('board'), ...byRecency('hand')];
  const items = ctx.items.filter(item => BENCH.has(item.area) && rules.has(item.id) && !done?.has(item.uid))
    .sort((a, b) => a.uid - b.uid);
  for (const item of items) {
    const rule = rules.get(item.id);
    for (const unit of targets) {
      if (!Number.isInteger(unit.equipped) || unit.equipped < 0 || unit.equipped >= MAX_EQUIPPED) continue;
      if (tried?.has(`${item.uid}:${unit.uid}`)) continue;
      if (rule.destroysCarrier && (keep?.has(unit.base) || chess?.[unit.id]?.isDiy === true)) continue;
      if (rule.needsNormal && unit.golden) continue;
      return { item, rule, target: unit };
    }
  }
  return null;
}

/** Verifies one auto-use: item left hand/temp, no other item lost, funds not reduced, no unexplained unit loss. */
export function auditItemUse(before, after, pick) {
  const fail = reason => ({ ok: false, reason });
  const { item, rule, target } = pick || {};
  if (!before?.ok || !after?.ok || before.identity !== after.identity) return fail('使用道具期间对局或回合已改变');
  if (!item || !rule || !target) return fail('道具使用预期不完整');
  const now = after.itemByUid.get(item.uid);
  if (now && !(rule.staysEquipped && now.area === 'equipped' && now.carrierUid === target.uid)) {
    return fail(BENCH.has(now.area) ? '道具仍在手牌/整备区，无法确认已使用' : '道具去向与预期不符');
  }
  if (after.funds < before.funds) return fail('使用道具后资金减少');
  if (before.items.some(old => old.uid !== item.uid && after.itemByUid.get(old.uid)?.id !== old.id)) {
    return fail('使用道具时其他道具丢失或变化');
  }
  const fresh = after.units.filter(unit => !before.unitByUid.has(unit.uid));
  const eliteBases = new Set(fresh.filter(unit => unit.golden).map(unit => unit.base));
  const lost = before.units.filter(unit => !after.unitByUid.has(unit.uid));
  if (lost.some(unit => !(unit.uid === target.uid && (rule.destroysCarrier || rule.promotes)) &&
      !(!unit.golden && eliteBases.has(unit.base)))) return fail('使用道具时有干员意外消失');
  return { ok: true, consumed: !now, fresh, gain: after.funds - before.funds, reward: !!after.rewardOffer };
}
