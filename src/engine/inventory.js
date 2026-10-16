// 只读库存快照；交易和界面共用。普通干员计1，精二计3，跨区域用 UID 核对。
export function operatorBaseId(id, chess) {
  if (typeof id !== 'string' || !chess?.[id]) return null;
  const rec = chess[id];
  return typeof rec.baseId === 'string' && chess[rec.baseId] ? rec.baseId : id;
}

export function inspectInventory(priv, chess) {
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
export function countItemCopies(inventory, ids, excludeAreas = []) {
  if (!inventory?.ok || !Array.isArray(inventory.items)) return null;
  const values = ids instanceof Set ? [...ids] : Array.isArray(ids) ? ids : [ids];
  const accepted = new Set(values.filter(id => typeof id === 'string' && id.length > 0));
  if (!accepted.size) return null;
  const excluded = excludeAreas instanceof Set ? excludeAreas : new Set(Array.isArray(excludeAreas) ? excludeAreas : []);
  return inventory.items.reduce((count, item) => count + (accepted.has(item?.id) && !excluded.has(item?.area) ? 1 : 0), 0);
}

// Map tracked IDs to their verified server IDs, count live UIDs, and fold item upgrade variants.
export function countTrackedItemCopies(inventory, items, matches = {}, knownIds = [], gameItems = null) {
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
