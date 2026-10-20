// Chrome API boundary mock: no live extension, Electron window, storage or game calls.
export async function runDesktopBackgroundCases(install) {
  const results=[],check=(name,pass,detail='')=>results.push({name,pass:!!pass,...(!pass?{detail}: {})});
  function fixture({desktop=true,ready=true,hostVersion=null}={}) {
    let listener,clicked,host=hostVersion?{dataset:{weiVersion:hostVersion},dispatchEvent:e=>events.push(e.type)}:null;
    const events=[],files=[],messages=[];
    const origin='https://weishuxieyiwangye.cn:8443',version='0.3.7';
    const document={scripts:ready?[{src:origin+'/js/main.js'}]:[],getElementById:()=>host,querySelector:()=>null};
    const window={};window.top=window;
    const sandbox={document,window,navigator:{userAgent:desktop?'Electron/40 SPDesktop/1.0.10 BundledAssets/2':'Chrome/145'},
      location:{origin,href:origin+'/game/'},URL,console,Map,Set,Promise,Uint8Array,Date,
      CustomEvent:class{constructor(type){this.type=type;}},crypto:{getRandomValues:bytes=>bytes.fill(7)},
      setTimeout,clearTimeout,__SP__:ready?{version:1,store:{get(){throw Error('game store must not be read by background');},subscribe(){}},net:{request(){throw Error('real game intent forbidden');}}}:null};
    const chrome={runtime:{getManifest:()=>({version}),onMessage:{addListener:fn=>{listener=fn;}}},
      scripting:{async executeScript(spec){
        if(spec.files){files.push(...spec.files);await Promise.resolve();
          if(spec.files.includes('content-script.js'))host={dataset:{weiVersion:version},dispatchEvent:e=>events.push(e.type)};
          return [{result:undefined}];}
        return [{result:await spec.func(...(spec.args || []))}];
      }},action:{async setBadgeText(){},async setBadgeBackgroundColor(){},async setTitle(){},onClicked:{addListener:fn=>{clicked=fn;}}},storage:{}};
    sandbox.chrome=chrome;install(sandbox);
    function command(type,extra={}){return new Promise(resolve=>listener({type},
      {tab:{id:5,url:origin+'/game/'},url:origin+'/game/',frameId:0,...extra},reply=>{messages.push(reply);resolve(reply);}));}
    return {command,events,files,messages,clicked:()=>clicked({id:5,url:origin+'/game/'}),
      setReady(){document.scripts=[{src:origin+'/js/main.js'}];sandbox.__SP__={version:1,store:{get(){},subscribe(){}},net:{request(){throw Error('game intent forbidden');}}};}};
  }
  let f=fixture();let reply=await f.command('desktop.ensureWorkbench');
  check('Electron自动初始化安装MAIN与工作台各一次',reply.ok===true&&f.files.join(',')==='runtime-main.js,content-script.js',JSON.stringify(reply));
  reply=await f.command('desktop.ensureWorkbench');
  check('重复自动初始化不重复安装且不切换显示',reply.ok===true&&f.files.length===2&&f.events.length===0);
  reply=await f.command('desktop.openWorkbench');
  check('初始化后真实入口请求沿用展开收起',reply.ok===true&&f.events.join(',')==='wei:toggle'&&f.files.length===2);
  f=fixture();const pair=await Promise.all([f.command('desktop.ensureWorkbench'),f.command('desktop.ensureWorkbench')]);
  check('并发自动请求串行化，只安装一份工作台',pair.every(x=>x.ok)&&f.files.length===2&&f.events.length===0);
  f=fixture({desktop:false});reply=await f.command('desktop.ensureWorkbench');
  check('普通Chrome不允许自动初始化路径',reply.ok===false&&f.files.length===0);
  reply=await f.command('desktop.openWorkbench');check('普通Chrome手动打开路径仍可用',reply.ok===true&&f.files.length===2);
  f=fixture();reply=await f.command('desktop.ensureWorkbench',{frameId:3});
  check('子框架不得请求自动初始化',reply.ok===false&&f.files.length===0);
  f=fixture({ready:false});reply=await f.command('desktop.ensureWorkbench');
  check('游戏接口未就绪时不注入运行脚本',reply.ok===false&&f.files.length===0);
  f.setReady();reply=await f.command('desktop.ensureWorkbench');
  check('接口稍后就绪可安全重新初始化',reply.ok===true&&f.files.length===2);
  f=fixture({hostVersion:'0.3.0'});reply=await f.command('desktop.ensureWorkbench');
  check('旧版工作台阻止自动覆盖，不擅自刷新或切换',reply.ok===false&&f.files.length===0&&f.events.length===0);
  f=fixture();reply=await f.command('desktop.ensureWorkbench',{tab:{id:undefined,url:'file:///launcher.html'}});
  check('无有效游戏标签页不注入',reply.ok===false&&f.files.length===0);
  return results;
}
