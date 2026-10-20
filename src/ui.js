import { iconGridMarkup, gridColumns, pointGridCell, previewGridDom, restoreGridDom } from './icon-grid-view.js';
import * as Model from './model.js';
// 自动使用提示：会销毁目标干员的消耗道具（信标）。保留名单与自编干员不会被选为目标。
const USE_WARNINGS = Object.freeze({ chess_item_5_04_e_a: '⚠ 信标会销毁目标干员（保留名单与自编干员除外）', chess_item_5_06_e_a: '博士投影只装备给非精锐干员', chess_item_1_03_e_a: '盟约之币在运行中本就会自动使用' });

const PATHS = {
  floating: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18m-7 5h4m-4 3h2"/>',
  chevrons: '<path d="m11 5-6 7 6 7m7-14-6 7 6 7"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="m9 3-1 3-3 1 1 3-1 3 3 1 1 3h6l1-3 3-1-1-3 1-3-3-1-1-3z"/><circle cx="12" cy="10" r="3"/>',
  server: '<rect x="4" y="4" width="16" height="6" rx="1"/><rect x="4" y="14" width="16" height="6" rx="1"/><path d="M8 7h.01M8 17h.01"/>',
  bolt: '<path d="m13 3-8 11h6l-1 7 9-12h-7z"/>',
  buy: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v4h14v-4"/>',
  shield: '<path d="m12 3 8 3v6c0 4-8 9-8 9s-8-5-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  upload: '<path d="M12 15V3m-5 5 5-5 5 5M5 16v4h14v-4"/>',
  box: '<path d="M4 8 12 4l8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
  power: '<path d="M12 3v9m-5-7a8 8 0 1 0 10 0"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  unlock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7-2m-3 9v3"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PATHS[name] || PATHS.check}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const count = value => String(value).padStart(2, '0');
export function itemPurchaseState(item, used = 0, held = null) {
  if (!item.enabled && !item.capPaused) return 'disabled';
  if (item.capPaused || item.limit != null && used >= item.limit ||
      item.ownedTarget != null && Number.isInteger(held) && held >= item.ownedTarget) return 'full';
  return 'enabled';
}
const ITEM_STATE_LABEL = { enabled: '启用', disabled: '禁用', full: '已满' };

// 状态未变时不创建 DOM；行内容变化时也复用同 URL 的原 img，保留加载 / 淡入状态。
const iconListRenderKeys = new WeakMap();
export function renderIconList(target, key, createHtml) {
  if (iconListRenderKeys.has(target) && iconListRenderKeys.get(target) === key) return false;
  const previous = new Map();
  for (const image of target.querySelectorAll('img.game-icon')) {
    const src = image.getAttribute('src');
    if (!src) continue;
    if (!previous.has(src)) previous.set(src, []);
    previous.get(src).push(image);
  }
  const template = target.ownerDocument.createElement('template');
  template.innerHTML = createHtml();
  const reuse = [];
  for (const image of template.content.querySelectorAll('img.game-icon')) {
    const old = previous.get(image.getAttribute('src'))?.shift();
    if (!old) continue;
    // 惰性模板中先用注释占位：新 img 不提前请求，旧 img 也不跨文档收养后重新加载。
    const marker = template.content.ownerDocument.createComment('game-icon');
    image.replaceWith(marker); reuse.push([marker, old]);
  }
  const scrollTop = target.scrollTop;
  target.replaceChildren(template.content);
  for (const [marker, image] of reuse) {
    const avatar = marker.parentElement;
    marker.replaceWith(image);
    avatar?.classList.toggle('has-game-icon', image.classList.contains('is-loaded'));
  }
  target.scrollTop = scrollTop;
  iconListRenderKeys.set(target, key);
  return true;
}

// 提示只进入当前上下文的预留状态位，不悬浮、不抢焦点；旧定时器不能清掉新提示。
export function createInlineFeedback(node, resolveSlot, {
  setTimer = (fn, ms) => setTimeout(fn, ms), clearTimer = id => clearTimeout(id),
} = {}) {
  let timer, slot = null, revision = 0, disposed = false;
  function clear() {
    revision += 1;
    if (timer !== undefined) clearTimer(timer);
    timer = undefined;
    if (slot) { slot.classList.remove('has-feedback'); slot.title = ''; slot = null; }
    node.hidden = true; node.textContent = '';
  }
  return {
    show(message) {
      if (disposed) return false;
      clear();
      const target = resolveSlot();
      if (!target) return false;
      slot = target; slot.append(node);
      node.textContent = String(message ?? ''); slot.title = node.textContent;
      slot.classList.add('has-feedback'); node.hidden = false;
      const ticket = revision;
      timer = setTimer(() => { if (!disposed && ticket === revision) clear(); }, 2800);
      return true;
    },
    clear,
    destroy() { clear(); disposed = true; },
  };
}

export async function mountWorkbench(container, options) {
  const { brandUrl, storage, onCollapse = () => {}, onClose = onCollapse, onResize = () => {} } = options;
  let catalogue = options.catalogue;
  let persistenceReady = true;
  let runtimeInfo = {ready:false,running:false,starting:false,message:options.preview?'离线预览 · 不连接对局、不执行交易':'正在连接当前网页；自动交易未启动',matches:{},itemMatches:{},pending:[],entries:[],health:['尚未连接网页接口'],logCount:0};
  let known = new Map(catalogue.operators.map(op => [op.id, op]));
  const failedGameIcons = new Set();
  let itemIconMap = new Map();
  let raw = null, loadError = false;
  try { raw = await storage.get(); } catch { loadError = true; }
  let plan = Model.normalizePlan(raw || (options.preview ? Model.examplePlan(catalogue) : null));
  persistenceReady = !loadError; // Saved draftEnabled never arms the real engine.
  plan.draftEnabled = false;
  const version = options.version || globalThis.chrome?.runtime?.getManifest?.().version || '';
  let saveQueue = Promise.resolve(), revision = 0, lastFocus, destroyed = false;
  let recordingHotkey = false, lastHotkey = 0;
  let activeModal = null, lastRight = null, menuId = null, clearUntil = 0, itemResetUntil = 0, itemRenderKey = '', operatorRenderKey = '', advancedOpen = false;
  let iconDrag = null, ignoreIconClickUntil = 0;
  let pickerFilter = { query: '', bond: '', tier: 0 }, itemPickerFilter = { query: '', tier: 0 }, itemQuery = '';
  container.innerHTML = `
  <aside class="workbench workflow" aria-label="卫戍协议拿牌器左侧工作台">
    <div class="top-accent"></div>
    <header class="brand">
      <img class="brand-avatar" src="${esc(brandUrl)}" alt="卫戍协议拿牌器图标">
      <div class="brand-text"><strong>卫戍协议拿牌器</strong></div>
      <div class="header-controls">
        <button class="icon-button" type="button" data-action="quick-open" data-quick-kind="auto" title="倒转开关悬浮窗" aria-label="打开倒转开关悬浮窗">${icon('power')}</button>
        <button class="icon-button" type="button" data-action="quick-open" data-quick-kind="items" title="道具抓取开关悬浮窗" aria-label="打开道具抓取开关悬浮窗">${icon('box')}</button>
        <button class="icon-button" type="button" data-action="settings" title="界面设置" aria-label="界面设置">${icon('settings')}</button>
        <button class="icon-button" type="button" data-action="collapse" title="收起左侧面板" aria-label="收起左侧面板">${icon('chevrons')}</button>
        <button class="icon-button" type="button" data-action="close" title="关闭工作台" aria-label="关闭工作台">${icon('close')}</button>
      </div>
    </header>
    <div class="context"><span class="context-label">${icon('server')}<span title="${esc(options.serverLabel || '界面预览')}">${esc(options.serverLabel || '界面预览')}</span></span><span class="phase-pill">${options.preview ? '离线预览' : '待连接 · 已停止'}</span></div>
    <div class="main">
      <div class="stats sr-only" aria-label="方案统计"><strong id="buy-total">00</strong><strong id="keep-total">00</strong></div>
      <div class="tabs" role="tablist" aria-label="名单类型">
        <button id="tab-buy" class="tab" type="button" role="tab" data-kind="buy" aria-controls="operator-panel"><span class="tab-character"></span><span>买入<span class="tab-suffix">名单</span></span> <span class="tab-counter" id="buy-count">0</span></button>
        <button id="tab-keep" class="tab" type="button" role="tab" data-kind="keep" aria-controls="operator-panel"><span class="tab-character tab-character--keep"></span><span>保留<span class="tab-suffix">名单</span></span> <span class="tab-counter" id="keep-count">0</span></button>
        <button id="tab-items" class="tab" type="button" role="tab" data-view="items" aria-controls="item-section"><span class="tab-character tab-character--items"></span>道具 <span class="tab-counter" id="item-tab-count">0</span></button>
      </div>
      <div class="plan-toolbar"><button class="new-button primary-add" type="button" data-action="add-open">${icon('plus')}<span id="add-label">新增买入干员</span></button><button class="tool-button" type="button" data-action="filters" aria-expanded="false" aria-controls="advanced-filter">筛选<span id="filter-count" hidden></span></button><button class="tool-button" type="button" data-action="bulk-more" aria-expanded="false" aria-controls="bulk-menu" title="更多名单操作">···</button></div>
      <div class="filters">
        <label class="search">${icon('search')}<span class="sr-only">搜索干员、静态 ID 或盟约</span><input id="search" type="search" maxlength="80" autocomplete="off" placeholder="搜索已添加的干员"><button class="search-clear" type="button" data-action="search-clear" aria-label="清空搜索" hidden>${icon('close')}</button><kbd title="在面板内按 Ctrl+K 搜索">⌃ K</kbd></label>
        <div id="advanced-filter" class="advanced-filter" hidden>
          <div class="filter-line"><label class="bond-filter"><span>盟约</span><select id="bond" aria-label="按盟约筛选"><option value="">全部盟约</option></select></label><button class="selected-only" type="button" data-action="selected" aria-pressed="false">${icon('power')}只看启用</button></div>
          <div class="tiers" role="group" aria-label="按干员阶级筛选">${[0,1,2,3,4,5,6].map(t => `<button class="tier-button" type="button" data-tier-filter="${t}" aria-pressed="false">${t ? t + '阶' : '全部'}</button>`).join('')}</div>
          <button class="text-button" type="button" data-action="reset-filter">重置筛选与搜索</button>
        </div>
      </div>
      <div class="list-heading operator-heading"><span>已添加 <b id="result-count">0</b><span id="entry-total"></span></span><span id="enabled-summary"></span><span class="list-view-modes"><button class="density-toggle" type="button" data-action="compact" aria-pressed="false" title="紧凑列表：减少行高，同屏显示更多条目">紧凑</button><button class="density-toggle" type="button" data-action="icons" aria-pressed="false" aria-controls="operator-rows" title="仅图标：点击启停，双右键同样有效；可拖到任意网格">仅图标</button></span><span id="icon-mode-help" class="sr-only">点击图标切换启用或禁用；双右键同样有效。可拖到任意网格，也可按 Alt 加方向键调整位置。保留目标、资金门槛与锁定状态不变。</span></div>
      <div id="operator-panel" class="operator-list" role="tabpanel" aria-labelledby="tab-buy" tabindex="0">
        <div id="operator-rows"></div>
      <section id="keep-item-dock" hidden aria-label="道具抓取快捷开关">
        <div class="keep-item-dock-heading"><span>道具抓取</span><button type="button" class="tool-button keep-items-master" data-action="items-master-toggle" aria-pressed="false">全部暂停</button></div>
        <div id="keep-item-icons" aria-label="已添加道具"></div>
        <span id="keep-item-help" class="sr-only">点击或双右键切换单件道具抓取，不中断当前运行；已发出的购买仍会记数。已满不清零。可拖到任意网格，布局与道具页同步；占用格向后顺延。修改详细规则请到道具页。</span>
      </section>
      </div>
      <section id="item-section" class="item-panel" role="tabpanel" aria-labelledby="tab-items" hidden>
        <div class="plan-toolbar item-toolbar"><button class="new-button primary-add" type="button" data-action="item-picker-open">${icon('plus')}新增道具</button></div>
        <label class="search">${icon('search')}<span class="sr-only">搜索已添加的道具</span><input id="item-search" type="search" maxlength="80" autocomplete="off" placeholder="搜索已添加的道具"></label>
        <div class="list-heading"><span>已添加 <b id="item-count">0 件</b></span><span id="item-enabled-summary">新增默认禁用 · 点启用后自动买入</span><span class="list-view-modes"><button class="density-toggle" type="button" data-action="compact" aria-pressed="false" title="紧凑列表：减少行高，同屏显示更多条目">紧凑</button><button class="density-toggle" type="button" data-action="icons" aria-pressed="false" aria-controls="item-list" title="仅图标：点击切换自动购买，双右键同样有效；拖到任意网格">仅图标</button></span><span id="item-icon-mode-help" class="sr-only">点击或双右键切换自动购买；自动使用仍按原设置。拖到任意网格，可留空；占用格向后顺延，也可按 Alt 加方向键移动。累计次数、上限和资金门槛不变。</span></div>
        <div class="item-scroll">
          <details class="item-help"><summary>规则说明</summary><p>道具逐条点“启用”后才自动购买；抓取上限留空即不限，填了上限的用满会自动禁用，手动再启用会清零道具本局次数。资金门槛填写后要求购买前资金严格大于它。同名装备按游戏数据合成：手牌或整备区已有同名件时，买入即合成精锐并计1次；会用掉干员身上已配发的同名装备时跳过不买。“下一对局”只清零道具累计次数。保留干员不累计购买次数：按战场、手牌/备战区和临时区的当前持有量补足，普通1、精二3；达标后停止补抓，符合倒卖规则的新买入干员仍可倒卖；数量减少后自动补抓，手动禁用仍优先。</p></details>
          <div id="item-list" class="item-list" aria-label="已记录道具"></div>
          <button class="item-next" type="button" data-action="item-next">下一对局 · 清零道具次数</button>
        </div>
      </section>
      <p id="mapping-note" class="mapping-note" role="status" hidden></p>
      <div class="list-note">${icon('power')}<span>点击切换启停 · 双右键同样有效 · 锁定防移除</span></div>
    </div>
    <footer class="footer">
      <div class="footer-top"><strong id="summary-title">当前买入名单</strong><span class="footer-locks">${icon('lock')}<span id="lock-count">0 位已锁定</span></span></div>
      <div id="chips" class="chips" hidden></div>
      <section class="auto-card" aria-label="手动启动自动倒转">
        <div class="auto-header"><div class="auto-title">${icon('bolt')}<strong>自动倒转</strong><span id="runtime-brief" class="runtime-brief">未连接</span><kbd id="hotkey-chip" class="hotkey-chip" title="启停快捷键，可在设置中修改" hidden></kbd></div><button class="run-button" type="button" role="switch" data-action="draft" aria-label="手动启动或停止自动倒转" aria-checked="false"><span class="run-label">启动</span></button></div>
        <p id="round-trades" class="round-trades" aria-label="本回合交易统计">本回合统计未接入</p>
        <p id="draft-note">自动交易未启动。</p><p class="auto-risk">买入、刷新无总额上限 · 刷新间隔 ≥0.3秒</p>
      </section>
      <div class="feedback-slot" data-feedback-slot="main"><div class="toast" role="status" aria-live="polite" aria-atomic="true" hidden></div></div>
      <div class="utility-bar"><button class="utility-button" type="button" data-action="open-log">执行日志 <span id="log-count">0 / 1000</span></button><button class="utility-button" type="button" data-action="open-health">运行自检 <span id="health-label">未连接</span></button></div>
      <div class="save-status" data-state="saved" role="status" aria-live="polite"><span class="save-dot"></span><span id="save-label">${options.preview ? '示例数据 · 离线预览' : '已保存到本地'}</span><span class="version">${esc(version ? `v${version}` : '版本未知')}</span></div>
    </footer>
    <div id="entry-menu" class="action-menu" role="menu" aria-label="干员操作" hidden><strong id="entry-menu-name"></strong><p>锁定项需先解锁，才能移除。</p><button class="row-remove" type="button" data-action="remove" role="menuitem">${icon('close')}从当前名单移除</button></div>
    <div id="bulk-menu" class="action-menu bulk-menu" role="menu" aria-label="名单操作" hidden><strong>当前名单</strong><p>只清空未锁定项；不会影响另一份名单。</p><button class="danger-button" type="button" data-action="clear" role="menuitem">清空未锁定项</button><span id="clear-hint">点击后需要再次确认</span></div>
    <div class="utility-backdrop" hidden><section class="utility-sheet" role="dialog" aria-modal="true" aria-labelledby="utility-title"><header class="utility-head"><button class="tool-button" type="button" data-action="utility-close">← 返回名单</button><h2 id="utility-title">执行日志</h2><button class="icon-button" type="button" data-action="utility-close" aria-label="关闭辅助工具">${icon('close')}</button></header><div id="log-view" class="utility-content"><div class="log-actions"><button class="tool-button" type="button" data-action="log-read">刷新日志</button><button class="tool-button" type="button" data-action="log-export">导出 JSON</button><button class="tool-button danger-button" type="button" data-action="log-clear">清空此服</button></div><p class="sheet-hint">仅显示当前服务器最近 60 条；本地最多保留 1000 条。</p><ol id="log-list" class="log-list"></ol></div><div id="health-view" class="utility-content" hidden><p class="sheet-hint">只检查接口和名单匹配，不会启动交易。</p><div id="health-list" class="health-list"></div><button class="new-button" type="button" data-action="health-check">重新检查</button></div><footer class="utility-foot"><div class="feedback-slot" data-feedback-slot="utility"><span data-feedback-default>查看工具不会自动开始买卖</span></div><button class="run-button" type="button" role="switch" data-action="draft" aria-checked="false" aria-label="手动启动或停止自动倒转"><span class="run-label">启动</span></button></footer></section></div>
    <div class="settings-backdrop" hidden>
      <section class="settings" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="settings-head"><h2 id="settings-title">工作台设置</h2><button class="icon-button" type="button" data-action="settings-close" aria-label="关闭设置">${icon('close')}</button></div>
        <div class="settings-content">
        <div class="settings-group"><label>左侧面板宽度</label><div class="width-options">${[360,400,440].map(w => `<button type="button" data-width="${w}" aria-pressed="false">${w} px</button>`).join('')}</div></div>
        <div class="settings-group density-line"><div><label>紧凑列表</label><p>缩小行距</p></div><button class="switch" type="button" role="switch" data-action="compact" aria-checked="false" aria-label="切换紧凑列表"><span></span></button></div>
        <div class="settings-group density-line"><div><label>仅图标模式</label><p>点击启停，拖动排序</p></div><button class="switch" type="button" role="switch" data-action="icons" aria-checked="false" aria-label="切换仅图标模式"><span></span></button></div>
        <div class="settings-group auto-ready-settings"><div class="density-line"><div><label>自动准备</label><p>无尽用 · 手动开启，重新打开后默认关闭</p></div><button class="switch" type="button" role="switch" data-action="ready-toggle" aria-checked="false" aria-label="自动准备开关"><span></span></button></div>
          <label for="ready-funds">资金 ≤ <input id="ready-funds" type="number" min="0" step="1" inputmode="numeric" placeholder="不限" aria-label="自动准备资金上限"> 时自动准备</label><p>默认 0；留空不限资金，持续逐回合自动准备。</p>
          <div class="density-line"><label>跳过第10、20、30…回合</label><button class="switch" type="button" role="switch" data-action="ready-skip" aria-checked="false" aria-label="每十回合不自动准备"><span></span></button></div>
          <p id="ready-status" role="status">已关闭</p><button class="tool-button" type="button" data-action="quick-open" data-quick-kind="ready">打开自动准备悬浮窗</button>
          <p>独立于倒转运行；条件满足后先结束倒转并等待在途交易核对。跳过回合需手动准备，下一回合继续。</p>
        </div>
        <div class="settings-group hotkey-group"><div class="hotkey-text"><label id="hotkey-title">启停快捷键</label><p id="hotkey-hint">游戏或面板中按键启停；输入文字时不触发。</p></div>
          <div class="hotkey-controls"><button class="hotkey-button" type="button" data-action="hotkey-record" aria-pressed="false" aria-labelledby="hotkey-title" aria-describedby="hotkey-hint"><kbd id="hotkey-label">F8</kbd><span>点击修改</span></button><button class="text-button" type="button" data-action="hotkey-reset">恢复 F8</button><button class="text-button subtle" type="button" data-action="hotkey-off">关闭</button></div>
          <p id="hotkey-error" class="hotkey-error" role="alert" hidden></p></div>
        <div class="settings-group config-group"><div class="config-text"><label>配置文件</label><p>名单、规则与界面设置自动保存。运行中可修改。</p></div>
          <div class="config-actions"><button class="tool-button" type="button" data-action="config-export">${icon('buy')}导出配置</button><label class="tool-button config-import-trigger" data-action="config-import">${icon('upload')}<span>导入配置</span><input id="config-file" type="file" accept=".json,application/json" aria-label="导入配置 JSON 文件"></label></div>
          <p class="config-hint">导入会覆盖配置，保留本局计数；覆盖前自动备份。</p>
          <button class="text-button config-restore" type="button" data-action="config-restore" hidden>恢复导入前的配置</button>
          <p id="config-error" class="hotkey-error" role="alert" hidden></p></div>
        <div class="settings-note">手动启动后才交易。保留目标按场上、手牌和临时区合计：普通1份，精锐3份。道具需单独启用；重新启用会清零该道具计数。运行中可改规则；未知库存变化、离开整备、断连或存储失败仍会停止。停止前已发出的指令可能继续生效，请核对库存。</div>
        </div>
        <div class="feedback-slot" data-feedback-slot="settings"></div>
        <button class="settings-done" type="button" data-action="settings-close">完成设置</button>
      </section>
    </div>
    <div class="picker-backdrop" hidden>
      <section class="picker" role="dialog" aria-modal="true" aria-labelledby="picker-title">
        <header class="picker-head"><div><h2 id="picker-title">新增干员</h2><p>单击候选干员，即刻添加到当前名单。</p></div><button class="icon-button" type="button" data-action="picker-close" aria-label="关闭新增列表">${icon('close')}</button></header>
        <div class="picker-filters">
          <label class="search">${icon('search')}<span class="sr-only">搜索新增候选干员</span><input id="picker-search" type="search" maxlength="80" autocomplete="off" placeholder="搜索候选干员 / ID / 盟约"></label>
          <label class="bond-filter"><span>盟约</span><select id="picker-bond" aria-label="筛选新增候选盟约"><option value="">全部盟约</option></select></label>
          <div class="tiers" role="group" aria-label="筛选新增候选阶级">${[0,1,2,3,4,5,6].map(t => `<button class="tier-button" type="button" data-picker-tier="${t}" aria-pressed="false">${t ? t + '阶' : '全部'}</button>`).join('')}</div>
        </div>
        <div class="picker-meta"><span>候选干员 <b id="picker-result-count">0</b></span><span>本名单已添加 <b id="picker-added-count">0</b></span></div>
        <div id="picker-list" class="picker-list" role="list" aria-label="点击即添加的候选列表" tabindex="0"></div>
        <details class="manual-details"><summary>列表里没有？手动输入干员名</summary><form id="manual-form" class="manual-entry">
          <label for="manual-name">手动输入干员名</label>
          <div class="manual-input-row"><input id="manual-name" type="text" maxlength="80" autocomplete="off" placeholder="输入角色名称" aria-describedby="manual-hint manual-error"><button class="new-button" type="submit">${icon('plus')}添加</button></div>
          <p id="manual-hint">最多40字。连接游戏后匹配本服名称；未匹配或重名的条目会跳过。</p>
          <p id="manual-error" class="manual-error" role="alert" hidden></p>
        </form></details>
        <footer class="picker-footer"><div class="feedback-slot" data-feedback-slot="picker"><p data-feedback-default id="picker-feedback" role="status" aria-live="polite">已添加项不会重复加入，关闭弹窗后即可查看名单。</p></div><button class="settings-done" type="button" data-action="picker-close">完成</button></footer>
      </section>
    </div>
    <div class="picker-backdrop item-picker-backdrop" hidden>
      <section class="picker item-picker" role="dialog" aria-modal="true" aria-labelledby="item-picker-title">
        <header class="picker-head"><div><h2 id="item-picker-title">新增道具</h2><p>单击即添加，可连续选择；新增默认禁用、抓取不限。</p></div><button class="icon-button" type="button" data-action="item-picker-close" aria-label="关闭道具列表">${icon('close')}</button></header>
        <div class="picker-filters">
          <label class="search">${icon('search')}<span class="sr-only">搜索道具</span><input id="item-picker-search" type="search" maxlength="80" autocomplete="off" placeholder="搜索道具名称 / 效果 / ID"></label>
          <div class="tiers" role="group" aria-label="按道具阶级筛选">${[0,1,2,3,4,5,6].map(t => `<button class="tier-button" type="button" data-item-tier="${t}" aria-pressed="false">${t ? t + '阶' : '全部'}</button>`).join('')}</div>
        </div>
        <div class="picker-meta"><span>候选道具 <b id="item-picker-count">0</b></span><span>已记录 <b id="item-picker-added">0</b></span></div>
        <div id="item-picker-list" class="picker-list" role="list" aria-label="点击即添加的道具列表" tabindex="0"></div>
        <details class="manual-details"><summary>图鉴里没有？手动录入道具名</summary><form id="item-manual-form" class="manual-entry"><div class="manual-input-row"><input id="item-manual-name" type="text" maxlength="80" autocomplete="off" placeholder="图鉴外道具名称" aria-label="图鉴外道具名称" aria-describedby="item-manual-error"><button class="new-button" type="submit">${icon('plus')}添加</button></div><p>连接游戏后按本服道具名唯一匹配；未匹配时只提示，不会购买。</p><p id="item-manual-error" class="manual-error" role="alert" hidden></p></form></details>
        <footer class="picker-footer"><div class="feedback-slot" data-feedback-slot="items"><p data-feedback-default id="item-picker-feedback" role="status" aria-live="polite">已记录的道具不会重复加入。</p></div><button class="settings-done" type="button" data-action="item-picker-close">完成</button></footer>
      </section>
    </div>
  </aside>`;
  const root = container.firstElementChild;
  const $ = selector => root.querySelector(selector);
  const feedback = createInlineFeedback($('.toast'), () => {
    const scope = ['logs','health'].includes(activeModal) ? 'utility' : activeModal || 'main';
    return $(`[data-feedback-slot="${scope}"]`);
  });
  const list = $('#operator-panel'), rows = $('#operator-rows'), search = $('#search'), bond = $('#bond');
  const pickerList = $('#picker-list'), pickerSearch = $('#picker-search'), pickerBond = $('#picker-bond');
  const manualForm = $('#manual-form'), manualName = $('#manual-name');
  const itemManualForm = $('#item-manual-form'), itemManualName = $('#item-manual-name');
  const configFile = $('#config-file');
  const itemPickerList = $('#item-picker-list'), itemPickerSearch = $('#item-picker-search'), itemSearch = $('#item-search');
  function buildBonds() {
    bond.replaceChildren(new Option('全部盟约','')); pickerBond.replaceChildren(new Option('全部盟约',''));
    for (const core of [true, false]) {
    const group = document.createElement('optgroup'); group.label = core ? '核心盟约' : '其他盟约';
    for (const item of catalogue.bonds.filter(b => b.isCore === core)) group.append(new Option(item.name, item.id));
    if (group.children.length) { bond.append(group); pickerBond.append(group.cloneNode(true)); }
  }
  }
  buildBonds();
  function toast(message) { feedback.show(message); }
  function status(text, state) { $('#save-label').textContent = text; $('.save-status').dataset.state = state; }
  function persist() {
    const snapshot = Model.normalizePlan(plan), ticket = ++revision;
    status('正在保存方案…', 'saving');
    saveQueue = saveQueue.catch(() => {}).then(() => storage.set(snapshot)).then(() => {
      persistenceReady = true;options.onReadySettingsSaved?.(snapshot.autoReady);
      if (!destroyed && ticket === revision) status(options.preview ? '预览方案已保存 · 未连接对局' : '本地名单已保存 · 启停状态不保存', 'saved');
    }).catch(() => { persistenceReady=false;options.onPersistenceError?.(); if (!destroyed && ticket === revision) status('存储不可用 · 仅本次界面有效，不能启动', 'error'); });
  }
  function renderRuntime() {
    const readyButton=$('[data-action=ready-toggle]');readyButton.setAttribute('aria-checked',String(!!runtimeInfo.readyRunning));readyButton.disabled=!!options.onRuntimeAction&&!runtimeInfo.readyReady&&!runtimeInfo.readyRunning;
    $('#ready-status').textContent=runtimeInfo.readyMessage || '已关闭';
    const active = !!(runtimeInfo.running || runtimeInfo.starting);
    for(const button of root.querySelectorAll('[data-action=draft]')){button.setAttribute('aria-checked',String(active));button.disabled=!!options.onRuntimeAction&&!runtimeInfo.ready&&!active;button.querySelector('.run-label').textContent=active?'停止':'启动';}
    $('.utility-foot [data-action=draft]').hidden=!active;
    $('.utility-foot [data-feedback-default]').textContent=active?'正在运行 · 可在此停止':'工具页只查看，返回名单后手动启动';
    $('#draft-note').textContent = runtimeInfo.message || '自动交易未启动';
    $('.phase-pill').textContent = options.preview ? '离线预览' : `${({PREP:'整备',COMBAT:'战斗',SETTLE:'结算',BATTLE:'战斗',POST:'结算',LOBBY:'大厅'})[runtimeInfo.phase] || runtimeInfo.phase || '待连接'} · ${active ? '运行中' : '已停止'}`;
    $('#runtime-brief').textContent=Number.isInteger(runtimeInfo.funds)?`资金 ${runtimeInfo.funds} · 刷 ${runtimeInfo.refreshed || 0}`:'未连接';
    $('#runtime-brief').title=`回合 ${runtimeInfo.round ?? '—'} · 买 ${runtimeInfo.bought || 0} / 卖 ${runtimeInfo.sold || 0} / 保留 ${runtimeInfo.kept || 0}`;
    const rt=runtimeInfo.roundStats,unitCount=value=>rt?.countsSupported?`${rt.uncertain?'≥ ':''}${value}`:'—';
    $('#round-trades').textContent=rt?`本回合${rt.partial?'（接入后）':''} · 买 ${unitCount(rt.bought)} / 卖 ${unitCount(rt.sold)} / 支出 ${rt.spendAvailable?rt.spent:'—'}`:'本回合统计未接入';
    $('#round-trades').title='手动与全部自动操作共同统计；买卖按服务器成功回执计张数，赠员、晋升和免费选卡不算买卖。支出取游戏累计消耗资金的本回合增量，包含道具、刷新及升级，不扣除卖出收入。接入前记录不能补算；≥ 表示存在结果不明确的买卖。';
    $('#health-label').textContent = runtimeInfo.ready ? '接口已连接' : '未就绪';
    $('#health-list').textContent = (runtimeInfo.health || []).join('\n');
    const pending = runtimeInfo.pending || [], note = $('#mapping-note');
    note.hidden = !pending.length;
    note.textContent = pending.length ? `待识别 ${pending.length} 项 · 仅这些条目暂不下单，其他规则继续（详情见运行自检）` : '';
    note.title = pending.map(entry=>`${entry.name}：${entry.reason}`).join('\n');
    $('#log-count').textContent = `${runtimeInfo.logCount || 0} / 1000`;
    $('#log-list').innerHTML = (runtimeInfo.entries || []).slice(-60).reverse().map(entry => `<li class="log-entry" data-level="${esc(entry.level)}"><time>${esc(new Date(entry.at).toLocaleTimeString('zh-CN',{hour12:false}))}</time><span>${esc(entry.summary)}</span></li>`).join('') || '<li class="log-empty">此服务器暂无执行日志。</li>';
  }
  function manualHint(op) { const pending=runtimeInfo.pending?.find(entry=>entry.id===op.id&&entry.kind===plan.active);if(pending)return `待识别 · ${pending.reason}`;const id=runtimeInfo.matches?.[op.id];return id ? `手动条目 · 本服已匹配 ${id}` : '自定义条目 · 待本服匹配'; }
  function opSubtitle(op) {
    if (op.custom) return manualHint(op);
    if (op.unavailable) return '本服未找到 · 可禁用或移除';
    // 自选槽位: the slotted operator's bonds plus which slot / whose setting; 无 = slot left empty.
    if (op.diy && op.diyNote) return [...op.bondNames, op.diyNote].join(' · ');
    return op.bondNames.join(' · ') || '无盟约';
  }
  function manualBadge(op) { return runtimeInfo.pending?.some(entry=>entry.id===op.id&&entry.kind===plan.active) ? '待识别' : runtimeInfo.matches?.[op.id] ? '手动·匹配' : '手动·待识别'; }
  function avatarMarkup(source, name, item = false) {
    let src = '';
    try {
      if (typeof source === 'string' && source.length <= 2048) {
        const url = new URL(source);
        if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !failedGameIcons.has(url.href)) src = url.href;
      }
    } catch { /* 未连接、未知干员或缺失素材保留首字，不猜图标地址。 */ }
    return `<span class="operator-avatar${item ? ' item-avatar' : ''}" aria-hidden="true"><span class="avatar-fallback">${esc([...String(name || '?')][0])}</span>${src ? `<img class="game-icon" src="${esc(src)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" draggable="false">` : ''}</span>`;
  }
  function operatorAvatarSource(op) {
    const record = op.custom ? known.get(runtimeInfo.matches?.[op.id]) : op;
    return record?.iconUrl || '';
  }
  function operatorAvatar(op) { return avatarMarkup(operatorAvatarSource(op), op.name); }
  function itemAvatarSource(item) {
    const id = runtimeInfo.itemMatches?.[item.id] || item.id;
    return itemIconMap.get(id) || (id === item.id ? item.iconUrl : '') || '';
  }
  function itemAvatar(item, name = item.name) { return avatarMarkup(itemAvatarSource(item), name, true); }
  function gameIconLoad(event) {
    const image = event.target;
    if (image?.tagName !== 'IMG' || !image.classList.contains('game-icon') || !image.naturalWidth) return;
    image.classList.add('is-loaded'); image.parentElement?.classList.add('has-game-icon');
  }
  function gameIconError(event) {
    const image = event.target;
    if (image?.tagName !== 'IMG' || !image.classList.contains('game-icon')) return;
    if (failedGameIcons.size >= 1024) failedGameIcons.clear();
    failedGameIcons.add(image.src); image.parentElement?.classList.remove('has-game-icon'); image.remove();
  }
  function itemState(item) {
    if(plan.itemBuyingPaused)return 'disabled';
    return itemPurchaseState(item,plan.itemSession.used[item.id] || 0,itemOwnedCount(item.id));
  }
  function itemStateHint(item) {
    if(plan.itemBuyingPaused)return '总开关已暂停抓取，原逐项配置保留；点击恢复原配置后继续';
    if(itemState(item)==='disabled')return '手动禁用，新对局保持禁用';
    if(itemState(item)!=='full')return '启用，仍须满足资金和安全校验';
    return item.capPaused || Model.itemCapReached(plan,item) ? '已满，本局抓取上限已达；新对局恢复资格' : '已满，当前持有目标已达到；持有减少后可补买';
  }
  function itemIconMarkup(item, name) {
    const held = itemOwnedCount(item.id);
    const status = itemState(item), buying = ITEM_STATE_LABEL[status];
    return `<button type="button" class="operator-row item-row icon-tile item-icon-tile is-selected${status === 'disabled' ? ' is-disabled' : ''}" data-purchase-state="${status}" data-item-id="${esc(item.id)}" data-entry-kind="items" data-id="${esc(item.id)}" data-action="item-toggle" aria-pressed="${item.enabled}" aria-label="${esc(name)}，自动购买${buying}，本局持有 ${held ?? '待核对'}" aria-describedby="item-icon-mode-help" title="${esc(name)} · 自动购买${buying}（${itemStateHint(item)}）；自动使用${item.autoUse ? '已开启' : '已关闭'}；本局持有 ${held ?? '待核对'}；点击/双右键切换购买，拖到任意网格">${itemAvatar(item,name)}<span class="item-owned-badge" data-item-owned="${esc(item.id)}" aria-hidden="true"${held === null ? ' hidden' : ''}>${held ?? ''}</span></button>`;
  }
  function toggleItemEntry(id) {
    const item = plan.items.find(entry => entry.id === id); if (!item) return;
    if(itemState(item)==='full'){toast(itemStateHint(item)+'；不会清零次数。');return;}
    const result = Model.toggleItemEnabled(plan,id); if (!result.changed) return;
    change(result.plan);
    const name = Model.ITEMS.find(entry => entry.id === id)?.name || item.name || id;
    toast(item.enabled ? `已禁用道具「${name}」，不会自动买入。` : `已启用道具「${name}」${result.cleared ? '，本局已抓次数已清零，可以继续抓取' : ''}。`);
  }
  function renderKeepItemDock() {
    const dock=$('#keep-item-dock');
    dock.hidden=!(plan.iconOnly && !plan.itemsView && plan.active==='keep' && plan.items.length);
    if(dock.hidden)return;
    const master=dock.querySelector('[data-action=items-master-toggle]');
    master.textContent=plan.itemBuyingPaused ? '恢复原配置' : '全部暂停';
    master.setAttribute('aria-pressed',String(plan.itemBuyingPaused===true));
    master.title=plan.itemBuyingPaused ? '恢复暂停前各道具的开关配置，不清零次数，已满项仍受限制' : '暂停全部道具抓取，保留各道具原开关，运行不中断';
    const rank=new Map(plan.itemIconOrder.map((id,index)=>[id,index]));
    const items=[...plan.items].sort((a,b)=>rank.get(a.id)-rank.get(b.id));
    const key=JSON.stringify([plan.itemIconSlots,items.map(item=>[plan.itemBuyingPaused===true,item,itemAvatarSource(item),itemState(item)])]);
    const focused=root.ownerDocument.activeElement?.closest?.('#keep-item-icons [data-id]')?.dataset.id;
    if(iconDrag?.list===$('#keep-item-icons') && iconListRenderKeys.get($('#keep-item-icons'))!==key)finishIconDrag();
    const changed=renderIconList($('#keep-item-icons'),key,()=>iconGridMarkup(plan.itemIconSlots,items,item=>{
      const name=Model.ITEMS.find(entry=>entry.id===item.id)?.name || item.name || item.id;
      return itemIconMarkup(item,name).replace('data-action="item-toggle"','data-action="item-quick-toggle"')
        .replace('aria-describedby="item-icon-mode-help"','aria-describedby="keep-item-help"')
        .replace('点击/双右键切换购买，拖到任意网格','点击/双右键切换抓取，运行不中断');
    },Model.MAX_ICON_GRID_CELLS));
    if(changed && focused)$('#keep-item-icons').querySelector(`[data-id="${CSS.escape(focused)}"]`)?.focus({preventScroll:true});
  }
  let quickItemQueue=Promise.resolve();
  function quickToggleItem(id) {
    quickItemQueue=quickItemQueue.catch(()=>{}).then(async()=>{
    if(destroyed)return;
    const item=plan.items.find(entry=>entry.id===id);if(!item)return;
    if(itemPurchaseState(item,plan.itemSession.used[item.id] || 0,itemOwnedCount(item.id))==='full'){toast('已满；快捷开关不会清零次数。');return;}
    // This switch never edits purchase totals or auto-use settings.
    const next=Model.normalizePlan({...plan,items:plan.items.map(entry=>entry.id===id ? {...entry,enabled:!entry.enabled} : entry)});
    plan=next;render();persist();
    // Publish only after durable saving, and validate the narrowly scoped edit again on the host.
    await saveQueue;
    if(destroyed)return;
    options.onPlanChange?.(Model.normalizePlan(plan),persistenceReady ? {liveItemToggle:id} : {});
    if(!persistenceReady)toast('道具开关保存失败，已请求暂停运行。');
    });
  }
  function toggleAllItemBuying() {
    quickItemQueue=quickItemQueue.catch(()=>{}).then(async()=>{
      if(destroyed)return;
      plan=Model.normalizePlan({...plan,itemBuyingPaused:!plan.itemBuyingPaused});
      render();persist();await saveQueue;
      if(destroyed)return;
      options.onPlanChange?.(Model.normalizePlan(plan),persistenceReady ? {liveItemPause:true} : {});
      toast(!persistenceReady ? '总开关保存失败，已请求暂停运行。' : plan.itemBuyingPaused ? '已暂停全部道具抓取，原配置保留。' : '已恢复原道具配置；已满项仍不买入，次数不清零。');
    });
  }
  function renderItems() {
    const key = JSON.stringify([plan.itemBuyingPaused===true,itemQuery,plan.items,plan.iconOnly,plan.iconOnly?plan.itemIconSlots:plan.itemSession.used,runtimeInfo.itemMatches,plan.iconOnly?null:runtimeInfo.useNotes,runtimeInfo.itemShelf,plan.iconOnly?null:(runtimeInfo.pending||[]).filter(entry=>entry.kind==='item')]);
    if (key === itemRenderKey) { updateItemOwnedCounts(); return; } // Live inventory text must not rebuild focused inputs.
    if (iconDrag?.kind === 'items') finishIconDrag();
    itemRenderKey = key; itemResetUntil = 0;
    const next = $('[data-action=item-next]'); next.textContent = '下一对局 · 清零道具次数';
    next.disabled = false;
    const itemName = item => Model.ITEMS.find(entry => entry.id === item.id)?.name || item.name || item.id;
    const q = itemQuery.trim().toLowerCase(), shown = q ? plan.items.filter(item => itemName(item).toLowerCase().includes(q) || item.id.toLowerCase().includes(q)) : [...plan.items];
    if (plan.iconOnly) {
      const rank = new Map(plan.itemIconOrder.map((id,index) => [id,index]));
      shown.sort((a,b) => rank.get(a.id) - rank.get(b.id));
    }
    $('#item-count').textContent = shown.length === plan.items.length ? `${plan.items.length} 件` : `${shown.length} / ${plan.items.length} 件`;
    $('#item-enabled-summary').textContent = plan.items.length ? `${plan.items.filter(item => item.enabled).length} 件启用 · 新增默认禁用` : '新增默认禁用 · 点启用后自动买入';
    const focus = document.activeElement?.closest?.('.item-row button,.item-icon-tile');
    const focusedId = focus?.dataset.id, focusedAction = focus?.dataset.action;
    const itemMarkup = item => {
      const knownItem = Model.ITEMS.find(entry => entry.id === item.id), name = knownItem?.name || item.name || item.id;
      if (plan.iconOnly) return itemIconMarkup(item,name);
      const used = plan.itemSession.used[item.id] || 0, capped = Model.itemCapReached(plan,item);
      const status = itemState(item);
      const pending = runtimeInfo.pending?.find(entry=>entry.kind==='item'&&entry.id===item.id);
      const state = item.capPaused ? '本局抓取已满 · 暂停买入，新对局自动恢复资格' : item.enabled ? pending ? `待识别 · ${pending.reason} · 暂不下单` : runtimeInfo.itemMatches?.[item.id] ? `已识别 ${runtimeInfo.itemMatches[item.id]} · 自动买入` : '等待游戏图鉴核对'
        : '已手动禁用 · 新对局仍不会自动买入';
      const tag = knownItem ? `<span class="rank">T${knownItem.tier}</span>` : '<span class="manual-badge">手动</span>';
      const useNote = runtimeInfo.useNotes?.[item.id] || (USE_WARNINGS[item.id] ?? '');
      return `<div class="operator-row item-row is-selected${status === 'disabled' ? ' is-disabled' : ''}" data-purchase-state="${status}" data-item-id="${esc(item.id)}" data-tier="${knownItem?.tier ?? 0}" role="group" aria-label="${esc(name)}，${ITEM_STATE_LABEL[status]}">
        <div class="row-select" title="${esc(name)} · ${esc(state)}">
          ${itemAvatar(item, name)}
          <span class="operator-text"><span class="operator-name"><strong>${esc(name)}</strong>${tag}</span><span class="operator-bonds" data-item-state-detail="${esc(item.id)}">${esc(state)}</span></span>
        </div>
        <div class="entry-actions">
          <button type="button" class="row-action row-power" data-action="item-toggle" data-item-state-label="${esc(item.id)}" data-id="${esc(item.id)}" aria-pressed="${item.enabled}" title="${itemStateHint(item)}" ${status === 'full' ? 'disabled' : ''}>${ITEM_STATE_LABEL[status]}</button>
          <button type="button" class="row-action" data-action="item-manual-off" data-item-full-disable="${esc(item.id)}" data-id="${esc(item.id)}" title="改为手动禁用，新对局也不恢复" ${status === 'full' ? '' : 'hidden'}>禁用</button>
          <button type="button" class="row-action row-more item-remove" data-action="item-remove" data-id="${esc(item.id)}" aria-label="移除道具 ${esc(name)}" title="移除道具">×</button>
        </div>
      </div><div class="keep-rules" role="group" aria-label="${esc(name)} 每局道具规则">
        <label class="item-limit-label">持有目标 <input type="number" min="1" max="99" step="1" value="${item.ownedTarget ?? ''}" placeholder="不限" data-item-target="${esc(item.id)}" aria-label="${esc(name)} 实时持有目标"></label>
        <label class="item-limit-label">抓取上限 <input type="number" min="1" max="99" step="1" value="${item.limit ?? ''}" placeholder="不限" data-item-limit="${esc(item.id)}" aria-label="${esc(name)} 每局抓取上限"></label>
        <span class="item-owned-count" data-item-owned="${esc(item.id)}" title="只统计当前仍持有的道具；人事部文档用后的永久效果不计作持有。">本局持有 —</span>
        <div class="item-stepper"><button type="button" data-action="item-minus" data-id="${esc(item.id)}" aria-label="减少 ${esc(name)} 本局已抓次数" ${used <= 0 ? 'disabled' : ''}>−</button><span>已抓 ${used}${item.limit != null ? ` / ${item.limit}` : ''}</span><button type="button" data-action="item-plus" data-id="${esc(item.id)}" aria-label="增加 ${esc(name)} 本局已抓次数" ${used >= (item.limit ?? 9999) ? 'disabled' : ''}>＋</button></div>
        <label class="item-funds-label">购买前资金 ＞ <input type="number" min="0" max="999999999" step="1" value="${item.minFunds??''}" placeholder="不限" data-item-funds="${esc(item.id)}" aria-label="${esc(name)} 购买前资金必须大于"></label>
        <label class="item-use-label${item.autoUse ? ' is-on' : ''}" title="运行中把手牌/整备区的该道具装备给最近获得的干员（战场优先，其次手牌区）；装备栏满则换下一名，绝不替换已佩戴装备。仅对装备即消耗的道具生效。"><input type="checkbox" data-item-use="${esc(item.id)}" ${item.autoUse ? 'checked' : ''} aria-label="${esc(name)} 自动使用：装备给最近获得的干员"> 自动使用 · 给最近干员</label>
        ${item.id==='chess_item_5_07_e_a'?`<label class="item-use-label${item.allowEquippedMerge?' is-on':''}" title="仅商业包装：允许买入时消耗已装备的普通包装来合成精锐，可能改变装备状态；不会自动装备合成产物，也不放宽其他装备保护。"><input type="checkbox" data-item-equipped-merge="${esc(item.id)}" ${item.allowEquippedMerge?'checked':''}> 允许已装备包装参与合成</label>`:''}
        ${item.autoUse && useNote ? `<span class="item-use-note">${esc(useNote)}</span>` : ''}
      </div>`;
    };
    renderIconList($('#item-list'),key,()=>shown.length ? (plan.iconOnly ? iconGridMarkup(plan.itemIconSlots,shown,itemMarkup,Model.MAX_ICON_GRID_CELLS) : shown.map(itemMarkup).join('')) : plan.items.length ? '<p class="item-empty">没有符合搜索的道具。</p>'
      : `<div class="empty">${icon('box')}<strong>还没有记录道具</strong><span>点“新增道具”，单击即可添加；<br>新增默认禁用，点“启用”后才自动买入。</span><button class="new-button" type="button" data-action="item-picker-open">${icon('plus')}新增道具</button></div>`);
    updateItemOwnedCounts();
    if (focusedId) $('#item-list').querySelector(`[data-action="${focusedAction}"][data-id="${CSS.escape(focusedId)}"]`)?.focus({preventScroll:true});
  }
  async function runtimeAction(type) {
    if (!options.onRuntimeAction) { toast('离线预览不连接对局，不会执行买卖或刷新。'); return; }
    try {
      if ((type==='auto.toggle' && !runtimeInfo.running && !runtimeInfo.starting)||(type==='ready.toggle' && !runtimeInfo.readyRunning)) {await saveQueue;if(!persistenceReady)throw new Error('名单尚未可靠保存，不能启动');}
      const result=await options.onRuntimeAction(type);
      if (result?.confirm) toast('再次点击“清空此服”确认；仅清除此服务器日志。');
      else if(type==='log-export') toast(`已导出本服务器 ${result.count} 条日志。`);
      else if(type==='log-clear') toast('此服务器日志已清空。');
      else if(type==='health.check') toast('自检已更新；不会启动交易。');
      return true;
    } catch(error) {toast(error.message || '工作台操作失败');return false;}
  }
  function operatorIconInfo(op, disabled, locked) {
    const on=!disabled.has(op.id), isKeep=plan.active==='keep';
    const held=isKeep ? keepOwnedCount(op.id) : null, limit=isKeep ? plan.keepRules[op.id]?.limit : null;
    const full=Number.isInteger(limit) && limit>0 && Number.isInteger(held) && held>=limit;
    const status=!on ? 'disabled' : full ? 'full' : 'enabled';
    const state=status==='full' ? '已满' : on ? '已启用' : '已禁用';
    const holding=isKeep ? `；持有 ${held ?? '待核对'}${limit != null ? ` / ${limit}` : '，目标不限'}` : '';
    const hint=!on ? '；手动禁用优先' : status==='full' ? '；已达持有目标，暂停补买，持有减少后恢复资格'
      : isKeep && held===null ? '；库存待核对，不按零持有下单' : '';
    return {on,status,label:`${op.name}，${state}${holding}`,
      title:`${op.name} · ${state}${holding}${hint}${locked.has(op.id) ? ' · 已锁定（仅防移除）' : ''}；点击/双右键切换，拖到任意网格`};
  }
  function iconTileMarkup(op, disabled, locked) {
    const info=operatorIconInfo(op,disabled,locked);
    return `<button type="button" class="operator-row icon-tile is-selected${locked.has(op.id) ? ' is-locked' : ''}${info.on ? '' : ' is-disabled'}" data-purchase-state="${info.status}" data-entry-id="${esc(op.id)}" data-entry-kind="${plan.active}" data-id="${esc(op.id)}" data-action="disable" aria-pressed="${info.on}" aria-label="${esc(info.label)}" aria-describedby="icon-mode-help" title="${esc(info.title)}">${operatorAvatar(op)}</button>`;
  }
  function keepOwnedCount(id) {
    const value = runtimeInfo.keepCounts?.[id];
    return Number.isInteger(value) && value >= 0 ? value : null;
  }
  function itemOwnedCount(id) {
    const value = runtimeInfo.itemOwnedCounts?.[id];
    return Number.isInteger(value) && value >= 0 ? value : null;
  }
  function updateItemOwnedCounts() {
    const items = new Map(plan.items.map(item => [item.id,item]));
    const totals={enabled:0,disabled:0,full:0};
    for(const item of plan.items)totals[itemState(item)]++;
    $('#item-enabled-summary').textContent=plan.items.length ? `启用 ${totals.enabled} · 禁用 ${totals.disabled} · 已满 ${totals.full}` : '新增默认禁用 · 点启用后自动买入';
    for(const row of root.querySelectorAll('#item-list .item-row[data-item-id],#keep-item-icons .item-row[data-item-id]')) {
      const item=items.get(row.dataset.itemId);if(!item)continue;
      const status=itemState(item);
      row.dataset.purchaseState=status;row.classList.toggle('is-disabled',status==='disabled');
      const button=row.querySelector('[data-item-state-label]');
      if(button){button.textContent=ITEM_STATE_LABEL[status];button.disabled=status==='full';button.title=itemStateHint(item);}
      const off=row.querySelector('[data-item-full-disable]');if(off)off.hidden=status!=='full';
      const detail=row.querySelector('[data-item-state-detail]');
      if(detail){
        const pending=runtimeInfo.pending?.find(entry=>entry.kind==='item'&&entry.id===item.id);
        detail.textContent=status!=='enabled' ? itemStateHint(item) : pending ? `待识别 · ${pending.reason} · 暂不下单` : runtimeInfo.itemMatches?.[item.id] ? `已识别 ${runtimeInfo.itemMatches[item.id]} · 自动买入` : '等待游戏图鉴核对';
      }
      if(!row.classList.contains('item-icon-tile'))row.setAttribute('aria-label',`${Model.ITEMS.find(entry=>entry.id===item.id)?.name || item.name || item.id}，${ITEM_STATE_LABEL[status]}`);
    }
    for (const node of root.querySelectorAll('#item-list [data-item-owned],#keep-item-icons [data-item-owned]')) {
      const id = node.dataset.itemOwned, held = itemOwnedCount(id), item = items.get(id);
      const label = held === null ? '本局持有 —' : `本局持有 ${held}`;
      if (node.classList.contains('item-owned-badge')) { node.textContent = held === null ? '' : String(held); node.hidden = held === null; }
      else if (node.textContent !== label) node.textContent = label;
      node.title = '只统计当前仍持有的道具 UID；人事部文档用后的永久效果不计作持有。';
      const tile = node.closest('.item-icon-tile');
      if (!tile || !item) continue;
      const name = Model.ITEMS.find(entry => entry.id === id)?.name || item.name || id;
      const owned = held === null ? '待核对' : held;
      const status = itemState(item), buying = ITEM_STATE_LABEL[status];
      tile.setAttribute('aria-label', `${name}，自动购买${buying}，本局持有 ${owned}`);
      const actionHint=tile.closest('#keep-item-icons') ? '点击/双右键切换抓取，运行不中断；拖到任意网格，与道具页同步' : '点击/双右键切换购买，拖到任意网格';
      tile.title = `${name} · 自动购买${buying}（${itemStateHint(item)}）；自动使用${item.autoUse ? '已开启' : '已关闭'}；本局持有 ${owned}；${actionHint}`;
    }
  }
  function render() {
    if(iconDrag && (!plan.iconOnly || (iconDrag.list.id==='keep-item-icons' ? plan.itemsView || plan.active!=='keep' : iconDrag.kind==='items' ? !plan.itemsView : plan.itemsView || plan.active!==iconDrag.kind)))finishIconDrag();
    known = new Map(Model.allOperators(catalogue, plan).map(op => [op.id, op]));
    root.classList.toggle('compact', plan.compact);
    root.classList.toggle('icon-only', plan.iconOnly);
    const itemsView = plan.itemsView === true;
    root.dataset.active = itemsView ? 'items' : plan.active; // theme accent: 买入 green / 保留 amber / 道具 violet
    for (const kind of Model.KINDS) {
      $(`#${kind}-total`).textContent = count(plan[kind].length); $(`#${kind}-count`).textContent = plan[kind].length;
      const tab = $(`#tab-${kind}`), on = !itemsView && kind === plan.active; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1;
    }
    $('#tab-items').setAttribute('aria-selected', String(itemsView)); $('#tab-items').tabIndex = itemsView ? 0 : -1;
    $('#item-tab-count').textContent = plan.items.length;
    for (const block of root.querySelectorAll('.main > .plan-toolbar, .main > .filters, .operator-heading, #operator-panel')) block.hidden = itemsView;
    $('#item-section').hidden = !itemsView;
    renderKeepItemDock();
    renderRuntime();
    const f = plan.filters[plan.active];
    const filterCount=Number(!!f.bond)+Number(!!f.tier)+Number(!!f.enabledOnly);
    $('#filter-count').hidden=!filterCount;$('#filter-count').textContent=filterCount;
    $('[data-action=filters]').setAttribute('aria-expanded',String(advancedOpen));$('#advanced-filter').hidden=!advancedOpen;
    $('[data-action=search-clear]').hidden=!f.query;
    $('#add-label').textContent=plan.active==='buy'?'新增买入干员':'新增保留干员';
    if (document.activeElement !== search) search.value = f.query;
    bond.value = f.bond;
    $('[data-action=selected]').setAttribute('aria-pressed', String(f.enabledOnly));
    for (const button of root.querySelectorAll('[data-tier-filter]')) button.setAttribute('aria-pressed', String(Number(button.dataset.tierFilter) === f.tier));
    for (const button of root.querySelectorAll('[data-width]')) button.setAttribute('aria-pressed', String(Number(button.dataset.width) === plan.width));
    for (const toggle of root.querySelectorAll('[data-action=compact]')) toggle.setAttribute(toggle.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(plan.compact));
    for (const toggle of root.querySelectorAll('[data-action=icons]')) toggle.setAttribute(toggle.getAttribute('role') === 'switch' ? 'aria-checked' : 'aria-pressed', String(plan.iconOnly));
    if(document.activeElement!==$('#ready-funds'))$('#ready-funds').value=plan.autoReady.funds===null?'':String(plan.autoReady.funds);
    $('[data-action=ready-skip]').setAttribute('aria-checked',String(plan.autoReady.skipTenth));
    renderHotkey();
    const locked = new Set(plan.locks[plan.active]), disabled = new Set(plan.disabled[plan.active]);
    const enabled = plan[plan.active].filter(id => !disabled.has(id)).length;
    $('#summary-title').textContent=plan.active==='buy'?'买入规则':'保留规则';
    $('#enabled-summary').textContent=`${enabled} 位启用 · ${locked.size} 位锁定`;
    $('#lock-count').textContent = `${locked.size} 位已锁定`;
    let visible = Model.addedOperators(catalogue, plan);
    if (plan.iconOnly) {
      const rank = new Map(plan.iconOrder[plan.active].map((id, index) => [id, index]));
      visible.sort((a, b) => rank.get(a.id) - rank.get(b.id));
    }
    $('#result-count').textContent = visible.length;
    $('#entry-total').textContent = visible.length === plan[plan.active].length ? '' : ` / ${plan[plan.active].length}`;
    $('[data-action=clear]').disabled = !plan[plan.active].some(id => !locked.has(id));
    const focus = document.activeElement?.closest?.('.operator-row button,.icon-tile');
    const focusedId = focus?.dataset.id, focusedAction = focus?.dataset.action;
    list.setAttribute('aria-labelledby', `tab-${plan.active}`);
    const rowKey=JSON.stringify([plan.active,plan.iconOnly,plan.iconOnly?plan.iconSlots[plan.active]:null,visible,visible.map(operatorAvatarSource),plan.disabled[plan.active],plan.locks[plan.active],plan.keepRules,runtimeInfo.matches,runtimeInfo.pending]);
    if(rowKey!==operatorRenderKey) {finishIconDrag();operatorRenderKey=rowKey;const operatorMarkup=op=>plan.iconOnly ? iconTileMarkup(op,disabled,locked) : `
      <div class="operator-row is-selected${locked.has(op.id) ? ' is-locked' : ''}${disabled.has(op.id) ? ' is-disabled' : ''}" data-tier="${op.tier}" data-entry-id="${esc(op.id)}" role="group" aria-label="${esc(op.name)}，${disabled.has(op.id) ? '已禁用' : '已启用'}">
        <div class="row-select" title="${esc(op.name)} · ${op.custom ? esc(manualHint(op)) : esc(op.id)} · 连续两次右键可禁用或启用">
          ${operatorAvatar(op)}
          <span class="operator-text"><span class="operator-name"><strong>${esc(op.name)}</strong>${op.custom ? `<span class="manual-badge">${manualBadge(op)}</span>` : `<span class="rank">T${op.tier}</span>`}${disabled.has(op.id) ? `<span class="disabled-badge">已禁用</span>` : ''}${op.hidden || op.diy ? `<span class="special-badge">${op.diy ? '自选' : '隐藏'}</span>` : ''}</span><span class="operator-bonds">${esc(opSubtitle(op))}</span></span>
        </div>
        <div class="entry-actions">
          <button type="button" class="row-action row-power" data-action="disable" data-id="${esc(op.id)}" aria-pressed="${!disabled.has(op.id)}" aria-label="${disabled.has(op.id) ? '启用' : '禁用'}${esc(op.name)}" title="${plan.active==='keep'?'按实时持有目标补足；点击手动启用/禁用':'点击切换；也可双右键'}">${disabled.has(op.id) ? '已禁用' : '启用'}</button>
          <button type="button" class="row-lock" data-action="lock" data-id="${esc(op.id)}" aria-pressed="${locked.has(op.id)}" aria-label="${locked.has(op.id) ? '解锁' : '锁定'}${esc(op.name)}" title="${locked.has(op.id) ? '点击解锁' : '锁定，防止移除'}">${icon(locked.has(op.id) ? 'lock' : 'unlock')}</button>
          <button type="button" class="row-action row-more" data-action="row-more" data-id="${esc(op.id)}" aria-label="更多操作：${esc(op.name)}" aria-haspopup="menu" aria-expanded="${menuId===op.id}">···</button>
        </div>
      </div>${plan.active==='keep' ? `<div class="keep-rules" role="group" aria-label="${esc(op.name)} 实时保留规则">
        <label class="item-limit-label">持有目标 <input type="number" min="1" max="99" step="1" value="${plan.keepRules[op.id]?.limit??''}" placeholder="不限" data-keep-limit="${esc(op.id)}" aria-label="${esc(op.name)} 持有目标（普通1，精二3）"></label>
        <div class="item-stepper"><span data-keep-owned="${esc(op.id)}">持有 —</span></div>
        <label class="item-funds-label">购买前资金 ＞ <input type="number" min="0" max="999999999" step="1" value="${plan.keepRules[op.id]?.minFunds??''}" placeholder="不限" data-keep-funds="${esc(op.id)}" aria-label="${esc(op.name)} 购买前资金必须大于"></label>
      </div>`:''}`;renderIconList(rows,rowKey,()=>visible.length ? (plan.iconOnly ? iconGridMarkup(plan.iconSlots[plan.active],visible,operatorMarkup,Model.MAX_ICON_GRID_CELLS) : visible.map(operatorMarkup).join('')) : !plan[plan.active].length
      ? `<div class="empty">${icon('plus')}<strong>还没有添加干员</strong><span>点击“新增”，单击候选干员即可添加。<br>常态仅显示你已添加的名单。</span><button class="new-button" type="button" data-action="add-open">${icon('plus')}新增干员</button></div>`
      : `<div class="empty">${icon('search')}<strong>没有符合条件的已添加项</strong><span>试试其他名称、阶级或盟约，<br>或关闭“只看启用”以查看禁用项。</span><button class="text-button" type="button" data-action="reset-filter">重置筛选</button></div>`);}
    // 库存推送就地更新数量和图标状态，不重建图片、输入框或拖动中的图标。
    for(const tile of rows.querySelectorAll('.icon-tile[data-entry-id]')) {
      const op=known.get(tile.dataset.entryId);if(!op)continue;
      const info=operatorIconInfo(op,disabled,locked);
      tile.dataset.purchaseState=info.status;
      tile.classList.toggle('is-disabled',!info.on);
      tile.setAttribute('aria-pressed',String(info.on));
      tile.setAttribute('aria-label',info.label);
      tile.title=info.title;
    }
    for (const node of rows.querySelectorAll('[data-keep-owned]')) {
      const id = node.dataset.keepOwned, held = keepOwnedCount(id), limit = plan.keepRules[id]?.limit;
      const text = `持有 ${held ?? '—'}${limit != null ? ` / ${limit}` : ''}`;
      if (node.textContent !== text) node.textContent = text;
      node.title = held === null ? '等待可核对的游戏库存；不会按零持有量下单'
        : `战场＋手牌/备战区＋临时区；普通1，精二3。${limit != null && held >= limit ? '已达标，暂停购买；数量减少后自动补抓。' : '数量不足时按资金门槛补足；手动禁用优先。'}`;
    }
    if (focusedId && visible.some(op => op.id === focusedId)) list.querySelector(`[data-action="${focusedAction}"][data-id="${CSS.escape(focusedId)}"]`)?.focus({ preventScroll: true });
    const names = plan[plan.active].map(id => known.get(id)).filter(Boolean);
    $('#chips').innerHTML = names.length ? names.slice(0,4).map(op => `<span class="chip${locked.has(op.id) ? ' locked' : ''}${disabled.has(op.id) ? ' disabled' : ''}" title="${esc(op.name)}${disabled.has(op.id) ? ' · 已禁用' : ''}${locked.has(op.id) ? ' · 已锁定' : ''}">${disabled.has(op.id) ? '停 ' : locked.has(op.id) ? '⌑ ' : ''}${esc(op.name)}</span>`).join('') + (names.length > 4 ? `<span class="chip">+${names.length - 4}</span>` : '') : '<span class="placeholder">点击“新增”整理你的干员名单。</span>';
    renderPicker();renderEntryMenu();renderItems();renderItemPicker();
  }
  function renderPicker() {
    if (activeModal !== 'picker') return;
    $('#picker-title').textContent = plan.active === 'buy' ? '新增买入干员' : '新增保留干员';
    if (document.activeElement !== pickerSearch) pickerSearch.value = pickerFilter.query;
    pickerBond.value = pickerFilter.bond;
    for (const button of root.querySelectorAll('[data-picker-tier]')) button.setAttribute('aria-pressed', String(Number(button.dataset.pickerTier) === pickerFilter.tier));
    const visible = Model.candidateOperators(catalogue, plan, pickerFilter).filter(op=>!op.unavailable), added = new Set(plan[plan.active]);
    for(const id of plan[plan.active]) if(runtimeInfo.matches?.[id]) added.add(runtimeInfo.matches[id]);
    $('#picker-result-count').textContent = visible.length;
    $('#picker-added-count').textContent = added.size;
    const focus = document.activeElement?.closest?.('[data-action=add-candidate]');
    const focusedId = focus?.dataset.id;
    const pickerKey = JSON.stringify([plan.active, visible.map(op => [op, added.has(op.id), opSubtitle(op), op.custom ? manualBadge(op) : '', operatorAvatarSource(op)])]);
    if (!renderIconList(pickerList, pickerKey, () => visible.length ? visible.map(op => `<div class="picker-row${added.has(op.id) ? ' is-added' : ''}" role="listitem" data-tier="${op.tier}">
      <button class="picker-add" type="button" data-action="add-candidate" data-id="${esc(op.id)}" ${added.has(op.id) ? 'disabled' : ''} aria-label="${added.has(op.id) ? '已添加' : '添加'}${esc(op.name)}" title="${esc(op.id)}">
        ${operatorAvatar(op)}
        <span class="operator-text"><span class="operator-name"><strong>${esc(op.name)}</strong>${op.custom ? `<span class="manual-badge">${manualBadge(op)}</span>` : `<span class="rank">T${op.tier}</span>`}${op.hidden || op.diy ? `<span class="special-badge">${op.diy ? '自选' : '隐藏'}</span>` : ''}</span><span class="operator-bonds">${esc(opSubtitle(op))}</span></span>
        <span class="picker-add-label">${icon(added.has(op.id) ? 'check' : 'plus')}${added.has(op.id) ? '已添加' : '添加'}</span>
      </button></div>`).join('') : `<div class="empty">${icon('search')}<strong>没有符合条件的候选干员</strong><button class="text-button" type="button" data-action="picker-reset">重置候选筛选</button></div>`)) return;
    if (focusedId) {
      const same = pickerList.querySelector(`[data-id="${CSS.escape(focusedId)}"]`);
      const index = visible.findIndex(op => op.id === focusedId);
      const next = visible.slice(index + 1).find(op => !added.has(op.id));
      const target = same && !same.disabled ? same : next ? pickerList.querySelector(`[data-id="${CSS.escape(next.id)}"]`) : pickerSearch;
      target?.focus({ preventScroll: true });
    }
  }
  function closeMenus() {
    menuId=null;clearUntil=0;$('#entry-menu').hidden=true;$('#bulk-menu').hidden=true;
    $('[data-action=bulk-more]').setAttribute('aria-expanded','false');
    $('[data-action=clear]').textContent='清空未锁定项';$('#clear-hint').textContent='点击后需要再次确认';
    for(const button of root.querySelectorAll('[data-action=row-more]'))button.setAttribute('aria-expanded','false');
  }
  function renderEntryMenu() {
    if(!menuId || !known.has(menuId) || !plan[plan.active].includes(menuId)){menuId=null;$('#entry-menu').hidden=true;return;}
    const anchor=list.querySelector(`[data-action=row-more][data-id="${CSS.escape(menuId)}"]`);
    if(!anchor){menuId=null;$('#entry-menu').hidden=true;return;}
    const menu=$('#entry-menu'),rect=anchor.getBoundingClientRect();
    menu.hidden=false;$('#entry-menu-name').textContent=known.get(menuId).name;
    const remove=menu.querySelector('[data-action=remove]');remove.dataset.id=menuId;remove.disabled=plan.locks[plan.active].includes(menuId);
    const width=Math.min(220,innerWidth-24),height=menu.offsetHeight;
    menu.style.width=width+'px';menu.style.left=Math.max(12,Math.min(rect.right-width,innerWidth-width-12))+'px';menu.style.top=Math.max(12,Math.min(rect.bottom+5,innerHeight-height-12))+'px';
    anchor.setAttribute('aria-expanded','true');
  }
  function showEntryMenu(id) {const next=menuId===id?null:id;closeMenus();menuId=next;renderEntryMenu();if(menuId)$('#entry-menu [data-action=remove]:not(:disabled)')?.focus();}
  // ---- 启停快捷键 ----
  function renderHotkey() {
    const label = plan.hotkey ? Model.hotkeyLabel(plan.hotkey) : '';
    if (!recordingHotkey) { $('#hotkey-label').textContent = plan.hotkey ? label : '已关闭'; $('.hotkey-button span').textContent = '点击修改'; }
    $('.hotkey-button').setAttribute('aria-pressed', String(recordingHotkey));
    $('[data-action=hotkey-off]').disabled = !plan.hotkey;
    $('[data-action=hotkey-reset]').disabled = !!plan.hotkey && plan.hotkey.code === 'F8' && !plan.hotkey.ctrl && !plan.hotkey.alt && !plan.hotkey.shift;
    $('#hotkey-chip').hidden = !plan.hotkey; $('#hotkey-chip').textContent = label;
    $('.run-button').title = plan.hotkey ? `快捷键 ${label}` : '';
    const clash = Model.gameHotkeyConflict(plan.hotkey, gameKeys());
    if (!recordingHotkey) hotkeyError(clash ? `当前快捷键 ${label} 与游戏「${clash}」冲突：在游戏画面按下时会让给游戏，请换一个。` : '');
  }
  // 已连接时用游戏当前的改键设置；离线预览按游戏默认键（R / F / D / Q / X / 空格）检查。
  const gameKeys = () => Model.normalizeGameKeys(runtimeInfo.gameKeys);
  function hotkeyError(message) { $('#hotkey-error').textContent = message; $('#hotkey-error').hidden = !message; }
  function recordHotkey(on) {
    recordingHotkey = on; hotkeyError('');
    if (on) { $('#hotkey-label').textContent = '请按键…'; $('.hotkey-button span').textContent = 'Esc 取消'; }
    renderHotkey();
  }
  function captureHotkey(event) {
    event.preventDefault(); event.stopPropagation();
    if (event.repeat || ['Shift','Control','Alt','Meta','AltGraph','OS'].includes(event.key)) return;
    if (event.key === 'Escape' && !event.ctrlKey && !event.altKey && !event.shiftKey) { recordHotkey(false); return; }
    const combo = Model.hotkeyFromEvent(event), problem = Model.hotkeyProblem(combo, gameKeys());
    if (problem) { hotkeyError(`${Model.hotkeyLabel(combo)}：${problem}`); return; }
    recordHotkey(false); change({ ...plan, hotkey: Model.normalizeHotkey(combo) });
    toast(`启停快捷键已改为 ${Model.hotkeyLabel(plan.hotkey)}。`);
  }
  async function hotkeyToggle(label) {
    const wasRunning = runtimeInfo.running || runtimeInfo.starting;
    if (!wasRunning) toast(`已按快捷键 ${label}，正在启动…`);
    const ok = await runtimeAction('auto.toggle');
    if (ok && options.onRuntimeAction && !destroyed) toast(wasRunning ? `已按快捷键 ${label} 停止自动倒转。` : `已按快捷键 ${label} 启动自动倒转。`);
  }
  // 工作台自身有焦点时（面板 iframe 内），游戏页收不到按键，这里接管。
  const documentHotkey = event => {
    if (destroyed || recordingHotkey || !event.isTrusted || !Model.matchesHotkey(plan.hotkey, event)) return;
    if (Model.hotkeyIsTyping(plan.hotkey) && (event.isComposing || event.target?.isContentEditable || event.target?.closest?.('input,textarea,select'))) return;
    event.preventDefault(); event.stopPropagation();
    if (event.repeat || Date.now() - lastHotkey < 350) return;
    lastHotkey = Date.now(); void hotkeyToggle(Model.hotkeyLabel(plan.hotkey));
  };
  function change(next) { plan = Model.normalizePlan(next); render(); persist(); options.onPlanChange?.(Model.normalizePlan(plan)); }
  function modal(name) {
    closeMenus();
    finishIconDrag();
    if (name !== activeModal) feedback.clear();
    if (name && !activeModal) lastFocus = document.activeElement;
    const previous = activeModal;
    activeModal = name;
    if (recordingHotkey && name !== 'settings') recordHotkey(false);
    $('.settings-backdrop').hidden = name !== 'settings';
    $('.picker-backdrop').hidden = name !== 'picker';
    $('.item-picker-backdrop').hidden = name !== 'items';
    $('.utility-backdrop').hidden = !['logs','health'].includes(name);
    $('#log-view').hidden=name!=='logs';$('#health-view').hidden=name!=='health';
    $('#utility-title').textContent=name==='health'?'运行自检':'执行日志';
    for (const block of root.querySelectorAll('.brand,.context,.main,.footer')) block.inert = Boolean(name);
    if (name === 'settings') $('[data-action=settings-close]').focus();
    else if (name === 'picker') pickerSearch.focus();
    else if (name === 'items') itemPickerSearch.focus();
    else if (['logs','health'].includes(name)) $('[data-action=utility-close]').focus();
    else if (previous && lastFocus?.isConnected) lastFocus.focus();
  }
  // ---- 配置导入 / 导出 ----
  let memoryBackup = null;
  const pad = n => String(n).padStart(2, '0');
  const stamp = date => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  const timeLabel = iso => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  function configError(text) { $('#config-error').textContent = text; $('#config-error').hidden = !text; }
  async function readBackup() { try { return storage.getBackup ? await storage.getBackup() : memoryBackup; } catch { return null; } }
  async function renderBackup() {
    const backup = await readBackup(), button = $('.config-restore'); if (destroyed) return;
    const ok = backup && typeof backup === 'object' && backup.config;
    button.hidden = !ok; if (ok) button.textContent = `恢复导入前的配置（${timeLabel(backup.savedAt) || '上一份'}）`;
  }
  function exportConfigFile() {
    const data = Model.exportConfig(plan, { app: version ? `卫戍协议拿牌器 v${version}` : '卫戍协议拿牌器' });
    try {
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `卫戍协议拿牌器配置-${stamp(new Date())}.json`;
      document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      configError(''); toast(`已导出配置：买入 ${plan.buy.length}、保留 ${plan.keep.length}、道具 ${plan.items.length}。`);
    } catch { configError('导出失败：浏览器拒绝下载文件。'); }
    return data;
  }
  async function applyConfig(input, source = '导入') {
    const result = Model.importConfig(input, plan);
    if (!result.ok) {
      const messages = { size: '文件太大（超过 1 MB），不是本工具导出的配置。', json: '文件不是有效的 JSON，未导入。', format: '不是卫戍协议拿牌器的配置文件，未导入。', version: '配置文件来自更新版本的卫戍协议拿牌器，请先更新扩展。' };
      configError(messages[result.reason] || '导入失败，当前配置未改变。'); return result;
    }
    if(runtimeInfo.readyRunning || runtimeInfo.readyBusy){if(!await runtimeAction('ready.stop'))return {ok:false,reason:'ready'};}
    const backup = { savedAt: new Date().toISOString(), config: Model.exportConfig(plan) };
    try { if (storage.setBackup) await storage.setBackup(backup); else memoryBackup = backup; }
    catch { configError('备份当前配置失败，已取消导入。'); return { ok: false, reason: 'backup' }; }
    if (destroyed) return result;
    const widthChanged = result.plan.width !== plan.width;
    change(result.plan); if (widthChanged) onResize(plan.width);
    configError(''); void renderBackup();
    const s = result.summary;
    toast(`${source}完成：买入 ${s.buy}、保留 ${s.keep}、道具 ${s.items}${s.custom ? `、自编 ${s.custom}` : ''}；原配置已备份，可在设置里恢复。`);
    return result;
  }
  async function importConfigFile(file) {
    if (!file) return;
    if (file.size > Model.MAX_CONFIG_CHARS) { configError('文件太大（超过 1 MB），不是本工具导出的配置。'); return; }
    let text = '';
    try { text = await file.text(); } catch { configError('无法读取文件。'); return; }
    await applyConfig(text);
  }
  async function restoreBackup() {
    const backup = await readBackup();
    if (!backup?.config) { configError('没有可恢复的备份。'); void renderBackup(); return; }
    await applyConfig(backup.config, '恢复');
  }
  // ---- 道具选择弹窗：静态图鉴 + 已连接时本服 items.json（价格、效果、图鉴外新道具） ----
  const plain = value => String(value ?? '').toLowerCase();
  function itemCandidates() {
    const shelf = Array.isArray(runtimeInfo.itemShelf) ? runtimeInfo.itemShelf : [], byId = new Map(shelf.map(entry => [entry.id, entry]));
    const staticIds = new Set(Model.ITEMS.map(item => item.id));
    const all = [...Model.ITEMS.map(item => ({ ...item, ...(byId.get(item.id) || {}), name: item.name, tier: item.tier, server: false })),
      ...shelf.filter(entry => entry.shop !== false && !staticIds.has(entry.id) && !Model.ITEMS.some(item => item.name === entry.name)).map(entry => ({ ...entry, server: true }))];
    return all.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name, 'zh-CN'));
  }
  function itemAdded(candidate) {
    if (plan.items.some(item => item.id === candidate.id)) return true;
    const matched = new Set(Object.values(runtimeInfo.itemMatches || {}));
    return matched.has(candidate.id) || plan.items.some(item => item.name && item.name.trim() === candidate.name);
  }
  function renderItemPicker() {
    if (activeModal !== 'items') return;
    if (document.activeElement !== itemPickerSearch) itemPickerSearch.value = itemPickerFilter.query;
    for (const button of root.querySelectorAll('[data-item-tier]')) button.setAttribute('aria-pressed', String(Number(button.dataset.itemTier) === itemPickerFilter.tier));
    const q = plain(itemPickerFilter.query).trim();
    const visible = itemCandidates().filter(item => (!itemPickerFilter.tier || item.tier === itemPickerFilter.tier) &&
      (!q || plain(item.name).includes(q) || plain(item.id).includes(q) || plain(item.desc).includes(q)));
    $('#item-picker-count').textContent = visible.length; $('#item-picker-added').textContent = plan.items.length;
    const focusedId = document.activeElement?.closest?.('[data-item-pick]')?.dataset.itemPick;
    const pickerKey = JSON.stringify([!!runtimeInfo.itemShelf, visible.map(item => [item, itemAdded(item), itemAvatarSource(item)])]);
    if (!renderIconList(itemPickerList, pickerKey, () => visible.length ? visible.map(item => { const added = itemAdded(item); return `<div class="picker-row${added ? ' is-added' : ''}" role="listitem" data-tier="${item.tier}">
      <button class="picker-add" type="button" data-item-pick="${esc(item.id)}" ${added ? 'disabled' : ''} aria-label="${added ? '已记录' : '添加'}${esc(item.name)}" title="${esc(item.desc ? `${item.name}：${item.desc}` : item.id)}">
        ${itemAvatar(item)}
        <span class="operator-text"><span class="operator-name"><strong>${esc(item.name)}</strong><span class="rank">T${item.tier}</span>${Number.isSafeInteger(item.price) ? `<span class="price-badge">${item.price} 币</span>` : ''}${item.server ? '<span class="manual-badge">本服新增</span>' : ''}${USE_WARNINGS[item.id] ? '<span class="special-badge">注意</span>' : ''}</span><span class="operator-bonds">${esc(item.desc || (runtimeInfo.itemShelf ? '本服数据未提供说明' : '连接游戏后显示价格与效果'))}</span></span>
        <span class="picker-add-label">${icon(added ? 'check' : 'plus')}${added ? '已记录' : '添加'}</span>
      </button></div>`; }).join('') : `<div class="empty">${icon('search')}<strong>没有符合条件的道具</strong><span>图鉴里没有时，可在下方手动录入名称。</span></div>`)) return;
    if (focusedId) {
      const index = visible.findIndex(item => item.id === focusedId), next = visible.slice(index + 1).find(item => !itemAdded(item));
      (next ? itemPickerList.querySelector(`[data-item-pick="${CSS.escape(next.id)}"]`) : itemPickerSearch)?.focus({ preventScroll: true });
    }
  }
  function openItemPicker() {
    itemPickerFilter = { query: '', tier: 0 }; itemPickerSearch.value = ''; itemPickerList.scrollTop = 0;
    itemManualName.value = ''; itemManualName.removeAttribute('aria-invalid'); $('#item-manual-error').hidden = true; $('#item-manual-error').textContent = '';
    $('#item-picker-feedback').textContent = '单击即添加，可连续选择；已记录的道具不会重复加入。';
    modal('items'); renderItemPicker();
  }
  function pickItem(id) {
    const candidate = itemCandidates().find(item => item.id === id); if (!candidate || itemAdded(candidate)) return;
    const result = candidate.server
      ? Model.addNamedItem(plan, candidate.name, 'manual_item_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join(''))
      : Model.addItem(plan, candidate.id);
    if (!result.changed) { $('#item-picker-feedback').textContent = result.reason === 'capacity' ? '道具记录已满，请先移除其他条目。' : '该道具已经记录。'; return; }
    change(result.plan);
    $('#item-picker-feedback').textContent = `已添加「${candidate.name}」：默认禁用、抓取不限，回到道具页点“启用”后才会购买。`;
  }
  function openPicker() {
    pickerFilter = { query: '', bond: '', tier: 0 };
    pickerSearch.value = ''; pickerList.scrollTop = 0; lastRight = null;
    manualName.value = ''; manualName.removeAttribute('aria-invalid'); $('#manual-error').hidden = true; $('#manual-error').textContent = '';
    $('#picker-feedback').textContent = '单击即添加，可连续选择多位；已添加项不会重复加入。';
    modal('picker'); renderPicker();
  }
  function submitManual(event) {
    event.preventDefault();
    if (activeModal !== 'picker') return;
    const randomId = 'manual_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    const bound=new Set(Object.values(runtimeInfo.matches || {}));
    const inputCatalogue={...catalogue,operators:catalogue.operators.filter(op=>!bound.has(op.id))};
    const result = Model.addNamedOperator(inputCatalogue, plan, manualName.value, randomId);
    if (result.reason === 'duplicate') {
      $('#manual-error').hidden = true; $('#manual-error').textContent = ''; manualName.removeAttribute('aria-invalid');
      $('#picker-feedback').textContent = `当前名单已包含「${result.name}」，不会重复添加；禁用状态保持不变。`;
      manualName.focus(); manualName.select(); return;
    }
    if (result.reason) {
      const messages = { empty: '请输入干员名。', name: '名称最多 40 个字符，不能包含控制字符。', capacity: '名单已满，请先移除不需要的条目。', id: '条目标识生成失败，请重试。' };
      $('#manual-error').textContent = messages[result.reason] || '添加失败，请检查名称。';
      $('#manual-error').hidden = false; manualName.setAttribute('aria-invalid', 'true'); manualName.focus(); return;
    }
    change(Model.updateFilter(result.plan, { query: '', bond: '', tier: 0, selectedOnly: false, enabledOnly: false }));
    list.scrollTop = list.scrollHeight;
    $('#picker-feedback').textContent = result.custom
      ? `已手动添加「${result.name}」。无法在本服唯一匹配时会持续提示待识别；其他规则照常运行。`
      : `已添加目录中的干员「${result.name}」，无需创建重复的自定义条目。`;
    manualName.value = ''; manualName.removeAttribute('aria-invalid'); $('#manual-error').hidden = true; $('#manual-error').textContent = ''; manualName.focus();
  }
  function submitItemManual(event) {
    event.preventDefault();
    const randomId = 'manual_item_' + Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    const result = Model.addNamedItem(plan,itemManualName.value,randomId);
    if (!result.changed) {
      const messages = { empty:'请输入道具名。', name:'名称最多 40 个字符，不能包含控制字符。', duplicate:'此道具已记录，不会重复添加。', capacity:'道具记录已满，请先移除其他条目。', id:'标识生成失败，请重试。' };
      $('#item-manual-error').textContent = messages[result.reason] || '添加失败，请检查名称。';
      $('#item-manual-error').hidden = false; itemManualName.setAttribute('aria-invalid','true'); itemManualName.focus(); return;
    }
    change(result.plan);
    toast(`已添加道具「${result.name}」，默认禁用、抓取不限；点“启用”后才会自动买入。`);
    $('#item-picker-feedback').textContent = `已手动录入「${result.name}」：连接游戏后按名称匹配。`;
    itemManualName.value='';itemManualName.removeAttribute('aria-invalid');$('#item-manual-error').hidden=true;$('#item-manual-error').textContent='';itemManualName.focus();
  }
  function itemChange(event) {
    const input = event.target;
    const optional = (value,max) => value.trim()==='' ? null : /^\d+$/.test(value.trim()) && Number(value)<=max ? Number(value) : undefined;
    let result;
    if(input.matches('[data-item-use]')) {
      const id=input.dataset.itemUse, item=plan.items.find(entry=>entry.id===id);if(!item)return;
      result=Model.setItemAutoUse(plan,id,input.checked);
      if(result.changed){const name=Model.ITEMS.find(entry=>entry.id===id)?.name||item.name||id;
        toast(input.checked?`「${name}」开启自动使用：运行中会装备给最近获得的干员（战场优先，装备栏满则跳过）。${USE_WARNINGS[id]?' '+USE_WARNINGS[id]:''}`:`「${name}」已关闭自动使用。`);}
    } else if(input.matches('[data-item-equipped-merge]')) {
      result=Model.setItemEquippedMerge(plan,input.dataset.itemEquippedMerge,input.checked);
      if(result.changed)toast(input.checked?'已授权：仅商业包装买入可消耗已装备普通件合成；其他装备仍受保护。交易仍须手动启动。':'已恢复保护：不再自动消耗已装备的普通包装。');
    } else if(input.matches('[data-item-target]')) {
      const previous=plan.items.find(item=>item.id===input.dataset.itemTarget);if(!previous)return;
      const value=optional(input.value,99);
      if(value===undefined||value!==null&&value<1){input.value=previous.ownedTarget??'';toast('道具持有目标须为 1–99，或留空表示不限。');return;}
      result=Model.setItemOwnedTarget(plan,previous.id,value);
    } else if(input.matches('[data-item-limit]')) {
      const previous=plan.items.find(item=>item.id===input.dataset.itemLimit);if(!previous)return;
      const value=optional(input.value,99);if(value===undefined||value!==null&&value<1){input.value=previous.limit??'';toast('道具抓取上限须为 1–99，或留空表示不限。');return;}
      result=Model.setItemLimit(plan,previous.id,value);
    } else if(input.matches('[data-item-funds],[data-keep-funds],[data-keep-limit]')) {
      const kind=input.dataset.itemFunds!==undefined?'item':input.dataset.keepFunds!==undefined?'funds':'limit';
      const id=input.dataset.itemFunds??input.dataset.keepFunds??input.dataset.keepLimit;
      const value=optional(input.value,kind==='limit'?99:999999999);
      if(value===undefined || kind==='limit' && value!==null && value<1) {
        input.value=kind==='item'?plan.items.find(item=>item.id===id)?.minFunds??'':kind==='funds'?plan.keepRules[id]?.minFunds??'':plan.keepRules[id]?.limit??'';
        toast(kind==='limit'?'干员持有目标须为 1–99 或留空。':'资金门槛须为 0–999999999 或留空。');return;
      }
      result=kind==='item'?Model.setItemMinFunds(plan,id,value):kind==='funds'?Model.setKeepMinFunds(plan,id,value):Model.setKeepLimit(plan,id,value);
    } else return;
    if (result.changed) change(result.plan);
  }
  function resetItemConfirm() {
    itemResetUntil=0;
    $('[data-action=item-next]').textContent='下一对局 · 清零道具次数';
  }
  function toggleEntry(id) {
    const result = Model.toggleDisabled(plan, id);
    if (result.reason) return;
    change(result.plan);
    toast(plan.disabled[plan.active].includes(id) ? `已禁用${known.get(id)?.name || id}。该项仍保留在名单中。`
      : `已启用${known.get(id)?.name || id}${plan.active==='keep' ? '，按当前持有量补足目标' : ''}。`);
  }
  // Internal pointer drags only. Never accept external IDs or cross-list membership changes.
  const iconListKind = () => plan.itemsView ? 'items' : plan.active;
  const iconListIds = kind => kind==='items' ? plan.items.map(item=>item.id) : plan[kind];
  const tileGrid = tile => tile?.closest?.('#operator-rows,#item-list,#keep-item-icons');
  function canMoveGrid(kind,list){
    if(list.id==='keep-item-icons')return true;
    if(kind==='items')return !itemQuery.trim();
    const f=plan.filters[kind];return !f.query.trim() && !f.bond && !f.tier && !f.enabledOnly;
  }
  const pointerTile = event => {
    const tile=event.target.closest?.('.icon-tile'), grid=tileGrid(tile);
    return plan.iconOnly && !activeModal && grid && root.contains(grid) ? tile : null;
  };
  function cleanupFlip(state) {
    if (state?.flipFrame) root.ownerDocument.defaultView.cancelAnimationFrame(state.flipFrame);
    for (const node of state?.flipNodes || []) {
      node.style.removeProperty('transform'); node.style.removeProperty('transition');
    }
    if (state) { state.flipFrame = 0; state.flipNodes = []; }
  }
  function finishIconDrag() {
    const state = iconDrag;
    iconDrag = null;
    if (!state) return;
    root.classList.remove('is-icon-grid-dragging');state.list.classList.remove('is-grid-active');
    if(state.mode==='drag' || state.mode==='scroll')ignoreIconClickUntil=performance.now()+400;
    if (state.pressTimer) clearTimeout(state.pressTimer);
    if (state.scrollFrame) root.ownerDocument.defaultView.cancelAnimationFrame(state.scrollFrame);
    cleanupFlip(state);
    if (state.pointerCaptured && root.hasPointerCapture?.(state.pointerId)) {
      try { root.releasePointerCapture(state.pointerId); } catch {}
    }
    for (const node of root.querySelectorAll('.is-dragging,[data-drop-edge]')) {
      node.classList.remove('is-dragging'); node.removeAttribute('data-drop-edge');
    }
    if (state.ghost) {
      state.source.style.cssText = state.sourceStyle;
      state.source.classList.remove('is-dragging','is-drag-ghost'); state.source.removeAttribute('data-drop-edge');
      if (state.sourceAriaHidden === null) state.source.removeAttribute('aria-hidden');
      else state.source.setAttribute('aria-hidden', state.sourceAriaHidden);
      if (state.sourceTabIndex === null) state.source.removeAttribute('tabindex');
      else state.source.setAttribute('tabindex', state.sourceTabIndex);
      state.ghost.remove();
      if(state.originalChildren)restoreGridDom(state);
      else if (state.placeholder?.isConnected) state.placeholder.replaceWith(state.source);
    }
  }
  function captureIconPointer(state, event) {
    try { root.setPointerCapture(event.pointerId); state.pointerCaptured = true; }
    catch { state.pointerCaptured = false; }
  }
  function animateGridPreview(state,cell) {
    if(cell===state.targetCell)return;
    const next=Model.previewIconGrid(state.baseSlots,state.id,cell);
    if(!next && cell!==state.baseSlots.indexOf(state.id)){state.invalidCell=true;return;}
    state.invalidCell=false;state.targetCell=cell;
    cleanupFlip(state);
    previewGridDom(state,next || state.baseSlots,Model.MAX_ICON_GRID_CELLS,cell);
  }
  function pointCell(state,x,y){
    return pointGridCell(state.list,state.scroller,x,y,Model.MAX_ICON_GRID_CELLS);
  }
  function updateIconGhost(state, x, y) {
    state.x = x; state.y = y;
    state.source.style.left = `${x - state.offsetX}px`;
    state.source.style.top = `${y - state.offsetY}px`;
    const cell=pointCell(state,x,y);
    if(cell!==null)animateGridPreview(state,cell);
  }
  function scrollVelocity(state) {
    const rect = state.scroller.getBoundingClientRect(), edge = Math.min(54,Math.max(28,rect.height * .16));
    if (state.y < rect.top + edge) return -Math.min(16,Math.ceil((rect.top + edge - state.y) * .32));
    if (state.y > rect.bottom - edge) return Math.min(16,Math.ceil((state.y - (rect.bottom - edge)) * .32));
    return 0;
  }
  function autoScrollIconDrag(state) {
    const view = root.ownerDocument.defaultView;
    if (state.scrollFrame || state.mode !== 'drag' || !scrollVelocity(state)) return;
    const tick = () => {
      if (iconDrag !== state || state.mode !== 'drag') return;
      state.scrollFrame = 0;
      const amount = scrollVelocity(state);
      if (amount) {
        const before = state.scroller.scrollTop;
        state.scroller.scrollTop += amount;
        if (state.scroller.scrollTop !== before) updateIconGhost(state,state.x,state.y);
        state.scrollFrame = view.requestAnimationFrame(tick);
      }
    };
    state.scrollFrame = view.requestAnimationFrame(tick);
  }
  function beginPointerIconDrag(state,event) {
    if (iconDrag !== state || state.mode === 'drag' || !state.source.isConnected) return;
    if (state.pressTimer) { clearTimeout(state.pressTimer); state.pressTimer = 0; }
    event?.preventDefault();
    const rect = state.source.getBoundingClientRect(), list = state.list;
    const placeholder = root.ownerDocument.createElement('div');
    placeholder.className = 'icon-drop-placeholder'; placeholder.setAttribute('aria-hidden','true');
    placeholder.style.width = `${rect.width}px`; placeholder.style.height = `${rect.height}px`;
    const source = state.source;
    state.originalChildren=[...list.children];
    state.baseSlots=[...Model.iconGridSlots(plan,state.kind)];state.targetCell=state.baseSlots.indexOf(state.id);
    state.cellCount=list.children.length;
    state.tileNodes=new Map([...list.querySelectorAll('.icon-tile')].map(node=>[node.dataset.id,node]));
    state.emptyNodes=new Map([...list.querySelectorAll('.icon-grid-cell')].map(node=>[Number(node.dataset.gridCell),node]));
    placeholder.dataset.gridCell=source.dataset.gridCell;
    state.placeholder = placeholder; state.sourceStyle = source.style.cssText;
    state.sourceAriaHidden = source.getAttribute('aria-hidden'); state.sourceTabIndex = source.getAttribute('tabindex');
    list.replaceChild(placeholder,source);
    state.mode = 'drag'; state.list = list;
    root.classList.add('is-icon-grid-dragging');list.classList.add('is-grid-active');
    source.classList.add('is-dragging','is-drag-ghost'); source.setAttribute('aria-hidden','true'); source.tabIndex = -1;
    Object.assign(source.style,{position:'fixed',left:`${state.x-state.offsetX}px`,top:`${state.y-state.offsetY}px`,width:`${rect.width}px`,height:`${rect.height}px`,margin:'0',zIndex:'2147483000',pointerEvents:'none',transform:'scale(1.08)',transition:'none'});
    // Keep the lifted icon in the workbench so scoped theme styles still apply.
    // Preserve the size inherited from the grid, including compact mode.
    source.style.setProperty('--operator-icon-size', `${rect.width}px`);
    root.append(source); state.ghost = source;
    closeMenus(); lastRight = null; ignoreIconClickUntil = performance.now() + 400;
    captureIconPointer(state,event || {pointerId:state.pointerId});
    autoScrollIconDrag(state);
  }
  function beginPointerScroll(state,event) {
    if (iconDrag !== state || state.mode !== 'pending') return;
    if (state.pressTimer) { clearTimeout(state.pressTimer); state.pressTimer = 0; }
    state.mode = 'scroll'; state.lastY = event.clientY; captureIconPointer(state,event);
    ignoreIconClickUntil = performance.now() + 400; closeMenus(); lastRight = null;
  }
  function iconPointerDown(event) {
    if (event.button !== 0 || !event.isPrimary || activeModal || iconDrag) return;
    const tile=pointerTile(event), grid=tileGrid(tile), kind=tile?.dataset.entryKind;
    if(!tile || !['buy','keep','items'].includes(kind) || !iconListIds(kind).includes(tile.dataset.id))return;
    if(!canMoveGrid(kind,grid)){toast('请先清除搜索或筛选，再调整网格位置。');return;}
    if(grid.querySelectorAll('.icon-tile').length!==iconListIds(kind).length){toast('当前列表尚有未显示条目，请先完整显示后调整。');return;}
    ignoreIconClickUntil = 0;
    const rect=tile.getBoundingClientRect();
    const state = iconDrag = {mode:'pending',id:tile.dataset.id,kind,source:tile,list:grid,scroller:grid.id==='item-list' ? $('.item-scroll') : $('#operator-panel'),pointerId:event.pointerId,pointerType:event.pointerType,x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top,targetId:null,after:false,pressTimer:0,scrollFrame:0,flipFrame:0,flipNodes:[],pointerCaptured:false};
    if (event.pointerType === 'touch') state.pressTimer = setTimeout(() => beginPointerIconDrag(state),180);
  }
  function iconPointerMove(event) {
    const state = iconDrag;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.mode === 'pending') {
      const dx = event.clientX - state.startX, dy = event.clientY - state.startY, distance = Math.hypot(dx,dy);
      if (state.pointerType === 'touch' && distance > 8 && Math.abs(dy) > Math.abs(dx) * 1.1) beginPointerScroll(state,event);
      else if (state.pointerType !== 'touch' && distance >= 5) beginPointerIconDrag(state,event);
      else if (state.pointerType === 'touch' && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) beginPointerIconDrag(state,event);
    }
    if (state.mode === 'drag') { event.preventDefault(); updateIconGhost(state,event.clientX,event.clientY); autoScrollIconDrag(state); }
    else if (state.mode === 'scroll') {
      event.preventDefault(); state.scroller.scrollTop += state.lastY - event.clientY; state.lastY = event.clientY;
    }
  }
  function iconPointerUp(event) {
    const state = iconDrag; if (!state || event.pointerId !== state.pointerId) return;
    if (state.mode === 'drag') {
      const cell=pointCell(state,event.clientX,event.clientY);
      const sourceId=state.id, kind=state.kind, list=state.list;
      ignoreIconClickUntil=performance.now()+400;finishIconDrag();
      if(cell!==null)moveGridIcon(sourceId,cell,kind,list);
    } else {
      if (state.mode === 'scroll') ignoreIconClickUntil = performance.now() + 400;
      finishIconDrag();
    }
  }
  function iconPointerCancel(event) {
    if (!iconDrag || event.pointerId !== iconDrag.pointerId) return;
    if(event.type==='lostpointercapture' && event.target!==root)return;
    if (iconDrag.mode !== 'pending') ignoreIconClickUntil = performance.now() + 400;
    finishIconDrag();
  }
  function moveGridIcon(sourceId,cell,kind,list){
    const next=Model.moveIconToCell(plan,sourceId,cell,kind);
    if(next===plan)return;
    change(next);
    list.querySelector(`.icon-tile[data-id="${CSS.escape(sourceId)}"]`)?.focus({preventScroll:true});
    toast('已保存网格位置；空格保留，占用格向后顺延。');
  }

  function contextmenu(event) {
    const row = event.target.closest('.operator-row');
    if (event.button !== 2 || !row || !(list.contains(row) || $('#item-list').contains(row) || $('#keep-item-icons').contains(row)) || activeModal) return;
    event.preventDefault();
    if (row.dataset.itemId) { // Items follow the same double-right-click toggle as operators.
      const itemId = row.dataset.itemId, at = performance.now();
      if (lastRight?.id === itemId && lastRight.kind === 'item' && at - lastRight.at <= 550) {
        lastRight = null; row.closest('#keep-item-icons') ? quickToggleItem(itemId) : toggleItemEntry(itemId);
      } else lastRight = { id: itemId, kind: 'item', at };
      return;
    }
    const id = row.dataset.entryId, now = performance.now();
    if (lastRight?.id === id && lastRight.kind === plan.active && now - lastRight.at <= 550) {
      lastRight = null; toggleEntry(id);
    } else lastRight = { id, kind: plan.active, at: now };
  }
  function click(event) {
    if (event.target.matches('.settings-backdrop,.picker-backdrop,.utility-backdrop')) { modal(null); return; }
    const button = event.target.closest('button'); if (!button || button.disabled) {if(!event.target.closest('.action-menu'))closeMenus();return;}
    if (button.classList.contains('icon-tile') && performance.now() < ignoreIconClickUntil) { event.preventDefault(); return; }
    lastRight = null;
    if (button.dataset.action !== 'item-next') resetItemConfirm();
    if (button.dataset.kind) { modal(null); change({ ...plan, active: button.dataset.kind, itemsView: false }); list.scrollTop=0; return; }
    if (button.dataset.view === 'items') { modal(null); closeMenus(); change({ ...plan, itemsView: true }); return; }
    if (button.dataset.itemTier !== undefined) { itemPickerFilter = { ...itemPickerFilter, tier: Number(button.dataset.itemTier) }; renderItemPicker(); return; }
    if (button.dataset.itemPick) { pickItem(button.dataset.itemPick); return; }
    if (button.dataset.tierFilter !== undefined) { change(Model.updateFilter(plan, { tier: Number(button.dataset.tierFilter) })); return; }
    if (button.dataset.pickerTier !== undefined) { pickerFilter = { ...pickerFilter, tier: Number(button.dataset.pickerTier) }; renderPicker(); return; }
    if (button.dataset.width) { const width = Number(button.dataset.width); change({ ...plan, width }); onResize(width); return; }
    const action = button.dataset.action, id = button.dataset.id;
    if(!['row-more','bulk-more','clear'].includes(action))closeMenus();
    if (['add-candidate','remove','lock','disable'].includes(action) && !known.has(id)) return;
    switch (action) {
      case 'items-master-toggle': toggleAllItemBuying(); break;
      case 'item-quick-toggle': quickToggleItem(id); break;
      case 'config-export': exportConfigFile(); break;
      case 'config-restore': void restoreBackup(); break;
      case 'item-picker-open': openItemPicker(); break;
      case 'item-picker-close': modal(null); break;
      case 'item-manual-off': {
        const result=Model.setItemEnabled(plan,id,false);
        if(result.changed){change(result.plan);toast('已手动禁用此道具，新对局也不会恢复买入。');}
        break;
      }
      case 'item-plus': case 'item-minus': {
        const result = Model.recordItemPurchase(plan,id,action==='item-plus'?1:-1);
        if(result.changed)change(result.plan);
        break;
      }
      case 'item-toggle': toggleItemEntry(id); break;
      case 'item-remove': {
        const result = Model.removeItem(plan,id);
        if(result.changed)change(result.plan);
        break;
      }
      case 'item-next':
        if(Date.now()>itemResetUntil){itemResetUntil=Date.now()+4000;button.textContent='再点一次确认下一对局';toast('4 秒内再点一次；只清零道具累计次数；干员持有量由游戏自动读取，规则不变。');}
        else {resetItemConfirm();const result=Model.nextItemMatch(plan);if(result.changed)change(result.plan);toast('已进入下一对局；道具本局次数已清零；干员仍按当前库存统计。');}
        break;
      case 'add-open': openPicker(); break;
      case 'add-candidate': {
        if (activeModal !== 'picker' || (plan.active === 'buy' && !known.get(id).buyable) || plan[plan.active].includes(id) || plan[plan.active].some(key=>runtimeInfo.matches?.[key]===id)) break;
        change(Model.updateFilter(Model.addOperator(plan, id), { query: '', bond: '', tier: 0, selectedOnly: false, enabledOnly: false }));
        list.scrollTop = list.scrollHeight;
        $('#picker-feedback').textContent = `已自动添加「${known.get(id).name}」。可以继续选择，或点“完成”返回名单。`;
        break;
      }
      case 'picker-close': modal(null); break;
      case 'picker-reset': pickerFilter = { query: '', bond: '', tier: 0 }; pickerSearch.value = ''; renderPicker(); break;
      case 'remove': {
        const result = Model.removeOperator(plan, id);
        if (result.reason === 'locked') toast('此干员已锁定，请先解锁再移除；禁用无需解锁。');
        else change(result.plan);
        break;
      }
      case 'disable': toggleEntry(id); break;
      case 'lock': change(Model.toggleLock(plan, id)); break;
      case 'clear':
        if(Date.now()>clearUntil){clearUntil=Date.now()+4000;$('#clear-hint').textContent='4 秒内再点一次确认清空';$('[data-action=clear]').textContent='确认清空未锁定项';toast('再点一次确认清空；锁定项和另一份名单不受影响。');}
        else {change(Model.clearUnlocked(plan));closeMenus();toast('已清空未锁定项，锁定干员及其禁用状态保持不变。');} break;
      case 'filters': advancedOpen=!advancedOpen;render();break;
      case 'search-clear': change(Model.updateFilter(plan,{query:''}));search.focus();break;
      case 'row-more': showEntryMenu(id);break;
      case 'bulk-more': menuId=null;$('#entry-menu').hidden=true;$('#bulk-menu').hidden=!$('#bulk-menu').hidden;$('[data-action=bulk-more]').setAttribute('aria-expanded',String(!$('#bulk-menu').hidden));break;
      case 'open-log': modal('logs');break;
      case 'open-health': modal('health');break;
      case 'utility-close': modal(null);break;
      case 'selected': change(Model.updateFilter(plan, { enabledOnly: !plan.filters[plan.active].enabledOnly })); break;
      case 'reset-filter': change(Model.updateFilter(plan, { query: '', bond: '', tier: 0, selectedOnly: false, enabledOnly: false })); break;
      case 'ready-toggle': void runtimeAction('ready.toggle'); break;
      case 'ready-skip': change({...plan,autoReady:{...plan.autoReady,skipTenth:!plan.autoReady.skipTenth}});break;
      case 'draft': void runtimeAction('auto.toggle'); break;
      case 'health-check': void runtimeAction('health.check'); break;
      case 'log-read': void runtimeAction('log.read'); break;
      case 'log-export': void runtimeAction('log.export'); break;
      case 'log-clear': void runtimeAction('log.clear'); break;
      case 'compact': change({ ...plan, compact: !plan.compact }); break;
      case 'icons': change({ ...plan, iconOnly: !plan.iconOnly }); break;
      case 'hotkey-record': recordHotkey(!recordingHotkey); break;
      case 'hotkey-reset': recordHotkey(false); change({ ...plan, hotkey: { ...Model.DEFAULT_HOTKEY } }); toast('启停快捷键已恢复为 F8。'); break;
      case 'hotkey-off': recordHotkey(false); change({ ...plan, hotkey: null }); toast('已关闭启停快捷键；仍可点“启动”按钮。'); break;
      case 'quick-open': options.onQuickOpen?.(button.dataset.quickKind); break;
      case 'collapse': onCollapse(); break;
      case 'close': onClose(); break;
      case 'settings': configError(''); void renderBackup(); modal('settings'); break;
      case 'settings-close': modal(null); break;
    }
  }
  function keydown(event) {
    if (recordingHotkey) { captureHotkey(event); return; }
    if (event.target === itemManualName && event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) { event.preventDefault(); return; }
    if (activeModal) {
      if (event.target === manualName && event.key === 'Enter' && (event.isComposing || event.keyCode === 229)) { event.preventDefault(); return; }
      if (event.key === 'Escape') { modal(null); event.preventDefault(); return; }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && ['picker','items'].includes(activeModal)) { event.preventDefault(); (activeModal === 'items' ? itemPickerSearch : pickerSearch).focus(); }
      if (event.key === 'Tab') {
        const layer = activeModal === 'picker' ? $('.picker') : activeModal === 'items' ? $('.item-picker') : activeModal === 'settings' ? $('.settings') : $('.utility-sheet');
        const items = [...layer.querySelectorAll('button:not(:disabled),input,select,[tabindex="0"]')].filter(el=>el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    const tile = event.target.closest('.icon-tile');
    const grid=tileGrid(tile);
    if(plan.iconOnly && tile && grid && event.altKey && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
      event.preventDefault();finishIconDrag();lastRight=null;
      const kind=tile.dataset.entryKind;
      if(!canMoveGrid(kind,grid)){toast('请先清除搜索或筛选，再调整网格位置。');return;}
      const slots=Model.iconGridSlots(plan,kind), index=slots.indexOf(tile.dataset.id), columns=gridColumns(grid);
      const step={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns}[event.key];
      moveGridIcon(tile.dataset.id,index+step,kind,grid);return;
    }
    if(event.key==='Escape'){finishIconDrag();closeMenus();return;}
    if(event.key.toLowerCase()==='n' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.matches('input,select,textarea,[contenteditable=true]')){event.preventDefault();plan.itemsView?openItemPicker():openPicker();return;}
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); search.focus(); }
    if (event.target.matches('[role=tab]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
      event.preventDefault(); const order = ['buy','keep','items'], now = plan.itemsView ? 'items' : plan.active;
      const next = event.key === 'Home' ? 'buy' : event.key === 'End' ? 'items' : order[(order.indexOf(now) + (event.key === 'ArrowLeft' ? 2 : 1)) % 3];
      lastRight = null; resetItemConfirm(); change(next === 'items' ? { ...plan, itemsView: true } : { ...plan, active: next, itemsView: false }); list.scrollTop=0; $(`#tab-${next}`).focus();
    }
  }
  const input = () => change(Model.updateFilter(plan, { query: search.value }));
  const selectBond = () => change(Model.updateFilter(plan, { bond: bond.value }));
  const itemPickerInput = () => { itemPickerFilter = { ...itemPickerFilter, query: itemPickerSearch.value }; renderItemPicker(); };
  const itemSearchInput = () => { itemQuery = itemSearch.value; renderItems(); };
  const pickerInput = () => { pickerFilter = { ...pickerFilter, query: pickerSearch.value }; renderPicker(); };
  const pickerSelect = () => { pickerFilter = { ...pickerFilter, bond: pickerBond.value }; renderPicker(); };
  const manualInput = () => { $('#manual-error').hidden = true; $('#manual-error').textContent = ''; manualName.removeAttribute('aria-invalid'); };
  const itemManualInput = () => {$('#item-manual-error').hidden=true;$('#item-manual-error').textContent='';itemManualName.removeAttribute('aria-invalid');};
  const outsideClick=event=>{if(!root.contains(event.target))closeMenus();};
  document.addEventListener('click',outsideClick); document.addEventListener('keydown',documentHotkey,true);
  const readyFundsChange=()=>{const value=$('#ready-funds').value.trim(),funds=value===''?null:Number(value);
    if($('#ready-funds').validity.badInput || funds!==null && (!Number.isSafeInteger(funds)||funds<0)){toast('资金上限请输入非负整数，留空表示不限');$('#ready-funds').value=plan.autoReady.funds===null?'':String(plan.autoReady.funds);return;}
    change({...plan,autoReady:{...plan.autoReady,funds}});};
  $('#ready-funds').addEventListener('change',readyFundsChange);
  root.addEventListener('click', click); root.addEventListener('keydown', keydown); root.addEventListener('contextmenu', contextmenu); root.addEventListener('change',itemChange);
  root.addEventListener('load', gameIconLoad, true); root.addEventListener('error', gameIconError, true);
  root.addEventListener('pointerdown', iconPointerDown);
  root.addEventListener('pointermove', iconPointerMove, {passive:false});
  root.addEventListener('pointerup', iconPointerUp); root.addEventListener('pointercancel', iconPointerCancel);
  root.addEventListener('lostpointercapture', iconPointerCancel);
  pickerSearch.addEventListener('input', pickerInput); pickerBond.addEventListener('change', pickerSelect);
  itemPickerSearch.addEventListener('input', itemPickerInput); itemSearch.addEventListener('input', itemSearchInput);
  // Keep the native file input as the real pointer/keyboard target. No scripted hidden-input relay.
  const configFileClick = () => {configError('');configFile.value='';};
  configFile.addEventListener('click',configFileClick);
  const configFileChange = () => { const file = configFile.files?.[0]; configFile.value = ''; void importConfigFile(file); };
  configFile.addEventListener('change', configFileChange);
  manualForm.addEventListener('submit', submitManual); manualName.addEventListener('input', manualInput);
  itemManualForm.addEventListener('submit',submitItemManual);itemManualName.addEventListener('input',itemManualInput);
  search.addEventListener('input', input); bond.addEventListener('change', selectBond);
  render(); onResize(plan.width);
  if (loadError) status('无法读取保存方案 · 仅本次界面有效', 'error');
  return {
    getPlan: () => Model.normalizePlan(plan),
    async quickAction(command,id) {
      if(destroyed)throw new Error('工作台已关闭');
      if(command==='auto' || command==='ready'){
        const ok=await runtimeAction(command==='ready'?'ready.toggle':'auto.toggle');
        if(!ok)throw new Error('未能执行，请查看主面板提示');
        return {message:''};
      }
      if(!persistenceReady)throw new Error('配置未可靠保存，不能切换');
      if(command==='ready-skip'){change({...plan,autoReady:{...plan.autoReady,skipTenth:!plan.autoReady.skipTenth}});}
      else if(command==='item'){
        const item=plan.items.find(entry=>entry.id===id);
        if(!item)throw new Error('该道具已移除');
        if(itemPurchaseState(item,plan.itemSession.used[item.id] || 0,itemOwnedCount(item.id))==='full')return {message:'已满；快捷开关不会清零次数'};
        quickToggleItem(id);
      }else if(command==='master')toggleAllItemBuying();
      else throw new Error('未知快捷操作');
      await quickItemQueue;await saveQueue;
      if(destroyed || !persistenceReady)throw new Error('保存未确认，未恢复交易');
      return {message:command==='master' ? plan.itemBuyingPaused?'道具抓取已暂停':'已恢复原道具配置' : '已保存；计数未清零'};
    },
    exportConfig: () => Model.exportConfig(plan),
    importConfig: input => destroyed ? Promise.resolve({ ok: false, reason: 'closed' }) : applyConfig(input),
    async syncItemMatch(state, server, expectedEpoch) {
      if(destroyed)throw new Error('工作台已关闭');
      if(plan.itemSession.epoch !== expectedEpoch)throw new Error('本局状态已变化，请重新同步');
      const result=Model.observeItemMatch(plan,state,server);
      if(result.changed){plan=result.plan;resetItemConfirm();render();persist();}
      await saveQueue;
      if(!persistenceReady)throw new Error('新对局计数保存失败，不能自动交易');
      if(result.newMatch)toast('已识别新对局，本局已抓次数清零；配置和启用状态保留，请手动启动。');
      return Model.normalizePlan(plan);
    },
    async recordConfirmedPurchase(kind,id,epoch,count) {
      if(destroyed)throw new Error('工作台已关闭');
      const result=Model.confirmPurchaseCount(plan,kind,id,epoch,count);
      if(result.reason)throw new Error(result.reason);
      if(result.changed){plan=result.plan;resetItemConfirm();render();persist();}
      await saveQueue;
      if(!persistenceReady)throw new Error('本地存储不可用，已停止自动交易');
      return Model.normalizePlan(plan);
    },
    getRuntimeInfo: () => ({...runtimeInfo}),
    hotkey(result, key, action = '') {
      if (destroyed) return;
      if (result === 'conflict') toast(`快捷键 ${key} 与游戏「${action || '快捷键'}」冲突，已让给游戏；请在工作台设置里换一个。`);
      else if (result === 'stopped') toast(`已按快捷键 ${key} 停止自动倒转。`);
      else if (result === 'start' && !runtimeInfo.running && !runtimeInfo.starting) void hotkeyToggle(key);
    },
    updateRuntime(info) {
      if (destroyed) return;
      if (info && Object.hasOwn(info, 'itemShelf')) itemIconMap = new Map((Array.isArray(info.itemShelf) ? info.itemShelf : [])
        .filter(entry => typeof entry?.id === 'string').map(entry => [entry.id, entry.iconUrl]));
      runtimeInfo = { ...runtimeInfo, ...info }; render();
    },
    updateCatalogue(next) {
      if(destroyed || !Array.isArray(next?.operators) || !Array.isArray(next?.bonds))return;
      const actual=new Set(next.operators.map(op=>op.id)),refs=new Set([...plan.buy,...plan.keep]);
      catalogue={...next,operators:[...next.operators,...catalogue.operators.filter(op=>!actual.has(op.id)&&refs.has(op.id)).map(op=>({...op,unavailable:true}))]};
      buildBonds(); render();
    },
    settled: () => saveQueue,
    destroy() {
      destroyed = true; feedback.destroy();
      finishIconDrag();
      document.removeEventListener('click',outsideClick); document.removeEventListener('keydown',documentHotkey,true);
      $('#ready-funds').removeEventListener('change',readyFundsChange);
      root.removeEventListener('click', click); root.removeEventListener('keydown', keydown); root.removeEventListener('contextmenu', contextmenu); root.removeEventListener('change',itemChange);
      root.removeEventListener('load', gameIconLoad, true); root.removeEventListener('error', gameIconError, true);
      root.removeEventListener('pointerdown', iconPointerDown);
      root.removeEventListener('pointermove', iconPointerMove);
      root.removeEventListener('pointerup', iconPointerUp); root.removeEventListener('pointercancel', iconPointerCancel);
      root.removeEventListener('lostpointercapture', iconPointerCancel);
      search.removeEventListener('input', input); bond.removeEventListener('change', selectBond);
      pickerSearch.removeEventListener('input', pickerInput); pickerBond.removeEventListener('change', pickerSelect);
      itemPickerSearch.removeEventListener('input', itemPickerInput); itemSearch.removeEventListener('input', itemSearchInput); configFile.removeEventListener('change', configFileChange); configFile.removeEventListener('click',configFileClick);
      manualForm.removeEventListener('submit', submitManual); manualName.removeEventListener('input', manualInput);
      itemManualForm.removeEventListener('submit',submitItemManual);itemManualName.removeEventListener('input',itemManualInput);root.remove();
    },
  };
}
