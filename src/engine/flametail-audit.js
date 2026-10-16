import { normalizeActionRefill } from './action-overflow.js';
import { sameUnitWithPlacement } from './placement.js';
import { isPackagingMergeOffer } from './packaging.js';

// Shared by MAIN and the isolated controller. No requests and no caller-supplied UID exemptions.
const FLAMETAIL_AUDIT_ID='chess_char_4_19_a';
const FLAMETAIL_AUDIT_GIFTS=['chess_char_1_19_a','chess_char_2_18_a','chess_char_4_20_a'];
const FLAMETAIL_AUDIT_MAX_GIFTS=3; // Existing supported normal / investor repeated-gain envelope.
function auditFlametailPurchaseSettled(before,after,candidate,{chess={}}={}) {
  const fail=reason=>({ok:false,reason});
  if(!before?.ok || !after?.ok || before.identity!==after.identity || before.rewardOffer ||
    candidate?.id!==FLAMETAIL_AUDIT_ID)return fail('焰尾购买期间对局或原奖励状态不一致');
  const original=before.slots?.[candidate.slot], current=after.slots?.[candidate.slot];
  if(!Number.isInteger(candidate.slot) || !original || original.kind!=='chess' || original.sold===true ||
    original.id!==candidate.id || original.price!==candidate.price || !current || current.kind!=='chess' ||
    current.id!==candidate.id || current.sold!==true || !Number.isSafeInteger(candidate.price) || candidate.price<0 ||
    !Number.isSafeInteger(before.funds) || !Number.isSafeInteger(after.funds) ||
    after.funds<before.funds-candidate.price)return fail('焰尾购买的槽位、实价或资金变化无法核验');
  if(before.slots.length!==after.slots.length || before.shopLevel!==after.shopLevel ||
    before.slots.some((slot,index)=>index!==candidate.slot &&
      (slot?.id!==after.slots[index]?.id || slot?.kind!==after.slots[index]?.kind ||
      slot?.price!==after.slots[index]?.price || (slot?.sold===true)!==(after.slots[index]?.sold===true))))
    return fail('焰尾购买期间其他商店槽位或调度中心等级发生变化');
  const fresh=after.units.filter(unit=>!before.unitByUid.has(unit.uid));
  const parents=fresh.filter(unit=>unit.id===FLAMETAIL_AUDIT_ID);
  if(parents.length!==1 || parents[0].base!==FLAMETAIL_AUDIT_ID || parents[0].golden ||
    parents[0].equipped!==0 || !['hand','temp','board'].includes(parents[0].area))
    return fail('焰尾本体不是唯一可核验的新普通 UID；未授权出售');
  const parent=parents[0], gifts=fresh.filter(unit=>unit.uid!==parent.uid);
  const missing=before.units.filter(unit=>!after.unitByUid.has(unit.uid));
  if(gifts.length<1 || gifts.length>FLAMETAIL_AUDIT_MAX_GIFTS || gifts.some(unit=>
    !FLAMETAIL_AUDIT_GIFTS.includes(unit.base) || unit.equipped!==0 ||
    !['hand','temp','board'].includes(unit.area)))return fail('焰尾新增赠员数量、来源或装备无法核验');
  // No in-place ID mutation, disappearance of another operator, or loss of an old elite is exempted.
  if(missing.some(unit=>!FLAMETAIL_AUDIT_GIFTS.includes(unit.base) || unit.id!==unit.base || unit.golden) ||
    before.units.some(unit=>after.unitByUid.has(unit.uid) &&
      !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
    return fail('焰尾买入已发生，但合成以外的旧干员 UID、身份或装备变化；未授权出售');
  const consumed=new Set(), merges=[];
  let generated=0;
  for(const gift of gifts) {
    const normal=chess[gift.base], record=chess[gift.id];
    if(!normal || normal.isGolden===true || !record)return fail('焰尾赠员的本服图鉴不完整');
    if(!gift.golden) {
      if(gift.id!==gift.base || record.isGolden===true)return fail('焰尾普通赠员的 ID 或精锐状态不一致');
      generated++;continue;
    }
    const need=Number.isInteger(normal.upgradeNum) && normal.upgradeNum>1 ? normal.upgradeNum : 3;
    const old=missing.filter(unit=>unit.base===gift.base);
    if(need!==3 || normal.goldenId!==gift.id || record.isGolden!==true ||
      old.length>=need || merges.length || old.some(unit=>consumed.has(unit.uid)))
      return fail('焰尾赠员不是唯一可归属的三合一；多重或未知合成请手动处理');
    generated+=need-old.length;
    for(const unit of old)consumed.add(unit.uid);
    // User-authorized Flametail exception: the uniquely proven NEW elite may be sold
    // even when its merge consumed old normal gifts. No existing elite UID is authorized.
    merges.push({base:gift.base,uid:gift.uid,consumedUids:old.map(unit=>unit.uid),newCopies:need-old.length});
  }
  if(generated<1 || generated>FLAMETAIL_AUDIT_MAX_GIFTS || missing.some(unit=>!consumed.has(unit.uid)))
    return fail('焰尾赠员三合一的旧 UID 和新增份数无法完整对应；未授权出售');
  if(FLAMETAIL_AUDIT_GIFTS.some(id=>after.units.filter(unit=>unit.base===id && !unit.golden).length>=
    (Number.isInteger(chess[id]?.upgradeNum) && chess[id].upgradeNum>1 ? chess[id].upgradeNum : 3)))
    return fail('焰尾普通赠员仍达到合成数量，库存可能尚未结算；已停止');
  const mergedGift=merges.length===1;
  if(mergedGift ? !isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel) : !!after.rewardOffer)
    return fail('焰尾赠员合成的免费三选一来源、等阶或队列无法核验；请手动处理');
  // Every old item survives unchanged, except equipment on proven consumed carriers returning to bench.
  // No new item, item merge, replacement, or transfer to a new carrier is inferred from a chess merge.
  if(after.items.length!==before.items.length || after.items.some(item=>!before.itemByUid.has(item.uid)) ||
    before.items.some(item=>{
      const next=after.itemByUid.get(item.uid);
      if(!next || next.id!==item.id)return true;
      return consumed.has(item.carrierUid) ? !['hand','temp'].includes(next.area) || next.carrierUid!=null :
        next.area!==item.area || (next.carrierUid ?? null)!==(item.carrierUid ?? null);
    }))return fail('焰尾赠员合成的装备返还或旧道具 UID 无法核验；未授权出售');
  return {ok:true,parent,gifts,merged:false,mergedGift,coin:null,consumedUids:[...consumed],
    giftMerges:merges,generatedGifts:generated};
}

export function auditFlametailPurchase(before,after,candidate,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditFlametailPurchaseSettled(before,refill.after,candidate,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}
