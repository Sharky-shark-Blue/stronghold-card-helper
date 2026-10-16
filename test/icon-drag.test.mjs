import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('图标排序以指针阈值启动，不再依赖浏览器默认 HTML 原生拖放',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(ui,/function iconPointerDown/);assert.match(ui,/function iconPointerMove/);assert.match(ui,/function iconPointerUp/);
 assert.match(ui,/distance >= 5/);assert.match(ui,/state\.pressTimer = setTimeout\(\(\) => beginPointerIconDrag\(state\),180\)/);
 assert.doesNotMatch(ui,/setData\('text\/plain'/);assert.doesNotMatch(ui,/root\.addEventListener\('dragstart'/);
});
test('排序预览用原头像浮层和占位格，FLIP动画只动邻近图标并最终释放样式',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(ui,/const placeholder = root\.ownerDocument\.createElement\('div'\)/);
 assert.match(ui,/list\.replaceChild\(placeholder,source\)/);assert.match(ui,/root\.append\(source\)/);
 assert.doesNotMatch(ui,/root\.ownerDocument\.body\.append\(source\)/);
 assert.match(ui,/source\.style\.setProperty\('--operator-icon-size'/);
 assert.match(ui,/function animatePlaceholder/);assert.match(ui,/transition = 'transform 140ms/);
 assert.match(ui,/function cleanupFlip/);assert.match(ui,/placeholder\.replaceWith\(state\.source\)/);
});
test('触控垂直滑动转为列表滚动，拖到列表边缘会自动滚动',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(ui,/Math\.abs\(dy\) > Math\.abs\(dx\) \* 1\.1/);assert.match(ui,/state\.scroller\.scrollTop \+= state\.lastY - event\.clientY/);
 assert.match(ui,/function autoScrollIconDrag/);assert.match(ui,/scrollVelocity\(state\)/);assert.match(ui,/requestAnimationFrame\(tick\)/);
 const css=fs.readFileSync(new URL('../styles/icons.css',import.meta.url),'utf8');assert.match(css,/touch-action:none/);
});
test('拖动期间隔离点击、右键仍由既有菜单事件处理，pointer capture 在取消时释放',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(ui,/ignoreIconClickUntil = performance\.now\(\) \+ 400/);assert.match(ui,/function contextmenu\(event\)/);
  assert.match(ui,/ignoreIconClickUntil = 0/); // A fresh intentional pointer gesture cancels the post-drag click guard.
 assert.match(ui,/root\.setPointerCapture\(event\.pointerId\)/);assert.match(ui,/root\.releasePointerCapture\(state\.pointerId\)/);
 const up=ui.slice(ui.indexOf('function iconPointerUp'),ui.indexOf('function iconPointerCancel'));assert.match(up,/samePoint && state.targetId !== state.id/);assert.match(up,/state.after/);
 assert.match(ui,/function iconPointerCancel/);assert.match(ui,/function finishIconDrag/);
});
test('旧头像、输入焦点与用户减少动态效果偏好均保留',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(ui,/state\.source\.style\.cssText = state\.sourceStyle/);
 assert.match(ui,/renderIconList\(rows/);assert.match(ui,/preventScroll: true/);
  assert.match(ui,/state\.source\.classList\.remove\('is-dragging','is-drag-ghost'\)/);
 const css=fs.readFileSync(new URL('../styles/icons.css',import.meta.url),'utf8');
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/user-select:none/);
});
