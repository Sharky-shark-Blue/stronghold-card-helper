// 为 Electron 客户端提供页面内可见的工作台入口；不会自动启动交易。
(() => {
  if (window.top !== window || document.getElementById('wei-desktop-entry-v1')) return;

  const host = document.createElement('div');
  host.id = 'wei-desktop-entry-v1';
  host.style.cssText = 'all:initial;position:fixed;right:18px;bottom:110px;display:flex;align-items:stretch;z-index:2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = `
    button{display:flex;align-items:center;gap:5px;padding:6px 8px;border:1px solid #42554c;border-radius:0 9px 9px 0;
      background:linear-gradient(135deg,#1b3028,#111b19);color:#e7f6eb;font:600 11px Microsoft YaHei,sans-serif;
      box-shadow:0 5px 16px #0006;cursor:pointer;letter-spacing:.1px;min-height:34px;box-sizing:border-box}
    button:hover{border-color:#9bd6ad;background:linear-gradient(135deg,#254737,#15241d)}
    button:focus-visible{outline:2px solid #b9eac5;outline-offset:2px}
    button:disabled{opacity:.7;cursor:wait} img{width:20px;height:20px;object-fit:cover;border-radius:5px}
    .drag{width:14px;padding:0;justify-content:center;border-right:0;border-radius:9px 0 0 9px;
      cursor:grab;touch-action:none;user-select:none;color:#a8c9b1;font-size:15px}
    .drag:active{cursor:grabbing}
    .hint{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
  `;
  const button = document.createElement('button');
  button.type = 'button';
  button.title = '打开或收起卫戍协议拿牌器工作台；不会自动启动交易';
  button.setAttribute('aria-label','打开或收起卫戍协议拿牌器工作台');
  const icon = document.createElement('img');
  icon.src = chrome.runtime.getURL('图标.png');
  icon.alt = '';
  const labels = document.createElement('span');
  labels.textContent = '拿牌器';
  const hint = document.createElement('span');
  hint.className = 'hint';
  hint.setAttribute('aria-live','polite');
  function showHint(text){hint.textContent=text;button.title=`打开或收起卫戍协议拿牌器工作台；${text}；不会自动启动交易`;}
  showHint('点击打开；拖动左侧手柄可移动入口');
  button.append(icon, labels, hint);
  const grip=document.createElement('button');grip.type='button';grip.className='drag';grip.textContent='⋮';
  grip.title='拖动拿牌器入口；方向键微调，Home 复位';grip.setAttribute('aria-label',grip.title);
  shadow.append(style, grip, button);

  // Only the launcher moves. The expanded workbench keeps its fixed left-side layout.
  const positionKey=`wei.workbench.launcher.v1:${location.origin}`;
  let position=null,touched=false,drag=null,saveTimer=null,writeQueue=Promise.resolve();
  function place(x,y){
    const rect=host.getBoundingClientRect(),w=rect.width || 90,h=rect.height || 34;
    position={x:Math.max(8,Math.min(x,window.innerWidth-w-8)),y:Math.max(8,Math.min(y,window.innerHeight-h-8))};
    host.style.left=`${position.x}px`;host.style.top=`${position.y}px`;host.style.right='auto';host.style.bottom='auto';
  }
  function persist(){
    clearTimeout(saveTimer);saveTimer=null;if(!position)return;
    const value={...position};writeQueue=writeQueue.then(()=>chrome.storage.local.set({[positionKey]:value})).catch(()=>{});
  }
  function save(){clearTimeout(saveTimer);saveTimer=setTimeout(persist,180);}
  grip.addEventListener('pointerdown',event=>{
    if(!event.isTrusted || event.button!==0 || event.isPrimary===false || drag)return;
    event.preventDefault();event.stopPropagation();touched=true;
    const rect=host.getBoundingClientRect();drag={id:event.pointerId,x:rect.left,y:rect.top,startX:event.clientX,startY:event.clientY};
    grip.setPointerCapture(event.pointerId);
  });
  grip.addEventListener('pointermove',event=>{
    if(!event.isTrusted || !drag || event.pointerId!==drag.id)return;
    event.preventDefault();event.stopPropagation();place(drag.x+event.clientX-drag.startX,drag.y+event.clientY-drag.startY);
  });
  function endDrag(event){
    if(!event.isTrusted || !drag || event.pointerId!==drag.id)return;
    const id=drag.id;drag=null;if(grip.hasPointerCapture(id))grip.releasePointerCapture(id);save();
  }
  grip.addEventListener('pointerup',endDrag);grip.addEventListener('pointercancel',endDrag);grip.addEventListener('lostpointercapture',endDrag);
  grip.addEventListener('keydown',event=>{
    const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];
    if(!event.isTrusted || !delta && event.key!=='Home')return;
    event.preventDefault();event.stopPropagation();touched=true;
    const rect=host.getBoundingClientRect();
    if(delta)place(rect.left+delta[0],rect.top+delta[1]);
    else place(window.innerWidth-rect.width-18,window.innerHeight-rect.height-110);
    save();
  });
  window.addEventListener('resize',()=>{if(position){place(position.x,position.y);if(touched)save();}});
  window.addEventListener('pagehide',()=>{if(saveTimer)persist();});
  void (async()=>{
    try{
      const saved=(await chrome.storage.local.get(positionKey))[positionKey];
      if(!touched && saved && Number.isFinite(saved.x) && Number.isFinite(saved.y))place(saved.x,saved.y);
    }catch{}
  })();

  let visible = false;
  let busy = false, probing = false, initialized = false;
  const isElectron=typeof navigator!=='undefined' && /\bSPDesktop\//.test(navigator.userAgent || '');
  function reveal(){
    if(visible)return;document.documentElement.append(host);visible=true;
    const rect=host.getBoundingClientRect();place(position?.x ?? rect.left,position?.y ?? rect.top);
  }
  function startup(state,reason){
    host.dataset.weiStartup=state;
    host.dataset.weiStartupReason=String(reason || '').replace(/https?:\/\/\S+/g,'[地址]').slice(0,180);
    if(reason)showHint(host.dataset.weiStartupReason);
  }
  if(isElectron){reveal();startup('waiting','正在等待游戏接口与拿牌器后台；自动交易未启动');}
  async function probe() {
    if(initialized)return true;
    if(probing)return false;
    probing=true;
    try {
      const result = await chrome.runtime.sendMessage({ type: 'desktop.probe' });
      if(result?.supported)reveal();
      if(!result?.supported){
        if(isElectron)startup(result?.ok===false?'error':'waiting',result?.reason || '正在等待兼容游戏接口；可点击入口查看自检');
        return false;
      }
      if(result.desktop){
        const ready=await chrome.runtime.sendMessage({type:'desktop.ensureWorkbench'});
        if(!ready?.ok){startup('error',ready?.reason || '正在等待工作台初始化，可点击入口重试');return false;}
        showHint('工作台已自动初始化；点击展开/收起；自动交易须手动开启');
      }
      initialized=true;startup('ready','');
      return true;
    } catch(error) {
      if(isElectron)startup('error',error?.message || '拿牌器后台未回应');
      return false;
    } finally {
      probing=false;
    }
  }
  button.addEventListener('click', async event => {
    if (!event.isTrusted || busy) return;
    busy = true;
    button.disabled = true;
    showHint('正在打开…');
    try {
      const result = await chrome.runtime.sendMessage({ type: 'desktop.openWorkbench' });
      if (!result?.ok) throw new Error(result?.reason || '工作台打开失败');
      showHint('已请求打开');
      setTimeout(() => { if (host.isConnected) showHint('点击打开/收起；左侧手柄可拖动入口'); }, 1800);
    } catch (error) {
      showHint(String(error?.message || error).slice(0, 42));
    } finally {
      busy = false;
      button.disabled = false;
    }
  });

  let attempts = 0;
  const timer = setInterval(async () => {
    attempts++;
    if (await probe() || attempts >= 120 || !host.isConnected && !document.documentElement.isConnected) {
      clearInterval(timer);
    }
  }, 1000);
  void probe();
})();
