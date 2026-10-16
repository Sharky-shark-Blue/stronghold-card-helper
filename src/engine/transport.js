import { mergeOfferStamp } from './packaging.js';
// Isolated-world transport. All game state/actions live behind main-bridge.js on the clicked tab.
// chrome.runtime is used only for the extension's single-runner lease; no fixed server host is requested.
import { itemHoldingAllows } from './item-policy.js';
import { operatorBaseId, inspectInventory } from './inventory.js';
import { canSellSurplusGift } from './flametail-flow.js';
const EXT_CHANNEL = 'wei.runtime.v1';
// randomUUID() is restricted to secure contexts. This content world also runs on plain HTTP game servers.
// getRandomValues() is available in insecure contexts and still supplies cryptographic randomness.
function makeRequestId() {
  const provider = globalThis.crypto;
  if (typeof provider?.getRandomValues !== 'function') {
    throw new Error('浏览器不支持安全随机数，已拒绝发送交易请求');
  }
  const bytes = new Uint8Array(16);
  provider.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
export function createSpuiTransport(config, getPlan, chess={}) {
  const nonce = config?.nonce;
  if (typeof nonce !== 'string' || nonce.length < 16 || typeof getPlan !== 'function' ||
      typeof config?.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(config.version)) {
    throw new Error('插件注入参数不完整');
  }
  let state = null;
  let bridgeError = '';
  let activeToken = null;
  let disposed = false, releaseOwnedLock = null;
  let lockLost = () => {};
  const subscribers = new Set();
  const failures = new Set();
  const pending = new Map();
  const clientVersion = config.version;
  function assertRuntimeVersion() {
    if (disposed) throw new Error('工作台已关闭');
    let loadedVersion;
    try { loadedVersion = chrome.runtime.getManifest().version; } catch { /* invalidated extension world */ }
    if (loadedVersion !== clientVersion) {
      throw new Error('工作台脚本与已加载扩展的版本不匹配；请重新加载扩展，并在安全时自行刷新游戏页');
    }
  }
  async function workerRequest(type, fields = {}) {
    assertRuntimeVersion();
    try { return await chrome.runtime.sendMessage({ type, clientVersion, ...fields }); }
    catch { throw new Error('扩展后台连接已失效；请重新加载扩展，并在安全时自行刷新游戏页'); }
  }
  const post = (type, fields = {}) => window.postMessage({ channel: EXT_CHANNEL, side: 'ui', nonce, version: clientVersion, type, ...fields }, location.origin);
  const receive = event => {
    const message = event.data;
    if (event.source !== window || event.origin !== location.origin ||
        message?.channel !== EXT_CHANNEL || message.side !== 'game' || message.nonce !== nonce ||
        message.version !== clientVersion) return;
    if (message.type === 'snapshot' && message.state && typeof message.state === 'object') {
      const previous = state;
      state = message.state;
      for (const fn of [...subscribers]) { try { fn(state, previous); } catch (e) { console.error('[spui] 订阅失败', e); } }
    } else if (message.type === 'response' && typeof message.rid === 'string') {
      pending.get(message.rid)?.(message);
    } else if (message.type === 'bridge-error') {
      bridgeError = String(message.reason || '游戏桥接初始化失败');
      for (const fn of [...failures]) fn(bridgeError);
    }
  };
  window.addEventListener('message', receive);
  function ask(type, fields = {}, timeout = 10000) {
    const rid = makeRequestId();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(rid);
        reject(new Error(`${type} 等待响应超时`));
      }, timeout);
      pending.set(rid, message => { clearTimeout(timer); pending.delete(rid);
        if (message.ok === true) resolve(message);
        else reject(new Error(String(message.reason || `${type} 被拒绝`).slice(0, 200))); });
      post(type, { rid, ...fields });
    });
  }
  async function ready(timeout = 10000) {
    assertRuntimeVersion();
    if (state) return true;
    if (bridgeError) throw new Error(bridgeError);
    const result = new Promise((resolve, reject) => {
      const end = (reason = '') => {
        clearTimeout(timer); unsubscribe(); failures.delete(failed);
        if (reason) reject(new Error(reason)); else resolve(true);
      };
      const failed = reason => end(reason);
      const unsubscribe = subscribe(() => end());
      const timer = setTimeout(() => end('未收到游戏状态；该服务器可能与插件不兼容'), timeout);
      failures.add(failed);
    });
    post('snapshot-request');
    return result;
  }
  const subscribe = fn => { subscribers.add(fn); return () => subscribers.delete(fn); };
  async function acquireLock() {
    const answer = await workerRequest('lock.acquire');
    if (answer?.ok !== true || typeof answer.token !== 'string') {
      throw new Error(answer?.reason || '独占运行锁不可用，请确认没有其他标签页正在运行');
    }
    const token = answer.token;
    activeToken = token;
    let released = false;
    let renewing = false;
    const heartbeat = setInterval(async () => {
      if (released || renewing) return;
      renewing = true;
      try {
        const response = await workerRequest('lock.renew', { token });
        if (response?.ok !== true) throw new Error(response?.reason || '互斥锁已丢失');
      } catch (error) {
        if (!released) { released = true; activeToken = null; clearInterval(heartbeat);
          lockLost(error?.message || '互斥锁已丢失'); }
      } finally { renewing = false; }
    }, 4500);
    releaseOwnedLock = () => {
      if (released) return;
      released = true;
      if (activeToken === token) activeToken = null;
      clearInterval(heartbeat);
      workerRequest('lock.release', { token }).catch(() => {});
    };
    return releaseOwnedLock;
  }
  async function ensureLock() {
    if (!activeToken) throw new Error('未持有服务器独占运行锁');
    const answer = await workerRequest('lock.renew', { token: activeToken });
    if (answer?.ok !== true) {
      activeToken = null;
      lockLost(answer?.reason || '服务器独占运行锁失效');
      throw new Error(answer?.reason || '服务器独占运行锁失效');
    }
  }
  function sameSlots(actual, expected) {
    return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length &&
      actual.every((item, index) => {
        const prior = expected[index];
        if (!item || !prior) return !item && !prior;
        return item.id === prior.id && item.kind === prior.kind &&
          item.price === prior.price && item.sold === prior.sold;
      });
  }
  const settingsChanged=expected=>typeof expected?.planStamp==='string' && expected.planStamp!==JSON.stringify(getPlan());
  return {
    read: () => state,
    subscribe,
    ready,
    setLockLost: fn => { lockLost = typeof fn === 'function' ? fn : () => {}; },
    buy: async (slot, expected) => {
      if (!expected || typeof expected.id !== 'string' || !Number.isInteger(expected.price)) {
        throw new Error('缺少购买时锁定的干员 ID 和实际价格');
      }
      await ensureLock();
      if(settingsChanged(expected))return null;
      const offer = state?.match?.private?.shop?.slots?.[slot];
      if (!offer || offer.kind !== 'chess' || offer.sold || offer.id !== expected.id || offer.price !== expected.price) {
        throw new Error('购买前槽位的干员或实际价格已变化');
      }
      const p = getPlan();
      await ask('buy', { slot, expectedId: expected.id, expectedPrice: expected.price,
        buy: Array.isArray(p.buy) ? p.buy : [], keep: Array.isArray(p.keep) ? p.keep : [],
        keepRules: p.keepRules || {}, excludedBuy: p.excludedBuy || [] });
      return true;
    },
    buyItem: async (slot, expected) => {
      if (!Number.isInteger(slot) || slot < 0 || typeof expected?.id !== 'string' ||
          !Number.isSafeInteger(expected.price) || expected.price < 0) throw new Error('道具 ID、价格或槽位无效');
      await ensureLock();
      if(settingsChanged(expected))return null;
      const priv = state?.match?.private, offer = priv?.shop?.slots?.[slot];
      const sentPlan=getPlan(), rule=sentPlan.items?.find(item=>item.id===expected.id);
      if(!rule)return null; // Switched off before send; no command was issued.
      if (!offer || offer.kind !== 'item' || offer.sold || offer.id !== expected.id ||
          offer.price !== expected.price || !Number.isSafeInteger(priv?.funds) ||
          priv.funds < offer.price || !rule || rule.used >= (rule.limit ?? 9999) ||
          rule.minFunds !== null && priv.funds <= rule.minFunds ||
          priv.hand?.length >= 10 && priv.hand.every(Boolean)) {
        throw new Error('道具槽位、次数、资金门槛或手牌区在买入前已变化');
      }
      // Every identical copy counts toward a merge, including equipment issued to an operator.
      const bench = [...(priv.hand || []), ...(priv.temp || [])].filter(item => item?.kind === 'item' && item.id === offer.id);
      const issued = (priv.board || []).concat(priv.hand || [], priv.temp || [])
        .flatMap(piece => piece?.kind === 'chess' && Array.isArray(piece.items) ? piece.items : [])
        .filter(item => item?.id === offer.id);
      const holdings = [...(priv.hand || []), ...(priv.temp || []), ...(priv.board || [])].filter(piece => piece?.kind === 'item')
        .concat((priv.board || []).concat(priv.hand || [], priv.temp || []).flatMap(piece =>
          piece?.kind === 'chess' && Array.isArray(piece.items) ? piece.items.map(item => ({ ...item, area: 'equipped' })) : []));
      if (!itemHoldingAllows(holdings,rule)) throw new Error('道具实时持有目标已达到或库存无法核对');
      const merge = expected.merge || null;
      if (merge) {
        const consumed = Array.isArray(merge.consumed) ? merge.consumed : [];
        if (typeof merge.goldenId !== 'string' || !Number.isInteger(merge.need) || consumed.length !== merge.need - 1 ||
            issued.length || bench.length !== consumed.length ||
            consumed.some(uid => !bench.some(item => item.uid === uid))) {
          throw new Error('道具合成所需的同名旧件已变化，或会消耗已配发装备；不会自动买入');
        }
      } else if (bench.length + issued.length > 0 && rule.merge?.mergeable !== false &&
                 !(rule.merge?.mergeable === true && bench.length + issued.length + 1 < rule.merge.need)) {
        throw new Error('已持有同名道具且合成结果无法确认；不会自动买入');
      }
      const response = await ask('buy-item', {slot,expectedId:expected.id,expectedPrice:expected.price,
        itemRule:{id:rule.id,enabled:true,limit:rule.limit,used:rule.used,minFunds:rule.minFunds,ownedTarget:rule.ownedTarget},
        expectMerge: merge ? {goldenId:merge.goldenId,consumed:[...merge.consumed]} : null});
      if (!Number.isInteger(response.result?.itemUid) || response.result.itemUid < 0) {
        throw new Error('道具买入已发送但未收到可信 UID；不会自动重试');
      }
      return {uid:response.result.itemUid,sourceId:rule.sourceId,epoch:sentPlan.epoch};
    },
    refresh: async expected => {
      if (!Number.isSafeInteger(expected?.price) || expected.price < 0 ||
          !Array.isArray(expected.slots) || expected.slots.length > 20) {
        throw new Error('缺少可核对的商店刷新价或槽位');
      }
      await ensureLock();
      if(settingsChanged(expected))return null;
      const shop = state?.match?.private?.shop;
      const funds = state?.match?.private?.funds;
      if (shop?.refreshPrice !== expected.price || !Number.isSafeInteger(funds) ||
          funds < expected.price || !sameSlots(shop?.slots, expected.slots)) {
        throw new Error('刷新前价格、资金或商店槽位已变化，已取消请求');
      }
      await ask('refresh', { expectedPrice: expected.price, expectedSlots: expected.slots });
      return true;
    },
    useCoin: async (itemUid, parentUid) => {
      if (!Number.isInteger(itemUid) || !Number.isInteger(parentUid)) {
        throw new Error('盟约之币或装备目标 UID 无效');
      }
      await ensureLock();
      const p = state?.match?.private;
      const pieces = [...(p?.hand || []), ...(p?.board || []), ...(p?.temp || [])];
      const coin = pieces.find(x => x?.uid === itemUid);
      const target = pieces.find(x => x?.uid === parentUid);
      if (p?.shop?.rewardOffer?.slots?.length || coin?.kind !== 'item' ||
          (coin.id !== 'chess_item_1_03_e_a' && coin.id !== 'chess_item_1_03_e_b') ||
          !target || target.kind !== 'chess' || !Array.isArray(target.items) || target.items.length >= 2) {
        throw new Error('盟约之币或装备目标状态已变化；不会替换或销毁已佩戴装备');
      }
      await ask('coin', { itemUid, parentUid });
      return true;
    },
    // 自动使用: one consumable from hand/temp onto an owned operator (board/hand) with a free
    // equipment slot. No replaceUid is ever sent, so equipped items cannot be replaced or destroyed.
    useItem: async (itemUid, targetUid, expectedId, expected={}) => {
      if (!Number.isInteger(itemUid) || !Number.isInteger(targetUid) || typeof expectedId !== 'string') {
        throw new Error('自动使用道具请求不完整');
      }
      await ensureLock();
      if(settingsChanged(expected))return null;
      const p = state?.match?.private, plan = getPlan();
      const item = [...(p?.hand || []), ...(p?.temp || [])].find(x => x?.uid === itemUid);
      const target = [...(p?.board || []), ...(p?.hand || [])].find(x => x?.uid === targetUid);
      const allowed = Array.isArray(plan?.useItems) ? plan.useItems.filter(rule => rule?.usable === true).map(rule => rule.id) : [];
      if(!allowed.includes(expectedId))return null; // Auto-use was switched off; no request sent.
      if (p?.shop?.rewardOffer?.slots?.length || item?.kind !== 'item' || item.id !== expectedId ||
          !allowed.includes(expectedId) || target?.kind !== 'chess' || !Array.isArray(target.items) ||
          target.items.length >= 2) {
        throw new Error('道具或装备目标状态已变化；不会替换或销毁已佩戴装备');
      }
      const response = await ask('use-item', { itemUid, targetUid, expectedId, allowed: allowed.slice(0, 64),
        keep: Array.isArray(plan.keep) ? plan.keep.slice(0, 512) : [] });
      return response?.result && typeof response.result === 'object' ? response.result : {};
    },
    reward: async (slot, expected) => {
      if (!Number.isInteger(slot) || slot < 0 || !expected || typeof expected.id !== 'string' ||
          !Array.isArray(expected.slots)) throw new Error('松果免费选卡请求不完整');
      await ensureLock();
      if(settingsChanged(expected))return null;
      const p = state?.match?.private, offer = p?.shop?.rewardOffer;
      if (!offer || offer.source !== expected.source || offer.label !== expected.label ||
          offer.tier !== expected.tier || offer.queued !== expected.queued ||
          !sameSlots(offer.slots, expected.slots) ||
          offer.slots[slot]?.id !== expected.id || offer.slots[slot]?.price !== 0) {
        throw new Error('松果选卡在请求前已变化；不会自动选择');
      }
      const plan = getPlan();
      await ask('reward', { slot, expectedId: expected.id, expectedPrice: 0,
        keep: Array.isArray(plan.keep) ? plan.keep : [] });
      return true;
    },
    mergeReward: async (slot, expected) => {
      if (!Number.isInteger(slot) || slot < 0 || !expected || typeof expected.id !== 'string' ||
          !Array.isArray(expected.slots)) throw new Error('合成晋升选卡请求不完整');
      await ensureLock();
      if(settingsChanged(expected))return null;
      const offer = state?.match?.private?.shop?.rewardOffer;
      if (!offer || offer.source !== 'merge' || offer.source !== expected.source ||
          offer.label !== expected.label || offer.tier !== expected.tier ||
          offer.queued !== expected.queued || !sameSlots(offer.slots, expected.slots) ||
          offer.slots[slot]?.id !== expected.id || offer.slots[slot]?.price !== 0) {
        throw new Error('合成晋升选卡在请求前已变化；不会自动选择');
      }
      const plan = getPlan();
      await ask('merge-reward', { slot, expectedId: expected.id, expectedPrice: 0,
        keep: Array.isArray(plan.keep) ? plan.keep : [] });
      return true;
    },
    sell: async (uid, expectedSale) => {
      if(!Number.isInteger(uid) || expectedSale?.uid!==uid || typeof expectedSale.id!=='string' ||
        !['hand','temp'].includes(expectedSale.area) || expectedSale.equipped!==0 ||
        typeof expectedSale.inventoryStamp!=='string')throw new Error('缺少本次出售的锁定库存证明');
      const approved={...expectedSale};
      await ensureLock();
      const raw=state?.match?.private;
      const identity=`${state?.room?.code}|${state?.me?.playerId}|${state?.match?.public?.round}`;
      const unit=raw?.[approved.area]?.find(piece=>piece?.uid===uid);
      const deployed=approved.area==='hand' && raw?.board?.find(piece=>piece?.uid===uid && piece.kind==='chess' &&
        piece.id===approved.id && Array.isArray(piece.items) && piece.items.length===0);
      const hasReward=!!raw?.shop?.rewardOffer?.slots?.length;
      const rewardMatches=approved.pendingMergeStamp!=null ?
        hasReward && mergeOfferStamp(raw.shop.rewardOffer)===approved.pendingMergeStamp : !hasReward;
      if(deployed && identity===approved.identity && raw.funds===approved.funds && rewardMatches)return null;
      if(identity!==approved.identity || raw?.funds!==approved.funds || !rewardMatches ||
        unit?.kind!=='chess' || unit.id!==approved.id || !Array.isArray(unit.items) || unit.items.length!==0)
        throw new Error('取得交易锁期间待售干员的位置、装备或对局已变化，取消出售');
      const p=getPlan();
      if(Array.isArray(p.keep) && p.keep.some(id=>id===approved.base || operatorBaseId(id,chess)===approved.base) &&
        !(approved.surplusGift===true && canSellSurplusGift(inspectInventory(raw,chess),uid,p,chess)))return {cancelled:'settings'};
      const response=await ask('sell',{uid,expectedSale:approved,keep:Array.isArray(p.keep) ? p.keep : [],keepRules:p.keepRules || {}});
      return response?.result?.cancelled==='placement' ? null : true;
    },
    prepare:async expected=>{await ensureLock();return ask('prepare',expected);},
    acquireLock,
    dispose() {
      releaseOwnedLock?.(); disposed = true;
      window.removeEventListener('message', receive);
      for (const callback of [...pending.values()]) callback({ok:false,reason:'工作台已关闭'});
      for (const callback of [...failures]) callback('工作台已关闭');
      subscribers.clear();
    },
  };
}
