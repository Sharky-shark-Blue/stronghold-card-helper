import test from 'node:test';
import assert from 'node:assert/strict';
import * as Model from '../src/model.js';

const key = (code, mods = {}) => ({ code, ctrlKey: !!mods.ctrl, altKey: !!mods.alt, shiftKey: !!mods.shift, metaKey: !!mods.meta });

test('hotkey defaults to F8, survives normalize, and can be switched off', () => {
  assert.deepEqual(Model.normalizePlan(null).hotkey, { code: 'F8', ctrl: false, alt: false, shift: false });
  assert.equal(Model.normalizePlan({ hotkey: null }).hotkey, null);
  assert.deepEqual(Model.normalizePlan({ hotkey: { code: 'KeyS', alt: true } }).hotkey, { code: 'KeyS', ctrl: false, alt: true, shift: false });
  // Invalid or browser-reserved stored values fall back to the default instead of leaving a dead key.
  assert.deepEqual(Model.normalizePlan({ hotkey: { code: 'F5' } }).hotkey, Model.normalizePlan(null).hotkey);
  assert.deepEqual(Model.normalizePlan({ hotkey: 'F8' }).hotkey, Model.normalizePlan(null).hotkey);
});

test('hotkey validation rejects typing keys and browser shortcuts', () => {
  for (const ok of [{ code: 'KeyA' }, { code: 'KeyR' }, { code: 'KeyG', shift: true }, { code: 'F8' }, { code: 'F9' }, { code: 'Pause' }, { code: 'KeyS', alt: true }, { code: 'KeyB', ctrl: true }, { code: 'F9', shift: true }, { code: 'KeyQ', ctrl: true, alt: true }])
    assert.equal(Model.hotkeyProblem(ok), '', Model.hotkeyLabel(ok));
  for (const bad of [{ code: 'KeyN' }, { code: 'Digit1' }, { code: 'Space' }, { code: 'F5' }, { code: 'F12' }, { code: 'F3' }, { code: 'KeyW', ctrl: true }, { code: 'KeyT', ctrl: true, shift: true },
    { code: 'Digit2', ctrl: true }, { code: 'F4', alt: true }, { code: 'KeyD', alt: true }, { code: 'F8', meta: true }, { code: 'Enter' }, { code: '' }])
    assert.notEqual(Model.hotkeyProblem(bad), '', Model.hotkeyLabel(bad));
});

test('hotkey matching requires the exact modifier set', () => {
  const f8 = Model.normalizePlan(null).hotkey, altS = { code: 'KeyS', ctrl: false, alt: true, shift: false };
  assert.equal(Model.matchesHotkey(f8, key('F8')), true);
  assert.equal(Model.matchesHotkey(f8, key('F8', { shift: true })), false);
  assert.equal(Model.matchesHotkey(f8, key('F8', { meta: true })), false);
  assert.equal(Model.matchesHotkey(altS, key('KeyS', { alt: true })), true);
  assert.equal(Model.matchesHotkey(altS, key('KeyS')), false);
  assert.equal(Model.matchesHotkey(null, key('F8')), false);
  assert.deepEqual(Model.hotkeyFromEvent(key('KeyS', { alt: true })), { code: 'KeyS', ctrl: false, alt: true, shift: false, meta: false });
});

test('hotkey labels are readable', () => {
  assert.equal(Model.hotkeyLabel({ code: 'F8' }), 'F8');
  assert.equal(Model.hotkeyLabel({ code: 'KeyS', ctrl: true, shift: true }), 'Ctrl+Shift+S');
  assert.equal(Model.hotkeyLabel({ code: 'Numpad5', alt: true }), 'Alt+小键盘5');
  assert.equal(Model.hotkeyLabel(null), '未设置');
});

test('hotkey is a UI preference, not a trading-plan change', async () => {
  const { tradePlanKey } = await import('../src/engine/plan-adapter.js');
  const base = Model.normalizePlan(null);
  assert.equal(tradePlanKey(base), tradePlanKey({ ...base, hotkey: { code: 'KeyS', alt: true } }));
  assert.equal(tradePlanKey(base), tradePlanKey({ ...base, hotkey: null }));
});

test('single letters: typing guard and game shortcut conflicts', () => {
  assert.equal(Model.hotkeyIsTyping({ code: 'KeyG', ctrl: false, alt: false, shift: false }), true);
  assert.equal(Model.hotkeyIsTyping({ code: 'KeyG', ctrl: false, alt: false, shift: true }), true);
  assert.equal(Model.hotkeyIsTyping({ code: 'KeyG', ctrl: false, alt: true, shift: false }), false);
  assert.equal(Model.hotkeyIsTyping({ code: 'F8', ctrl: false, alt: false, shift: false }), false);
  const game = Model.GAME_DEFAULT_KEYS;
  assert.match(Model.hotkeyProblem({ code: 'KeyR' }, game), /刷新商店/);
  assert.match(Model.hotkeyProblem({ code: 'KeyX', shift: true }, game), /出售干员/); // the game ignores Shift
  assert.equal(Model.hotkeyProblem({ code: 'KeyR', alt: true }, game), ''); // the game ignores Ctrl / Alt presses
  assert.equal(Model.hotkeyProblem({ code: 'KeyG' }, game), '');
  // The player's own rebinding (sp.pref.settings.keys) is what counts.
  const rebound = Model.normalizeGameKeys({ refresh: 'KeyG', bogus: 'KeyZ', sell: 'x y' });
  assert.deepEqual(rebound, { ...game, refresh: 'KeyG' });
  assert.equal(Model.hotkeyProblem({ code: 'KeyR' }, rebound), '');
  assert.match(Model.hotkeyProblem({ code: 'KeyG' }, rebound), /刷新商店/);
  assert.equal(Model.gameHotkeyConflict({ code: 'Insert' }, Model.normalizeGameKeys({ ready: 'Insert' })), '准备就绪');
  assert.deepEqual(Model.normalizeGameKeys(null), game);
  // Stored plans keep a letter even if it clashes today; the runtime yields it to the game instead.
  assert.deepEqual(Model.normalizePlan({ hotkey: { code: 'KeyR' } }).hotkey, { code: 'KeyR', ctrl: false, alt: false, shift: false });
});
