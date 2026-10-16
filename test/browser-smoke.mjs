// Disposable headless Chrome only. Never attaches to the user's existing browser or live game.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const browser = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile = await fs.mkdtemp(path.join(os.tmpdir(), 'wei-ui-smoke-'));
const artifacts = path.join(root, 'test', '.artifacts');
let child, buffer = Buffer.alloc(0), serial = 0;
const pending = new Map(), exceptions = [];
function send(method, params = {}, sessionId) {
  const id = ++serial;
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(method+' timed out')); },15000);
    pending.set(id, message => { clearTimeout(timer); pending.delete(id); message.error ? reject(new Error(method+': '+message.error.message)) : resolve(message.result || {}); });
    child.stdio[3].write(JSON.stringify({id,method,params,...(sessionId ? {sessionId} : {})})+'\0');
  });
}
async function evaluate(sessionId, expression) {
  const r = await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true},sessionId);
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
}
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
async function rightClick(sessionId, id) {
  const point=await evaluate(sessionId,`(() => {
    const row=[...document.querySelectorAll('[data-entry-id]')].find(r=>r.dataset.entryId===${JSON.stringify(id)});
    row.scrollIntoView({block:'nearest',inline:'nearest'});
    const rect=row.getBoundingClientRect();return {x:rect.left+55,y:rect.top+20};
  })()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'right',buttons:2,clickCount:1},sessionId);
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'right',buttons:0,clickCount:1},sessionId);
}

async function until(fn) { const end = Date.now()+12000; while (Date.now()<end) { const result = await fn(); if (result) return result; await pause(120); } throw new Error('Browser condition timed out'); }
async function attach(targetId) { const r = await send('Target.attachToTarget',{targetId,flatten:true}); await send('Runtime.enable',{},r.sessionId); return r.sessionId; }
const server = createServer((req,res) => {
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
  res.end('<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0}.app-root{position:fixed;inset:0;background:#141e19;color:#bfceb9;padding:60px;font:16px Microsoft YaHei,sans-serif}</style></head><body><div class="app-root">独立测试页面 · 没有连接真实对局</div><script>window.fixtureActions=0;window.buy=window.sell=()=>{window.fixtureActions++;};</script></body></html>');
});
try {
  await fs.access(browser);
  child = spawn(browser,['--headless=new','--remote-debugging-pipe','--enable-unsafe-extension-debugging',`--user-data-dir=${profile}`,'--no-first-run','--no-default-browser-check','--disable-background-networking','--force-device-scale-factor=1','about:blank'],{stdio:['ignore','ignore','pipe','pipe','pipe'],windowsHide:true});
  child.stderr.on('data',()=>{});
  child.stdio[4].on('data',chunk => {
    buffer = Buffer.concat([buffer,chunk]); let end;
    while ((end=buffer.indexOf(0)) !== -1) {
      const text=buffer.subarray(0,end).toString(); buffer=buffer.subarray(end+1);
      try { const message=JSON.parse(text); if(message.method==='Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text); pending.get(message.id)?.(message); } catch {}
    }
  });
  console.log('独立测试浏览器:',(await send('Browser.getVersion')).product);
  const loaded = await send('Extensions.loadUnpacked',{path:root});
  assert.ok(loaded.id);
  const worker=await until(async()=> (await send('Target.getTargets',{filter:[{exclude:false}]})).targetInfos.find(t=>t.type==='service_worker'&&t.url===`chrome-extension://${loaded.id}/background.js`));
  const workerSession=await attach(worker.targetId);
  await until(async()=> { try { return await evaluate(workerSession,"globalThis.chrome?.action?.onClicked?.hasListeners?.()===true"); } catch { return false; } });
  console.log('扩展已在临时配置中加载，后台点击监听已就绪。');
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}/`;
  const target=await send('Target.createTarget',{url});
  const gameSession=await attach(target.targetId);
  await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false},gameSession);
  await until(()=>evaluate(gameSession,"Boolean(document.querySelector('.app-root'))"));
  const tab=await until(async()=> (await send('Target.getTargets',{filter:[{type:'tab',exclude:false},{exclude:true}]})).targetInfos.find(t=>t.url===url));
  await send('Extensions.triggerAction',{id:loaded.id,targetId:tab.targetId});
  await until(()=>evaluate(gameSession,"Boolean(document.getElementById('wei-cardkeeper-host-v1'))"));
  const frame=await until(async()=> (await send('Target.getTargets',{filter:[{exclude:false}]})).targetInfos.find(t=>t.type==='iframe'&&t.url.startsWith(`chrome-extension://${loaded.id}/panel.html`)));
  const uiSession=await attach(frame.targetId);
  await until(()=>evaluate(uiSession,"Boolean(document.querySelector('.workbench [data-action=add-open]'))"));
  assert.deepEqual(await evaluate(uiSession,"[document.getElementById('buy-total').textContent,document.getElementById('keep-total').textContent,document.getElementById('result-count').textContent]"),['00','00','0']);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.operator-row').length"),0);
  assert.equal(await evaluate(gameSession,"Math.round(document.querySelector('.app-root').getBoundingClientRect().left)"),400);
  await evaluate(uiSession,"document.querySelector('[data-action=add-open]').click(); true");
  assert.equal(await evaluate(uiSession,"document.getElementById('picker-result-count').textContent"),'112');
  assert.ok(await evaluate(uiSession,"document.querySelector('.main').inert"));
  const firstId=await evaluate(uiSession,"document.querySelector('[data-action=add-candidate]').dataset.id");
  await evaluate(uiSession,"document.querySelector('[data-action=add-candidate]').click(); true");
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'01');
  await evaluate(uiSession,"document.querySelector('[data-action=add-candidate]').click(); true");
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'01');
  await evaluate(uiSession,"document.querySelector('[data-action=add-candidate]:not(:disabled)').click();document.querySelector('[data-action=picker-close]').click();true");
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.operator-row').length"),2);
  assert.ok(await evaluate(uiSession,"!document.querySelector('.main').inert"));
  assert.ok(await evaluate(uiSession,"document.getElementById('advanced-filter').hidden"));
  await evaluate(uiSession,"document.querySelector('[data-action=filters]').click();true");assert.ok(await evaluate(uiSession,"!document.getElementById('advanced-filter').hidden"));
  await evaluate(uiSession,"document.querySelector('[data-action=filters]').click();true");
  console.log('通过：默认仅已添加名单、新增弹窗、单击即添加、防重复、连续添加。');
  await evaluate(uiSession,"document.querySelector('.row-lock').click();document.querySelector('[data-action=bulk-more]').click();document.querySelector('[data-action=clear]').click();true");
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.operator-row').length"),2);
  await evaluate(uiSession,"document.querySelector('[data-action=clear]').click();true");
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.operator-row').length"),1);
  await rightClick(uiSession,firstId);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),0);
  await rightClick(uiSession,firstId);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),1);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.operator-row').length"),1);
  await rightClick(uiSession,firstId);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),1);
  await rightClick(uiSession,firstId);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),0);
  const feedbackBox=await evaluate(uiSession,`(() => {
    const toast=document.querySelector('.toast'),r=toast.getBoundingClientRect(),m=document.querySelector('.main').getBoundingClientRect(),s=getComputedStyle(toast);
    return {shown:!toast.hidden,scope:toast.parentElement.dataset.feedbackSlot,position:s.position,pointer:s.pointerEvents,clear:r.bottom<=m.top||r.top>=m.bottom||r.right<=m.left||r.left>=m.right};
  })()`);
  assert.deepEqual(feedbackBox,{shown:true,scope:'main',position:'static',pointer:'none',clear:true});
  await evaluate(uiSession,"document.querySelector('[data-action=bulk-more]').click();true");
  assert.ok(await evaluate(uiSession,`(() => {const button=document.querySelector('#bulk-menu button'),r=button.getBoundingClientRect();return !document.querySelector('#bulk-menu').hidden&&document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('button')===button;})()`),'提示不能盖住菜单按钮或截住点击');
  await evaluate(uiSession,"document.querySelector('[data-action=bulk-more]').click();true");
  await rightClick(uiSession,firstId);await rightClick(uiSession,firstId);
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),1);
  await evaluate(uiSession,"document.querySelector('[data-action=selected]').click();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('result-count').textContent"),'0');
  await evaluate(uiSession,"document.querySelector('[data-action=reset-filter]').click();true");
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),1);
  console.log('通过：真实鼠标单右键不改变状态，双右键禁用且不移除，再双右键恢复；锁定与禁用独立。');
  await evaluate(uiSession,"document.querySelector('[data-kind=keep]').click();document.querySelector('[data-action=add-open]').click();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('picker-result-count').textContent"),'133');
  const keepId=await evaluate(uiSession,"document.querySelector('.picker-row .special-badge').closest('button').dataset.id");
  await evaluate(uiSession,"document.querySelector('.picker-row .special-badge').closest('button').click();document.querySelector('[data-action=picker-close]').click();true");
  await rightClick(uiSession,keepId);await rightClick(uiSession,keepId);
  assert.equal(await evaluate(uiSession,"document.getElementById('keep-total').textContent"),'01');
  await evaluate(uiSession,"document.querySelector('[data-action=draft]').click();true");
  assert.equal(await evaluate(gameSession,'window.fixtureActions'),0);
  await new Promise(resolve=>setTimeout(resolve,200));
  const beforeReload=await evaluate(uiSession,"(async()=>{const key='wei.workbench.plan.v1';return (await chrome.storage.local.get(key))[key];})()");
  assert.deepEqual(beforeReload.disabled.buy,[firstId]);assert.deepEqual(beforeReload.disabled.keep,[keepId]);
  await evaluate(uiSession,"location.reload();true");await pause(250);
  await until(()=>evaluate(uiSession,"Boolean(document.querySelector('.operator-row.is-disabled'))"));
  assert.equal(await evaluate(uiSession,"document.getElementById('keep-total').textContent"),'01');
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('.is-disabled').length"),1);
  console.log('通过：买入与保留独立、隐藏候选可保留、禁用状态写入真实存储并刷新恢复，无交易。');
  await evaluate(uiSession,"document.querySelector('[data-kind=buy]').click();const s=document.querySelector('#search');s.value='隐现';s.dispatchEvent(new Event('input',{bubbles:true}));true");
  assert.equal(await evaluate(uiSession,"document.getElementById('result-count').textContent"),'1');
  await evaluate(uiSession,"document.querySelector('[data-action=add-open]').click();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('picker-result-count').textContent"),'112');
  await evaluate(uiSession,"document.querySelector('#picker-search').value='角峰';document.querySelector('#picker-search').dispatchEvent(new Event('input',{bubbles:true}));true");
  assert.equal(await evaluate(uiSession,"document.getElementById('picker-result-count').textContent"),'1');
  await evaluate(uiSession,"document.querySelector('#picker-search').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));true");
  assert.ok(await evaluate(uiSession,"document.querySelector('.picker-backdrop').hidden"));
  console.log('通过：已添加列表搜索、独立候选搜索、Escape 关闭弹窗。');
  await evaluate(uiSession,"document.querySelector('[data-action=settings]').click();document.querySelector('[data-action=hotkey-off]').click();true");
  assert.ok(await evaluate(uiSession,`(() => {const n=document.querySelector('.toast'),r=n.getBoundingClientRect(),d=document.querySelector('.settings').getBoundingClientRect(),b=document.querySelector('.settings>.settings-done').getBoundingClientRect();return !n.hidden&&n.parentElement.dataset.feedbackSlot==='settings'&&r.top>=d.top&&r.bottom<=b.top;})()`),'设置反馈保留在弹窗内，不盖住关闭按钮');
  await evaluate(uiSession,`document.querySelector('[data-action=hotkey-reset]').click();document.querySelector('[data-width="440"]').click();document.querySelector('[data-action=settings-close]').click();true`);
  assert.ok(await evaluate(uiSession,"document.querySelector('.toast').hidden"),'关闭弹窗同时清理旧提示');
  await until(()=>evaluate(gameSession,"Math.round(document.getElementById('wei-cardkeeper-host-v1').getBoundingClientRect().width)===440"));
  await evaluate(uiSession,"document.querySelector('[data-action=collapse]').click();true");
  await until(()=>evaluate(gameSession,"Math.round(document.querySelector('.app-root').getBoundingClientRect().left)===0"));
  await send('Extensions.triggerAction',{id:loaded.id,targetId:tab.targetId});
  await until(()=>evaluate(gameSession,"Math.round(document.querySelector('.app-root').getBoundingClientRect().left)===440"));
  assert.equal(await evaluate(gameSession,"document.querySelectorAll('#wei-cardkeeper-host-v1').length"),1);
  console.log('通过：名称搜索、440px 设置、收起恢复布局、重复点击不重复注入。');
  await pause(250);
  const stored=await evaluate(uiSession,"(async()=>{const key='wei.workbench.plan.v1';return (await chrome.storage.local.get(key))[key];})()");
  assert.equal(stored.width,440);assert.equal(stored.locks.buy.length,1);assert.deepEqual(stored.disabled.buy,[firstId]);assert.deepEqual(stored.disabled.keep,[keepId]);
  console.log('通过：方案写入真实 chrome.storage.local。');
  await evaluate(uiSession,"document.querySelector('[data-action=add-open]').click();document.querySelector('#manual-name').value='拼音确认测试';true");
  const composing=await evaluate(uiSession,"(() => {const el=document.querySelector('#manual-name');const event=new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});el.dispatchEvent(event);return event.defaultPrevented;})()");
  assert.equal(composing,true);assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'01');
  await evaluate(uiSession,"document.querySelector('#manual-name').value='  未收录测试干员  ';document.querySelector('#manual-name').focus();true");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13},uiSession);
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,nativeVirtualKeyCode:13},uiSession);
  await until(()=>evaluate(uiSession,"document.getElementById('buy-total').textContent==='02'"));
  const manualId=await evaluate(uiSession,"document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').dataset.entryId");
  assert.match(manualId,/^manual_/);
  assert.equal(await evaluate(uiSession,"document.querySelector('#manual-name').value"),'');
  assert.ok(await evaluate(uiSession,"document.querySelector('#picker-feedback').textContent.includes('未匹配游戏 ID')"));
  await evaluate(uiSession,"document.querySelector('#manual-name').value='隐现';document.querySelector('#manual-form').requestSubmit();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'02');
  assert.ok(await evaluate(uiSession,"document.querySelector('#picker-feedback').textContent.includes('不会重复添加')"));
  await evaluate(uiSession,"document.querySelector('#manual-name').value=' ';document.querySelector('#manual-form').requestSubmit();true");
  assert.ok(await evaluate(uiSession,"!document.querySelector('#manual-error').hidden"));
  await evaluate(uiSession,"document.querySelector('#manual-name').value='<img src=x onerror=alert(1)>';document.querySelector('#manual-form').requestSubmit();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'03');
  assert.equal(await evaluate(uiSession,"document.querySelectorAll('#operator-panel img').length"),0);
  assert.ok(await evaluate(uiSession,"[...document.querySelectorAll('#operator-panel .operator-name strong')].some(el=>el.textContent==='<img src=x onerror=alert(1)>')"));
  await evaluate(uiSession,"document.querySelector('[data-action=picker-close]').click();[...document.querySelectorAll('.operator-row')].find(r=>r.querySelector('strong').textContent==='<img src=x onerror=alert(1)>').querySelector('[data-action=row-more]').click();document.querySelector('#entry-menu [data-action=remove]').click();true");
  await rightClick(uiSession,manualId);await rightClick(uiSession,manualId);
  assert.ok(await evaluate(uiSession,`[...document.querySelectorAll('[data-entry-id]')].find(r=>r.dataset.entryId===${JSON.stringify(manualId)}).classList.contains('is-disabled')`));
  await evaluate(uiSession,`[...document.querySelectorAll('[data-action=lock]')].find(b=>b.dataset.id===${JSON.stringify(manualId)}).click();document.querySelector('[data-action=add-open]').click();document.querySelector('#manual-name').value='未收录测试干员';document.querySelector('#manual-form').requestSubmit();true`);
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'02');
  await evaluate(uiSession,"document.querySelector('[data-action=picker-close]').click();document.querySelector('[data-kind=keep]').click();document.querySelector('[data-action=add-open]').click();document.querySelector('#manual-name').value='未收录测试干员';document.querySelector('#manual-form').requestSubmit();document.querySelector('[data-action=picker-close]').click();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('keep-total').textContent"),'02');
  assert.equal(await evaluate(uiSession,"document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').dataset.entryId"),manualId);
  assert.ok(await evaluate(uiSession,"!document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').classList.contains('is-disabled')"));
  await pause(250);
  const namedStored=await evaluate(uiSession,"(async()=>{const key='wei.workbench.plan.v1';return (await chrome.storage.local.get(key))[key];})()");
  assert.equal(namedStored.customOperators.length,1);assert.equal(namedStored.customOperators[0].name,'未收录测试干员');
  assert.ok(namedStored.disabled.buy.includes(manualId));assert.ok(namedStored.locks.buy.includes(manualId));assert.ok(!namedStored.disabled.keep.includes(manualId));
  await evaluate(uiSession,"location.reload();true");await pause(250);
  await until(()=>evaluate(uiSession,"Boolean(document.querySelector('.operator-row .manual-badge'))"));
  assert.equal(await evaluate(uiSession,"document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').querySelector('strong').textContent"),'未收录测试干员');
  await evaluate(uiSession,"document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').querySelector('[data-action=row-more]').click();document.querySelector('#entry-menu [data-action=remove]').click();document.querySelector('[data-kind=buy]').click();true");
  assert.ok(await evaluate(uiSession,"Boolean(document.querySelector('.operator-row .manual-badge'))"));
  await evaluate(uiSession,"document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').querySelector('[data-action=lock]').click();document.querySelector('.operator-row .manual-badge').closest('[data-entry-id]').querySelector('[data-action=row-more]').click();document.querySelector('#entry-menu [data-action=remove]').click();true");
  assert.equal(await evaluate(uiSession,"document.getElementById('buy-total').textContent"),'01');
  assert.equal(await evaluate(gameSession,'window.fixtureActions'),0);
  console.log('通过：手动名称真实回车添加、目录外条目、去重、中文输入法保护、纯文本显示、双右键禁用、跨名单复用、刷新恢复及移除。');

  const previewTarget=await send('Target.createTarget',{url:pathToFileURL(path.join(root,'ui-preview.html')).href});
  const previewSession=await attach(previewTarget.targetId);
  await send('Emulation.setDeviceMetricsOverride',{width:1400,height:900,deviceScaleFactor:1,mobile:false},previewSession);
  await until(()=>evaluate(previewSession,"Boolean(window.weiWorkbench)"));
  assert.ok(await evaluate(previewSession,"document.querySelector('.brand-avatar').naturalWidth>0"));
  const workflowGeometry=await evaluate(previewSession,"({tabs:document.querySelector('.tabs').getBoundingClientRect().top,list:document.getElementById('operator-panel').getBoundingClientRect().height,run:document.querySelector('.auto-card').getBoundingClientRect().top,footer:document.querySelector('.footer').getBoundingClientRect().height,main:document.querySelector('.main').getBoundingClientRect().height,height:innerHeight})");console.log('新版列表布局：',JSON.stringify(workflowGeometry));assert.ok(workflowGeometry.list>400);assert.ok(workflowGeometry.tabs<workflowGeometry.run);
  assert.equal(await evaluate(previewSession,"document.querySelector('.run-label').textContent"),'启动');
  await evaluate(previewSession,"document.querySelector('[data-action=open-log]').click();true");assert.ok(await evaluate(previewSession,"!document.querySelector('.utility-backdrop').hidden&&document.querySelector('.main').inert"));
  assert.ok(await evaluate(previewSession,"document.querySelector('.utility-foot [data-action=draft]').hidden"));
  await evaluate(previewSession,"document.querySelector('[data-action=utility-close]').click();true");
  console.log('通过：名单操作优先、筛选可收起、启动文字明确、日志独立视图可一键返回。');
  await fs.mkdir(artifacts,{recursive:true});
  let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},previewSession);
  await fs.writeFile(path.join(artifacts,'ui-desktop.png'),Buffer.from(shot.data,'base64'));
  await evaluate(previewSession,"document.querySelector('[data-action=add-open]').click();document.querySelector('#manual-name').value='列表外干员示例';true");
  shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},previewSession);
  await fs.writeFile(path.join(artifacts,'ui-picker.png'),Buffer.from(shot.data,'base64'));
  await evaluate(previewSession,"document.querySelector('[data-action=picker-close]').click();true");

  await send('Emulation.setDeviceMetricsOverride',{width:360,height:620,deviceScaleFactor:1,mobile:false},previewSession);
  await pause(150);
  const narrow=await evaluate(previewSession,"({scroll:document.documentElement.scrollWidth,width:innerWidth,footer:document.querySelector('.footer').getBoundingClientRect().bottom,list:document.querySelector('.operator-list').getBoundingClientRect().height})");
  console.log('窄屏列表布局：',JSON.stringify(narrow));assert.equal(narrow.scroll,narrow.width);assert.ok(narrow.footer<=622);assert.ok(narrow.list>200);
  shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},previewSession);
  await fs.writeFile(path.join(artifacts,'ui-narrow.png'),Buffer.from(shot.data,'base64'));
  await evaluate(previewSession,"document.querySelector('[data-action=add-open]').click();true");
  const pickerNarrow=await evaluate(previewSession,"({bottom:document.querySelector('.picker').getBoundingClientRect().bottom,height:innerHeight,list:document.querySelector('.picker-list').getBoundingClientRect().height,scroll:document.documentElement.scrollWidth,width:innerWidth})");
  assert.ok(pickerNarrow.bottom<=pickerNarrow.height);assert.ok(pickerNarrow.list>40);assert.equal(pickerNarrow.scroll,pickerNarrow.width);
  console.log('通过：窄窗口新增弹窗保持可操作，无横向溢出。');

  assert.deepEqual(exceptions,[]);
  console.log('通过：1400×900 与 360×620 界面、原图显示、无横向溢出、无脚本异常。');
  console.log('截图：test/.artifacts/ui-desktop.png、ui-narrow.png。未访问任何真实游戏服务器。');
} finally {
  if(child) { try { await send('Browser.close'); } catch {} await pause(350); if(child.exitCode===null) child.kill(); }
  await new Promise(resolve=>server.close(resolve));
  await fs.rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:250}).catch(()=>{});
}
