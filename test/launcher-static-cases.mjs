// Mock DOM and storage only. Can run in Node VM or in a temporary Console scope.
export async function runLauncherStaticCases(install) {
  const results=[];
  const check=(name,pass,detail='')=>results.push({name,pass:!!pass,...(!pass?{detail}: {})});
  const tick=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
  async function fixture({saved=null,late=false,desktop=false,ensureFailures=0,supportAfter=0,probeFailure=false,probeThrows=false}={}){
    const nodes=[],writes=[],calls=[],timers=new Map(),intervals=new Map();let timerId=0,resolveRead,probes=0,ensures=0;
    class Element {
      constructor(tag){this.tag=tag;this.style={};this.dataset={};this.children=[];this.events={};this.isConnected=false;this.attributes={};nodes.push(this);}
      append(...children){this.children.push(...children);for(const child of children)child.isConnected=this.isConnected;}
      attachShadow(){this.shadow=new Element('shadow');return this.shadow;}
      setAttribute(k,v){this.attributes[k]=v;}
      addEventListener(t,fn){(this.events[t] ||= []).push(fn);}
      emit(t,extra={}){const event={isTrusted:true,button:0,isPrimary:true,pointerId:1,clientX:0,clientY:0,
        preventDefault(){},stopPropagation(){},...extra};for(const fn of this.events[t] || [])fn(event);}
      setPointerCapture(id){this.capture=id;}hasPointerCapture(id){return this.capture===id;}releasePointerCapture(){this.capture=null;}
      getBoundingClientRect(){return {left:this.style.left==null?window.innerWidth-90-18:parseFloat(this.style.left),
        top:this.style.top==null?window.innerHeight-34-110:parseFloat(this.style.top),width:90,height:34};}
    }
    const window={innerWidth:500,innerHeight:400,events:{},addEventListener(t,fn){(this.events[t] ||= []).push(fn);}};window.top=window;
    const document={documentElement:new Element('html'),getElementById:id=>nodes.find(x=>x.id===id&&x.isConnected),createElement:t=>new Element(t)};
    document.documentElement.isConnected=true;
    const key='wei.workbench.launcher.v1:https://static-launcher.example';
    const chrome={runtime:{getURL:name=>'chrome-extension://static/'+name,async sendMessage(msg){calls.push(msg.type);if(msg.type==='desktop.probe'){if(probeThrows)throw Error('static worker missing');if(probeFailure)return {ok:false,reason:'static stale worker'};return {supported:++probes>supportAfter,desktop};}
        if(msg.type==='desktop.ensureWorkbench')return {ok:++ensures>ensureFailures,reason:'static: waiting'};return {ok:true};}},
      storage:{local:{get:async()=>late?new Promise(resolve=>{resolveRead=resolve;}):{[key]:saved},async set(value){writes.push(value);}}}};
    const sandbox={window,document,chrome,navigator:{userAgent:desktop?'SPDesktop/STATIC':'Chrome/STATIC'},location:{origin:'https://static-launcher.example'},console,
      setTimeout(fn){const id=++timerId;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),setInterval(fn){const id=++timerId;intervals.set(id,fn);return id;},clearInterval:id=>intervals.delete(id)};
    install(sandbox);await tick();
    const host=nodes.find(x=>x.id==='wei-desktop-entry-v1'),grip=nodes.find(x=>x.className==='drag'),button=nodes.find(x=>x.tag==='button'&&x!==grip);
    return {host,grip,button,nodes,writes,calls,key,window,resolveRead:value=>resolveRead({[key]:value}),
      async poll(){for(const fn of [...intervals.values()])await fn();await tick();},
      async flush(){for(const [id,fn] of [...timers]){timers.delete(id);fn();}await tick();},tick};
  }
  let f=await fixture();
  check('入口为紧凑单行，保留打开按钮与独立拖动手柄',f.button.children.some(x=>x.textContent==='拿牌器')&&f.grip&&f.nodes.find(x=>x.tag==='style').textContent.includes('width:20px;height:20px'));
  check('探测只显示入口，不自动打开工作台或交易',f.calls.length===1&&f.calls[0]==='desktop.probe');
  f.grip.emit('pointerdown',{clientX:400,clientY:260});f.grip.emit('pointermove',{clientX:140,clientY:100});f.grip.emit('pointerup');await f.flush();
  check('拖动改变入口坐标',f.host.style.left==='132px'&&f.host.style.top==='96px',JSON.stringify(f.host.style));
  check('拖动仅保存入口位置，不发送打开或交易',f.calls.every(x=>x==='desktop.probe')&&f.writes.length===1&&f.writes[0][f.key].x===132);
  f.button.emit('click',{isTrusted:false});await f.tick();check('合成点击不打开工作台',!f.calls.includes('desktop.openWorkbench'));
  f.button.emit('click');await f.tick();check('真实点击仍可打开或收起工作台',f.calls.filter(x=>x==='desktop.openWorkbench').length===1);
  f=await fixture();const initial=f.host.style.left;
  f.grip.emit('pointerdown',{isTrusted:false});f.grip.emit('pointermove',{clientX:1000});f.grip.emit('pointerup');await f.flush();
  check('合成拖动不改位置或持久化',f.host.style.left===initial&&f.writes.length===0);
  f=await fixture({saved:{x:99999,y:-50}});check('恢复坐标时限制在视口内',f.host.style.left==='402px'&&f.host.style.top==='8px');
  f=await fixture({late:true});f.grip.emit('keydown',{key:'ArrowLeft'});f.resolveRead({x:50,y:50});await f.tick();
  check('迟到的位置读取不覆盖用户刚刚的移动',f.host.style.left==='380px');
  f.grip.emit('keydown',{key:'Home'});check('Home恢复右下角默认位置',f.host.style.left==='392px'&&f.host.style.top==='256px');
  f.window.innerWidth=200;f.window.innerHeight=150;for(const fn of f.window.events.resize)fn();
  check('窗口缩小时重新限制在屏幕内',f.host.style.left==='102px'&&f.host.style.top==='108px');
  f=await fixture();f.grip.emit('pointerdown');f.grip.emit('pointermove',{pointerId:2,clientX:100});f.grip.emit('pointercancel');
  check('其他指针不干扰当前拖动，取消不触发打开',f.host.style.left==='392px'&&!f.calls.includes('desktop.openWorkbench'));
  f=await fixture({desktop:true});await f.tick();
  check('Electron接口就绪后无需点击即初始化工作台',f.calls.filter(x=>x==='desktop.ensureWorkbench').length===1&&!f.calls.includes('desktop.openWorkbench'));
  await f.poll();await f.poll();
  check('自动初始化成功后停止探测，不重复打开或收起',f.calls.filter(x=>x==='desktop.ensureWorkbench').length===1);
  f.button.emit('click');await f.tick();
  check('自动初始化后入口仍只触发用户展开收起',f.calls.filter(x=>x==='desktop.openWorkbench').length===1);
  f=await fixture({desktop:true,ensureFailures:1});await f.tick();await f.poll();await f.poll();
  check('首次初始化失败可幂等重试，成功后停止',f.calls.filter(x=>x==='desktop.ensureWorkbench').length===2&&!f.calls.includes('desktop.openWorkbench'));
  f=await fixture({desktop:true,probeFailure:true});
  check('Electron旧后台拒绝探测时保留入口并显示错误',f.host.isConnected&&f.host.dataset.weiStartup==='error'&&f.host.dataset.weiStartupReason==='static stale worker'&&!f.calls.includes('desktop.ensureWorkbench'));
  f=await fixture({desktop:true,probeThrows:true});
  check('Electron后台连接异常时不再静默消失',f.host.isConnected&&f.host.dataset.weiStartup==='error'&&f.host.dataset.weiStartupReason==='static worker missing');
  f=await fixture({desktop:true,supportAfter:1});
  check('游戏接口未就绪时不初始化工作台',!f.calls.includes('desktop.ensureWorkbench'));
  check('Electron接口未就绪时仍显示入口与等待原因',f.host.isConnected&&f.host.dataset.weiStartup==='waiting'&&f.host.dataset.weiStartupReason.length>0);
  await f.poll();await f.tick();
  check('游戏接口稍后就绪时自动初始化',f.calls.filter(x=>x==='desktop.ensureWorkbench').length===1);
  f=await fixture();await f.poll();
  check('普通Chrome不自动初始化，保持手动入口',!f.calls.includes('desktop.ensureWorkbench')&&!f.calls.includes('desktop.openWorkbench'));
  return results;
}
