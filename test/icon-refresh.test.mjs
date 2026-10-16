import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIconList } from '../src/ui.js';

// 最小 DOM 接口替身：只验证缓存、节点身份及收养时机，不替代真实浏览器视觉验收。
function harness() {
  const active = {}, inert = {}, stats = { templates: 0, commits: 0, freshImages: 0, oldAdoptions: 0 };
  let next = [];
  const classes = (...initial) => {
    const names = new Set(initial);
    return { contains: name => names.has(name), toggle(name, on) { on ? names.add(name) : names.delete(name); return on; } };
  };
  function replaceWith(node) {
    const parent = this.parentElement;
    assert.ok(parent);
    if (node.parentElement) node.parentElement.child = null;
    if (node.kind === 'image' && node.ownerDocument === active && parent.ownerDocument === inert) stats.oldAdoptions++;
    parent.child = node; node.parentElement = parent; node.ownerDocument = parent.ownerDocument;
    this.parentElement = null;
  }
  function avatar(src, loaded, doc) {
    const box = { ownerDocument: doc, classList: classes(...(loaded ? ['has-game-icon'] : [])), child: null };
    const image = { kind: 'image', ownerDocument: doc, parentElement: box,
      classList: classes('game-icon', ...(loaded ? ['is-loaded'] : [])),
      getAttribute(name) { assert.equal(name, 'src'); return src; }, replaceWith };
    Object.defineProperty(image, 'src', { get: () => src, set() { throw new Error('不应重写已存在图片的 src'); } });
    box.child = image; return box;
  }
  const images = boxes => boxes.map(box => box.child).filter(node => node?.kind === 'image');
  const target = { ownerDocument: active, boxes: [], scrollTop: 73,
    querySelectorAll(selector) { assert.equal(selector, 'img.game-icon'); return images(this.boxes); },
    replaceChildren(fragment) {
      stats.commits++; this.boxes = fragment.boxes; this.scrollTop = 0;
      for (const box of this.boxes) {
        box.ownerDocument = active;
        if (box.child) { box.child.ownerDocument = active; if (box.child.kind === 'image') stats.freshImages++; }
      }
    } };
  inert.createComment = () => ({ kind: 'comment', ownerDocument: inert, parentElement: null, replaceWith });
  active.createElement = tag => {
    assert.equal(tag, 'template'); stats.templates++;
    const content = { ownerDocument: inert, boxes: next,
      querySelectorAll(selector) { assert.equal(selector, 'img.game-icon'); return images(this.boxes); } };
    return { content, set innerHTML(value) { assert.equal(typeof value, 'string'); } };
  };
  return { target, stats,
    seed(src, loaded = true) { const box = avatar(src, loaded, active); target.boxes.push(box); return box.child; },
    prepare(...sources) { next = sources.map(src => avatar(src, false, inert)); },
    images: () => images(target.boxes),
    render: (key, create = () => '<rows>') => renderIconList(target, key, create) };
}

test('内容未变的500次状态更新不再生成模板、重建图片或重置滚动', () => {
  const h = harness(); h.prepare('/avatar.png');
  assert.equal(h.render('same'), true);
  const image = h.images()[0];
  for (let i = 0; i < 500; i++) assert.equal(h.render('same', () => { throw new Error('无变化时不能重绘'); }), false);
  assert.equal(h.images()[0], image);
  assert.deepEqual(h.stats, { templates: 1, commits: 1, freshImages: 1, oldAdoptions: 0 });
  assert.equal(h.target.scrollTop, 73);
});

test('计数等行内容变化时仍复用原头像和已加载状态，不把旧图移入惰性文档', () => {
  const h = harness(), image = h.seed('/avatar.png');
  for (let i = 0; i < 100; i++) { h.prepare('/avatar.png'); assert.equal(h.render('counter-' + i), true); assert.equal(h.images()[0], image); }
  assert.equal(h.stats.commits, 100); assert.equal(h.stats.freshImages, 0); assert.equal(h.stats.oldAdoptions, 0);
  assert.ok(image.classList.contains('is-loaded'));
  assert.ok(image.parentElement.classList.contains('has-game-icon'));
  assert.equal(h.target.scrollTop, 73);
});

test('加载中的图片保持同一节点，不重写 src，也不伪装为已加载', () => {
  const h = harness(), image = h.seed('/pending.png', false); h.prepare('/pending.png'); h.render('pending');
  assert.equal(h.images()[0], image);
  assert.equal(image.parentElement.classList.contains('has-game-icon'), false);
  assert.equal(h.stats.freshImages, 0); assert.equal(h.stats.oldAdoptions, 0);
});

test('同一头像出现在多行时逐个复用，新增行不会抢走已有图片', () => {
  const h = harness(), first = h.seed('/same.png'), second = h.seed('/same.png');
  h.prepare('/same.png', '/same.png', '/same.png'); h.render('duplicates');
  assert.equal(h.images()[0], first); assert.equal(h.images()[1], second);
  assert.equal(new Set(h.images()).size, 3); assert.equal(h.stats.freshImages, 1);
});

test('头像来源确实变化时加载新图，不继续展示旧干员', () => {
  const h = harness(), old = h.seed('/old.png'); h.prepare('/new.png'); h.render('new-source');
  assert.notEqual(h.images()[0], old); assert.equal(h.images()[0].src, '/new.png');
  assert.equal(h.stats.freshImages, 1); assert.equal(h.images()[0].classList.contains('is-loaded'), false);
});

test('筛选、排序和移除条目后，剩余图标按 URL 复用并保持正确顺序', () => {
  const h = harness(), a = h.seed('/a.png'), b = h.seed('/b.png'); h.seed('/removed.png');
  h.prepare('/b.png', '/a.png'); h.render('filtered');
  assert.deepEqual(h.images(), [b, a]); assert.equal(h.stats.freshImages, 0);
});

test('空列表同样缓存，不重复构建空态', () => {
  const h = harness(); h.prepare(); assert.equal(h.render('empty'), true);
  assert.equal(h.render('empty', () => { throw new Error('重复空态'); }), false);
  assert.equal(h.images().length, 0); assert.equal(h.stats.commits, 1);
});

test('生成失败不破坏原节点或提交缓存，下次仍可正常重试', () => {
  const h = harness(), image = h.seed('/a.png'); h.prepare('/a.png');
  assert.throws(() => h.render('retry', () => { throw new Error('fixture'); }), /fixture/);
  assert.equal(h.images()[0], image); assert.equal(h.stats.commits, 0);
  assert.equal(h.render('retry'), true); assert.equal(h.images()[0], image);
});

test('四类列表的缓存按容器隔离，相同 key 不会互相阻断', () => {
  const lists = Array.from({ length: 4 }, () => harness());
  for (const h of lists) { h.prepare('/shared.png'); assert.equal(h.render('same-key'), true); }
  assert.equal(new Set(lists.map(h => h.images()[0])).size, 4);
  for (const h of lists) assert.equal(h.render('same-key', () => { throw new Error('重复渲染'); }), false);
});
