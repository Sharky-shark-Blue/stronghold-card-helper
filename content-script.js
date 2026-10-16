// Generated local runtime v0.3.1; edit src/runtime-host.js and src/engine/.
(() => {
const BUILD_VERSION="0.3.1";
// Generated from 全静态条目ID索引.txt (items.json). Base IDs only: 普通 _e_a and special IDs; 升级 _e_b variants map to the same item name.
const ITEM_CATALOGUE = Object.freeze([
  {"id":"chess_item_3_04_e_a","name":"炎国短刀","tier":3},
  {"id":"chess_item_1_01_e_a","name":"维式重锤","tier":1},
  {"id":"chess_item_4_09_e_a","name":"灼燃维式重锤","tier":4},
  {"id":"chess_item_3_09_e_a","name":"坚固维式重锤","tier":3},
  {"id":"chess_item_3_10_e_a","name":"加速维式重锤","tier":3},
  {"id":"chess_item_2_03_e_a","name":"战栗维式重锤","tier":2},
  {"id":"chess_item_3_07_e_a","name":"阿戈尔重刃","tier":3},
  {"id":"chess_item_1_02_e_a","name":"坚守盾牌","tier":1},
  {"id":"chess_item_3_08_e_a","name":"奥术法阵","tier":3},
  {"id":"chess_item_3_06_e_a","name":"歌利亚头盔","tier":3},
  {"id":"chess_item_2_04_e_a","name":"萨尔贡浓茶","tier":2},
  {"id":"chess_item_3_05_e_a","name":"迅捷作战粮","tier":3},
  {"id":"chess_item_4_03_e_a","name":"有限加速器","tier":4},
  {"id":"chess_item_3_03_e_a","name":"激光发射器","tier":3},
  {"id":"chess_item_4_02_e_a","name":"蜂鸣器","tier":4},
  {"id":"chess_item_4_04_e_a","name":"伪装服","tier":4},
  {"id":"chess_item_2_01_e_a","name":"不屈弹射器","tier":2},
  {"id":"chess_item_4_08_e_a","name":"拉特兰桥夹","tier":4},
  {"id":"chess_item_5_01_e_a","name":"催泪瓦斯","tier":5},
  {"id":"chess_item_4_10_e_a","name":"浓缩嗅盐","tier":4},
  {"id":"chess_item_4_05_e_a","name":"防暴盾","tier":4},
  {"id":"chess_item_4_11_e_a","name":"护盾无人机","tier":4},
  {"id":"chess_item_bond_emptyShip","name":"转职·协防","tier":6},
  {"id":"chess_item_5_02_e_a","name":"谢拉格不融冰","tier":5},
  {"id":"chess_item_3_02_e_a","name":"精准狙击镜","tier":3},
  {"id":"chess_item_3_11_e_a","name":"突袭手雷","tier":3},
  {"id":"chess_item_4_06_e_a","name":"休眠子裔","tier":4},
  {"id":"chess_item_1_03_e_a","name":"盟约之币","tier":1},
  {"id":"chess_item_5_03_e_a","name":"双模机械臂","tier":5},
  {"id":"chess_item_4_12_e_a","name":"M3茧甲","tier":4},
  {"id":"chess_item_5_05_e_a","name":"拟态物质","tier":5},
  {"id":"chess_item_bond_maniShip","name":"转职·奇迹","tier":6},
  {"id":"chess_item_6_08_e_a","name":"人事部文档","tier":6},
  {"id":"chess_item_5_06_e_a","name":"博士投影","tier":5},
  {"id":"chess_item_5_08_e_a","name":"突变细胞","tier":5},
  {"id":"chess_item_6_09_e_a","name":"变形同构体","tier":6},
  {"id":"chess_item_5_07_e_a","name":"商业包装方案","tier":5},
  {"id":"chess_item_4_01_e_a","name":"寻呼模块","tier":4},
  {"id":"chess_item_bond_miraShip","name":"转职·远见","tier":6},
  {"id":"chess_item_5_04_e_a","name":"信标","tier":5},
  {"id":"chess_item_6_02_e_a","name":"铳骑之威","tier":6},
  {"id":"chess_item_6_03_e_a","name":"天师古鼎","tier":6},
  {"id":"chess_item_6_04_e_a","name":"海沟实验体","tier":6},
  {"id":"chess_item_6_05_e_a","name":"蒸汽之心","tier":6},
  {"id":"chess_item_6_06_e_a","name":"耶拉冈德之泪","tier":6},
  {"id":"chess_item_6_07_e_a","name":"黄沙罗盘","tier":6},
  {"id":"chess_item_2_05_e_a","name":"精打细算玩偶","tier":2},
  {"id":"chess_item_2_07_e_a","name":"见钱眼开玩偶","tier":2},
  {"id":"chess_item_2_06_e_a","name":"简易通讯机","tier":2},
  {"id":"chess_item_2_02_e_a","name":"紧急调度券","tier":2},
  {"id":"chess_item_bond_deputShip","name":"转职·助力","tier":6},
  {"id":"chess_item_6_01_e_a","name":"天马之枪","tier":6},
  {"id":"chess_item_5_09_e_a","name":"天马之盔","tier":5},
  {"id":"chess_item_4_07_e_a","name":"卡西米尔竞技旗","tier":4},
  {"id":"chess_item_6_10_e_a","name":"骑士戒律","tier":6},
  {"id":"chess_item_3_01_e_a","name":"叙拉古正装","tier":3},
  {"id":"chess_item_6_11_e_a","name":"家族徽章","tier":6},
  {"id":"chess_item_3_12_e_a","name":"骑士储蓄罐","tier":3},
  {"id":"chess_item_bond_investShip","name":"转职·投资人","tier":6},
  {"id":"chess_item_1_04_e_a","name":"随身身份牌","tier":1},
  {"id":"chess_item_1_05_e_a","name":"源石溶剂","tier":1},
  {"id":"chess_item_bond_skillfulShip","name":"转职·灵巧","tier":6},
  {"id":"chess_item_6_01_m","name":"“神秘顾客”","tier":6},
  {"id":"chess_item_6_02_m","name":"画卷","tier":6},
  {"id":"chess_item_6_03_m","name":"教鞭","tier":6},
]);

// Sparse display layout only. Never changes membership, enabled flags or transaction priority.
const GRID_MAX_CELLS = 2048;
function normalizeIconGrid(raw, orderedIds) {
  const allowed=new Set(orderedIds), seen=new Set(), slots=[];
  if(Array.isArray(raw))for(const id of raw.slice(0,GRID_MAX_CELLS)) {
    const keep=typeof id==='string' && allowed.has(id) && !seen.has(id);
    slots.push(keep ? id : null);if(keep)seen.add(id);
  }
  while(slots.length && slots.at(-1)===null)slots.pop();
  for(const id of orderedIds)if(!seen.has(id)) {
    if(slots.length<GRID_MAX_CELLS)slots.push(id);
    else {const free=slots.indexOf(null);if(free<0)break;slots[free]=id;}
    seen.add(id);
  }
  return slots;
}
function placeIconGrid(slots, sourceId, cell) {
  if(!Array.isArray(slots) || !Number.isInteger(cell) || cell<0 || cell>=GRID_MAX_CELLS)return null;
  const source=slots.indexOf(sourceId);if(source<0 || source===cell)return null;
  const next=slots.slice(0,GRID_MAX_CELLS);next[source]=null;
  while(next.length<=cell)next.push(null);
  let carried=sourceId;
  for(let index=cell;index<GRID_MAX_CELLS;index++) {
    const displaced=next[index] ?? null;next[index]=carried;
    if(displaced===null){
      while(next.length && next.at(-1)===null)next.pop();
      return next;
    }
    carried=displaced;
  }
  return null; // Full tail: do not discard an icon or alter the caller's array.
}

const Model = (() => {
// Pure plan model. No function in this module reads a live match or sends game commands.
const STORAGE_KEY = 'wei.workbench.plan.v1';
const KINDS = ['buy', 'keep'];
const MAX_ICON_GRID_CELLS = GRID_MAX_CELLS;
const MAX_MANUAL_NAME_LENGTH = 40;
const ITEMS = ITEM_CATALOGUE;
const manualId = value => typeof value === 'string' && /^manual_[A-Za-z0-9_-]{1,64}$/.test(value);
const manualItemId = value => typeof value === 'string' && /^manual_item_[A-Za-z0-9_-]{1,64}$/.test(value);
const cleanName = value => typeof value === 'string' ? value.normalize('NFC').replace(/\s+/gu, ' ').trim() : '';
const nameKey = value => cleanName(value).normalize('NFKC').toLowerCase();
const validName = name => Boolean(name) && [...name].length <= MAX_MANUAL_NAME_LENGTH && !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(name);
const ITEM_BY_ID = new Map(ITEM_CATALOGUE.map(item => [item.id, item]));
const ITEM_BY_NAME = new Map(ITEM_CATALOGUE.map(item => [nameKey(item.name), item]));
const MAX_SAVED_ITEMS = 128;
const validFunds = value => Number.isSafeInteger(value) && value >= 0 && value <= 999999999;
const optionalFunds = value => validFunds(value) ? value : null;
const optionalLimit = value => Number.isInteger(value) && value >= 1 && value <= 99 ? value : null;
function customRecords(raw) {
  const records = [], seenIds = new Set(), seenNames = new Set();
  for (const rec of (Array.isArray(raw) ? raw : []).slice(0, 1024)) {
    const name = cleanName(rec?.name), key = nameKey(name);
    if (!manualId(rec?.id) || !validName(name) || seenIds.has(rec.id) || seenNames.has(key)) continue;
    records.push({ id: rec.id, name }); seenIds.add(rec.id); seenNames.add(key);
    if (records.length === 512) break;
  }
  return records;
}

function itemRecords(raw) {
  const seen = new Set(), names = new Set(), out = [];
  for (const rec of (Array.isArray(raw) ? raw : []).slice(0, 256)) {
    const id = rec?.id, known = ITEM_BY_ID.get(id), name = known?.name || cleanName(rec?.name);
    const key = nameKey(name);
    if (!known && (!manualItemId(id) || !validName(name) || ITEM_BY_NAME.has(key))) continue;
    if (seen.has(id) || (!known && names.has(key))) continue;
    // 抓取上限：null / 缺省 = 不限（新增道具的默认）；损坏的数值保守地回到 1。
    const limit = rec.limit === null || rec.limit === undefined ? null : optionalLimit(rec.limit) ?? 1;
    const entry = { id, limit, enabled: rec.enabled === true, minFunds: optionalFunds(rec.minFunds),
      ...(rec.enabled !== true && rec.capPaused === true ? { capPaused: true } : {}),
      ...(optionalLimit(rec.ownedTarget) !== null ? { ownedTarget: optionalLimit(rec.ownedTarget) } : {}),
      ...(rec.autoUse === true ? { autoUse: true } : {}) }; // 自动使用 is opt-in and independent of buying.
    out.push(known ? entry : { ...entry, name });
    seen.add(id); names.add(key);
    if (out.length === MAX_SAVED_ITEMS) break;
  }
  return out;
}

const validId = value => typeof value === 'string' && /^[A-Za-z0-9_:-]{1,80}$/.test(value) && !['__proto__','prototype','constructor'].includes(value);
const ids = values => [...new Set((Array.isArray(values) ? values : []).filter(validId))].slice(0, 512);
const kindOf = value => value === 'keep' ? 'keep' : 'buy';
const filter = value => ({
  query: typeof value?.query === 'string' ? value.query.slice(0, 80) : '',
  bond: validId(value?.bond) ? value.bond : '',
  tier: Number.isInteger(value?.tier) && value.tier >= 0 && value.tier <= 6 ? value.tier : 0,
  selectedOnly: value?.selectedOnly === true,
  enabledOnly: value?.enabledOnly === true,
});
// Preserve insertion order, but never let the capacity limit discard a locked entry.
const selectedIds = (values, locks) => {
  const union = [...new Set([...ids(values), ...locks])], required = new Set(locks);
  let free = 512 - required.size;
  return union.filter(id => required.has(id) || free-- > 0);
};

function normalizePlan(raw) {
  const p = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const records = customRecords(p.customOperators), customIds = new Set(records.map(rec => rec.id));
  const items = itemRecords(p.items), used = {};
  const itemIds = items.map(item => item.id), itemRefs = new Set(itemIds);
  const counts = p.itemSession?.used;
  if (counts && typeof counts === 'object' && !Array.isArray(counts)) {
    for (const item of items) {
      const count = counts[item.id];
      if (Number.isInteger(count) && count > 0 && count <= 9999) used[item.id] = count;
    }
  }
  const refs = value => ids(value).filter(id => !id.startsWith('manual_') || customIds.has(id));
  const locks = { buy: refs(p.locks?.buy), keep: refs(p.locks?.keep) };
  const buy = selectedIds(refs(p.buy), locks.buy), keep = selectedIds(refs(p.keep), locks.keep);
  const keepRules = {};
  for (const id of keep) {
    const rule = p.keepRules?.[id];
    keepRules[id] = { limit: optionalLimit(rule?.limit), minFunds: optionalFunds(rule?.minFunds) };
  }
  const referenced = new Set([...buy, ...keep]);
  // A reached cap pauses only this match; capPaused distinguishes it from a manual disable.
  // Legacy keepSession totals are ignored and never override the current inventory.
  const cappedItems = items.map(item => item.enabled && item.limit !== null && (used[item.id] || 0) >= item.limit ? { ...item, enabled: false, capPaused: true } : item);
  const iconOrder=Object.fromEntries(KINDS.map(kind=>{
    const selected=kind==='buy' ? buy : keep, allowed=new Set(selected);
    return [kind,ids([...ids(p.iconOrder?.[kind]).filter(id=>allowed.has(id)),...selected])];
  }));
  const iconSlots=Object.fromEntries(KINDS.map(kind=>[kind,normalizeIconGrid(p.iconSlots?.[kind],iconOrder[kind])]));
  const itemOrder=ids([...ids(p.itemIconOrder).filter(id=>itemRefs.has(id)),...itemIds]);
  const itemIconSlots=normalizeIconGrid(p.itemIconSlots,itemOrder);
  return {
    schema: 3,
    autoReady:{funds:p.autoReady?.funds===null?null:Number.isSafeInteger(p.autoReady?.funds)&&p.autoReady.funds>=0?p.autoReady.funds:0,skipTenth:p.autoReady?.skipTenth===true},
    ...(p.itemBuyingPaused === true ? { itemBuyingPaused: true } : {}),
    active: kindOf(p.active), buy, keep, locks,
    customOperators: records.filter(rec => referenced.has(rec.id)),
    disabled: {
      buy: ids(p.disabled?.buy).filter(id => buy.includes(id)),
      keep: ids(p.disabled?.keep).filter(id => keep.includes(id)),
    },
    filters: { buy: filter(p.filters?.buy), keep: filter(p.filters?.keep) },
    items: cappedItems, itemSession: { used, ...(p.itemSession?.match && typeof p.itemSession.match.key === 'string' && p.itemSession.match.key.length <= 512 && Number.isInteger(p.itemSession.match.round) && p.itemSession.match.round >= 0 ? { match: { key: p.itemSession.match.key, round: p.itemSession.match.round, left: p.itemSession.match.left === true } } : {}), epoch: Number.isSafeInteger(p.itemSession?.epoch) && p.itemSession.epoch >= 0 ? p.itemSession.epoch : 0 },
    itemIconOrder:itemIconSlots.filter(Boolean), itemIconSlots,
    keepRules,
    // Legacy draft preference only. The real runtime is always disarmed until an explicit UI click.
    draftEnabled: p.draftEnabled === true,
    width: [360, 400, 440].includes(p.width) ? p.width : 400,
    compact: p.compact === true,
    iconOnly: p.iconOnly === true,
    iconOrder:Object.fromEntries(KINDS.map(kind=>[kind,iconSlots[kind].filter(Boolean)])), iconSlots,
    itemsView: p.itemsView === true, // 界面：当前在「道具」标签（不影响交易）
    // 启停快捷键：null = 用户关闭；缺省或无效时回到 F8。
    hotkey: p.hotkey === null ? null : (normalizeHotkey(p.hotkey) || { ...DEFAULT_HOTKEY }),
  };
}

function allOperators(catalogue, plan) {
  // Local placeholders never claim to have a game chessId, charId, tier or bond.
  const custom = (plan.customOperators || []).map(rec => ({
    id: rec.id, name: rec.name, charId: '', tier: 0, bonds: [], bondNames: [],
    buyable: true, hidden: false, diy: false, custom: true,
  }));
  return [...catalogue.operators, ...custom];
}

function addNamedOperator(catalogue, plan, input, newId, type = plan.active) {
  const kind = kindOf(type), name = cleanName(input), key = nameKey(name);
  if (!name) return { plan, reason: 'empty' };
  if (!validName(name)) return { plan, reason: 'name' };
  const operators = allOperators(catalogue, plan), selected = new Set(plan[kind]);
  const duplicate = operators.find(op => selected.has(op.id) && nameKey(op.name) === key);
  if (duplicate) return { plan, reason: 'duplicate', id: duplicate.id, name: duplicate.name };
  if (plan[kind].length >= 512) return { plan, reason: 'capacity' };
  const matched = catalogue.operators.find(op => nameKey(op.name) === key && (kind === 'keep' || op.buyable));
  if (matched) return { plan: addOperator(plan, matched.id, kind), id: matched.id, name: matched.name, custom: false, reason: '' };
  const existing = (plan.customOperators || []).find(op => nameKey(op.name) === key);
  if (existing) return { plan: addOperator(plan, existing.id, kind), id: existing.id, name: existing.name, custom: true, reason: '' };
  if ((plan.customOperators || []).length >= 512) return { plan, reason: 'capacity' };
  if (!manualId(newId) || operators.some(op => op.id === newId)) return { plan, reason: 'id' };
  const next = { ...plan, customOperators: [...(plan.customOperators || []), { id: newId, name }] };
  return { plan: addOperator(next, newId, kind), id: newId, name, custom: true, reason: '' };
}

function filterOperators(catalogue, plan, type = plan.active) {
  const kind = kindOf(type), f = plan.filters[kind];
  const query = f.query.trim().toLocaleLowerCase();
  const selected = new Set(plan[kind]), disabled = new Set(plan.disabled?.[kind] || []);
  return allOperators(catalogue, plan).filter(op => {
    if (kind === 'buy' && !op.buyable) return false;
    if (f.tier && f.tier !== op.tier) return false;
    if (f.bond && !op.bonds.includes(f.bond)) return false;
    if (f.selectedOnly && !selected.has(op.id)) return false;
    if (f.enabledOnly && disabled.has(op.id)) return false;
    return !query || [op.name, op.id, op.charId, ...op.bondNames]
      .some(value => String(value).toLocaleLowerCase().includes(query));
  });
}

function updateFilter(plan, patch, type = plan.active) {
  const kind = kindOf(type);
  return { ...plan, filters: { ...plan.filters, [kind]: filter({ ...plan.filters[kind], ...patch }) } };
}

function addedOperators(catalogue, plan, type = plan.active) {
  const kind = kindOf(type);
  const visible = new Map(filterOperators(catalogue, updateFilter(plan, { selectedOnly: true }, kind), kind).map(op => [op.id, op]));
  return plan[kind].map(id => visible.get(id)).filter(Boolean);
}

function candidateOperators(catalogue, plan, pickerFilter, type = plan.active) {
  const kind = kindOf(type);
  // The dialog has independent, temporary filters; main-list searches never hide candidates.
  const transient = { ...plan, filters: { ...plan.filters, [kind]: filter({ ...pickerFilter, selectedOnly: false, enabledOnly: false }) } };
  return filterOperators(catalogue, transient, kind);
}

function addOperator(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id) || plan[kind].includes(id)) return plan;
  return { ...plan, [kind]: ids([...plan[kind], id]) };
}

function removeOperator(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return { plan, reason: 'invalid' };
  if (plan.locks[kind].includes(id)) return { plan, reason: 'locked' };
  return { plan: normalizePlan({ ...plan, [kind]: plan[kind].filter(value => value !== id),
    disabled: { ...plan.disabled, [kind]: (plan.disabled?.[kind] || []).filter(value => value !== id) } }), reason: '' };
}

function toggleDisabled(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id) || !plan[kind].includes(id)) return { plan, reason: 'missing' };
  const disabled = new Set(plan.disabled?.[kind] || []);
  const enabling = disabled.has(id);
  enabling ? disabled.delete(id) : disabled.add(id);
  return { plan: normalizePlan({ ...plan, disabled: { ...plan.disabled, [kind]: [...disabled] } }), reason: '' };
}

function toggleSelection(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return { plan, reason: 'invalid' };
  return plan[kind].includes(id) ? removeOperator(plan, id, kind) : { plan: addOperator(plan, id, kind), reason: '' };
}

function toggleLock(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return plan;
  const locked = new Set(plan.locks[kind]), selected = new Set(plan[kind]);
  if (locked.has(id)) locked.delete(id);
  else { locked.add(id); selected.add(id); }
  return { ...plan, [kind]: [...selected], locks: { ...plan.locks, [kind]: [...locked] } };
}

function clearUnlocked(plan, type = plan.active) {
  const kind = kindOf(type), retained = [...plan.locks[kind]];
  return normalizePlan({ ...plan, [kind]: retained,
    disabled: { ...plan.disabled, [kind]: (plan.disabled?.[kind] || []).filter(id => retained.includes(id)) } });
}

function selectVisible(plan, visible, type = plan.active) {
  const kind = kindOf(type);
  return { ...plan, [kind]: ids([...plan[kind], ...visible.map(op => op.id)]) };
}

// Display order only: never change membership or transaction priority.
function movedIconOrder(order, sourceId, targetId, after) {
  if (sourceId === targetId || !order.includes(sourceId) || !order.includes(targetId)) return null;
  const next = order.filter(id => id !== sourceId);
  next.splice(next.indexOf(targetId) + (after === true ? 1 : 0), 0, sourceId);
  return next.every((id, index) => id === order[index]) ? null : next;
}
function moveIconOperator(plan, sourceId, targetId, after = false, type = plan.active) {
  if (!KINDS.includes(type)) return plan;
  const normalized = normalizePlan(plan), next = movedIconOrder(normalized.iconOrder[type], sourceId, targetId, after);
  if(!next)return plan;
  let index=0;
  const slots=normalized.iconSlots[type].map(id=>id===null ? null : next[index++]);
  return {...normalized,iconOrder:{...normalized.iconOrder,[type]:next},iconSlots:{...normalized.iconSlots,[type]:slots}};
}
function moveItemIcon(plan, sourceId, targetId, after = false) {
  const normalized = normalizePlan(plan), next = movedIconOrder(normalized.itemIconOrder, sourceId, targetId, after);
  if(!next)return plan;
  let index=0;
  return {...normalized,itemIconOrder:next,itemIconSlots:normalized.itemIconSlots.map(id=>id===null ? null : next[index++])};
}

function iconGridSlots(plan, kind=plan.active) {
  return kind==='items' ? plan.itemIconSlots : plan.iconSlots?.[kind] || [];
}
function previewIconGrid(slots, sourceId, cell) {
  return placeIconGrid(slots,sourceId,cell);
}
function moveIconToCell(plan, sourceId, cell, kind=plan.active) {
  if(kind!=='items' && !KINDS.includes(kind))return plan;
  const normalized=normalizePlan(plan), slots=placeIconGrid(iconGridSlots(normalized,kind),sourceId,cell);
  if(!slots)return plan;
  return kind==='items' ? {...normalized,itemIconSlots:slots,itemIconOrder:slots.filter(Boolean)} :
    {...normalized,iconSlots:{...normalized.iconSlots,[kind]:slots},iconOrder:{...normalized.iconOrder,[kind]:slots.filter(Boolean)}};
}

function examplePlan(catalogue) {
  const buy = catalogue.operators.filter(op => op.buyable).slice(0, 8).map(op => op.id);
  const keep = catalogue.operators.filter(op => op.tier >= 4 && op.buyable).slice(0, 4).map(op => op.id);
  return normalizePlan({ buy, keep, locks: { buy: buy.slice(0, 2), keep: keep.slice(0, 1) } });
}

// New items are always disarmed; enabling is a separate, explicit user action.
function addItem(plan, id) {
  if (!ITEM_BY_ID.has(id) || plan.items.some(x => x.id === id)) return { plan, changed: false };
  if (plan.items.length >= MAX_SAVED_ITEMS) return { plan, changed: false, reason: 'capacity' };
  return { plan: { ...plan, items: [...plan.items, { id, limit: null, enabled: false, minFunds: null }] }, changed: true };
}
function addNamedItem(plan, input, id) {
  const name = cleanName(input), key = nameKey(name);
  if (!name) return { plan, changed: false, reason: 'empty' };
  if (!validName(name)) return { plan, changed: false, reason: 'name' };
  const known = ITEM_BY_NAME.get(key);
  if (known) {
    if (plan.items.some(item => item.id === known.id)) return { plan, changed: false, reason: 'duplicate' };
    return { ...addItem(plan, known.id), name: known.name, custom: false };
  }
  if (plan.items.some(item => item.name && nameKey(item.name) === key)) {
    return { plan, changed: false, reason: 'duplicate' };
  }
  if (plan.items.length >= MAX_SAVED_ITEMS) return { plan, changed: false, reason: 'capacity' };
  if (!manualItemId(id) || plan.items.some(item => item.id === id)) return { plan, changed: false, reason: 'id' };
  return { plan: { ...plan, items: [...plan.items, { id, name, limit: null, enabled: false, minFunds: null }] }, changed: true, name, custom: true };
}
function setItemEnabled(plan, id, enabled) {
  const item = plan.items.find(x => x.id === id);
  if (!item || item.enabled === (enabled === true) && !item.capPaused) return { plan, changed: false };
  // Manual enable clears the item's per-match count, so a reached cap starts over.
  const counts = { ...plan.itemSession.used }, cleared = enabled === true && (counts[id] || 0) > 0;
  if (cleared) delete counts[id];
  return { plan: normalizePlan({ ...plan, items: plan.items.map(x => {
    if (x.id !== id) return x;
    const { capPaused, ...rest } = x; // An explicit user choice always clears the automatic-pause marker.
    return { ...rest, enabled: enabled === true };
  }),
    itemSession: { ...plan.itemSession, used: counts } }), changed: true, cleared };
}
function toggleItemEnabled(plan, id) {
  const item = plan.items.find(x => x.id === id);
  return item ? setItemEnabled(plan, id, !item.enabled) : { plan, changed: false };
}
// 自动使用: while a run is active, consumables of this item lying in hand/temp are equipped onto the
// most recently obtained operator (board first, then hand) that still has a free equipment slot.
function setItemAutoUse(plan, id, on) {
  const item = plan.items.find(x => x.id === id);
  if (!item || (item.autoUse === true) === (on === true)) return { plan, changed: false };
  return { plan: { ...plan, items: plan.items.map(x => {
    if (x.id !== id) return x;
    const { autoUse, ...rest } = x;
    return on === true ? { ...rest, autoUse: true } : rest;
  }) }, changed: true };
}
const itemCapReached = (plan, item) => item.limit != null && (plan.itemSession?.used?.[item.id] || 0) >= item.limit;
function setItemOwnedTarget(plan, id, value) {
  if (value !== null && optionalLimit(value) === null) throw new Error('道具持有目标须为 1–99 或留空');
  const item = plan.items.find(x => x.id === id);
  if (!item || (item.ownedTarget ?? null) === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, items: plan.items.map(x => x.id === id ? { ...x, ownedTarget: value } : x) }), changed: true };
}
// Only complete online snapshots establish a baseline. Reconnects and ordinary rounds never reset.
function observeItemMatch(plan, state, server = '') {
  const room = state?.room, me = state?.me?.playerId, pub = state?.match?.public;
  const previous = plan.itemSession.match;
  if (state?.connection?.status !== 'online' || state?.ui?.buildStale || !room ||
      typeof room.code !== 'string' || typeof me !== 'string' || !me ||
      !Array.isArray(room.seats) || !room.seats.some(seat => seat?.playerId === me)) return { plan, changed: false };
  const key = `${server}|${room.code}|${me}`;
  if (key.length > 512) return { plan, changed: false };
  if (room.inMatch === false) {
    if (!previous || previous.left || previous.key !== key) return { plan, changed: false };
    return { plan: { ...plan, itemSession: { ...plan.itemSession, match: { ...previous, left: true } } }, changed: true };
  }
  const priv = state?.match?.private;
  if (room.inMatch !== true || !Number.isInteger(pub?.round) || pub.round < 0 ||
      !Array.isArray(pub.players) || !pub.players.some(p => p?.playerId === me) ||
      !priv || ![priv.hand, priv.board, priv.temp].every(Array.isArray)) return { plan, changed: false };
  const newMatch = !!previous && (previous.key !== key || previous.left || pub.round <= 1 && previous.round > pub.round);
  const round = newMatch || !previous ? pub.round : Math.max(previous.round, pub.round);
  if (!newMatch && previous?.key === key && previous.round === round) return { plan, changed: false };
  const next = newMatch ? nextItemMatch(plan) : { plan, changed: false };
  if (newMatch && !next.changed) return { plan, changed: false };
  return { plan: { ...next.plan, itemSession: { ...next.plan.itemSession, match: { key, round, left: false } } }, changed: true, newMatch };
}
function setItemMinFunds(plan, id, value) {
  if (value !== null && !validFunds(value)) throw new Error('购买前资金门槛必须是 0–999999999 的整数或留空');
  const item = plan.items.find(x => x.id === id);
  if (!item || item.minFunds === value) return { plan, changed: false };
  return { plan: { ...plan, items: plan.items.map(x => x.id === id ? { ...x, minFunds: value } : x) }, changed: true };
}
function setKeepLimit(plan, id, value) {
  if (value !== null && optionalLimit(value) === null) throw new Error('保留干员持有目标必须是 1–99 的整数或留空');
  if (!plan.keep.includes(id) || plan.keepRules?.[id]?.limit === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, keepRules: { ...plan.keepRules, [id]: { ...plan.keepRules?.[id], limit: value } } }), changed: true };
}
function setKeepMinFunds(plan, id, value) {
  if (value !== null && !validFunds(value)) throw new Error('购买前资金门槛必须是 0–999999999 的整数或留空');
  if (!plan.keep.includes(id) || plan.keepRules?.[id]?.minFunds === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, keepRules: { ...plan.keepRules, [id]: { ...plan.keepRules?.[id], minFunds: value } } }), changed: true };
}
function setItemLimit(plan, id, limit) {
  if (limit !== null && optionalLimit(limit) === null) throw new Error('道具抓取上限必须是 1–99 的整数或留空（不限）');
  const item = plan.items.find(x => x.id === id);
  if (!item || item.limit === limit) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, items: plan.items.map(x => x.id === id ? { ...x, limit } : x) }), changed: true };
}
function recordItemPurchase(plan, id, delta) {
  const item = plan.items.find(x => x.id === id);
  if (!item || (delta !== 1 && delta !== -1)) return { plan, changed: false };
  const counts = { ...plan.itemSession.used }, previous = counts[id] || 0;
  const next = delta > 0 ? previous >= (item.limit ?? 9999) ? previous : previous + 1 : Math.max(0, previous - 1);
  if (next === previous) return { plan, changed: false };
  if (next) counts[id] = next; else delete counts[id];
  return { plan: normalizePlan({ ...plan, itemSession: { ...plan.itemSession, used: counts } }), changed: true };
}
// 仅道具累计购买次数需要持久确认；干员数量始终来自当前库存。
// Never apply an in-flight item purchase to a different manually selected match.
function confirmPurchaseCount(plan, kind, id, epoch, count) {
  if (kind !== 'item') return { plan, changed: false, reason: '干员持有数量由游戏库存自动核对，不能累计或手动修改' };
  if (Number.isSafeInteger(epoch) && epoch<plan.itemSession.epoch)return {plan,changed:false,reason:''}; // A reset superseded this ACK; never apply it to the new cycle.
  if (epoch !== plan.itemSession.epoch) return { plan, changed: false, reason: '已切换对局，请手动核对刚才的购买次数' };
  const exists = plan.items.some(item => item.id === id);
  const max = 9999;
  if (!Number.isInteger(count) || count < 1 || count > max) return { plan, changed: false, reason: '购买次数无效，请手动核对' };
  if(!exists)return {plan,changed:false,reason:''}; // Deleted during flight: acknowledge without resurrecting the item.
  const session = plan.itemSession;
  const next = Math.max(session.used[id] || 0, count);
  if (next === session.used[id]) return { plan, changed: false, reason: '' };
  const updated = { ...session, used: { ...session.used, [id]: next } };
  return { plan: normalizePlan({ ...plan, itemSession: updated }), changed: true, reason: '' };
}
function nextItemMatch(plan) {
  if (plan.itemSession.epoch >= Number.MAX_SAFE_INTEGER) return { plan, changed: false };
  const items = plan.items.map(item => {
    if (item.capPaused !== true) return item;
    const { capPaused, ...rest } = item;
    return { ...rest, enabled: true };
  });
  return { plan: normalizePlan({ ...plan, items, itemSession: { ...plan.itemSession, used: {}, epoch: plan.itemSession.epoch + 1 } }), changed: true };
}
function removeItem(plan, id) {
  if (!plan.items.some(x => x.id === id)) return { plan, changed: false };
  const counts = { ...plan.itemSession.used }; delete counts[id];
  return { plan: { ...plan, items: plan.items.filter(x => x.id !== id), itemSession: { ...plan.itemSession, used: counts } }, changed: true };
}

// ---- 启停快捷键 (start/stop hotkey) -------------------------------------
// Stored by physical key (event.code) so it does not depend on IME or keyboard layout.
const DEFAULT_HOTKEY = Object.freeze({ code: 'F8', ctrl: false, alt: false, shift: false });
const HOTKEY_CODE = /^(?:F(?:[1-9]|1[0-2])|Key[A-Z]|Digit[0-9]|Numpad[0-9]|Pause|ScrollLock|Insert|Home|End|PageUp|PageDown|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;
const HOTKEY_BARE_OK = new Set(['F2', 'F4', 'F8', 'F9', 'Pause', 'ScrollLock', 'Insert']);
const HOTKEY_CTRL_TAKEN = new Set([...'ACDEFGHJKLNOPQRSTUVWXYZ'].map(c => 'Key' + c));
const HOTKEY_CTRL_SHIFT_TAKEN = new Set([...'ABCIJMNOQRTW'].map(c => 'Key' + c));
const HOTKEY_KEY_NAMES = { Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';',
  Quote: "'", Comma: ',', Period: '.', Slash: '/', ScrollLock: 'ScrLk', PageUp: 'PgUp', PageDown: 'PgDn', Insert: 'Ins' };
function hotkeyFromEvent(event) {
  return { code: String(event?.code || ''), ctrl: !!event?.ctrlKey, alt: !!event?.altKey, shift: !!event?.shiftKey, meta: !!event?.metaKey };
}
function hotkeyLabel(hotkey) {
  if (!hotkey || typeof hotkey.code !== 'string') return '未设置';
  const code = hotkey.code, key = /^Key[A-Z]$/.test(code) ? code.slice(3) : /^Digit\d$/.test(code) ? code.slice(5)
    : /^Numpad\d$/.test(code) ? `小键盘${code.slice(6)}` : HOTKEY_KEY_NAMES[code] || code.slice(0, 20);
  return [hotkey.meta && 'Win', hotkey.ctrl && 'Ctrl', hotkey.alt && 'Alt', hotkey.shift && 'Shift', key].filter(Boolean).join('+');
}
// '' when usable; otherwise a short Chinese reason (browser-reserved, typing keys, etc.).
function baseHotkeyProblem(hotkey) {
  const code = hotkey?.code;
  if (typeof code !== 'string' || !HOTKEY_CODE.test(code)) return '这个键不能用作快捷键，请换 F 键或 Ctrl / Alt 组合';
  if (hotkey.meta) return 'Win / ⌘ 组合由系统占用，请换一个';
  const ctrl = !!hotkey.ctrl, alt = !!hotkey.alt, shift = !!hotkey.shift;
  if (!ctrl && !alt) {
    if (HOTKEY_BARE_OK.has(code)) return '';
    if (code === 'F5') return 'F5 会刷新网页';
    if (code === 'F11') return 'F11 是浏览器全屏';
    if (code === 'F12') return 'F12 会打开开发者工具';
    if (code === 'F1') return 'F1 会打开浏览器帮助';
    if (/^F\d+$/.test(code)) return '这个功能键被浏览器占用；单键可用字母、F2 / F4 / F8 / F9 / Pause / ScrLk / Ins，或加 Ctrl / Alt';
    // 单字母（含 Shift+字母）可以：在输入框里打字时不会触发，见 hotkeyIsTyping。
    if (/^Key[A-Z]$/.test(code)) return code === 'KeyN' && !shift ? '工作台已用 N 打开“添加干员”，请换一个字母' : '';
    return '单独的数字或符号键容易误触，请换字母、F 键或加 Ctrl / Alt';
  }
  if (code === 'F4' || code === 'F5') return 'Ctrl / Alt + F4、F5 会关闭或刷新页面';
  if (ctrl && !alt) {
    if (/^(?:Digit|Numpad)\d$/.test(code)) return 'Ctrl + 数字用于切换标签页';
    if (!shift && HOTKEY_CTRL_TAKEN.has(code)) return '与浏览器或编辑快捷键冲突（如 Ctrl+W / T / R / C / V）';
    if (shift && HOTKEY_CTRL_SHIFT_TAKEN.has(code)) return '与浏览器快捷键冲突（如 Ctrl+Shift+T / N / I）';
  }
  if (alt && !ctrl && !shift && ['KeyD', 'KeyE', 'KeyF'].includes(code)) return 'Alt+D / E / F 被浏览器地址栏或菜单占用';
  return '';
}
// 游戏自带快捷键（Stronghold Protocol「设置 → 快捷键」，存于页面 localStorage 的 sp.pref.settings.keys，按 event.code）。
// 游戏在按住 Ctrl / Alt / ⌘ 或输入框有焦点时不响应快捷键；Shift 不影响（按字符小写匹配）。
const GAME_DEFAULT_KEYS = Object.freeze({ refresh: 'KeyR', freeze: 'KeyF', levelUp: 'KeyD', retreat: 'KeyQ', sell: 'KeyX', ready: 'Space' });
const GAME_KEY_NAMES = { refresh: '刷新商店', freeze: '冻结商店', levelUp: '升级调度中心', retreat: '撤退干员', sell: '出售干员', ready: '准备就绪' };
function normalizeGameKeys(raw) {
  const keys = { ...GAME_DEFAULT_KEYS };
  if (raw && typeof raw === 'object') for (const action of Object.keys(GAME_KEY_NAMES))
    if (typeof raw[action] === 'string' && /^[A-Za-z0-9]{1,20}$/.test(raw[action])) keys[action] = raw[action];
  return keys;
}
function gameHotkeyConflict(hotkey, gameKeys = GAME_DEFAULT_KEYS) {
  if (!hotkey || !gameKeys || hotkey.ctrl || hotkey.alt || hotkey.meta) return '';
  const action = Object.keys(GAME_KEY_NAMES).find(name => gameKeys[name] === hotkey.code);
  return action ? GAME_KEY_NAMES[action] : '';
}
// '' when usable; otherwise a short Chinese reason. Pass gameKeys to also reject the game's own shortcut keys.
function hotkeyProblem(hotkey, gameKeys = null) {
  const base = baseHotkeyProblem(hotkey);
  if (base) return base;
  const clash = gameHotkeyConflict(hotkey, gameKeys);
  return clash ? `与游戏快捷键「${clash}」冲突（也可在游戏「设置 → 快捷键」里改键）` : '';
}
// A letter without Ctrl / Alt types text: such a hotkey never fires while a text field has the focus.
const hotkeyIsTyping = hotkey => !!hotkey && !hotkey.ctrl && !hotkey.alt && /^Key[A-Z]$/.test(hotkey.code);
function normalizeHotkey(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const hotkey = { code: String(raw.code || ''), ctrl: raw.ctrl === true, alt: raw.alt === true, shift: raw.shift === true };
  return hotkeyProblem(hotkey) ? null : hotkey;
}
function matchesHotkey(hotkey, event) {
  return !!hotkey && !!event && event.code === hotkey.code && !event.metaKey
    && !!event.ctrlKey === !!hotkey.ctrl && !!event.altKey === !!hotkey.alt && !!event.shiftKey === !!hotkey.shift;
}

// ---- 配置文件导入 / 导出 ----
// 导出全部配置（名单、禁用与锁定、保留规则、道具、自编干员、快捷键与界面设置）；
// 道具本局累计次数、启停状态不导出；干员实时持有量不存入方案。导入保留当前道具次数。
const CONFIG_FORMAT = 'wei-cardkeeper-config';
const CONFIG_VERSION = 1;
const MAX_CONFIG_CHARS = 1048576;
function exportConfig(plan, meta = {}) {
  const { itemSession, draftEnabled, itemsView, itemBuyingPaused, ...config } = normalizePlan(plan);
  // Export the user's enable preference, never a transient per-match pause.
  config.items = config.items.map(({ capPaused, ...item }) => capPaused === true ? { ...item, enabled: true } : item);
  return { format: CONFIG_FORMAT, version: CONFIG_VERSION, exportedAt: typeof meta.now === 'string' ? meta.now : new Date().toISOString(),
    app: typeof meta.app === 'string' ? meta.app.slice(0, 40) : '', plan: config };
}
function importConfig(input, current) {
  let data = input;
  if (typeof input === 'string') {
    if (input.length > MAX_CONFIG_CHARS) return { ok: false, reason: 'size' };
    try { data = JSON.parse(input.replace(/^\uFEFF/, '')); } catch { return { ok: false, reason: 'json' }; }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, reason: 'format' };
  let body = null;
  if (data.format === CONFIG_FORMAT) {
    if (!Number.isInteger(data.version) || data.version < 1) return { ok: false, reason: 'format' };
    if (data.version > CONFIG_VERSION) return { ok: false, reason: 'version' };
    body = data.plan;
  } else if (Array.isArray(data.buy) && Array.isArray(data.keep)) body = data; // 旧版直接保存的方案对象
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, reason: 'format' };
  const now = normalizePlan(current);
  const plan = normalizePlan({ ...body, itemSession: now.itemSession, itemBuyingPaused: now.itemBuyingPaused, itemsView: now.itemsView, draftEnabled: false });
  plan.draftEnabled = false;
  return { ok: true, plan, summary: { buy: plan.buy.length, keep: plan.keep.length, items: plan.items.length, custom: plan.customOperators.length,
    exportedAt: data.format === CONFIG_FORMAT && typeof data.exportedAt === 'string' ? data.exportedAt.slice(0, 40) : '' } };
}

return {STORAGE_KEY,CONFIG_FORMAT,exportConfig,importConfig,MAX_CONFIG_CHARS,DEFAULT_HOTKEY,normalizeHotkey,hotkeyFromEvent,hotkeyProblem,hotkeyLabel,matchesHotkey,GAME_DEFAULT_KEYS,normalizeGameKeys,gameHotkeyConflict,hotkeyIsTyping,KINDS,normalizePlan,filterOperators,updateFilter,toggleSelection,toggleLock,clearUnlocked,selectVisible,examplePlan,addedOperators,candidateOperators,addOperator,removeOperator,toggleDisabled,moveIconOperator,moveItemIcon,MAX_ICON_GRID_CELLS,iconGridSlots,previewIconGrid,moveIconToCell,allOperators,addNamedOperator,MAX_MANUAL_NAME_LENGTH,ITEMS,addItem,addNamedItem,setItemLimit,setItemOwnedTarget,observeItemMatch,setItemEnabled,toggleItemEnabled,setItemAutoUse,itemCapReached,setItemMinFunds,setKeepLimit,setKeepMinFunds,removeItem,recordItemPurchase,confirmPurchaseCount,nextItemMatch};
})();
// Live catalogue builder ported from the reference extension. No game actions.
const isId = id => typeof id === 'string' && /^[A-Za-z0-9_:-]{1,80}$/.test(id);
function buildCatalogue(chess, bonds) {
  const bondEntries = Object.entries(bonds || {})
    .filter(([id, rec]) => isId(id) && rec && typeof rec === 'object')
    .map(([id, rec]) => ({ id, name: String(rec.name || id), isCore: rec.isCore === true,
      order: Number.isFinite(rec.identifier) ? rec.identifier : 999 }));
  bondEntries.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'zh-CN'));
  const nameByBond = new Map(bondEntries.map(b => [b.id, b.name]));
  const operators = Object.entries(chess || {}).filter(([id, rec]) =>
    isId(id) && rec && typeof rec === 'object' && rec.isGolden !== true)
    .map(([id, rec]) => {
      const roleBonds = [...new Set((Array.isArray(rec.bonds) ? rec.bonds : []).filter(isId))];
      return {
        id, name: String(rec.name || id), charId: String(rec.charId || ''),
        tier: Number.isInteger(rec.tier) ? rec.tier : 0,
        order: Number.isFinite(rec.identifier) ? rec.identifier : 9999,
        bonds: roleBonds, bondNames: roleBonds.map(b => nameByBond.get(b) || b),
        buyable: rec.visible === true && rec.isHidden !== true && rec.isDiy !== true,
        hidden: rec.isHidden === true,
        diy: rec.isDiy === true,
      };
    });
  operators.sort((a, b) => a.tier - b.tier || a.order - b.order || a.id.localeCompare(b.id));
  return { operators, bonds: bondEntries };
}


// 自选编队: a DIY slot (chess_char_6_diy1_a …) is named 甄选干员 in chess.json. Show the operator the
// player slotted instead — the match's picks while in a match (server-fixed), otherwise the page's
// own 自选编队 setting (applies to the next match) — or 无 when the slot is empty.
const DIY_SLOT = /^chess_char_(\d)_diy(\d+)_a$/;
const TIER_NAMES = ['', '一', '二', '三', '四', '五', '六'];
function diySlotLabels(chess, { matchPicks = null, storedPicks = null, operators = null } = {}) {
  const inMatch = !!matchPicks && typeof matchPicks === 'object';
  const picks = inMatch ? matchPicks : storedPicks && typeof storedPicks === 'object' ? storedPicks : {};
  const labels = {};
  for (const [id, rec] of Object.entries(chess || {})) {
    if (!isId(id) || rec?.isDiy !== true || rec.isGolden === true) continue;
    const pick = Object.hasOwn(picks, id) ? picks[id] : null;
    const charId = typeof pick?.charId === 'string' && isId(pick.charId) ? pick.charId : '';
    const op = charId && operators && Object.hasOwn(operators, charId) ? operators[charId] : null;
    const name = !charId ? '无' : typeof op?.name === 'string' && op.name.trim() ? op.name.trim().slice(0, 40) : `未识别 ${charId}`;
    labels[id] = { name, charId, bonds: Array.isArray(op?.bonds) ? op.bonds.filter(isId).slice(0, 8) : [],
      source: !charId ? '' : inMatch ? 'match' : 'setting' };
  }
  return labels;
}
function withDiyLabels(catalogue, labels, bonds) {
  if (!catalogue || !labels || !Object.keys(labels).length) return catalogue;
  const bondName = id => String(bonds?.[id]?.name || id);
  return { ...catalogue, operators: catalogue.operators.map(op => {
    const label = Object.hasOwn(labels, op.id) ? labels[op.id] : null;
    if (!label) return op;
    const m = DIY_SLOT.exec(op.id), slot = m ? `${TIER_NAMES[Number(m[1])] || m[1]}阶自选 ${m[2]} 号` : '自选槽位';
    const note = !label.charId ? `${slot} · 未选择干员` : `${slot} · ${label.source === 'match' ? '本局编队' : '编队设置，下局生效'}`;
    return { ...op, name: label.name, diyCharId: label.charId, diyEmpty: !label.charId, diyNote: note,
      bonds: label.bonds, bondNames: label.bonds.map(bondName) };
  }) };
}

// 与游戏 data/assets.json 的映射一致；只接受当前服务器的图片资源，不猜测文件名。
const GAME_ICON_ID = /^[A-Za-z0-9_:-]{1,100}$/;
const iconObject = value => value && typeof value === 'object' && !Array.isArray(value) ? value : null;
const iconOwn = (value, key) => iconObject(value) && typeof key === 'string' && Object.hasOwn(value, key) ? value[key] : null;

function sameServerIcon(value, root) {
  if (!root || typeof value !== 'string' || !value || value.length > 2048) return '';
  try {
    const url = new URL(value, root);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== root.origin || url.username || url.password ||
        !/\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(url.pathname)) return '';
    url.hash = '';
    return url.href;
  } catch { return ''; }
}

function createGameIconIndex(manifest, baseUrl) {
  const out = { chars: Object.create(null), items: Object.create(null) };
  let root;
  try {
    root = new URL(baseUrl);
    if (!['http:', 'https:'].includes(root.protocol) || root.username || root.password) return out;
  } catch { return out; }
  for (const [id, rec] of Object.entries(iconObject(manifest?.chars) || {}).slice(0, 4096)) {
    if (!GAME_ICON_ID.test(id) || !iconObject(rec)) continue;
    const avatar = sameServerIcon(rec.avatar, root), avatarE2 = sameServerIcon(rec.avatarE2, root);
    if (avatar || avatarE2) out.chars[id] = { avatar, avatarE2 };
  }
  for (const [id, value] of Object.entries(iconObject(manifest?.items) || {}).slice(0, 4096)) {
    const url = sameServerIcon(value, root);
    if (GAME_ICON_ID.test(id) && url) out.items[id] = url;
  }
  return out;
}

function operatorGameIcon(index, record) {
  const chars = index?.chars;
  // 空自选槽位不能借用底板头像；已选槽位始终跟随本局 / 编队设置的实际干员。
  if (record?.diy === true || record?.isDiy === true) return iconOwn(chars, record.diyCharId)?.avatar || '';
  const preferred = typeof record?.assets?.avatar === 'string' && record.assets.avatar ? record.assets.avatar : record?.charId;
  const exact = iconOwn(chars, preferred);
  if (exact?.avatar) return exact.avatar;
  if (!exact && typeof preferred === 'string' && preferred.endsWith('_2')) {
    const base = iconOwn(chars, preferred.slice(0, -2));
    if (base) return base.avatarE2 || base.avatar || '';
  }
  return iconOwn(chars, record?.charId)?.avatar || '';
}

function itemGameIcon(index, record) {
  return iconOwn(index?.items, record?.iconId) || iconOwn(index?.items, record?.trapId) || '';
}

// 只读库存快照；交易和界面共用。普通干员计1，精二计3，跨区域用 UID 核对。
function operatorBaseId(id, chess) {
  if (typeof id !== 'string' || !chess?.[id]) return null;
  const rec = chess[id];
  return typeof rec.baseId === 'string' && chess[rec.baseId] ? rec.baseId : id;
}

function inspectInventory(priv, chess) {
  const fail = reason => ({ ok: false, reason });
  if (!priv || ![priv.hand, priv.board, priv.temp].every(Array.isArray) || !chess || typeof chess !== 'object') {
    return fail('游戏的库存快照不完整');
  }
  const units = [];
  const items = [];
  let ownedCopies = Object.create(null);
  const seen = new Set();
  const addItem = (piece, area, carrierUid = null) => {
    if (!Number.isInteger(piece?.uid) || piece.uid < 0 || typeof piece.id !== 'string' || seen.has(piece.uid)) {
      return false;
    }
    seen.add(piece.uid);
    items.push({ uid: piece.uid, id: piece.id, area, carrierUid });
    return true;
  };
  for (const [area, list] of [['hand', priv.hand], ['board', priv.board], ['temp', priv.temp]]) {
    for (const piece of list) {
      if (!piece) continue;
      if (piece.kind === 'item') {
        if (!addItem(piece, area)) return fail('道具 UID 缺失或重复');
      } else if (piece.kind === 'chess') {
        if (!Number.isInteger(piece.uid) || piece.uid < 0 || typeof piece.id !== 'string' ||
            seen.has(piece.uid)) return fail('库存 UID 缺失或重复');
        seen.add(piece.uid);
        const unit = { uid: piece.uid, id: piece.id, base: operatorBaseId(piece.id, chess), area,
          golden: piece.golden === true || chess[piece.id]?.isGolden === true,
          equipped: (Array.isArray(piece.items) ? piece.items : []).length };
        units.push(unit);
        if (!unit.base || chess[unit.base]?.isGolden === true) ownedCopies = null; // 未知干员不能当作数量为零。
        else if (ownedCopies) ownedCopies[unit.base] = (ownedCopies[unit.base] || 0) + (unit.golden ? 3 : 1);
        if (piece.items != null && !Array.isArray(piece.items)) return fail('已配发装备信息不完整');
        for (const item of piece.items || []) {
          if (!addItem(item, 'equipped', piece.uid)) return fail('已配发道具 UID 缺失或重复');
        }
      } else if (Number.isInteger(piece.uid)) {
        // A token cannot impersonate a newly obtained chess or item UID.
        if (seen.has(piece.uid)) return fail('库存 UID 重复');
        seen.add(piece.uid);
      }
    }
  }
  return { ok: true, hand: priv.hand, units, unitByUid: new Map(units.map(unit => [unit.uid, unit])),
    items, itemByUid: new Map(items.map(item => [item.uid, item])), ownedCopies };
}

// Count only still-present item UIDs, including hand, field, temp and equipped copies.
function countItemCopies(inventory, ids, excludeAreas = []) {
  if (!inventory?.ok || !Array.isArray(inventory.items)) return null;
  const values = ids instanceof Set ? [...ids] : Array.isArray(ids) ? ids : [ids];
  const accepted = new Set(values.filter(id => typeof id === 'string' && id.length > 0));
  if (!accepted.size) return null;
  const excluded = excludeAreas instanceof Set ? excludeAreas : new Set(Array.isArray(excludeAreas) ? excludeAreas : []);
  return inventory.items.reduce((count, item) => count + (accepted.has(item?.id) && !excluded.has(item?.area) ? 1 : 0), 0);
}

// Map tracked IDs to their verified server IDs, count live UIDs, and fold item upgrade variants.
function countTrackedItemCopies(inventory, items, matches = {}, knownIds = [], gameItems = null) {
  if (!inventory?.ok || !Array.isArray(inventory.items) || !Array.isArray(items)) return null;
  const known = knownIds instanceof Set ? knownIds : new Set(Array.isArray(knownIds) ? knownIds : []);
  const body = gameItems?.items || gameItems, records = new Map();
  if (Array.isArray(body)) {
    for (const record of body.slice(0,4096)) if (typeof record?.id === 'string') records.set(record.id,record);
  } else if (body && typeof body === 'object') {
    for (const [id,record] of Object.entries(body).slice(0,4096)) records.set(id,record);
  }
  const counts = Object.create(null);
  for (const item of items) {
    if (typeof item?.id !== 'string') continue;
    const real = matches?.[item.id] || (known.has(item.id) ? item.id : null);
    if (!real) { counts[item.id] = null; continue; }
    const record = records.get(real), base = typeof record?.baseId === 'string' ? record.baseId : real;
    const baseRecord = records.get(base), ids = new Set([real,base]);
    for (const candidate of [record,baseRecord]) {
      const golden = candidate?.goldenId || candidate?.upgradeChessId;
      if (typeof golden === 'string') ids.add(golden);
    }
    // 人事部文档装备后留下的是永久效果，不再算作持有中的道具。
    const excludeAreas = real === 'chess_item_6_08_e_a' ? ['equipped'] : [];
    counts[item.id] = countItemCopies(inventory,ids,excludeAreas);
  }
  return counts;
}

// Placement-only tolerance, shared by the controller and MAIN. Never equates different UIDs,
// identities, elite flags, equipment counts, or moves into/out of the temporary overflow area.
function compatiblePlacementArea(before, after) {
  return before===after || (before==='hand' && after==='board') || (before==='board' && after==='hand');
}
function sameUnitWithPlacement(before, after) {
  return !!before && !!after && before.uid===after.uid && before.id===after.id && before.base===after.base &&
    before.golden===after.golden && before.equipped===after.equipped && compatiblePlacementArea(before.area,after.area);
}
function changedDeployment(before, after) {
  return sameUnitWithPlacement(before,after) && before.area!==after.area;
}

// Only call inside a fully audited buy/sell action, never for idle/manual changes.
// Normalize one-way refill for surviving, identical old UIDs; the enclosing action audit
// must still prove EVERY disappearance, new UID, equipment return, and reward.
function normalizeActionRefill(before, after) {
  const fail=()=>({ok:false,reason:'临时区补位的 UID、身份或手牌容量无法核验；已停止'});
  if(!before?.ok || !after?.ok || before.identity!==after.identity ||
    !Array.isArray(before.hand) || !Array.isArray(after.hand) || after.hand.filter(Boolean).length>10)return fail();
  const refilledUids=[], refilledItems=[];
  const units=after.units.map(unit=>{
    const old=before.unitByUid.get(unit.uid);
    if(old?.area==='temp' && unit.area==='hand' && old.id===unit.id && old.base===unit.base &&
      old.golden===unit.golden && old.equipped===unit.equipped){refilledUids.push(unit.uid);return {...unit,area:'temp'};}
    return unit;
  });
  const items=after.items.map(item=>{
    const old=before.itemByUid.get(item.uid);
    if(old?.area==='temp' && item.area==='hand' && old.id===item.id &&
      old.carrierUid==null && item.carrierUid==null){refilledItems.push(item.uid);return {...item,area:'temp'};}
    return item;
  });
  const released=before.units.filter(u=>u.area==='hand' &&
    (!after.unitByUid.has(u.uid) || after.unitByUid.get(u.uid).area==='board')).length;
  const slots=10-before.hand.filter(Boolean).length+released;
  if(refilledUids.length+refilledItems.length>slots)return fail();
  return {ok:true,refilledUids,after:{...after,units,items,
    unitByUid:new Map(units.map(u=>[u.uid,u])),itemByUid:new Map(items.map(it=>[it.uid,it]))}};
}

// Pure, independently checked in both worlds. Does not grant any UID sale authority.
function canSellSurplusGift(ctx, uid, plan, chess) {
  const unit=ctx?.unitByUid?.get(uid), base=unit?.base;
  if(!ctx?.ok || !unit || !base || !chess?.[base] || !ctx.ownedCopies)return false;
  const kept=(Array.isArray(plan?.keep) ? plan.keep : []).some(id=>
    id===base || (chess?.[id]?.baseId===base && !!chess[base]));
  if(!kept)return true;
  const limit=plan?.keepRules?.[base]?.limit, held=ctx.ownedCopies[base];
  return Number.isInteger(limit) && limit>0 && limit<=99 && Number.isInteger(held) &&
    held-(unit.golden ? 3 : 1)>=limit;
}


// Packaging gifts are retained, never added to the automatic sale ledger.
function auditPackagingSaleSettled(before, after, uid, { chess = {}, gameItems = null } = {}) {
  const fail = reason => ({ ok:false, reason });
  if (!before?.ok || !after?.ok || before.identity !== after.identity) return fail('卖出期间对局已改变');
  const sold = before.unitByUid.get(uid);
  if (!sold || after.unitByUid.has(uid)) return fail('出售目标 UID 未唯一消失');
  const vanished = before.units.filter(unit => unit.uid !== uid && !after.unitByUid.has(unit.uid));
  const appeared = after.units.filter(unit => !before.unitByUid.has(unit.uid));
  if (!appeared.length && !vanished.length) {
    if(before.units.some(unit=>unit.uid!==uid &&
      !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
      return fail('出售期间旧干员发生未知变化；已停止');
    if((before.items || []).some(item=>{
      const next=after.itemByUid?.get(item.uid);
      return !next || next.id!==item.id || next.area!==item.area || next.carrierUid!==item.carrierUid;
    }) || (after.items || []).some(item=>!before.itemByUid?.has(item.uid)))
      return fail('出售期间装备发生未知变化；已停止');
    return {ok:true};
  }
  const body = gameItems?.items || gameItems;
  const records = new Map(Array.isArray(body) ? body.map(rec=>[rec?.id,rec]) : Object.entries(body || {}));
  const rules = [];
  for (const item of before.items || []) {
    if(item.area !== 'equipped' || item.carrierUid === uid)continue;
    const rec=records.get(item.id), carrier=before.unitByUid.get(item.carrierUid);
    const known=item.id==='chess_item_5_07_e_a' || item.id==='chess_item_5_07_e_b';
    const named=typeof rec?.name==='string' && rec.name.replace(/<[^>]*>/g,'').trim()==='商业包装方案';
    if((!known && !named) || !rec || !carrier || !chess[carrier.base])continue;
    const desc=typeof rec.desc==='string' ? rec.desc.replace(/<[^>]*>/g,'') : '';
    if(!/出售|卖出/.test(desc) || !/获得/.test(desc))continue;
    // The connected server's description chooses the variant, never a wiki or item-name guess.
    if(/同名/.test(desc))rules.push({base:carrier.base});
    else if(/同盟约/.test(desc) && Array.isArray(chess[carrier.base].bonds))
      rules.push({bonds:chess[carrier.base].bonds.filter(bond=>typeof bond==='string')});
  }
  if(!rules.length)return fail('出售后出现额外干员，但商业包装方案的本服效果无法核验；已停止，赠员未自动出售');
  if(appeared.length>rules.length)return fail('商业包装方案赠员数量超出可核验范围；未自动出售');
  // Old surviving UIDs must retain their identity and equipment; unknown transformations stay blocked.
  if(before.units.some(unit=>unit.uid!==uid && after.unitByUid.has(unit.uid) &&
    !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
    return fail('包装赠员期间旧干员发生未知变化；未自动出售');
  const consumed=new Set();
  for(const gift of appeared){
    const rec=chess[gift.id], base=(typeof chess[gift.id]?.baseId==='string' ? chess[gift.id].baseId : gift.id), normal=chess[base];
    const rule=rules.findIndex(r=>r.base===base || r.bonds?.some(bond=>normal?.bonds?.includes(bond)));
    if(rule<0 || !rec || !normal || !['hand','temp','board'].includes(gift.area) || gift.equipped!==0)
      return fail('新增干员不符合本服商业包装方案的赠员效果；未自动出售');
    rules.splice(rule,1);
    if(gift.golden){
      const need=Number.isInteger(normal.upgradeNum) && normal.upgradeNum>1 ? normal.upgradeNum : 3;
      if(normal.goldenId!==gift.id || need>99)return fail('包装赠员的合成规则无法核验');
      const old=vanished.filter(unit=>!consumed.has(unit.uid) && unit.base===base && !unit.golden);
      if(old.length<need-1)return fail('包装赠员合成所消耗的普通干员无法核验');
      for(const unit of old.slice(0,need-1))consumed.add(unit.uid);
    } else if(gift.id!==base)return fail('包装赠员不是可核验的初始同名干员');
  }
  if(vanished.some(unit=>!consumed.has(unit.uid)))return fail('除出售和包装赠员合成外，还有旧 UID 消失；已停止');
  // Every original item UID must survive. Proven consumed carriers may return equipment to hand/temp, never to another carrier.
  if((before.items || []).some(item=>item.carrierUid!==uid &&
    (after.itemByUid?.get(item.uid)?.id!==item.id || (consumed.has(item.carrierUid) ?
      !['hand','temp'].includes(after.itemByUid.get(item.uid).area) || after.itemByUid.get(item.uid).carrierUid!=null :
      after.itemByUid.get(item.uid).area!==item.area || (after.itemByUid.get(item.uid).carrierUid ?? null)!==(item.carrierUid ?? null)))))
    return fail('包装赠员期间旧装备发生未知变化；已停止');
  if((after.items || []).some(item=>!before.itemByUid?.has(item.uid)))
    return fail('包装赠员之外还产生了未知装备；已停止');
  const merged=vanished.length>0;
  const packagingReward=merged && isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel);
  const pineconeReward=!merged && sold.id==='chess_char_3_10_a' && isPineconeSaleOffer(after.rewardOffer,chess);
  if(after.rewardOffer && !packagingReward && !pineconeReward)return fail('包装赠员后奖励来源、等阶、候选或队列无法核验；未自动选卡');
  return {ok:true,packagingGifts:appeared,packagingMerged:merged,packagingReward,pineconeReward};
}

function isPackagingMergeOffer(offer, chess, shopLevel) {
  return !!offer && Number.isInteger(shopLevel) && shopLevel>=1 && shopLevel<=6 &&
    offer.source==='merge' && offer.label==null && offer.queued===0 &&
    offer.tier===Math.min(shopLevel+1,6) && Array.isArray(offer.slots) && offer.slots.length===3 &&
    new Set(offer.slots.map(slot=>slot?.id)).size===3 && offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.isGolden!==true &&
        Number.isInteger(rec?.tier) && rec.tier>=1 && rec.tier<=offer.tier;
    });
}

function isPineconeSaleOffer(offer, chess) {
  return !!offer && offer.source==='special' && offer.label==='松果' && offer.tier===1 &&
    offer.queued===0 && Array.isArray(offer.slots) && offer.slots.length>0 && offer.slots.length<=6 &&
    offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.tier===1 &&
        rec.isGolden!==true && rec.visible===true && rec.isHidden!==true && rec.isDiy!==true;
    });
}

function auditPackagingSale(before,after,uid,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditPackagingSaleSettled(before,refill.after,uid,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}

// Canonical complete offer stamp shared across the transport and MAIN proof checks.
function mergeOfferStamp(offer) {
  return JSON.stringify(offer && {source:offer.source,label:offer.label,tier:offer.tier,queued:offer.queued,
    slots:offer.slots.map(s=>!s ? null : {id:s.id,kind:s.kind,price:s.price,sold:s.sold===true})});
}

// A pending offer is NOT a general sell exemption. MAIN must additionally hold the
// single-use Flametail proof and a whitelist of this purchase's fresh UID candidates.
function auditPendingMergeSale(before,after,uid,options={}) {
  if(!before?.ok || !after?.ok || !isPackagingMergeOffer(before.rewardOffer,options.chess,before.shopLevel) ||
    mergeOfferStamp(before.rewardOffer)!==mergeOfferStamp(after.rewardOffer))
    return {ok:false,reason:'腾位出售期间原晋升奖励发生变化，禁止继续或重复领取'};
  const audited=auditPackagingSale({...before,rewardOffer:null},{...after,rewardOffer:null},uid,options);
  if(audited.ok && audited.packagingMerged)return {ok:false,reason:'腾位期间发生额外包装合成，不能继续使用原单次晋升证明'};
  return audited;
}

// Only the active, proved overflow cycle may wait for pure deployment + automatic refill.
// Identity, all UIDs, equipment, funds, shop and the exact pending offer must stay unchanged.
function auditOverflowPlacement(before,after,chess) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const normalized=refill.after;
  const ok=isPackagingMergeOffer(before.rewardOffer,chess,before.shopLevel) &&
    mergeOfferStamp(before.rewardOffer)===mergeOfferStamp(after.rewardOffer) &&
    before.funds===after.funds && before.shopLevel===after.shopLevel && before.refreshPrice===after.refreshPrice &&
    JSON.stringify(before.slots)===JSON.stringify(after.slots) &&
    before.units.length===normalized.units.length && before.units.every(u=>sameUnitWithPlacement(u,normalized.unitByUid.get(u.uid))) &&
    before.items.length===normalized.items.length && before.items.every(it=>{
      const next=normalized.itemByUid.get(it.uid);
      return next && next.id===it.id && next.area===it.area && (next.carrierUid ?? null)===(it.carrierUid ?? null);
    }) && (!(refill.refilledUids.length || after.items.some(it=>it.area==='hand' && before.itemByUid.get(it.uid)?.area==='temp')) ||
      before.units.some(u=>u.area==='hand' && after.unitByUid.get(u.uid)?.area==='board'));
  return ok ? {ok:true,refilledUids:refill.refilledUids} :
    {ok:false,reason:'爆仓腾位等待期间检测到部署/补位之外的库存、资金或奖励变化'};
}


// Shared pure trade evidence. Both the isolated controller and MAIN compile this module.
// A retained merge is attributable only when one new normal completes these exact old copies.
function planRetainedMerge(ctx, id, chess) {
  const rec=chess?.[id], base=rec?.baseId && chess[rec.baseId] ? rec.baseId : id;
  if(!ctx?.ok || !rec || rec.isGolden===true || id!==base || !chess[rec.goldenId]?.isGolden) return null;
  const need=Number.isInteger(rec.upgradeNum) && rec.upgradeNum>1 ? rec.upgradeNum : 3;
  if(need>99)return null;
  const old=ctx.units.filter(unit=>unit.base===base && !unit.golden);
  if(old.length!==need-1 || old.some(unit=>unit.id!==id))return null;
  return {base,normalId:id,goldenId:rec.goldenId,need,consumed:old.map(unit=>unit.uid)};
}

function auditOrdinaryPurchase(before, after, candidate, {chess={}, retained=false}={}) {
  const fail=reason=>({ok:false,reason});
  if(!before?.ok || !after?.ok || before.identity!==after.identity || before.rewardOffer)
    return fail('普通购买期间对局或奖励状态不一致');
  const original=before.slots?.[candidate.slot], current=after.slots?.[candidate.slot];
  if(!original || original.kind!=='chess' || original.id!==candidate.id || original.sold===true ||
    original.price!==candidate.price || !current || current.kind!=='chess' ||
    current.id!==candidate.id || current.sold!==true || !Number.isSafeInteger(candidate.price) || candidate.price<0 ||
    !Number.isSafeInteger(before.funds) || !Number.isSafeInteger(after.funds) || after.funds<before.funds-candidate.price)
    return fail('普通购买的槽位、实价或资金变化无法核验');
  if(before.slots.length!==after.slots.length || before.slots.some((slot,index)=> index!==candidate.slot &&
    (slot?.id!==after.slots[index]?.id || slot?.kind!==after.slots[index]?.kind ||
      slot?.price!==after.slots[index]?.price || (slot?.sold===true)!==(after.slots[index]?.sold===true))))
    return fail('普通购买期间其他商店槽位发生变化');
  const fresh=after.units.filter(unit=>!before.unitByUid.has(unit.uid));
  const missing=before.units.filter(unit=>!after.unitByUid.has(unit.uid));
  if(fresh.length!==1)return fail('普通购买不是唯一可归属的新干员 UID');
  const parent=fresh[0], merge=retained ? planRetainedMerge(before,candidate.id,chess) : null;
  const merged=!!merge && parent.id===merge.goldenId && parent.golden===true;
  const consumed=new Set(merged ? merge.consumed : []);
  if(merged ? missing.length!==consumed.size || missing.some(unit=>!consumed.has(unit.uid)) :
    missing.length!==0 || parent.id!==candidate.id)
    return fail('普通购买消耗的旧 UID 或新干员身份无法核验');
  if(parent.equipped!==0 || !['hand','temp','board'].includes(parent.area) ||
    parent.golden!==(chess[parent.id]?.isGolden===true))
    return fail('新购干员的位置、精锐状态或装备不符合预期');
  if(before.units.some(unit=>!consumed.has(unit.uid) && (()=>{
    const next=after.unitByUid.get(unit.uid);
    return !sameUnitWithPlacement(unit,next);
  })()))return fail('普通购买期间旧干员身份、位置或装备发生未知变化');
  if(merged ? !isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel) : !!after.rewardOffer)
    return fail('普通购买的合成奖励来源、等阶或队列无法核验');
  const gained=after.items.filter(item=>!before.itemByUid.has(item.uid));
  const lost=before.items.filter(item=>!after.itemByUid.has(item.uid));
  const bench=item=>!!item && ['hand','temp'].includes(item.area) && item.carrierUid==null;
  let coin=null, consumedCoin=null;
  // The one explicit item-gift exception: normal Swire's coin, or its exact bench merge.
  // Unexpected multi-gifts, equipped-coin merges and elite side effects remain blocked.
  if(candidate.id==='chess_char_3_03_a' && !merged) {
    if(gained.length===1 && gained[0].id==='chess_item_1_03_e_a' && bench(gained[0]) && !lost.length)
      coin={...gained[0],gain:1,merged:false};
    else if(gained.length===1 && gained[0].id==='chess_item_1_03_e_b' && bench(gained[0]) &&
      lost.length===1 && lost[0].id==='chess_item_1_03_e_a' && bench(lost[0])) {
      consumedCoin=lost[0].uid;
      coin={...gained[0],gain:2,merged:true,mergedFrom:consumedCoin};
    }
  }
  if(gained.length!==(coin ? 1 : 0) || lost.length!==(consumedCoin!==null ? 1 : 0))
    return fail('普通购买产生未知赠装或丢失旧装备；未授权出售');
  if(before.items.some(item=>{
    if(item.uid===consumedCoin)return false;
    const next=after.itemByUid.get(item.uid);
    return !next || next.id!==item.id || (consumed.has(item.carrierUid) ? !bench(next) :
      next.area!==item.area || (next.carrierUid ?? null)!==(item.carrierUid ?? null));
  }))return fail('普通购买期间旧装备迁移或合成返装无法核验');
  return {ok:true,parent,merged,mergedKeepReward:merged,consumedUids:[...consumed],coin};
}

// The stamp remains exact except for independently allowed hand/board placement of OTHER units.
function tradeInventoryStamp(ctx) {
  return JSON.stringify({
    units:ctx.units.map(unit=>[unit.uid,unit.id,unit.base,unit.area,unit.golden,unit.equipped]).sort((a,b)=>a[0]-b[0]),
    items:ctx.items.map(item=>[item.uid,item.id,item.area,item.carrierUid ?? null]).sort((a,b)=>a[0]-b[0]),
  });
}
function makeSaleIntent(ctx, uid) {
  const unit=ctx?.ok && ctx.unitByUid.get(uid);
  if(!unit || !Number.isInteger(uid) || !['hand','temp'].includes(unit.area) || unit.equipped!==0)return null;
  return {uid,id:unit.id,base:unit.base,area:unit.area,golden:unit.golden,equipped:0,
    identity:ctx.identity,funds:ctx.funds,inventoryStamp:tradeInventoryStamp(ctx)};
}
function matchesSaleIntent(ctx, uid, expected) {
  if(!expected || typeof expected.inventoryStamp!=='string' || expected.inventoryStamp.length>100000)return false;
  const actual=makeSaleIntent(ctx,uid);
  if(!actual || !['uid','id','base','area','golden','equipped','identity','funds'].every(key=>actual[key]===expected[key]))return false;
  if(actual.inventoryStamp===expected.inventoryStamp)return true;
  try {
    const approved=JSON.parse(expected.inventoryStamp), current=JSON.parse(actual.inventoryStamp);
    return Array.isArray(approved.units) && Array.isArray(approved.items) &&
      approved.units.length===current.units.length && approved.units.every((unit,index)=>{
        const next=current.units[index];
        return Array.isArray(unit) && unit.length===6 && next?.length===6 &&
          [0,1,2,4,5].every(key=>unit[key]===next[key]) &&
          (unit[0]===uid ? unit[3]===next[3] : compatiblePlacementArea(unit[3],next[3]));
      }) && JSON.stringify(approved.items)===JSON.stringify(current.items);
  } catch { return false; }
}


// Shared by MAIN and the isolated controller. No requests and no caller-supplied UID exemptions.
const FLAMETAIL_AUDIT_ID='chess_char_4_19_a';
const FLAMETAIL_AUDIT_GIFTS=['chess_char_1_19_a','chess_char_2_18_a','chess_char_4_20_a'];
const FLAMETAIL_AUDIT_MAX_GIFTS=3; // Existing supported normal / investor repeated-gain envelope.
function auditFlametailPurchaseSettled(before,after,candidate,{chess={}}={}) {
  const fail=reason=>({ok:false,reason});
  if(!before?.ok || !after?.ok || before.identity!==after.identity || before.rewardOffer ||
    candidate?.id!==FLAMETAIL_AUDIT_ID)return fail('焰尾购买期间对局或原奖励状态不一致');
  const original=before.slots?.[candidate.slot], current=after.slots?.[candidate.slot];
  if(!Number.isInteger(candidate.slot) || !original || original.kind!=='chess' || original.sold===true ||
    original.id!==candidate.id || original.price!==candidate.price || !current || current.kind!=='chess' ||
    current.id!==candidate.id || current.sold!==true || !Number.isSafeInteger(candidate.price) || candidate.price<0 ||
    !Number.isSafeInteger(before.funds) || !Number.isSafeInteger(after.funds) ||
    after.funds<before.funds-candidate.price)return fail('焰尾购买的槽位、实价或资金变化无法核验');
  if(before.slots.length!==after.slots.length || before.shopLevel!==after.shopLevel ||
    before.slots.some((slot,index)=>index!==candidate.slot &&
      (slot?.id!==after.slots[index]?.id || slot?.kind!==after.slots[index]?.kind ||
      slot?.price!==after.slots[index]?.price || (slot?.sold===true)!==(after.slots[index]?.sold===true))))
    return fail('焰尾购买期间其他商店槽位或调度中心等级发生变化');
  const fresh=after.units.filter(unit=>!before.unitByUid.has(unit.uid));
  const parents=fresh.filter(unit=>unit.id===FLAMETAIL_AUDIT_ID);
  if(parents.length!==1 || parents[0].base!==FLAMETAIL_AUDIT_ID || parents[0].golden ||
    parents[0].equipped!==0 || !['hand','temp','board'].includes(parents[0].area))
    return fail('焰尾本体不是唯一可核验的新普通 UID；未授权出售');
  const parent=parents[0], gifts=fresh.filter(unit=>unit.uid!==parent.uid);
  const missing=before.units.filter(unit=>!after.unitByUid.has(unit.uid));
  if(gifts.length<1 || gifts.length>FLAMETAIL_AUDIT_MAX_GIFTS || gifts.some(unit=>
    !FLAMETAIL_AUDIT_GIFTS.includes(unit.base) || unit.equipped!==0 ||
    !['hand','temp','board'].includes(unit.area)))return fail('焰尾新增赠员数量、来源或装备无法核验');
  // No in-place ID mutation, disappearance of another operator, or loss of an old elite is exempted.
  if(missing.some(unit=>!FLAMETAIL_AUDIT_GIFTS.includes(unit.base) || unit.id!==unit.base || unit.golden) ||
    before.units.some(unit=>after.unitByUid.has(unit.uid) &&
      !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
    return fail('焰尾买入已发生，但合成以外的旧干员 UID、身份或装备变化；未授权出售');
  const consumed=new Set(), merges=[];
  let generated=0;
  for(const gift of gifts) {
    const normal=chess[gift.base], record=chess[gift.id];
    if(!normal || normal.isGolden===true || !record)return fail('焰尾赠员的本服图鉴不完整');
    if(!gift.golden) {
      if(gift.id!==gift.base || record.isGolden===true)return fail('焰尾普通赠员的 ID 或精锐状态不一致');
      generated++;continue;
    }
    const need=Number.isInteger(normal.upgradeNum) && normal.upgradeNum>1 ? normal.upgradeNum : 3;
    const old=missing.filter(unit=>unit.base===gift.base);
    if(need!==3 || normal.goldenId!==gift.id || record.isGolden!==true ||
      old.length>=need || merges.length || old.some(unit=>consumed.has(unit.uid)))
      return fail('焰尾赠员不是唯一可归属的三合一；多重或未知合成请手动处理');
    generated+=need-old.length;
    for(const unit of old)consumed.add(unit.uid);
    // User-authorized Flametail exception: the uniquely proven NEW elite may be sold
    // even when its merge consumed old normal gifts. No existing elite UID is authorized.
    merges.push({base:gift.base,uid:gift.uid,consumedUids:old.map(unit=>unit.uid),newCopies:need-old.length});
  }
  if(generated<1 || generated>FLAMETAIL_AUDIT_MAX_GIFTS || missing.some(unit=>!consumed.has(unit.uid)))
    return fail('焰尾赠员三合一的旧 UID 和新增份数无法完整对应；未授权出售');
  if(FLAMETAIL_AUDIT_GIFTS.some(id=>after.units.filter(unit=>unit.base===id && !unit.golden).length>=
    (Number.isInteger(chess[id]?.upgradeNum) && chess[id].upgradeNum>1 ? chess[id].upgradeNum : 3)))
    return fail('焰尾普通赠员仍达到合成数量，库存可能尚未结算；已停止');
  const mergedGift=merges.length===1;
  if(mergedGift ? !isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel) : !!after.rewardOffer)
    return fail('焰尾赠员合成的免费三选一来源、等阶或队列无法核验；请手动处理');
  // Every old item survives unchanged, except equipment on proven consumed carriers returning to bench.
  // No new item, item merge, replacement, or transfer to a new carrier is inferred from a chess merge.
  if(after.items.length!==before.items.length || after.items.some(item=>!before.itemByUid.has(item.uid)) ||
    before.items.some(item=>{
      const next=after.itemByUid.get(item.uid);
      if(!next || next.id!==item.id)return true;
      return consumed.has(item.carrierUid) ? !['hand','temp'].includes(next.area) || next.carrierUid!=null :
        next.area!==item.area || (next.carrierUid ?? null)!==(item.carrierUid ?? null);
    }))return fail('焰尾赠员合成的装备返还或旧道具 UID 无法核验；未授权出售');
  return {ok:true,parent,gifts,merged:false,mergedGift,coin:null,consumedUids:[...consumed],
    giftMerges:merges,generatedGifts:generated};
}

function auditFlametailPurchase(before,after,candidate,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditFlametailPurchaseSettled(before,refill.after,candidate,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}


// Public-site auto reversal: pure decisions and UID auditing. Never sends game commands.
// Unknown state / effects always fail closed; a list lock only locks editing, never weakens the keep rule.
const FLAMETAIL_ID = 'chess_char_4_19_a';
const FLAMETAIL_GIFT_IDS = Object.freeze([
  'chess_char_1_19_a', // 野鬃
  'chess_char_2_18_a', // 灰毫
  'chess_char_4_20_a', // 远牙
]);
const SWIRE_ID = 'chess_char_3_03_a';
const SWIRE_COIN_ID = 'chess_item_1_03_e_a';
const SWIRE_COIN_GOLDEN_ID = 'chess_item_1_03_e_b';
const PINECONE_ID = 'chess_char_3_10_a';
const HAND_SIZE = 10;

const baseId = operatorBaseId;

function keepBases(plan, chess) {
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

function eligibleKeepBases(ctx, plan, chess) {
  const eligible = keepBases(plan, chess), blocked = new Set();
  for (const base of eligible) {
    if (!keepRuleAllows(ctx, base, plan?.keepRules?.[base])) { eligible.delete(base); blocked.add(base); }
  }
  return { eligible, blocked };
}

function inspectMatch(state, chess, { allowReward = false } = {}) {
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

function pickCandidate(ctx, plan, chess) {
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
const isPineconeOffer = isPineconeSaleOffer;

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

function rewardTraitRank(id, chess, garrisons) {
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

function pickPineconeReward(ctx, plan, chess, garrisons) {
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
function isFlametailMergeOffer(offer, chess, shopLevel) {
  return isPackagingMergeOffer(offer,chess,shopLevel);
}

// A reward with a proven pure economy/layer trait may fire on gain. Every other
// gain-time effect (including equipment or extra chess) is excluded BEFORE
// claiming it; UID/item/funds checks after the claim still fail closed.
function pickFlametailMergeReward(ctx, plan, chess, garrisons) {
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

function auditFlametailMergeReward(before, after, chosen, chess) {
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

function auditReward(before, after, chosen) {
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

function auditCoinUse(before, after, parent, coin) {
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
function usableCoins(ctx) {
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
function pickCoinTarget(ctx, preferUids = []) {
  if (!ctx?.ok) return null;
  const safe = unit => !!unit && Number.isInteger(unit.equipped) && unit.equipped >= 0 && unit.equipped < 2;
  for (const uid of Array.isArray(preferUids) ? preferUids : []) {
    const unit = ctx.unitByUid.get(uid);
    if (safe(unit)) return unit;
  }
  return ctx.units.find(safe) || null;
}

function auditPurchase(before, after, candidate, plan, chess) {
  const retain=keepBases(plan,chess).has(candidate.base);
  if(candidate.id===FLAMETAIL_ID){
    const checked=auditFlametailPurchase(before,after,candidate,{chess});
    return checked.ok ? {...checked,retain} : checked;
  }
  const checked=auditOrdinaryPurchase(before,after,candidate,{chess,retained:retain});
  return checked.ok ? {...checked,gifts:[],mergedGift:false,retain} : checked;
}

const auditSale = auditPackagingSale;

function pickPackagingMergeReward(ctx, plan, chess, garrisons) {
  return ctx?.ok && isPackagingMergeOffer(ctx.rewardOffer,chess,ctx.shopLevel) ?
    pickFlametailMergeReward(ctx,plan,chess,garrisons) : null;
}

// Independent item policy. A shop item is never fed to the chess buy/sell path.
const ITEM_HAND_SIZE = 10;
const DEFAULT_ITEM_MERGE_COUNT = 2; // Game default (gamedata itemMergeCount) when a record has no upgradeNum.

// Mirrors the game server's _itemMergeable / completesItemMerge: a normal, mergeable EQUIP item
// whose golden record exists merges as soon as `need` identical copies would be owned.
// `lookup(id)` returns the game's own items.json record. null = rule unknown (fail closed).
function itemMergeRule(id, lookup) {
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
function planItemMerge(ctx, id, rule) {
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

function itemHoldingAllows(items, rule) {
  if (rule?.ownedTarget == null) return true;
  if (!Number.isInteger(rule.ownedTarget) || rule.ownedTarget < 1 || rule.ownedTarget > 99 ||
      !Array.isArray(items) || !Array.isArray(rule.targetIds) || !rule.targetIds.includes(rule.id)) return false;
  const held = items.filter(item => rule.targetIds.includes(item.id) && !(rule.excludeEquipped && item.area === 'equipped')).length;
  return held < rule.ownedTarget;
}
function pickItemCandidate(ctx, plan) {
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

function auditItemPurchase(before, after, chosen) {
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
function itemUseRule(id, lookup) {
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
function createRecency() {
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
function pickItemUse(ctx, plan, chess, rank, { tried, done, keep } = {}) {
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
function auditItemUse(before, after, pick) {
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

// Serial, manually armed automation for the clicked game tab on any compatible origin.
// All buy/sell/refresh requests use the same-origin game store/actions bridge. No server patch is used.

const ACK_WAIT_MS = 4500;
const REFRESH_GAP_MS = 300; // a pace, NOT a refresh-count or spending limit

function createAutoController({ read, subscribe, buy, buyItem, sell, refresh, useCoin, useItem, recency, reward, mergeReward,
  acquireLock, getPlan, chess, garrisons, gameItems = null, onStatus, onAudit, onRecordPurchase }) {
  if (![read, subscribe, buy, sell, refresh, useCoin, reward, mergeReward, acquireLock, getPlan].every(fn => typeof fn === 'function') ||
      !chess || typeof chess !== 'object') throw new Error('自动倒转接口不完整');

  let running = false;
  let starting = false;
  let busy = false;
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
    if (!running && !starting && !busy && releaseLock) {
      const release = releaseLock; releaseLock = null;
      try { release(); } catch { /* browser lock is released on page close anyway */ }
    }
  }
  function stop(reason = '已手动停止') {
    const wasLive = running || starting;
    running = false;
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
    if (!running || busy || queued) return;
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
    if (!running || busy) return;
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
      releaseIfIdle();
      if (running && (again || planQueued)) { planQueued=false; schedule(); }
    }
  }

  async function start() {
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
  return { start, stop, updatePlan() {
    if(!running)return;
    const keep=keepBases(getPlan(),chess), snap=inspectMatch(read(),chess,{allowReward:allowReward()});
    if(snap.ok)for(const unit of snap.units)if(keep.has(unit.base))settingsProtected.add(unit.uid);
    if(busy){for(const base of keep)transactionKeeps.add(base);planQueued=true;}else schedule();
  }, get running() { return running; }, get starting() { return starting; }, get busy() { return busy; } };
}

// Isolated-world transport. All game state/actions live behind main-bridge.js on the clicked tab.
// chrome.runtime is used only for the extension's single-runner lease; no fixed server host is requested.
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
function createSpuiTransport(config, getPlan, chess={}) {
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

// Extension-only audit journal. The service worker derives the server from sender.url and serializes writes.
function createAuditLog({ sendMessage, origin, clientVersion, onChange = () => {}, onError = () => {} }) {
  if (typeof sendMessage !== 'function' || typeof origin !== 'string' ||
      typeof clientVersion !== 'string') throw new Error('日志接口或脚本版本不完整');
  let entries = [];
  let queue = Promise.resolve();
  let lastWait = { text: '', at: 0 };
  const notify = () => onChange(entries.slice());
  const enqueue = fn => {
    const result = queue.then(fn);
    queue = result.catch(() => {}); // a failed write must not poison the next explicit attempt
    return result.catch(error => { onError(error); throw error; });
  };
  async function request(type, entry) {
    const response = await sendMessage({ type, clientVersion, ...(entry ? { entry } : {}) });
    if (response?.ok !== true || !Array.isArray(response.entries)) {
      throw new Error(response?.reason || '日志服务未返回有效数据');
    }
    entries = response.entries.slice(-300);
    notify();
    return entries.slice();
  }
  return {
    get entries() { return entries.slice(); },
    load: () => enqueue(() => request('log.read')),
    append(entry) {
      if (entry?.kind === 'wait') {
        const text = String(entry.summary || '');
        if (text === lastWait.text && Date.now() - lastWait.at < 30000) return Promise.resolve(entries.slice());
        lastWait = { text, at: Date.now() };
      }
      return enqueue(() => request('log.append', entry));
    },
    clear: () => enqueue(() => request('log.clear')),
    async exportJSON() {
      // Read from the background again so another tab's latest entries are included.
      const latest = await enqueue(() => request('log.read'));
      const payload = { format: 'spui.audit.v1', server: origin,
        exportedAt: new Date().toISOString(), entries: latest };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `卫戍协议-执行日志-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      link.hidden = true;
      document.body.append(link);
      try { link.click(); } finally {
        link.remove();
        const timer = setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
        timer?.unref?.(); // Node tests should not wait; browsers use a numeric timer ID.
      }
      return latest.length;
    },
  };
}

// Bridge the existing schema-3 UI plan to real IDs from this server only.
const gameNameKey = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const ITEM_NAMES = new Set(ITEM_CATALOGUE.map(x => gameNameKey(x.name)));
const ITEM_BY_ID = new Map(ITEM_CATALOGUE.map(item => [item.id, item]));
// Only the game's item data may identify a hand-entered item. Never treat a local
// placeholder ID, a fuzzy match or a guessed suffix as a real trading ID.
function gameItemIndex(raw) {
  const body = raw?.items || raw, entries = Array.isArray(body) ? body.map(item => [item?.id, item])
    : body && typeof body === 'object' ? Object.entries(body) : [];
  const byId = new Map(), byName = new Map(), records = new Map();
  for (const [id, record] of entries.slice(0, 4096)) {
    const name = typeof record === 'string' ? record : record?.name;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_:-]{3,100}$/.test(id) ||
        typeof name !== 'string' || !gameNameKey(name)) continue;
    byId.set(id, { id, name, baseId: record?.baseId, isGolden: record?.isGolden === true });
    if (record && typeof record === 'object') records.set(id, record);
  }
  for (const item of byId.values()) {
    const base = typeof item.baseId === 'string' && byId.has(item.baseId) ? item.baseId : item.isGolden ? null : item.id;
    if (!base) continue;
    const key = gameNameKey(item.name);
    if (!byName.has(key)) byName.set(key, new Set());
    byName.get(key).add(base);
  }
  return { byId, byName, records };
}
// 自选编队: a DIY slot (chess_char_6_diy1_a …, named 甄选干员 in chess.json) becomes the operator this
// player slotted for THIS match (match.private.diy). Only those picks may map a manual name to a slot.
// `diy` = { picks: { [slotId]: { charId } }, names: { [charId]: name } } from the game's own data.
function diyIndex(diy, chess) {
  const byName = new Map(), known = new Set();
  const names = diy?.names && typeof diy.names === 'object' ? diy.names : {};
  for (const name of Object.values(names).slice(0, 512)) if (typeof name === 'string') known.add(gameNameKey(name));
  const picks = diy?.picks && typeof diy.picks === 'object' ? diy.picks : {};
  for (const [slot, pick] of Object.entries(picks).slice(0, 16)) {
    const name = typeof pick?.charId === 'string' && Object.hasOwn(names, pick.charId) ? names[pick.charId] : null;
    const base = chess?.[slot]?.isDiy === true ? baseId(slot, chess) : null;
    if (!base || typeof name !== 'string' || !gameNameKey(name)) continue;
    const key = gameNameKey(name);
    if (!byName.has(key)) byName.set(key, new Set());
    byName.get(key).add(base);
  }
  return { byName, known };
}
function resolveGamePlan(raw, chess, bonds = {}, gameItems = null, diy = null) {
  const stored = Model.normalizePlan(raw);
  const catalogue = buildCatalogue(chess, bonds);
  const byName = new Map(), byId = new Map(catalogue.operators.map(op => [op.id, op]));
  for (const op of catalogue.operators) {
    const key = gameNameKey(op.name), base = baseId(op.id, chess);
    if (!byName.has(key)) byName.set(key, new Set());
    if (base) byName.get(key).add(base);
  }
  const custom = new Map(stored.customOperators.map(op => [op.id, op]));
  const matches = {}, itemMatches = {}, issues = [], pending = [], useNotes = {};
  const itemIndex = gameItemIndex(gameItems);
  const diyNames = diyIndex(diy, chess);
  const wait = (kind, id, name, reason) => pending.push({kind,id,name,reason});
  for (const op of stored.customOperators) {
    const ids = byName.get(gameNameKey(op.name));
    if (ids?.size === 1) matches[op.id] = [...ids][0];
    else if (!ids?.size && diyNames.byName.get(gameNameKey(op.name))?.size === 1) {
      matches[op.id] = [...diyNames.byName.get(gameNameKey(op.name))][0];
    }
  }
  function mapped(id, kind, active) {
    const manual = custom.get(id), resolved = manual ? matches[id] : baseId(id, chess);
    if (!resolved) {
      if (active) {
        const reason = manual && ITEM_NAMES.has(gameNameKey(manual.name)) ? '名称属于道具，请在保留名单的道具区记录'
          : manual && byName.get(gameNameKey(manual.name))?.size > 1 ? '本服有多个同名角色，无法唯一匹配'
          : manual && diyNames.byName.get(gameNameKey(manual.name))?.size > 1 ? '本局自选编队中有多个同名干员，无法唯一匹配'
          : manual && diyNames.known.has(gameNameKey(manual.name)) ? '自选编队干员：需在本局自选编队中选入，进入对局后自动识别'
          : '本服图鉴未找到';
        wait(kind,id,manual?.name || id,reason);
      }
      return null;
    }
    if (active && kind === 'buy' && chess[resolved]?.isDiy === true) {
      wait(kind,id,manual?.name || id,'自选编队干员只通过保留名单自动买入（买入名单的干员买入后会被出售）');
      return null;
    }
    if (active && kind === 'buy' && manual && !byId.get(resolved)?.buyable) {
      wait(kind,id,manual.name,'本服不属于普通可买入干员；如需保留，请使用保留名单');
      return null;
    }
    return resolved;
  }
  const effective = { epoch:stored.itemSession.epoch, buy: [], keep: [], excludedBuy: [], keepRules: {}, items: [], useItems: [] };
  const resolvedItems = new Set();
  for (const kind of ['buy', 'keep']) {
    const disabled = new Set(stored.disabled[kind]);
    for (const id of stored[kind]) {
      // Manual disables stay off. Reaching a live holding target never changes this switch.
      const active = !disabled.has(id);
      const resolved = mapped(id, kind, active);
      if (resolved) {
        if (active) {
          if (kind === 'keep' && effective.keepRules[resolved]) {
            wait(kind,id,custom.get(id)?.name || id,'与另一保留条目匹配同一 ID，请移除重复项');
            continue;
          }
          effective[kind].push(resolved);
          if (kind === 'keep') effective.keepRules[resolved] = {
            ...stored.keepRules[id], sourceId: id,
          };
        }
        else if (kind === 'buy') effective.excludedBuy.push(resolved);
      }
    }
    effective[kind] = [...new Set(effective[kind])];
  }
  effective.excludedBuy = [...new Set(effective.excludedBuy)];
  for (const item of stored.items) {
    // 自动使用 is independent of buying: a capped (auto-disabled) item may still be used.
    if (!item.enabled && item.autoUse !== true) continue;
    const known = ITEM_BY_ID.get(item.id), name = known?.name || item.name;
    let real = known ? item.id : null;
    if (known && gameItems != null) {
      const live = itemIndex.byId.get(item.id);
      if (!live || gameNameKey(live.name) !== gameNameKey(name)) real = null;
    } else if (!known) {
      const ids = itemIndex.byName.get(gameNameKey(name));
      if (ids?.size === 1) real = [...ids][0];
    }
    if (!real) {
      const count = itemIndex.byName.get(gameNameKey(name))?.size || 0;
      wait('item',item.id,name,known ? '游戏道具数据与静态 ID 或名称不符' : count > 1 ? '游戏道具有多个同名 ID' : '游戏道具数据未找到唯一名称映射');
      continue;
    }
    if (resolvedItems.has(real)) {
      wait('item',item.id,name,'与另一启用道具匹配同一 ID，请移除重复项');
      continue;
    }
    resolvedItems.add(real);
    itemMatches[item.id] = real;
    if (item.autoUse === true) {
      // Only the game's own record may prove an item is consumed on equip; no live data = not used.
      const lookup = id => itemIndex.records.get(id) || null;
      const golden = lookup(real)?.goldenId || lookup(real)?.upgradeChessId;
      for (const id of [real, ...(typeof golden === 'string' && golden !== real ? [golden] : [])]) {
        const rule = gameItems != null ? itemUseRule(id, lookup) : null;
        if (id === real && rule?.usable !== true) {
          useNotes[item.id] = rule ? '不是装备即消耗的道具，不会自动使用' : '本服道具数据不可用，暂不自动使用';
          break;
        }
        if (rule?.usable === true) effective.useItems.push({ id, sourceId: item.id, name, ...rule });
      }
    }
    if (!item.enabled || stored.itemBuyingPaused) continue;
    // The game's own record decides when an identical copy merges; no live data = unknown.
    const merge = gameItems != null ? itemMergeRule(real, id => itemIndex.records.get(id) || null) : null;
    const record = itemIndex.records.get(real), base = record?.baseId || real;
    const targetIds = [...new Set([real, base, ...[record,itemIndex.records.get(base)].map(r => r?.goldenId || r?.upgradeChessId).filter(id => typeof id === 'string')])];
    effective.items.push({ id: real, sourceId: item.id, name, limit: item.limit,
      ownedTarget: item.ownedTarget ?? null, targetIds, excludeEquipped: real === 'chess_item_6_08_e_a',
      used: stored.itemSession.used[item.id] || 0, minFunds: item.minFunds, merge });
  }
  const skipped = pending.map(entry => `${entry.name}：待识别，${entry.reason}，暂不自动交易`);
  return { plan: effective, matches, itemMatches, useNotes, pending, issues: [...new Set(issues)], skipped, catalogue };
}
function tradePlanKey(raw) {
  const p = Model.normalizePlan(raw);
  // Confirmed purchase counters are not configuration edits. Manual or detected
  // next matches advance epoch and stop a live run before resetting counters.
  return JSON.stringify({buy:p.buy,keep:p.keep,disabled:p.disabled,customOperators:p.customOperators,
    itemBuyingPaused:p.itemBuyingPaused===true,keepRules:p.keepRules,items:p.items.filter(item=>item.enabled).map(({id,limit,minFunds,ownedTarget})=>({id,limit,minFunds,ownedTarget})),
    autoUse:p.items.filter(item=>item.autoUse===true).map(item=>item.id),
    epoch:p.itemSession.epoch});
}

function isLiveItemToggle(before, after, id) {
  const a=Model.normalizePlan(before), b=Model.normalizePlan(after);
  const old=a.items.find(item=>item.id===id), next=b.items.find(item=>item.id===id);
  if(!old || !next || old.enabled===next.enabled || old.capPaused || next.capPaused) return false;
  const mask=plan=>({...plan,itemSession:{...plan.itemSession,used:{}},items:plan.items.map(item=>item.id===id ? {...item,enabled:false} : item)});
  return JSON.stringify(mask(a))===JSON.stringify(mask(b));
}

function isLiveItemPause(before, after) {
  const a=Model.normalizePlan(before),b=Model.normalizePlan(after);
  if((a.itemBuyingPaused===true)===(b.itemBuyingPaused===true))return false;
  const mask=plan=>{const {itemBuyingPaused,...rest}=plan;return {...rest,itemSession:{...rest.itemSession,used:{}}};};
  return JSON.stringify(mask(a))===JSON.stringify(mask(b));
}

// Independent endless-mode ready scheduler. Never arms on load or retries an uncertain round.
function createAutoReady({read,getOptions,available,tradeBusy,handoff,acquireLock,prepare,claim,audit,onStatus}) {
  let running=false,busy=false,generation=0,timer=null,owner='',stable='',stableAt=0,lastMessage='已关闭';
  const attempted=new Set();
  const who=s=>`${s?.room?.code || ''}|${s?.me?.playerId || ''}`;
  function report(message){lastMessage=message;onStatus?.({readyRunning:running,readyBusy:busy,readyMessage:message});}
  function stop(message='已关闭自动准备；已发出的准备指令仍可能生效'){
    running=false;generation++;clearInterval(timer);timer=null;stable='';report(message);
  }
  function valid(s){return s?.connection?.status==='online' && !s?.ui?.buildStale && s?.readySupported===true &&
    s?.match?.private?.alive===true && s?.room?.inMatch===true && typeof s.room.code==='string' && typeof s?.me?.playerId==='string' &&
    s.room.seats?.some(x=>x?.playerId===s.me.playerId) && s?.match?.private?.alive!==false &&
    s?.match?.public?.players?.some(x=>x?.playerId===s.me.playerId && x.autoplay!==true);}
  async function tick(){
    if(!running || busy)return;
    let release=null,dispatch=false;
    const ticket=generation;
    try{
      const s=read();
      if(!available() || !valid(s) || who(s)!==owner){stop('自动准备已停止：连接、自检、座位或对局状态变化');return;}
      const p=s.match.private,pub=s.match.public,o=getOptions();
      if(o.confirmed===false){stable='';report('等待准备设置保存');return;}
      if(pub.phase!=='PREP'){stable='';report('等待下一次整备');return;}
      if(!Number.isSafeInteger(pub.round) || pub.round<1 || !Number.isSafeInteger(p.funds) || p.funds<0){stop('回合或资金状态无效，自动准备已停止');return;}
      if(p.ready===true){report('本回合已准备，等待下一回合');return;}
      if(p.ready!==false){stop('准备状态不明确，自动准备已停止');return;}
      if(o.skipTenth && pub.round%10===0){stable='';report(`第 ${pub.round} 回合跳过，等待你手动准备`);return;}
      if(o.funds!==null && p.funds>o.funds){stable='';report(`等待资金 ≤ ${o.funds}（当前 ${p.funds}）`);return;}
      if(p.shop?.rewardOffer?.slots?.length || !Array.isArray(p.temp) || p.temp.length){stable='';report('等待处理奖励或临时区');return;}
      if(tradeBusy()){stable='';report('等待在途交易核对完成');return;}
      const identity=`${owner}|${pub.round}`,key=`${o.epoch}|${identity}`,stamp=JSON.stringify(p),quiet=key+'|'+stamp+'|'+JSON.stringify([o.funds,o.skipTenth]);
      if(attempted.has(key)){report('本回合已尝试准备，不重复发送');return;}
      if(stable!==quiet){stable=quiet;stableAt=Date.now();report('条件已满足，等待状态稳定');return;}
      if(Date.now()-stableAt<750)return;
      busy=true;report('正在核对并提交准备');
      // Stop only after every condition is met; no new trades may start during this handoff.
      handoff();release=await acquireLock();
      if(!running || generation!==ticket)return;
      const latest=read(),now=getOptions();
      if(!available() || !valid(latest) || who(latest)!==owner || latest.match.public.phase!=='PREP' ||
        latest.match.public.round!==pub.round || JSON.stringify(latest.match.private)!==stamp ||
        now.confirmed===false || now.epoch!==o.epoch || now.funds!==o.funds || now.skipTenth!==o.skipTenth || tradeBusy())throw new Error('提交前状态或设置改变，本次未准备');
      await audit('ready_request',`自动准备：第 ${pub.round} 回合，资金 ${p.funds}`);
      if(!running || generation!==ticket)return;
      const fresh=await claim(key);attempted.add(key);if(attempted.size>128)attempted.delete(attempted.values().next().value);
      if(!fresh){report('本回合已有准备记录，不重复发送');return;}
      if(!running || generation!==ticket)return;
      const finalOptions=getOptions();
      if(!available() || !valid(read()) || finalOptions.confirmed===false || finalOptions.epoch!==o.epoch || finalOptions.funds!==o.funds || finalOptions.skipTenth!==o.skipTenth)throw new Error('准备设置已变化；本轮不重试');
      dispatch=true;
      await prepare({identity,stamp,maximumFunds:o.funds,skipTenth:o.skipTenth});
      await audit('ready_ok',`第 ${pub.round} 回合准备已确认`);
      if(running && generation===ticket)report('已准备，等待下一回合');
    }catch(error){stop(`${error?.message || '自动准备异常'}${dispatch?'；指令可能已生效，本轮不重试':''}`);}
    finally{release?.();if(busy){busy=false;report(lastMessage);}}
  }
  function start(){
    if(busy)throw new Error('上一笔准备尚未核对完成');
    if(!available() || !valid(read()))throw new Error('准备接口、自检、座位或连接未就绪');
    owner=who(read());running=true;generation++;stable='';report('已手动开启自动准备（无尽用）');
    clearInterval(timer);timer=setInterval(()=>void tick(),400);void tick();
  }
  return {start,stop,get running(){return running;},get busy(){return busy;}};
}

// Native quick controls. No game commands, plan storage or HTML supplied by the page.
// Visual references only: shadcn/ui and Animate UI (MIT). No vendor runtime is bundled.
const QUICK_CHIBI_ICON="data:image/webp;base64,UklGRq48AABXRUJQVlA4TKI8AAAvf8AfEFXpfrZ/3d3K+RnD7DDsOLgTQzhxkh3eYWZmZsdhtsNxMsneiTdlx0l2mDl2yA45sZ3EXmi2YwqDdxxTnA3Wft/f+/u98V/wnmyQSqlLw+sgmc4RuTRMceHNYKSxS1t1R0uVVRr0UPbJYLROhlclD6NdGuZ1MvxKO7JkDbr2wWAp8snwkmr5pOx18BkeS9bQOtq1ZPmotOVKzlEhqy4MY1waXlvyPipZwzNnlVfBu/hqZA0e2aXBowym+B5EpcH4YGmYUldyStsH0Topry1Zw+NqacApg7XK+JMil8F1YZi2UhieV+MOprKsdZIyWKs0/FaNy7Drg5UyWCVHQ++B14BzsuWtRsNkl2HQPlonW7+tWsMTyZ6TMlnuwfDSKBqedOIygzVM8YHrYbRk7aNSNJSjoWgVctSuyhqmpdIwWas02N+uMmVYomjbtuq2WefyI8kWPrFkS3r3OcxcB8sM//8l9fGtbdsxSdq2rUdUontCnjl4hp6hZ9guZkZGoW33bdu2bdv23bYKjXJEVuI6zksnBUAACDBRtm3btm3btm3btm3X2zaybc3ezqEkSVUze0jwFQU9TkN+QDTPJEjgMh8i2s3OspaEnPdHLrnKByVgQuL9Bpf9Ia67g9ycD3B33M/J8crLCDIiqIWgIYKRCJb+XASrEPyM4A+6EBz4uQjmIWh64wjyIkjFoslVPtTUZX8oNgGGxPIGibweLZ6ndVkoiXSzni67Q7EJloySSnbrsSL9bOqSQPy0MVSIh1i/wUW/RphhltO1xt29wmCLj+jo8kcaqe9VXXg+BsELBDEIoGRaMAdlgHkwBQAAgOAdgjsILiFY8f8QlJv6dNtMt6cDhDnE+ykGMoh0s+tuT/+SFMVsN8cyiHYb1yX7dUuKBKfgsjtE9DybzjzO+mN5xfI0UDxvwKygDLLOzkeNt3+5vqZf0ERzj0r9BQCAsIcF3aMOaB66hP5gBBgdJoFphJlBBMTAYFaYGEaGQaF7aAmCVwGxAI68fHcpwlr1oO4n3zDS9s0cna6Vw1U+RCJP0RGKnmezWShE8my9bIIlKfE8tSTMHxHfeT78aRRGzl+YdNzdK3Uz/o5a4kkAUAV7NEPoG87TMXgFn8JewR+g5QQ6hODDg28QCoV7AZ9QWG4MOOdmoWqdAICXbaH5g2EX7zXD8UZRciQ9BbE8DXN+c6QwCuf3j1SW6NZDv0+CJW3HwPxCsfN0MENRIq8Tzna6xqCLj6i3eARAmbqkUYItgkOYB/YM/kDoA+YCzfFglzAw9AydQHvQFrQIZQMANAa24D7PcxoJzoS5wRcIhdHmg5nANrRAqEQnACq2C20Mf22U7RuJdjNzHfYS7Wffj//f3oR0JO/tTeK8P/JblARLXlcs2a1FiXUbzZlF8t5GHrG8EXjF9CvDdXfQLMfr9TH7kurCaYAQGiAcFogLfsAfJM8yPQwF7YBVsACqgC/VSqEuaBeGgKnAI+wJhMsXGBMOXLFOANRdPGa49r2c5iv7oQ5dJM9GRkngP7SFRF4PFO2mTZktinXTT2hHHcVZd9RA7SdVHc6BMnWPDgiZOcLl3YFd2KZqAACAcqErGAye8/THFiaCaWCZ0JPCJqMro8CIMLgE69A+7AyqA7MCAGzcFGxmTD+++6yXAIDgFwRdESRksb63WLfxcQv/QoLbvgxn3eFmTJpIng121R20RZRRt69XV/EEMM8e72ROKCpcECaAtqFCAKgGmoRKAABSX2bz0DDUDZYhuFOIJrU4+AWpfuDYe4LBYVSwD3IBPqwZAABQrQ82E4eiwkXhlncOAAguI6jMkriZHqbduv7JJLu1QJE8a8Iczm+OlHDdHYh02l2p49GPmJIKzsk4mj/wACdTGwDUBG82EPSptAoVQwVQOzQHXUBfMDTsHsaFh7QHCt6BIMg9wu/qDd6sGdDYCVQFRRqHsgBKFjz2OgGgHDjwNXCE/Ie0BoAg2HLx9GlHp2ti/RsJjkGimz4VybN8zNkouzf8Umf5BKiVcBPR/IFb6BM2hnzndM7dQgNQAzQK//tUXMHC4FvgLQE8nryUPknQJSUQyC8GAZ3DJs/QAqxoFtYaG9yDZq+QHaARYRyBECqff3SoNZ002vZ1XHcHJfVf5rI/RDxPrzrOV+djBgS9ELyGg7UmdArbdAyVAVQJb3Yba8VvGUaC2FyBFJckmBBJ8eUF+l4g9MXErxb+uorCG9QDABlfVcofuIY2AMybVp/zz5PM67bwXxZFolu/iv8RQQIEyxBElUWwA88HAFDsTLqGtTVOJrYUj0ssOXGkBPPDLbcCazYN0wI5IcQDaB1UFLIMAeVrgLYufmmO7hjJfp3/MJSjfP8i51lOvIRgI2x/DYJaASDfNt1AkYbg2nIKuIT/ECUvfz3dwZoH09W//VoAyoRiqY1OqSA0Wt/D0elaGfyXyYp2G+e2wgRB/NsCSxDIHyx32ZC/B9AwGgtIHkX4N/EFkvBh03cAnsEb9AtxASB7kJeFusvHPRfTFiUpronkw8f88Q9JsVM8T7AInAlUBJ3DIeMPC4Y8kvCv4gpmg69TOewahCpbA8DMsBDsH6wWT5nx+gYu8homEeum+7/PKeDaTM9efHSXP/0gKVYyyRJICXL9vZqhTXAJRSnCv0ufu1sI/A5a/A03h/0pK58S1Fs8yvHxKi/EHCzRPJseBfemcPTupaZ897ajo+4/mQzFedI+Zwm9MdzfieXZHUjxca9uZveAVzekwAUc14r3LJwCqgfI+K+IJgCarP/GeXeUeD/FHCyRPOsvnqdBxtg4u3eFaW9fx9nTu014+/ajbf/3lSR0EEyAnULiNzAPZUGP8DHrB2dQFHcr8tfHZOoioFRic3BnUhvme2KhG1gL4s8O6kbQ1uUvvVBS5mA5vznSXLJbC8iBhVg35eTxDaa5fQPJ061mf/ESE3x472waCFoiiKxcQqDhASKec9QHjukH8K9qFcUFgCm4DmBXoI57OJRgo4SvLTC8TAg8A6QrDX3OvsB1dxCTsERuZuXE8vS6EAOxboPDty8zw5tXc72/mYvTrRy+f23cJO/fPYmFoDiCZyGmhuEAtu9PSN0H8PEbmeMRdgESwFyRVF7vnpnwC4IY0R/Fp6L/2rBlcc1yCeZNZ6TtWwiZhCXaTfOL5+nfURhzx09uZv/Tmzjv7+Rmd5PTEMu3c/Dd64zx4QNzzIf+GzhsRUj9sbe/fCZudlL5ap6az+y9FvuuCnCwjxBl2qkPzBEMCJB+Frh9+AHTH29220zCcvLqxjSieXbc3XEf1DWh6+Txjex/eiNHz1/uNHLkOA1X+WZ99N9W9fKMDodb7NqBGQ1Vadhh+ycuSjLhUzK/gTJJMGsfcBzAgCTUswSkSYHUXvFM9AX9AwQOcLPQVPNX4t2GpHiI9jMstGbYz5KJdYf3vND3SfD0CWZ9dpurmPnlK7k63CxHjhweDjeYeP1GjTV/1dbkCXbW51ldPa/K8UVNV7ssUl0+M4kTbg33wGHe4yZ+4thchqSu5RViUlLy+kSJmEEifs+iUtYBaoEARnDxeLNOYQsWo0T62ZRj2MLpo+s5ePcK09y+kZPHL5GDJrf7m4gc7tD+5c/svLnH6ONHdTC4X52zx1nZn1RVe1p/MvBLIAkm+EvXwF8y/nZy2IhCMy9okcszBKY8/qSQTzEa583gJSeD9SuyW6a6vgP2LIl+SqzfiMMMN8XPaxNnf3pTyLSf32ia717PeX8Ht9sb0ebleK/DtJ9krb7PIOOH9Hz5AKuzx1jenFLhxabOzYhPMdO04qAYkyQI5jOtww7FoaOgwBNi6neFKB5Na1242XOG5po/cdGtwZoVRTxP34n0s/YsTDl+fnPj2Z7fETDTd6807YfXc/roxVwdbnEaOdzvbzT99lV2Pviz9of3GHD0ECvt4+renFZetasBDQsoTLUvefuOgL/kut1NHpJLEGQSheWFOOoFUheW3h5Mw+UrmaLa1ebtXOWDMDpZibx+dc6bI7VYOJK8PthA9N7RW05f3upjzPDmNSSPt7ljt4eb9Dr5psaa+/Q9uVf988c0uz2jr6JVmQYR0GfqvAJtmpPZnETz0mtkIQl1LYE/wEOqQWgbpAMDFNvQLGGn8YQ5zsegHwKSRhHvpt/Nma/KzsKV5NXePBLd2n+S945ycPtqM394tbkON5ho9RaNNvfo7OJerU8eZGnzrF03uyzecfsCgin+0gzAbO4NpFFGKu9HjqusRQrx9a+WvpqbjQWwdRMKDNh+mpvzAQlQkbxIf3j3Viwm5I9/yuLuuPeIvfPdhn7yBYPd/6IOL36m6eYenQ3uU/viSf22F7UM7SvyzLn2AiNCForJL/lXy3DRKz/1X+LGDBiNCYQjQeArUzl/KwD3UA4T1bhzZj1dg9b/vJBEN40T6zbG+mNvQhYzIKhkhuFEubITZz60alydUd/kMa0M/qjx4d+1sHpe/3Vh8S6E4zLnWJ56FWZzHzAn3DNHGXUAsUcAdQVCyAzRTulRhELHsH7EugnQx+wLXHcHJTgNiW76WqSbdWExJQR9EYRCGUxY0FD1YJPVzQlNDf6mofFDBtvMVedGoykCJq+t9QIx6fHVkwSIUKJwwJwkQaov9+sVeEwhlIAKIZKU4Jxh5TKZqMaf4/R8FQ9Xe7k77vvbZb9WjbmEoMd3NQvxw9ammDODWlYvqHvyiO7nz+hsvqUZKj7JXO2G2pS5PZPSWuSVaSUXKGtJkwS10VOXiMYcwpvNyOEGrBGCVUaAxpt79TT5avjOins7nydTICiA4G3JIhnDVkgFlQ031bc5adjVeZaHl8ysQYpJtxZjEy5zKSBPWKCwUCiU0opJ8CPdvrqQSUIVGxfkBetB3JIAR47gKoJhCJIwAYItkCdjoqiqYMpWna/mOtmfY73c5kcDs1fXRsbMQC4CWvJC4ZWFE9Kkn9iQez12QJpZhN8zHsUxzAXBwAIsrQMIjiBIiguCggiC4uYPm6t8APhcw063Wds9Rzz0fClMupaYm3oEihkCegOhUFjgylCnljMJxwMMDwGZJZp2JRIeUp63BwAdKJZx7fXhWyNIjAeCcVA9ZMy/IgB0pqG70OpuvOBbWJTAZO4GdgeGzCyRLVyUTm6hEDWLVDj/UExjeCYvqU8ZbgsQLFdGo7iAYBSLNQOvTCTZrTfDAsHnJZWsgVF2gBCnv5pThem4Yja4NopggphZhDTCnSD63ALK5lQMxCzJ1Y0T5tUXPCcApE6UKKpp+JMI0nrc/2818X7jhxfC4PARvIqb36guSAjwnR7uHuRxW5ZkWDP0LTOxV+rK0qnTKcxwsiUMZXcDckyThNuU8OMEnMTrApQJWcMmWhN6m375J9fdwfC9vZvBAEEWBB/T59eIWhLgPjOlkcJLOUugjTrs4lwmlgdKZ0gnSYDkDCj/rpmgKJMULaw/OmSfW6AENwsAa8ZLVASabf7sNBIkwALBh4j1Qq48AAXvc1tZEq+5l4nERaWcq08J8vgozwGJY9JRV4mGrltDwyFhRqCYRF6LClgVjAXy+gaxAIrlyh/PDBOV+Yte4oqxOHwEH7YMqZEeoEd4yp9fFNeprvPSqOaWipRnWkGW4pB4baKSJElyGmReeXTdKhNpN1RGs3zOaNhQAQm/cGJfgkcSIQG21MhlUi4T5uhMengxyX4dFgiKI/hYHuTKmgKCXbJFuB4+Xq79u9CnyD14pvHhVYvnzsmhsDGOWZi+rb4mhw4ZkCOVv3QEj4Dy/PKaBDYlSpDyh46uRQk+NkCKrBr5K1FgjN1r5WAEQSsEnyB4jyCulNLKAGvrJcK9tjgXVpxPR34VWLlEOIOHfEiDAphkiZMzC71YNK86HYUkBYyvpEbFJkwooA4ieYRwmPASGxIcregPKaWfNwXAUhrxIsLo+9dxcbOGAQRTANaPBVG3BzjaexgE8Ho8SmG5xBQqokjbhBnUJxAcTk7XMD2kWVDAWIsqPAvkVE5MCYXJN9ASCpNLwqs+5KlEyliDVIdEuUKhMJ02JtJJSIKQOvjfE5CG2wJUBblCVkAwzWjC/UtlQPPFIEUmkzwJs6YH1XVWNsYtG58narlg1wRLMhrJdUwokiA5VExlzEBTV53MmZhMLpSA2xYun+WABumUY9YsDOg6lQhxknDoyGryMOCEkyUIQjA45KJIwd8DSK+R6+9W5C5xdLyW29N+YnmDaLdxWayfjZc8HSrnj39MjCA9gmclo2ZMq6RkFTaHdZnYmnNtswIftdvqCaP71ji21SCBiw6usAMhNWmSzKmVhHIhqMgWDijLobihojvyrcbNqGuFn5huPE1ZRvQTo3ps/eKVQm6O/CYApYKvbZpQhrSaHvzVcKv3cp6PiPL9XHcHojxc7b3a/PAPP0H2RCYhlTQy6cDBL+ZOmSgXpmgU7ZdQvxkt7gq7ttMwgQl/TIWKIU0ShobSWURhAtDKSZAEwS9UmeA+FOO4VsVKOtlwstGEQm2PwAA3cQmG62TdV5XinmB60IlaGhACQH3VI9ycD5i9u8KIm3doefA75dqGGdAIa5JLKVd8gF/VCLwBD9fX3z498SVgTfu+5Y9k13UaVDgkE/FekIAk57YzcznhhoV0aO+Qplqq+WJaJKaaZGSTUNRQS4GTPF0g9N7UE6sz+u6wA4OAJOIBLJUn2FkVyQd9zr6o5nQKAGwZ1oROdoANl7oeLm6gm5lPEIR8m4Q27WDx0Fg8Nsb0rXoVihmKa1Gc7zAcJOEY2oG8qCMW7ALqNCPvKS3hk23fqZqQhUOUSJzkBA24UnzlEokVMPpLwTu5UB7BeycAqykVyZUxXnowpUtaIRw7lE5kkl9JKVclADv2DlnxelayxH3G5tDSFGCBSiwWvlLyk9LEsWVF8QZMECozi+IG+mox+NxNDo2mO6U1M/IbGj5S8pKKKhndp4AglQ1zv3JuhYAK0oYEhniHvS1J8s4foFguDaX8YY26JKgJ+wQogkJjR1jqzS5UHtfpjQgxSYIyzDqw7SzhG4um5DslB76oFaQpJrq9zP+K4hbabA0F3xBnOVSt6F/lAK7nNyR2kAFs76DqFEFQ0mtcD4cgsStLKnTgcBypiQEgvYaSUlqTsPL6vG0geFiT/BpKwUPA/r/ODQnwOOCFUQQh2Kw2GS0Y02IpsX2lxpy+sCik4zDxIFD8pSmu3G5hu0NzEw8DuTkEQc2rpJ7Qt1Kxs7mPqWKpthOg3kQswyVwKzJiIT5fLQTkU1JSimdiQpD8fw7BUbOzxoKwRTbBmyjvDhwCh+AnjTixby0eE5udzX0qqqcKwGXiSbt4IIors5GEsIMm/w2emk/LNSulchEKH0Vis/2G1Lvr1UwwpGcXdhP4Xlwre2gpjmPIDqWCKymFpEMwoLFsSUiREK/ToTzCYYsDh5BvBdo0Az8xLVokNtt7kRaMRW1U9kCKiaAvSCGCa3Ce+mlOJmneXQOtyHtOyzJaNDYU2WyfMbmJRYWMLpmWcUJfMhNR6sqnz5OVywopsjJM1LeBqDSMNFZXBVgtIIXTSprLFaB4YxIqo3IVCl+xwWazD+ErpkZksGuFh08WNWNlrsHe+YbXppf5/F+aQ/C+RBd2sIRvsGkK0pvt1azkpAhK7fxLkHhw0g4CRbMY7x9iWQYNpbQ0KIWHg/iJTExCaqwMAGEpEodNzjMJv3Ce4XwvDJsu7Y7soFdFgI+6gUxOvsHeOVTMC9thh1flUiVSj+k7Qen4TMldSBVR2QEBQancVQHcW0X+kMdd9MoMEkHJqAyk+2oQkUb+XAUBoF2Qx2ukTdNICz7st10sNrynhGYI12mGIMVE1JtXLQtfZjTgEBShuRvYSFkq9MbuY5ENdZBh+rW96pQSFHU9d/UsHDx4J9YhCMThDTano2FCgzMlDAArmYWQtGLa+BBrpT5BgLfk/B0CJ3RCJ7HwnRIbxYtN4Vsrx6Twsw2CJNY3titQBEFyZXMSgq4ILcjgxdgosnkOqXKpLl9APssaulw8BF3DU3IKXTfQUMpFg2uww33+MliNlsU7KBTUOCzg4ZQjPKexwuoDul4YNsOpuI1FdVSF+IRhbhKbZ8mcW38D9NVNkpTC9ntwLVoZnQ3tehEL8ANt+lj42ICmQSvvO6AISSPO5R/2dPABV9LJuvXqcasAyFrkJuRxsA8jC8/SHaEeGXmLKRkDiskakME6PEJZThq7442dORBfBLZjcMg8O1C1VPPElIyBZAvEVKNUPUFR7dPfBJ8XNomQ9zboaOSnMSTYhhP89ZqnCSmWTQ/RQSm+rj5OYWx4VcUKqGYJLXRDom6mXmxvGx5Bav4rCsfxyVGxFdVRUCUsEazbnt+Q2IxKOYZrldog0EZ/gMJFr4jMzBCpDoBYa9PzsN8mgH6BGDKvAKC6fkGIetAT5OKs+QYfcLUbD8PG4MUm9634JShlY2NlzGNLomaQ88qeU5oOyb3k8qQSja1Pi4H3lHyERsO2ao4QYHxhPWUSj8NeSldXbgdIoRSWlqIacMiYBrpx+ofAsG4myFNEgcKJObY7eMNmsMeYkmGRbJ6UqpdqcoIUGaB4YgqzbjQdQmGtNVCxCeUarGrozA5SsjGryaFvBXviqYR1DHFZI76abl7bEiDEitnzJzIKQRIEFSiIboTWAJZaVrVUSJxK4oRqAioQnPmE3mOyVNraKbV9FynMZ+hUEVDPUjwCiZlFKH6CMe8zFEUQlMLJJDyiT4sJO2indvC+J6MaAbLgwXvOg9J4a9hxR1hbIx+gmk5XTcYIoq4dDA7Ox0b+2mBE30E50WQp50nFlL41hOv16Ho92M5QrjNtLBaLyYFvVask5p+gQ1ALSGGuWFzFcNOL4xJUlszb92N79MNM5qtIqYKm8pmSIt35PagF4c3WKUwxg/FXg6W3h3wlwYhAtZdajIKq2267ObwCzr4EnRKatKMbVaRxyacztO/VKhUAAOjUK6ORfMeSjEYUihaIoRaBwIx8Y+iWOH0ZLil9Pe0TapFqvlgkY1/yf5o7pdlCMVFojeta9kJLIhbeiuQ3pGxsdpBduJ4ZQr+QBB9aQe7xIXAmgHxnkhl97cQpHl/HKiitD39PgI3UcQ3uentyDXrrzR5bDZoR1m/byeOR0mrLGKTDOhnDOMVDrfKO+jGvZ7lSny5otsPMEIsubK8GqVIAQPL6TTWk73mMRUpFxT2m9JWihuPgzUZxYpAneMkd30DOAP0+Q8YhrKy6ba4twSZgQ1L1wyi+FZSWpg2tnwMA1UrVme0N6zrD+05PtlebqQBAdZPlV8l0+oWw3j+RIlA8wlP/JfVCoaskvGu/IR3m6x5ZmVTAKIumGjl0VkiWymFomRPuWQqPJ17ZQDdOIlhKY/O4q8RRQ2MQJy0saxQdhhOwC5T6ThX7vvCTGmw/seEkFFVIBVAO1VN4iimltvYSvjF/TCP4TpVSARhR9wzbf8CXJrE6B4cgE2S5OHGOq14ZLBSStkgsGjAjAChTqNNULdtBG3ZgTUblUQEA9Gh7e4wN3zF5SUVlUt0yLoMLUWUMIq2murbG+rGujQF1GcewP4hvVBreABsOqwYqJ761QrZ5YlGnVACVSDVZaP3oA6C+c08uzRELi1IB3FXi6oW7qYHwquEojK43jlrmu1K72YqpRELas21IhlSTVABH36MbOA7FIkW65M/PFomtT/4/AOAzeI/Ja0xHfA24fOTgmnE2ShFCSSlEqZuQeWkCJTnNk4GNjVaH8RV5nFfsR+cyFj5TI2WfvgcQayzfejQ2g7SnC0X5VJBes3GqkV2rRTPYiTI+lGA0KmmM4nagDyXEeKHFWSQ23gigdlM5Cq0wvlODdq8orhBmjlD8FwDo0/XmLgomsAFp8xq/METMtW2wpaeAmSAxQ+eluffNg2XNGgznGPlOCP/US0wvJhqKowfowg2CKrIZ9aNtuQ5A2vYIPZieD5tatqM1N5XmMrpe3ThdKuap9qGdcnDXAahFRl8Kw/H9p2PIDxBrV75TjVRPjct1NwbGxhcKqY1qA8gUQw0NleTQRQCiB4+bV5/hVOjoTwf/8RF/dJ+2B/CKR7QCG4Nsx/etAFayROUtJO8h/ZBSXcFty6NnUteTtw2lDhn5LNIKbmKqnArKpZo+tLQxvZ7TUJw4wBF/LAeCPh6v8A4qMQpCEaM8cASOQTcJ2sElLQgIriB4rrN9QhHgo8kpSxCE1CpWGJ3bAinVKiOADs3gE7MxtYRv2LId2PwFQc9vSC82uuu879LrSO8J5Lk+gOIoyO1QJZXnkPZsG7ZdB8CG62mzMRXGphsAQDBjPHift01bOYNRlGBxlTR2hLPR1DREVXDurIBgDYJ4CDohiIWEJ8hl6O8LcQlCflRCfTJaPKQPUBJUJ3RFUGx8pcZrHYfOLlynVTMY2XU+8SG05wpFT3ZQkVAToTdY5VkSqytTSceC9ScMHb8+NWpG8HPcxWI7bJ7IQyqqpgKIKwJ8HPSbUJqfdZyb6rohesiCqmflENS0SYIg+AEbgCd8ZgTxEcRjIeiG4FExhp/t+JPCMnyC4O2nQTvai2lcG8CZfaonwkaR/V/ApuuFWSQlNpt9AL8hne9ArmdSqVTpo9egFLFMWDnwvsb0HXepSA4/ZQnfYOMoZbemB7DlbXMJHGdWr4amzrscFIPaFMgUPC7c2mHnpd+8FHEPgOAXFl0I6lclaKHhPvVDcmks16gZ/I5ObQ+gITM6hCLeyXRtB3Au2uhD2U47mceYZnXFxL41im99ll361m58a8zQms63MkzoW3DZ9kPnxfD4TxOHlimA6AU4eKGspTuafnLJMJc9s8r6WRNC9fE0c9LZ0S74EQiC4D0+wDMi6Ij61aF6yEIxvOsYAygaazRhBymbMCOADswgFRsH7SF8D1q3I98pYbRCNlonp62dMuhhwgztO/BzPMeUDY8ncpMKC1JB/BI4/Q61gGJRafHNBY21LVi/LABEfD70+v3tLLjNDbDuBvIEb5WS6z5DXARBCOYjKHIGZ4CgVsGYDFwcLZCj0aQZbGVFKoDubS8lm50hQwasyUiuA63aEQrc6vja8G2TKeLxLxdOqQ6poG4gSGxfxnVPqJzQ5ndzNS0LAECw71hZLAQrIWooboHSOkOBcziZpQFBCIK7vwzBk5qBAU7uNRQogjcioTE7WjimbwXQs+1pZ9hjkRZq0gLDdI6LVInNMCPoBKEFXdhBUKbo2fWgHTNIxcZD8QBNmxFcCfaayhEMr6diqo6+zO1k3kFwD8FGBA1YNP06BJ9AIwKvGwGO3Vgt74W1JxTJB8AIlXh4OEEOIb97pUEzWCilmmQEYNv1/tPck+Ruk1zvk6tD0nOzSx5WaZ5x8lYm1IfFiuQhFk9xbD5jYsR7LLCaY5e+p9Of62kzgG6lDGz2oVo2A/hxAsylhQ9bwaFSXhh1+vUCixebod2MvlWVhRaC3QDLbL6iPTBQU5sFIowC60L0WkGaAYVN1fiE/FiEuqTayqYftGcHQ9qOxzrNtU7h9egKH/66FhimDKjeRxvj7vZWNLyMtx0Eo45fb4bY8piKrdCfDrLgIHmdJo+LlGquZdJOtHCdFD9tc2YAZ4MJ5+KW4459R3n1oK3bi6ovzsaNuHr7U+fHI0c9b/9nqD/+OR+LhaAMgguQvUyIBzZBTk1NLe/e14UzSZMpCxpSeqML4xJS7/g6C4XkJ6WUh/GwSeH1GBR+1fkvUgY2tjIs0OxydjXnrUxsDLtkhgj1R3lYJb3wKK3qZZYO9UPgVDC7Mn6ka4tm+w4L06K5J5sAESylZzRf/1ELwz8E1Jae+QsRfyEIhVyv+k4g+Eygq6bmCFZZDR5OEKdgEgZkn3q3CsHXl6mB0a9NliFWeD0sud2mRaqEZ+yDsJlQrPBYFTX3KtmLxUpJuZiTPcD0sFfo5v9QzTrN3BbD/M+aAHB15iB+jzAdzAqRVIcEYzU1A4cQEn6clJRmjaCFghIYbtIT3ERsqdg/3lUstvvbq+phEt7LLGHhPRW+QkGTL1/48unUfYbkMxQ4TfHc2PXkaZcGvuzVpsiSmA/pa8TmNUFo/bJY3FaCX39IgNbhJr6UsYGablQHQMuNOwPYvyyHH8AioHwUpb7cy5ojAJSjHNwulHbsil/0H8Pj4H6dDsLIVh5Gu8Z/sDBZf8k4DxfGfLwwxqM5u08Xdvti0wiv5ybPl2Cn36aHrbn2qfF61IkGHuaen2UEWBiUa6Ya0YQlFEKffDhYaQ05NZpeO6+aWt7ftXn0X69PcJOWjs0lCJJ7p/CK9YZee0Wn5bJXuRmBqjmwH1qLx+SpTYysylBk5NQd7XZ0/u851v86q48/znjGZ+z799MG+u20/v84zfqv53gdNrbCAO8ycXtIs29TJa4aU+FhTfhpLkw/3Zr3LEUQlPzjw9IbadL4AzJqugZpYTdQlCA4oVJfDw2pKUC1fFONM9rmtV2Yf74w72JBfLap1yrpQPe+t3hIdFZ1dtOb5Tludo3wXz48atOPnYERJ6sd/f521lRfTpn60wlv9VbTfDxuuo/HTfX5hD5+Pcv1tOEjJKwsFQ03++R2n96axjnr6XnaNUactSxoKIAddWxnLDDYEnUhUvodAgR3AAZqapNJ0FXLOyxAQwJJEgRV+KwM9AlC8PegmdRbYDbnpZ3z1C5E9rpYWHA612/dgM0d+GLeNtFwu204fDsx/fs9HkPiVEzxdZXEsXXOOBMfoXA53dH3b2fZ+3TcNLfPmPrjcfvd79VP+em4/+pytgOLN70uPT09sW2ac11I7FJ4Pb3gLq6Lcz7sJqtB2xqEOxw3n3HtfzUcBBScfh60b+EqrA1Ha6ym9tS6arNAPHhIHuo3hNohjRRByLcJYL1JDx6ZJs+LhZdqJvagY9dbaJJouDoU9j6vcPJ45G7TcHavN8W3VR8Wd7aXYaPfn86b9MtJV09nis8n9PnrWW4nu7A4yGHCuzukKWcdm3EwoB+MPuk4+G6JxKn1GJ/0XObaNaZbF+VINZ0iZx6eknExN/ToAkfQK6zFEIbwpgRzkPADyqhFCCIzMuikJUk63LQjgTytsA0M2zQukU7k+dqFicfbzAgVmmqGUTHXIemtGnzKryvEz63HmOPBYKovy8LTeW6MzTIsUiabX+fG+nbKtB+PozPZlxP6++m8u94KqxAm/Hucet7qy4/6sqNRxx3731aI5M4qjp6HaT8s8bxNXV8M6tEQqlYFHk7AGB8v51jg6q913EUZn+raA3gFx6CWM7ZH6B5gU/ShSV2JLRAQhODHwYi+tdBkweNigc63c9Mu1OQGUG+oxDbJ/T7phRc/tfT0PuxN0xNWmc1+iF29XrDz03Oeis74X08a6NsFC1YNRaxV5rtM4d3uG842xcBx0KcbjTnpTf1t2Zz3e6ucir1vq2bbF5U7BiY0qNSVRtW6aniFAW6ENaQ5SbJ/QsbXoPqam285GcjISylnSnhlHBRFu4LOgc7HhoFsz0/a4XW6gLJ5FgvNFx34qc0VAxfb5P6Q9FZl3Ow4M2Dxz+ydt9j8/bTpbo+jMd3tM+z+8KwhbucyYDvCVHpvvcu617urJhq3nLyoxLrOqpLHluPXE71OBmaVSgkNF4Pp5q17S8OwMvUHHourH6dMOO5IXILBDgn9gNxEkC6IKWgD0K6Z5JzY/vUJgrcedGJ7KfdYNOYdbfE8X/DUzj3AAywwW+i86MArWFMaKUazrwuP+8TgdPTmGSfsM1RxO9rV1y9nTfHpONqCp7L96/PsPtv0z/Acj7urNN6407sb2ZsWHnYNPT13++RkXVRo+CZdDAYuNqmTclCWBoZYkhN7WAhH8e6qahgGhhLcAIdh8bVBAyAD5egSC0zA0CBgcEsnliknSfBuAho1ow+muGgqFi13Ldps8z7Y5qPe5o/Gn4ZHkWlAqcFXE0w78ywb7vYpfHi9VbUXahJurzPkdxeN/MOz3uN+9/tWff5xhsPDllNns9mYs+7awaL1kRy0hbtD0tNzc0jOt6mvy8F4i5b4pmitGsHaDI6Xc20TApeQbxE6A6ew79GBochhbZzvlpsf/EHN8aSybANGAR7DW57jrgxcA5eQ3wRql9FCMflOKeVnchZb47rOYbnOV7UkFRwsTZA7rVSrfkPPa528D9KCw8QYeGAW7Z+2DPT7afe033sa59spvf9yAW1NHFt4kCTnyVYaOFoVbq4Srdtzf5XmaxvjLTo1h1F9GqwAw6M8N+ldeQIOJ2DgvfP3s8PFcTGKt++yXyN5XjdA+ykwDBRFBwUH2rT0Y/kBQv7QUK1Un8llTH26gSVTmQdAqWwl5AAwHNRLsCyVXdfxFoslfCMbG1dbzdc0+v3hglF/eJaD2+Om+XjCAL+fNuqTTQ/BxlOG57AbOy7HyfMiac+9SAtO0+yj1G4alCcc2B6suw4KUnZ3EJpPSKVJn1texRaMDQyRoOBkwIawt/8GTHF1F/PSqVNDTg5BEFyVfcs1A/sWELy9w6P25XpvDrATqZozo17NYGDXs+57L9CIraqhAoh6nx87U32mGsF3vKbkNySfRWLjZlPkS3r464yRf3jOoL++oI8fz/N8sWuxWLBxlcxxaG0RNKVoaNmwve2tKbuBQpvmexY+yuU7hOeUpghBl3AwfSqmHbANidEmNTVAk5AggYu8rq2LX4IuCFyKILgH3CFJv9AcyBOCtwYAaN2MpnWt+WJaYQnfCKIdNJmXmCb0RZN2BGUofYPuoBCyNhn153uvtYL2CgyRJUOAM8qzhW7/OKef7y8QXezagIn0+X2nNG8sJgytdu2gGmgEnnMW0FS5P2vARQeSZyMCXIKSXm0NHsF9rH3n5aILswnBECZoI94dna5lqXgGvLY+zXYPwwP5WKkDUoIeAaAcql37ju/U8JNSMobAOqiibd+LC4+iImMHvs7R/ajhfW/2WCyUUlC/IR0qGUaoo+h2vGPepoGTFLNdsnbQ+VKyF1vdu17tUtUGb7b3OJoGKvaFNQ/EoydpOzA5cAhC/pa3vG0uwRWBj33LHPRkWlAtz+6gj/e2f30bi+F5cK3ypOF6G/ETr3gN8tyGAcqlGst3lvAJs36T/ehxilSOqeBXqeTNe+heCSY/wqoZdWAHf33WUMwb0wp+Q9JOtUI2xUPQvmor9Lcky+YzJd9FSqmdauGU3KZi+lC8+/bMwJKMlmqTYAccgLGmptxT9y8USZ+bSxCU4Xluqk7SuFAjKZKgEr+1XSBR7FnoA6DnydckoOk0Jr+6S7XhDFiORxbQovTzH7dQN8Q9jho6YdjYWjQ1Fhkt7OpihzmquE8sI2csF+eAB2oHolZFVZOhGTN613c5Zej8So+xWCSlFbTDhAkTRDvoJWdjz5+Sh1gckf3QuUsbrtOSHVmVyqJUBRtUugA7hEiOIe+sIKd7NY+yIsAflaenoziQGHAIgvvS+YLtBngEmVPxPmOSdDc7CZStoTI3N83xVugRaBMcXqZCt6V8whxU+hSl70gIUYRsVQL07nraOM8P57BwvcNzO/fgXZcFxKoTjvs81eRoMjjgc/YGjRFMKRCscqnqkFHzZtSVHfRgB9ZNrx/b68f0erC9jt2gFRk0bkb1yagmU1VBtW4tYEVpUulSGVwZW4mkKUfTDLD3m7UKKQDBSwT/xpXjE1zpPQh35VBA/ebaH5TSSSinT5BXczYBKYIS7L08JsxKb7jVewkZBhsPuvgoaEXRR3VFsQaEFLVJNW9KeLd4hgWGWx7A62JBbLapOlsBgGldUhsTHcETTyrIyDmFCDJ1gE7cpUMAgDllpZVKAlo7nkkMORUVORU53YmEA51YkRSAIAbBtwjGIMiN4NN3Is/hn6Ad4TkjaVEEwfEExT79/qAJoEjqPIcCBYrDvaEfXqZJQy0+iHG4qVjeIN5N1Vc/zIyG4lJcl0K++E1DMNit7+A+vWaY/2LLA0R+8I6rArqfflN342+pNZ1gSiqApeuGE7MFdqBtgEZhSljmsfQOPDiEjlE8zV29pNGH/cjn/I2LwTqzg0OYFEaCZ2iLYJlQNksAXhjB9wgWI6iCIB4LQZ9iufcKWmnO5g8UR72kEtxQ4C91DVVLgI141LPE8QbcnG8GVfrz7G7eSIg1BHHX27eC9gnyvDeAruEPqFYuzJWKA2DfST5i8hGLh1i42eZpsRD5wQcZNmCAxWd42v0f5/mIKa7v0t7lzy4iOIngNoJIAADVRuDiJEAEaCq0wQaFtAupPMvFnaBzKAJ5dgYrp786gFesPjyv0ebet+WZnX5HyaIJQR7TeLkfcnjIdEOPpaZiSIObe+k/Kie3IYQlScoHUOT+oK7iCfavbyfEHAAqcj5sp+m48nTiBJP/ONjuwnSasaMVsNeYd9CQnO8Sa3dclIv2EpebBc/twiKjOTuDXdDr7OvcnvZzkdd4uPr/GbShaRcIAAArNQY24CYKaW+AaukIokKAzEfRn7CSKgBAjek53U6+bZjl+020fyln56Nc9oee+WNvEtSwcQSni7z1sgjCsj/1zBCnBD3nvRM4/7wGy6xY0kAf9axdf/mwWU/XYBjtzLC4n9lnwVAEf9A0BEszONDWxuRIJnywaZDPF9n+cNGQH+cG/3SRza8XDfnpggmfX9DbZBcMvPikeRf/GTr36r+HsRBUQ/ADxI8YrFoldeBytQKIZQ1ORkYENFWexQkchXVh68pAB0BHBwAqdnN9zT9PNB/m/nofiX5KPK+HOrs3LU4HwQAI9p0RdEewYy1NXdTDxOJwDRCcFuLLfWP42AJC/h3NEqrzpzk83ghvIP4NTne8RblmhyWd8CaETBjkZmH3toPz7maRouGtaGzlPaZPMNdki4M8N9q7Cxq5aoD12Vf0Pf/MVQTjEGxHELXmaX6pg1ZE1aTQpAlNCY0L1oQiSwNs2zoUjNcL5FIFuIHKFYvwWywrv/+gUKR2DVBLOml367eI4v56H8/b/21EB8EkBEcQNEGQjIXgtx5BrgCFCjNXzvWqcdTU8j4x3IMUpW6VYEqq3W7eCn8IdJQ2hr8G4wnNCqkNLhSmDJ1UONtkYLO9x8Y8k0u8zhcWmsyNNtp2j6alujpThFKdg64IbLB61Rabg4mBh3vYGoRBBhODDcKggzBgHXooaMgDEAvAnGDF0WKgkxS6TaH7YqLbYqLrROeRDkJowgIntsFxl6FLoMvxd421epXBFh9ehyARCy0EJUwj7HehXnuTUq+Q/Ro01dTU4lyYTj0CWdS2Aq0PfyVKAlyMx9+/zA+8RLWHlDsYzBqLQ7HxtGgqvJU7Ikf23C7M3c41GjswDGEDMcEfJH/pAKdU8pgbFo75yBo3NOtCOyF0F+k8hZJ5GgLLAPX7MGgT+qmC9TL0kOg28f66T/RS0k890WwMcPnPoh2pSQ0ACOIQXDlWNAgGlnYLHFRE921S7A4cgy4NmVcNsTaVrgoNFdht9q9vJ9mvY+ZvN21f/AK8dvKY1sAslfOYfKUGPgvX204ucuQHH2ywC/SEoQTCPYP0tUJTlk4CXaTQTRl6SnSTsGgoXwkBazcMuXTiVgM1KI1bWnChKcPOhLT1KHUrpSLes3NIIuQ91miEGzIHCJYjSI0CwcWjFaDS3mN9hQCRjiIIjYkgRV0guBiwPv0KWab+eTXL6Vq1pFPgG/+rRKVchMJnSvhxxIKDbQ8QOfK87dwk423QPqGoeygqFApfFVqN9FKGrovQaQwdhtC8C3lUA0PUj1kEyteq2NINutBvHQZowsB1GHAw0X8d2o4BHmV+kBIKicJC/saIgOA6gnI0EBQ2jSD7ghRBkIKxhVI/bk4l3CU/sQOBVtgIWgOZMghlST6e6XT9f+6O+zD1TzgX/Zqpru9gqTgOKtA9yoOyqUR9i4nJQs022mSedm668Tad0umEdNmUADUrW9Z1V20ZrxGhRUtHgXYil10BrLZjipY8zRsy1qvVlmm/UvrWXKjbAn8ANQJLEoTnCd0ulzVzuQTBl7Q3eQhmb2tIEZRgJCh1p5pauQcHu2CgFiNG5v4lpEl75Aia+ePfU4h30xUS3TQyB1Pm+HyVnqZfU7k7D3aU8Gk7fBapdkSOHHnexcJ4oy2mAFaMIRQKkzcpoQyhvUBXKfRShb7rYKsJe1ux7ypYC0EVAFJ0WoYhBsHWYKLPKnSVaMOHnQsNCQ0o1SlwMkKUdCtSLJVhzgeXG2K/AsHLw2edwXnoCQg+1Y+weS+gKecDAgwCY4GummYgin9igGAbi8WSyGv1JPL637Li/QYMw/pr4YynG9QQnmNGg+NYrIBbVvSeGl5nmyJHXmC2YLNpQLMXE+X5MDz4g+WFOTeu1tBnSY/VxI386JYtOzeErVgBeG+jCEuBaao6hFZd6DSF3goGbCYGH4RXstVMtF8EeCeowT638TmqTWHCfpWrfJlu2yXngSAJC0GPwFfmEwSu4TuVL3wbuRja/IvbbEwIJyvPVWsMAMFnCNKxaHJyXEsj3k0XSuT1gCjM/AX0GBqsHgTThNZhcD6xF6rSAlVjgSp5GW/xsFzw0i54mS00EHs6uz2vslhOTKgsH0EqtlnIXixkyLTHGbVsreKqLq2i1STA5jo1KvUrPzN/IxKasbTpaN4B7yBMXlQYA5oeTti/WeUqX268fpUFC4KtLAQpEfx3rUL9va9WC+HC5NQcwsVxk7z1E8vcxEfeOhggOH6sLLRETrNy4nnjG9fdQUzMFHZw+VNg13Wwf7r7rfM1jRHezg3y5SJbXy4a9NNFX8Xm93NDfLug14eXqKp2Ml1mtZ7o867yBx5h+UA68bdOFHbbNaEmR50WODKh8EygCrDsAqypkcikWNrgNOaGAMlnUcybMMXNKtFHlxn+sKLaOIHgGoJcCOIhmGERSgS6P4BrDaCmFiT3osC/zIQlAV4YwdcIurIw5Pb0L0nF+tkUibweiO/9hLYWHwe92x52t3sOC5dJYr7L7WSHx9EuzxcND+MdTg+bHN7MjXjcVJ6poM1x6HW1rMK76tf7A6H0zedb+azKV6B8gxUbeqsnLAjQFwiF1wrBuitDvY5gqtGDm2S0AtCLIPQO4YS9KVWnMNh+RR3lBHzQU2YhKGwaHz/yvisEBA8RnIXTVNHV1Qx9+urrAYKgZ0bQG0FRFo5E+2l58Tz9DH+TcfevZIqqMRn5SAkn6vER095Cu8Vi4a3a4XW+MM9sYb75ws5SD+qvw8wPV9VSTHyo0YEj/FUhAKqw7FToNvFhWosBVD+gUDgcADTt6TWFdmKo2QWAHSOWBF2hULiK2TtsrJa1P1kCpRB8hyD9IyI4p5MeAEEkgo/QLRhMD5H2/tUuOWeWGgBBAIJsLHwhKj7+H1CddleqLrygXCbEU3Gj+I5nwcGWB/DcLnheLNQfB2BGsH21YsabyzR1uccrZi0hvCvYuQ9dptB1pOOAjWoietWg0wzsCV66VgixdFVCv3VoLwTrVWjU0rjHrKKTa7PkpG5HCjQzmJjt0eWsVqEsZe29GYLJgOBLBH+rtg3xAFqHw7YNl//VzlOBEvwq+BksJsTEgi5G3wO2XC8M/q4WanZ4ahd+icv5pursSCd9mTZ0MV/Wx3LZoLtV5drgTIkZf8V+6tCyC9bL0FGg/Yg5rb5T3FjfM2SIiuAlVbsqQgcx2ChDK5Yf1oAl2CTgD4h6tHrFatNEv+tlzh5cxvpiCcQ3yprihRG0ZX0yuFOuPbABm623n7HBKchShF+4fUCwyX8g2a+b5OrFyjTFah5jsR0u3spdkeefz4092qGzkkZlADBet6rGIgx2x2VCZzF0HEPXKbQT6K2kJkOtWj3wlsvCShplwOMHs2aDjXqiLR96LCba9NioQjkQX1bOlGHg3bI+F0ts7lY0P9oDKgeNeiFREZ2LRJDw8L9RBfDSyws4i4AsxSUJoqhtARCM9B8k+DPtXP4cdOsGtLgXT/NOLlmr8dCBmiBs2mVVB9os6WO9JAXUaei3ollD8n/xLk0rr/0xszcMBY3yqw4MloUKofcqvE7fFU0b+q7CxcIf7UCpNobp76+w4AAzd9VqGiFNTBLFBwTTWAjmw68qSjCMe+IHLIIgYl/+hRuc4XijasJZCBPD+06YZGycHfgqt/XdNGD9tGFNjDau0Ib+1kvKNcTttQpt+FDgL/RcYM2QQkRIFDhRxrC54PY3hNZ96CbSbqCbMrRs+WHFwLwNw1+vsLlbZkqIr5E2vwlNiYohiEJQGUEmBG9CfCn0Mz3JS3JOgGAFy7+QIMqo29cpyxammLDpe+cWFGumYirFgVxPp6RlSGRiYrRtCFBt2oc+6/C7rZehBUtPZShfK2taZa4AVsyoFDY4PEMAc1Ak5a0+QmNCn1Vo1aFTTZzoZbmkDBsqVjTSmqAU1igFgnMsBCPgrFSW9w1cfYH+PWsAgjMIEjALE5vscv0uFdtN0LgZ2fetRWPynZL3IqHwkRqXrOggFE3bEZRcnZZM8ufKakGBFiOv02Ux0bqnq3KiWR9MKSFSpDBavWT1EHalWFuXCeUpXabQXqD9EDpLoTmLzTqUBthx21wmDEq0IoIQBPnOE8FGKLZZHAmQsQNNQ8nvimD1GbD8FwncnvYbbf/agLJN8xRK7nMM1/ISE5135zKk0UOnFTMoBaUsAS3RzUgpoapVobcyNGmwXk+ULhkxu4ZRipIllYwigo5OowYbVWhUSHlkbQYqFkruBIJr5MegCCCowroZBHsBYu1oVgIAgn8QNGcxJxY=";
function createQuickDock(options) {
  // Two independent windows, one canonical controller. Serialize only layout writes.
  const {storage=null}=options;
  const loaded=Promise.resolve().then(()=>storage?.get()).catch(()=>null).then(saved=>{
    if(saved?.version===2 && saved.windows && typeof saved.windows==='object')return {version:2,windows:{...saved.windows}};
    // Preserve the old combined dock position for auto; items gets its own defaults.
    const win=options.parent.ownerDocument.defaultView;
    const items={visible:saved?.visible===true,collapsed:false};
    if(Number.isFinite(saved?.x)){items.x=saved.x>=300?saved.x-292:Math.max(8,Math.min(win.innerWidth-284,saved.x+292));}
    if(Number.isFinite(saved?.y))items.y=saved.y+(win.innerWidth<600?230:0);
    return {version:2,windows:{auto:saved && typeof saved==='object'?saved:null,items}};
  });
  loaded.catch(()=>{});
  let writes=Promise.resolve();
  const scoped=kind=>({get:()=>loaded.then(value=>value.windows[kind]),set(value){
    const next=writes.catch(()=>{}).then(async()=>{const saved=await loaded;const windows={...saved.windows,[kind]:{...value}};
      await storage?.set({version:2,windows});saved.windows=windows;});writes=next;return next;
  }});
  const auto=createQuickWindow({...options,kind:'auto',storage:scoped('auto')});
  const items=createQuickWindow({...options,kind:'items',storage:scoped('items')});
  const ready=createQuickWindow({...options,kind:'ready',storage:scoped('ready')});
  const each=(kind,action)=>{if(kind==='auto')auto[action]();else if(kind==='items')items[action]();else if(kind==='ready')ready[action]();else{auto[action]();items[action]();ready[action]();}};
  return {update(value){auto.update(value);items.update(value);ready.update(value);},show(kind){each(kind,'show');},hide(kind){each(kind,'hide');},destroy(){auto.destroy();items.destroy();ready.destroy();}};
}
function createQuickWindow({parent,onAction,onOpenPanel,storage=null,trustedOnly=true,kind}) {
  const doc=parent.ownerDocument || document, win=doc.defaultView;
  const css=doc.createElement('style');
  css.textContent=`
.quick-dock{all:initial;box-sizing:border-box;position:fixed;z-index:2147483647;left:0;top:0;width:min(276px,calc(100vw - 16px));max-height:calc(100vh - 16px);max-height:calc(100dvh - 16px);display:flex;flex-direction:column;overflow:hidden;border:1px solid #d1a0b83b;border-radius:15px;background:linear-gradient(145deg,#30202cf5,#19121df5);color:#efdee7;font:12px/1.5 "Segoe UI","Microsoft YaHei",sans-serif;box-shadow:0 18px 65px #07020c80,inset 0 1px #ffebf50c;backdrop-filter:blur(18px);pointer-events:auto;color-scheme:dark;isolation:isolate;animation:quick-arrive .2s cubic-bezier(.2,.75,.25,1)}
.quick-dock[hidden]{display:none!important}.quick-dock *{box-sizing:border-box}.quick-dock button{all:unset;box-sizing:border-box;position:static;display:inline-flex;align-items:center;justify-content:center;flex:none;cursor:pointer;pointer-events:auto;user-select:none;-webkit-tap-highlight-color:transparent;font:inherit;writing-mode:horizontal-tb;transition:background .16s,border-color .16s,color .16s,box-shadow .16s,opacity .16s}
.quick-dock button span{font:inherit;writing-mode:horizontal-tb;letter-spacing:normal}.quick-dock button:disabled{cursor:default;opacity:.45}.quick-dock button:focus-visible,.quick-dock .quick-grip:focus-visible{outline:2px solid #f0bed4;outline-offset:3px}.quick-dock button:not(:disabled):active{filter:brightness(.93)}
.quick-dock .quick-head{display:flex;align-items:center;gap:5px;padding:10px 9px;border-bottom:1px solid #e1afc512;flex:none}
.quick-dock .quick-grip{display:flex;align-items:center;gap:8px;flex:1;min-width:0;cursor:grab;touch-action:none;user-select:none;border-radius:6px;outline-offset:2px}.quick-dock.is-dragging .quick-grip{cursor:grabbing}.quick-dock.is-dragging{animation:none;box-shadow:0 22px 65px #07020ca0;border-color:#dbaac36b}
.quick-dock .quick-mark{width:29px;height:29px;display:grid;place-items:center;border:1px solid #ecbad335;border-radius:9px;background:linear-gradient(135deg,#794557,#341f31);font-size:18px;color:#f6dce8}.quick-dock .quick-title{font-size:11px;letter-spacing:.06em;font-weight:600}.quick-dock .quick-state{display:flex;align-items:center;gap:5px;color:#bba1b4;font-size:9px;margin-top:1px}
.quick-dock .quick-led{height:5px;width:5px;border-radius:50%;background:#a08a9d}.quick-dock[data-running=true] .quick-led{background:#7ee2b6;box-shadow:0 0 7px #66d7ac55}.quick-dock[data-running=true] .quick-state{color:#a6d8c2}
.quick-dock .quick-run{min-height:29px;min-width:43px;padding:0 9px;border-radius:7px;background:#e3b2c4;color:#301320;font-size:10px;font-weight:650;border:1px solid #f7d9e233}.quick-dock[data-running=true] .quick-run{background:#613045;color:#ffe2ed;border-color:#df91b14d}.quick-dock .quick-icon-button{width:22px;height:26px;color:#bca0b4;border-radius:5px;font-size:14px}.quick-dock .quick-icon-button:hover{background:#d6aac51c;color:#fff1f8}
.quick-dock .quick-body{min-height:0;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#856078 transparent;padding:3px 12px 11px}.quick-dock .quick-body[hidden]{display:none!important}.quick-dock .quick-body:not([hidden]){animation:quick-body-in .16s cubic-bezier(.2,.8,.3,1)}.quick-dock .quick-master{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #e0b9cc14}.quick-dock .quick-caption{font-size:11px;color:#efdae6}.quick-dock .quick-description{font-size:9px;color:#ab90a6;margin-top:1px}.quick-dock .quick-section-label{display:flex;align-items:center;justify-content:space-between;font-size:9px;color:#a88ba2;padding:12px 0 5px;letter-spacing:.04em}
.quick-dock .quick-switch{width:31px;height:18px;border-radius:99px;background:#4b3b4c;border:1px solid #b797af28;padding:2px;justify-content:flex-start;position:relative;box-shadow:inset 0 1px 3px #0a030d40}.quick-dock .quick-switch:before{content:"";display:block;height:12px;width:12px;background:#cab8c7;border-radius:50%;box-shadow:0 1px 3px #13091555;transition:transform .18s cubic-bezier(.2,.8,.3,1),background .18s}.quick-dock .quick-switch[aria-checked=true]{background:#b77894;border-color:#e6aec64d}.quick-dock .quick-switch[aria-checked=true]:before{transform:translateX(12px);background:#fff0f7}
.quick-dock .quick-items{display:flex;flex-direction:column;gap:2px}.quick-dock .quick-item{display:flex;align-items:center;gap:8px;min-height:42px;padding:6px 4px;border-radius:8px;transition:background .15s}.quick-dock .quick-item:hover{background:#dca9c50a}.quick-dock .quick-item-icon{height:28px;width:28px;flex:none;position:relative;overflow:hidden;border:1px solid #b18a9c3b;border-radius:7px;background:#231827;display:grid;place-items:center;font-size:10px;color:#c3a1b8}.quick-dock .quick-item-icon img{position:absolute;inset:0;height:100%;width:100%;object-fit:cover}.quick-dock .quick-item-text{flex:1;min-width:0}.quick-dock .quick-item-name{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;color:#dfcbd8}.quick-dock .quick-item-hint{font-size:9px;color:#a48c9f}.quick-dock .quick-item[data-state=full] .quick-item-hint{color:#e8c281}.quick-dock .quick-item[data-state=enabled] .quick-item-hint{color:#8ad0af}.quick-dock .quick-item[data-state=disabled] .quick-item-hint{color:#d296aa}
.quick-dock .quick-empty{font-size:10px;color:#a38a9e;padding:15px 0;text-align:center}.quick-dock .quick-bottom{display:flex;align-items:center;justify-content:space-between;margin-top:8px;padding-top:10px;border-top:1px solid #dfb6c919;gap:8px}.quick-dock .quick-open{color:#e9c9da;border:1px solid #d6a7bf2e;padding:4px 9px;border-radius:6px;font-size:10px}.quick-dock .quick-open:hover{background:#ce8fa91a}.quick-dock .quick-counts{font-size:9px;color:#a98a9f;font-variant-numeric:tabular-nums}.quick-dock .quick-feedback{font-size:10px;color:#e8bcce;line-height:1.6;margin-top:7px;overflow-wrap:anywhere}.quick-dock .quick-feedback:empty{display:none}.quick-dock[data-busy=true] .quick-mark{opacity:.6}


.quick-dock .quick-empty:before{width:96px;height:96px}


.quick-dock{--q-icon:url("${QUICK_CHIBI_ICON}");--q-coffee:url("data:image/webp;base64,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");--q-thumb:url("data:image/webp;base64,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");--q-question:url("data:image/webp;base64,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");--q-empty:var(--q-question)}
.quick-dock .quick-mark{background:var(--q-icon) center/contain no-repeat;width:32px;height:32px;border:0;border-radius:0;box-shadow:none}
.quick-dock[data-kind=items] .quick-mark{background-image:var(--q-coffee)}
.quick-dock .quick-title:after{content:none}
.quick-dock .quick-empty:before{content:"";display:block;width:76px;height:76px;margin:0 auto 5px;background:var(--q-empty) center/contain no-repeat;pointer-events:none}
@media(prefers-reduced-motion:no-preference){.quick-dock{--q-empty:url("data:image/webp;base64,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")}}
@media(max-height:620px){.quick-dock .quick-empty:before{width:54px;height:54px}}

@keyframes quick-body-in{from{opacity:0;translate:0 -4px}to{opacity:1;translate:0 0}}@keyframes quick-arrive{from{opacity:0;translate:0 7px}to{opacity:1;translate:0 0}}@media(prefers-reduced-motion:reduce){.quick-dock,.quick-dock *,.quick-dock :before{animation:none!important;transition:none!important}}
`;
  const root=doc.createElement('section');root.className='quick-dock';root.hidden=true;root.dataset.kind=kind;root.setAttribute('aria-label',kind==='ready'?'自动准备悬浮窗':kind==='auto'?'倒转开关悬浮窗':'道具抓取开关悬浮窗');
  root.innerHTML=`<header class="quick-head"><div class="quick-grip" tabindex="0" title="拖动此窗口；方向键微调"><span class="quick-mark" aria-hidden="true"></span><div><div class="quick-title">${kind==='ready'?'自动准备 · 无尽':kind==='auto'?'倒转开关':'道具抓取开关'}</div><div class="quick-state"><i class="quick-led"></i><span class="quick-state-label">未连接</span></div></div></div>${kind!=='items'?'<button class="quick-run" data-quick="'+(kind==='ready'?'ready':'auto')+'" type="button">启动</button>':''}<button class="quick-icon-button quick-fold" data-quick="fold" type="button" title="收起此窗口" aria-expanded="true">−</button><button class="quick-icon-button" data-quick="hide" type="button" title="仅关闭此窗口，不改变运行或抓取设置" aria-label="关闭此悬浮窗">×</button></header><div class="quick-body">${kind==='ready'?'<div class="quick-master"><div><div class="quick-caption">每十回合不准备</div><div class="quick-description">跳过第10、20、30…回合</div></div><button class="quick-switch" type="button" role="switch" data-quick="ready-skip" aria-label="每十回合不自动准备" aria-checked="false"></button></div><p class="quick-ready-condition quick-description"></p>':''}${kind==='items'?'<div class="quick-master"><div><div class="quick-caption">道具抓取总开关</div><div class="quick-description">保留各项配置与计数</div></div><button type="button" class="quick-switch" role="switch" data-quick="master" aria-label="道具抓取总开关" aria-checked="true"></button></div><div class="quick-section-label"><span>单件道具</span><span class="quick-item-total">0 项</span></div><div class="quick-items"></div><div class="quick-empty">先在主面板添加道具</div>':''}<div class="quick-bottom"><button class="quick-open" type="button" data-quick="panel">打开主面板 ↗</button><span class="quick-counts"></span></div><div class="quick-feedback" role="status" aria-live="polite"></div></div>`;
  parent.append(css,root);
  const $=s=>root.querySelector(s), grip=$('.quick-grip'), list=$('.quick-items'), rows=new Map();
  let data={items:[],running:false,starting:false,ready:false,eligible:false}, state={x:Math.max(8,win.innerWidth-(kind!=='items' && win.innerWidth>=600?584:292)),y:kind==='ready'?260:kind==='items' && win.innerWidth<600?340:88,collapsed:false,visible:false};
  let destroyed=false, drag=null, busy=0, touched=0, saveTimer=null, lastStart=0;
  const clamp=n=>Math.max(8,n);
  function place(){
    if(destroyed)return;
    root.hidden=!state.visible;$('.quick-body').hidden=state.collapsed;
    $('.quick-fold').textContent=state.collapsed ? '+' : '−';$('.quick-fold').setAttribute('aria-expanded',String(!state.collapsed));$('.quick-fold').title=state.collapsed ? '展开' : '收起';
    const width=root.getBoundingClientRect().width || Math.min(276,win.innerWidth-16), height=root.getBoundingClientRect().height || 50;
    state.x=clamp(Math.min(state.x,win.innerWidth-width-8));state.y=clamp(Math.min(state.y,win.innerHeight-height-8));
    root.style.left=`${state.x}px`;root.style.top=`${state.y}px`;
  }
  function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{saveTimer=null;void Promise.resolve().then(()=>storage?.set({...state})).catch(()=>{if(!destroyed)$('.quick-feedback').textContent='悬浮位置未保存';});},180);}
  function text(node,value){if(node.textContent!==String(value))node.textContent=String(value);}
  function controls(){
    const run=data.running || data.starting;root.dataset.running=String(kind==='ready'?!!data.readyRunning:kind==='auto'?run:!data.paused && data.uiReady);root.dataset.busy=String(busy>0);
    if(kind==='ready'){
      const button=$('.quick-run');text(button,data.readyRunning?'关闭':'开启');button.setAttribute('aria-label',data.readyRunning?'关闭自动准备':'手动开启自动准备');button.disabled=!data.readyRunning&&(busy>0||!data.readyReady);
      text($('.quick-state-label'),data.readyMessage || '已关闭');
      const skip=$('[data-quick=ready-skip]');skip.setAttribute('aria-checked',String(data.autoReady?.skipTenth===true));skip.disabled=busy>0||!data.uiReady;
      text($('.quick-ready-condition'),`资金 ${data.autoReady?.funds===null?'不限':'≤ '+(data.autoReady?.funds ?? 0)} · 开关不随布局保存`);return;
    }
    if(kind==='auto'){
      const button=$('.quick-run');text(button,run?'停止':'启动');button.setAttribute('aria-label',run?'停止自动倒转':'启动自动倒转');
      button.disabled=!run && (busy>0 || !data.ready || !data.eligible);button.title=run?'停止自动倒转':data.eligibility || '手动启动自动倒转';
      text($('.quick-state-label'),run ? (data.starting?'启动中':'运行中') : data.ready?'已停止':'未就绪');
      return;
    }
    text($('.quick-state-label'),!data.uiReady?'未就绪':data.paused?'抓取已暂停':run?'抓取已开启':'已开启 · 倒转未运行');
    const master=$('[data-quick=master]');master.setAttribute('aria-checked',String(!data.paused));master.disabled=busy>0 || !data.uiReady || !data.items.length;
    master.title=data.paused?'恢复原配置，不清零计数':'暂停全部道具，不改变单件配置';
    for(const [id,row] of rows){const item=data.items.find(i=>i.id===id);row.querySelector('button').disabled=busy>0 || !data.uiReady || item?.status==='full';}
  }
  function update(next){
    if(destroyed)return;data={...data,...next};data.items=Array.isArray(data.items)?data.items:[];
    text($('.quick-counts'),`购 ${data.bought || 0} · 售 ${data.sold || 0}`);
    if(kind!=='items'){controls();place();return;}
    const ids=new Set(data.items.map(i=>i.id));for(const [id,row] of rows)if(!ids.has(id)){row.remove();rows.delete(id);}
    for(const [index,item] of data.items.entries()){
      let row=rows.get(item.id);
      if(!row){row=doc.createElement('div');row.className='quick-item';row.innerHTML='<span class="quick-item-icon"><span class="quick-fallback"></span></span><div class="quick-item-text"><span class="quick-item-name"></span><span class="quick-item-hint"></span></div><button class="quick-switch" type="button" role="switch" data-quick="item"></button>';row.querySelector('button').dataset.itemId=item.id;rows.set(item.id,row);}
      if(list.children[index]!==row)list.insertBefore(row,list.children[index] || null);
      row.dataset.state=item.status;text(row.querySelector('.quick-item-name'),item.name);text(row.querySelector('.quick-fallback'),[...item.name][0] || '?');
      text(row.querySelector('.quick-item-hint'),item.status==='full'?'已满 · 不清零':item.enabled ? (data.paused?'总开关已暂停':'已启用'):'已禁用');
      const button=row.querySelector('button');button.setAttribute('aria-checked',String(item.enabled));button.setAttribute('aria-label',`${item.name}抓取开关`);button.title=item.status==='full'?'已达到限制，不清零次数':`切换${item.name}抓取，不改自动使用`;
      let image=row.querySelector('img');let src='';try{if(typeof item.iconUrl!=='string' || !item.iconUrl)throw new Error('no icon');const u=new URL(item.iconUrl,win.location.href);if(['http:','https:'].includes(u.protocol) && u.origin===win.location.origin)src=u.href;}catch{}
      if(image && image.getAttribute('src')!==src){image.remove();image=null;}
      if(src && !image && row.dataset.failedSrc!==src){image=doc.createElement('img');image.src=src;image.alt='';image.loading='lazy';image.decoding='async';image.referrerPolicy='no-referrer';image.addEventListener('error',()=>{row.dataset.failedSrc=src;image?.remove();},{once:true});row.querySelector('.quick-item-icon').append(image);}
    }
    $('.quick-empty').hidden=data.items.length>0;text($('.quick-item-total'),`${data.items.length} 项`);text($('.quick-counts'),`购 ${data.bought || 0} · 售 ${data.sold || 0}`);controls();place();
  }
  function click(event){
    const button=event.target.closest?.('button[data-quick]');if(!button || button.disabled || destroyed || (trustedOnly && !event.isTrusted))return;
    const action=button.dataset.quick;event.stopPropagation();
    if(action==='fold'){state.collapsed=!state.collapsed;touched++;place();save();return;}
    if(action==='hide'){state.visible=false;touched++;place();save();return;}
    if(action==='panel'){onOpenPanel();return;}
    if(kind==='ready'?!['ready','ready-skip'].includes(action):kind==='auto' ? action!=='auto' : !['master','item'].includes(action))return;
    const stop=action==='ready'&&data.readyRunning || action==='auto' && (data.running || data.starting);
    if(busy && !stop)return;
    if(action==='auto' && !stop && Date.now()-lastStart<500)return;
    if(action==='auto' && !stop)lastStart=Date.now();
    busy++;controls();text($('.quick-feedback'),'');
    void Promise.resolve().then(()=>onAction(action,button.dataset.itemId)).then(result=>{if(!destroyed)text($('.quick-feedback'),result?.message || '');},error=>{if(!destroyed)text($('.quick-feedback'),error?.message || '操作未完成');}).finally(()=>{busy--;if(!destroyed)controls();});
  }
  function down(event){if(destroyed || event.button!==0 || (trustedOnly && !event.isTrusted))return;event.preventDefault();event.stopPropagation();touched++;drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:state.x,top:state.y};grip.setPointerCapture(event.pointerId);root.classList.add('is-dragging');}
  function move(event){if(!drag || drag.id!==event.pointerId)return;state.x=drag.left+event.clientX-drag.x;state.y=drag.top+event.clientY-drag.y;place();}
  function up(event){if(!drag || drag.id!==event.pointerId)return;const id=drag.id;drag=null;root.classList.remove('is-dragging');if(grip.hasPointerCapture(id))grip.releasePointerCapture(id);save();}
  function key(event){if(trustedOnly && !event.isTrusted)return;const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];if(!delta)return;event.preventDefault();event.stopPropagation();state.x+=delta[0];state.y+=delta[1];touched++;place();save();}
  root.addEventListener('click',click);grip.addEventListener('pointerdown',down);grip.addEventListener('pointermove',move);grip.addEventListener('pointerup',up);grip.addEventListener('pointercancel',up);grip.addEventListener('lostpointercapture',up);grip.addEventListener('keydown',key);win.addEventListener('resize',place);
  controls();
  void Promise.resolve().then(()=>storage?.get()).then(saved=>{
    if(destroyed || touched || !saved || typeof saved!=='object')return;
    if(Number.isFinite(saved.x))state.x=saved.x;if(Number.isFinite(saved.y))state.y=saved.y;
    state.collapsed=saved.collapsed===true;state.visible=saved.visible===true;place();
  }).catch(()=>{});
  return {update,show(){if(destroyed)return;state.visible=true;touched++;place();save();grip.focus({preventScroll:true});},hide(){state.visible=false;touched++;place();save();},destroy(){destroyed=true;if(saveTimer)void Promise.resolve().then(()=>storage?.set({...state})).catch(()=>{});clearTimeout(saveTimer);if(drag && grip.hasPointerCapture(drag.id))grip.releasePointerCapture(drag.id);win.removeEventListener('resize',place);root.remove();css.remove();}};
}

// Runs in the clicked tab's isolated world. UI stays in the extension iframe.

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
    return {...live,...readyLive,autoReady:plan.autoReady,readyReady:!!readyController&&auditReady&&!healthError&&state?.readySupported===true,ready:!matchSyncPending&&!!controller&&auditReady&&!healthError&&randomAvailable&&loadedVersion===BUILD_VERSION,version:BUILD_VERSION,phase:state?.match?.public?.phase || '',round:state?.match?.public?.round,funds:state?.match?.private?.funds,
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
      controller=createAutoController({read:transport.read,subscribe:transport.subscribe,buy:transport.buy,buyItem:transport.buyItem,sell:transport.sell,refresh:transport.refresh,useCoin:transport.useCoin,useItem:transport.useItem,recency:recency.rank,reward:transport.reward,mergeReward:transport.mergeReward,acquireLock:transport.acquireLock,getPlan:()=>resolved().plan,chess,garrisons,gameItems,onRecordPurchase:recordItemCount,onStatus:status=>{live=status;label.textContent=status.running?'运行中':'工作台';emit();},onAudit:entry=>auditLog.append(entry)});
      readyController=createAutoReady({read:transport.read,
        getOptions:()=>({...plan.autoReady,epoch:plan.itemSession.epoch,confirmed:readySettingsStamp===JSON.stringify(plan.autoReady)}),
        available:()=>!closed&&uiReady&&auditReady&&!healthError&&!matchSyncPending&&chrome.runtime.getManifest().version===BUILD_VERSION,
        tradeBusy:()=>!!(controller?.busy||controller?.starting),
        handoff:()=>controller?.stop('自动准备条件已满足，停止倒转并等待准备'),
        acquireLock:transport.acquireLock,prepare:transport.prepare,
        async claim(key){const storageKey=`wei.ready.attempts.v1:${location.origin}`;const saved=(await chrome.storage.local.get(storageKey))[storageKey];
          if(saved!==undefined && (!Array.isArray(saved)||saved.some(x=>typeof x!=='string')))throw new Error('准备记录格式无效');
          const entries=saved||[];if(entries.includes(key))return false;await chrome.storage.local.set({[storageKey]:[...entries,key].slice(-128)});return true;},
        audit:(kind,summary)=>auditLog.append({kind,summary}),
        onStatus:value=>{readyLive=value;emit();}});
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

})();
