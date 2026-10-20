import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
const read = name => readFile(new URL('../'+name,import.meta.url),'utf8');
const manifest = JSON.parse(await read('manifest.json'));
test('MV3 最小权限，仅在客户端支持的游戏站点显示入口', () => {
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['activeTab','scripting','storage']);
  assert.deepEqual(manifest.host_permissions,manifest.content_scripts[0].matches);
  assert.ok(!manifest.host_permissions.includes('<all_urls>'));
  assert.deepEqual(manifest.content_scripts,[{matches:['https://weishuxieyiwangye.cn/*','https://weishuxieyi.icu/*','http://127.0.0.1/*'],js:['desktop-boot.js'],run_at:'document_idle'}]);
  assert.ok(manifest.content_scripts.every(script=>!script.matches.includes('<all_urls>')));
  assert.equal(manifest.action.default_popup,undefined);
});
test('图标确实使用原目录中的 PNG，而非替换素材', async () => {
  assert.equal(manifest.icons['128'],'图标.png');
  const icon = await readFile(new URL('../图标.png',import.meta.url));
  assert.equal(icon.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
});
test('扩展入口资源均存在', async () => {
  for (const name of ['background.js','desktop-boot.js','content-script.js','panel.html','src/panel-page.js','src/ui.js','src/model.js','styles/ui.css','styles/workflow.css','data/catalogue.json']) await access(new URL('../'+name,import.meta.url));
});
test('UI 与交易核心分离，无 eval 或旧控制台加载', async () => {
  const code = (await Promise.all(['src/panel-page.js','src/ui.js','src/model.js'].map(read))).join('\n');
  assert.doesNotMatch(code,/\beval\s*\(|new Function\s*\(|\bfetch\([^)]*(?:buy|sell|refresh)|gameActions|g\.modAuto|auto-controller/);
  const runtime = await read('src/runtime-host.js');
  assert.match(runtime,/createAutoController/);
  assert.match(runtime,/controller\?\.stop/);
});
test('iframe 通信核对来源、窗口和关联 token', async () => {
  const code = await read('content-script.js');
  assert.match(code,/event\.source !== frame\.contentWindow/);
  assert.match(code,/event\.origin !== extensionOrigin/);
  assert.match(code,/data\.token !== token/);
  assert.match(code,/window\.removeEventListener\('message', onMessage\)/);
});
test('离线预览无外部图片/脚本，明确标注示例而非对局', async () => {
  const preview = await read('ui-preview.html');
  assert.doesNotMatch(preview,/<script[^>]+src=|<link[^>]+href=|<img[^>]+src=["']https?:/i);
  assert.match(preview,/未连接对局/); assert.match(preview,/示例方案/);
  assert.match(preview,/data:image\/png;base64,/);
});

test('工作台页面版本与扩展 manifest 版本一致，否则不会加载', async () => {
  const page = await read('src/panel-page.js');
  const m = page.match(/FRAME_VERSION='([^']+)'/);
  assert.ok(m, '缺少 FRAME_VERSION');
  assert.equal(m[1], manifest.version);
  assert.match(page,/version:FRAME_VERSION/);
  const ui = await read('src/ui.js'), preview = await read('ui-preview.html');
  assert.match(ui,/options\.version/);
  assert.ok(preview.includes(`LEFT-SIDE WORKBENCH / ${manifest.version}`));
  assert.ok(preview.includes(`version: "${manifest.version}"`));
});
