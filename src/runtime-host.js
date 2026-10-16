import { createQuickDock, QUICK_CHIBI_ICON } from './quick-dock.js';
// Runs in the clicked tab's isolated world. UI stays in the extension iframe.
import * as Model from './model.js';
import { createAutoController } from './engine/auto-controller.js';
import { createAutoReady } from './engine/auto-ready.js';
import { inspectMatch, baseId } from './engine/auto-policy.js';
import { inspectInventory, countTrackedItemCopies } from './engine/inventory.js';
import { createSpuiTransport } from './engine/transport.js';
import { createAuditLog } from './engine/audit-log.js';
import { buildCatalogue, diySlotLabels, withDiyLabels } from './engine/catalogue.js';
import { resolveGamePlan, tradePlanKey, isLiveItemToggle, isLiveItemPause } from './engine/plan-adapter.js';
import { createRecency } from './engine/item-policy.js';
import { createGameIconIndex, operatorGameIcon, itemGameIcon } from './engine/game-icons.js';

(() => {
  const cfg = globalThis.__weiExtensionConfig;
  delete globalThis.__weiExtensionConfig;
  if (!cfg || cfg.version !== BUILD_VERSION || window.top !== window) return;
  const HOST_ID = 'wei-cardkeeper-host-v1', CHANNEL = 'wei-cardkeeper.ui.v1';
  const existing = document.getElementById(HOST_ID);
  if (existing) { existing.dispatchEvent(new CustomEvent('wei:toggle')); return; }
  if (document.querySelector('.spui, .spui-reopen, [data-spui-extension]')) return;
  const host = document.createElement('div'); host.id = HOST_ID;
  host.dataset.weiVersion = BUILD_VERSION; host.dataset.spuiExtension = 'wei';
  host.style.cssText = 'all:initial;position:fixed;left:0;top:0;bottom:0;z-index:2147483646;width:400px;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = ':host{color-scheme:dark}iframe{display:block;width:100%;height:100%;border:0;pointer-events:auto;box-shadow:12px 0 40px #0005}.reopen{position:absolute;left:0;top:42%;display:flex;flex-direction:column;align-items:center;gap:8px;width:43px;padding:10px 6px;border:1px solid #2a3442;border-left:0;border-radius:0 12px 12px 0;background:linear-gradient(180deg,#1b2330,#10151c);color:#e7edf4;box-shadow:6px 8px 24px #0007;cursor:pointer;pointer-events:auto}.reopen:focus-visible{outline:2px solid #b9eac5;outline-offset:3px}.reopen img{width:28px;height:28px;object-fit:cover;border-radius:7px}.reopen span{font:10px Microsoft YaHei,sans-serif;writing-mode:vertical-rl;letter-spacing:2px}[hidden]{display:none!important}';
  const frame = document.createElement('iframe'); frame.title = '卫戍协议拿牌器 · 左侧工作台';
  const token = cfg.uiToken;
  if(typeof token!=='string' || !/^[a-f0-9]{32}$/.test(token))return;
  const url = new URL(chrome.runtime.getURL('panel.html')); url.searchParams.set('server', location.origin);
  url.hash = new URLSearchParams({ token }).toString(); frame.src = url.href;
  const extensionOrigin = `${url.protocol}//${url.host}`;
  const reopen = document.createElement('button'); reopen.className='reopen'; reopen.type = 'button'; reopen.setAttribute('aria-label', '展开卫戍协议拿牌器'); reopen.hidden = true;
  const avatar = document.createElement('img'); avatar.src = QUICK_CHIBI_ICON; avatar.alt = '';
  const label = document.createElement('span'); label.textContent = '工作台';
  reopen.append(avatar, label); shadow.append(style, frame, reopen); document.documentElement.append(host);
  const layout = document.createElement('style'); layout.dataset.weiLayout = 'v1'; document.documentElement.append(layout);
  let expanded = true, width = 400, closed = false, uiReady = false;
  let plan = Model.normalizePlan(null), chess = null, bonds = {}, garrisons = null, gameItems = null, catalogue = null, diyNames = null, diyOperators = null, diyLabelKey = '';
  let gameIcons = createGameIconIndex(null, cfg.root), iconRevision = 0, iconRequest = null, iconView = null;
  let transport = null, controller = null, auditLog = null, auditReady = false, healthError = '';
  let offState = null, clearUntil = 0;
  const recency = createRecency(); // 最近获得/上场的干员顺序，供道具自动使用选目标
  const pendingCounts = new Map();
  let matchSyncPending = false;
  let live = { state: 'loading', message: cfg.root ? '正在读取当前网页与运行自检；自动交易未启动' : `${typeof cfg.reason === 'string' && cfg.reason ? cfg.reason.slice(0, 160) : '此页未发现兼容游戏入口'}；可整理名单，不会交易`, running: false, starting: false, bought: 0, sold: 0, kept: 0, refreshed: 0 };
  let readySettingsStamp='',readyController=null,readyLive={readyRunning:false,readyBusy:false,readyMessage:'已关闭'};
  const quickRequests=new Map();
  const quickKey=`wei.workbench.quickdock.v1:${location.origin}`;
  const quickDock=createQuickDock({parent:shadow,
    storage:{async get(){return (await chrome.storage.local.get(quickKey))[quickKey];},async set(value){await chrome.storage.local.set({[quickKey]:value});}},
    onOpenPanel(){expanded=true;update();},
    onAction(command,id){
      if(command==='ready' && readyController?.running){readyController.stop();return Promise.resolve({message:'自动准备已关闭'});}
      // Stop is immediate even if the settings iframe or another shortcut ACK is slow.
      if(command==='auto' && (controller?.running || controller?.starting)){
        controller.stop('已通过悬浮开关停止');emit();return Promise.resolve({message:'已停止'});
      }
      if(!uiReady || closed)return Promise.reject(new Error('工作台尚未就绪'));
      if(quickRequests.size)return Promise.reject(new Error('上一项设置尚未确认'));
      const rid=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
      return new Promise((resolve,reject)=>{
        const timer=setTimeout(()=>{quickRequests.delete(rid);reject(new Error('确认超时，请核对当前开关状态'));},12000);
        quickRequests.set(rid,{resolve,reject,timer});post('quick.action',{rid,command,id});
      });
    }
  });
  function quickState(runtime){
    const body=gameItems?.items || gameItems, rank=new Map(plan.itemIconOrder.map((id,index)=>[id,index]));
    const items=[...plan.items].sort((a,b)=>(rank.get(a.id) ?? 999)-(rank.get(b.id) ?? 999)).map(item=>{
      const held=runtime.itemOwnedCounts?.[item.id], used=plan.itemSession.used[item.id] || 0;
      const full=item.capPaused || item.limit!=null && used>=item.limit || item.ownedTarget!=null && Number.isInteger(held) && held>=item.ownedTarget;
      const status=!item.enabled && !item.capPaused ? 'disabled' : full?'full':'enabled';
      const real=runtime.itemMatches?.[item.id] || item.id;
      const rec=Array.isArray(body) ? body.find(rec=>rec?.id===real) : body?.[real];
      return {id:item.id,name:Model.ITEMS.find(rec=>rec.id===item.id)?.name || item.name || item.id,
        enabled:item.enabled===true,status,iconUrl:itemGameIcon(gameIcons,rec || {id:real})};
    });
    return {...runtime,autoReady:plan.autoReady,running:controller?.running ?? runtime.running,starting:controller?.starting ?? runtime.starting,uiReady,paused:plan.itemBuyingPaused===true,items};
  }
  function post(type, extra = {}) { if (!closed && uiReady) frame.contentWindow?.postMessage({channel:CHANNEL,token,type,...extra},extensionOrigin); }
  // 自选编队 picks are fixed per match by the server (match.private.diy); names come from the game's backups data.
  function diyContext() { return { picks: transport?.read()?.match?.private?.diy || null, names: diyNames }; }
  function resolved() { return chess ? resolveGamePlan(plan, chess, bonds, gameItems, diyContext()) : { plan:{buy:[],keep:[],excludedBuy:[],items:[],useItems:[],keepRules:{}}, matches:{},itemMatches:{},useNotes:{},pending:[],issues:[],skipped:[] }; }
  function info() {
    const state = transport?.read(), check = chess ? inspectMatch(state, chess) : {ok:false,reason:'尚未连接兼容对局'};
    const mapping = resolved();
    const inventory = check.ok ? check : chess && state?.connection?.status === 'online' && state?.room?.inMatch
      ? inspectInventory(state?.match?.private, chess) : null;
    const keepCounts = inventory?.ok && inventory.ownedCopies ? Object.fromEntries(plan.keep.map(id => {
      const real = mapping.matches[id] || baseId(id, chess);
      return [id, real ? inventory.ownedCopies[real] || 0 : null];
    })) : null;
    // Live item UIDs only: cumulative purchase totals and permanent effects are not current holdings.
    const itemOwnedCounts = countTrackedItemCopies(inventory,plan.items,mapping.itemMatches,
      Model.ITEMS.map(item => item.id),gameItems);
    let loadedVersion='不可用',extensionId='不可用';try{loadedVersion=chrome.runtime.getManifest().version;extensionId=chrome.runtime.id.slice(-8);}catch{}
    const randomAvailable=typeof globalThis.crypto?.getRandomValues==='function';
    return {...live,...readyLive,roundStats:state?.roundStats || null,autoReady:plan.autoReady,readyReady:!!readyController&&auditReady&&!healthError&&state?.readySupported===true,ready:!matchSyncPending&&!!controller&&auditReady&&!healthError&&randomAvailable&&loadedVersion===BUILD_VERSION,version:BUILD_VERSION,phase:state?.match?.public?.phase || '',round:state?.match?.public?.round,funds:state?.match?.private?.funds,
      eligible:check.ok,eligibility:check.reason || '本人整备期，可手动启动',matches:mapping.matches,keepCounts,itemOwnedCounts,itemMatches:mapping.itemMatches,useNotes:mapping.useNotes,pending:mapping.pending,issues:mapping.issues,skipped:mapping.skipped,
      health:[`脚本 v${BUILD_VERSION} · 已加载扩展 v${loadedVersion} / ${extensionId} · 服务器 ${location.host}`,`安全随机字节 ${randomAvailable ? '可用' : '不可用，拒绝交易'} · ${isSecureContext ? '安全上下文' : '普通 HTTP 上下文'}`,healthError || (transport ? '网页桥接与扩展后台已连接' : '未连接网页交易接口'),auditReady ? '审计日志可用；运行锁在手动启动时获取' : '审计日志尚未就绪',(garrisons ? '特质图鉴已读取' : '特质图鉴不可用：赠币外的免费奖励需手动选择'),gameItems ? '本服道具数据已读取，可按唯一名称识别图鉴外道具' : '本服道具数据不可用：图鉴外道具维持待识别，已知静态 ID 仍需商店精确匹配',check.reason || '本人整备、库存与 UID 可核对',mapping.issues.length ? mapping.issues.join('；') : mapping.pending.length ? `待识别 ${mapping.pending.length} 项，仅这些条目不自动交易；${mapping.skipped.slice(0,3).join('；')}${mapping.pending.length>3?'；其余见名单':''}` : '已启用的名单可按本服图鉴匹配'],
      gameKeys:gameKeys(),logCount:auditLog?.entries.length || 0,entries:(auditLog?.entries || []).slice(-60)};
  }
  // 自选 slot names for the list: this match's picks, else the page's saved 自选编队 setting (sp.pref.diy).
  function storedDiyPicks() { try { const raw=JSON.parse(localStorage.getItem('sp.pref.diy') || 'null'); return raw&&typeof raw.picks==='object'&&!Array.isArray(raw.picks)?raw.picks:null; } catch { return null; } }
  function liveCatalogue() {
    if (!catalogue) return null;
    const priv = transport?.read()?.match?.private;
    const labels = diySlotLabels(chess, { matchPicks: priv ? (priv.diy && typeof priv.diy === 'object' ? priv.diy : {}) : null,
      storedPicks: priv ? null : storedDiyPicks(), operators: diyOperators });
    const key = JSON.stringify([labels, iconRevision]);
    if (iconView?.key === key) return iconView;
    const view = withDiyLabels(catalogue, labels, bonds);
    iconView = { key, catalogue: { ...view, operators: view.operators.map(op => ({ ...op,
      iconUrl: operatorGameIcon(gameIcons, op.diy ? op : chess[op.id] || op) })) } };
    return iconView;
  }
  // 道具选择弹窗用：本服 items.json 的基础道具（价格 / 效果说明），只在图鉴更新时随消息发送一次。
  function itemShelf() {
    const body = gameItems?.items || gameItems; if (!body || typeof body !== 'object') return null;
    const out = [];
    for (const rec of (Array.isArray(body) ? body : Object.values(body)).slice(0, 4096)) {
      if (!rec || rec.isGolden === true || typeof rec.id !== 'string' || !/^[A-Za-z0-9_:-]{3,100}$/.test(rec.id)) continue;
      const name = typeof rec.name === 'string' ? rec.name.trim().slice(0, 40) : '', tier = Number(rec.tier);
      if (!name || !Number.isInteger(tier) || tier < 1 || tier > 6) continue;
      out.push({ id: rec.id, name, tier, price: Number.isSafeInteger(rec.price) && rec.price >= 0 && rec.price < 1000 ? rec.price : null,
        desc: typeof rec.desc === 'string' ? rec.desc.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 160) : '',
        shop: rec.shopExcluded !== true && rec.hideInShop !== true, iconUrl: itemGameIcon(gameIcons, rec) });
      if (out.length >= 512) break;
    }
    return out;
  }
  // 图片清单独立加载；资源缺失、超时都不影响名单或交易接口的就绪状态。
  async function loadGameIcons(root) {
    const abort = new AbortController(); iconRequest = abort;
    const timer = setTimeout(() => abort.abort(), 8000);
    try {
      const response = await fetch(new URL('data/assets.json', root), { cache: 'no-cache', signal: abort.signal });
      if (!response.ok || closed) return;
      const manifest = await response.json();
      if (closed) return;
      gameIcons = createGameIconIndex(manifest, root);
      iconRevision += 1; emit(true);
    } catch { /* 离线、旧服或缺失素材时保留文字图标，不阻断工作台。 */ }
    finally { clearTimeout(timer); if (iconRequest === abort) iconRequest = null; }
  }
  function emit(includeCatalogue = false) {
    const view = liveCatalogue(), changed = !!view && view.key !== diyLabelKey;
    if (view && (includeCatalogue || changed)) diyLabelKey = view.key;
    const runtime=info();quickDock.update(quickState(runtime));
    post('runtime', {info:{...runtime,...(includeCatalogue || changed ? {itemShelf: itemShelf()} : {})},...((includeCatalogue || changed) && view ? {catalogue: view.catalogue} : {})});
  }
  function update() {
    const actual = Math.min(width, Math.max(260, innerWidth - 20)); host.style.width = `${actual}px`;
    frame.hidden = !expanded; reopen.hidden = expanded;
    layout.textContent = expanded ? `.app-root{left:${actual}px!important;right:0!important}#boot{left:${actual}px!important}` : '';
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  }
  function onResize() {
    const actual = Math.min(width, Math.max(260, innerWidth - 20)); host.style.width = `${actual}px`;
    layout.textContent = expanded ? `.app-root{left:${actual}px!important;right:0!important}#boot{left:${actual}px!important}` : '';
  }
  function close() {
    if (closed) return;
    readyController?.stop('工作台已关闭，自动准备停止');
    controller?.stop('工作台已关闭，自动倒转停止');
    for (const pending of pendingCounts.values()) {clearTimeout(pending.timer);pending.reject(new Error('工作台已关闭，购买次数未确认保存'));}
    pendingCounts.clear();
    window.postMessage({channel:'wei.runtime.v1',side:'ui',nonce:cfg.nonce,version:BUILD_VERSION,type:'dispose'},location.origin);
    for(const pending of quickRequests.values()){clearTimeout(pending.timer);pending.reject(new Error('工作台已关闭'));}quickRequests.clear();quickDock.destroy();
    closed = true; iconRequest?.abort(); offState?.(); transport?.dispose();
    window.removeEventListener('message', onMessage); window.removeEventListener('resize', onResize);
    window.removeEventListener('pagehide', close); window.removeEventListener('keydown', onHotkey, true);
    host.remove(); layout.remove(); window.dispatchEvent(new Event('resize'));
  }
  // Hand/board placement is accepted by the engine; financial/equipment/identity changes keep their state guards.
  // 启停快捷键：游戏画面有焦点时生效。停止在本页立即执行；启动交给工作台，与点“启动”按钮走同一套保存与自检校验。
  let lastHotkey = 0, lastClash = 0;
  function gameKeys() { try { return Model.normalizeGameKeys(JSON.parse(localStorage.getItem('sp.pref.settings') || 'null')?.keys); } catch { return Model.normalizeGameKeys(null); } }
  const editing = target => target instanceof Element && (target.isContentEditable || !!target.closest('input,textarea,select'));
  function onHotkey(event) {
    if (!event.isTrusted || !Model.matchesHotkey(plan.hotkey, event)) return;
    if (Model.hotkeyIsTyping(plan.hotkey) && (event.isComposing || editing(event.target))) return; // 正在输入框里打字
    const clash = Model.gameHotkeyConflict(plan.hotkey, gameKeys());
    if (clash) { // 游戏之后改成了同一个键：让给游戏，只提醒
      if (!event.repeat && Date.now() - lastClash > 5000) { lastClash = Date.now(); post('hotkey', {result:'conflict', key:Model.hotkeyLabel(plan.hotkey), action:clash}); }
      return;
    }
    event.preventDefault(); event.stopImmediatePropagation(); // 不让游戏重复处理扩展启停键
    if (event.repeat || Date.now() - lastHotkey < 350) return;
    lastHotkey = Date.now();
    const key = Model.hotkeyLabel(plan.hotkey);
    if (controller?.running || controller?.starting) { controller.stop(`已按快捷键 ${key} 停止自动倒转`); emit(); post('hotkey', {result:'stopped', key}); return; }
    post('hotkey', {result:'start', key});
  }
  function acceptPlan(raw, recordChanges = true, liveItemToggle = null, liveItemPause = false) {
    let next = Model.normalizePlan(raw);
    const liveToggle=(typeof liveItemToggle==='string' && isLiveItemToggle(plan,next,liveItemToggle)) ||
      (liveItemPause===true && isLiveItemPause(plan,next));
    if(liveToggle){
      const used={...next.itemSession.used};
      for(const [id,count] of Object.entries(plan.itemSession.used))used[id]=Math.max(used[id] || 0,count);
      next=Model.normalizePlan({...next,itemSession:{...next.itemSession,used}});
    }
    const changed = tradePlanKey(plan) !== tradePlanKey(next);
    // Settings are hot-swappable. Only game identity/state, storage or transaction evidence can stop a run.
    const previous = plan; plan = next;
    controller?.updatePlan();
    if (changed && auditReady && recordChanges) {
      for (const kind of ['buy','keep']) {
        const added = plan[kind].filter(id=>!previous[kind].includes(id)).length, removed=previous[kind].filter(id=>!plan[kind].includes(id)).length;
        if (added || removed) void auditLog.append({kind:'settings',summary:`${kind==='buy'?'买入':'保留'}名单：新增 ${added}，移除 ${removed}`}).catch(()=>{});
      }
    }
    emit();
  }
  async function syncObservedMatch(state) {
    if (!uiReady || matchSyncPending || !state) return;
    const result = Model.observeItemMatch(plan,state,location.origin);
    if (!result.changed) return;
    matchSyncPending = true;
    if (result.newMatch) controller?.stop('已识别新对局，清零本局次数后请手动启动');
    const epoch = plan.itemSession.epoch;
    const rid = Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
    const saved = new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pendingCounts.delete(rid);reject(new Error('新对局计数保存超时'));},12000);
      pendingCounts.set(rid,{resolve,reject,timer});
    });
    emit(); post('match.sync',{rid,state:{connection:state.connection,ui:state.ui,me:state.me,room:state.room,
      match:{public:state.match?.public,private:state.match?.private ? {hand:[],board:[],temp:[]} : null}},epoch});
    try {
      await saved;
      if(result.newMatch)live={...live,state:'idle',running:false,starting:false,bought:0,sold:0,kept:0,refreshed:0,message:'已识别新对局，本局已抓次数已清零；配置与启用状态保留，请手动启动'};
    } catch(error) { healthError=String(error.message);controller?.stop(healthError); }
    finally { matchSyncPending=false;emit(); }
    if(!healthError)void syncObservedMatch(transport?.read());
  }
  async function recordItemCount({kind,sourceId,realId,epoch}) {
    if (!uiReady) throw new Error('名单界面尚未就绪');
    // The receipt was sealed at transport send and the UID independently audited by both worlds.
    // Never reauthorize an already-completed buy against a newly edited rule or name mapping.
    if(kind!=='item' || typeof sourceId!=='string' || typeof realId!=='string' || !Number.isSafeInteger(epoch))
      throw new Error('已核对购买的计数凭据不完整');
    if(epoch!==plan.itemSession.epoch || !plan.items.some(item=>item.id===sourceId)){
      await auditLog.append({kind:'settings',summary:'在途道具购买已核对；条目已移除或计数周期已重置，仅保留交易记录，不恢复旧配置',meta:{sourceId,realId,epoch}});
      return {counted:false};
    }
    const count=(plan.itemSession.used[sourceId] || 0)+1;
    const result=Model.confirmPurchaseCount(plan,kind,sourceId,epoch,count);
    if(result.reason)throw new Error(result.reason);
    plan=Model.normalizePlan(result.plan);
    const rid=Array.from(crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('');
    const saved=new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pendingCounts.delete(rid);reject(new Error('界面保存超时'));},12000);
      pendingCounts.set(rid,{resolve,reject,timer});
    });
    emit();post('count.record',{rid,kind,sourceId,epoch,count});
    await saved;
    return {counted:plan.itemSession.epoch===epoch && plan.items.some(item=>item.id===sourceId)};
  }
  async function action(type) {
    if(type==='ready.stop'){readyController?.stop();return {ok:true};}
    if(type==='ready.toggle'){
      if(readyController?.running){readyController.stop();return {ok:true};}
      if(!readyController || !auditReady || healthError)throw new Error(healthError || '准备接口尚未就绪');
      await auditLog.append({kind:'ready_start',summary:'手动开启自动准备（无尽用）'});
      readyController.start();emit();return {ok:true};
    }
    if (type === 'auto.toggle') {
      if (controller?.running || controller?.starting) {controller.stop();return {ok:true};}
      if(readyController?.busy)throw new Error('正在提交准备，请等待核对完成');
      await syncObservedMatch(transport?.read());
      if(matchSyncPending)throw new Error('正在保存新对局状态，请稍后手动启动');
      if (!controller || !auditReady || healthError) throw new Error(healthError || '运行自检尚未通过，不能启动');
      if(typeof globalThis.crypto?.getRandomValues!=='function')throw new Error('安全随机字节不可用，不能交易');
      const mapping=resolved(); if(mapping.issues.length) throw new Error(mapping.issues.join('；'));
      const pendingStart=controller.start();emit();
      const started=await pendingStart;emit();
      if(!started) throw new Error(live.message || '未能启动');
      return {ok:true};
    }
    if (type === 'health.check') {
      if (!controller || !auditLog) {
        // 未连上游戏接口（例如打开工作台时游戏还没加载完）：请后台重新探测本页并重新打开工作台。
        const again = await chrome.runtime.sendMessage({type:'page.reconnect',clientVersion:BUILD_VERSION}).catch(error => ({ok:false,reason:error.message}));
        if (!again?.ok) throw new Error(again?.reason || healthError || '此页未连接兼容的游戏接口');
        return {ok:true};
      }
      const health=await chrome.runtime.sendMessage({type:'health.check',clientVersion:BUILD_VERSION});
      if (!health?.ok || health.version !== BUILD_VERSION) throw new Error(health?.reason || '后台版本不匹配');
      await auditLog.load();auditReady=true;healthError='';emit();return {ok:true};
    }
    if (!auditLog) throw new Error('此页没有已连接的日志服务');
    if(type === 'log.read') {await auditLog.load();emit();return {ok:true};}
    if(type === 'log.export') {const count=await auditLog.exportJSON();return {ok:true,count};}
    if(type === 'log.clear') {
      if(controller?.running || controller?.starting || controller?.busy) throw new Error('请先停止交易并等待在途指令完成');
      if(Date.now()>clearUntil) {clearUntil=Date.now()+4000;return {ok:true,confirm:true};}
      clearUntil=0;await auditLog.clear();emit();return {ok:true};
    }
    throw new Error('未知工作台操作');
  }
  function onMessage(event) {
    const data = event.data;
    if (event.source !== frame.contentWindow || event.origin !== extensionOrigin || !data || data.channel !== CHANNEL || data.token !== token) return;
    if(data.clientVersion !== BUILD_VERSION) return;
    if(data.type==='quick.open'){if(['auto','items','ready'].includes(data.kind))quickDock.show(data.kind);return;}
    if(data.type==='quick.done' && typeof data.rid==='string'){
      const pending=quickRequests.get(data.rid);if(!pending)return;
      quickRequests.delete(data.rid);clearTimeout(pending.timer);
      if(data.ok===true)pending.resolve({message:typeof data.message==='string'?data.message.slice(0,180):''});
      else pending.reject(new Error(typeof data.reason==='string'?data.reason.slice(0,180):'快捷操作未确认'));
      emit();return;
    }
    if(data.type==='ready.settings'){if(JSON.stringify(data.settings)===JSON.stringify(plan.autoReady))readySettingsStamp=JSON.stringify(plan.autoReady);return;}
    if (data.type === 'ui.ready') {uiReady=true;acceptPlan(data.plan, false);readySettingsStamp=JSON.stringify(plan.autoReady);emit(true);void syncObservedMatch(transport?.read());return;}
    if(data.type==='storage.error'){healthError='本地配置保存失败，已停止交易以保护计数';controller?.stop(healthError);readyController?.stop(healthError);emit();return;}
    if (data.type === 'plan') {acceptPlan(data.plan,true,data.liveItemToggle,data.liveItemPause);return;}
    if (data.type === 'count.saved' && typeof data.rid === 'string') {
      const pending=pendingCounts.get(data.rid);if(!pending)return;
      pendingCounts.delete(data.rid);clearTimeout(pending.timer);
      if(data.ok === true && data.plan) {acceptPlan(data.plan,false);pending.resolve();}
      else pending.reject(new Error(data.reason || '购买次数未能保存'));
      return;
    }
    if (data.type === 'collapse') { expanded = false; update(); return; }
    if (data.type === 'close') {close();return;}
    if (data.type === 'width' && [360,400,440].includes(data.width)) {width=data.width;update();return;}
    if (['auto.toggle','ready.toggle','ready.stop','health.check','log.read','log.export','log.clear'].includes(data.type) && typeof data.rid==='string' && /^[A-Za-z0-9_-]{1,100}$/.test(data.rid)) {
      void action(data.type).then(result=>post('reply',{rid:data.rid,...result}),error=>{if(data.type==='auto.toggle') {live={...live,state:'blocked',message:error.message};emit();}post('reply',{rid:data.rid,ok:false,reason:error.message});});
    }
  }
  async function init() {
    if(!cfg.root) {healthError=typeof cfg.reason==='string'&&cfg.reason?cfg.reason.slice(0,200):'此页未发现兼容游戏入口';live={...live,state:'blocked'};emit();return;}
    try {
      const root=new URL(cfg.root);if(root.origin!==location.origin) throw new Error('游戏来源不匹配');
      const [a,b,g,i,u]=await Promise.all([fetch(new URL('data/chess.json',root),{cache:'no-store'}),fetch(new URL('data/bonds.json',root),{cache:'no-store'}),fetch(new URL('data/garrisons.json',root),{cache:'no-store'}).catch(()=>null),fetch(new URL('data/items.json',root),{cache:'no-store'}).catch(()=>null),fetch(new URL('data/backups.json',root),{cache:'no-store'}).catch(()=>null)]);
      if(!a.ok || !b.ok) throw new Error('当前服务器图鉴请求失败');
      chess=await a.json();bonds=await b.json();
      garrisons=g&&g.ok?await g.json().catch(()=>null):null;
      gameItems=i&&i.ok?await i.json().catch(()=>null):null;
      const backups=u&&u.ok?await u.json().catch(()=>null):null, diyOps=backups?.diy?.operators;
      // Keep only charId → name of the operators a 自选 slot can hold; drop the rest of the large file.
      const diyEntries=diyOps&&typeof diyOps==='object'?Object.entries(diyOps).slice(0,512)
        .filter(([id,op])=>/^[A-Za-z0-9_]{3,80}$/.test(id)&&typeof op?.name==='string'&&op.name.length<=80):null;
      diyNames=diyEntries?Object.fromEntries(diyEntries.map(([id,op])=>[id,op.name])):null;
      diyOperators=diyEntries?Object.fromEntries(diyEntries.map(([id,op])=>[id,{name:op.name,bonds:Array.isArray(op.bonds)?op.bonds.filter(b=>typeof b==='string').slice(0,8):[]}])):null;
      if(!chess?.chess_char_4_19_a || !chess.chess_char_1_19_a || Object.keys(chess).length<20) throw new Error('当前服务器图鉴不兼容');
      if(closed) return;catalogue=buildCatalogue(chess,bonds);emit(true);
      void loadGameIcons(root);
      const health=await chrome.runtime.sendMessage({type:'health.check',clientVersion:BUILD_VERSION});
      if(!health?.ok || health.version!==BUILD_VERSION) throw new Error(health?.reason || '后台版本不匹配');
      transport=createSpuiTransport(cfg,()=>resolved().plan,chess);await transport.ready();if(closed) return;
      auditLog=createAuditLog({origin:location.origin,clientVersion:BUILD_VERSION,sendMessage:message=>chrome.runtime.sendMessage(message),onChange:()=>emit(),onError:error=>{healthError=`本地日志不可用：${error.message}`;controller?.stop(healthError);emit();}});
      await auditLog.load();if(closed)return;auditReady=true;
      controller=createAutoController({read:transport.read,subscribe:transport.subscribe,buy:transport.buy,buyItem:transport.buyItem,sell:transport.sell,refresh:transport.refresh,useCoin:transport.useCoin,useItem:transport.useItem,recency:recency.rank,reward:transport.reward,mergeReward:transport.mergeReward,acquireLock:transport.acquireLock,getPlan:()=>resolved().plan,chess,garrisons,gameItems,onRecordPurchase:recordItemCount,onStatus:status=>{transport.setManualEnabled(status.running===true);if(!status.running&&controller?.manualPending)readyController?.stop('手动操作尚未核对，自动准备已停止');live=status;label.textContent=status.running?'运行中':'工作台';emit();},onAudit:entry=>auditLog.append(entry)});
      readyController=createAutoReady({read:transport.read,
        getOptions:()=>({...plan.autoReady,epoch:plan.itemSession.epoch,confirmed:readySettingsStamp===JSON.stringify(plan.autoReady)}),
        available:()=>!closed&&uiReady&&auditReady&&!healthError&&!matchSyncPending&&chrome.runtime.getManifest().version===BUILD_VERSION,
        hold:()=>controller?.holdForReady(),unhold:()=>controller?.releaseReadyHold(),
        tradeBusy:()=>!!(controller?.busy||controller?.starting||controller?.manualPending),
        handoff:()=>controller?.stop('自动准备条件已满足，停止倒转并等待准备'),
        acquireLock:transport.acquireLock,prepare:transport.prepare,
        async claim(key){const storageKey=`wei.ready.attempts.v1:${location.origin}`;const saved=(await chrome.storage.local.get(storageKey))[storageKey];
          if(saved!==undefined && (!Array.isArray(saved)||saved.some(x=>typeof x!=='string')))throw new Error('准备记录格式无效');
          const entries=saved||[];if(entries.includes(key))return false;await chrome.storage.local.set({[storageKey]:[...entries,key].slice(-128)});return true;},
        audit:(kind,summary)=>auditLog.append({kind,summary}),
        onStatus:value=>{readyLive=value;emit();}});
      transport.setManualHandlers({
        begin:message=>{if(closed || readyController?.busy || healthError || !auditReady)throw new Error('当前不能协调手动操作，请等待准备或核对完成');return controller.beginManual({...message,type:message.action});},
        complete:async message=>{try{return await controller.completeManual({...message,type:message.action});}catch(error){readyController?.stop('手动操作未能核对，自动准备已停止');throw error;}},
      });
      transport.setManualEnabled(false);
      transport.setLockLost(reason=>{controller.stop(`独占运行锁丢失：${reason}`);readyController?.stop(`运行锁丢失：${reason}`);});recency.observe(transport.read());offState=transport.subscribe(state=>{recency.observe(state);void syncObservedMatch(state);emit();});
      void syncObservedMatch(transport.read());
      live={...live,state:'idle',message:'已读取当前网页；自动倒转未启动。买入数量与刷新总费用不限；按实价刷新，最小间隔约0.3秒。'};
      emit(true);
    } catch(error) {healthError=String(error.message || error).slice(0,200);live={...live,state:'blocked',message:`未启用交易接口：${healthError}`};emit();}
  }
  reopen.addEventListener('click', () => { expanded = true; update(); }); host.addEventListener('wei:toggle', () => { expanded = !expanded; update(); }); host.addEventListener('wei:dispose', () => { if (!controller?.running && !controller?.starting) close(); });
  window.addEventListener('message', onMessage);window.addEventListener('resize', onResize);window.addEventListener('pagehide', close);
  window.addEventListener('keydown', onHotkey, true);
  update();void init();
})();
