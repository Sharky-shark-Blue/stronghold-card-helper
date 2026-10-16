import { mountWorkbench } from './ui.js';
import { STORAGE_KEY } from './model.js';
const BACKUP_KEY = 'wei.workbench.plan.backup.v1'; // 导入配置前自动备份的上一份配置
const FRAME_VERSION='0.3.2',CHANNEL='wei-cardkeeper.ui.v1';
const token = new URLSearchParams(location.hash.slice(1)).get('token');
const server = new URL(location.href).searchParams.get('server');
const serverOrigin=server ? new URL(server).origin : '';
const attached=parent!==window&&!!token&&!!serverOrigin;
const pending=new Map();let workbench=null;
function notify(type,extra={}) {if(attached)parent.postMessage({channel:CHANNEL,token,clientVersion:FRAME_VERSION,type,...extra},serverOrigin);}
function request(type) {
  if(!attached)return Promise.reject(new Error('独立工作台只管理名单，未连接游戏页面'));
  const rid=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(rid);reject(new Error('页面桥接未响应，请检查自检或重新打开工作台'));},12000);
    pending.set(rid,{resolve,reject,timer});notify(type,{rid});
  });
}
window.addEventListener('message',event=>{
  const data=event.data;
  if(!attached || event.source!==parent || event.origin!==serverOrigin || !data || data.channel!==CHANNEL || data.token!==token)return;
  if(data.type==='quick.action' && typeof data.rid==='string' && /^[a-f0-9]{32}$/.test(data.rid)){
    void Promise.resolve().then(()=>{
      if(!workbench)throw new Error('工作台未就绪');
      if(!['auto','master','item','ready','ready-skip'].includes(data.command) ||
        (data.command==='item' && (typeof data.id!=='string' || data.id.length>100)))throw new Error('快捷操作无效');
      return workbench.quickAction(data.command,data.id);
    }).then(result=>notify('quick.done',{rid:data.rid,ok:true,message:result?.message || ''}),
      error=>notify('quick.done',{rid:data.rid,ok:false,reason:error.message || '快捷操作未确认'}));
  }
  if(data.type==='runtime') {if(data.catalogue)workbench?.updateCatalogue(data.catalogue);workbench?.updateRuntime(data.info || {});}
  if(data.type==='match.sync' && typeof data.rid==='string' && /^[a-f0-9]{32}$/.test(data.rid)) {
    void Promise.resolve().then(()=>{
      if(!workbench)throw new Error('名单界面未就绪');
      return workbench.syncItemMatch(data.state,serverOrigin,data.epoch);
    }).then(plan=>notify('count.saved',{rid:data.rid,ok:true,plan}),
      error=>notify('count.saved',{rid:data.rid,ok:false,reason:error.message || '新对局同步失败'}));
  }
  if(data.type==='count.record' && typeof data.rid==='string' && /^[a-f0-9]{32}$/.test(data.rid)) {
    void Promise.resolve().then(()=>{
      if(!workbench)throw new Error('名单界面未就绪');
      return workbench.recordConfirmedPurchase(data.kind,data.sourceId,data.epoch,data.count);
    }).then(plan=>notify('count.saved',{rid:data.rid,ok:true,plan}),
      error=>notify('count.saved',{rid:data.rid,ok:false,reason:error.message || '本局次数保存失败'}));
  }
  if(data.type==='hotkey' && typeof data.key==='string') workbench?.hotkey(data.result,data.key.slice(0,40),typeof data.action==='string'?data.action.slice(0,20):'');
  if(data.type==='reply') {const item=pending.get(data.rid);if(!item)return;clearTimeout(item.timer);pending.delete(data.rid);data.ok?item.resolve(data):item.reject(new Error(data.reason || '操作被拒绝'));}
});
try {
  if(chrome.runtime.getManifest().version!==FRAME_VERSION)throw new Error('工作台与扩展版本不匹配，请在安全时重新打开页面');
  const response=await fetch('../data/catalogue.json');if(!response.ok)throw new Error(`名单加载失败 (${response.status})`);
  const catalogue=await response.json();
  workbench=await mountWorkbench(document.querySelector('#app'),{
    catalogue,version:FRAME_VERSION,brandUrl:'../图标.png',serverLabel:server ? new URL(server).host : '独立工作台',
    storage:{async get(){const saved=await chrome.storage.local.get([STORAGE_KEY,'spui.cross-server.plan.v1']);return saved[STORAGE_KEY] || saved['spui.cross-server.plan.v1'] || null;},async set(plan){await chrome.storage.local.set({[STORAGE_KEY]:plan});},
      async getBackup(){return (await chrome.storage.local.get(BACKUP_KEY))[BACKUP_KEY] || null;},async setBackup(value){await chrome.storage.local.set({[BACKUP_KEY]:value});}},
    onReadySettingsSaved:settings=>notify('ready.settings',{settings}),
    onPersistenceError:()=>notify('storage.error'),
    onPlanChange:(plan,meta)=>notify('plan',{plan,liveItemToggle:meta?.liveItemToggle,liveItemPause:meta?.liveItemPause}),onRuntimeAction:request,onQuickOpen:kind=>notify('quick.open',{kind}),onCollapse:()=>notify('collapse'),onClose:()=>notify('close'),onResize:width=>notify('width',{width}),
  });
  window.weiWorkbench=workbench;
  notify('ui.ready',{plan:workbench.getPlan()});
} catch(error) {
  const app=document.querySelector('#app'),box=document.createElement('div');box.className='empty';
  const title=document.createElement('strong');title.textContent='工作台未能加载';
  const detail=document.createElement('span');detail.textContent=error.message;
  const hint=document.createElement('span');hint.textContent='请重新加载扩展后再打开。没有发送任何游戏操作。';box.append(title,detail,hint);app.replaceChildren(box);
}
