// Pure static snapshots. No browser store, network, storage or game commands are used.
export function runCoinStaticCases({ inspectMatch, auditPurchase, auditCoinUse }) {
  const SWIRE='chess_char_3_03_a', COIN='chess_item_1_03_e_a', GOLD='chess_item_1_03_e_b', OTHER='chess_char_1_01_a';
  const chess=Object.fromEntries([SWIRE,OTHER].map(id=>[id,{baseId:id,goldenId:id.replace(/_a$/,'_b'),isGolden:false,upgradeNum:3}]));
  const op=(uid,id=OTHER)=>({uid,id,kind:'chess',items:[]});
  const item=(uid,id=COIN)=>({uid,id,kind:'item'});
  const snap=({coins=[],funds=10,bought=false,extra=[],targetItems=[],bonds}={})=>inspectMatch({
    connection:{status:'online'},ui:{},me:{playerId:'static'},room:{code:'static',inMatch:true,seats:[{playerId:'static'}]},
    match:{public:{phase:'PREP',round:1,players:[{playerId:'static',autoplay:false}]},private:{alive:true,ready:false,funds,bonds,
      hand:[{...op(1),items:targetItems},...coins,...extra,...(bought?[op(100,SWIRE)]:[])],board:[],temp:[],
      shop:{slots:[{id:SWIRE,kind:'chess',price:1,sold:bought}],level:2,refreshPrice:1,rewardOffer:null}}}},chess);
  const candidate={id:SWIRE,base:SWIRE,slot:0,price:1};
  const purchase=(before,after)=>auditPurchase(before,after,candidate,{buy:[SWIRE],keep:[]},chess);
  const results=[];
  function check(name,actual,expected){const pass=Object.entries(expected).every(([key,value])=>actual?.[key]===value);results.push({name,pass,expected,actual});}
  check('普通诗怀雅赠币',purchase(snap(),snap({coins:[item(20)],funds:9,bought:true})),{ok:true});
  check('赠币合并生成新UID',purchase(snap({coins:[item(20)]}),snap({coins:[item(22,GOLD)],funds:9,bought:true})),{ok:true});
  check('赠币合并复用旧UID',purchase(snap({coins:[item(20)]}),snap({coins:[item(20,GOLD)],funds:9,bought:true})),{ok:true});
  check('赠币之外的未知装备仍拒绝',purchase(snap(),snap({coins:[item(20),item(30,'unknown_item')],funds:9,bought:true})),{ok:false});
  check('金币无来源变形仍拒绝',purchase(snap({coins:[item(20,GOLD)]}),snap({coins:[item(20)],funds:9,bought:true})),{ok:false});
  // Live 0.3.4 failure: 投资人 367 layers repeats SERVER_GAIN three times.
  const investor=(layers=367,active=true)=>[{bondId:'investShip',active,layers}];
  const doubled=investor(99),tripled=investor();
  check('投资人未激活仍只赠1枚',purchase(snap({bonds:investor(367,false)}),snap({bonds:investor(367,false),coins:[item(20)],funds:9,bought:true})),{ok:true});
  check('投资人99层赠2枚合1金币',purchase(snap({bonds:doubled}),snap({bonds:doubled,coins:[item(20,GOLD)],funds:9,bought:true})),{ok:true});
  check('投资人99层赠2普通币待合成',purchase(snap({bonds:doubled}),snap({bonds:doubled,coins:[item(20),item(21)],funds:9,bought:true})),{ok:true});
  check('投资人367层赠3枚合成金加普通',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(365,GOLD),item(366)],funds:9,bought:true})),{ok:true});
  check('投资人100层边界赠3枚',purchase(snap({bonds:investor(100)}),snap({bonds:investor(100),coins:[item(365,GOLD),item(366)],funds:9,bought:true})),{ok:true});
  check('投资人3次赠币保留3个普通UID',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(20),item(21),item(22)],funds:9,bought:true})),{ok:true});
  check('投资人3枚与旧普通合成2金币复用UID',purchase(snap({bonds:tripled,coins:[item(20)]}),snap({bonds:tripled,coins:[item(20,GOLD),item(22,GOLD)],funds:9,bought:true})),{ok:true});
  check('投资人3枚与旧普通合成2金币新UID',purchase(snap({bonds:tripled,coins:[item(20)]}),snap({bonds:tripled,coins:[item(21,GOLD),item(22,GOLD)],funds:9,bought:true})),{ok:true});
  check('投资人赠币时旧金币保持',purchase(snap({bonds:tripled,coins:[item(19,GOLD)]}),snap({bonds:tripled,coins:[item(19,GOLD),item(21,GOLD),item(22)],funds:9,bought:true})),{ok:true});
  check('无投资人不能凭空赠3枚',purchase(snap(),snap({coins:[item(21,GOLD),item(22)],funds:9,bought:true})),{ok:false});
  check('投资人3次却只得到1枚仍拒绝',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(20)],funds:9,bought:true})),{ok:false});
  check('投资人3次却只得到2枚仍拒绝',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(20,GOLD)],funds:9,bought:true})),{ok:false});
  check('投资人3次却未收到赠币仍拒绝',purchase(snap({bonds:tripled}),snap({bonds:tripled,funds:9,bought:true})),{ok:false});
  check('投资人赠币旧金币丢失仍拒绝',purchase(snap({bonds:tripled,coins:[item(19,GOLD)]}),snap({bonds:tripled,coins:[item(21,GOLD),item(22)],funds:9,bought:true})),{ok:false});
  check('投资人赠币混入未知装备仍拒绝',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(21,GOLD),item(22),item(23,'unknown_item')],funds:9,bought:true})),{ok:false});
  check('投资人层数未知仍拒绝',purchase(snap({bonds:investor('367')}),snap({bonds:investor('367'),coins:[item(21,GOLD),item(22)],funds:9,bought:true})),{ok:false});
  check('投资人记录重复仍拒绝',purchase(snap({bonds:[...tripled,...tripled]}),snap({bonds:[...tripled,...tripled],coins:[item(21,GOLD),item(22)],funds:9,bought:true})),{ok:false});
  check('投资人倍率购买期间漂移仍拒绝',purchase(snap({bonds:doubled}),snap({bonds:tripled,coins:[item(20,GOLD)],funds:9,bought:true})),{ok:false});
  check('未合币却更换旧普通UID仍拒绝',purchase(snap({bonds:tripled,coins:[item(19)]}),snap({bonds:tripled,coins:[item(20),item(21),item(22),item(23)],funds:9,bought:true})),{ok:false});
  check('旧未知装备不能转为赠币',purchase(snap({bonds:tripled,coins:[item(19,'unknown_item')]}),snap({bonds:tripled,coins:[item(19,GOLD),item(20)],funds:9,bought:true})),{ok:false});
  check('投资人3次多赠到4枚仍拒绝',purchase(snap({bonds:tripled}),snap({bonds:tripled,coins:[item(20,GOLD),item(21,GOLD)],funds:9,bought:true})),{ok:false});
  check('投资人负层数仍拒绝',purchase(snap({bonds:investor(-1)}),snap({bonds:investor(-1),coins:[item(20)],funds:9,bought:true})),{ok:false});
  const before=snap({coins:[item(20)]});
  check('普通币直接使用',auditCoinUse(before,snap({funds:11}),before.unitByUid.get(1),before.itemByUid.get(20)),{ok:true,gain:1});
  const gb=snap({coins:[item(20,GOLD)]});
  check('金币直接使用',auditCoinUse(gb,snap({funds:12}),gb.unitByUid.get(1),gb.itemByUid.get(20)),{ok:true,gain:2});
  for(const uid of [20,21,22]){
    const mb=snap({coins:[item(20),item(21)]});
    check('用币触发合并，输出UID '+uid,auditCoinUse(mb,snap({coins:[item(uid,GOLD)]}),mb.unitByUid.get(1),mb.itemByUid.get(20)),{ok:true,gain:0,merged:true});
  }
  check('使用资金不符仍拒绝',auditCoinUse(before,snap({funds:12}),before.unitByUid.get(1),before.itemByUid.get(20)),{ok:false});
  check('使用时未知装备新增仍拒绝',auditCoinUse(before,snap({funds:11,coins:[item(30,'unknown_item')]}),before.unitByUid.get(1),before.itemByUid.get(20)),{ok:false});
  check('使用时干员装备改变仍拒绝',auditCoinUse(before,snap({funds:11,targetItems:[item(30,'unknown_item')]}),before.unitByUid.get(1),before.itemByUid.get(20)),{ok:false});
  const full=snap({coins:[item(20)],targetItems:[item(30,'a'),item(31,'b')]});
  check('满装备目标仍拒绝',auditCoinUse(full,snap({funds:11,targetItems:[item(30,'a'),item(31,'b')]}),full.unitByUid.get(1),full.itemByUid.get(20)),{ok:false});
  return results;
}
