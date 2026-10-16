// Generated MAIN bridge; edit src/main-bridge.js and src/engine/ shared audit modules.
(() => {
// Placement-only tolerance, shared by the controller and MAIN. Never equates different UIDs,
// identities, elite flags, equipment counts, or moves into/out of the temporary overflow area.
function compatiblePlacementArea(before, after) {
  return before===after || (before==='hand' && after==='board') || (before==='board' && after==='hand');
}
function sameUnitWithPlacement(before, after) {
  return !!before && !!after && before.uid===after.uid && before.id===after.id && before.base===after.base &&
    before.golden===after.golden && before.equipped===after.equipped && compatiblePlacementArea(before.area,after.area);
}
function changedDeployment(before, after) {
  return sameUnitWithPlacement(before,after) && before.area!==after.area;
}

// Only call inside a fully audited buy/sell action, never for idle/manual changes.
// Normalize one-way refill for surviving, identical old UIDs; the enclosing action audit
// must still prove EVERY disappearance, new UID, equipment return, and reward.
function normalizeActionRefill(before, after) {
  const fail=()=>({ok:false,reason:'临时区补位的 UID、身份或手牌容量无法核验；已停止'});
  if(!before?.ok || !after?.ok || before.identity!==after.identity ||
    !Array.isArray(before.hand) || !Array.isArray(after.hand) || after.hand.filter(Boolean).length>10)return fail();
  const refilledUids=[], refilledItems=[];
  const units=after.units.map(unit=>{
    const old=before.unitByUid.get(unit.uid);
    if(old?.area==='temp' && unit.area==='hand' && old.id===unit.id && old.base===unit.base &&
      old.golden===unit.golden && old.equipped===unit.equipped){refilledUids.push(unit.uid);return {...unit,area:'temp'};}
    return unit;
  });
  const items=after.items.map(item=>{
    const old=before.itemByUid.get(item.uid);
    if(old?.area==='temp' && item.area==='hand' && old.id===item.id &&
      old.carrierUid==null && item.carrierUid==null){refilledItems.push(item.uid);return {...item,area:'temp'};}
    return item;
  });
  const released=before.units.filter(u=>u.area==='hand' &&
    (!after.unitByUid.has(u.uid) || after.unitByUid.get(u.uid).area==='board')).length;
  const slots=10-before.hand.filter(Boolean).length+released;
  if(refilledUids.length+refilledItems.length>slots)return fail();
  return {ok:true,refilledUids,after:{...after,units,items,
    unitByUid:new Map(units.map(u=>[u.uid,u])),itemByUid:new Map(items.map(it=>[it.uid,it]))}};
}

// Pure, independently checked in both worlds. Does not grant any UID sale authority.
function canSellSurplusGift(ctx, uid, plan, chess) {
  const unit=ctx?.unitByUid?.get(uid), base=unit?.base;
  if(!ctx?.ok || !unit || !base || !chess?.[base] || !ctx.ownedCopies)return false;
  const kept=(Array.isArray(plan?.keep) ? plan.keep : []).some(id=>
    id===base || (chess?.[id]?.baseId===base && !!chess[base]));
  if(!kept)return true;
  const limit=plan?.keepRules?.[base]?.limit, held=ctx.ownedCopies[base];
  return Number.isInteger(limit) && limit>0 && limit<=99 && Number.isInteger(held) &&
    held-(unit.golden ? 3 : 1)>=limit;
}


// Packaging gifts are retained, never added to the automatic sale ledger.
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
  const consumed=new Set();
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
      for(const unit of old.slice(0,need-1))consumed.add(unit.uid);
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
  return {ok:true,packagingGifts:appeared,packagingMerged:merged,packagingReward,pineconeReward};
}

function isPackagingMergeOffer(offer, chess, shopLevel) {
  return !!offer && Number.isInteger(shopLevel) && shopLevel>=1 && shopLevel<=6 &&
    offer.source==='merge' && offer.label==null && offer.queued===0 &&
    offer.tier===Math.min(shopLevel+1,6) && Array.isArray(offer.slots) && offer.slots.length===3 &&
    new Set(offer.slots.map(slot=>slot?.id)).size===3 && offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.isGolden!==true &&
        Number.isInteger(rec?.tier) && rec.tier>=1 && rec.tier<=offer.tier;
    });
}

function isPineconeSaleOffer(offer, chess) {
  return !!offer && offer.source==='special' && offer.label==='松果' && offer.tier===1 &&
    offer.queued===0 && Array.isArray(offer.slots) && offer.slots.length>0 && offer.slots.length<=6 &&
    offer.slots.every(slot=>{
      const rec=chess?.[slot?.id];
      return slot?.kind==='chess' && slot.price===0 && slot.sold!==true && rec?.tier===1 &&
        rec.isGolden!==true && rec.visible===true && rec.isHidden!==true && rec.isDiy!==true;
    });
}

function auditPackagingSale(before,after,uid,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditPackagingSaleSettled(before,refill.after,uid,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}

// Canonical complete offer stamp shared across the transport and MAIN proof checks.
function mergeOfferStamp(offer) {
  return JSON.stringify(offer && {source:offer.source,label:offer.label,tier:offer.tier,queued:offer.queued,
    slots:offer.slots.map(s=>!s ? null : {id:s.id,kind:s.kind,price:s.price,sold:s.sold===true})});
}

// A pending offer is NOT a general sell exemption. MAIN must additionally hold the
// single-use Flametail proof and a whitelist of this purchase's fresh UID candidates.
function auditPendingMergeSale(before,after,uid,options={}) {
  if(!before?.ok || !after?.ok || !isPackagingMergeOffer(before.rewardOffer,options.chess,before.shopLevel) ||
    mergeOfferStamp(before.rewardOffer)!==mergeOfferStamp(after.rewardOffer))
    return {ok:false,reason:'腾位出售期间原晋升奖励发生变化，禁止继续或重复领取'};
  const audited=auditPackagingSale({...before,rewardOffer:null},{...after,rewardOffer:null},uid,options);
  if(audited.ok && audited.packagingMerged)return {ok:false,reason:'腾位期间发生额外包装合成，不能继续使用原单次晋升证明'};
  return audited;
}

// Only the active, proved overflow cycle may wait for pure deployment + automatic refill.
// Identity, all UIDs, equipment, funds, shop and the exact pending offer must stay unchanged.
function auditOverflowPlacement(before,after,chess) {
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


// Shared pure trade evidence. Both the isolated controller and MAIN compile this module.
// A retained merge is attributable only when one new normal completes these exact old copies.
function planRetainedMerge(ctx, id, chess) {
  const rec=chess?.[id], base=rec?.baseId && chess[rec.baseId] ? rec.baseId : id;
  if(!ctx?.ok || !rec || rec.isGolden===true || id!==base || !chess[rec.goldenId]?.isGolden) return null;
  const need=Number.isInteger(rec.upgradeNum) && rec.upgradeNum>1 ? rec.upgradeNum : 3;
  if(need>99)return null;
  const old=ctx.units.filter(unit=>unit.base===base && !unit.golden);
  if(old.length!==need-1 || old.some(unit=>unit.id!==id))return null;
  return {base,normalId:id,goldenId:rec.goldenId,need,consumed:old.map(unit=>unit.uid)};
}

function auditOrdinaryPurchase(before, after, candidate, {chess={}, retained=false}={}) {
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
function tradeInventoryStamp(ctx) {
  return JSON.stringify({
    units:ctx.units.map(unit=>[unit.uid,unit.id,unit.base,unit.area,unit.golden,unit.equipped]).sort((a,b)=>a[0]-b[0]),
    items:ctx.items.map(item=>[item.uid,item.id,item.area,item.carrierUid ?? null]).sort((a,b)=>a[0]-b[0]),
  });
}
function makeSaleIntent(ctx, uid) {
  const unit=ctx?.ok && ctx.unitByUid.get(uid);
  if(!unit || !Number.isInteger(uid) || !['hand','temp'].includes(unit.area) || unit.equipped!==0)return null;
  return {uid,id:unit.id,base:unit.base,area:unit.area,golden:unit.golden,equipped:0,
    identity:ctx.identity,funds:ctx.funds,inventoryStamp:tradeInventoryStamp(ctx)};
}
function matchesSaleIntent(ctx, uid, expected) {
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

function auditFlametailPurchase(before,after,candidate,options={}) {
  const refill=normalizeActionRefill(before,after);
  if(!refill.ok)return refill;
  const audited=auditFlametailPurchaseSettled(before,refill.after,candidate,options);
  return audited.ok ? {...audited,refilledUids:refill.refilledUids} : audited;
}

// MAIN world, installed only by an explicit extension-popup click on a compatible game tab.
// Reads the game's own store/actions from THIS page's origin; never hardcodes a server address.
(() => {
  const cfg = globalThis.__weiMainConfig;
  if (!cfg || typeof cfg.nonce !== 'string' || cfg.nonce.length < 16 ||
      typeof cfg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(cfg.version)) return;
  const root = new URL(cfg.root, location.href);
  if (root.origin !== location.origin || !['http:', 'https:'].includes(root.protocol)) return;
  if (globalThis.__recruitAssistPageBridgeInstalled) return; // old extension: never run two sellers
  globalThis.__weiMainBridge?.dispose?.();
  const CHANNEL = 'wei.runtime.v1';
  const FLAME = 'chess_char_4_19_a';
  const GIFT = ['chess_char_1_19_a', 'chess_char_2_18_a', 'chess_char_4_20_a'];
  const GIFT_SET = new Set(GIFT);
  const SWIRE = 'chess_char_3_03_a';
  const COIN = 'chess_item_1_03_e_a';
  const COIN_GOLDEN = 'chess_item_1_03_e_b';
  const PINECONE = 'chess_char_3_10_a';
  const nonce = cfg.nonce;
  let disposed = false;
  let offStore = null;
  let busy = false;
  const ledger = new Map(); // ONLY fresh UIDs from this bridge's buy/reward may be sold.
  const coinLedger = new Map(); // ONLY a coin produced by this run's Swire buy may be used.
  const placementProtected=new Set();
  let placementPrevious=null;
  let pendingReward = null; // Typed, one-use proof: Pinecone sale, gift merge, or retained purchase merge.
  const send = (type, extra = {}) => { if (!disposed) window.postMessage({ channel: CHANNEL, side: 'game', nonce, version: cfg.version, type, ...extra }, location.origin); };
  const reject = (rid, reason) => send('response', { rid, ok: false, reason });
  let handleMessage = null;
  const ownBridge = globalThis.__weiMainBridge = {
    version: cfg.version,
    dispose() {
      disposed = true;
      if (offStore) offStore();
      if (handleMessage) window.removeEventListener('message', handleMessage);
      ledger.clear(); coinLedger.clear(); pendingReward = null;placementProtected.clear();placementPrevious=null;
      if (globalThis.__weiMainBridge === ownBridge) globalThis.__weiMainBridge = null;
      if (globalThis.__spuiMainBridge === ownBridge) globalThis.__spuiMainBridge = null;
    },
  };
  globalThis.__spuiMainBridge = ownBridge; // Legacy popup sees this marker and refuses parallel injection.
  delete globalThis.__weiMainConfig;

  function liveGame() {
    const sp = globalThis.__SP__;
    return sp && typeof sp === 'object' && sp.version === 1 && typeof sp.store?.get === 'function' &&
      typeof sp.store?.subscribe === 'function' && typeof sp.net?.request === 'function' ? sp : null;
  }
  // Same intents as the game's own js/ui/gameActions.js: resolve true on ok, false on any error; never throws.
  function netActions(net) {
    const send = async (type, fields) => { try { await net.request(type, fields); return true; } catch { return false; } };
    return Object.freeze({
      buy: slot => send('g.buy', { slot }),
      sell: uid => send('g.sell', { uid }),
      refresh: () => send('g.refresh', {}),
      ready: ready => send('g.ready', {ready}),
      equip: (itemUid, targetUid) => send('g.equip', { itemUid, targetUid }), // never a replaceUid
      reward: idx => send('g.reward', { idx }),
    });
  }
  async function boot() {
    // 兼容打包版网页（Vite 构建，没有 js/main.js）：游戏自身暴露的 globalThis.__SP__ = {store, net, version:1}
    // 就是界面正在使用的同一份状态与连接；优先使用它。只有旧版网页没有 __SP__ 时才按源码路径导入模块。
    const sp = liveGame();
    const [{ store }, { actions }, chessRes, garrisonRes, itemsRes] = await Promise.all([
      sp ? { store: sp.store } : import(new URL('js/store.js', root)),
      sp ? { actions: netActions(sp.net) } : import(new URL('js/ui/gameActions.js', root)),
      fetch(new URL('data/chess.json', root), { cache: 'no-store' }),
      fetch(new URL('data/garrisons.json', root), { cache: 'no-store' }).catch(() => null),
      fetch(new URL('data/items.json', root), { cache: 'no-store' }).catch(() => null),
    ]);
    if (disposed) return;
    if (!store?.get || !store?.subscribe || !actions?.buy || !actions?.sell || !actions?.refresh ||
        !actions?.equip || !actions?.reward || !chessRes.ok) {
      throw new Error('页面不提供兼容的对局状态或买卖接口');
    }
    const chess = await chessRes.json();
    const garrisons = garrisonRes?.ok ? await garrisonRes.json().catch(() => null) : null;
    const itemsRaw = itemsRes?.ok ? await itemsRes.json().catch(() => null) : null;
    const itemData = itemsRaw && typeof itemsRaw === 'object' ? (itemsRaw.items || itemsRaw) : null;
    if (!chess?.[FLAME] || !chess['chess_char_1_19_a'] || Object.keys(chess).length < 20) {
      throw new Error('角色图鉴不兼容，停止注入');
    }
    const base = id => typeof id === 'string' && chess[id] ? (typeof chess[id].baseId === 'string' && chess[chess[id].baseId] ? chess[id].baseId : id) : null;
    // Independent copy of item-policy.js itemMergeRule: mirrors the server's _itemMergeable.
    const itemRecord = id => itemData && typeof id === 'string' && Object.hasOwn(itemData, id) &&
      itemData[id] && typeof itemData[id] === 'object' ? itemData[id] : null;
    function itemMergeRule(id) {
      const rec = itemRecord(id);
      if (!rec) return null;
      if (rec.isGolden === true || rec.itemType !== 'EQUIP' || rec.mergeable !== true) return { mergeable: false };
      const need = Number.isInteger(rec.upgradeNum) ? rec.upgradeNum : 2;
      const goldenId = rec.upgradeChessId || rec.goldenId;
      if (!(need > 1 && need < 100) || typeof goldenId !== 'string' || goldenId === id || !itemRecord(goldenId)) {
        return { mergeable: false };
      }
      return { mergeable: true, need, goldenId };
    }
    const bases = ids => new Set((Array.isArray(ids) ? ids : []).slice(0, 512).map(base).filter(Boolean));
    const piece = p => !p ? null : ({ uid: p.uid, id: p.id, kind: p.kind, golden: p.golden === true,
      ...(p.kind === 'chess' ? { items: Array.isArray(p.items) ? p.items.map(it => ({ uid: it.uid, id: it.id })) : [] } : {}) });
    const slot = s => !s ? null : ({ id: s.id, kind: s.kind, price: s.price, sold: s.sold === true });
    // 自选编队 picks of THIS match: slot base id → the operator's charId only.
    const diyPicks = d => !d || typeof d !== 'object' ? null : Object.fromEntries(Object.entries(d).slice(0, 16)
      .filter(([id, pick]) => /^[A-Za-z0-9_]{3,80}$/.test(id) && typeof pick?.charId === 'string' &&
        /^[A-Za-z0-9_]{3,80}$/.test(pick.charId)).map(([id, pick]) => [id, { charId: pick.charId }]));
    function view(raw) {
      const s = raw || store.get();
      const room = s?.room, pub = s?.match?.public, p = s?.match?.private;
      return {
        readySupported:typeof actions.ready==='function',
        connection: { status: s?.connection?.status }, ui: { buildStale: s?.ui?.buildStale === true },
        me: { playerId: s?.me?.playerId },
        room: room ? { code: room.code, inMatch: room.inMatch,
          seats: Array.isArray(room.seats) ? room.seats.map(x => ({ playerId: x?.playerId })) : null } : null,
        match: {
          public: pub ? { phase: pub.phase, round: pub.round,
            players: Array.isArray(pub.players) ? pub.players.map(x => ({ playerId: x?.playerId, autoplay: x.autoplay })) : null } : null,
          private: p ? { alive: p.alive, ready: p.ready, funds: p.funds,
            diy: diyPicks(p.diy),
            hand: Array.isArray(p.hand) ? p.hand.map(piece) : null,
            board: Array.isArray(p.board) ? p.board.map(piece) : null,
            temp: Array.isArray(p.temp) ? p.temp.map(piece) : null,
            shop: p.shop ? { slots: Array.isArray(p.shop.slots) ? p.shop.slots.map(slot) : null,
              refreshPrice: p.shop.refreshPrice, level:p.shop.level,
              rewardOffer: p.shop.rewardOffer && Array.isArray(p.shop.rewardOffer.slots)
                ? { source: p.shop.rewardOffer.source, label: p.shop.rewardOffer.label,
                  tier: p.shop.rewardOffer.tier, queued: p.shop.rewardOffer.queued,
                  slots: p.shop.rewardOffer.slots.map(slot) } : null } : null } : null,
        },
      };
    }
    function context({ allowReward = false } = {}) {
      if (disposed || globalThis.__spuiMainBridge !== ownBridge || globalThis.__weiMainBridge !== ownBridge || globalThis.__recruitAssistPageBridgeInstalled || document.querySelector?.('.spui')) throw new Error('检测到其他交易插件或旧桥接，已停止');
      const s = store.get(), p = s?.match?.private, pub = s?.match?.public;
      const me = s?.me?.playerId, room = s?.room;
      if (s?.connection?.status !== 'online' || s?.ui?.buildStale ||
          typeof me !== 'string' || !me || !room?.inMatch || typeof room.code !== 'string' ||
          !Array.isArray(room.seats) || !room.seats.some(x => x?.playerId === me) ||
          pub?.phase !== 'PREP' || !Number.isInteger(pub.round) ||
          !Array.isArray(pub.players) || !pub.players.some(x => x?.playerId === me && x.autoplay !== true) ||
          !p || p.ready !== false || p.alive === false ||
          !p.shop || !Array.isArray(p.shop.slots) ||
          ![p.hand,p.board,p.temp].every(Array.isArray) ||
          !Number.isInteger(p.funds) || p.funds < 0 ||
          (Array.isArray(p.shop.rewardOffer?.slots) && p.shop.rewardOffer.slots.length > 0 && !allowReward)) {
        throw new Error('游戏阶段、座位、库存或连接状态不允许交易');
      }
      const units = new Map(), items = new Map(), seen = new Set();
      let ownedCopies = Object.create(null);
      for (const [area, list] of [['hand', p.hand], ['board', p.board], ['temp', p.temp]]) {
        for (const piece of list) {
          if (!piece) continue;
          if (!Number.isInteger(piece.uid) || piece.uid < 0 || seen.has(piece.uid)) throw new Error('库存 UID 缺失或重复');
          seen.add(piece.uid);
          if (piece.kind === 'chess') {
            if (typeof piece.id !== 'string' ||
                (piece.items != null && !Array.isArray(piece.items))) throw new Error('干员或已配发装备状态无效');
            const idBase = base(piece.id), golden = piece.golden === true || chess[piece.id]?.isGolden === true;
            units.set(piece.uid, { id: piece.id, base: idBase, area, golden, equipped: (piece.items || []).length });
            if (!idBase || chess[idBase]?.isGolden === true) ownedCopies = null;
            else if (ownedCopies) ownedCopies[idBase] = (ownedCopies[idBase] || 0) + (golden ? 3 : 1);
            for (const it of piece.items || []) {
              if (!Number.isInteger(it?.uid) || it.uid < 0 || typeof it.id !== 'string' || seen.has(it.uid)) {
                throw new Error('已配发装备 UID 缺失或重复');
              }
              seen.add(it.uid);
              items.set(it.uid, { id: it.id, area: 'equipped', carrierUid: piece.uid });
            }
          } else if (piece.kind === 'item') {
            if (typeof piece.id !== 'string') throw new Error('道具 ID 无效');
            items.set(piece.uid, { id: piece.id, area });
          }
        }
      }
      return { p, units, items, ownedCopies, identity: `${room.code}|${me}|${pub.round}` };
    }
    const tradeSnapshot=ctx=>({ok:true,identity:ctx.identity,ownedCopies:ctx.ownedCopies,refreshPrice:ctx.p.shop.refreshPrice,shopLevel:ctx.p.shop.level,
      rewardOffer:ctx.p.shop.rewardOffer ? {...ctx.p.shop.rewardOffer,slots:ctx.p.shop.rewardOffer.slots.map(slot)} : null,
      slots:ctx.p.shop.slots.map(slot),hand:ctx.p.hand.map(piece),funds:ctx.p.funds,
      units:[...ctx.units].map(([uid,unit])=>({uid,...unit})),
      unitByUid:new Map([...ctx.units].map(([uid,unit])=>[uid,{uid,...unit}])),
      items:[...ctx.items].map(([uid,item])=>({uid,...item})),
      itemByUid:new Map([...ctx.items].map(([uid,item])=>[uid,{uid,...item}]))});
    function observePlacement(){
      let next;
      try{next=tradeSnapshot(context({allowReward:true}));}catch{return;}
      if(placementPrevious?.identity!==next.identity){placementProtected.clear();placementPrevious=next;return;}
      for(const unit of next.units)if(changedDeployment(placementPrevious.unitByUid.get(unit.uid),unit)){
        placementProtected.add(unit.uid);ledger.delete(unit.uid);
      }
      if(pendingReward?.kind==='flametail_merge' && pendingReward.identity===next.identity &&
        pendingReward.stamp===stampOffer(next.rewardOffer)){
        const placement=auditOverflowPlacement(placementPrevious,next,chess);
        if(placement.ok)for(const uid of placement.refilledUids){
          const entry=ledger.get(uid), unit=next.unitByUid.get(uid);
          if(entry && unit && entry.identity===next.identity)entry.area=unit.area;
        }
      }
      placementPrevious=next;
    }
    function mergeRisk(ctx, id) {
      const rec = chess[id];
      if (!rec || rec.isGolden || !rec.goldenId || !chess[rec.goldenId]) return false;
      const need = Number.isInteger(rec.upgradeNum) && rec.upgradeNum > 1 ? rec.upgradeNum : 3;
      return [...ctx.units.values()].filter(x => x.base === base(id) && !chess[x.id]?.isGolden).length + 1 >= need;
    }
    const pineconeOffer=raw=>isPineconeSaleOffer(raw,chess);
    function flametailMergeOffer(raw) {
      return isPackagingMergeOffer(raw,chess,store.get()?.match?.private?.shop?.level);
    }
    // Independent MAIN-world guard for the UI's free-card ranking. The exact
    // whitelist must match src/engine/auto-policy.js: pure funds/free refresh or
    // immediate bond layers only. Missing/unknown traits and chess/item gifts are not safe.
    const REWARD_ECONOMY = new Set(['SERVER_ONCE_GOLD', 'SERVER_GAIN_FREE_REFRESH_COUNT']);
    const REWARD_LAYERS = new Set([
      'SERVER_ADD_BOND', 'SERVER_ADD_BOND_CHESS_ALL', 'SERVER_ADD_BOND_METHOD',
      'SERVER_ADD_MULTIPLE_BOND', 'SERVER_ADD_BOND_ACTIVATED_MOST_LAYER',
    ]);
    const REWARD_LATER_EVENTS = new Set([
      'IN_BATTLE', 'SERVER_PREP_FIN', 'SERVER_PREP_START', 'SERVER_REFRESH_SHOP', 'SERVER_PRICE',
    ]);
    function rewardTraitRank(id) {
      const rec = chess[id];
      if (!rec || !garrisons || typeof garrisons !== 'object' || !Array.isArray(rec.garrisonIds)) return null;
      let economy = false, layers = false;
      for (const gid of rec.garrisonIds) {
        const trait = typeof gid === 'string' ? garrisons[gid] : null;
        if (!trait || typeof trait.eventType !== 'string') return null;
        if (trait.eventType === 'SERVER_GAIN' || trait.eventType === 'SERVER_CHESS_SOLD') {
          // IN_BATTLE effectType is a category, not the effectKey handler.
          // Compare keys only for immediate acquisition/sale effects.
          if (typeof trait.effectType === 'string' && trait.effectType !== trait.effectKey) return null;
          if (REWARD_ECONOMY.has(trait.effectKey)) economy = true;
          else if (REWARD_LAYERS.has(trait.effectKey)) layers = true;
          else if (id === PINECONE && trait.eventType === 'SERVER_CHESS_SOLD' &&
                   trait.effectKey === 'SERVER_SELL_CHESS_GAIN_SPECIAL_GOODS') {
            // Existing, independently proven Pinecone-sale → free-offer path.
          } else return null;
        } else if (!REWARD_LATER_EVENTS.has(trait.eventType)) return null;
      }
      return economy ? 0 : layers ? 1 : 2;
    }
    function safeMergeCard(ctx, id, keepList) {
      const rec = chess[id], idBase = base(id);
      return !!rec && !!idBase && !mergeRisk(ctx, id) &&
        !(ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) &&
        (rec.visible === true && rec.isHidden !== true && rec.isDiy !== true ||
          bases(keepList).has(idBase)) && rewardTraitRank(id) !== null;
    }
    const stampOffer = offer => JSON.stringify(offer && {
      source: offer.source, label: offer.label, tier: offer.tier, queued: offer.queued,
      slots: offer.slots.map(slot),
    });
    function waitFor(predicate, ms = 5000) {
      return new Promise(resolve => {
        let done = false, off = null, timer;
        const finish = result => { if (done) return; done = true;
          if (off) off(); clearTimeout(timer); resolve(result); };
        timer = setTimeout(() => finish(null), ms);
        off = store.subscribe(s => { if (predicate(s)) finish(s); });
        if (done && off) off(); // also safe if a store calls listeners upon subscribing
        const current = store.get();
        if (predicate(current)) finish(current);
      });
    }
    // MAIN 世界独立核对实时库存，绝不信任界面上报的数量。
    function assertKeepRule(rule, ctx, idBase, offer) {
      if (!rule) return; // Old plans without per-entry rules retain their behavior.
      if (rule.limit !== null && (!Number.isInteger(rule.limit) || rule.limit < 1 || rule.limit > 99) ||
          rule.minFunds !== null && (!Number.isSafeInteger(rule.minFunds) || rule.minFunds < 0 || rule.minFunds > 999999999)) {
        throw new Error('保留干员持有目标或资金门槛无效');
      }
      const copies = offer.golden === true || chess[offer.id]?.isGolden === true ? 3 : 1;
      if (rule.limit !== null && (!ctx.ownedCopies || (ctx.ownedCopies[idBase] || 0) + copies > rule.limit) ||
          rule.minFunds !== null && ctx.p.funds <= rule.minFunds) {
        throw new Error('保留干员已达持有目标、库存待核对，或购买前资金未严格高于门槛');
      }
    }
    async function buy(message) {
      const ctx = context();
      const index = message.slot;
      if (!Number.isInteger(index) || index < 0 || index >= ctx.p.shop.slots.length) throw new Error('商店槽位超出范围');
      const offer = ctx.p.shop.slots[index];
      if (!offer || offer.kind !== 'chess' || offer.sold || typeof offer.id !== 'string' ||
          typeof offer.price !== 'number' || !Number.isInteger(offer.price) || offer.price < 0 ||
          offer.id !== message.expectedId || offer.price !== message.expectedPrice ||
          offer.price > ctx.p.funds) throw new Error('商店卡片已变化、售出或资金不足');
      if (ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) throw new Error('手牌区已满');
      const rec = chess[offer.id];
      const idBase = base(offer.id);
      if (!rec || !idBase) throw new Error('干员 ID 不在本服务器图鉴中');
      const keep = bases(message.keep);
      const selected = bases(message.buy);
      const retained = keep.has(idBase);
      if (retained) assertKeepRule(message.keepRules?.[idBase], ctx, idBase, offer);
      if (!retained && bases(message.excludedBuy).has(idBase)) throw new Error('此干员买入规则已禁用');
      const ordinary = rec.isGolden !== true && rec.visible === true && rec.isHidden !== true && rec.isDiy !== true;
      if (!retained && (!ordinary || !(offer.price <= 1 || selected.has(idBase)))) {
        throw new Error('不属于价格 0/1、自定义或保留名单');
      }
      const purchaseBefore=tradeSnapshot(ctx);
      const retainedMerge=retained ? planRetainedMerge(purchaseBefore,offer.id,chess) : null;
      if(retained && mergeRisk(ctx,offer.id) && !retainedMerge)throw new Error('保留购买的同名合成旧 UID 无法预先核验');
      if (!retained && mergeRisk(ctx, offer.id)) throw new Error('将消耗原有同名干员，已跳过');
      if (idBase === FLAME && (offer.id !== FLAME || mergeRisk(ctx, FLAME) ||
          GIFT.some(id => !chess[id]?.goldenId || !chess[chess[id].goldenId]))) {
        throw new Error('精锐焰尾赠品未经支持，或焰尾本体可能合成旧干员；已跳过');
      }
      // Old normal gifts may merge irreversibly. Independent post-buy evidence
      // must account for every consumed UID and protect the mixed-inventory elite.
      const before = ctx.units;
      const ok = await actions.buy(index);
      if (ok !== true) throw new Error('游戏服务器拒绝买入');
      const updated = await waitFor(s => s.match?.private?.shop?.slots?.[index]?.id === offer.id &&
        s.match.private.shop.slots[index].sold === true);
      if (!updated) throw new Error('买入后未收到可核对的状态；不会自动出售');
      const after = context({ allowReward: offer.id === FLAME || !!retainedMerge });
      if (after.identity !== ctx.identity) throw new Error('买入期间对局已切换');
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (!fresh.length || fresh.length > (offer.id === FLAME ? 4 : 3) || fresh.some(([, unit]) =>
        !unit.base || (unit.base !== idBase && !(offer.id === FLAME && GIFT_SET.has(unit.base))))) {
        throw new Error('新购 UID 的数量或来源不符合预期，停止出售');
      }
      let ordinaryAudit=null, flametailAudit=null;
      if(offer.id!==FLAME){
        ordinaryAudit=auditOrdinaryPurchase(purchaseBefore,tradeSnapshot(after),
          {id:offer.id,slot:index,price:offer.price},{chess,retained});
        if(!ordinaryAudit.ok)throw new Error(ordinaryAudit.reason);
        if(ordinaryAudit.mergedKeepReward){
          pendingReward={kind:'keep_merge',identity:ctx.identity,stamp:stampOffer(after.p.shop.rewardOffer)};
          for(const consumedUid of ordinaryAudit.consumedUids)ledger.delete(consumedUid);
        }
      }
      if (offer.id === FLAME) {
        flametailAudit=auditFlametailPurchase(purchaseBefore,tradeSnapshot(after),
          {id:offer.id,slot:index,price:offer.price},{chess});
        if(!flametailAudit.ok)throw new Error(flametailAudit.reason);
        for(const consumedUid of flametailAudit.consumedUids){ledger.delete(consumedUid);placementProtected.delete(consumedUid);}
        if(flametailAudit.mergedGift)
          pendingReward={kind:'flametail_merge',identity:ctx.identity,stamp:stampOffer(after.p.shop.rewardOffer),
            drainUids:fresh.map(([uid])=>uid)};
      }
      if(ordinaryAudit?.coin){
        const coin=ordinaryAudit.coin;
        if(coin.mergedFrom!=null)coinLedger.delete(coin.mergedFrom);
        coinLedger.set(coin.uid,{id:coin.id,parentUid:ordinaryAudit.parent.uid,identity:ctx.identity,
          ...(coin.mergedFrom!=null ? {mergedFrom:coin.mergedFrom} : {})});
      }
      for(const uid of flametailAudit?.refilledUids || []){
        const entry=ledger.get(uid), unit=after.units.get(uid);
        if(entry && unit && entry.identity===after.identity)entry.area=unit.area;
      }
      const quotaGifts=new Set(flametailAudit?.gifts.map(unit=>unit.uid) || []);
      for (const [uid, unit] of fresh) ledger.set(uid, { ...unit, identity: ctx.identity,
        surplusGift:quotaGifts.has(uid),
        protected: (!quotaGifts.has(uid) && keep.has(unit.base)) || placementProtected.has(uid) || unit.area==='board' });
      return { count: fresh.length };
    }
    // Item purchases never enter the chess sale ledger. Both worlds check the
    // exact shop offer, funds, one fresh item UID and unchanged prior inventory.
    async function buyItem(message) {
      const ctx = context(), index = message.slot;
      if (!Number.isInteger(index) || index < 0 || index >= ctx.p.shop.slots.length) throw new Error('道具槽位超出范围');
      const offer = ctx.p.shop.slots[index], rule = message.itemRule;
      if (!offer || offer.kind !== 'item' || offer.sold || typeof offer.id !== 'string' ||
          !Number.isSafeInteger(offer.price) || offer.price < 0 || offer.price > ctx.p.funds ||
          offer.id !== message.expectedId || offer.price !== message.expectedPrice ||
          !rule || rule.id !== offer.id || rule.enabled !== true ||
          rule.limit !== null && (!Number.isInteger(rule.limit) || rule.limit < 1 || rule.limit > 99) || // null = 不限
          !Number.isInteger(rule.used) || rule.used < 0 || rule.used > 9999 || rule.used >= (rule.limit ?? 9999) ||
          rule.minFunds !== null && (!Number.isSafeInteger(rule.minFunds) || rule.minFunds < 0 ||
            rule.minFunds > 999999999 || ctx.p.funds <= rule.minFunds)) {
        throw new Error('道具商店卡片、启用状态、次数或购买前资金门槛未通过');
      }
      if (rule.ownedTarget != null) {
        const rec = itemRecord(offer.id), base = rec?.baseId || offer.id;
        const variants = new Set([offer.id,base]);
        for (const entry of [rec,itemRecord(base)]) {
          const golden = entry?.goldenId || entry?.upgradeChessId;
          if (typeof golden === 'string') variants.add(golden);
        }
        const held = [...ctx.items.values()].filter(item => variants.has(item.id) &&
          !(offer.id === 'chess_item_6_08_e_a' && item.area === 'equipped')).length;
        if (!Number.isInteger(rule.ownedTarget) || rule.ownedTarget < 1 || rule.ownedTarget > 99 || held >= rule.ownedTarget)
          throw new Error('道具实时持有目标已达到或无效，不会继续买入');
      }
      if (ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) throw new Error('手牌区已满');
      // Identical copies merge on purchase (server: temp, then hand, then equipped). Only a merge
      // that consumes hand/temp copies is allowed, and both worlds must expect the same one.
      const copies = [...ctx.items].filter(([, item]) => item.id === offer.id);
      const mergeRule = itemMergeRule(offer.id);
      let merge = null;
      if (!mergeRule) {
        if (copies.length) throw new Error('游戏道具数据缺少合成规则，已持有同名道具；请手动处理');
      } else if (mergeRule.mergeable && copies.length + 1 >= mergeRule.need) {
        if (copies.length + 1 > mergeRule.need) throw new Error('同名道具数量已达合成数却未合成；请手动处理');
        const bench = [...copies.filter(([, it]) => it.area === 'temp'), ...copies.filter(([, it]) => it.area === 'hand')];
        if (bench.length < mergeRule.need - 1) throw new Error('买入会与已配发的同名装备合成；不会自动买入');
        merge = { goldenId: mergeRule.goldenId, consumed: bench.slice(0, mergeRule.need - 1).map(([uid]) => uid) };
      }
      const expect = message.expectMerge || null;
      if (!!merge !== !!expect || merge && (expect.goldenId !== merge.goldenId ||
          !Array.isArray(expect.consumed) || expect.consumed.length !== merge.consumed.length ||
          merge.consumed.some(uid => !expect.consumed.includes(uid)))) {
        throw new Error('工作台与游戏页对道具是否合成的判断不一致；不会自动买入');
      }
      const consumed = new Set(merge ? merge.consumed : []);
      const beforeSlots = ctx.p.shop.slots.map(slot);
      const ok = await actions.buy(index);
      if (ok !== true) throw new Error('游戏服务器拒绝道具买入');
      const updated = await waitFor(s => s.match?.private?.shop?.slots?.[index]?.id === offer.id &&
        s.match.private.shop.slots[index].sold === true);
      if (!updated) throw new Error('道具买入后状态未确认；不会自动重复购买');
      const after = context();
      const shop = after.p.shop.slots;
      if (after.identity !== ctx.identity || after.p.funds !== ctx.p.funds - offer.price ||
          shop.length !== beforeSlots.length || shop[index]?.id !== offer.id ||
          shop[index]?.kind !== 'item' || shop[index]?.sold !== true ||
          beforeSlots.some((prior,i) => i !== index && JSON.stringify(slot(prior)) !== JSON.stringify(slot(shop[i])))) {
        throw new Error('道具买入后对局、实际扣费或其他商店槽变化无法核对');
      }
      if (after.units.size !== ctx.units.size || [...ctx.units].some(([uid, before]) => {
        const now = after.units.get(uid);
        return !sameUnitWithPlacement(before,now);
      }) || [...ctx.items].some(([uid, before]) => {
        if (consumed.has(uid)) return after.items.has(uid);
        const now = after.items.get(uid);
        return !now || now.id !== before.id || now.area !== before.area || now.carrierUid !== before.carrierUid;
      })) throw new Error('道具买入后原有干员或道具 UID 变化，已停止');
      const fresh = [...after.items].filter(([uid]) => !ctx.items.has(uid));
      if (merge) {
        const made = fresh[0], list = made && made[1].area === 'temp' ? after.p.temp : after.p.hand;
        if (fresh.length !== 1 || after.items.size !== ctx.items.size - consumed.size + 1 ||
            made[1].id !== merge.goldenId || (made[1].area !== 'hand' && made[1].area !== 'temp') ||
            !list.some(item => item?.uid === made[0] && item.kind === 'item' && item.id === merge.goldenId)) {
          throw new Error('道具已买入并合成，但精锐道具 UID 无法唯一核对；不会自动重试');
        }
        return {itemUid:made[0],merged:true};
      }
      if (fresh.length !== 1 || after.items.size !== ctx.items.size + 1 ||
          fresh[0][1].id !== offer.id || fresh[0][1].area !== 'hand' ||
          !after.p.hand.some(item => item?.uid === fresh[0][0] && item.kind === 'item' && item.id === offer.id)) {
        throw new Error('道具新 UID、ID 或手牌位置无法唯一核对；不会自动重试');
      }
      return {itemUid:fresh[0][0]};
    }
    // Only the game's own ordinary shop refresh is supported. A rejected/ambiguous response
    // must never be retried automatically, since the server may already have charged the player.
    async function refresh(message) {
      const ctx = context();
      const shop = ctx.p.shop;
      const price = shop.refreshPrice;
      if (!Number.isSafeInteger(price) || price < 0 || price > ctx.p.funds ||
          message.expectedPrice !== price) throw new Error('商店刷新价格不可核对或资金不足');
      const beforeSlots = shop.slots.map(slot);
      if (!Array.isArray(message.expectedSlots) || message.expectedSlots.length > 20 ||
          JSON.stringify(message.expectedSlots) !== JSON.stringify(beforeSlots)) {
        throw new Error('刷新前商店槽位已变化，取消该次刷新');
      }
      const beforeFunds = ctx.p.funds;
      const beforeStamp = JSON.stringify(beforeSlots);
      const ok = await actions.refresh();
      if (ok !== true) throw new Error('游戏服务器拒绝刷新，不会自动重试');
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && (p.funds !== beforeFunds || p.shop?.refreshPrice !== price ||
          (Array.isArray(p.shop?.slots) && JSON.stringify(p.shop.slots.map(slot)) !== beforeStamp));
      }, 5500);
      if (!updated) throw new Error('刷新指令可能已生效，但商店回执未确认；停止且不会重复扣费');
      const after = context();
      if (after.identity !== ctx.identity) throw new Error('刷新期间对局或回合已切换');
      if (!Number.isSafeInteger(after.p.shop.refreshPrice) || after.p.shop.refreshPrice < 0) {
        throw new Error('刷新后价格无法确认，已停止');
      }
      if (price > 0 && beforeFunds - after.p.funds !== price) {
        throw new Error('刷新后的资金变化与实际标价不符，已停止');
      }
      if (price === 0 && JSON.stringify(after.p.shop.slots.map(slot)) === beforeStamp &&
          after.p.shop.refreshPrice === price) {
        throw new Error('免费刷新后没有可核对的商店变化，已停止避免无穷重复');
      }
      return { price };
    }
    async function useCoin(message) {
      const { itemUid, parentUid } = message; // parentUid = equip target (any owned chess with a free slot)
      const ctx = context();
      const item = ctx.items.get(itemUid), target = ctx.units.get(parentUid);
      if (!Number.isInteger(itemUid) || !Number.isInteger(parentUid) ||
          (item?.id !== COIN && item?.id !== COIN_GOLDEN) || !['hand', 'temp'].includes(item?.area) ||
          !target || !['hand', 'board', 'temp'].includes(target.area) ||
          !(Number.isInteger(target.equipped) && target.equipped >= 0 && target.equipped < 2)) {
        throw new Error('盟约之币或装备目标状态不安全；不会替换或销毁已佩戴装备');
      }
      // User-confirmed scope: EVERY normal/golden coin in hand may be used, whatever its
      // origin (Swire gift, shop purchase, prep drop). The server replaces an old equipped
      // item even for consumables, so the target must keep a free equipment slot.
      const amount = item.id === COIN_GOLDEN ? 2 : 1;
      const funds = ctx.p.funds, before = ctx.items, beforeUnits = ctx.units;
      const ok = await actions.equip(itemUid, parentUid);
      if (ok !== true) throw new Error('盟约之币使用被游戏拒绝');
      coinLedger.delete(itemUid); // An acknowledged intent must NEVER be repeated after an ambiguous push.
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && (p.funds !== funds ||
          ![...p.hand, ...p.board, ...p.temp].some(x => x?.uid === itemUid));
      });
      if (!updated) throw new Error('盟约之币可能已使用，但库存回执未确认；不会重复使用');
      const after = context();
      if (after.identity !== ctx.identity || after.p.funds !== funds + amount ||
          after.units.size !== beforeUnits.size || [...beforeUnits].some(([uid,u]) => after.units.get(uid)?.id !== u.id) ||
          after.items.size !== before.size - 1 || after.items.has(itemUid) ||
          [...before].some(([uid,it]) => uid !== itemUid &&
            (after.items.get(uid)?.id !== it.id || after.items.get(uid)?.carrierUid !== it.carrierUid))) {
        throw new Error('盟约之币使用后的资金或库存不符合预期，停止后续交易');
      }
      return { amount };
    }
    // 自动使用 (user opt-in per item): a consume-on-equip item from hand/temp onto an owned board/hand
    // operator with a free slot. Independent MAIN-world copy of item-policy.js itemUseRule.
    function useRule(id) {
      const rec = itemRecord(id), kind = typeof rec?.kind === 'string' ? rec.kind : '';
      if (!rec || rec.itemType !== 'EQUIP' || !kind.startsWith('consume_on_equip')) return null;
      const keys = Array.isArray(rec.buffs) ? rec.buffs.map(buff => String(buff?.key || '')) : [];
      const delayed = kind === 'consume_on_equip_or_delayed';
      return { destroysCarrier: /目标干员.{0,6}销毁|销毁.{0,6}目标干员/.test(typeof rec.desc === 'string' ? rec.desc : '') ||
        keys.some(key => key.startsWith('use_equip_recruit_new_char')),
        needsNormal: delayed, staysEquipped: delayed && rec.isGolden !== true, promotes: delayed };
    }
    async function useItem(message) {
      const { itemUid, targetUid, expectedId } = message;
      const allowed = new Set((Array.isArray(message.allowed) ? message.allowed : []).slice(0, 64));
      const ctx = context();
      const item = ctx.items.get(itemUid), target = ctx.units.get(targetUid), rule = useRule(item?.id);
      if (!Number.isInteger(itemUid) || !Number.isInteger(targetUid) || !item || item.id !== expectedId ||
          !allowed.has(item.id) || !rule || !['hand', 'temp'].includes(item.area) ||
          !target || !['board', 'hand'].includes(target.area) ||
          !(Number.isInteger(target.equipped) && target.equipped >= 0 && target.equipped < 2) ||
          rule.destroysCarrier && (bases(message.keep).has(target.base) || chess[target.id]?.isDiy === true) ||
          rule.needsNormal && chess[target.id]?.isGolden === true) {
        throw new Error('道具或装备目标不满足自动使用条件；不会替换或销毁已佩戴装备');
      }
      const before = ctx.items, beforeUnits = ctx.units, funds = ctx.p.funds;
      const ok = await actions.equip(itemUid, targetUid); // never a replaceUid
      if (ok !== true) throw new Error('道具使用被游戏拒绝');
      const updated = await waitFor(s => {
        const p = s?.match?.private;
        return !!p && ![...(p.hand || []), ...(p.temp || [])].some(x => x?.uid === itemUid);
      });
      if (!updated) throw new Error('道具可能已使用，但库存回执未确认；不会重复使用');
      const after = context({ allowReward: true });
      const now = after.items.get(itemUid);
      if (after.identity !== ctx.identity || after.p.funds < funds ||
          now && !(rule.staysEquipped && now.area === 'equipped' && now.carrierUid === targetUid) ||
          [...before].some(([uid, it]) => uid !== itemUid && after.items.get(uid)?.id !== it.id) ||
          [...beforeUnits].some(([uid, unit]) => !after.units.has(uid) &&
            !(uid === targetUid && (rule.destroysCarrier || rule.promotes)) && chess[unit.id]?.isGolden === true)) {
        throw new Error('道具使用后的资金、道具或干员状态不符合预期，停止后续交易');
      }
      return { consumed: !now, reward: !!after.p.shop.rewardOffer?.slots?.length };
    }
    async function pickReward(message) {
      const proof = pendingReward;
      const ctx = context({ allowReward: true });
      const offer = ctx.p.shop.rewardOffer;
      if (proof?.kind !== 'pinecone' || proof.identity !== ctx.identity || !pineconeOffer(offer) ||
          proof.stamp !== stampOffer(offer)) throw new Error('免费选卡不是本次自动出售松果触发的奖励');
      const slot = message.slot, card = offer.slots[slot];
      if (!Number.isInteger(slot) || !card || card.id !== message.expectedId ||
          message.expectedPrice !== 0 || mergeRisk(ctx, card.id) ||
          rewardTraitRank(card.id) === null ||
          ctx.p.hand.length >= 10 && ctx.p.hand.every(Boolean)) {
        throw new Error('松果选卡已变化、特质不可核验、可能合成旧干员或手牌区已满');
      }
      const before = ctx.units, beforeItems = ctx.items, funds = ctx.p.funds;
      pendingReward = null; // Do not allow a duplicate select if ACK/push is ambiguous.
      const ok = await actions.reward(slot);
      if (ok !== true) throw new Error('松果免费选卡被游戏拒绝，不能自动重试');
      const pushed = await waitFor(s => !s?.match?.private?.shop?.rewardOffer?.slots?.length &&
        [...(s?.match?.private?.hand || []), ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(x => x?.kind === 'chess' && x.id === card.id && !before.has(x.uid)));
      if (!pushed) throw new Error('松果选卡可能已执行，但库存或奖励回执未确认；不会再次选择');
      const after = context();
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (after.identity !== ctx.identity || after.p.funds < funds || after.p.shop.rewardOffer?.slots?.length ||
          fresh.length !== 1 || fresh[0][1].id !== card.id ||
          [...before].some(([uid, old]) => after.units.get(uid)?.id !== old.id) ||
          after.items.size !== beforeItems.size ||
          [...beforeItems].some(([uid, it]) => after.items.get(uid)?.id !== it.id ||
            after.items.get(uid)?.area !== it.area ||
            after.items.get(uid)?.carrierUid !== it.carrierUid)) {
        throw new Error('松果免费选卡的 UID、资金或道具状态无法核对；不会出售');
      }
      const [uid, unit] = fresh[0];
      ledger.set(uid, { ...unit, identity: ctx.identity, protected: bases(message.keep).has(unit.base) || placementProtected.has(uid) || unit.area==='board' });
      return { uid, id: unit.id };
    }
    async function pickFlametailMergeReward(message) {
      const proof = pendingReward;
      const ctx = context({ allowReward: true });
      const offer = ctx.p.shop.rewardOffer;
      if (!['flametail_merge','packaging_merge','keep_merge'].includes(proof?.kind) || proof.identity !== ctx.identity ||
          !(proof.kind!=='flametail_merge' ? isPackagingMergeOffer(offer,chess,ctx.p.shop.level) : flametailMergeOffer(offer)) || proof.stamp !== stampOffer(offer)) {
        throw new Error('晋升奖励没有本次自动交易产生的独立合成证明；禁止自动选卡');
      }
      const slot = message.slot, card = offer.slots[slot];
      if (!Number.isInteger(slot) || !card || card.id !== message.expectedId ||
          message.expectedPrice !== 0 || !safeMergeCard(ctx, card.id, message.keep)) {
        throw new Error('合成晋升奖励已变化、特质不可核验或可能合成旧干员');
      }
      const before = ctx.units, beforeItems = ctx.items, funds = ctx.p.funds;
      pendingReward = null; // Single-use proof is burned BEFORE sending a potentially ambiguous request.
      const ok = await actions.reward(slot);
      if (ok !== true) throw new Error('合成晋升奖励被游戏拒绝；不会重试');
      const pushed = await waitFor(s => !s?.match?.private?.shop?.rewardOffer?.slots?.length &&
        [...(s?.match?.private?.hand || []), ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(x => x?.kind === 'chess' && x.id === card.id && !before.has(x.uid)));
      if (!pushed) throw new Error('合成晋升奖励可能已选择，但 UID 回执未确认；不会重试');
      const after = context();
      const fresh = [...after.units].filter(([uid]) => !before.has(uid));
      if (after.identity !== ctx.identity || after.p.funds < funds || after.p.shop.rewardOffer?.slots?.length ||
          fresh.length !== 1 || fresh[0][1].id !== card.id || fresh[0][1].golden || fresh[0][1].equipped!==0 ||
          [...before].some(([uid, old]) => !sameUnitWithPlacement(old,after.units.get(uid))) ||
          after.items.size !== beforeItems.size ||
          [...beforeItems].some(([uid, it]) => after.items.get(uid)?.id !== it.id ||
            after.items.get(uid)?.area !== it.area ||
            after.items.get(uid)?.carrierUid !== it.carrierUid)) {
        throw new Error('合成晋升奖励 UID、资金或旧库存变化无法核对；不会出售');
      }
      const [uid, unit] = fresh[0];
      ledger.set(uid, { ...unit, identity: ctx.identity, surplusGift:proof.kind==='flametail_merge',
        protected: (proof.kind!=='flametail_merge' && bases(message.keep).has(unit.base)) || placementProtected.has(uid) || unit.area==='board' });
      return { uid, id: unit.id };
    }
    async function sell(message) {
      const uid = message.uid;
      if (!Number.isInteger(uid)) throw new Error('出售 UID 无效');
      observePlacement();
      if(placementProtected.has(uid))return {uid,cancelled:'placement'};
      const entry = ledger.get(uid);
      if (!entry) throw new Error('该 UID 并非插件本次买入或选卡产生，禁止出售');
      const proof=pendingReward;
      const drain=message.expectedSale?.pendingMergeStamp!=null;
      const ctx = context({allowReward:drain});
      if(drain && (proof?.kind!=='flametail_merge' || proof.identity!==ctx.identity ||
        !proof.drainUids?.includes(uid) || proof.stamp!==stampOffer(ctx.p.shop.rewardOffer) ||
        proof.stamp!==message.expectedSale.pendingMergeStamp || !flametailMergeOffer(ctx.p.shop.rewardOffer) ||
        entry.id===PINECONE))throw new Error('腾位出售缺少本次焰尾合成证明或新UID授权');
      const now = ctx.units.get(uid);
      if (ctx.identity !== entry.identity || !now || now.id !== entry.id || now.base !== entry.base) {
        throw new Error('待售 UID 或对局与购买记录不一致');
      }
      if(now.id===entry.id && now.base===entry.base && now.equipped===entry.equipped &&
        now.area!==entry.area && compatiblePlacementArea(now.area,entry.area)){
        placementProtected.add(uid);ledger.delete(uid);return {uid,cancelled:'placement'};
      }
      if(now.area==='board'){placementProtected.add(uid);ledger.delete(uid);return {uid,cancelled:'placement'};}
      const saleBefore=tradeSnapshot(ctx);
      if(!matchesSaleIntent(saleBefore,uid,message.expectedSale) || now.area!==entry.area || now.equipped!==0)
        throw new Error('待售干员或完整库存已偏离本次批准快照，未发送出售');
      if (entry.protected || (bases(message.keep).has(entry.base) &&
        !(entry.surplusGift===true && canSellSurplusGift(saleBefore,uid,message,chess)))) throw new Error('命中保留数量目标，禁止出售');
      if (pendingReward && !drain) throw new Error('上一笔奖励尚未核对；禁止继续出售');
      const ok = await actions.sell(uid);
      if (ok !== true) throw new Error('游戏服务器拒绝出售');
      ledger.delete(uid); // never retry an acknowledged sale without fresh UID evidence
      const vanished=await waitFor(s=>![...(s?.match?.private?.hand || []),...(s?.match?.private?.board || []),...(s?.match?.private?.temp || [])].some(piece=>piece?.kind==='chess' && piece.uid===uid));
      if(!vanished)throw new Error('出售已确认但目标 UID 尚未消失；不重试');
      const saleAfter=context({allowReward:true});
      const packaging=(drain ? auditPendingMergeSale : auditPackagingSale)(saleBefore,tradeSnapshot(saleAfter),uid,{chess,gameItems:itemData});
      if(!packaging.ok)throw new Error(packaging.reason);
      // Proven refill only updates location on an EXISTING authorization, never creates one.
      for(const refilledUid of packaging.refilledUids || []){
        const saved=ledger.get(refilledUid), moved=saleAfter.units.get(refilledUid);
        if(saved && moved && saved.identity===saleAfter.identity)saved.area=moved.area;
      }
      if(packaging.packagingReward){
        if(now.id===PINECONE)throw new Error('松果奖励与包装合成同时出现，暂不自动选卡');
        pendingReward={kind:'packaging_merge',identity:ctx.identity,stamp:stampOffer(saleAfter.p.shop.rewardOffer)};
        for(const [oldUid] of ctx.units)if(!saleAfter.units.has(oldUid))ledger.delete(oldUid);
      } else if(!drain && saleAfter.p.shop.rewardOffer?.slots?.length && now.id!==PINECONE){
        throw new Error('出售后奖励来源无法核验，禁止自动领取');
      }
      if (now.id === PINECONE) {
        const updated = await waitFor(s => ![...(s?.match?.private?.hand || []),
          ...(s?.match?.private?.board || []), ...(s?.match?.private?.temp || [])]
          .some(piece => piece?.kind === 'chess' && piece.uid === uid) &&
          s?.match?.private?.shop?.rewardOffer?.slots?.length > 0);
        if (!updated) throw new Error('松果售出可能已生效，但免费特殊招募未确认；不会再次出售');
        const after = context({ allowReward: true });
        const offer = after.p.shop.rewardOffer;
        if (after.identity !== ctx.identity || !pineconeOffer(offer) || after.units.has(uid) ||
            [...ctx.units].some(([id]) => id !== uid && !after.units.has(id))) {
          throw new Error('松果出售后奖励来源或库存无法核对；不会自动选卡');
        }
        pendingReward = { kind: 'pinecone', identity: ctx.identity, stamp: stampOffer(offer) };
      }
      return { uid };
    }
    const preparedRounds=new Set();
    async function prepareRound(message){
      if(typeof actions.ready!=='function')throw new Error('本服不提供准备接口');
      const ctx=context(),s=store.get(),round=s.match.public.round;
      if(ctx.identity!==message.identity || JSON.stringify(view().match.private)!==message.stamp ||
        !(message.maximumFunds===null || Number.isSafeInteger(message.maximumFunds)&&message.maximumFunds>=0) ||
        typeof message.skipTenth!=='boolean' || message.maximumFunds!==null && ctx.p.funds>message.maximumFunds ||
        message.skipTenth && round%10===0 || !Number.isInteger(round) || round<1 || ctx.p.temp.length || pendingReward)
        throw new Error('准备前身份、资金、回合、奖励或库存变化；未发送准备');
      if(preparedRounds.has(ctx.identity))throw new Error('本回合准备已尝试，不重复发送');
      preparedRounds.add(ctx.identity);if(preparedRounds.size>128)preparedRounds.delete(preparedRounds.values().next().value);
      if(await actions.ready(true)!==true)throw new Error('准备请求未确认，可能已生效；不重试');
      const confirmed=await waitFor(raw=>raw?.room?.code===s.room.code && raw?.me?.playerId===s.me.playerId &&
        (raw?.match?.private?.ready===true || ['BATTLE','POST'].includes(raw?.match?.public?.phase)));
      if(!confirmed)throw new Error('准备回执已收到，但状态未确认；不重试');
      return {prepared:true};
    }
    handleMessage = event => {
      const msg = event.data;
      if (event.source !== window || event.origin !== location.origin ||
          msg?.channel !== CHANNEL || msg.side !== 'ui' || msg.nonce !== nonce || msg.version !== cfg.version) return;
      if (msg.type === 'dispose') { ownBridge.dispose(); return; }
      if (msg.type === 'snapshot-request') { send('snapshot', { state: view() }); return; }
      if (!['buy','buy-item','sell','refresh','coin','use-item','reward','merge-reward','prepare'].includes(msg.type) || typeof msg.rid !== 'string' || msg.rid.length > 100) return;
      if (busy) { reject(msg.rid, '另一笔交易尚未结束'); return; }
      busy = true;
      (msg.type === 'prepare' ? prepareRound(msg) : msg.type === 'buy' ? buy(msg) : msg.type === 'buy-item' ? buyItem(msg) : msg.type === 'sell' ? sell(msg) :
        msg.type === 'coin' ? useCoin(msg) : msg.type === 'use-item' ? useItem(msg) : msg.type === 'reward' ? pickReward(msg) :
        msg.type === 'merge-reward' ? pickFlametailMergeReward(msg) : refresh(msg)).then(
        result => send('response', { rid: msg.rid, ok: true, result }),
        error => reject(msg.rid, error?.message || String(error)),
      ).finally(() => { busy = false; });
    };
    window.addEventListener('message', handleMessage);
    observePlacement();
    offStore = store.subscribe(raw => {
      observePlacement();
      // Any manual selection/changed offer burns its typed, one-use proof, even
      // if a later unrelated offer happens to show exactly the same cards.
      if (pendingReward) {
        const offer = raw?.match?.private?.shop?.rewardOffer;
        if (!(pendingReward.kind === 'pinecone' ? pineconeOffer(offer) :
              (pendingReward.kind === 'flametail_merge' && flametailMergeOffer(offer) ||
                ['packaging_merge','keep_merge'].includes(pendingReward.kind) && isPackagingMergeOffer(offer,chess,raw?.match?.private?.shop?.level))) ||
            pendingReward.stamp !== stampOffer(offer)) pendingReward = null;
      }
      send('snapshot', { state: view(raw) });
    });
    send('snapshot', { state: view() });
  }
  boot().catch(error => {
    send('bridge-error', { reason: error?.message || String(error) });
    globalThis.__weiMainBridge?.dispose?.();
  });
})();

})();
