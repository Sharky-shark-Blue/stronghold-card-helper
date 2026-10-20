import { normalizeActionRefill } from './action-overflow.js';
import { sameUnitWithPlacement } from './placement.js';
// Only audited fresh packaging outputs may enter the automatic sale ledger.
function auditPackagingSaleSettled(before, after, uid, { chess = {}, gameItems = null } = {}) {
  const fail = reason => ({ ok:false, reason });
  if (!before?.ok || !after?.ok || before.identity !== after.identity) return fail('卖出期间对局已改变');
  const sold = before.unitByUid.get(uid);
  if (!sold || after.unitByUid.has(uid)) return fail('出售目标 UID 未唯一消失');
  const vanished = before.units.filter(unit => unit.uid !== uid && !after.unitByUid.has(unit.uid));
  const appeared = after.units.filter(unit => !before.unitByUid.has(unit.uid));
  if (!appeared.length && !vanished.length) {
    if(before.units.some(unit=>unit.uid!==uid &&
      !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
      return fail('出售期间旧干员发生未知变化；已停止');
    if((before.items || []).some(item=>{
      const next=after.itemByUid?.get(item.uid);
      return !next || next.id!==item.id || next.area!==item.area || next.carrierUid!==item.carrierUid;
    }) || (after.items || []).some(item=>!before.itemByUid?.has(item.uid)))
      return fail('出售期间装备发生未知变化；已停止');
    return {ok:true};
  }
  const body = gameItems?.items || gameItems;
  const records = new Map(Array.isArray(body) ? body.map(rec=>[rec?.id,rec]) : Object.entries(body || {}));
  const rules = [];
  for (const item of before.items || []) {
    if(item.area !== 'equipped' || item.carrierUid === uid)continue;
    const rec=records.get(item.id), carrier=before.unitByUid.get(item.carrierUid);
    const known=item.id==='chess_item_5_07_e_a' || item.id==='chess_item_5_07_e_b';
    const named=typeof rec?.name==='string' && rec.name.replace(/<[^>]*>/g,'').trim()==='商业包装方案';
    if((!known && !named) || !rec || !carrier || !chess[carrier.base])continue;
    const desc=typeof rec.desc==='string' ? rec.desc.replace(/<[^>]*>/g,'') : '';
    if(!/出售|卖出/.test(desc) || !/获得/.test(desc))continue;
    // The connected server's description chooses the variant, never a wiki or item-name guess.
    if(/同名/.test(desc))rules.push({base:carrier.base});
    else if(/同盟约/.test(desc) && Array.isArray(chess[carrier.base].bonds))
      rules.push({bonds:chess[carrier.base].bonds.filter(bond=>typeof bond==='string')});
  }
  if(!rules.length)return fail('出售后出现额外干员，但商业包装方案的本服效果无法核验；已停止，赠员未自动出售');
  if(appeared.length>rules.length)return fail('商业包装方案赠员数量超出可核验范围；未自动出售');
  // Old surviving UIDs must retain their identity and equipment; unknown transformations stay blocked.
  if(before.units.some(unit=>unit.uid!==uid && after.unitByUid.has(unit.uid) &&
    !sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
    return fail('包装赠员期间旧干员发生未知变化；未自动出售');
  const consumed=new Set(), packagingMerges=[];
  for(const gift of appeared){
    const rec=chess[gift.id], base=(typeof chess[gift.id]?.baseId==='string' ? chess[gift.id].baseId : gift.id), normal=chess[base];
    const rule=rules.findIndex(r=>r.base===base || r.bonds?.some(bond=>normal?.bonds?.includes(bond)));
    if(rule<0 || !rec || !normal || !['hand','temp','board'].includes(gift.area) || gift.equipped!==0)
      return fail('新增干员不符合本服商业包装方案的赠员效果；未自动出售');
    rules.splice(rule,1);
    if(gift.golden){
      const need=Number.isInteger(normal.upgradeNum) && normal.upgradeNum>1 ? normal.upgradeNum : 3;
      if(normal.goldenId!==gift.id || need>99)return fail('包装赠员的合成规则无法核验');
      const old=vanished.filter(unit=>!consumed.has(unit.uid) && unit.base===base && !unit.golden);
      if(old.length<need-1)return fail('包装赠员合成所消耗的普通干员无法核验');
      const parents=old.slice(0,need-1);
      for(const unit of parents)consumed.add(unit.uid);
      packagingMerges.push({uid:gift.uid,consumedUids:parents.map(unit=>unit.uid)});
    } else if(gift.id!==base)return fail('包装赠员不是可核验的初始同名干员');
  }
  if(vanished.some(unit=>!consumed.has(unit.uid)))return fail('除出售和包装赠员合成外，还有旧 UID 消失；已停止');
  // Every original item UID must survive. Proven consumed carriers may return equipment to hand/temp, never to another carrier.
  if((before.items || []).some(item=>item.carrierUid!==uid &&
    (after.itemByUid?.get(item.uid)?.id!==item.id || (consumed.has(item.carrierUid) ?
      !['hand','temp'].includes(after.itemByUid.get(item.uid).area) || after.itemByUid.get(item.uid).carrierUid!=null :
      after.itemByUid.get(item.uid).area!==item.area || (after.itemByUid.get(item.uid).carrierUid ?? null)!==(item.carrierUid ?? null)))))
    return fail('包装赠员期间旧装备发生未知变化；已停止');
  if((after.items || []).some(item=>!before.itemByUid?.has(item.uid)))
    return fail('包装赠员之外还产生了未知装备；已停止');
  const merged=vanished.length>0;
  const packagingReward=merged && isPackagingMergeOffer(after.rewardOffer,chess,before.shopLevel);
  const pineconeReward=!merged && sold.id==='chess_char_3_10_a' && isPineconeSaleOffer(after.rewardOffer,chess);
  if(after.rewardOffer && !packagingReward && !pineconeReward)return fail('包装赠员后奖励来源、等阶、候选或队列无法核验；未自动选卡');
  return {ok:true,packagingGifts:appeared,packagingMerged:merged,packagingMerges,packagingReward,pineconeReward};
}

// A fresh merged UID is NOT proof that its old ingredients were ours to sell.
// Keep/manual/board protection and unknown old ingredients must propagate to the output.
export function packagingGiftDisposition(audit,before,{keep=[],authorizedUids=[],protectedUids=[]}={}) {
  const queued=[],kept=[],authorized=new Set(authorizedUids),protectedSet=new Set(protectedUids),bases=new Set(keep);
  if(audit?.ok!==true || !before?.ok)return {queued,kept};
  for(const gift of audit.packagingGifts || []){
    const merged=audit.packagingMerges?.find(entry=>entry.uid===gift.uid);
    const safeMerge=!gift.golden || merged?.consumedUids?.length>0 && merged.consumedUids.every(uid=>
      authorized.has(uid) && !protectedSet.has(uid) && before.unitByUid.get(uid)?.equipped===0 &&
      ['hand','temp'].includes(before.unitByUid.get(uid)?.area));
    const safe=before.unitByUid.has(gift.uid)===false && ['hand','temp'].includes(gift.area) &&
      gift.equipped===0 && !bases.has(gift.base) && !protectedSet.has(gift.uid) && safeMerge;
    (safe ? queued : kept).push(gift);
  }
  return {queued,kept};
}

export function isPackagingMergeOffer(offer, chess, shopLevel) {
  return !!offer && Number.isInteger(shopLevel) && shopLevel>=1 && shopLevel<=6 &&
    offer.source==='merge' && offer.label==null && offer.queued===0 &&
    offer.tier===Math.min(shopLevel+1,6) && Array.isArray(offer.slots) && offer.slots.length===3 &&
    new Set(offer.slots.map(slot=>slot?.id)).size===3 && offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.isGolden!==true &&
        Number.isInteger(rec?.tier) && rec.tier>=1 && rec.tier<=offer.tier;
    });
}

export function isPineconeSaleOffer(offer, chess) {
  return !!offer && offer.source==='special' && offer.label==='松果' && offer.tier===1 &&
    offer.queued===0 && Array.isArray(offer.slots) && offer.slots.length>0 && offer.slots.length<=6 &&
    offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.tier===1 &&
        rec.isGolden!==true && rec.visible===true && rec.isHidden!==true && rec.isDiy!==true;
    });
}

export function auditPackagingSale(before,after,uid,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditPackagingSaleSettled(before,refill.after,uid,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}

// Canonical complete offer stamp shared across the transport and MAIN proof checks.
export function mergeOfferStamp(offer) {
  return JSON.stringify(offer && {source:offer.source,label:offer.label,tier:offer.tier,queued:offer.queued,
    slots:offer.slots.map(s=>!s ? null : {id:s.id,kind:s.kind,price:s.price,sold:s.sold===true})});
}

// A pending offer is NOT a general sell exemption. MAIN must additionally hold the
// single-use Flametail proof and a whitelist of this purchase's fresh UID candidates.
export function auditPendingMergeSale(before,after,uid,options={}) {
  if(!before?.ok || !after?.ok || !isPackagingMergeOffer(before.rewardOffer,options.chess,before.shopLevel) ||
    mergeOfferStamp(before.rewardOffer)!==mergeOfferStamp(after.rewardOffer))
    return {ok:false,reason:'腾位出售期间原晋升奖励发生变化，禁止继续或重复领取'};
  const audited=auditPackagingSale({...before,rewardOffer:null},{...after,rewardOffer:null},uid,options);
  if(audited.ok && audited.packagingMerged)return {ok:false,reason:'腾位期间发生额外包装合成，不能继续使用原单次晋升证明'};
  return audited;
}

// Only the active, proved overflow cycle may wait for pure deployment + automatic refill.
// Identity, all UIDs, equipment, funds, shop and the exact pending offer must stay unchanged.
export function auditOverflowPlacement(before,after,chess) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const normalized=refill.after;
  const ok=isPackagingMergeOffer(before.rewardOffer,chess,before.shopLevel) &&
    mergeOfferStamp(before.rewardOffer)===mergeOfferStamp(after.rewardOffer) &&
    before.funds===after.funds && before.shopLevel===after.shopLevel && before.refreshPrice===after.refreshPrice &&
    JSON.stringify(before.slots)===JSON.stringify(after.slots) &&
    before.units.length===normalized.units.length && before.units.every(u=>sameUnitWithPlacement(u,normalized.unitByUid.get(u.uid))) &&
    before.items.length===normalized.items.length && before.items.every(it=>{
      const next=normalized.itemByUid.get(it.uid);
      return next && next.id===it.id && next.area===it.area && (next.carrierUid ?? null)===(it.carrierUid ?? null);
    }) && (!(refill.refilledUids.length || after.items.some(it=>it.area==='hand' && before.itemByUid.get(it.uid)?.area==='temp')) ||
      before.units.some(u=>u.area==='hand' && after.unitByUid.get(u.uid)?.area==='board'));
  return ok ? {ok:true,refilledUids:refill.refilledUids} :
    {ok:false,reason:'爆仓腾位等待期间检测到部署/补位之外的库存、资金或奖励变化'};
}
