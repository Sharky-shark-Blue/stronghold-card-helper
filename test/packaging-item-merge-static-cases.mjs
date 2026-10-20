// Pure, synthetic snapshots only; shared by Node tests and isolated Electron Console.
export function runPackagingItemMergeCases({inspectInventory,pickItemCandidate,auditItemPurchase,itemMergeRule,planItemMerge}){
 const ID='chess_item_5_07_e_a',GOLD='chess_item_5_07_e_b',ROLE='chess_fixture_carrier',OTHER='chess_item_fixture_other';
 const chess={[ROLE]:{baseId:ROLE,isGolden:false}},records={[ID]:{itemType:'EQUIP',mergeable:true,upgradeNum:2,upgradeChessId:GOLD},[GOLD]:{itemType:'EQUIP',isGolden:true}};
 const merge=itemMergeRule(ID,id=>records[id]);
 function snapshot({area='board',sold=false,remove=false,output=false,itemId=ID,dropOther=false,funds=sold?7:10}={}){
  const priv={hand:[],board:[],temp:[]};priv[area].push({uid:7,id:ROLE,kind:'chess',items:[...(!remove?[{uid:20,id:itemId}]:[]),...(!dropOther?[{uid:21,id:OTHER}]:[])]});
  if(output)priv.hand.push({uid:100,id:GOLD,kind:'item'});
  return {...inspectInventory(priv,chess),identity:'static|me|1',funds,rewardOffer:null,slots:[{id:itemId,kind:'item',price:3,sold}]};
 }
 const rule=(extra={})=>({id:ID,sourceId:ID,name:'商业包装方案',limit:null,used:0,minFunds:null,ownedTarget:2,targetIds:[ID,GOLD],merge,...extra});
 const plan=(extra={})=>({items:[rule(extra)]}),results=[];
 function check(name,pass,detail=''){results.push({name,pass:!!pass,...(!pass?{detail}: {})});}
 const before=snapshot(),off=pickItemCandidate(before,plan()),on=pickItemCandidate(before,plan({allowEquippedMerge:true}));
 check('默认仍保护已装备普通包装，不因持有目标2隐式授权',off===null);
 check('明确授权后持有1<2可以买入，并绑定材料UID和原携带者',on?.merge?.consumed?.join(',')==='20'&&on.merge.equipped?.[0]?.carrierUid===7&&on.allowEquippedMerge===true);
 for(const area of ['board','hand','temp']){
  const b=snapshot({area}),chosen=pickItemCandidate(b,plan({allowEquippedMerge:true}));
  check('携带者在'+area+'时仅减少授权装备，合成产物可核对',auditItemPurchase(b,snapshot({area,sold:true,remove:true,output:true}),chosen).ok);
 }
 const after=snapshot({sold:true,remove:true,output:true});
 check('缺少专属授权的伪造已装备合成审计拒绝',!auditItemPurchase(before,after,{...on,allowEquippedMerge:false}).ok);
 check('携带者证明被篡改时审计拒绝',!auditItemPurchase(before,after,{...on,merge:{...on.merge,equipped:[{uid:20,carrierUid:8}]}}).ok);
 check('未消耗指定旧件时拒绝',!auditItemPurchase(before,snapshot({sold:true,output:true}),on).ok);
 check('原携带者额外丢失其他装备时拒绝',!auditItemPurchase(before,snapshot({sold:true,remove:true,output:true,dropOther:true}),on).ok);
 check('实际扣款不符时拒绝',!auditItemPurchase(before,snapshot({sold:true,remove:true,output:true,funds:6}),on).ok);
 const changed=structuredClone(after);changed.units[0].id='changed';changed.unitByUid.set(7,changed.units[0]);
 check('原携带者身份改变时拒绝',!auditItemPurchase(before,changed,on).ok);
 const wrongGold=structuredClone(after);wrongGold.items.find(i=>i.uid===100).id=OTHER;wrongGold.itemByUid.set(100,wrongGold.items.find(i=>i.uid===100));
 check('产物不是指定精锐包装时拒绝',!auditItemPurchase(before,wrongGold,on).ok);
 const misplaced=structuredClone(after);misplaced.items.find(i=>i.uid===100).area='equipped';misplaced.items.find(i=>i.uid===100).carrierUid=7;misplaced.itemByUid.set(100,misplaced.items.find(i=>i.uid===100));
 check('未预期的自动装备产物不冒充成功',!auditItemPurchase(before,misplaced,on).ok);
 check('其他装备不能伪造同意标志绕过保护',!planItemMerge(snapshot({itemId:OTHER}),OTHER,{mergeable:true,need:2,goldenId:'other_gold'},{allowEquippedMerge:true}).ok);
 check('包装精锐ID或合成数量异常时仍保护旧装备',!planItemMerge(before,ID,{mergeable:true,need:2,goldenId:'other_gold'},{allowEquippedMerge:true}).ok);
 check('未知合成规则时不因授权而下单',!planItemMerge(before,ID,null,{allowEquippedMerge:true}).ok);
 check('缺少原携带者快照时不下单',!planItemMerge({...before,unitByUid:new Map()},ID,merge,{allowEquippedMerge:true}).ok);
 check('累计抓取上限仍然生效',pickItemCandidate(before,plan({allowEquippedMerge:true,limit:2,used:2}))===null);
 check('资金严格门槛仍然生效',pickItemCandidate(before,plan({allowEquippedMerge:true,minFunds:10}))===null);
 const full=structuredClone(before);full.items.push({uid:22,id:GOLD,area:'hand',carrierUid:null});full.itemByUid.set(22,full.items.at(-1));
 check('实时持有达到2件后仍停止抓取',pickItemCandidate(full,plan({allowEquippedMerge:true}))===null);
 return results;
}
