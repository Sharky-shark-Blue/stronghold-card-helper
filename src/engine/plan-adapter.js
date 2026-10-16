// Bridge the existing schema-3 UI plan to real IDs from this server only.
import * as Model from '../model.js';
import { ITEM_CATALOGUE } from './items.js';
import { buildCatalogue } from './catalogue.js';
import { baseId } from './auto-policy.js';
import { itemMergeRule, itemUseRule } from './item-policy.js';
const gameNameKey = value => String(value || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
const ITEM_NAMES = new Set(ITEM_CATALOGUE.map(x => gameNameKey(x.name)));
const ITEM_BY_ID = new Map(ITEM_CATALOGUE.map(item => [item.id, item]));
// Only the game's item data may identify a hand-entered item. Never treat a local
// placeholder ID, a fuzzy match or a guessed suffix as a real trading ID.
export function gameItemIndex(raw) {
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
export function resolveGamePlan(raw, chess, bonds = {}, gameItems = null, diy = null) {
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
export function tradePlanKey(raw) {
  const p = Model.normalizePlan(raw);
  // Confirmed purchase counters are not configuration edits. Manual or detected
  // next matches advance epoch and stop a live run before resetting counters.
  return JSON.stringify({buy:p.buy,keep:p.keep,disabled:p.disabled,customOperators:p.customOperators,
    itemBuyingPaused:p.itemBuyingPaused===true,keepRules:p.keepRules,items:p.items.filter(item=>item.enabled).map(({id,limit,minFunds,ownedTarget})=>({id,limit,minFunds,ownedTarget})),
    autoUse:p.items.filter(item=>item.autoUse===true).map(item=>item.id),
    epoch:p.itemSession.epoch});
}

export function isLiveItemToggle(before, after, id) {
  const a=Model.normalizePlan(before), b=Model.normalizePlan(after);
  const old=a.items.find(item=>item.id===id), next=b.items.find(item=>item.id===id);
  if(!old || !next || old.enabled===next.enabled || old.capPaused || next.capPaused) return false;
  const mask=plan=>({...plan,itemSession:{...plan.itemSession,used:{}},items:plan.items.map(item=>item.id===id ? {...item,enabled:false} : item)});
  return JSON.stringify(mask(a))===JSON.stringify(mask(b));
}

export function isLiveItemPause(before, after) {
  const a=Model.normalizePlan(before),b=Model.normalizePlan(after);
  if((a.itemBuyingPaused===true)===(b.itemBuyingPaused===true))return false;
  const mask=plan=>{const {itemBuyingPaused,...rest}=plan;return {...rest,itemSession:{...rest.itemSession,used:{}}};};
  return JSON.stringify(mask(a))===JSON.stringify(mask(b));
}
