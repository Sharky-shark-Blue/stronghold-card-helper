import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const VERSION=JSON.parse(fs.readFileSync(new URL('../manifest.json',import.meta.url),'utf8')).version;
const code=fs.readFileSync(new URL('../runtime-main.js',import.meta.url),'utf8');
const COIN='chess_item_1_03_e_a',GOLD='chess_item_1_03_e_b',SWIRE='chess_char_3_03_a',ROLE='chess_char_1_19_a';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({mergeUid=null,giftReuse=false,full=false,investorLayers=null,giftCoins=null,coins=[{uid:20,id:COIN}]}={}){
  const chess=Object.fromEntries([ROLE,SWIRE,'chess_char_4_19_a',...Array.from({length:22},(_,i)=>'chess_fixture_'+i)].map(id=>[id,
    {baseId:id,isGolden:false,tier:1,visible:true,garrisonIds:[id===SWIRE?'swire':'passive']} ]));
  let state={connection:{status:'online'},ui:{},me:{playerId:'static'},room:{code:'static',inMatch:true,seats:[{playerId:'static'}]},
    match:{public:{phase:'PREP',round:1,players:[{playerId:'static',autoplay:false}]},private:{alive:true,ready:false,funds:10,
      bonds:investorLayers===null?undefined:[{bondId:'investShip',active:true,layers:investorLayers}],
      hand:[{uid:7,id:ROLE,kind:'chess',items:full?[{uid:30,id:'a'},{uid:31,id:'b'}]:[]},...coins.map(x=>({...x,kind:'item'}))],board:[],temp:[],
      shop:{level:2,refreshPrice:1,slots:[{id:SWIRE,kind:'chess',price:1,sold:false}],rewardOffer:null}}}};
  const listeners=new Set(),messages=[],receivers=new Set(),calls=[];
  const store={get:()=>state,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);}};
  const net={async request(type,fields){calls.push({type,fields});const next=structuredClone(state),p=next.match.private;
    if(type==='g.equip'){
      const coin=p.hand.find(x=>x.uid===fields.itemUid);if(!coin)throw new Error('missing');
      const pair=mergeUid!==null&&coin.id===COIN?p.hand.filter(x=>x.kind==='item'&&x.id===COIN):[];
      if(pair.length===2){p.hand=p.hand.filter(x=>!pair.some(y=>y.uid===x.uid));p.hand.push({uid:mergeUid,id:GOLD,kind:'item'});}
      else{p.hand=p.hand.filter(x=>x.uid!==coin.uid);p.funds+=coin.id===GOLD?2:1;}
    }else if(type==='g.buy'&&(giftReuse||giftCoins)){p.funds--;p.shop.slots[0].sold=true;p.hand.push({uid:100,id:SWIRE,kind:'chess',items:[]});if(giftReuse)p.hand.find(x=>x.uid===20).id=GOLD;if(giftCoins)p.hand.push(...giftCoins.map(x=>({...x,kind:'item'})));}
    else throw new Error('Unexpected static intent '+type);
    const before=state;state=next;for(const fn of [...listeners])fn(state,before);return {};
  }};
  const origin='https://static-coin.example',nonce='static-coin-test-nonce-123456789';
  const win={addEventListener(t,fn){if(t==='message')receivers.add(fn);},removeEventListener(t,fn){receivers.delete(fn);},postMessage(msg,target){assert.equal(target,origin);messages.push(msg);for(const fn of [...receivers])fn({source:win,origin,data:msg});}};
  const garrisons={passive:{eventType:'IN_BATTLE'},swire:{eventType:'SERVER_GAIN',effectKey:'SERVER_GAIN_EQUIP'}};
  const sandbox={window:win,document:{querySelector:()=>null},location:{origin,href:origin+'/game/'},__SP__:{version:1,store,net},
    __weiMainConfig:{root:origin+'/game/',nonce,version:VERSION},URL,console,setTimeout,clearTimeout,Promise,Map,Set,
    fetch:async url=>({ok:true,json:async()=>String(url).includes('garrisons.json')?garrisons:String(url).includes('items.json')?{}:chess})};
  vm.runInNewContext(code,sandbox);await tick();await tick();
  async function command(type,data){const rid='static-'+messages.length;win.postMessage({channel:'wei.runtime.v1',side:'ui',nonce,version:VERSION,type,rid,...data},origin);await tick();await tick();return messages.findLast(x=>x.type==='response'&&x.rid===rid);}
  return {command,calls,store,chess,view:()=>messages.findLast(x=>x.type==='snapshot')?.state,dispose:()=>sandbox.__weiMainBridge?.dispose()};
}
for(const uid of [20,21,22])test('生成的 MAIN：合并输出 UID '+uid+' 后继续使用金币',async()=>{
  const f=await fixture({mergeUid:uid,coins:[{uid:20,id:COIN},{uid:21,id:COIN}]});
  try{const merged=await f.command('coin',{itemUid:20,parentUid:7});assert.equal(merged?.ok,true,JSON.stringify(merged));assert.equal(merged.result.merged,true);assert.equal(merged.result.amount,0);assert.equal(merged.result.coinUid,uid);
    const used=await f.command('coin',{itemUid:uid,parentUid:7});assert.equal(used?.ok,true,JSON.stringify(used));assert.equal(used.result.amount,2);assert.equal(f.store.get().match.private.funds,12);assert.equal(f.calls.length,2);
  }finally{f.dispose();}
});
test('生成的 MAIN：诗怀雅赠币保留旧UID后可使用',async()=>{const f=await fixture({giftReuse:true});try{const bought=await f.command('buy',{slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]});assert.equal(bought?.ok,true,JSON.stringify(bought));const used=await f.command('coin',{itemUid:20,parentUid:7});assert.equal(used?.ok,true,JSON.stringify(used));assert.equal(f.store.get().match.private.funds,11);}finally{f.dispose();}});
test('生成的 MAIN：满装备目标不发送g.equip',async()=>{const f=await fixture({full:true});try{assert.equal((await f.command('coin',{itemUid:20,parentUid:7}))?.ok,false);assert.equal(f.calls.length,0);}finally{f.dispose();}});
test('生成的 MAIN：已消耗币不重复发送',async()=>{const f=await fixture();try{assert.equal((await f.command('coin',{itemUid:20,parentUid:7}))?.ok,true);assert.equal((await f.command('coin',{itemUid:20,parentUid:7}))?.ok,false);assert.equal(f.calls.length,1);}finally{f.dispose();}});
for(const spec of [
  {layers:99,coins:[{uid:20,id:GOLD}],gain:2},
  {layers:100,coins:[{uid:20,id:GOLD},{uid:21,id:COIN}],gain:3},
  {layers:367,coins:[{uid:20,id:GOLD},{uid:21,id:COIN}],gain:3},
])test('生成的 MAIN：投资人 '+spec.layers+' 层购买后全部赠币可用',async()=>{
  const f=await fixture({investorLayers:spec.layers,giftCoins:spec.coins,coins:[]});
  try{const bought=await f.command('buy',{slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]});assert.equal(bought?.ok,true,JSON.stringify(bought));
    assert.equal(f.view().match.private.bonds[0].layers,spec.layers);
    for(const coin of spec.coins)assert.equal((await f.command('coin',{itemUid:coin.uid,parentUid:7}))?.ok,true);
    assert.equal(f.store.get().match.private.funds,9+spec.gain);assert.equal(f.calls.length,1+spec.coins.length);
  }finally{f.dispose();}
});
test('生成的 MAIN：三次赠币加旧普通合2金币，复用UID后全部使用',async()=>{
  const f=await fixture({investorLayers:367,giftReuse:true,giftCoins:[{uid:22,id:GOLD}]});
  try{assert.equal((await f.command('buy',{slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]}))?.ok,true);
    for(const itemUid of [20,22])assert.equal((await f.command('coin',{itemUid,parentUid:7}))?.ok,true);
    assert.equal(f.store.get().match.private.funds,13);assert.equal(f.calls.length,3);
  }finally{f.dispose();}
});
test('生成的 MAIN：投资人三次赠币数量不足仍拒绝买后授权',async()=>{
  const f=await fixture({investorLayers:367,giftCoins:[{uid:20,id:GOLD}],coins:[]});
  try{const result=await f.command('buy',{slot:0,expectedId:SWIRE,expectedPrice:1,buy:[SWIRE],keep:[]});assert.equal(result?.ok,false);assert.match(result.reason,/赠币/);assert.equal(f.calls.length,1);}
  finally{f.dispose();}
});
