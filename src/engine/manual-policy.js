import { auditPackagingSale } from './packaging.js';
import { itemUseRule, auditItemUse } from './item-policy.js';

// Only server-acknowledged native g.sell / g.equip requests enter this audit.
// An acknowledged request does not excuse unrelated inventory or shop changes.
export function auditManualTransaction(before,after,intent,{chess={},gameItems=null}={}) {
  const fail=reason=>({ok:false,reason});
  if(!before?.ok || !after?.ok || before.identity!==after.identity)return fail('手动操作期间对局或回合变化');
  if(JSON.stringify(before.slots)!==JSON.stringify(after.slots) || before.shopLevel!==after.shopLevel || before.refreshPrice!==after.refreshPrice)return fail('手动操作期间商店发生额外变化');
  const f=intent?.fields || {};
  if(intent?.type==='g.sell'){
    const sold=before.unitByUid.get(f.uid);if(!sold || after.unitByUid.has(f.uid))return fail('手动出售目标UID未确认消失');
    if(after.funds<before.funds)return fail('手动出售期间资金减少');
    // The native sale may destroy or return the sold carrier's equipment; it may not move it to another carrier.
    const equipped=new Set(before.items.filter(item=>item.carrierUid===sold.uid).map(item=>item.uid));
    for(const uid of equipped){const now=after.itemByUid.get(uid),old=before.itemByUid.get(uid);if(now&&(now.id!==old.id || !['hand','temp'].includes(now.area)))return fail('已出售干员的装备去向异常');}
    const filter=snap=>({...snap,items:snap.items.filter(item=>!equipped.has(item.uid)),itemByUid:new Map(snap.items.filter(item=>!equipped.has(item.uid)).map(item=>[item.uid,item]))});
    const checked=auditPackagingSale(filter(before),filter(after),sold.uid,{chess,gameItems});
    return checked.ok?{...checked,soldUid:sold.uid,soldId:sold.id}:checked;
  }
  if(intent?.type!=='g.equip')return fail('不允许此类手动变化');
  const item=before.itemByUid.get(f.itemUid),target=before.unitByUid.get(f.targetUid);
  if(!item || !target || !['hand','temp'].includes(item.area))return fail('手动装备来源或目标UID不明确');
  const body=gameItems?.items || gameItems;
  const lookup=id=>Array.isArray(body)?body.find(rec=>rec?.id===id):body?.[id];
  const rule=itemUseRule(item.id,lookup);
  if(rule?.usable){
    const checked=auditItemUse(before,after,{item,target,rule});
    if(!checked.ok)return checked;
    if(checked.fresh.length && !rule.destroysCarrier && !rule.promotes)return fail('消耗品产生了尚不能核验的额外干员');
    if(after.items.some(next=>!before.itemByUid.has(next.uid)))return fail('消耗品产生了未核验的新道具');
    for(const old of before.units){const next=after.unitByUid.get(old.uid);if(!next)continue;
      const promoted=old.uid===target.uid && rule.promotes && next.id===chess[old.id]?.goldenId && next.golden;
      if(!promoted && (next.id!==old.id || next.golden!==old.golden))return fail('使用道具时旧干员发生未知变形');
    }
    for(const old of before.items){if(old.uid===item.uid)continue;const next=after.itemByUid.get(old.uid);
      if(old.area==='equipped' && !after.unitByUid.has(old.carrierUid)){
        if(!next || !['hand','temp'].includes(next.area))return fail('被消耗干员的旧装备去向不明');
      }else if(!next || (old.area==='equipped' || next.area==='equipped') && (old.area!==next.area || old.carrierUid!==next.carrierUid))return fail('使用道具时其他装备发生变化');
    }
    const kept=after.itemByUid.get(item.uid);if(kept && kept.id!==item.id)return fail('使用道具后源装备ID变化');
    return {...checked,targetUid:target.uid,consumable:true};
  }
  const now=after.itemByUid.get(item.uid),carrier=after.unitByUid.get(target.uid);
  if(!now || now.id!==item.id || now.area!=='equipped' || now.carrierUid!==target.uid || !carrier || carrier.id!==target.id || carrier.golden!==target.golden)return fail('装备未进入指定干员，或目标出现未知变化');
  if(before.funds!==after.funds || after.rewardOffer || before.units.length!==after.units.length)return fail('普通装备期间资金、奖励或干员数量发生额外变化');
  for(const old of before.units){const next=after.unitByUid.get(old.uid);if(!next || next.id!==old.id || next.golden!==old.golden || old.uid!==target.uid && next.equipped!==old.equipped)return fail('装备期间其他干员发生变化');}
  const lost=[];
  for(const old of before.items){if(old.uid===item.uid)continue;const next=after.itemByUid.get(old.uid);
    if(!next){lost.push(old);continue;}
    if(next.id!==old.id || next.area==='equipped' && (old.area!=='equipped'||next.carrierUid!==old.carrierUid) || old.area==='equipped'&&next.area!=='equipped')return fail('装备期间其他道具发生变化');
  }
  if(lost.length>1 || lost.some(old=>old.carrierUid!==target.uid || old.uid!==f.replaceUid))return fail('非本次替换目标的装备丢失');
  if(Number.isInteger(f.replaceUid) && before.itemByUid.has(f.replaceUid) && after.itemByUid.has(f.replaceUid))return fail('指定替换的旧装备未消耗');
  if(after.items.some(next=>!before.itemByUid.has(next.uid)))return fail('普通装备期间出现额外道具');
  return {ok:true,targetUid:target.uid};
}
