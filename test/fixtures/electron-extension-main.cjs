'use strict';
const {app,BrowserWindow,session,webContents}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve(__dirname,'..','..'),report=path.join(base,'result.json');
app.setPath('userData',path.join(base,'profile'));app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-background-networking');
app.on('window-all-closed',()=>{});
const result={mode:process.env.WEI_PROBE_MODE,electron:process.versions.electron,errors:[]};
let done=false;
function finish(extra={}){if(done)return;done=true;Object.assign(result,extra);fs.writeFileSync(report,JSON.stringify(result));app.exit(0);}
setTimeout(()=>finish({timeout:true}),14000);
app.whenReady().then(async()=>{
 const ses=session.defaultSession;
 await ses.protocol.handle('https',request=>{
  const u=new URL(request.url);
  if(u.hostname!=='weishuxieyiwangye.cn')return new Response('blocked',{status:403});
  if(u.pathname.endsWith('.json'))return new Response('{}',{headers:{'content-type':'application/json'}});
  return new Response('<!doctype html><html><body>LOCAL STATIC FIXTURE<script>globalThis.__SP__={version:1,store:{get:()=>({}),subscribe:()=>()=>{}},net:{request:()=>{throw Error("STATIC FIXTURE: game intents forbidden")}}};</script></body></html>',{headers:{'content-type':'text/html'}});
 });
 const loaded=process.env.WEI_PROBE_FIX_CACHE==='1'?await require(process.env.WEI_CACHE_HELPER).loadCardKeeperExtension(ses,process.env.WEI_TEST_EXTENSION,app.getPath('userData')):null;
 const ext=loaded?.extension || await ses.loadExtension(process.env.WEI_TEST_EXTENSION,{allowFileAccess:true});
 result.cacheReset=loaded?.reset;
  result.extension={id:ext.id,version:ext.version};
  if(result.mode==='warm'){
   if(process.env.WEI_PROBE_SEED==='1')await ses.cookies.set({url:'https://weishuxieyiwangye.cn:8443',name:'__weiCacheFixture',value:'login-kept',expirationDate:Date.now()/1000+3600});
   result.preserved={cookie:(await ses.cookies.get({name:'__weiCacheFixture'}))[0]?.value};
  }
 if(result.mode==='policy'){
  ses.setPermissionRequestHandler((_web,_name,callback)=>callback(false));
  ses.setPermissionCheckHandler(()=>false);ses.setDevicePermissionHandler(()=>false);
 }
 if(result.mode==='page'){
  const bg=new BrowserWindow({show:false,webPreferences:{session:ses,nodeIntegration:false,contextIsolation:true,sandbox:true}});
  bg.webContents.on('console-message',(_e,...args)=>result.errors.push(String(args[1]||args[0]).slice(0,220)));
  await bg.loadURL('chrome-extension://'+ext.id+'/electron-probe-background.html');
  result.background=await bg.webContents.executeJavaScript(`({runtime:typeof chrome.runtime,scripting:typeof chrome.scripting,action:typeof chrome.action,sessionStorage:typeof chrome.storage.session})`);
 }
 const win=new BrowserWindow({show:false,webPreferences:{session:ses,nodeIntegration:false,contextIsolation:true,sandbox:true}});
 win.webContents.setUserAgent(win.webContents.getUserAgent()+' SPDesktop/STATIC');
 win.webContents.on('console-message',(_e,...args)=>result.errors.push(String(args[1]||args[0]).slice(0,220)));
  if(process.env.WEI_PROBE_UI_FILE){
   await win.loadFile(process.env.WEI_PROBE_UI_FILE);
   await win.webContents.executeJavaScript(`localStorage.setItem('wei.workbench.preview.v1',${JSON.stringify(process.env.WEI_PROBE_UI_PLAN || '{}')})`);
   await win.loadFile(process.env.WEI_PROBE_UI_FILE);
  }else await win.loadURL('https://weishuxieyiwangye.cn:8443/fixture.html');
  if(result.mode==='warm'){
   if(process.env.WEI_PROBE_SEED==='1')await win.webContents.executeJavaScript(`localStorage.setItem('__weiCacheFixture','game-storage-kept')`);
   result.preserved.gameStorage=await win.webContents.executeJavaScript(`localStorage.getItem('__weiCacheFixture')`);
  }
 await new Promise(resolve=>setTimeout(resolve,3200));
 if(result.mode==='picker')await require(process.env.WEI_PICKER_HELPER)(win,result);
 if(result.mode==='console'&&process.env.WEI_PROBE_CONSOLE_B64){
  result.staticConsole=await win.webContents.executeJavaScript(Buffer.from(process.env.WEI_PROBE_CONSOLE_B64,'base64').toString('utf8'));
 }
 result.dom=await win.webContents.executeJavaScript(`({entry:!!document.getElementById('wei-desktop-entry-v1'),entryStatus:document.getElementById('wei-desktop-entry-v1')?.dataset.weiStartup,entryReason:document.getElementById('wei-desktop-entry-v1')?.dataset.weiStartupReason,host:!!document.getElementById('wei-cardkeeper-host-v1'),body:document.body.innerText.slice(0,40)})`);
 if(result.mode==='warm'&&process.env.WEI_PROBE_FIX_CACHE==='1'){
  const keeper=new BrowserWindow({show:false,webPreferences:{session:ses,nodeIntegration:false,contextIsolation:true,sandbox:true}});
  await keeper.loadURL('chrome-extension://'+ext.id+'/fixture-preserve.html');
  result.preserved.settings=(await keeper.webContents.executeJavaScript(`chrome.storage.local.get('__weiCacheFixture')`)).__weiCacheFixture;keeper.destroy();
 }
 result.workers=ses.serviceWorkers.getAllRunning();result.contents=webContents.getAllWebContents().map(w=>({type:w.getType(),url:w.getURL().split('#')[0]}));ses.flushStorageData();await ses.cookies.flushStore();finish();
}).catch(error=>finish({fatal:error.message,stack:error.stack?.split('\n').slice(0,3)}));
