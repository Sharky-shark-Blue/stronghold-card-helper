// Passive accounting: never sends, retries, blocks or authorizes a game action.
// Native result.js labels private.stats.gold as “消耗资金”. It is cumulative spending,
// not balance or income, so refunds, sale proceeds and acquisition bonuses cannot cancel it.
export function createRoundTradeStats({read,onChange}) {
  const key='wei.round.trades.v1';
  const amount=value=>Number.isSafeInteger(value)&&value>=0;
  let current=null,seen=false,countsSupported=false;
  const pending=new Set();
  const identity=s=>s?.room?.inMatch && typeof s.room.code==='string' && typeof s?.me?.playerId==='string' && Number.isSafeInteger(s?.match?.public?.round) && s.match.public.round>0 ? `${s.room.code}|${s.me.playerId}|${s.match.public.round}` : '';
  let saved=null;
  try{saved=JSON.parse(sessionStorage.getItem(key) || 'null');}catch{}
  function persist(){try{if(current)sessionStorage.setItem(key,JSON.stringify(current));else sessionStorage.removeItem(key);}catch{/* accounting must never affect a request */}}
  function changed(){try{onChange?.();}catch{}}
  function observe(s){
    const id=identity(s),gold=s?.match?.private?.stats?.gold;
    if(!id){if(current){current=null;persist();}seen=true;return;}
    if(current?.identity!==id){
      const restored=!seen && saved?.identity===id && ['bought','sold','spent','uncertain'].every(k=>amount(saved[k])) && (saved.lastGold===null || amount(saved.lastGold));
      current=restored?{...saved,partial:true}:{identity:id,round:s.match.public.round,bought:0,sold:0,spent:0,lastGold:amount(gold)?gold:null,uncertain:0,partial:!seen};
      seen=true;saved=null;persist();
    }
    let dirty=false;
    if(s?.connection?.status!=='online' && !current.partial){current.partial=true;dirty=true;}
    if(amount(gold)){
      if(current.lastGold!==null && gold<current.lastGold){current.bought=0;current.sold=0;current.spent=0;current.partial=true;current.uncertain++;dirty=true;}
      if(current.lastGold!==null && gold>current.lastGold){current.spent+=gold-current.lastGold;dirty=true;}
      if(current.lastGold!==gold){current.lastGold=gold;dirty=true;}
    }else if(current.lastGold!==null){current.lastGold=null;current.partial=true;dirty=true;}
    if(dirty)persist();
  }
  function uncertain(id){if(current?.identity!==id)return;current.uncertain++;current.partial=true;persist();changed();}
  async function track(type,fields,dispatch){
    let ticket=null;
    try{
      const state=read();observe(state);
      const id=identity(state),p=state?.match?.private;
      if(id && ['g.buy','g.sell','g.refresh','g.levelUp'].includes(type)){
        const slot=p?.shop?.slots?.[fields?.slot];
        const unit=[...(p?.hand || []),...(p?.board || []),...(p?.temp || [])].find(x=>x?.uid===fields?.uid);
        ticket={id,type,buy:type==='g.buy' && slot?.sold!==true && slot?.kind==='chess',sell:type==='g.sell'&&unit?.kind==='chess',
          ambiguous:type==='g.buy' && (pending.size>0 || !slot || slot.sold===true)};
        // A refresh/level-up or another buy already in flight may change the slot's kind.
        if(ticket.ambiguous)for(const older of pending)if(older.type==='g.buy')older.ambiguous=true;
        pending.add(ticket);
      }
    }catch{/* never turn a successful native transaction into a failed one */}
    let result;
    try{result=await dispatch();}
    catch(error){if(ticket){pending.delete(ticket);if(['g.buy','g.sell'].includes(type))uncertain(ticket.id);}throw error;}
    try{
      observe(read());
      if(ticket && current?.identity===ticket.id){
        if(ticket.ambiguous || type==='g.sell'&&!ticket.sell)uncertain(ticket.id);
        else if(ticket.buy || ticket.sell){current[ticket.buy?'bought':'sold']++;persist();changed();}
      }
    }catch{}
    finally{if(ticket)pending.delete(ticket);}
    return result;
  }
  observe(read());
  return {observe,track,setCountsSupported(value){countsSupported=value===true;if(countsSupported){observe(read());if(current){current.partial=true;persist();}}},read(){return current?{round:current.round,bought:current.bought,sold:current.sold,spent:current.spent,partial:current.partial,uncertain:current.uncertain,countsSupported,spendAvailable:current.lastGold!==null}:null;}};
}
