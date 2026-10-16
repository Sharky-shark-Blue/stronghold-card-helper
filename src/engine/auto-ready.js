// Independent endless-mode ready scheduler. Never arms on load or retries an uncertain round.
export function createAutoReady({read,getOptions,available,tradeBusy,handoff,acquireLock,prepare,claim,audit,onStatus}) {
  let running=false,busy=false,generation=0,timer=null,owner='',stable='',stableAt=0,lastMessage='已关闭';
  const attempted=new Set();
  const who=s=>`${s?.room?.code || ''}|${s?.me?.playerId || ''}`;
  function report(message){lastMessage=message;onStatus?.({readyRunning:running,readyBusy:busy,readyMessage:message});}
  function stop(message='已关闭自动准备；已发出的准备指令仍可能生效'){
    running=false;generation++;clearInterval(timer);timer=null;stable='';report(message);
  }
  function valid(s){return s?.connection?.status==='online' && !s?.ui?.buildStale && s?.readySupported===true &&
    s?.match?.private?.alive===true && s?.room?.inMatch===true && typeof s.room.code==='string' && typeof s?.me?.playerId==='string' &&
    s.room.seats?.some(x=>x?.playerId===s.me.playerId) && s?.match?.private?.alive!==false &&
    s?.match?.public?.players?.some(x=>x?.playerId===s.me.playerId && x.autoplay!==true);}
  async function tick(){
    if(!running || busy)return;
    let release=null,dispatch=false;
    const ticket=generation;
    try{
      const s=read();
      if(!available() || !valid(s) || who(s)!==owner){stop('自动准备已停止：连接、自检、座位或对局状态变化');return;}
      const p=s.match.private,pub=s.match.public,o=getOptions();
      if(o.confirmed===false){stable='';report('等待准备设置保存');return;}
      if(pub.phase!=='PREP'){stable='';report('等待下一次整备');return;}
      if(!Number.isSafeInteger(pub.round) || pub.round<1 || !Number.isSafeInteger(p.funds) || p.funds<0){stop('回合或资金状态无效，自动准备已停止');return;}
      if(p.ready===true){report('本回合已准备，等待下一回合');return;}
      if(p.ready!==false){stop('准备状态不明确，自动准备已停止');return;}
      if(o.skipTenth && pub.round%10===0){stable='';report(`第 ${pub.round} 回合跳过，等待你手动准备`);return;}
      if(o.funds!==null && p.funds>o.funds){stable='';report(`等待资金 ≤ ${o.funds}（当前 ${p.funds}）`);return;}
      if(p.shop?.rewardOffer?.slots?.length || !Array.isArray(p.temp) || p.temp.length){stable='';report('等待处理奖励或临时区');return;}
      if(tradeBusy()){stable='';report('等待在途交易核对完成');return;}
      const identity=`${owner}|${pub.round}`,key=`${o.epoch}|${identity}`,stamp=JSON.stringify(p),quiet=key+'|'+stamp+'|'+JSON.stringify([o.funds,o.skipTenth]);
      if(attempted.has(key)){report('本回合已尝试准备，不重复发送');return;}
      if(stable!==quiet){stable=quiet;stableAt=Date.now();report('条件已满足，等待状态稳定');return;}
      if(Date.now()-stableAt<750)return;
      busy=true;report('正在核对并提交准备');
      // Stop only after every condition is met; no new trades may start during this handoff.
      handoff();release=await acquireLock();
      if(!running || generation!==ticket)return;
      const latest=read(),now=getOptions();
      if(!available() || !valid(latest) || who(latest)!==owner || latest.match.public.phase!=='PREP' ||
        latest.match.public.round!==pub.round || JSON.stringify(latest.match.private)!==stamp ||
        now.confirmed===false || now.epoch!==o.epoch || now.funds!==o.funds || now.skipTenth!==o.skipTenth || tradeBusy())throw new Error('提交前状态或设置改变，本次未准备');
      await audit('ready_request',`自动准备：第 ${pub.round} 回合，资金 ${p.funds}`);
      if(!running || generation!==ticket)return;
      const fresh=await claim(key);attempted.add(key);if(attempted.size>128)attempted.delete(attempted.values().next().value);
      if(!fresh){report('本回合已有准备记录，不重复发送');return;}
      if(!running || generation!==ticket)return;
      const finalOptions=getOptions();
      if(!available() || !valid(read()) || finalOptions.confirmed===false || finalOptions.epoch!==o.epoch || finalOptions.funds!==o.funds || finalOptions.skipTenth!==o.skipTenth)throw new Error('准备设置已变化；本轮不重试');
      dispatch=true;
      await prepare({identity,stamp,maximumFunds:o.funds,skipTenth:o.skipTenth});
      await audit('ready_ok',`第 ${pub.round} 回合准备已确认`);
      if(running && generation===ticket)report('已准备，等待下一回合');
    }catch(error){stop(`${error?.message || '自动准备异常'}${dispatch?'；指令可能已生效，本轮不重试':''}`);}
    finally{release?.();if(busy){busy=false;report(lastMessage);}}
  }
  function start(){
    if(busy)throw new Error('上一笔准备尚未核对完成');
    if(!available() || !valid(read()))throw new Error('准备接口、自检、座位或连接未就绪');
    owner=who(read());running=true;generation++;stable='';report('已手动开启自动准备（无尽用）');
    clearInterval(timer);timer=setInterval(()=>void tick(),400);void tick();
  }
  return {start,stop,get running(){return running;},get busy(){return busy;}};
}
