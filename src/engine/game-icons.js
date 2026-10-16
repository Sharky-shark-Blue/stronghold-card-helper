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

export function createGameIconIndex(manifest, baseUrl) {
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

export function operatorGameIcon(index, record) {
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

export function itemGameIcon(index, record) {
  return iconOwn(index?.items, record?.iconId) || iconOwn(index?.items, record?.trapId) || '';
}
