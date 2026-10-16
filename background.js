// MV3 background: origin-scoped lease AND bounded local audit trail. Never injects a page automatically.
const LEASE_MS = 15000;
const LOG_LIMIT = 300;
const WORKER_VERSION = chrome.runtime.getManifest().version;
function randomId() {
  if (typeof globalThis.crypto?.getRandomValues !== 'function') throw new Error('浏览器不支持安全随机数，拒绝建立运行锁');
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}
const LOG_KINDS = new Set([
  'start', 'wait', 'guard', 'buy_request', 'buy_ok', 'item_buy_request', 'item_buy_ok', 'gift', 'keep',
  'sell_request', 'sell_ok', 'refresh_request', 'refresh_ok', 'coin_request', 'coin_ok', 'coin_warn',
  'use_request', 'use_ok', 'use_warn',
  'reward_request', 'reward_ok', 'ready_start', 'ready_request', 'ready_ok', 'pause', 'settings', 'info', 'error',
]);
const queues = new Map();
function serial(key, fn) {
  const previous = queues.get(key) || Promise.resolve();
  const run = previous.catch(() => {}).then(fn);
  const finish = run.catch(() => {}).finally(() => { if (queues.get(key) === finish) queues.delete(key); });
  queues.set(key, finish);
  return run;
}
function context(sender) {
  if (!Number.isInteger(sender?.tab?.id)) return null;
  try {
    const url = new URL(sender.url || sender.tab.url);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return { tabId: sender.tab.id, origin: url.origin,
      lockKey: `wei.runtime.lock:${url.origin}`,
      logKey: `wei.audit.v1:${url.origin}` };
  } catch { return null; }
}
function scrub(value) {
  return String(value || '').replace(/https?:\/\/\S+/gi, '[地址已隐藏]')
    .replace(/(token|authorization|cookie|password|secret|session)\s*[:=]\s*\S+/gi, '$1=[已隐藏]')
    .replace(/[\r\n\t]+/g, ' ').trim().slice(0, 180);
}
function cleanEntry(raw) {
  if (!raw || !LOG_KINDS.has(raw.kind) || typeof raw.summary !== 'string') return null;
  const summary = scrub(raw.summary);
  if (!summary) return null;
  const entry = { kind: raw.kind,
    level: ['info', 'warn', 'error'].includes(raw.level) ? raw.level : 'info', summary };
  const details = {};
  const meta = raw.meta;
  if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
    for (const key of ['uid', 'slot', 'price', 'round', 'bought', 'sold', 'kept', 'refreshed',
      'itemUid', 'targetUid', 'amount', 'gain']) {
      const value = meta[key];
      if (Number.isSafeInteger(value) && value >= 0 && value < 1000000000000) details[key] = value;
    }
    if (typeof meta.operatorId === 'string' && /^[A-Za-z0-9_:-]{3,100}$/.test(meta.operatorId)) {
      details.operatorId = meta.operatorId;
    }
    if (typeof meta.itemId === 'string' && /^[A-Za-z0-9_:-]{3,100}$/.test(meta.itemId)) {
      details.itemId = meta.itemId;
    }
  }
  if (Object.keys(details).length) entry.meta = details;
  return entry;
}
async function handleLock(message, ctx) {
  if (!chrome.storage?.session) return { ok: false, reason: '浏览器无法提供安全的互斥锁' };
  return serial(ctx.lockKey, async () => {
    const saved = (await chrome.storage.session.get(ctx.lockKey))[ctx.lockKey];
    const live = saved && Number.isFinite(saved.expires) && saved.expires > Date.now();
    if (message.type === 'lock.acquire') {
      if (live && saved.tabId !== ctx.tabId) return { ok: false, reason: '此服务器已有另一个插件页面正在运行' };
      const token = randomId();
      await chrome.storage.session.set({ [ctx.lockKey]: { tabId: ctx.tabId, token, expires: Date.now() + LEASE_MS } });
      return { ok: true, token };
    }
    if (!live || saved.tabId !== ctx.tabId || typeof message.token !== 'string' || saved.token !== message.token) {
      return { ok: false, reason: '运行锁已过期或不属于当前标签页' };
    }
    if (message.type === 'lock.renew') {
      await chrome.storage.session.set({ [ctx.lockKey]: { ...saved, expires: Date.now() + LEASE_MS } });
      return { ok: true };
    }
    await chrome.storage.session.remove(ctx.lockKey);
    return { ok: true };
  });
}
async function handleLog(message, ctx) {
  if (!chrome.storage?.local) return { ok: false, reason: '本地日志存储不可用' };
  return serial(ctx.logKey, async () => {
    if (message.type === 'log.clear') {
      await chrome.storage.local.remove(ctx.logKey);
      return { ok: true, entries: [] };
    }
    const raw = (await chrome.storage.local.get(ctx.logKey))[ctx.logKey];
    if (raw !== undefined && !Array.isArray(raw)) return { ok: false, reason: '本地日志格式异常，请先清空日志' };
    const entries = (raw || []).slice(-LOG_LIMIT);
    if (message.type === 'log.read') return { ok: true, entries };
    const entry = cleanEntry(message.entry);
    if (!entry) return { ok: false, reason: '日志字段不完整或不受支持' };
    entries.push({ ...entry, id: randomId(), at: new Date().toISOString(), server: ctx.origin });
    const bounded = entries.slice(-LOG_LIMIT);
    await chrome.storage.local.set({ [ctx.logKey]: bounded });
    return { ok: true, entries: bounded };
  });
}
async function handle(message, sender) {
  const ctx = context(sender);
  if (!ctx) return { ok: false, reason: '只允许当前顶层游戏标签页使用此功能' };
  if (message?.clientVersion !== WORKER_VERSION) {
    return { ok: false, reason: `插件脚本版本不匹配（后台 v${WORKER_VERSION}）；请重新加载扩展，并在安全时自行刷新游戏页` };
  }
  if (message.type === 'health.check') return { ok: true, version: WORKER_VERSION };
  if (message.type === 'page.reconnect') return reconnect(sender);
  if (['lock.acquire', 'lock.renew', 'lock.release'].includes(message.type)) return handleLock(message, ctx);
  if (['log.read', 'log.append', 'log.clear'].includes(message?.type)) return handleLog(message, ctx);
  return { ok: false, reason: '未知操作' };
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  handle(message, sender).then(reply, error => reply({ ok: false, reason: error?.message || '后台操作异常' }));
  return true;
});

// 打开工作台：识别源码版（js/main.js）与打包版（游戏自身暴露的 globalThis.__SP__）两种网页。
async function openWorkbench(tab) {
  const version = chrome.runtime.getManifest().version;
  const [result] = await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',func:()=>{
    if (window.top !== window) return {error:'仅支持顶层页面'};
    const host=document.getElementById('wei-cardkeeper-host-v1');
    if (host) return {installed:true,version:host.dataset.weiVersion};
    if (document.querySelector('.spui, .spui-reopen, [data-spui-extension]')) return {error:'本页已有旧版交易控制台，请勿同时运行'};
    const main=[...document.scripts].map(s=>s.src).filter(Boolean).map(src=>new URL(src,location.href))
      .find(url=>url.origin===location.origin&&url.pathname.endsWith('/js/main.js'));
    return {root:main?new URL('../',main).href:null};
  }});
  const page=result?.result;
  if (!page || page.error) throw new Error(page?.error || '页面校验失败');
  if (page.installed) {
    if (page.version!==version) throw new Error('本页仍为旧版工作台，请在安全时自行刷新页面后再打开');
    await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>document.getElementById('wei-cardkeeper-host-v1')?.dispatchEvent(new CustomEvent('wei:toggle'))});
    return;
  }
  // MAIN world: 只读探测。打包版没有 js/main.js，但游戏会挂出 __SP__（界面正在用的同一份 store / net）。
  const [probe]=await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:async mainRoot=>{
    const other=!!globalThis.__recruitAssistPageBridgeInstalled||!!globalThis.__spuiMainBridge||!!globalThis.__weiMainBridge;
    const sp=globalThis.__SP__;
    const live=!!sp&&typeof sp==='object'&&sp.version===1&&typeof sp.store?.get==='function'&&typeof sp.store?.subscribe==='function'&&typeof sp.net?.request==='function';
    let root=mainRoot;
    if (!root&&live) {
      for (const candidate of [...new Set([new URL('./',location.href).href,location.origin+'/'])]) {
        try { const r=await fetch(new URL('data/chess.json',candidate),{cache:'no-store'}); if (r.ok) { root=candidate; break; } } catch {}
      }
    }
    return {other,live,root};
  },args:[page.root]});
  if (probe?.result?.other) throw new Error('本页仍有其他插件或旧游戏桥接；请在安全时自行刷新页面');
  const root=probe?.result?.root||null;
  const reason=root?'':probe?.result?.live?'找到游戏接口，但读取不到 data/chess.json 图鉴'
    :'没有发现卫戍协议游戏接口：网页可能还没加载完（请进入大厅后在「运行自检」点“重新检查”），或这不是卫戍协议网页';
  const nonce=randomId(),cfg={nonce,uiToken:randomId(),root,reason,version};
  await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',func:cfg=>{globalThis.__weiExtensionConfig=cfg;},args:[cfg]});
  if (root) {
    await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:cfg=>{globalThis.__weiMainConfig=cfg;},args:[{nonce,root,version}]});
    await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',files:['runtime-main.js']});
  }
  await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',files:['content-script.js']});
}
async function markTab(tab, error) {
  await chrome.action.setBadgeText({tabId:tab.id,text:error?'!':''});
  if (error) await chrome.action.setBadgeBackgroundColor({tabId:tab.id,color:'#976448'});
  await chrome.action.setTitle({tabId:tab.id,title:error?`未打开：${error.message}`:'卫戍协议拿牌器 · 打开/收起左侧工作台；自动倒转须手动启动'});
}
// 「运行自检 → 重新检查」：未连接游戏接口的工作台请求重新探测本页（例如游戏刚加载完）。
async function reconnect(sender) {
  const tab=sender.tab;
  if (sender.frameId!==0) return {ok:false,reason:'仅支持顶层页面'};
  const bridge=async()=>(await chrome.scripting.executeScript({target:{tabId:tab.id},world:'MAIN',func:()=>!!globalThis.__weiMainBridge||!!globalThis.__spuiMainBridge}))[0]?.result;
  await chrome.scripting.executeScript({target:{tabId:tab.id},world:'ISOLATED',func:()=>document.getElementById('wei-cardkeeper-host-v1')?.dispatchEvent(new CustomEvent('wei:dispose'))});
  for (let i=0;i<20&&await bridge();i++) await new Promise(resolve=>setTimeout(resolve,100));
  try { await openWorkbench(tab); await markTab(tab,null); return {ok:true}; }
  catch (error) { await markTab(tab,error); return {ok:false,reason:error.message}; }
}
// Explicit toolbar action, no popup navigation and no automatic injection.
chrome.action?.onClicked?.addListener(async tab => {
  if (!Number.isInteger(tab.id) || !/^https?:\/\//i.test(tab.url || '')) return;
  try { await openWorkbench(tab); await markTab(tab,null); }
  catch (error) { await markTab(tab,error); }
});
