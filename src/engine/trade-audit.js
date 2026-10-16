import { sameUnitWithPlacement, compatiblePlacementArea } from './placement.js';
import { isPackagingMergeOffer } from './packaging.js';

// Shared pure trade evidence. Both the isolated controller and MAIN compile this module.
// A retained merge is attributable only when one new normal completes these exact old copies.
export function planRetainedMerge(ctx, id, chess) {
  const rec=chess?.[id], base=rec?.baseId && chess[rec.baseId] ? rec.baseId : id;
  if(!ctx?.ok || !rec || rec.isGolden===true || id!==base || !chess[rec.goldenId]?.isGolden) return null;
  const need=Number.isInteger(rec.upgradeNum) && rec.upgradeNum>1 ? rec.upgradeNum : 3;
  if(need>99)return null;
  const old=ctx.units.filter(unit=>unit.base===base && !unit.golden);
  if(old.length!==need-1 || old.some(unit=>unit.id!==id))return null;
  return {base,normalId:id,goldenId:rec.goldenId,need,consumed:old.map(unit=>unit.uid)};
}

export function auditOrdinaryPurchase(before, after, candidate, {chess={}, retained=false}={}) {
  const fail=reason=>({ok:false,reason});
  if(!before?.ok || !after?.ok || before.identity!==after.identity || before.rewardOffer)
    return fail('普通购买期间对局或奖励状态不一致');
  const original=before.slots?.[candidate.slot], current=after.slots?.[candidate.slot];
  if(!original || original.kind!=='chess' || original.id!==candidate.id || original.sold===true ||
    original.price!==candidate.price || !current || current.kind!=='chess' ||
    current.id!==candidate.id || current.sold!==true || !Number.isSafeInteger(candidate.price) || candidate.price<0 ||
    !Number.isSafeInteger(before.funds) || !Number.isSafeInteger(after.funds) || after.funds<before.funds-candidate.price)
    return fail('普通购买的槽位、实价或资金变化无法核验');
  if(before.slots.length!==after.slots.length || before.slots.some((slot,index)=> index!==candidate.slot &&
    (slot?.id!==after.slots[index]?.id || slot?.kind!==after.slots[index]?.kind ||
      slot?.price!==after.slots[index]?.price || (slot?.sold===true)!==(after.slots[index]?.sold===true))))
    return fail('普通购买期间其他商店槽位发生变化');
  const fresh=after.units.filter(unit=>!before.unitByUid.has(unit.uid));
  const missing=before.units.filter(unit=>!after.unitByUid.has(unit.uid));
  if(fresh.length!==1)return fail('普通购买不是唯一可归属的新干员 UID');
  const parent=fresh[0], merge=retained ? planRetainedMerge(before,candidate.id,chess) : null;
  const merged=!!merge && parent.id===merge.goldenId && parent.golden===true;
  const consumed=new Set(merged ? merge.consumed : []);
  if(merged ? missing.length!==consumed.size || missing.some(unit=>!consumed.has(unit.uid)) :
    missing.length!==0 || parent.id!==candidate.id)
    return fail('普通购买消耗的旧 UID 或新干员身份无法核验');
  if(parent.equipped!==0 || !['hand','temp','board'].includes(parent.area) ||
    parent.golden!==(chess[parent.id]?.isGolden===true))
    return fail('新购干员的位置、精锐状态或装备不符合预期');
  if(before.units.some(unit=>!consumed.has(unit.uid) && (()=>{
    const next=after.unitByUid.get(unit.uid);
    return !sameUnitWithPlacement(unit,next);
  })()))return fail('普通购买期间旧干员身份、位置或装备发生未知变化');
  if(merged ? !isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel) : !!after.rewardOffer)
    return fail('普通购买的合成奖励来源、等阶或队列无法核验');
  const gained=after.items.filter(item=>!before.itemByUid.has(item.uid));
  const lost=before.items.filter(item=>!after.itemByUid.has(item.uid));
  const bench=item=>!!item && ['hand','temp'].includes(item.area) && item.carrierUid==null;
  let coin=null, consumedCoin=null;
  // The one explicit item-gift exception: normal Swire's coin, or its exact bench merge.
  // Unexpected multi-gifts, equipped-coin merges and elite side effects remain blocked.
  if(candidate.id==='chess_char_3_03_a' && !merged) {
    if(gained.length===1 && gained[0].id==='chess_item_1_03_e_a' && bench(gained[0]) && !lost.length)
      coin={...gained[0],gain:1,merged:false};
    else if(gained.length===1 && gained[0].id==='chess_item_1_03_e_b' && bench(gained[0]) &&
      lost.length===1 && lost[0].id==='chess_item_1_03_e_a' && bench(lost[0])) {
      consumedCoin=lost[0].uid;
      coin={...gained[0],gain:2,merged:true,mergedFrom:consumedCoin};
    }
  }
  if(gained.length!==(coin ? 1 : 0) || lost.length!==(consumedCoin!==null ? 1 : 0))
    return fail('普通购买产生未知赠装或丢失旧装备；未授权出售');
  if(before.items.some(item=>{
    if(item.uid===consumedCoin)return false;
    const next=after.itemByUid.get(item.uid);
    return !next || next.id!==item.id || (consumed.has(item.carrierUid) ? !bench(next) :
      next.area!==item.area || (next.carrierUid ?? null)!==(item.carrierUid ?? null));
  }))return fail('普通购买期间旧装备迁移或合成返装无法核验');
  return {ok:true,parent,merged,mergedKeepReward:merged,consumedUids:[...consumed],coin};
}

// The stamp remains exact except for independently allowed hand/board placement of OTHER units.
export function tradeInventoryStamp(ctx) {
  return JSON.stringify({
    units:ctx.units.map(unit=>[unit.uid,unit.id,unit.base,unit.area,unit.golden,unit.equipped]).sort((a,b)=>a[0]-b[0]),
    items:ctx.items.map(item=>[item.uid,item.id,item.area,item.carrierUid ?? null]).sort((a,b)=>a[0]-b[0]),
  });
}
export function makeSaleIntent(ctx, uid) {
  const unit=ctx?.ok && ctx.unitByUid.get(uid);
  if(!unit || !Number.isInteger(uid) || !['hand','temp'].includes(unit.area) || unit.equipped!==0)return null;
  return {uid,id:unit.id,base:unit.base,area:unit.area,golden:unit.golden,equipped:0,
    identity:ctx.identity,funds:ctx.funds,inventoryStamp:tradeInventoryStamp(ctx)};
}
export function matchesSaleIntent(ctx, uid, expected) {
  if(!expected || typeof expected.inventoryStamp!=='string' || expected.inventoryStamp.length>100000)return false;
  const actual=makeSaleIntent(ctx,uid);
  if(!actual || !['uid','id','base','area','golden','equipped','identity','funds'].every(key=>actual[key]===expected[key]))return false;
  if(actual.inventoryStamp===expected.inventoryStamp)return true;
  try {
    const approved=JSON.parse(expected.inventoryStamp), current=JSON.parse(actual.inventoryStamp);
    return Array.isArray(approved.units) && Array.isArray(approved.items) &&
      approved.units.length===current.units.length && approved.units.every((unit,index)=>{
        const next=current.units[index];
        return Array.isArray(unit) && unit.length===6 && next?.length===6 &&
          [0,1,2,4,5].every(key=>unit[key]===next[key]) &&
          (unit[0]===uid ? unit[3]===next[3] : compatiblePlacementArea(unit[3],next[3]));
      }) && JSON.stringify(approved.items)===JSON.stringify(current.items);
  } catch { return false; }
}
