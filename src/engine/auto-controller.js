import { auditManualTransaction } from './manual-policy.js';
import { canSellSurplusGift } from './flametail-flow.js';
import { sameUnitWithPlacement, changedDeployment } from './placement.js';
import { makeSaleIntent } from './trade-audit.js';
import { isPackagingMergeOffer, mergeOfferStamp, auditPendingMergeSale, auditOverflowPlacement } from './packaging.js';
import { pickPackagingMergeReward } from './auto-policy.js';
// Serial, manually armed automation for the clicked game tab on any compatible origin.
// All buy/sell/refresh requests use the same-origin game store/actions bridge. No server patch is used.
import {
  inspectMatch, keepBases, PINECONE_ID, FLAMETAIL_ID, SWIRE_COIN_GOLDEN_ID,
  pickCandidate, auditPurchase, auditSale, isPineconeOffer,
  pickPineconeReward, auditReward, auditCoinUse, usableCoins, pickCoinTarget,
  isFlametailMergeOffer, pickFlametailMergeReward, auditFlametailMergeReward,
} from './auto-policy.js';
import { pickItemCandidate, auditItemPurchase, pickItemUse, auditItemUse } from './item-policy.js';

const ACK_WAIT_MS = 4500;
const REFRESH_GAP_MS = 300; // a pace, NOT a refresh-count or spending limit

export function createAutoController({ read, subscribe, buy, buyItem, sell, refresh, useCoin, useItem, recency, reward, mergeReward,
  acquireLock, getPlan, chess, garrisons, gameItems = null, onStatus, onAudit, onRecordPurchase }) {
  if (![read, subscribe, buy, sell, refresh, useCoin, reward, mergeReward, acquireLock, getPlan].every(fn => typeof fn === 'function') ||
      !chess || typeof chess !== 'object') throw new Error('自动倒转接口不完整');

  let running = false;
  let starting = false;
  let busy = false;
  let manualContext = null;
  let readyHold=false;
  let queued = false;
  let planQueued = false;
  const settingsProtected=new Set(), transactionKeeps=new Set();
  let generation = 0;
  let identity = '';
  let lastRefreshAt = 0;
  let pineconePending = false;
  let packagingSalePending=false, packagingPending=false;
  let keepPurchasePending=false, keepMergePending=false;
  let flametailPurchasePending = false; // temporary allowance only while our buy ACK is being audited
  let flametailMergePending = false; // one gift merge; all consumed old copies independently accounted
  let releaseLock = null;
  let unsubscribe = null;
  const waitAborts = new Set();
  const placementProtected=new Set();
  let placementPrevious=null;
  function observePlacement(snap){
    if(!snap?.ok)return;
    if(placementPrevious?.identity===snap.identity){
      for(const unit of snap.units)if(changedDeployment(placementPrevious.unitByUid.get(unit.uid),unit))placementProtected.add(unit.uid);
    }
    placementPrevious=snap;
  }
  const coinFailures = new Set(); // coin UIDs whose use failed this run: never retried automatically
  let usePending = false; // only while OUR auto-use ACK/push is being audited
  const useTried = new Set(); // "itemUid:targetUid" pairs refused this run: try the next operator instead
  const useDone = new Set(); // item UIDs whose outcome is ambiguous this run: never re-sent automatically
  let useIdleNote = '';
  const totals = { bought: 0, sold: 0, kept: 0, refreshed: 0 };

  async function writeAudit(kind, summary, meta = {}, level = 'info') {
    if (!onAudit) return;
    await onAudit({ kind, level, summary,
      meta: { round: read()?.match?.public?.round, ...totals, ...meta } });
  }
  function report(state, message) {
    onStatus?.({ state, message, running, starting, ...totals });
    // Idle snapshots can be frequent; the audit adapter deduplicates equal wait messages.
    const kind = { waiting: 'wait', paused: 'pause', blocked: 'guard' }[state];
    if (kind) void writeAudit(kind, message, {}, state === 'waiting' ? 'info' : 'warn').catch(() => {});
  }
  function releaseIfIdle() {
    if (!running && !starting && !busy && !manualContext && releaseLock) {
      const release = releaseLock; releaseLock = null;
      try { release(); } catch { /* browser lock is released on page close anyway */ }
    }
  }
  function stop(reason = '已手动停止') {
    const wasLive = running || starting;
    running = false;readyHold=false;
    starting = false;
    generation++;
    pineconePending = false; packagingSalePending=false;packagingPending=false;
    keepPurchasePending=false;keepMergePending=false;
    flametailPurchasePending = false;
    flametailMergePending = false;
    usePending = false;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    for (const abort of [...waitAborts]) abort();
    waitAborts.clear();
    releaseIfIdle();
    if (wasLive) report('paused', reason);
    return wasLive;
  }
  function sameUnits(a, b) {
    return a.units.length===b.units.length && a.units.every(unit=>sameUnitWithPlacement(unit,b.unitByUid.get(unit.uid)));
  }
  function sameItems(a, b) {
    return a.items.length === b.items.length && a.items.every(item => {
      const other = b.itemByUid.get(item.uid);
      return other?.id === item.id && other.area === item.area &&
        other.carrierUid === item.carrierUid;
    });
  }
  function sameOffer(a, b) {
    return !!a && !!b && a.source === b.source && a.label === b.label &&
      a.tier === b.tier && a.queued === b.queued && sameSlots(a.slots, b.slots);
  }
  function sameSlots(a, b) {
    return a.length === b.length && a.every((offer, index) => {
      const other = b[index];
      if (!offer || !other) return !offer && !other;
      return offer.id === other.id && offer.kind === other.kind &&
        offer.price === other.price && offer.sold === other.sold;
    });
  }
  const copySlots = slots => slots.map(offer => offer ?
    ({ id: offer.id, kind: offer.kind, price: offer.price, sold: offer.sold === true }) : null);
  function waitGap(ms) {
    if (ms <= 0) return Promise.resolve(true);
    return new Promise(resolve => {
      let done = false;
      let timer;
      const finish = value => {
        if (done) return;
        done = true; clearTimeout(timer); waitAborts.delete(cancel); resolve(value);
      };
      const cancel = () => finish(false);
      waitAborts.add(cancel);
      timer = setTimeout(() => finish(true), ms);
    });
  }
  const rewardAllowed = offer => !offer || usePending ||
    ((packagingSalePending || packagingPending || keepPurchasePending || keepMergePending) && isPackagingMergeOffer(offer,chess,read()?.match?.private?.shop?.level)) ||
    (pineconePending && isPineconeOffer(offer, chess)) ||
    ((flametailPurchasePending || flametailMergePending) && isFlametailMergeOffer(offer, chess,read()?.match?.private?.shop?.level));
  const allowReward = () => keepPurchasePending || keepMergePending || packagingSalePending || packagingPending || usePending || pineconePending || flametailPurchasePending || flametailMergePending;
  function validCurrent() {
    const ctx = inspectMatch(read(), chess, { allowReward: allowReward() });
    if (!ctx.ok) { stop(ctx.reason); return null; }
    if (!rewardAllowed(ctx.rewardOffer)) {
      stop('出现未核对的晋升或特殊招募奖励，已停止；请手动处理'); return null;
    }
    if (ctx.identity !== identity) { stop('对局或回合已改变，重新启动前请检查名单'); return null; }
    observePlacement(ctx);
    return ctx;
  }
  function unsentCurrent(before){
    const next=validCurrent();if(!next)return null;
    if(!sameUnits(before,next) || !sameItems(before,next) || before.funds!==next.funds ||
      before.shopLevel!==next.shopLevel || before.refreshPrice!==next.refreshPrice || !sameSlots(before.slots,next.slots) ||
      (before.rewardOffer || next.rewardOffer) && !sameOffer(before.rewardOffer,next.rewardOffer)){
      stop('设置变更取消未发送动作时，发现未知游戏库存或交易变化；已停止');return null;
    }
    return next;
  }
  function waitFor(predicate, timeout = ACK_WAIT_MS) {
    return new Promise(resolve => {
      let finished = false;
      let timer;
      let off = null;
      function finish(state) {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        if (off) off();
        waitAborts.delete(cancel);
        resolve(state);
      }
      const cancel = () => finish(null);
      waitAborts.add(cancel);
      timer = setTimeout(cancel, timeout);
      off = subscribe(state => { if (predicate(state)) finish(state); });
      const latest = read();
      if (predicate(latest)) finish(latest); // state can arrive before the purchase ACK
    });
  }
  function schedule() {
    if (!running || busy || queued || manualContext || readyHold) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (running && !busy) void step();
    });
  }

  async function refreshEmptyShop(before, mine) {
    const price = before.refreshPrice;
    if (!Number.isSafeInteger(price) || price < 0) {
      stop('该服务器未提供可核对的商店刷新价格，已暂停；不会猜测费用');
      return false;
    }
    if (before.funds < price) {
      report('waiting', `商店暂无合格干员；刷新需 ${price} 资金，当前仅 ${before.funds}，等待状态变化`);
      return false;
    }
    const remaining = REFRESH_GAP_MS - (Date.now() - lastRefreshAt);
    if (remaining > 0) {
      report('working', `商店暂无合格干员，等待下一次刷新（实价 ${price}）`);
      if (!await waitGap(remaining)) return false;
    }
    if (!running || mine !== generation) return false;
    const current = validCurrent();
    if (!current) return false;
    if (!sameSlots(before.slots, current.slots) || !sameUnits(before, current) || !sameItems(before, current) ||
        before.funds !== current.funds || before.refreshPrice !== current.refreshPrice) {
      // A changed shop may already contain a candidate. Do not refresh based on an old snapshot.
      if (pickCandidate(current, getPlan(), chess) || pickItemCandidate(current, getPlan())) return true;
      stop('刷新前商店、资金或库存已变化；本次刷新已取消，请核对后重新启动');
      return false;
    }
    if (pickCandidate(current, getPlan(), chess) || pickItemCandidate(current, getPlan())) return true;
    try {
      await writeAudit('refresh_request', `准备刷新商店 · 实价 ${price} · 第 ${totals.refreshed + 1} 次`,
        { price, refreshed: totals.refreshed });
    } catch (error) { stop(`刷新前无法写入日志：${error?.message || '本地存储不可用'}`); return false; }
    if (!running || mine !== generation) return false;
    const rechecked = validCurrent();
    if (!rechecked) return false;
    if (!sameSlots(before.slots, rechecked.slots) || !sameUnits(before, rechecked) || !sameItems(before, rechecked) ||
        before.funds !== rechecked.funds || before.refreshPrice !== rechecked.refreshPrice) {
      stop('写入日志期间商店、库存或刷新价已变化，取消该次刷新');
      return false;
    }
    if(pickCandidate(rechecked,getPlan(),chess) || pickItemCandidate(rechecked,getPlan()))return true;
    report('working', `正在刷新商店 · 第 ${totals.refreshed + 1} 次 · 实价 ${price}`);
    let accepted;
    lastRefreshAt = Date.now();
    try { accepted = await refresh({ price, slots: copySlots(before.slots),planStamp:JSON.stringify(getPlan()) }); }
    catch (error) { stop(`刷新失败：${error?.message || '回执不可用'}；本次不会自动重试，请核对资金`); return false; }
    if (!running || mine !== generation) {
      report('paused', '已停止；刷新指令可能已发出，请核对商店与资金');
      return false;
    }
    if(accepted===null)return !!unsentCurrent(before);
    if (accepted !== true) { stop('刷新被游戏拒绝，已停止且不会自动重试'); return false; }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess);
      return snap.ok && snap.identity === identity &&
        (snap.funds !== before.funds || snap.refreshPrice !== price ||
          !sameSlots(before.slots, snap.slots));
    }, 5500);
    if (!running || mine !== generation) return false;
    if (!pushed) { stop('刷新后状态未确认，已停止；不会自动重复刷新或扣费'); return false; }
    const after = inspectMatch(pushed, chess);
    if (!sameUnits(before, after) || !sameItems(before, after) || !Number.isSafeInteger(after.refreshPrice) || after.refreshPrice < 0 ||
        (price > 0 && before.funds - after.funds !== price) ||
        (price === 0 && sameSlots(before.slots, after.slots) && after.refreshPrice === price)) {
      stop('刷新后商店、库存或实际扣费无法核对，已停止；不会自动重试');
      return false;
    }
    totals.refreshed++;
    try { await writeAudit('refresh_ok', `刷新已核对 · 第 ${totals.refreshed} 次 · 实付 ${price}`,
      { price, refreshed: totals.refreshed }); }
    catch (error) { stop(`刷新已完成但核对日志未保存：${error?.message || '存储不可用'}；不再刷新`); return false; }
    if (!running || mine !== generation) return false;
    report('running', `已刷新 ${totals.refreshed} 次（本次实付 ${price}）；继续查找合格干员`);
    return true;
  }

  async function purchaseItem(before, candidate, mine) {
    const name = candidate.name || candidate.id;
    if (typeof buyItem !== 'function' || typeof onRecordPurchase !== 'function') {
      stop('道具购买或持久计数接口未就绪，已停止；不会下单'); return false;
    }
    try { await writeAudit('item_buy_request', `准备买入道具 ${name} · 实价 ${candidate.price}`,
      { itemId:candidate.id, slot:candidate.slot, price:candidate.price }); }
    catch (error) { stop(`道具下单前日志不可用：${error?.message || '本地存储不可用'}`); return false; }
    if (!running || mine !== generation) return false;
    const current = validCurrent(), still = current && pickItemCandidate(current, getPlan());
    if (!current || !sameSlots(before.slots, current.slots) || !sameUnits(before,current) ||
        !sameItems(before,current) || before.funds !== current.funds) {
      if (current) stop('道具下单前商店、资金或库存已变化，已取消');
      return false;
    }
    if (!still || still.id !== candidate.id || still.slot !== candidate.slot) return true;
    const mergeNote = candidate.merge ? '（将与手牌/整备区同名道具合成精锐）' : '';
    report('working', `正在买入道具 ${name}${mergeNote} · 实价 ${candidate.price}`);
    let receipt,uid;
    try { receipt = await buyItem(candidate.slot, { id:candidate.id, price:candidate.price, merge:candidate.merge || null,planStamp:JSON.stringify(getPlan()) }); }
    catch (error) { stop(`道具 ${name} 购买或 UID 核对不确定：${error?.message || '未知原因'}；不自动重试，请人工核对次数`); return false; }
    if(receipt===null)return !!unsentCurrent(before);
    uid=typeof receipt==='object' ? receipt.uid : receipt;
    if(uid === null)return true; // Explicit pre-send switch cancellation; no purchase was issued.
    if (!running || mine !== generation) {
      report('paused', `已停止；道具 ${name} 的买入可能已生效，请人工核对次数`); return false;
    }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state,chess);
      return snap.ok && snap.identity === identity && snap.slots[candidate.slot]?.id === candidate.id &&
        snap.slots[candidate.slot]?.sold === true && snap.itemByUid.has(uid);
    });
    if (!running || mine !== generation) return false;
    if (!pushed) { stop(`道具 ${name} 买入后的 UID 快照未确认；不重试，请人工核对次数`); return false; }
    const checked = auditItemPurchase(before, inspectMatch(pushed,chess), candidate);
    if (!checked.ok || checked.item.uid !== uid) {
      stop(`道具 ${name}：${checked.reason || '主世界与工作台核对的 UID 不同'}；不重试，请人工核对次数`); return false;
    }
    totals.bought++;
    let counted;
    try { counted=await onRecordPurchase({kind:'item',sourceId:receipt?.sourceId || candidate.sourceId,realId:candidate.id,uid,epoch:receipt?.epoch ?? getPlan().epoch}); }
    catch (error) { stop(`道具已买入，但本局次数保存失败：${error?.message || '本地存储不可用'}；已停止，请人工核对`); return false; }
    if (!running || mine !== generation) return false;
    const merged = checked.merged === true;
    try { await writeAudit('item_buy_ok', `道具 ${name} 买入已核对${merged ? '，已合成精锐' : ''} · UID ${uid}`,
      {itemId:candidate.id,itemUid:uid,slot:candidate.slot,price:candidate.price,
        ...(merged ? {mergedInto:checked.item.id,consumedUids:[...candidate.merge.consumed]} : {})}); }
    catch (error) { stop(`道具已买入但日志保存失败：${error?.message || '本地存储不可用'}`); return false; }
    report('running', `道具 ${name} 已买入${merged ? '并合成精锐' : ''}，${counted?.counted===false ? '保留交易记录，不恢复已移除或重置配置' : '已记录本局次数'} · UID ${uid}`);
    return running && mine === generation;
  }

  async function warnAudit(kind, summary, meta = {}) {
    try { await writeAudit(kind, summary, meta, 'warn'); }
    catch (error) { stop(`警告日志保存失败：${error?.message || '存储不可用'}`); return false; }
    return true;
  }

  // Uses ONE audited coin (normal +1 / golden +2 funds) on a chess with a free equipment
  // slot. A coin-side problem must never strand an already-verified purchase: every coin
  // failure downgrades to a warning and the flow continues (user-confirmed policy).
  async function useOneCoin(current, coin, preferUids, mine, originLabel) {
    const gain = coin.gain || (coin.id === SWIRE_COIN_GOLDEN_ID ? 2 : 1);
    const ready = validCurrent();
    if (!ready) return null;
    if (!sameUnits(current, ready) || !sameItems(current, ready) || ready.funds !== current.funds ||
        ready.itemByUid.get(coin.uid)?.id !== coin.id) {
      coinFailures.add(coin.uid);
      if (!await warnAudit('coin_warn', `用币前状态已变化，跳过该枚盟约之币 · UID ${coin.uid}`, { itemUid: coin.uid })) return null;
      return ready;
    }
    const target = pickCoinTarget(ready, preferUids);
    if (!target) {
      coinFailures.add(coin.uid);
      if (!await warnAudit('coin_warn', '没有装备位空闲的干员可作为用币目标，跳过该枚盟约之币', { itemUid: coin.uid })) return null;
      return ready;
    }
    const targetName = chess[target.id]?.name || target.id;
    report('working', `正在使用${originLabel} · UID ${coin.uid} · 预期资金 +${gain}`);
    try {
      await writeAudit('coin_request', `准备使用${originLabel} · UID ${coin.uid} → ${targetName} UID ${target.uid}`,
        { itemUid: coin.uid, targetUid: target.uid, gain });
    } catch (error) { stop(`用币前日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    let accepted;
    try { accepted = await useCoin(coin.uid, target.uid); }
    catch (error) {
      coinFailures.add(coin.uid);
      const latest = validCurrent();
      if (!latest) return null;
      if (!await warnAudit('coin_warn', `赠币使用失败：${error?.message || '回执不可用'}；跳过该币，继续后续流程`, { itemUid: coin.uid })) return null;
      return latest;
    }
    if (!running || mine !== generation) {
      report('paused', '已停止；赠币指令可能已发出，请核对资金和道具');
      return null;
    }
    if (accepted !== true) {
      coinFailures.add(coin.uid);
      const latest = validCurrent();
      if (!latest) return null;
      if (!await warnAudit('coin_warn', '赠币使用被游戏拒绝；跳过该币，继续后续流程', { itemUid: coin.uid })) return null;
      return latest;
    }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess);
      return snap.ok && snap.identity === identity &&
        (!snap.itemByUid.has(coin.uid) || snap.funds !== ready.funds);
    });
    if (!running || mine !== generation) return null;
    if (!pushed) {
      coinFailures.add(coin.uid);
      const latest = validCurrent();
      if (!latest) return null;
      if (!await warnAudit('coin_warn', '赠币使用后库存未确认；不重复使用该币，继续后续流程', { itemUid: coin.uid })) return null;
      return latest;
    }
    const used = inspectMatch(pushed, chess);
    const checked = auditCoinUse(ready, used, target, coin);
    if (!checked.ok) {
      coinFailures.add(coin.uid);
      const latest = validCurrent();
      if (!latest) return null;
      if (!await warnAudit('coin_warn', `${checked.reason}；跳过该币，继续后续流程`, { itemUid: coin.uid })) return null;
      return latest;
    }
    try {
      await writeAudit('coin_ok', `盟约之币已核对 · UID ${coin.uid} · 资金 +${checked.gain}`,
        { itemUid: coin.uid, targetUid: target.uid, amount: checked.gain });
    } catch (error) { stop(`赠币使用后日志保存失败：${error?.message || '存储不可用'}；停止后续交易`); return null; }
    return running && mine === generation ? used : null;
  }

  // Uses every normal/golden 盟约之币 in hand or temp (user-confirmed scope: all sources
  // — Swire gifts, shop purchases, prep drops; a coin's only use is converting to funds).
  // Returns the latest snapshot, or null when the run stopped.
  async function drainCoins(current, mine) {
    let latest = current;
    for (let guard = 0; guard < 12; guard++) {
      const coins = usableCoins(latest).filter(coin => !coinFailures.has(coin.uid));
      if (!coins.length) return latest;
      const origin = coins[0].id === SWIRE_COIN_GOLDEN_ID ? '手中的合成金币' : '手中的盟约之币';
      const next = await useOneCoin(latest, coins[0], [], mine, origin);
      if (!next) return null;
      latest = next;
    }
    return latest;
  }

  // 自动使用 (per-item opt-in): consumables in hand/temp → most recent board operator, then hand
  // operator, with a free equipment slot. A full carrier is skipped, never replaced. A refusal
  // only moves on to the next operator; an ambiguous outcome is never re-sent.
  async function drainUses(current, mine) {
    let latest = current;
    for (let guard = 0; guard < 24; guard++) {
      const plan = getPlan();
      if (!Array.isArray(plan?.useItems) || !plan.useItems.length) return latest;
      const pick = pickItemUse(latest, plan, chess, typeof recency === 'function' ? recency : null,
        { tried: useTried, done: new Set([...useDone, ...coinFailures]), keep: new Set([...keepBases(plan,chess),...transactionKeeps]) });
      if (!pick) {
        const waiting = latest.items.filter(item => (item.area === 'hand' || item.area === 'temp') &&
          plan.useItems.some(rule => rule.id === item.id) && !useDone.has(item.uid) && !coinFailures.has(item.uid));
        const note = waiting.length ? `自动使用：${waiting.length} 件道具暂无装备位空闲的合适干员，留在手牌` : '';
        if (note && note !== useIdleNote && !await warnAudit('use_warn', note)) return null;
        useIdleNote = note;
        return latest;
      }
      const next = await useOneItem(latest, pick, mine);
      if (!next) return null;
      latest = next;
    }
    return latest;
  }

  async function useOneItem(current, pick, mine) {
    const { item, rule, target } = pick;
    const name = rule.name || item.id, targetName = chess[target.id]?.name || target.id;
    const pair = `${item.uid}:${target.uid}`;
    if (typeof useItem !== 'function') { stop('道具自动使用接口未就绪，已停止'); return null; }
    try {
      await writeAudit('use_request', `准备自动使用 ${name} · UID ${item.uid} → ${targetName} UID ${target.uid}`,
        { itemId: item.id, itemUid: item.uid, targetUid: target.uid });
    } catch (error) { stop(`自动使用前日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    const ready = validCurrent();
    if (!ready) return null;
    if (!sameUnits(current, ready) || !sameItems(current, ready) || ready.funds !== current.funds) return ready; // re-pick
    const livePick=pickItemUse(ready,getPlan(),chess,typeof recency==='function' ? recency : null,
      {tried:useTried,done:new Set([...useDone,...coinFailures]),keep:new Set([...keepBases(getPlan(),chess),...transactionKeeps])});
    if(!livePick || livePick.item.uid!==item.uid || livePick.target.uid!==target.uid || JSON.stringify(livePick.rule)!==JSON.stringify(rule))return ready;
    report('working', `正在自动使用 ${name} → ${targetName}${rule.destroysCarrier ? '（该道具会销毁目标干员）' : ''}`);
    usePending = true;
    let result;
    try { result = await useItem(item.uid, target.uid, item.id,{planStamp:JSON.stringify(getPlan())}); }
    catch (error) {
      usePending = false;
      const message = error?.message || '回执不可用';
      if (/可能已使用|回执未确认|不符合预期/.test(message)) {
        useDone.add(item.uid);
        stop(`自动使用 ${name} 结果不确定：${message}；不会重复使用，请人工核对`); return null;
      }
      useTried.add(pair);
      const latest = validCurrent();
      if (!latest) return null;
      if (!await warnAudit('use_warn', `${name} 无法用于 ${targetName}：${message}；改试下一名干员`,
        { itemId: item.id, itemUid: item.uid, targetUid: target.uid })) return null;
      return latest;
    }
    if (!running || mine !== generation) {
      usePending = false;
      report('paused', `已停止；${name} 的使用指令可能已发出，请核对道具与干员`); return null;
    }
    if(result===null){usePending=false;return unsentCurrent(ready);}
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess, { allowReward: true });
      const now = snap.ok && snap.itemByUid.get(item.uid);
      return snap.ok && snap.identity === identity && !(now && (now.area === 'hand' || now.area === 'temp'));
    });
    useDone.add(item.uid); // usePending stays set until the outcome (incl. a free-pick offer) is audited
    if (!running || mine !== generation) return null;
    if (!pushed) { stop(`${name} 使用后库存未确认，已停止；不会重复使用`); return null; }
    const after = inspectMatch(pushed, chess, { allowReward: true });
    const checked = auditItemUse(ready, after, pick);
    if (!checked.ok) { stop(`${name}：${checked.reason}；已停止，请人工核对`); return null; }
    const extra = [checked.gain > 0 ? `资金 +${checked.gain}` : '', checked.fresh.length ? `新获得 ${checked.fresh.length} 名干员` : '']
      .filter(Boolean).join(' · ');
    try {
      await writeAudit('use_ok', `已自动使用 ${name} → ${targetName}${extra ? ' · ' + extra : ''}`,
        { itemId: item.id, itemUid: item.uid, targetUid: target.uid, ...(checked.gain > 0 ? { amount: checked.gain } : {}) });
    } catch (error) { stop(`道具已使用但日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    usePending = false;
    if (checked.reward || result?.reward || read()?.match?.private?.shop?.rewardOffer?.slots?.length) {
      stop(`${name} 已使用并触发免费选卡；请手动选择后再重新启动`); return null;
    }
    return validCurrent();
  }

  async function takePineconeReward(before, mine) {
    if (!pineconePending || !isPineconeOffer(before.rewardOffer, chess)) {
      stop('松果出售后免费选卡的来源或内容不符合预期；请手动处理'); return null;
    }
    let chosen = pickPineconeReward(before, getPlan(), chess, garrisons);
    if (!chosen) {
      stop('松果免费选卡没有安全选项（可能合成旧干员、手牌已满或特质图鉴缺失）；请手动选择'); return null;
    }
    let name = chess[chosen.id]?.name || chosen.id;
    try { await writeAudit('reward_request', `准备选取松果免费干员 ${name} · ${chosen.reason}优先 · UID 待核对`,
      { operatorId: chosen.id, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`松果选卡前日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    const ready = validCurrent();
    if (!ready) return null;
    if (!sameOffer(before.rewardOffer, ready.rewardOffer) || !sameUnits(before, ready) ||
        !sameItems(before, ready) || ready.funds !== before.funds) {
      stop('松果奖励、库存或资金在选卡前变化；请手动处理'); return null;
    }
    chosen=pickPineconeReward(ready,getPlan(),chess,garrisons);
    if(!chosen){stop('当前奖励没有可核验的安全选项，请手动选择');return null;}
    name=chess[chosen.id]?.name || chosen.id;
    report('working', `正在领取松果免费干员 ${name}`);
    let accepted;
    const expected = { ...before.rewardOffer, id: chosen.id,
      slots: copySlots(before.rewardOffer.slots),planStamp:JSON.stringify(getPlan()) };
    try { accepted = await reward(chosen.slot, expected); }
    catch (error) { stop(`松果免费选卡失败：${error?.message || '回执不可用'}；不自动重试`); return null; }
    if (!running || mine !== generation) {
      report('paused', '已停止；松果选卡指令可能已发出，请核对库存'); return null;
    }
    if(accepted===null){const current=unsentCurrent(before);return current ? takePineconeReward(current,mine) : null;}
    if (accepted !== true) { stop('松果免费选卡被拒；不自动重试'); return null; }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess);
      return snap.ok && snap.identity === identity && !snap.rewardOffer &&
        snap.units.some(x => x.id === chosen.id && !before.unitByUid.has(x.uid));
    });
    if (!running || mine !== generation) return null;
    if (!pushed) { stop('松果选卡后 UID 未确认，已停止；不会重新领取或出售'); return null; }
    const after = inspectMatch(pushed, chess);
    const checked = auditReward(before, after, chosen);
    if (!checked.ok) { stop(checked.reason); return null; }
    pineconePending = false;
    const protectedBases = keepBases(getPlan(), chess);
    try { await writeAudit('reward_ok', `松果免费选卡已核对 · ${name} · UID ${checked.unit.uid}`,
      { operatorId: checked.unit.id, uid: checked.unit.uid, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`松果选卡已完成但日志保存失败：${error?.message || '存储不可用'}；不出售`); return null; }
    return running && mine === generation ? { after, unit: checked.unit, protectedBases } : null;
  }

  async function freeFlametailRewardSpace(before,audit,keep,mine) {
    let current=before;
    const soldEarly=new Set(), candidates=[...audit.gifts,audit.parent], gifts=new Set(audit.gifts.map(u=>u.uid));
    const expectedOffer=mergeOfferStamp(before.rewardOffer);
    function retain(snap,unit){
      const plan=getPlan(), protectedBases=new Set([...keep,...transactionKeeps,...keepBases(plan,chess)]);
      if(gifts.has(unit.uid) && protectedBases.has(unit.base))
        return !canSellSurplusGift(snap,unit.uid,{...plan,keep:[...protectedBases]},chess);
      return settingsProtected.has(unit.uid) || protectedBases.has(unit.base);
    }
    while(running && mine===generation){
      const latest=validCurrent();if(!latest)return null;
      const placement=auditOverflowPlacement(current,latest,chess);
      if(!placement.ok){stop(placement.reason);return null;}
      current=latest;
      if(current.hand.some(piece=>!piece) || current.hand.length<10)return {after:current,soldEarly};
      const unit=candidates.find(u=>{
        const now=current.unitByUid.get(u.uid);
        return !soldEarly.has(u.uid) && now && now.id===u.id && ['hand','temp'].includes(now.area) &&
          now.equipped===0 && !placementProtected.has(u.uid) && u.id!==PINECONE_ID && !retain(current,u);
      });
      if(!unit){
        report('waiting','爆仓中可卖的本次新增干员已处理，其余均受保留/部署保护；保留当前交易，腾位后继续领取奖励，不出售旧库存');
        const planStamp=JSON.stringify(getPlan());
        await waitFor(state=>{
          const next=inspectMatch(state,chess,{allowReward:true});
          return !next.ok || next.identity!==identity || JSON.stringify(getPlan())!==planStamp ||
            !sameUnits(current,next) || !sameItems(current,next) || current.funds!==next.funds ||
            mergeOfferStamp(next.rewardOffer)!==expectedOffer || !sameSlots(current.slots,next.slots);
        });
        continue; // A timeout is NOT an uncertain game command: none was sent while waiting.
      }
      try{await writeAudit('sell_request',`爆仓腾位：准备出售本次新增 ${chess[unit.id]?.name || unit.id} · UID ${unit.uid}`,
        {uid:unit.uid,operatorId:unit.id,pendingMerge:true});}
      catch(error){stop(`腾位出售日志保存失败：${error?.message || '存储不可用'}`);return null;}
      if(!running || mine!==generation)return null;
      const ready=validCurrent();if(!ready)return null;
      const checkedPlacement=auditOverflowPlacement(current,ready,chess);
      if(!checkedPlacement.ok){stop(checkedPlacement.reason);return null;}
      current=ready;
      if(retain(current,unit) || placementProtected.has(unit.uid) || current.unitByUid.get(unit.uid)?.area==='board')continue;
      const approved=makeSaleIntent(current,unit.uid);
      if(!approved){stop('腾位目标UID、装备或来源已变化；未出售');return null;}
      approved.pendingMergeStamp=expectedOffer;
      if(gifts.has(unit.uid))approved.surplusGift=true;
      report('working',`焰尾爆仓继续倒转：出售新增 ${chess[unit.id]?.name || unit.id}，暂保留原晋升奖励`);
      let accepted;
      try{accepted=await sell(unit.uid,approved);}
      catch(error){stop(`腾位出售失败：${error?.message || '回执不可用'}；不会重复出售`);return null;}
      if(!running || mine!==generation)return null;
      if(accepted===null || accepted?.cancelled==='settings'){
        if(accepted===null)placementProtected.add(unit.uid);
        else settingsProtected.add(unit.uid);
        continue; // Explicit NOT SENT; next iteration rechecks all inventory and settings.
      }
      if(accepted!==true){stop('腾位出售未获确认；不会重复出售');return null;}
      const pushed=await waitFor(state=>{
        const next=inspectMatch(state,chess,{allowReward:true});
        return next.ok && next.identity===identity && !next.unitByUid.has(unit.uid);
      });
      if(!running || mine!==generation)return null;
      if(!pushed){stop('腾位出售后UID未确认；不会重复出售');return null;}
      const after=inspectMatch(pushed,chess,{allowReward:true});
      const audited=auditPendingMergeSale(current,after,unit.uid,{chess,gameItems});
      if(!audited.ok){stop(audited.reason);return null;}
      soldEarly.add(unit.uid);totals.sold++;
      if(audited.packagingGifts?.length)totals.kept+=audited.packagingGifts.length;
      try{await writeAudit('sell_ok',`爆仓腾位已核对 · UID ${unit.uid}，原晋升奖励保持未领取`,
        {uid:unit.uid,operatorId:unit.id,refilledUids:audited.refilledUids,packagingGiftUids:audited.packagingGifts?.map(u=>u.uid)});}
      catch(error){stop(`腾位已完成但日志无法保存：${error?.message || '存储不可用'}`);return null;}
      current=after;
    }
    return null;
  }

  async function takeFlametailMergeReward(before, mine) {
    if (!flametailMergePending || !isFlametailMergeOffer(before.rewardOffer, chess,before.shopLevel)) {
      stop('焰尾赠员三合一后的晋升奖励来源不明；请手动处理'); return null;
    }
    let chosen = pickFlametailMergeReward(before, getPlan(), chess, garrisons);
    if (!chosen) {
      stop('焰尾晋升奖励没有可核验为安全的选项（可能赠棋/赠装备、合成旧卡或特质图鉴缺失）；请手动选择'); return null;
    }
    let name = chess[chosen.id]?.name || chosen.id;
    try { await writeAudit('reward_request', `准备选取焰尾赠品合成后的晋升奖励 ${name} · ${chosen.reason}优先 · UID 待核对`,
      { operatorId: chosen.id, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`焰尾晋升选卡前日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    const ready = validCurrent();
    if (!ready) return null;
    if (!sameOffer(before.rewardOffer, ready.rewardOffer) || !sameUnits(before, ready) ||
        !sameItems(before, ready) || ready.funds !== before.funds) {
      stop('焰尾晋升奖励、库存或资金在选卡前变化；请手动处理'); return null;
    }
    chosen=pickFlametailMergeReward(ready,getPlan(),chess,garrisons);
    if(!chosen){stop('当前奖励没有可核验的安全选项，请手动选择');return null;}
    name=chess[chosen.id]?.name || chosen.id;
    const expected = { ...before.rewardOffer, id: chosen.id,
      slots: copySlots(before.rewardOffer.slots),planStamp:JSON.stringify(getPlan()) };
    report('working', `正在领取焰尾赠员三合一奖励 ${name}`);
    let accepted;
    try { accepted = await mergeReward(chosen.slot, expected); }
    catch (error) { stop(`焰尾晋升选卡失败：${error?.message || '回执不可用'}；不自动重试`); return null; }
    if (!running || mine !== generation) {
      report('paused', '已停止；焰尾晋升选卡指令可能已发出，请核对库存'); return null;
    }
    if(accepted===null){const current=unsentCurrent(before);return current ? takeFlametailMergeReward(current,mine) : null;}
    if (accepted !== true) { stop('焰尾晋升选卡被拒；不自动重试'); return null; }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess);
      return snap.ok && snap.identity === identity && !snap.rewardOffer &&
        snap.units.some(x => x.id === chosen.id && !before.unitByUid.has(x.uid));
    });
    if (!running || mine !== generation) return null;
    if (!pushed) { stop('焰尾晋升选卡后 UID 未确认，已停止；不会重新领取或出售'); return null; }
    const after = inspectMatch(pushed, chess);
    const checked = auditFlametailMergeReward(before, after, chosen, chess);
    if (!checked.ok) { stop(checked.reason); return null; }
    flametailMergePending = false;
    const protectedBases = keepBases(getPlan(), chess);
    try { await writeAudit('reward_ok', `焰尾晋升奖励已核对 · ${name} · UID ${checked.unit.uid}`,
      { operatorId: checked.unit.id, uid: checked.unit.uid, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`焰尾晋升选卡已完成但日志保存失败：${error?.message || '存储不可用'}；不出售`); return null; }
    return running && mine === generation ? { after, unit: checked.unit, protectedBases } : null;
  }

  async function takeStrictMergeReward(before, mine, origin='packaging') {
    const isKeep=origin==='keep', label=isKeep ? '保留购买合成' : '包装赠员合成';
    if (!(isKeep ? keepMergePending : packagingPending) || !isPackagingMergeOffer(before.rewardOffer,chess,before.shopLevel)) {
      stop(`${label}后的晋升奖励来源不明；请手动处理`); return null;
    }
    let chosen = pickPackagingMergeReward(before, getPlan(), chess, garrisons);
    if (!chosen) {
      stop('合成晋升奖励没有可核验为安全的选项（可能赠棋/赠装备、合成旧卡或特质图鉴缺失）；请手动选择'); return null;
    }
    let name = chess[chosen.id]?.name || chosen.id;
    try { await writeAudit('reward_request', `准备选取${label}后的晋升奖励 ${name} · ${chosen.reason}优先 · UID 待核对`,
      { operatorId: chosen.id, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`合成晋升选卡前日志保存失败：${error?.message || '存储不可用'}`); return null; }
    if (!running || mine !== generation) return null;
    const ready = validCurrent();
    if (!ready) return null;
    if (!sameOffer(before.rewardOffer, ready.rewardOffer) || !sameUnits(before, ready) ||
        !sameItems(before, ready) || ready.funds !== before.funds) {
      stop('合成晋升奖励、库存或资金在选卡前变化；请手动处理'); return null;
    }
    chosen=pickPackagingMergeReward(ready,getPlan(),chess,garrisons);
    if(!chosen){stop('当前奖励没有可核验的安全选项，请手动选择');return null;}
    name=chess[chosen.id]?.name || chosen.id;
    const expected = { ...before.rewardOffer, id: chosen.id,
      slots: copySlots(before.rewardOffer.slots),planStamp:JSON.stringify(getPlan()) };
    report('working', `正在领取${label}奖励 ${name}`);
    let accepted;
    try { accepted = await mergeReward(chosen.slot, expected); }
    catch (error) { stop(`合成晋升选卡失败：${error?.message || '回执不可用'}；不自动重试`); return null; }
    if (!running || mine !== generation) {
      report('paused', '已停止；合成晋升选卡指令可能已发出，请核对库存'); return null;
    }
    if(accepted===null){const current=unsentCurrent(before);return current ? takeStrictMergeReward(current,mine,origin) : null;}
    if (accepted !== true) { stop('合成晋升选卡被拒；不自动重试'); return null; }
    const pushed = await waitFor(state => {
      const snap = inspectMatch(state, chess);
      return snap.ok && snap.identity === identity && !snap.rewardOffer &&
        snap.units.some(x => x.id === chosen.id && !before.unitByUid.has(x.uid));
    });
    if (!running || mine !== generation) return null;
    if (!pushed) { stop('合成晋升选卡后 UID 未确认，已停止；不会重新领取或出售'); return null; }
    const after = inspectMatch(pushed, chess);
    const checked = auditFlametailMergeReward(before, after, chosen, chess);
    if (!checked.ok) { stop(checked.reason); return null; }
    if(isKeep)keepMergePending=false;else packagingPending=false;
    const protectedBases = keepBases(getPlan(), chess);
    try { await writeAudit('reward_ok', `合成晋升奖励已核对 · ${name} · UID ${checked.unit.uid}`,
      { operatorId: checked.unit.id, uid: checked.unit.uid, slot: chosen.slot, price: 0 }); }
    catch (error) { stop(`合成晋升选卡已完成但日志保存失败：${error?.message || '存储不可用'}；不出售`); return null; }
    return running && mine === generation ? { after, unit: checked.unit, protectedBases } : null;
  }

  async function step() {
    if (!running || busy || manualContext || readyHold) return;
    busy = true;transactionKeeps.clear();
    for(const base of keepBases(getPlan(),chess))transactionKeeps.add(base);
    let again = false;
    const mine = generation;
    try {
      let before = validCurrent();
      if (!before) return;
      // Convert any pact coins already in hand first (frees bench slots before buying).
      before = await drainCoins(before, mine);
      if (!before) return;
      // 自动使用: equip opted-in consumables onto the most recent operator before buying.
      before = await drainUses(before, mine);
      if (!before) return;
      if (before.hand.length >= 10 && before.hand.every(Boolean)) {
        report('waiting','手牌区已满，等待腾位后继续；不会自动出售原有库存');
        return;
      }
      const planned = getPlan();
      const candidate = pickCandidate(before, planned, chess);
      const item = pickItemCandidate(before, planned);
      if (item && (!candidate || candidate.reason !== '保留')) {
        again = await purchaseItem(before, item, mine); return;
      }
      if (!candidate) { again = await refreshEmptyShop(before, mine); return; }
      const initialKeep = keepBases(planned, chess); // 保留保护与“是否还需购买”分开。
      const name = chess[candidate.id]?.name || candidate.id;
      try {
        await writeAudit('buy_request', `准备买入 ${name} · ${candidate.reason} · 实价 ${candidate.price}`,
          { operatorId: candidate.id, slot: candidate.slot, price: candidate.price });
      } catch (error) { stop(`买入前无法写入日志：${error?.message || '本地存储不可用'}`); return; }
      if (!running || mine !== generation) return;
      // Logging is asynchronous: NEVER use a newer shop card in a stale slot after the write.
      const rechecked = validCurrent();
      if (!rechecked) return;
      const offer = rechecked.slots[candidate.slot];
      if (!sameUnits(before, rechecked) || !sameItems(before, rechecked) || !offer || offer.sold ||
          offer.id !== candidate.id || offer.price !== candidate.price || rechecked.funds < candidate.price) {
        stop('写入日志期间商店或库存已变化，本次买入已取消'); return;
      }
      if(JSON.stringify(pickCandidate(rechecked,getPlan(),chess))!==JSON.stringify(candidate)){again=!!unsentCurrent(before);return;}
      report('working', `正在买入 ${name} · ${candidate.reason} · 价格 ${candidate.price}`);
      flametailPurchasePending = candidate.id === FLAMETAIL_ID;
      keepPurchasePending=!!candidate.keepMerge;
      let accepted;
      try { accepted = await buy(candidate.slot, { id: candidate.id, price: candidate.price,planStamp:JSON.stringify(getPlan()) }); }
      catch (error) {
        stop(candidate.id === FLAMETAIL_ID ?
          `${name} 买入或 UID 核验未完成（买入可能已生效）：${error?.message || '未知原因'}；不重试、不自动出售` :
          `${name} 买入失败：${error?.message || '未知原因'}`);
        return;
      }
      if (!running || mine !== generation) {
        report('paused', `已停止；${name} 的买入请求可能已发出，请检查游戏库存`);
        return;
      }
      if(accepted===null){flametailPurchasePending=false;keepPurchasePending=false;again=!!unsentCurrent(before);return;}
      if (accepted !== true) { stop(`${name} 买入被游戏拒绝，未进行出售`); return; }
      const pushed = await waitFor(state => {
        const snap = inspectMatch(state, chess, { allowReward: flametailPurchasePending || keepPurchasePending });
        return snap.ok && snap.identity === identity &&
          snap.slots[candidate.slot]?.id === candidate.id && snap.slots[candidate.slot]?.sold === true;
      });
      if (!running || mine !== generation) return;
      if (!pushed) { stop(`${name} 买入后的库存推送未确认，已停止；请人工核对`); return; }
      const after = inspectMatch(pushed, chess, { allowReward: flametailPurchasePending || keepPurchasePending });
      const keep = new Set([...initialKeep,...transactionKeeps, ...keepBases(getPlan(), chess)]);
      const audit = auditPurchase(before, after, candidate, { keep: [...keep] }, chess);
      if (!audit.ok) { stop(`${name}：${audit.reason}`); return; }
      for(const uid of audit.consumedUids || [])placementProtected.delete(uid);
      keepMergePending=audit.mergedKeepReward===true;
      keepPurchasePending=false;
      flametailMergePending = audit.mergedGift === true;
      flametailPurchasePending = false;
      totals.bought++;
      try {
        await writeAudit('buy_ok', `${name} 买入已核对 · UID ${audit.parent.uid}`,
          { operatorId: audit.parent.id, uid: audit.parent.uid, slot: candidate.slot, price: candidate.price });
        for (const gift of audit.gifts) {
          const merged=audit.giftMerges?.find(entry=>entry.uid===gift.uid);
          const label=merged ? '焰尾赠员合成精锐已核对，可倒卖（保留规则优先）' : '赠品已核对';
          await writeAudit('gift', `${label} · ${chess[gift.id]?.name || gift.id} · UID ${gift.uid}`,
            {operatorId:gift.id,uid:gift.uid,...(merged ? {consumedUids:merged.consumedUids,newCopies:merged.newCopies} : {})});
        }
      } catch (error) { stop(`买入已完成但核对日志未保存：${error?.message || '存储不可用'}；不会自动出售`); return; }
      if (!running || mine !== generation) return;
      let current=after, promotion=null;
      let soldEarly=new Set();
      if(audit.mergedGift && current.hand.length>=10 && current.hand.every(Boolean)){
        const drained=await freeFlametailRewardSpace(current,audit,keep,mine);
        if(!drained)return;
        current=drained.after;soldEarly=drained.soldEarly;
      }
      if(audit.mergedGift || audit.mergedKeepReward){
        promotion=audit.mergedKeepReward ? await takeStrictMergeReward(current,mine,'keep') :
          await takeFlametailMergeReward(current,mine);
        if(!promotion)return;
        for(const base of promotion.protectedBases)keep.add(base);
        current=promotion.after;
      }
      // Keep the merged parent protected even if its rule is changed during the reward ACK.
      if(audit.mergedKeepReward)keep.add(audit.parent.base);
      if(audit.coin){
        current=await useOneCoin(current,audit.coin,[audit.parent.uid],mine,
          audit.coin.merged ? '诗怀雅赠币与旧币合成出的金币' : '本次诗怀雅赠送的盟约之币');
        if(!current)return;
      }
      current=await drainCoins(current,mine);
      if(!current)return;
      // Gift first, then the verified promotion card, then the source Flametail;
      // a later Pinecone reward can be spliced into this same protected queue.
      const saleQueue = [...audit.gifts, ...(promotion ? [promotion.unit] : []), audit.parent]
        .filter(unit=>!soldEarly.has(unit.uid) && current.unitByUid.has(unit.uid));
      const quotaGifts=new Set(candidate.id===FLAMETAIL_ID ?
        [...audit.gifts.map(gift=>gift.uid),...(promotion ? [promotion.unit.uid] : [])] : []);
      if(candidate.surplusKeep===true)quotaGifts.add(audit.parent.uid);
      function retainQueued(snap,unit){
        const plan=getPlan(), protectedBases=new Set([...keep,...transactionKeeps,...keepBases(plan,chess)]);
        if(quotaGifts.has(unit.uid) && protectedBases.has(unit.base))
          return !canSellSurplusGift(snap,unit.uid,{...plan,keep:[...protectedBases]},chess);
        return settingsProtected.has(unit.uid) || protectedBases.has(unit.base);
      }
      for (let i = 0; i < saleQueue.length; i++) {
        const unit = saleQueue[i];
        if (!running || mine !== generation) return;
        const latest = validCurrent();
        if (!latest) return;
        if (!sameUnits(current, latest) || !sameItems(current, latest) || latest.unitByUid.get(unit.uid)?.id !== unit.id) {
          stop(`UID ${unit.uid} 的来源或库存发生变化，已停止出售`);
          return;
        }
        if(placementProtected.has(unit.uid) || latest.unitByUid.get(unit.uid)?.area==='board'){
          placementProtected.add(unit.uid);
          try{await writeAudit('keep',`保留手动上下场干员 ${chess[unit.id]?.name || unit.id} · UID ${unit.uid}，继续其他倒转`,{uid:unit.uid,operatorId:unit.id});}
          catch(error){stop(`手动部署保护日志保存失败：${error?.message || '存储不可用'}`);return;}
          if(!running || mine!==generation)return;
          totals.kept++;current=latest;continue;
        }
        if (retainQueued(latest,unit)) {
          const rule=getPlan()?.keepRules?.[unit.base], held=latest.ownedCopies?.[unit.base];
          const quotaNote=quotaGifts.has(unit.uid) && Number.isInteger(rule?.limit) && Number.isInteger(held) ?
            `（当前${held}份，目标${rule.limit}；卖本张将剩${held-(unit.golden ? 3 : 1)}份）` : '';
          try { await writeAudit('keep', `保留 ${chess[unit.id]?.name || unit.id}${quotaNote} · UID ${unit.uid}`,
            { operatorId: unit.id, uid: unit.uid }); }
          catch (error) { stop(`保留记录无法保存：${error?.message || '存储不可用'}`); return; }
          if (!running || mine !== generation) return;
          totals.kept++;
          report('working', `保留 ${chess[unit.id]?.name || unit.id} · UID ${unit.uid}`);
          current = latest;
          continue;
        }
        // Last-second guard: only a fresh UID approved by a purchase/reward audit may reach sell().
        const unitName = chess[unit.id]?.name || unit.id;
        try { await writeAudit('sell_request', `准备出售本轮授权 ${unitName} · UID ${unit.uid}`,
          { operatorId: unit.id, uid: unit.uid }); }
        catch (error) { stop(`出售前无法写入日志：${error?.message || '存储不可用'}；本次不出售`); return; }
        if (!running || mine !== generation) return;
        const saleReady = validCurrent();
        if (!saleReady) return;
        if (!sameUnits(latest, saleReady) || !sameItems(latest, saleReady) || saleReady.unitByUid.get(unit.uid)?.id !== unit.id) {
          stop(`UID ${unit.uid} 的库存或来源在出售前变化，已取消出售`); return;
        }
        if(retainQueued(saleReady,unit)){settingsProtected.add(unit.uid);totals.kept++;current=saleReady;continue;}
        if(placementProtected.has(unit.uid) || saleReady.unitByUid.get(unit.uid)?.area==='board'){
          placementProtected.add(unit.uid);totals.kept++;current=saleReady;continue;
        }
        const approvedSale=makeSaleIntent(saleReady,unit.uid);
        if(!approvedSale){stop(`UID ${unit.uid} 不在可售手牌/临时区，或已配装；取消出售`);return;}
        if(quotaGifts.has(unit.uid))approvedSale.surplusGift=true;
        if (unit.id === PINECONE_ID) pineconePending = true;
        const itemBody=gameItems?.items || gameItems;
        packagingSalePending=(latest.items || []).some(item=>item.area==='equipped' && item.carrierUid!==unit.uid &&
          (item.id==='chess_item_5_07_e_a' || item.id==='chess_item_5_07_e_b' ||
            (Array.isArray(itemBody) ? itemBody.find(rec=>rec.id===item.id) : itemBody?.[item.id])?.name==='商业包装方案'));
        report('working', `正在出售本轮授权 ${unitName} · UID ${unit.uid}`);
        let sold;
        try { sold = await sell(unit.uid,approvedSale); }
        catch (error) { stop(`UID ${unit.uid} 出售失败：${error?.message || '未知原因'}`); return; }
        if (!running || mine !== generation) {
          report('paused', `已停止；UID ${unit.uid} 的出售请求可能已发出，请检查游戏库存`);
          return;
        }
        if(sold===null || sold?.cancelled==='settings'){ // Explicitly NOT sent: MAIN/transport protected a manually deployed target.
          pineconePending=false;packagingSalePending=false;
          const cancelled=validCurrent();
          if(!cancelled)return;
          if(!sameUnits(saleReady,cancelled) || !sameItems(saleReady,cancelled) ||
            cancelled.funds!==saleReady.funds || cancelled.rewardOffer){stop('取消出售后出现非站位库存变化，已停止');return;}
          if(sold?.cancelled==='settings')settingsProtected.add(unit.uid);else placementProtected.add(unit.uid);
          totals.kept++;current=cancelled;
          try{await writeAudit('keep',`UID ${unit.uid} 因${sold?.cancelled==='settings' ? '最新保留设置' : '手动上下场'}保护，出售未发送；继续其他倒转`,{uid:unit.uid,operatorId:unit.id});}
          catch(error){stop(`取消出售日志保存失败：${error?.message || '存储不可用'}`);return;}
          continue;
        }
        if (sold !== true) { stop(`UID ${unit.uid} 的出售被拒，未继续交易`); return; }
        const removed = await waitFor(state => {
          const snap = inspectMatch(state, chess, { allowReward: pineconePending || packagingSalePending });
          return snap.ok && snap.identity === identity && !snap.unitByUid.has(unit.uid) &&
            (unit.id !== PINECONE_ID || isPineconeOffer(snap.rewardOffer, chess));
        });
        if (!running || mine !== generation) return;
        if (!removed) { stop(`UID ${unit.uid} 出售后状态未确认，已停止；不重复出售`); return; }
        const next = inspectMatch(removed, chess, { allowReward: pineconePending || packagingSalePending });
        const saleAudit = auditSale(latest, next, unit.uid, {chess,gameItems});
        if (!saleAudit.ok) { stop(saleAudit.reason); return; }
        packagingPending=saleAudit.packagingReward===true;packagingSalePending=false;
        if(next.rewardOffer && !packagingPending && !pineconePending){stop('出售后奖励来源未核验');return;}
        if(saleAudit.packagingGifts?.length){
          // A server-created gift/merge is not one of our purchased UIDs: never put it in saleQueue.
          totals.kept+=saleAudit.packagingGifts.length;
          try { await writeAudit('keep','商业包装方案赠员已核对并保留，不自动出售',
            {giftUids:saleAudit.packagingGifts.map(gift=>gift.uid),merged:saleAudit.packagingMerged}); }
          catch(error){stop(`包装赠员日志保存失败：${error.message}`);return;}
          // A proven packaging merge can consume a future queue member. Its old UID must not be sold.
          for(let j=saleQueue.length-1;j>i;j--)if(!next.unitByUid.has(saleQueue[j].uid))saleQueue.splice(j,1);
        }
        totals.sold++;
        try { await writeAudit('sell_ok', `出售已核对 ${unitName} · UID ${unit.uid}`,
          { operatorId: unit.id, uid: unit.uid }); }
        catch (error) { stop(`已出售，但出售日志无法保存：${error?.message || '存储不可用'}；停止后续交易`); return; }
        if (!running || mine !== generation) return;
        current = next;
        if(packagingPending){
          const selected=await takeStrictMergeReward(next,mine,'packaging');
          if(!selected)return;
          for(const base of selected.protectedBases)keep.add(base);
          current=selected.after;
          saleQueue.splice(i+1,0,selected.unit);
        }
        if (unit.id === PINECONE_ID) {
          const selected = await takePineconeReward(next, mine);
          if (!selected) return;
          for (const base of selected.protectedBases) keep.add(base);
          saleQueue.splice(i + 1, 0, selected.unit);
          current = selected.after;
        }
      }
      report('running', `已完成 ${name}：买入 ${totals.bought} / 售出 ${totals.sold} / 保留 ${totals.kept}`);
      again = true;
    } catch (error) {
      stop(`自动倒转发生异常：${error?.message || String(error)}`);
    } finally {
      busy = false;
      if(manualContext?.drain){const drain=manualContext.drain;manualContext.drain=null;drain();}
      releaseIfIdle();
      if (running && (again || planQueued)) { planQueued=false; schedule(); }
    }
  }

  async function start() {
    if(readyHold){report('blocked','自动准备条件已满足，正在等待交接');return false;}
    if (manualContext) { report('blocked','手动操作尚未核对完成，请稍后再开启倒转'); return false; }
    if (running || starting || busy) { report('blocked', '上一笔尚未结束，请稍后再启动'); return false; }
    settingsProtected.clear();transactionKeeps.clear();
    const first = inspectMatch(read(), chess);
    if (!first.ok) { report('blocked', first.reason); return false; }
    const startGeneration = generation;
    starting = true;
    if (onAudit) {
      try { await writeAudit('start', '用户手动请求启动本回合自动倒转'); }
      catch (error) {
        starting = false;
        report('blocked', `日志保存失败，未启动：${error?.message || '本地存储不可用'}`);
        return false;
      }
      if (startGeneration !== generation) return false;
    }
    report('working', '正在取得此浏览器的独占运行锁…');
    let unlock;
    let lockError = '';
    try { unlock = await acquireLock(); }
    catch (error) { unlock = null; lockError = String(error?.message || '独占运行锁不可用').slice(0, 170); }
    if (startGeneration !== generation) {
      if (typeof unlock === 'function') unlock();
      return false; // stopped while lock acquisition was pending
    }
    starting = false;
    if (typeof unlock !== 'function') { report('blocked', lockError ? `无法启动：${lockError}` : '无法取得独占运行锁；可能已有另一个页面在运行'); return false; }
    releaseLock = unlock;
    const current = inspectMatch(read(), chess);
    if (!current.ok || current.identity !== first.identity) {
      report('blocked', current.ok ? '取得锁期间对局已变化' : current.reason);
      releaseIfIdle();
      return false;
    }
    totals.bought = 0; totals.sold = 0; totals.kept = 0; totals.refreshed = 0;
    lastRefreshAt = 0; pineconePending = false;packagingSalePending=false;packagingPending=false;
    keepPurchasePending=false;keepMergePending=false;
    coinFailures.clear();
    usePending = false; useTried.clear(); useDone.clear(); useIdleNote = '';
    flametailPurchasePending = false; flametailMergePending = false;
    identity = current.identity;
    placementProtected.clear();placementPrevious=current;
    running = true;
    generation++;
    unsubscribe = subscribe((state, prev) => {
      if (!running) return;
      if(manualContext?.granted){
        const snap=inspectMatch(state,chess,{allowReward:true});
        observePlacement(snap);
        if(!snap.ok || snap.identity!==identity)stop(snap.reason || '手动操作期间对局变化');
        return;
      }
      const snap = inspectMatch(state, chess, { allowReward: allowReward() });
      observePlacement(snap);
      if (!snap.ok || snap.identity !== identity || !rewardAllowed(snap.rewardOffer)) {
        stop(!snap.ok ? snap.reason : snap.identity !== identity ? '对局或回合已改变，已停止' :
          '出现来源不明的特殊招募奖励，已停止；请手动处理');
      } else if (state.match?.private !== prev?.match?.private) {
        // While no automatic transaction is in flight, only pure placement may coexist.
        const previous=inspectMatch(prev,chess,{allowReward:allowReward()});
        if(!busy && previous.ok && previous.identity===snap.identity &&
          (!sameUnits(previous,snap) || !sameItems(previous,snap) || previous.funds!==snap.funds ||
            previous.shopLevel!==snap.shopLevel || previous.refreshPrice!==snap.refreshPrice || !sameSlots(previous.slots,snap.slots))){
          stop('检测到站位之外的手动或未知交易变化，已暂停以核对库存');return;
        }
        schedule();
      }
    });
    report('running', '已手动启动；买入无数量上限，无合格候选时按实价刷新（次数与总费用不限，最小间隔约0.3秒）');
    schedule();
    return true;
  }
  async function beginManual(intent){
    if(!running)return {watch:false};
    if(manualContext)throw new Error('上一项手动操作尚未核对');
    if(!['g.sell','g.equip'].includes(intent?.type) || typeof intent.rid!=='string')throw new Error('手动操作类型无效');
    const ticket=manualContext={rid:intent.rid,type:intent.type,fields:intent.fields,generation,granted:false,drain:null};
    try{
      if(busy)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{ticket.drain=null;reject(new Error('等待在途交易结束超时，手动请求未发送'));},20000);ticket.drain=()=>{clearTimeout(timer);resolve();};});
      if(!running || ticket.generation!==generation)throw new Error('倒转已停止，手动请求未发送，请重试');
      const before=inspectMatch(read(),chess);if(!before.ok || before.identity!==identity)throw new Error(before.reason || '手动操作前对局已变化');
      const stamp=JSON.stringify(read().match.private);
      await writeAudit('info',intent.type==='g.sell'?'手动出售：等待服务器回执，倒转保持开启':'手动装备：等待服务器回执，倒转保持开启');
      if(!running || ticket.generation!==generation || JSON.stringify(read()?.match?.private)!==stamp)throw new Error('手动操作前状态变化，请核对后重试');
      ticket.before=before;ticket.beforeStamp=stamp;ticket.granted=true;
      ticket.expiry=setTimeout(()=>{if(manualContext===ticket)stop('手动操作回执超时，已停止；请核对游戏，不自动重试');},90000);
      report('waiting','手动操作核对中，倒转保持开启');return {watch:true,beforeStamp:stamp};
    }catch(error){if(manualContext===ticket)manualContext=null;stop(error.message);throw error;}
  }
  async function completeManual(result){
    const ticket=manualContext;
    if(!ticket || ticket.rid!==result.rid)throw new Error('手动操作回执不匹配');
    if(ticket.completing)throw new Error('手动操作回执已在核对中');
    ticket.completing=true;
    try{
      if(result.ok!==true || ticket.type!==result.type || JSON.stringify(ticket.fields)!==JSON.stringify(result.fields) || ticket.beforeStamp!==result.beforeStamp)throw new Error(result.reason || '手动操作结果不确定');
      if(ticket.generation!==generation || !running)return {continued:false};
      const after=inspectMatch(read(),chess,{allowReward:true});
      if(JSON.stringify(read()?.match?.private)!==result.afterStamp)throw new Error('手动操作之后还有未核对变化');
      const checked=result.cancelled===true ? {ok:after.ok && ticket.beforeStamp===result.afterStamp,reason:'取消的手动请求之外出现状态变化'} : auditManualTransaction(ticket.before,after,ticket,{chess,gameItems});
      if(!checked.ok)throw new Error(checked.reason);
      if(after.rewardOffer){
        if(checked.soldId===PINECONE_ID && isPineconeOffer(after.rewardOffer,chess))pineconePending=true;
        else if(checked.packagingReward && isPackagingMergeOffer(after.rewardOffer,chess,after.shopLevel))packagingPending=true;
        else throw new Error('手动操作产生的奖励来源不能核验，请先人工处理');
      }
      let finalStamp=result.afterStamp;
      if(after.rewardOffer){
        const taken=pineconePending?await takePineconeReward(after,generation):await takeStrictMergeReward(after,generation,'packaging');
        if(!taken)throw new Error('手动出售后的免费选卡未能核对');
        placementProtected.add(taken.unit.uid);
        finalStamp=JSON.stringify(read()?.match?.private);
      }
      if(checked.targetUid!=null)placementProtected.add(checked.targetUid);
      placementPrevious=inspectMatch(read(),chess);
      await writeAudit('info',result.cancelled===true?'手动目标已被在途交易处理，未重复发送；继续倒转':ticket.type==='g.sell'?'手动出售已核对，继续倒转':'手动装备已核对，继续倒转');
      if(ticket.generation===generation && running && JSON.stringify(read()?.match?.private)!==finalStamp)throw new Error('写入手动操作记录期间出现其他变化');
      return {continued:ticket.generation===generation && running};
    }catch(error){stop(`手动操作未能安全核对：${error.message}；不重试该操作`);throw error;}
    finally{clearTimeout(ticket.expiry);if(manualContext===ticket)manualContext=null;releaseIfIdle();if(running)schedule();}
  }

  return { start, stop, beginManual, completeManual, holdForReady(){readyHold=true;}, releaseReadyHold(){readyHold=false;schedule();}, get manualPending(){return !!manualContext;}, updatePlan() {
    if(!running)return;
    const keep=keepBases(getPlan(),chess), snap=inspectMatch(read(),chess,{allowReward:allowReward()});
    if(snap.ok)for(const unit of snap.units)if(keep.has(unit.base))settingsProtected.add(unit.uid);
    if(busy){for(const base of keep)transactionKeeps.add(base);planQueued=true;}else schedule();
  }, get running() { return running; }, get starting() { return starting; }, get busy() { return busy; } };
}
