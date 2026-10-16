import { GRID_MAX_CELLS, normalizeIconGrid, placeIconGrid } from './icon-grid.js';
// Pure plan model. No function in this module reads a live match or sends game commands.
import { ITEM_CATALOGUE } from './engine/items.js';
export const STORAGE_KEY = 'wei.workbench.plan.v1';
export const KINDS = ['buy', 'keep'];
export const MAX_ICON_GRID_CELLS = GRID_MAX_CELLS;
export const MAX_MANUAL_NAME_LENGTH = 40;
export const ITEMS = ITEM_CATALOGUE;
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

export function normalizePlan(raw) {
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

export function allOperators(catalogue, plan) {
  // Local placeholders never claim to have a game chessId, charId, tier or bond.
  const custom = (plan.customOperators || []).map(rec => ({
    id: rec.id, name: rec.name, charId: '', tier: 0, bonds: [], bondNames: [],
    buyable: true, hidden: false, diy: false, custom: true,
  }));
  return [...catalogue.operators, ...custom];
}

export function addNamedOperator(catalogue, plan, input, newId, type = plan.active) {
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

export function filterOperators(catalogue, plan, type = plan.active) {
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

export function updateFilter(plan, patch, type = plan.active) {
  const kind = kindOf(type);
  return { ...plan, filters: { ...plan.filters, [kind]: filter({ ...plan.filters[kind], ...patch }) } };
}

export function addedOperators(catalogue, plan, type = plan.active) {
  const kind = kindOf(type);
  const visible = new Map(filterOperators(catalogue, updateFilter(plan, { selectedOnly: true }, kind), kind).map(op => [op.id, op]));
  return plan[kind].map(id => visible.get(id)).filter(Boolean);
}

export function candidateOperators(catalogue, plan, pickerFilter, type = plan.active) {
  const kind = kindOf(type);
  // The dialog has independent, temporary filters; main-list searches never hide candidates.
  const transient = { ...plan, filters: { ...plan.filters, [kind]: filter({ ...pickerFilter, selectedOnly: false, enabledOnly: false }) } };
  return filterOperators(catalogue, transient, kind);
}

export function addOperator(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id) || plan[kind].includes(id)) return plan;
  return { ...plan, [kind]: ids([...plan[kind], id]) };
}

export function removeOperator(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return { plan, reason: 'invalid' };
  if (plan.locks[kind].includes(id)) return { plan, reason: 'locked' };
  return { plan: normalizePlan({ ...plan, [kind]: plan[kind].filter(value => value !== id),
    disabled: { ...plan.disabled, [kind]: (plan.disabled?.[kind] || []).filter(value => value !== id) } }), reason: '' };
}

export function toggleDisabled(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id) || !plan[kind].includes(id)) return { plan, reason: 'missing' };
  const disabled = new Set(plan.disabled?.[kind] || []);
  const enabling = disabled.has(id);
  enabling ? disabled.delete(id) : disabled.add(id);
  return { plan: normalizePlan({ ...plan, disabled: { ...plan.disabled, [kind]: [...disabled] } }), reason: '' };
}

export function toggleSelection(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return { plan, reason: 'invalid' };
  return plan[kind].includes(id) ? removeOperator(plan, id, kind) : { plan: addOperator(plan, id, kind), reason: '' };
}

export function toggleLock(plan, id, type = plan.active) {
  const kind = kindOf(type);
  if (!validId(id)) return plan;
  const locked = new Set(plan.locks[kind]), selected = new Set(plan[kind]);
  if (locked.has(id)) locked.delete(id);
  else { locked.add(id); selected.add(id); }
  return { ...plan, [kind]: [...selected], locks: { ...plan.locks, [kind]: [...locked] } };
}

export function clearUnlocked(plan, type = plan.active) {
  const kind = kindOf(type), retained = [...plan.locks[kind]];
  return normalizePlan({ ...plan, [kind]: retained,
    disabled: { ...plan.disabled, [kind]: (plan.disabled?.[kind] || []).filter(id => retained.includes(id)) } });
}

export function selectVisible(plan, visible, type = plan.active) {
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
export function moveIconOperator(plan, sourceId, targetId, after = false, type = plan.active) {
  if (!KINDS.includes(type)) return plan;
  const normalized = normalizePlan(plan), next = movedIconOrder(normalized.iconOrder[type], sourceId, targetId, after);
  if(!next)return plan;
  let index=0;
  const slots=normalized.iconSlots[type].map(id=>id===null ? null : next[index++]);
  return {...normalized,iconOrder:{...normalized.iconOrder,[type]:next},iconSlots:{...normalized.iconSlots,[type]:slots}};
}
export function moveItemIcon(plan, sourceId, targetId, after = false) {
  const normalized = normalizePlan(plan), next = movedIconOrder(normalized.itemIconOrder, sourceId, targetId, after);
  if(!next)return plan;
  let index=0;
  return {...normalized,itemIconOrder:next,itemIconSlots:normalized.itemIconSlots.map(id=>id===null ? null : next[index++])};
}

export function iconGridSlots(plan, kind=plan.active) {
  return kind==='items' ? plan.itemIconSlots : plan.iconSlots?.[kind] || [];
}
export function previewIconGrid(slots, sourceId, cell) {
  return placeIconGrid(slots,sourceId,cell);
}
export function moveIconToCell(plan, sourceId, cell, kind=plan.active) {
  if(kind!=='items' && !KINDS.includes(kind))return plan;
  const normalized=normalizePlan(plan), slots=placeIconGrid(iconGridSlots(normalized,kind),sourceId,cell);
  if(!slots)return plan;
  return kind==='items' ? {...normalized,itemIconSlots:slots,itemIconOrder:slots.filter(Boolean)} :
    {...normalized,iconSlots:{...normalized.iconSlots,[kind]:slots},iconOrder:{...normalized.iconOrder,[kind]:slots.filter(Boolean)}};
}

export function examplePlan(catalogue) {
  const buy = catalogue.operators.filter(op => op.buyable).slice(0, 8).map(op => op.id);
  const keep = catalogue.operators.filter(op => op.tier >= 4 && op.buyable).slice(0, 4).map(op => op.id);
  return normalizePlan({ buy, keep, locks: { buy: buy.slice(0, 2), keep: keep.slice(0, 1) } });
}

// New items are always disarmed; enabling is a separate, explicit user action.
export function addItem(plan, id) {
  if (!ITEM_BY_ID.has(id) || plan.items.some(x => x.id === id)) return { plan, changed: false };
  if (plan.items.length >= MAX_SAVED_ITEMS) return { plan, changed: false, reason: 'capacity' };
  return { plan: { ...plan, items: [...plan.items, { id, limit: null, enabled: false, minFunds: null }] }, changed: true };
}
export function addNamedItem(plan, input, id) {
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
export function setItemEnabled(plan, id, enabled) {
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
export function toggleItemEnabled(plan, id) {
  const item = plan.items.find(x => x.id === id);
  return item ? setItemEnabled(plan, id, !item.enabled) : { plan, changed: false };
}
// 自动使用: while a run is active, consumables of this item lying in hand/temp are equipped onto the
// most recently obtained operator (board first, then hand) that still has a free equipment slot.
export function setItemAutoUse(plan, id, on) {
  const item = plan.items.find(x => x.id === id);
  if (!item || (item.autoUse === true) === (on === true)) return { plan, changed: false };
  return { plan: { ...plan, items: plan.items.map(x => {
    if (x.id !== id) return x;
    const { autoUse, ...rest } = x;
    return on === true ? { ...rest, autoUse: true } : rest;
  }) }, changed: true };
}
export const itemCapReached = (plan, item) => item.limit != null && (plan.itemSession?.used?.[item.id] || 0) >= item.limit;
export function setItemOwnedTarget(plan, id, value) {
  if (value !== null && optionalLimit(value) === null) throw new Error('道具持有目标须为 1–99 或留空');
  const item = plan.items.find(x => x.id === id);
  if (!item || (item.ownedTarget ?? null) === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, items: plan.items.map(x => x.id === id ? { ...x, ownedTarget: value } : x) }), changed: true };
}
// Only complete online snapshots establish a baseline. Reconnects and ordinary rounds never reset.
export function observeItemMatch(plan, state, server = '') {
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
export function setItemMinFunds(plan, id, value) {
  if (value !== null && !validFunds(value)) throw new Error('购买前资金门槛必须是 0–999999999 的整数或留空');
  const item = plan.items.find(x => x.id === id);
  if (!item || item.minFunds === value) return { plan, changed: false };
  return { plan: { ...plan, items: plan.items.map(x => x.id === id ? { ...x, minFunds: value } : x) }, changed: true };
}
export function setKeepLimit(plan, id, value) {
  if (value !== null && optionalLimit(value) === null) throw new Error('保留干员持有目标必须是 1–99 的整数或留空');
  if (!plan.keep.includes(id) || plan.keepRules?.[id]?.limit === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, keepRules: { ...plan.keepRules, [id]: { ...plan.keepRules?.[id], limit: value } } }), changed: true };
}
export function setKeepMinFunds(plan, id, value) {
  if (value !== null && !validFunds(value)) throw new Error('购买前资金门槛必须是 0–999999999 的整数或留空');
  if (!plan.keep.includes(id) || plan.keepRules?.[id]?.minFunds === value) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, keepRules: { ...plan.keepRules, [id]: { ...plan.keepRules?.[id], minFunds: value } } }), changed: true };
}
export function setItemLimit(plan, id, limit) {
  if (limit !== null && optionalLimit(limit) === null) throw new Error('道具抓取上限必须是 1–99 的整数或留空（不限）');
  const item = plan.items.find(x => x.id === id);
  if (!item || item.limit === limit) return { plan, changed: false };
  return { plan: normalizePlan({ ...plan, items: plan.items.map(x => x.id === id ? { ...x, limit } : x) }), changed: true };
}
export function recordItemPurchase(plan, id, delta) {
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
export function confirmPurchaseCount(plan, kind, id, epoch, count) {
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
export function nextItemMatch(plan) {
  if (plan.itemSession.epoch >= Number.MAX_SAFE_INTEGER) return { plan, changed: false };
  const items = plan.items.map(item => {
    if (item.capPaused !== true) return item;
    const { capPaused, ...rest } = item;
    return { ...rest, enabled: true };
  });
  return { plan: normalizePlan({ ...plan, items, itemSession: { ...plan.itemSession, used: {}, epoch: plan.itemSession.epoch + 1 } }), changed: true };
}
export function removeItem(plan, id) {
  if (!plan.items.some(x => x.id === id)) return { plan, changed: false };
  const counts = { ...plan.itemSession.used }; delete counts[id];
  return { plan: { ...plan, items: plan.items.filter(x => x.id !== id), itemSession: { ...plan.itemSession, used: counts } }, changed: true };
}

// ---- 启停快捷键 (start/stop hotkey) -------------------------------------
// Stored by physical key (event.code) so it does not depend on IME or keyboard layout.
export const DEFAULT_HOTKEY = Object.freeze({ code: 'F8', ctrl: false, alt: false, shift: false });
const HOTKEY_CODE = /^(?:F(?:[1-9]|1[0-2])|Key[A-Z]|Digit[0-9]|Numpad[0-9]|Pause|ScrollLock|Insert|Home|End|PageUp|PageDown|Backquote|Minus|Equal|BracketLeft|BracketRight|Backslash|Semicolon|Quote|Comma|Period|Slash)$/;
const HOTKEY_BARE_OK = new Set(['F2', 'F4', 'F8', 'F9', 'Pause', 'ScrollLock', 'Insert']);
const HOTKEY_CTRL_TAKEN = new Set([...'ACDEFGHJKLNOPQRSTUVWXYZ'].map(c => 'Key' + c));
const HOTKEY_CTRL_SHIFT_TAKEN = new Set([...'ABCIJMNOQRTW'].map(c => 'Key' + c));
const HOTKEY_KEY_NAMES = { Backquote: '`', Minus: '-', Equal: '=', BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';',
  Quote: "'", Comma: ',', Period: '.', Slash: '/', ScrollLock: 'ScrLk', PageUp: 'PgUp', PageDown: 'PgDn', Insert: 'Ins' };
export function hotkeyFromEvent(event) {
  return { code: String(event?.code || ''), ctrl: !!event?.ctrlKey, alt: !!event?.altKey, shift: !!event?.shiftKey, meta: !!event?.metaKey };
}
export function hotkeyLabel(hotkey) {
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
export const GAME_DEFAULT_KEYS = Object.freeze({ refresh: 'KeyR', freeze: 'KeyF', levelUp: 'KeyD', retreat: 'KeyQ', sell: 'KeyX', ready: 'Space' });
const GAME_KEY_NAMES = { refresh: '刷新商店', freeze: '冻结商店', levelUp: '升级调度中心', retreat: '撤退干员', sell: '出售干员', ready: '准备就绪' };
export function normalizeGameKeys(raw) {
  const keys = { ...GAME_DEFAULT_KEYS };
  if (raw && typeof raw === 'object') for (const action of Object.keys(GAME_KEY_NAMES))
    if (typeof raw[action] === 'string' && /^[A-Za-z0-9]{1,20}$/.test(raw[action])) keys[action] = raw[action];
  return keys;
}
export function gameHotkeyConflict(hotkey, gameKeys = GAME_DEFAULT_KEYS) {
  if (!hotkey || !gameKeys || hotkey.ctrl || hotkey.alt || hotkey.meta) return '';
  const action = Object.keys(GAME_KEY_NAMES).find(name => gameKeys[name] === hotkey.code);
  return action ? GAME_KEY_NAMES[action] : '';
}
// '' when usable; otherwise a short Chinese reason. Pass gameKeys to also reject the game's own shortcut keys.
export function hotkeyProblem(hotkey, gameKeys = null) {
  const base = baseHotkeyProblem(hotkey);
  if (base) return base;
  const clash = gameHotkeyConflict(hotkey, gameKeys);
  return clash ? `与游戏快捷键「${clash}」冲突（也可在游戏「设置 → 快捷键」里改键）` : '';
}
// A letter without Ctrl / Alt types text: such a hotkey never fires while a text field has the focus.
export const hotkeyIsTyping = hotkey => !!hotkey && !hotkey.ctrl && !hotkey.alt && /^Key[A-Z]$/.test(hotkey.code);
export function normalizeHotkey(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const hotkey = { code: String(raw.code || ''), ctrl: raw.ctrl === true, alt: raw.alt === true, shift: raw.shift === true };
  return hotkeyProblem(hotkey) ? null : hotkey;
}
export function matchesHotkey(hotkey, event) {
  return !!hotkey && !!event && event.code === hotkey.code && !event.metaKey
    && !!event.ctrlKey === !!hotkey.ctrl && !!event.altKey === !!hotkey.alt && !!event.shiftKey === !!hotkey.shift;
}

// ---- 配置文件导入 / 导出 ----
// 导出全部配置（名单、禁用与锁定、保留规则、道具、自编干员、快捷键与界面设置）；
// 道具本局累计次数、启停状态不导出；干员实时持有量不存入方案。导入保留当前道具次数。
export const CONFIG_FORMAT = 'wei-cardkeeper-config';
export const CONFIG_VERSION = 1;
export const MAX_CONFIG_CHARS = 1048576;
export function exportConfig(plan, meta = {}) {
  const { itemSession, draftEnabled, itemsView, itemBuyingPaused, ...config } = normalizePlan(plan);
  // Export the user's enable preference, never a transient per-match pause.
  config.items = config.items.map(({ capPaused, ...item }) => capPaused === true ? { ...item, enabled: true } : item);
  return { format: CONFIG_FORMAT, version: CONFIG_VERSION, exportedAt: typeof meta.now === 'string' ? meta.now : new Date().toISOString(),
    app: typeof meta.app === 'string' ? meta.app.slice(0, 40) : '', plan: config };
}
export function importConfig(input, current) {
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
