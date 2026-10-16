// Live catalogue builder ported from the reference extension. No game actions.
const isId = id => typeof id === 'string' && /^[A-Za-z0-9_:-]{1,80}$/.test(id);
export function buildCatalogue(chess, bonds) {
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
export function diySlotLabels(chess, { matchPicks = null, storedPicks = null, operators = null } = {}) {
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
export function withDiyLabels(catalogue, labels, bonds) {
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
