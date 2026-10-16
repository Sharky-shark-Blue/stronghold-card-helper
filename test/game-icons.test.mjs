import test from 'node:test';
import assert from 'node:assert/strict';
import { createGameIconIndex, operatorGameIcon, itemGameIcon } from '../src/engine/game-icons.js';

const root = 'https://game.example/play/';
const manifest = {
  chars: {
    char_a: { avatar: '/assets/~a/char/avatar/a.png', avatarE2: '/assets/~b/char/avatar/a_2.png', spine: { ignored: true } },
    char_b: { avatar: 'assets/b.webp' },
  },
  items: { trap_a: '/assets/~c/item/a.png', trap_b: '/assets/item/b.png' },
};

test('按当前服务器解析真实清单，只保留头像与道具所需字段', () => {
  const icons = createGameIconIndex(manifest, root);
  assert.equal(operatorGameIcon(icons, { charId: 'char_a' }), 'https://game.example/assets/~a/char/avatar/a.png');
  assert.equal(operatorGameIcon(icons, { charId: 'char_b' }), 'https://game.example/play/assets/b.webp');
  assert.deepEqual(Object.keys(icons.chars.char_a).sort(), ['avatar', 'avatarE2']);
  assert.equal(icons.chars.char_a.spine, undefined);
});

test('与游戏一致：assets.avatar 优先，精二映射回退到基础头像', () => {
  const icons = createGameIconIndex(manifest, root);
  assert.equal(operatorGameIcon(icons, { charId: 'char_b', assets: { avatar: 'char_a' } }), icons.chars.char_a.avatar);
  assert.equal(operatorGameIcon(icons, { charId: 'char_a', assets: { avatar: 'char_a_2' } }), icons.chars.char_a.avatarE2);
  assert.equal(operatorGameIcon(icons, { charId: 'char_b', assets: { avatar: 'char_b_2' } }), icons.chars.char_b.avatar);
  assert.equal(operatorGameIcon(icons, { charId: 'char_b', assets: { avatar: 'missing' } }), icons.chars.char_b.avatar);
});

test('自选头像跟随实际干员，空槽位不显示底板或上一次的头像', () => {
  const icons = createGameIconIndex(manifest, root);
  assert.equal(operatorGameIcon(icons, { diy: true, charId: 'char_a', diyCharId: 'char_b' }), icons.chars.char_b.avatar);
  assert.equal(operatorGameIcon(icons, { diy: true, charId: 'char_a', diyCharId: '' }), '');
  assert.equal(operatorGameIcon(icons, { isDiy: true, charId: 'char_a' }), '');
});

test('道具使用 iconId / trapId，而不是拿 chess_item ID 猜文件名', () => {
  const icons = createGameIconIndex(manifest, root);
  assert.equal(itemGameIcon(icons, { id: 'chess_item_a', iconId: 'trap_a', trapId: 'trap_b' }), icons.items.trap_a);
  assert.equal(itemGameIcon(icons, { iconId: 'missing', trapId: 'trap_b' }), icons.items.trap_b);
  assert.equal(itemGameIcon(icons, { id: 'trap_a' }), '');
});

test('不同服务器与不同端口分别解析，不写死公共服地址', () => {
  const icons = createGameIconIndex(manifest, 'http://local-game.example:4000/sub/');
  assert.equal(icons.chars.char_a.avatar, 'http://local-game.example:4000/assets/~a/char/avatar/a.png');
  assert.equal(icons.chars.char_b.avatar, 'http://local-game.example:4000/sub/assets/b.webp');
});

test('拒绝外站、凭据、脚本与非图片路径', () => {
  const unsafe = ['javascript:alert(1)', 'data:image/svg+xml,x', 'file:///x.png', 'blob:https://game.example/id',
    'https://other.example/a.png', '//other.example/a.png', 'https://game.example:444/a.png',
    'https://name:password@game.example/a.png', '/api/action', '/assets/not-image.js', '/assets/' + 'a'.repeat(2050) + '.png'];
  for (const url of unsafe) {
    const icons = createGameIconIndex({ chars: { char_a: { avatar: url } }, items: { trap_a: url } }, root);
    assert.equal(operatorGameIcon(icons, { charId: 'char_a' }), '', url);
    assert.equal(itemGameIcon(icons, { iconId: 'trap_a' }), '', url);
  }
});

test('清单缺失、字段损坏和未知记录安全回退', () => {
  for (const value of [null, undefined, {}, { chars: [], items: [] }, { chars: { char_a: 'bad' }, items: { trap_a: {} } }]) {
    const icons = createGameIconIndex(value, root);
    assert.equal(operatorGameIcon(icons, null), '');
    assert.equal(operatorGameIcon(icons, { charId: 'missing' }), '');
    assert.equal(itemGameIcon(icons, null), '');
  }
  for (const base of ['', undefined, 'file:///project/', 'javascript:alert(1)', 'https://name:password@game.example/']) {
    assert.equal(operatorGameIcon(createGameIconIndex(manifest, base), { charId: 'char_a' }), '');
  }
});

test('仅使用自身属性，阻止原型继承伪装素材', () => {
  const icons = createGameIconIndex({ chars: Object.create({ char_a: manifest.chars.char_a }), items: Object.create({ trap_a: '/a.png' }) }, root);
  assert.equal(operatorGameIcon(icons, { charId: 'char_a' }), '');
  assert.equal(itemGameIcon({ items: Object.create({ trap_a: 'https://game.example/a.png' }) }, { iconId: 'trap_a' }), '');
  assert.equal(Object.getPrototypeOf(icons.chars), null);
  assert.equal(Object.getPrototypeOf(icons.items), null);
});

test('每类清单有明确数量边界，保留图片查询参数并移除片段', () => {
  const chars = Object.fromEntries(Array.from({ length: 4100 }, (_, i) => ['char_' + i, { avatar: '/a.png?v=2#ignored' }]));
  const icons = createGameIconIndex({ chars }, root);
  assert.equal(Object.keys(icons.chars).length, 4096);
  assert.equal(icons.chars.char_0.avatar, 'https://game.example/a.png?v=2');
});
