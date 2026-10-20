// MAIN world, installed only by an explicit extension-popup click on a compatible game tab.
// Reads the game's own store/actions from THIS page's origin; never hardcodes a server address.
(() => {
  const cfg = globalThis.__weiMainConfig;
  if (!cfg || typeof cfg.nonce !== 'string' || cfg.nonce.length < 16 ||
      typeof cfg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(cfg.version)) return;
  const root = new URL(cfg.root, location.href);
  if (root.origin !== location.origin || !['http:', 'https:'].includes(root.protocol)) return;
  if (globalThis.__recruitAssistPageBridgeInstalled) return; // old extension: never run two sellers
  globalThis.__weiMainBridge?.dispose?.();
  const CHANNEL = 'wei.runtime.v1';
  const FLAME = 'chess_char_4_19_a';
  const GIFT = ['chess_char_1_19_a', 'chess_char_2_18_a', 'chess_char_4_20_a'];
  const GIFT_SET = new Set(GIFT);
  const SWIRE = 'chess_char_3_03_a';
  const COIN = 'chess_item_1_03_e_a';
  const COIN_GOLDEN = 'chess_item_1_03_e_b';
  const PINECONE = 'chess_char_3_10_a';
  const nonce = cfg.nonce;
  let disposed = false;
  let offStore = null;
  let busy = false;
  let manualSupported=false,restoreManual=null;
  const ledger = new Map(); // ONLY fresh UIDs from audited buy/reward/packaging outputs may be sold.
  const coinLedger = new Map(); // ONLY a coin produced by this run's Swire buy may be used.
  const placementProtected=new Set();
  let placementPrevious=null;
  let pendingReward = null; // Typed, one-use proof: Pinecone sale, gift merge, or retained purchase merge.
  const send = (type, extra = {}) => { if (!disposed) window.postMessage({ channel: CHANNEL, side: 'game', nonce, version: cfg.version, type, ...extra }, location.origin); };
  const reject = (rid, reason) => send('response', { rid, ok: false, reason });
  let handleMessage = null;
  const ownBridge = globalThis.__weiMainBridge = {
    version: cfg.version,
    dispose() {
      disposed = true;
      restoreManual?.();restoreManual=null;
      if (offStore) offStore();
      if (handleMessage) window.removeEventListener('message', handleMessage);
      ledger.clear(); coinLedger.clear(); pendingReward = null;placementProtected.clear();placementPrevious=null;
      if (globalThis.__weiMainBridge === ownBridge) globalThis.__weiMainBridge = null;
      if (globalThis.__spuiMainBridge === ownBridge) globalThis.__spuiMainBridge = null;
    },
  };
  globalThis.__spuiMainBridge = ownBridge; // Legacy popup sees this marker and refuses parallel injection.
  delete globalThis.__weiMainConfig;

  function liveGame() {
    const sp = globalThis.__SP__;
    return sp && typeof sp === 'object' && sp.version === 1 && typeof sp.store?.get === 'function' &&
      typeof sp.store?.subscribe === 'function' && typeof sp.net?.request === 'function' ? sp : null;
  }
  // Same intents as the game's own js/ui/gameActions.js: resolve true on ok, false on any error; never throws.
  function netActions(net) {
    const send = async (type, fields) => { try { await net.request(type, fields); return true; } catch { return false; } };
    return Object.freeze({
      buy: slot => send('g.buy', { slot }),
      sell: uid => send('g.sell', { uid }),
      refresh: () => send('g.refresh', {}),
      ready: ready => send('g.ready', {ready}),
      equip: (itemUid, targetUid) => send('g.equip', { itemUid, targetUid }), // never a replaceUid
      reward: idx => send('g.reward', { idx }),
    });
  }
  async function boot() {
    // 兼容打包版网页（Vite 构建，没有 js/main.js）：游戏自身暴露的 globalThis.__SP__ = {store, net, version:1}
    // 就是界面正在使用的同一份状态与连接；优先使用它。只有旧版网页没有 __SP__ 时才按源码路径导入模块。
    const sp = liveGame();
    const [{ store }, { actions: rawActions }, chessRes, garrisonRes, itemsRes] = await Promise.all([
      sp ? { store: sp.store } : import(new URL('js/store.js', root)),
      sp ? { actions: netActions(sp.net) } : import(new URL('js/ui/gameActions.js', root)),
      fetch(new URL('data/chess.json', root), { cache: 'no-store' }),
      fetch(new URL('data/garrisons.json', root), { cache: 'no-store' }).catch(() => null),
      fetch(new URL('data/items.json', root), { cache: 'no-store' }).catch(() => null),
    ]);
    if (disposed) return;
    let ownIntent=0;
    const actions=Object.fromEntries(Object.entries(rawActions || {}).filter(([,fn])=>typeof fn==='function').map(([key,fn])=>[key,(...args)=>{ownIntent++;try{return fn.apply(rawActions,args);}finally{ownIntent--;}}]));
    if (!store?.get || !store?.subscribe || !actions?.buy || !actions?.sell || !actions?.refresh ||
        !actions?.equip || !actions?.reward || !chessRes.ok) {
      throw new Error('页面不提供兼容的对局状态或买卖接口');
    }
    const chess = await chessRes.json();
    const garrisons = garrisonRes?.ok ? await garrisonRes.json().catch(() => null) : null;
    const itemsRaw = itemsRes?.ok ? await itemsRes.json().catch(() => null) : null;
    const itemData = itemsRaw && typeof itemsRaw === 'object' ? (itemsRaw.items || itemsRaw) : null;
    if (!chess?.[FLAME] || !chess['chess_char_1_19_a'] || Object.keys(chess).length < 20) {
      throw new Error('角色图鉴不兼容，停止注入');
    }
    const roundTrades=createRoundTradeStats({read:()=>store.get(),onChange:()=>send('snapshot',{state:view()})});
    const base = id => typeof id === 'string' && chess[id] ? (typeof chess[id].baseId === 'string' && chess[chess[id].baseId] ? chess[id].baseId : id) : null;
    // Independent copy of item-policy.js itemMergeRule: mirrors the server's _itemMergeable.
    const itemRecord = id => itemData && typeof id === 'string' && Object.hasOwn(itemData, id) &&
      itemData[id] && typeof itemData[id] === 'object' ? itemData[id] : null;
    function itemMergeRule(id) {
      const rec = itemRecord(id);
      if (!rec) return null;
      if (rec.isGolden === true || rec.itemType !== 'EQUIP' || rec.mergeable !== true) return { mergeable: false };
      const need = Number.isInteger(rec.upgradeNum) ? rec.upgradeNum : 2;
      const goldenId = rec.upgradeChessId || rec.goldenId;
      if (!(need > 1 && need < 100) || typeof goldenId !== 'string' || goldenId === id || !itemRecord(goldenId)) {
        return { mergeable: false };
      }
      return { mergeable: true, need, goldenId };
    }
    const bases = ids => new Set((Array.isArray(ids) ? ids : []).slice(0, 512).map(base).filter(Boolean));
    const piece = p => !p ? null : ({ uid: p.uid, id: p.id, kind: p.kind, golden: p.golden === true,
      ...(p.kind === 'chess' ? { items: Array.isArray(p.items) ? p.items.map(it => ({ uid: it.uid, id: it.id })) : [] } : {}) });
    const slot = s => !s ? null : ({ id: s.id, kind: s.kind, price: s.price, sold: s.sold === true });
    // 自选编队 picks of THIS match: slot base id → the operator's charId only.
    const diyPicks = d => !d || typeof d !== 'object' ? null : Object.fromEntries(Object.entries(d).slice(0, 16)
      .filter(([id, pick]) => /^[A-Za-z0-9_]{3,80}$/.test(id) && typeof pick?.charId === 'string' &&
        /^[A-Za-z0-9_]{3,80}$/.test(pick.charId)).map(([id, pick]) => [id, { charId: pick.charId }]));
    function view(raw) {
      const s = raw || store.get();
      const room = s?.room, pub = s?.match?.public, p = s?.match?.private;
      return {
        readySupported:typeof actions.ready==='function',manualSupported,roundStats:roundTrades.read(),
        connection: { status: s?.connection?.status }, ui: { buildStale: s?.ui?.buildStale === true },
        me: { playerId: s?.me?.playerId },
        room: room ? { code: room.code, inMatch: room.inMatch,
          seats: Array.isArray(room.seats) ? room.seats.map(x => ({ playerId: x?.playerId })) : null } : null,
        match: {
          public: pub ? { phase: pub.phase, round: pub.round,
            players: Array.isArray(pub.players) ? pub.players.map(x => ({ playerId: x?.playerId, autoplay: x.autoplay })) : null } : null,
          private: p ? { alive: p.alive, ready: p.ready, canReady:p.canReady, funds: p.funds,
            diy: diyPicks(p.diy),
            bonds:Array.isArray(p.bonds) ? p.bonds.filter(bond=>bond?.bondId==='investShip')
              .map(({bondId,active,layers})=>({bondId,active,layers})) : p.bonds,
            hand: Array.isArray(p.hand) ? p.hand.map(piece) : null,
            board: Array.isArray(p.board) ? p.board.map(piece) : null,
            temp: Array.isArray(p.temp) ? p.temp.map(piece) : null,
            shop: p.shop ? { slots: Array.isArray(p.shop.slots) ? p.shop.slots.map(slot) : null,
              refreshPrice: p.shop.refreshPrice, level:p.shop.level,
              rewardOffer: p.shop.rewardOffer && Array.isArray(p.shop.rewardOffer.slots)
                ? { source: p.shop.rewardOffer.source, label: p.shop.rewardOffer.label,
                  tier: p.shop.rewardOffer.tier, queued: p.shop.rewardOffer.queued,
                  slots: p.shop.rewardOffer.slots.map(slot) } : null } : null } : null,
        },
      };
    }
    function context({ allowReward = false } = {}) {
      if (disposed || globalThis.__spuiMainBridge !== ownBridge || globalThis.__weiMainBridge !== ownBridge || globalThis.__recruitAssistPageBridgeInstalled || document.querySelector?.('.spui')) throw new Error('检测到其他交易插件或旧桥接，已停止');
      const s = store.get(), p = s?.match?.private, pub = s?.match?.public;
      const me = s?.me?.playerId, room = s?.room;
      if (s?.connection?.status !== 'online' || s?.ui?.buildStale ||
          typeof me !== 'string' || !me || !room?.inMatch || typeof room.code !== 'string' ||
          !Array.isArray(room.seats) || !room.seats.some(x => x?.playerId === me) ||
          pub?.phase !== 'PREP' || !Number.isInteger(pub.round) ||
          !Array.isArray(pub.players) || !pub.players.some(x => x?.playerId === me && x.autoplay !== true) ||
          !p || p.ready !== false || p.alive === false ||
          !p.shop || !Array.isArray(p.shop.slots) ||
          ![p.hand,p.board,p.temp].every(Array.isArray) ||
          !Number.isInteger(p.funds) || p.funds < 0 ||
          (Array.isArray(p.shop.rewardOffer?.slots) && p.shop.rewardOffer.slots.length > 0 && !allowReward)) {
        throw new Error('游戏阶段、座位、库存或连接状态不允许交易');
      }
      const units = new Map(), items = new Map(), seen = new Set();
      let ownedCopies = Object.create(null);
      for (const [area, list] of [['hand', p.hand], ['board', p.board], ['temp', p.temp]]) {
        for (const piece of list) {
          if (!piece) continue;
          if (!Number.isInteger(piece.uid) || piece.uid < 0 || seen.has(piece.uid)) throw new Error('库存 UID 缺失或重复');
          seen.add(piece.uid);
          if (piece.kind === 'chess') {
            if (typeof piece.id !== 'string' ||
                (piece.items != null && !Array.isArray(piece.items))) throw new Error('干员或已配发装备状态无效');
            const idBase = base(piece.id), golden = piece.golden === true || chess[piece.id]?.isGolden === true;
            units.set(piece.uid, { id: piece.id, base: idBase, area, golden, equipped: (piece.items || []).length });
            if (!idBase || chess[idBase]?.isGolden === true) ownedCopies = null;
            else if (ownedCopies) ownedCopies[idBase] = (ownedCopies[idBase] || 0) + (golden ? 3 : 1);
            for (const it of piece.items || []) {
              if (!Number.isInteger(it?.uid) || it.uid < 0 || typeof it.id !== 'string' || seen.has(it.uid)) {
                throw new Error('已配发装备 UID 缺失或重复');
              }
              seen.add(it.uid);
              items.set(it.uid, { id: it.id, area: 'equipped', carrierUid: piece.uid });
            }
          } else if (piece.kind === 'item') {
            if (typeof piece.id !== 'string') throw new Error('道具 ID 无效');
            items.set(piece.uid, { id: piece.id, area });
          }
        }
      }
      return { p, units, items, ownedCopies, identity: `${room.code}|${me}|${pub.round}` };
    }
    const tradeSnapshot=ctx=>({ok:true,identity:ctx.identity,ownedCopies:ctx.ownedCopies,refreshPrice:ctx.p.shop.refreshPrice,shopLevel:ctx.p.shop.level,
      rewardOffer:ctx.p.shop.rewardOffer ? {...ctx.p.shop.rewardOffer,slots:ctx.p.shop.rewardOffer.slots.map(slot)} : null,
      slots:ctx.p.shop.slots.map(slot),hand:ctx.p.hand.map(piece),funds:ctx.p.funds,
      gainRepeats:gainTraitRepeats(ctx.p.bonds),
      units:[...ctx.units].map(([uid,unit])=>({uid,...unit})),
      unitByUid:new Map([...ctx.units].map(([uid,unit])=>[uid,{uid,...unit}])),
      items:[...ctx.items].map(([uid,item])=>({uid,...item})),
      itemByUid:new Map([...ctx.items].map(([uid,item])=>[uid,{uid,...item}]))});
    function observePlacement(){
      let next;
      try{next=tradeSnapshot(context({allowReward:true}));}catch{return;}
      if(placementPrevious?.identity!==next.identity){placementProtected.clear();placementPrevious=next;return;}
      for(const unit of next.units)if(changedDeployment(placementPrevious.unitByUid.get(unit.uid),unit)){
        placementProtected.add(unit.uid);ledger.delete(unit.uid);
      }
      if(pendingReward?.kind==='flametail_merge' && pendingReward.identity===next.identity &&
        pendingReward.stamp===stampOffer(next.rewardOffer)){
        const placement=auditOverflowPlacement(placementPrevious,next,chess);
        if(placement.ok)for(const uid of placement.refilledUids){
          const entry=ledger.get(uid), unit=next.unitByUid.get(uid);
          if(entry && unit && entry.identity===next.identity)entry.area=unit.area;
        }
      }
      placementPrevious=next;
    }
    function mergeRisk(ctx, id) {
      const rec = chess[id];
      if (!rec || rec.isGolden || !rec.goldenId || !chess[rec.goldenId]) return false;
      const need = Number.isInteger(rec.upgradeNum) && rec.upgradeNum > 1 ? rec.upgradeNum : 3;
      return [...ctx.units.values()].filter(x => x.base === base(id) && !chess[x.id]?.isGolden).length + 1 >= need;
    }
    const pineconeOffer=raw=>isPineconeSaleOffer(raw,chess);
    function flametailMergeOffer(raw) {
      return isPackagingMergeOffer(raw,chess,store.get()?.match?.private?.shop?.level);
    }
    // Independent MAIN-world guard for the UI's free-card ranking. The exact
    // whitelist must match src/engine/auto-policy.js: pure funds/free refresh or
    // immediate bond layers only. Missing/unknown traits and chess/item gifts are not safe.
    const REWARD_ECONOMY = new Set(['SERVER_ONCE_GOLD', 'SERVER_GAIN_FREE_REFRESH_COUNT']);
    const REWARD_LAYERS = new Set([
      'SERVER_ADD_BOND', 'SERVER_ADD_BOND_CHESS_ALL', 'SERVER_ADD_BOND_METHOD',
      'SERVER_ADD_MULTIPLE_BOND', 'SERVER_ADD_BOND_ACTIVATED_MOST_LAYER',
    ]);
    const REWARD_LATER_EVENTS = new Set([
      'IN_BATTLE', 'SERVER_PREP_FIN', 'SERVER_PREP_START', 'SERVER_REFRESH_SHOP', 'SERVER_PRICE',
    ]);
    function rewardTraitRank(id) {
      const rec = chess[id];
      if (!rec || !garrisons || typeof garrisons !== 'object' || !Array.isArray(rec.garrisonIds)) return null;
      let economy = false, layers = false;
      for (const gid of rec.garrisonIds) {
        const trait = typeof gid === 'string' ? garrisons[gid] : null;
        if (!trait || typeof trait.eventType !== 'string') return null;
        if (trait.eventType === 'SERVER_GAIN' || trait.eventType === 'SERVER_CHESS_SOLD') {
          // IN_BATTLE effectType is a category, not the effectKey handler.
          // Compare keys only for immediate acquisition/sale effects.
          if (typeof trait.effectType === 'string' && trait.effectType !== trait.effectKey) return null;
          if (REWARD_ECONOMY.has(trait.effectKey)) economy = true;
          else if (REWARD_LAYERS.has(trait.effectKey)) layers = true;
          else if (id === PINECONE && trait.eventType === 'SERVER_CHESS_SOLD' &&
                   trait.effectKey === 'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS') {
            // Existing, independently proven Pinecone-sale → free-offer path.
          } else return null;
        } else if (!REWARD_LATER_EVENTS.has(trait.eventType)) return null;
      }
      return economy ? 0 : layers ? 1 : 2;
    }
    function safeMergeCard(ctx, id, keepList) {
      const rec = chess[id], idBase = base(id);
      return !!rec && !!idBase && !mergeRisk(ctx, id) &&
        !(ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) &&
        (rec.visible === true && rec.isHidden !== true && rec.isDiy !== true ||
          bases(keepList).has(idBase)) && rewardTraitRank(id) !== null;
    }
    const stampOffer = offer => JSON.stringify(offer && {
      source: offer.source, label: offer.label, tier: offer.tier, queued: offer.queued,
      slots: offer.slots.map(slot),
    });
    function waitFor(predicate, ms = 5000) {
      return new Promise(resolve => {
        let done = false, off = null, timer;
        const finish = result => { if (done) return; done = true;
          if (off) off(); clearTimeout(timer); resolve(result); };
        timer = setTimeout(() => finish(null), ms);
        off = store.subscribe(s => { if (predicate(s)) finish(s); });
        if (done && off) off(); // also safe if a store calls listeners upon subscribing
        const current = store.get();
        if (predicate(current)) finish(current);
      });
    }
    // MAIN 世界独立核对实时库存，绝不信任界面上报的数量。
    function assertKeepRule(rule, ctx, idBase, offer) {
      if (!rule) return; // Old plans without per-entry rules retain their behavior.
      if (rule.limit !== null && (!Number.isInteger(rule.limit) || rule.limit < 1 || rule.limit > 99) ||
          rule.minFunds !== null && (!Number.isSafeInteger(rule.minFunds) || rule.minFunds < 0 || rule.minFunds > 999999999)) {
        throw new Error('保留干员持有目标或资金门槛无效');
      }
      const copies = offer.golden === true || chess[offer.id]?.isGolden === true ? 3 : 1;
      if (rule.limit !== null && (!ctx.ownedCopies || (ctx.ownedCopies[idBase] || 0) + copies > rule.limit) ||
          rule.minFunds !== null && ctx.p.funds <= rule.minFunds) {
        throw new Error('保留干员已达持有目标、库存待核对，或购买前资金未严格高于门槛');
      }
    }
    async function buy(message) {
      const ctx = context();
      const index = message.slot;
      if (!Number.isInteger(index) || index < 0 || index >= ctx.p.shop.slots.length) throw new Error('商店槽位超出范围');
      const offer = ctx.p.shop.slots[index];
      if (!offer || offer.kind !== 'chess' || offer.sold || typeof offer.id !== 'string' ||
          typeof offer.price !== 'number' || !Number.isInteger(offer.price) || offer.price < 0 ||
          offer.id !== message.expectedId || offer.price !== message.expectedPrice ||
          offer.price > ctx.p.funds) throw new Error('商店卡片已变化、售出或资金不足');
      if (ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) throw new Error('手牌区已满');
      const rec = chess[offer.id];
      const idBase = base(offer.id);
      if (!rec || !idBase) throw new Error('干员 ID 不在本服务器图鉴中');
      const keep = bases(message.keep);
      const selected = bases(message.buy);
      const surplusKeep=keep.has(idBase) && canReverseFullKeep({ownedCopies:ctx.ownedCopies,funds:ctx.p.funds},idBase,message.keepRules?.[idBase]);
      const retained = keep.has(idBase) && !surplusKeep;
      if (retained) assertKeepRule(message.keepRules?.[idBase], ctx, idBase, offer);
      if (!retained && bases(message.excludedBuy).has(idBase)) throw new Error('此干员买入规则已禁用');
      const ordinary = rec.isGolden !== true && rec.visible === true && rec.isHidden !== true && rec.isDiy !== true;
      if (!retained && (!ordinary || !(offer.price <= 1 || selected.has(idBase)))) {
        throw new Error('不属于价格 0/1、自定义或保留名单');
      }
      const purchaseBefore=tradeSnapshot(ctx);
      const retainedMerge=retained ? planRetainedMerge(purchaseBefore,offer.id,chess) : null;
      if(retained && mergeRisk(ctx,offer.id) && !retainedMerge)throw new Error('保留购买的同名合成旧 UID 无法预先核验');
      if (!retained && mergeRisk(ctx, offer.id)) throw new Error('将消耗原有同名干员，已跳过');
      if (idBase === FLAME && (offer.id !== FLAME || mergeRisk(ctx, FLAME) ||
          GIFT.some(id => !chess[id]?.goldenId || !chess[chess[id].goldenId]))) {
        throw new Error('精锐焰尾赠品未经支持，或焰尾本体可能合成旧干员；已跳过');
      }
      // Old normal gifts may merge irreversibly. Independent post-buy evidence
      // must account for every consumed UID and protect the mixed-inventory elite.
      const before = ctx.units;
      const ok = await actions.buy(index);
      if (ok !== true) throw new Error('游戏服务器拒绝买入');
      const updated = await waitFor(s => s.match?.private?.shop?.slots?.[index]?.id === offer.id &&
        s.match.private.shop.slots[index].sold === true);
      if (!updated) throw new Error('买入后未收到可核对的状态；不会自动出售');
      const after = context({ allowReward: offer.id === FLAME || !!retainedMerge });
      if (after.identity !== ctx.identity) throw new Error('买入期间对局已切换');
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (!fresh.length || fresh.length > (offer.id === FLAME ? 4 : 3) || fresh.some(([, unit]) =>
        !unit.base || (unit.base !== idBase && !(offer.id === FLAME && GIFT_SET.has(unit.base))))) {
        throw new Error('新购 UID 的数量或来源不符合预期，停止出售');
      }
      let ordinaryAudit=null, flametailAudit=null;
      if(offer.id!==FLAME){
        ordinaryAudit=auditOrdinaryPurchase(purchaseBefore,tradeSnapshot(after),
          {id:offer.id,slot:index,price:offer.price},{chess,retained});
        if(!ordinaryAudit.ok)throw new Error(ordinaryAudit.reason);
        if(ordinaryAudit.mergedKeepReward){
          pendingReward={kind:'keep_merge',identity:ctx.identity,stamp:stampOffer(after.p.shop.rewardOffer)};
          for(const consumedUid of ordinaryAudit.consumedUids)ledger.delete(consumedUid);
        }
      }
      if (offer.id === FLAME) {
        flametailAudit=auditFlametailPurchase(purchaseBefore,tradeSnapshot(after),
          {id:offer.id,slot:index,price:offer.price},{chess});
        if(!flametailAudit.ok)throw new Error(flametailAudit.reason);
        for(const consumedUid of flametailAudit.consumedUids){ledger.delete(consumedUid);placementProtected.delete(consumedUid);}
        if(flametailAudit.mergedGift)
          pendingReward={kind:'flametail_merge',identity:ctx.identity,stamp:stampOffer(after.p.shop.rewardOffer),
            drainUids:fresh.map(([uid])=>uid)};
      }
      for(const uid of ordinaryAudit?.coinConsumedUids || [])coinLedger.delete(uid);
      for(const coin of ordinaryAudit?.coins || []){
        coinLedger.set(coin.uid,{id:coin.id,parentUid:ordinaryAudit.parent.uid,identity:ctx.identity,
          ...(coin.mergedFrom!=null ? {mergedFrom:coin.mergedFrom} : {})});
      }
      for(const uid of flametailAudit?.refilledUids || []){
        const entry=ledger.get(uid), unit=after.units.get(uid);
        if(entry && unit && entry.identity===after.identity)entry.area=unit.area;
      }
      const quotaGifts=new Set(flametailAudit?.gifts.map(unit=>unit.uid) || []);
      for (const [uid, unit] of fresh) ledger.set(uid, { ...unit, identity: ctx.identity,
        surplusGift:quotaGifts.has(uid) || surplusKeep && unit.base===idBase,
        protected: (!quotaGifts.has(uid) && !(surplusKeep && unit.base===idBase) && keep.has(unit.base)) || placementProtected.has(uid) || unit.area==='board' });
      return { count: fresh.length };
    }
    // Item purchases never enter the chess sale ledger. Both worlds check the
    // exact shop offer, funds, one fresh item UID and unchanged prior inventory.
    async function buyItem(message) {
      const ctx = context(), index = message.slot;
      if (!Number.isInteger(index) || index < 0 || index >= ctx.p.shop.slots.length) throw new Error('道具槽位超出范围');
      const offer = ctx.p.shop.slots[index], rule = message.itemRule;
      if (!offer || offer.kind !== 'item' || offer.sold || typeof offer.id !== 'string' ||
          !Number.isSafeInteger(offer.price) || offer.price < 0 || offer.price > ctx.p.funds ||
          offer.id !== message.expectedId || offer.price !== message.expectedPrice ||
          !rule || rule.id !== offer.id || rule.enabled !== true ||
          rule.limit !== null && (!Number.isInteger(rule.limit) || rule.limit < 1 || rule.limit > 99) || // null = 不限
          !Number.isInteger(rule.used) || rule.used < 0 || rule.used > 9999 || rule.used >= (rule.limit ?? 9999) ||
          rule.minFunds !== null && (!Number.isSafeInteger(rule.minFunds) || rule.minFunds < 0 ||
            rule.minFunds > 999999999 || ctx.p.funds <= rule.minFunds)) {
        throw new Error('道具商店卡片、启用状态、次数或购买前资金门槛未通过');
      }
      if (rule.ownedTarget != null) {
        const rec = itemRecord(offer.id), base = rec?.baseId || offer.id;
        const variants = new Set([offer.id,base]);
        for (const entry of [rec,itemRecord(base)]) {
          const golden = entry?.goldenId || entry?.upgradeChessId;
          if (typeof golden === 'string') variants.add(golden);
        }
        const held = [...ctx.items.values()].filter(item => variants.has(item.id) &&
          !(offer.id === 'chess_item_6_08_e_a' && item.area === 'equipped')).length;
        if (!Number.isInteger(rule.ownedTarget) || rule.ownedTarget < 1 || rule.ownedTarget > 99 || held >= rule.ownedTarget)
          throw new Error('道具实时持有目标已达到或无效，不会继续买入');
      }
      if (ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) throw new Error('手牌区已满');
      const snapshot=ctx=>{
        const snap=tradeSnapshot(ctx),items=snap.items.map(item=>({...item,carrierUid:item.carrierUid??null}));
        return {...snap,items,itemByUid:new Map(items.map(item=>[item.uid,item]))};
      };
      const before=snapshot(ctx);
      const planned=ItemMergeSafety.planItemMerge(before,offer.id,itemMergeRule(offer.id),rule);
      if(!planned.ok)throw new Error(planned.reason);
      const merge=planned.merge,expect=message.expectMerge || null;
      if(!!merge!==!!expect || merge && (expect.goldenId!==merge.goldenId ||
        !Array.isArray(expect.consumed) || JSON.stringify(expect.consumed)!==JSON.stringify(merge.consumed) ||
        JSON.stringify(expect.equipped || [])!==JSON.stringify(merge.equipped || [])))
        throw new Error('工作台与游戏页对道具合成材料/携带者的判断不一致；不会自动买入');
      const ok=await actions.buy(index);
      if(ok!==true)throw new Error('游戏服务器拒绝道具买入');
      const updated=await waitFor(s=>s.match?.private?.shop?.slots?.[index]?.id===offer.id&&s.match.private.shop.slots[index].sold===true);
      if(!updated)throw new Error('道具买入后状态未确认；不会自动重复购买');
      const checked=ItemMergeSafety.auditItemPurchase(before,snapshot(context()),
        {id:offer.id,slot:index,price:offer.price,merge,allowEquippedMerge:rule.allowEquippedMerge===true});
      if(!checked.ok)throw new Error(checked.reason+'；道具可能已买入，不会自动重试');
      // Removing the one explicitly-authorized item never authorizes selling its old carrier.
      for(const part of merge?.equipped || []){ledger.delete(part.carrierUid);placementProtected.add(part.carrierUid);}
      return {itemUid:checked.item.uid,...(checked.merged?{merged:true}: {})};
    }
    // Only the game's own ordinary shop refresh is supported. A rejected/ambiguous response
    // must never be retried automatically, since the server may already have charged the player.
    async function refresh(message) {
      const ctx = context();
      const shop = ctx.p.shop;
      const price = shop.refreshPrice;
      if (!Number.isSafeInteger(price) || price < 0 || price > ctx.p.funds ||
          message.expectedPrice !== price) throw new Error('商店刷新价格不可核对或资金不足');
      const beforeSlots = shop.slots.map(slot);
      if (!Array.isArray(message.expectedSlots) || message.expectedSlots.length > 20 ||
          JSON.stringify(message.expectedSlots) !== JSON.stringify(beforeSlots)) {
        throw new Error('刷新前商店槽位已变化，取消该次刷新');
      }
      const beforeFunds = ctx.p.funds;
      const beforeStamp = JSON.stringify(beforeSlots);
      const ok = await actions.refresh();
      if (ok !== true) throw new Error('游戏服务器拒绝刷新，不会自动重试');
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && (p.funds !== beforeFunds || p.shop?.refreshPrice !== price ||
          (Array.isArray(p.shop?.slots) && JSON.stringify(p.shop.slots.map(slot)) !== beforeStamp));
      }, 5500);
      if (!updated) throw new Error('刷新指令可能已生效，但商店回执未确认；停止且不会重复扣费');
      const after = context();
      if (after.identity !== ctx.identity) throw new Error('刷新期间对局或回合已切换');
      if (!Number.isSafeInteger(after.p.shop.refreshPrice) || after.p.shop.refreshPrice < 0) {
        throw new Error('刷新后价格无法确认，已停止');
      }
      if (price > 0 && beforeFunds - after.p.funds !== price) {
        throw new Error('刷新后的资金变化与实际标价不符，已停止');
      }
      if (price === 0 && JSON.stringify(after.p.shop.slots.map(slot)) === beforeStamp &&
          after.p.shop.refreshPrice === price) {
        throw new Error('免费刷新后没有可核对的商店变化，已停止避免无穷重复');
      }
      return { price };
    }
    async function useCoin(message) {
      const { itemUid, parentUid } = message; // parentUid = equip target (any owned chess with a free slot)
      const ctx = context();
      const item = ctx.items.get(itemUid), target = ctx.units.get(parentUid);
      if (!Number.isInteger(itemUid) || !Number.isInteger(parentUid) ||
          (item?.id !== COIN && item?.id !== COIN_GOLDEN) || !['hand', 'temp'].includes(item?.area) ||
          !target || !['hand', 'board', 'temp'].includes(target.area) ||
          !(Number.isInteger(target.equipped) && target.equipped >= 0 && target.equipped < 2)) {
        throw new Error('盟约之币或装备目标状态不安全；不会替换或销毁已佩戴装备');
      }
      // User-confirmed scope: EVERY normal/golden coin in hand may be used, whatever its
      // origin (Swire gift, shop purchase, prep drop). The server replaces an old equipped
      // item even for consumables, so the target must keep a free equipment slot.
      const beforeCoin=tradeSnapshot(ctx);
      const funds = ctx.p.funds;
      const ok = await actions.equip(itemUid, parentUid);
      if (ok !== true) throw new Error('盟约之币使用被游戏拒绝');
      coinLedger.delete(itemUid); // An acknowledged intent must NEVER be repeated after an ambiguous push.
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && (p.funds !== funds ||
          ![...p.hand, ...p.board, ...p.temp].some(x => x?.uid === itemUid && x?.id === item.id));
      });
      if (!updated) throw new Error('盟约之币可能已使用，但库存回执未确认；不会重复使用');
      const after = context();
      const checked=auditCoinAction(beforeCoin,tradeSnapshot(after),
        beforeCoin.unitByUid.get(parentUid),beforeCoin.itemByUid.get(itemUid));
      if(!checked.ok)throw new Error(checked.reason);
      return { amount:checked.gain, merged:checked.merged, ...(checked.coin?{coinUid:checked.coin.uid}:{}) };
    }
    // 自动使用 (user opt-in per item): a consume-on-equip item from hand/temp onto an owned board/hand
    // operator with a free slot. Independent MAIN-world copy of item-policy.js itemUseRule.
    function useRule(id) {
      const rec = itemRecord(id), kind = typeof rec?.kind === 'string' ? rec.kind : '';
      if (!rec || rec.itemType !== 'EQUIP' || !kind.startsWith('consume_on_equip')) return null;
      const keys = Array.isArray(rec.buffs) ? rec.buffs.map(buff => String(buff?.key || '')) : [];
      const delayed = kind === 'consume_on_equip_or_delayed';
      return { destroysCarrier: /目标干员.{0,6}销毁|销毁.{0,6}目标干员/.test(typeof rec.desc === 'string' ? rec.desc : '') ||
        keys.some(key => key.startsWith('use_equip_recruit_new_char')),
        needsNormal: delayed, staysEquipped: delayed && rec.isGolden !== true, promotes: delayed };
    }
    async function useItem(message) {
      const { itemUid, targetUid, expectedId } = message;
      const allowed = new Set((Array.isArray(message.allowed) ? message.allowed : []).slice(0, 64));
      const ctx = context();
      const item = ctx.items.get(itemUid), target = ctx.units.get(targetUid), rule = useRule(item?.id);
      if (!Number.isInteger(itemUid) || !Number.isInteger(targetUid) || !item || item.id !== expectedId ||
          !allowed.has(item.id) || !rule || !['hand', 'temp'].includes(item.area) ||
          !target || !['board', 'hand'].includes(target.area) ||
          !(Number.isInteger(target.equipped) && target.equipped >= 0 && target.equipped < 2) ||
          rule.destroysCarrier && (bases(message.keep).has(target.base) || chess[target.id]?.isDiy === true) ||
          rule.needsNormal && chess[target.id]?.isGolden === true) {
        throw new Error('道具或装备目标不满足自动使用条件；不会替换或销毁已佩戴装备');
      }
      const before = ctx.items, beforeUnits = ctx.units, funds = ctx.p.funds;
      const ok = await actions.equip(itemUid, targetUid); // never a replaceUid
      if (ok !== true) throw new Error('道具使用被游戏拒绝');
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && ![...(p.hand || []), ...(p.temp || [])].some(x => x?.uid === itemUid);
      });
      if (!updated) throw new Error('道具可能已使用，但库存回执未确认；不会重复使用');
      const after = context({ allowReward: true });
      const now = after.items.get(itemUid);
      if (after.identity !== ctx.identity || after.p.funds < funds ||
          now && !(rule.staysEquipped && now.area === 'equipped' && now.carrierUid === targetUid) ||
          [...before].some(([uid, it]) => uid !== itemUid && after.items.get(uid)?.id !== it.id) ||
          [...beforeUnits].some(([uid, unit]) => !after.units.has(uid) &&
            !(uid === targetUid && (rule.destroysCarrier || rule.promotes)) && chess[unit.id]?.isGolden === true)) {
        throw new Error('道具使用后的资金、道具或干员状态不符合预期，停止后续交易');
      }
      return { consumed: !now, reward: !!after.p.shop.rewardOffer?.slots?.length };
    }
    async function pickReward(message) {
      const proof = pendingReward;
      const ctx = context({ allowReward: true });
      const offer = ctx.p.shop.rewardOffer;
      if (proof?.kind !== 'pinecone' || proof.identity !== ctx.identity || !pineconeOffer(offer) ||
          proof.stamp !== stampOffer(offer)) throw new Error('免费选卡不是本次自动出售松果触发的奖励');
      const slot = message.slot, card = offer.slots[slot];
      if (!Number.isInteger(slot) || !card || card.id !== message.expectedId ||
          message.expectedPrice !== 0 || mergeRisk(ctx, card.id) ||
          rewardTraitRank(card.id) === null ||
          ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) {
        throw new Error('松果选卡已变化、特质不可核验、可能合成旧干员或手牌区已满');
      }
      const before = ctx.units, beforeItems = ctx.items, funds = ctx.p.funds;
      pendingReward = null; // Do not allow a duplicate select if ACK/push is ambiguous.
      const ok = await actions.reward(slot);
      if (ok !== true) throw new Error('松果免费选卡被游戏拒绝，不能自动重试');
      const pushed = await waitFor(s => !s?.match?.private?.shop?.rewardOffer?.slots?.length &&
        [...(s?.match?.private?.hand || []), ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(x => x?.kind === 'chess' && x.id === card.id && !before.has(x.uid)));
      if (!pushed) throw new Error('松果选卡可能已执行，但库存或奖励回执未确认；不会再次选择');
      const after = context();
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (after.identity !== ctx.identity || after.p.funds < funds || after.p.shop.rewardOffer?.slots?.length ||
          fresh.length !== 1 || fresh[0][1].id !== card.id ||
          [...before].some(([uid, old]) => after.units.get(uid)?.id !== old.id) ||
          after.items.size !== beforeItems.size ||
          [...beforeItems].some(([uid, it]) => after.items.get(uid)?.id !== it.id ||
            after.items.get(uid)?.area !== it.area ||
            after.items.get(uid)?.carrierUid !== it.carrierUid)) {
        throw new Error('松果免费选卡的 UID、资金或道具状态无法核对；不会出售');
      }
      const [uid, unit] = fresh[0];
      ledger.set(uid, { ...unit, identity: ctx.identity, protected: proof.manual===true || bases(message.keep).has(unit.base) || placementProtected.has(uid) || unit.area==='board' });
      return { uid, id: unit.id };
    }
    async function pickFlametailMergeReward(message) {
      const proof = pendingReward;
      const ctx = context({ allowReward: true });
      const offer = ctx.p.shop.rewardOffer;
      if (!['flametail_merge','packaging_merge','keep_merge'].includes(proof?.kind) || proof.identity !== ctx.identity ||
          !(proof.kind!=='flametail_merge' ? isPackagingMergeOffer(offer,chess,ctx.p.shop.level) : flametailMergeOffer(offer)) || proof.stamp !== stampOffer(offer)) {
        throw new Error('晋升奖励没有本次自动交易产生的独立合成证明；禁止自动选卡');
      }
      const slot = message.slot, card = offer.slots[slot];
      if (!Number.isInteger(slot) || !card || card.id !== message.expectedId ||
          message.expectedPrice !== 0 || !safeMergeCard(ctx, card.id, message.keep)) {
        throw new Error('合成晋升奖励已变化、特质不可核验或可能合成旧干员');
      }
      const before = ctx.units, beforeItems = ctx.items, funds = ctx.p.funds;
      pendingReward = null; // Single-use proof is burned BEFORE sending a potentially ambiguous request.
      const ok = await actions.reward(slot);
      if (ok !== true) throw new Error('合成晋升奖励被游戏拒绝；不会重试');
      const pushed = await waitFor(s => !s?.match?.private?.shop?.rewardOffer?.slots?.length &&
        [...(s?.match?.private?.hand || []), ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(x => x?.kind === 'chess' && x.id === card.id && !before.has(x.uid)));
      if (!pushed) throw new Error('合成晋升奖励可能已选择，但 UID 回执未确认；不会重试');
      const after = context();
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (after.identity !== ctx.identity || after.p.funds < funds || after.p.shop.rewardOffer?.slots?.length ||
          fresh.length !== 1 || fresh[0][1].id !== card.id || fresh[0][1].golden || fresh[0][1].equipped!==0 ||
          [...before].some(([uid, old]) => !sameUnitWithPlacement(old,after.units.get(uid))) ||
          after.items.size !== beforeItems.size ||
          [...beforeItems].some(([uid, it]) => after.items.get(uid)?.id !== it.id ||
            after.items.get(uid)?.area !== it.area ||
            after.items.get(uid)?.carrierUid !== it.carrierUid)) {
        throw new Error('合成晋升奖励 UID、资金或旧库存变化无法核对；不会出售');
      }
      const [uid, unit] = fresh[0];
      ledger.set(uid, { ...unit, identity: ctx.identity, surplusGift:proof.kind==='flametail_merge',
        protected: proof.manual===true || (proof.kind!=='flametail_merge' && bases(message.keep).has(unit.base)) || placementProtected.has(uid) || unit.area==='board' });
      return { uid, id: unit.id };
    }
    async function sell(message) {
      const uid = message.uid;
      if (!Number.isInteger(uid)) throw new Error('出售 UID 无效');
      observePlacement();
      if(placementProtected.has(uid))return {uid,cancelled:'placement'};
      const entry = ledger.get(uid);
      if (!entry) throw new Error('该 UID 并非插件本次核验的买入、选卡或包装赠员，禁止出售');
      const proof=pendingReward;
      const drain=message.expectedSale?.pendingMergeStamp!=null;
      const ctx = context({allowReward:drain});
      if(drain && (proof?.kind!=='flametail_merge' || proof.identity!==ctx.identity ||
        !proof.drainUids?.includes(uid) || proof.stamp!==stampOffer(ctx.p.shop.rewardOffer) ||
        proof.stamp!==message.expectedSale.pendingMergeStamp || !flametailMergeOffer(ctx.p.shop.rewardOffer) ||
        entry.id===PINECONE))throw new Error('腾位出售缺少本次焰尾合成证明或新UID授权');
      const now = ctx.units.get(uid);
      if (ctx.identity !== entry.identity || !now || now.id !== entry.id || now.base !== entry.base) {
        throw new Error('待售 UID 或对局与购买记录不一致');
      }
      if(now.id===entry.id && now.base===entry.base && now.equipped===entry.equipped &&
        now.area!==entry.area && compatiblePlacementArea(now.area,entry.area)){
        placementProtected.add(uid);ledger.delete(uid);return {uid,cancelled:'placement'};
      }
      if(now.area==='board'){placementProtected.add(uid);ledger.delete(uid);return {uid,cancelled:'placement'};}
      const saleBefore=tradeSnapshot(ctx);
      if(!matchesSaleIntent(saleBefore,uid,message.expectedSale) || now.area!==entry.area || now.equipped!==0)
        throw new Error('待售干员或完整库存已偏离本次批准快照，未发送出售');
      if (entry.protected || (bases(message.keep).has(entry.base) &&
        !(entry.surplusGift===true && canSellSurplusGift(saleBefore,uid,message,chess)))) throw new Error('命中保留数量目标，禁止出售');
      if (pendingReward && !drain) throw new Error('上一笔奖励尚未核对；禁止继续出售');
      const ok = await actions.sell(uid);
      if (ok !== true) throw new Error('游戏服务器拒绝出售');
      ledger.delete(uid); // never retry an acknowledged sale without fresh UID evidence
      const vanished=await waitFor(s=>![...(s?.match?.private?.hand || []),...(s?.match?.private?.board || []),...(s?.match?.private?.temp || [])].some(piece=>piece?.kind==='chess' && piece.uid===uid));
      if(!vanished)throw new Error('出售已确认但目标 UID 尚未消失；不重试');
      const saleAfter=context({allowReward:true});
      const packaging=(drain ? auditPendingMergeSale : auditPackagingSale)(saleBefore,tradeSnapshot(saleAfter),uid,{chess,gameItems:itemData});
      if(!packaging.ok)throw new Error(packaging.reason);
      // Audit is the authority, never appearance alone. Unknown old merge ingredients stay protected.
      const disposition=packagingGiftDisposition(packaging,saleBefore,{keep:bases(message.keep),
        authorizedUids:[...ledger].filter(([id,entry])=>entry.identity===ctx.identity && entry.equipped===0 &&
          sameUnitWithPlacement(entry,ctx.units.get(id))).map(([id])=>id),protectedUids:[...placementProtected,
          ...[...ledger].filter(([,entry])=>entry.protected).map(([id])=>id)]});
      const keptGiftUids=new Set(disposition.kept.map(gift=>gift.uid));
      for(const gift of packaging.packagingGifts || []){
        ledger.set(gift.uid,{...saleAfter.units.get(gift.uid),identity:ctx.identity,
          packagingGift:true,surplusGift:false,protected:keptGiftUids.has(gift.uid)});
      }
      for(const [oldUid] of ctx.units)if(!saleAfter.units.has(oldUid))ledger.delete(oldUid);
      if(drain){
        proof.drainUids=proof.drainUids.filter(id=>saleAfter.units.has(id));
        proof.drainUids.push(...disposition.queued.map(gift=>gift.uid));
      }
      // Proven refill only updates location on an EXISTING authorization, never creates one.
      for(const refilledUid of packaging.refilledUids || []){
        const saved=ledger.get(refilledUid), moved=saleAfter.units.get(refilledUid);
        if(saved && moved && saved.identity===saleAfter.identity)saved.area=moved.area;
      }
      if(packaging.packagingReward){
        if(now.id===PINECONE)throw new Error('松果奖励与包装合成同时出现，暂不自动选卡');
        pendingReward={kind:'packaging_merge',identity:ctx.identity,stamp:stampOffer(saleAfter.p.shop.rewardOffer)};
        for(const [oldUid] of ctx.units)if(!saleAfter.units.has(oldUid))ledger.delete(oldUid);
      } else if(!drain && saleAfter.p.shop.rewardOffer?.slots?.length && now.id!==PINECONE){
        throw new Error('出售后奖励来源无法核验，禁止自动领取');
      }
      if (now.id === PINECONE) {
        const updated = await waitFor(s => ![...(s?.match?.private?.hand || []),
          ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(piece => piece?.kind === 'chess' && piece.uid === uid) &&
          s?.match?.private?.shop?.rewardOffer?.slots?.length > 0);
        if (!updated) throw new Error('松果售出可能已生效，但免费特殊招募未确认；不会再次出售');
        const after = context({ allowReward: true });
        const offer = after.p.shop.rewardOffer;
        if (after.identity !== ctx.identity || !pineconeOffer(offer) || after.units.has(uid) ||
            [...ctx.units].some(([id]) => id !== uid && !after.units.has(id))) {
          throw new Error('松果出售后奖励来源或库存无法核对；不会自动选卡');
        }
        pendingReward = { kind: 'pinecone', identity: ctx.identity, stamp: stampOffer(offer) };
      }
      return { uid };
    }
    const preparedRounds=new Set();
    async function prepareRound(message){
      if(typeof actions.ready!=='function')throw new Error('本服不提供准备接口');
      const ctx=context(),s=store.get(),round=s.match.public.round;
      if(ctx.identity!==message.identity || JSON.stringify(view().match.private)!==message.stamp ||
        !(message.maximumFunds===null || Number.isSafeInteger(message.maximumFunds)&&message.maximumFunds>=0) ||
        typeof message.skipTenth!=='boolean' || message.maximumFunds!==null && ctx.p.funds>message.maximumFunds ||
        message.skipTenth && round%10===0 || !Number.isInteger(round) || round<1 || ctx.p.temp.some(Boolean) || ctx.p.canReady===false || pendingReward)
        throw new Error('准备前身份、资金、回合、奖励或库存变化；未发送准备');
      if(preparedRounds.has(ctx.identity))throw new Error('本回合准备已尝试，不重复发送');
      preparedRounds.add(ctx.identity);if(preparedRounds.size>128)preparedRounds.delete(preparedRounds.values().next().value);
      if(await actions.ready(true)!==true)throw new Error('准备请求未确认，可能已生效；不重试');
      const confirmed=await waitFor(raw=>raw?.room?.code===s.room.code && raw?.me?.playerId===s.me.playerId &&
        (raw?.match?.private?.ready===true || ['COMBAT','SETTLE','BATTLE','POST'].includes(raw?.match?.public?.phase)));
      if(!confirmed)throw new Error('准备回执已收到，但状态未确认；不重试');
      return {prepared:true};
    }
    let manualEnabled=false,manualInFlight=false,manualMonitor=false;
    let manualSerial=0,manualChain=Promise.resolve();
    const manualWaiters=new Map();
    function manualAsk(type,fields){
      const reply=type==='manual.begin'?'manual.grant':'manual.release';
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{manualWaiters.delete(fields.rid);reject(new Error('手动操作协调超时；不自动重试'));},45000);
        manualWaiters.set(fields.rid,{reply,finish:msg=>{clearTimeout(timer);manualWaiters.delete(fields.rid);if(msg.ok===true)resolve(msg);else reject(new Error(msg.reason || '手动操作未能核对'));}});
        send(type,fields);
      });
    }
    async function runManual(type,fields,extra){
      if(disposed)throw new Error('工作台已关闭，请重新操作');
      if(!manualEnabled)return originalRequest.call(nativeNet,type,fields,...extra);
      const rid=`${nonce}:${++manualSerial}`;
      let granted=false,completionSent=false,beforeStamp='';
      manualMonitor=true;
      try{
        const gate=await manualAsk('manual.begin',{rid,action:type,fields});
        if(gate.watch===false)return await originalRequest.call(nativeNet,type,fields,...extra);
        granted=true;manualInFlight=true;
        const before=context();beforeStamp=JSON.stringify(view().match.private);
        if(beforeStamp!==gate.beforeStamp || busy || pendingReward)throw new Error('手动操作前状态或其他请求发生变化；未发送本次请求');
        const missing=type==='g.sell'?!before.units.has(fields.uid):!before.items.has(fields.itemUid)||!before.units.has(fields.targetUid);
        let result=null;
        if(!missing){
          result=await originalRequest.call(nativeNet,type,fields,...extra);
          const changed=await waitFor(raw=>{
            const p=raw?.match?.private;if(!p)return false;
            const pieces=[...(p.hand || []),...(p.board || []),...(p.temp || [])];
            return type==='g.sell'?!pieces.some(piece=>piece?.kind==='chess'&&piece.uid===fields.uid):
              ![...(p.hand || []),...(p.temp || [])].some(piece=>piece?.kind==='item'&&piece.uid===fields.itemUid);
          });
          if(!changed)throw new Error('服务器已回执，但手动操作库存未确认');
        }
        const after=context({allowReward:true});
        if(after.identity!==before.identity)throw new Error('手动操作期间还有其他交易或对局变化');
        if(type==='g.sell'&&!missing){
          ledger.delete(fields.uid);
          const offer=after.p.shop.rewardOffer;
          if(offer?.slots?.length){
            if(before.units.get(fields.uid)?.id===PINECONE && pineconeOffer(offer))pendingReward={kind:'pinecone',identity:before.identity,stamp:stampOffer(offer),manual:true};
            else if(isPackagingMergeOffer(offer,chess,after.p.shop.level))pendingReward={kind:'packaging_merge',identity:before.identity,stamp:stampOffer(offer),manual:true};
          }
        }
        if(type==='g.equip'&&!missing){ledger.delete(fields.targetUid);coinLedger.delete(fields.itemUid);placementProtected.add(fields.targetUid);}
        const afterStamp=JSON.stringify(view().match.private);
        manualInFlight=false;
        send('snapshot',{state:view()});
        completionSent=true;
        await manualAsk('manual.complete',{rid,action:type,fields,beforeStamp,afterStamp,ok:true,cancelled:missing});
        return result;
      }catch(error){
        manualInFlight=false;
        if(granted&&!completionSent&&!disposed){
          send('snapshot',{state:view()});
          completionSent=true;
          await manualAsk('manual.complete',{rid,action:type,fields,beforeStamp,ok:false,reason:String(error?.message || error).slice(0,180)}).catch(()=>{});
        }
        throw error;
      }finally{manualInFlight=false;manualMonitor=false;}
    }
    let nativeNet=null,originalRequest=null,requestBeforeHook=null,nativeHook=null;
    try{
      nativeNet=sp?.net || (await import(new URL('js/net.js',root))).net;
      if(disposed)return;
      if(!nativeNet || typeof nativeNet.request!=='function')throw new Error('未找到原生请求接口');
      requestBeforeHook=nativeNet.request;
      originalRequest=function(type,fields={},...extra){return roundTrades.track(type,fields,()=>requestBeforeHook.call(this,type,fields,...extra));};
      nativeHook=function(type,fields={},...extra){
        // Own intent is marked only during the synchronous call into actions/net.request.
        // A long-lived async flag would accidentally hide concurrent native clicks.
        if(ownIntent)return originalRequest.call(this,type,fields,...extra);
        if(['g.sell','g.equip'].includes(type) && manualEnabled){
          const allowed=type==='g.sell'?['uid']:['itemUid','targetUid','replaceUid'];
          const uid=value=>Number.isSafeInteger(value)&&value>=0;
          if(!fields || typeof fields!=='object' || Object.keys(fields).some(key=>!allowed.includes(key)) ||
            (type==='g.sell'?!uid(fields.uid):!uid(fields.itemUid)||!uid(fields.targetUid)||fields.replaceUid!=null&&!uid(fields.replaceUid)))return Promise.reject(new Error('手动操作参数不兼容，未发送请求'));
          const copied={...fields};
          const job=manualChain.then(()=>runManual(type,copied,extra));
          manualChain=job.catch(()=>{});return job;
        }
        if(manualMonitor && typeof type==='string' && type.startsWith('g.') && !['g.move','g.emote','g.chat'].includes(type))return Promise.reject(new Error('手动出售或装备核对中，请稍后再执行其他操作'));
        return originalRequest.call(this,type,fields,...extra);
      };
      nativeNet.request=nativeHook;
      if(nativeNet.request!==nativeHook)throw new Error('原生请求接口不可监测');
      manualSupported=true;roundTrades.setCountsSupported(true);
      restoreManual=()=>{
        manualEnabled=false;manualSupported=false;
        if(nativeNet.request===nativeHook)nativeNet.request=requestBeforeHook;
        for(const waiter of [...manualWaiters.values()])waiter.finish({ok:false,reason:'工作台已关闭，未确认请求不会重试'});
      };
    }catch(error){manualSupported=false;console.warn('[wei] 手动操作协调不可用，仍保留未知变化停机保护',error);}

    handleMessage = event => {
      const msg = event.data;
      if (event.source !== window || event.origin !== location.origin ||
          msg?.channel !== CHANNEL || msg.side !== 'ui' || msg.nonce !== nonce || msg.version !== cfg.version) return;
      if (msg.type === 'dispose') { ownBridge.dispose(); return; }
      if (msg.type === 'snapshot-request') { send('snapshot', { state: view() }); return; }
      if(msg.type==='manual.policy'){manualEnabled=msg.enabled===true && manualSupported;return;}
      if(['manual.grant','manual.release'].includes(msg.type)){
        const waiter=manualWaiters.get(msg.rid);if(waiter?.reply===msg.type)waiter.finish(msg);return;
      }
      if (!['buy','buy-item','sell','refresh','coin','use-item','reward','merge-reward','prepare'].includes(msg.type) || typeof msg.rid !== 'string' || msg.rid.length > 100) return;
      if (busy || manualInFlight) { reject(msg.rid, '另一笔交易尚未结束'); return; }
      busy = true;
      (msg.type === 'prepare' ? prepareRound(msg) : msg.type === 'buy' ? buy(msg) : msg.type === 'buy-item' ? buyItem(msg) : msg.type === 'sell' ? sell(msg) :
        msg.type === 'coin' ? useCoin(msg) : msg.type === 'use-item' ? useItem(msg) : msg.type === 'reward' ? pickReward(msg) :
        msg.type === 'merge-reward' ? pickFlametailMergeReward(msg) : refresh(msg)).then(
        result => send('response', { rid: msg.rid, ok: true, result }),
        error => reject(msg.rid, error?.message || String(error)),
      ).finally(() => { busy = false; });
    };
    window.addEventListener('message', handleMessage);
    observePlacement();
    offStore = store.subscribe(raw => {
      roundTrades.observe(raw);
      observePlacement();
      // Any manual selection/changed offer burns its typed, one-use proof, even
      // if a later unrelated offer happens to show exactly the same cards.
      if (pendingReward) {
        const offer = raw?.match?.private?.shop?.rewardOffer;
        if (!(pendingReward.kind === 'pinecone' ? pineconeOffer(offer) :
              (pendingReward.kind === 'flametail_merge' && flametailMergeOffer(offer) ||
                ['packaging_merge','keep_merge'].includes(pendingReward.kind) && isPackagingMergeOffer(offer,chess,raw?.match?.private?.shop?.level))) ||
            pendingReward.stamp !== stampOffer(offer)) pendingReward = null;
      }
      send('snapshot', { state: view(raw) });
    });
    send('snapshot', { state: view() });
  }
  boot().catch(error => {
    send('bridge-error', { reason: error?.message || String(error) });
    globalThis.__weiMainBridge?.dispose?.();
  });
})();
