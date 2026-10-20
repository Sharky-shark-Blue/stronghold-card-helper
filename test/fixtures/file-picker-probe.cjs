'use strict';
const fs=require('node:fs'),path=require('node:path'),{app}=require('electron');
module.exports=async function probe(win,result){
 const debug=win.webContents.debugger,sessions=new Set(),opened=[],checks=[];
 const check=(name,pass)=>checks.push({name,pass:!!pass});
 debug.attach('1.3');
 debug.on('message',(_event,method,params,sessionId)=>{
  if(method==='Target.attachedToTarget'&&params.targetInfo?.type==='iframe')sessions.add(params.sessionId);
  if(method==='Page.fileChooserOpened')opened.push({sessionId,backendNodeId:params.backendNodeId});
 });
 try{
  await debug.sendCommand('Page.enable');await debug.sendCommand('Page.setInterceptFileChooserDialog',{enabled:true});
  await debug.sendCommand('Target.setAutoAttach',{autoAttach:true,waitForDebuggerOnStart:false,flatten:true});
  await new Promise(resolve=>setTimeout(resolve,150));
  for(const sessionId of sessions){await debug.sendCommand('Page.enable',{},sessionId);await debug.sendCommand('Page.setInterceptFileChooserDialog',{enabled:true},sessionId);}
  const frame=win.webContents.mainFrame.framesInSubtree.find(frame=>frame.url.startsWith('chrome-extension://')&&frame.url.includes('/panel.html'));
  if(!frame)throw Error('extension UI frame absent');
  const ID='chess_item_5_07_e_a',oldBuy='chess_char_1_19_a',newBuy='chess_char_4_19_a';
  const config=plan=>({format:'wei-cardkeeper-config',version:1,plan});
  const seed=config({buy:[oldBuy],keep:[],items:[{id:ID,enabled:true}],draftEnabled:false});
  await frame.executeJavaScript(`(async()=>{const w=window.weiWorkbench;const r=await w.importConfig(${JSON.stringify(seed)});if(!r.ok)throw Error('static seed rejected');await w.recordConfirmedPurchase('item',${JSON.stringify(ID)},w.getPlan().itemSession.epoch,3);await w.settled();document.querySelector('[data-action="settings"]').click();})()`);
  const before=await frame.executeJavaScript('window.weiWorkbench.getPlan()');
  check('静态基线保留本局已抓3次',before.itemSession.used[ID]===3);
  const native=await frame.executeJavaScript(`(()=>{const input=document.getElementById('config-file'),label=document.querySelector('[data-action="config-import"]');const r=input.getBoundingClientRect(),c=getComputedStyle(input);window.__staticPickerClicks=[];input.addEventListener('click',e=>window.__staticPickerClicks.push(e.isTrusted));return {tag:label.tagName,inside:label.contains(input),hidden:input.hidden,focusable:input.tabIndex>=0,display:c.display,width:r.width,height:r.height};})()`);
  check('原生文件框可接收点击和键盘焦点，不再hidden',native.tag==='LABEL'&&native.inside&&!native.hidden&&native.focusable&&native.display!=='none'&&native.width>0&&native.height>0);
  // Trusted native input requires a visible, focused RenderWidgetHost. This is only the isolated static fixture.
  win.setTitle('拿牌器导入 · 隔离静态测试（非真实对局）');win.show();win.focus();win.webContents.focus();
  await new Promise(resolve=>setTimeout(resolve,180));
  const good=path.join(app.getPath('userData'),'static-valid-config.json'),bad=path.join(app.getPath('userData'),'static-invalid-config.json');
  fs.writeFileSync(good,JSON.stringify(config({buy:[newBuy],keep:[oldBuy],items:[{id:ID,enabled:true,ownedTarget:2,allowEquippedMerge:true}],draftEnabled:true})));fs.writeFileSync(bad,'{not json');
  async function choose(file){
   const count=opened.length;
   const point=await frame.executeJavaScript(`(()=>{const input=document.getElementById('config-file');input.scrollIntoView({block:'center'});const r=input.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {x,y,hit:document.elementFromPoint(x,y)===input};})()`);
   if(!point.hit)throw Error('native input is obscured at the actual pointer target');
   result.filePickerProgress={stage:'native-pointer',point};
   const pointerSession=[...sessions][0];
   const send=(params)=>Promise.race([debug.sendCommand('Input.dispatchMouseEvent',params,pointerSession),new Promise((_,reject)=>setTimeout(()=>reject(Error('iframe input acknowledgement timeout')),1200))]);
   await send({type:'mouseMoved',x:point.x,y:point.y});
   await send({type:'mousePressed',x:point.x,y:point.y,button:'left',clickCount:1});
   const released=send({type:'mouseReleased',x:point.x,y:point.y,button:'left',clickCount:1});
   released.catch(()=>{});
   await new Promise(resolve=>setTimeout(resolve,180));
   if(opened.length!==count+1)throw Error('expected exactly one intercepted chooser per activation');
   const chooser=opened.at(-1);await debug.sendCommand('DOM.setFileInputFiles',{files:file?[file]:[],backendNodeId:chooser.backendNodeId},chooser.sessionId);
   await new Promise(resolve=>setTimeout(resolve,100));
   return frame.executeJavaScript('(async()=>{await window.weiWorkbench.settled();return {plan:window.weiWorkbench.getPlan(),error:document.getElementById("config-error").textContent,cleared:document.getElementById("config-file").value==="",trusted:window.__staticPickerClicks.at(-1)};})()');
  }
  const imported=await choose(good);
  check('导入入口触发一次原生选择器，关联输入收到可信事件',imported.trusted===true);
  check('实际选文件后新名单和商业包装授权完整导入',imported.plan.buy.includes(newBuy)&&imported.plan.keep.includes(oldBuy)&&imported.plan.items[0].allowEquippedMerge===true);
  check('导入保留本局已抓次数且不启动交易',imported.plan.itemSession.used[ID]===3&&imported.plan.draftEnabled===false);
  check('文件选择后清空临时控件，允许再次选择同一文件',imported.cleared);
  const rejected=await choose(bad);
  check('无效JSON可见报错且当前配置不被覆盖',!!rejected.error&&JSON.stringify(rejected.plan)===JSON.stringify(imported.plan));
  const repeated=await choose(good);
  check('连续选择同一文件仍能导入且计数不变',repeated.error===''&&repeated.plan.itemSession.used[ID]===3&&repeated.plan.buy.includes(newBuy));
  const cancelled=await choose(null);
  check('取消选择不改现有配置',JSON.stringify(cancelled.plan)===JSON.stringify(repeated.plan));
  // A fresh distinct import lets restore prove the backup of the immediately preceding plan.
  fs.writeFileSync(good,JSON.stringify(seed));await choose(good);
  await frame.executeJavaScript(`document.querySelector('[data-action="config-restore"]').click()`);
  await new Promise(resolve=>setTimeout(resolve,100));
  const restored=await frame.executeJavaScript('(async()=>{await window.weiWorkbench.settled();return window.weiWorkbench.getPlan();})()');
  check('恢复导入前备份可恢复名单与专属授权，并保留本局计数',restored.buy.includes(newBuy)&&restored.items[0].allowEquippedMerge===true&&restored.itemSession.used[ID]===3);
  const sourceHasNoRelay=await frame.executeJavaScript(`(async()=>{const s=await(await fetch(chrome.runtime.getURL('src/ui.js'))).text();return !/configFile\\.click\\s*\\(/.test(s);})()`);
  check('实际加载源码不再使用隐藏控件脚本点击转发',sourceHasNoRelay);
  await frame.executeJavaScript(`console.table(${JSON.stringify(checks)})`);
  result.filePicker={total:checks.length,passed:checks.filter(c=>c.pass).length,checks,native,opened:opened.length};
 }finally{debug.detach();}
};
