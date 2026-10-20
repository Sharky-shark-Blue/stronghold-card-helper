import { sameUnitWithPlacement } from './placement.js';

// Both worlds use the same bounded proof; UID reuse is accepted only for these coin transitions.
const COIN_NORMAL_ID = 'chess_item_1_03_e_a';
const COIN_ELITE_ID = 'chess_item_1_03_e_b';
const coinAuditBench = item => !!item && ['hand','temp'].includes(item.area) && item.carrierUid == null;
const sameCoinAuditItem = (a,b) => !!a && !!b && a.uid===b.uid && a.id===b.id &&
  a.area===b.area && (a.carrierUid ?? null)===(b.carrierUid ?? null);
function coinAuditDiff(before, after) {
  return {
    changed: before.items.filter(item => !sameCoinAuditItem(item,after.itemByUid.get(item.uid))),
    output: after.items.filter(item => !sameCoinAuditItem(item,before.itemByUid.get(item.uid))),
  };
}

// The server's active 投资人 state repeats SERVER_GAIN twice, or three times at 100 layers.
// Both MAIN and the isolated controller derive this from the same private bond fields.
export function gainTraitRepeats(bonds) {
  if(bonds == null)return 1; // Legacy snapshots did not expose bonds.
  if(!Array.isArray(bonds))return null;
  const matches=bonds.filter(bond=>bond?.bondId==='investShip');
  if(!matches.length)return 1;
  if(matches.length!==1)return null;
  const bond=matches[0];
  if(bond.active===false)return 1;
  if(bond.active!==true || !Number.isSafeInteger(bond.layers) || bond.layers<0)return null;
  return bond.layers>=100 ? 3 : 2;
}

// Prove the exact number of newly granted NORMAL-coin equivalents, including automatic
// two-normal -> golden merges. Old golden/non-coin items never receive UID exemptions.
export function auditSwireCoinGift(before, after) {
  const fail=()=>({ok:false,reason:'普通购买产生未知赠装或丢失旧装备；诗怀雅赠币数量、身份或 UID 变化无法核验'});
  const expected=before.gainRepeats===undefined ? 1 : before.gainRepeats;
  const nextExpected=after.gainRepeats===undefined ? 1 : after.gainRepeats;
  if(!Number.isInteger(expected) || expected<1 || expected>3 || nextExpected!==expected)return fail();
  const {changed,output}=coinAuditDiff(before,after);
  if(!changed.length && !output.length)
    return expected===1 ? {ok:true,coin:null,coins:[],changedUids:[]} : fail();
  if(changed.some(item=>item.id!==COIN_NORMAL_ID || !coinAuditBench(item)) ||
      output.some(item=>![COIN_NORMAL_ID,COIN_ELITE_ID].includes(item.id) || !coinAuditBench(item)))return fail();
  const changedUids=new Set(changed.map(item=>item.uid));
  const normal=output.filter(item=>item.id===COIN_NORMAL_ID),gold=output.filter(item=>item.id===COIN_ELITE_ID);
  if(normal.length>expected || changed.length>2*gold.length ||
      normal.length+2*gold.length-changed.length!==expected ||
      normal.some(item=>before.itemByUid.has(item.uid)) ||
      gold.some(item=>before.itemByUid.has(item.uid) && !changedUids.has(item.uid)))return fail();
  const coins=[...gold,...normal].map(item=>({...item,gain:item.id===COIN_ELITE_ID?2:1,
    merged:item.id===COIN_ELITE_ID,
    ...(item.id===COIN_ELITE_ID && changed.length===1 ? {mergedFrom:changed[0].uid} : {})}));
  return {ok:true,coin:coins[0] || null,coins,changedUids:[...changedUids]};
}

export function auditCoinAction(before, after, parent, coin) {
  const fail=reason=>({ok:false,reason});
  const original=before?.itemByUid?.get(coin?.uid), target=before?.unitByUid?.get(parent?.uid);
  if(!before?.ok || !after?.ok || before.identity!==after.identity || !original || original.id!==coin?.id ||
      ![COIN_NORMAL_ID,COIN_ELITE_ID].includes(original.id) || !coinAuditBench(original) ||
      !target || target.id!==parent?.id || !Number.isInteger(target.equipped) || target.equipped<0 || target.equipped>=2 ||
      before.rewardOffer || after.rewardOffer || JSON.stringify(before.slots)!==JSON.stringify(after.slots) ||
      !Number.isSafeInteger(before.funds) || !Number.isSafeInteger(after.funds))
    return fail('盟约之币或装备目标、对局、商店状态无法核对');
  if(before.units.length!==after.units.length || before.units.some(unit=>!sameUnitWithPlacement(unit,after.unitByUid.get(unit.uid))))
    return fail('盟约之币使用后干员或装备状态出现额外变化');
  const {changed,output}=coinAuditDiff(before,after);
  const gain=original.id===COIN_ELITE_ID?2:1;
  if(after.funds===before.funds+gain && changed.length===1 && changed[0].uid===original.uid && !output.length)
    return {ok:true,gain,merged:false};
  // Some compatible equip implementations merge two loose normal coins before applying an effect.
  // Prove exactly two old coins -> one golden coin, zero funds change, no other inventory change.
  if(original.id===COIN_NORMAL_ID && after.funds===before.funds && changed.length===2 &&
      changed.some(item=>item.uid===original.uid) && changed.every(item=>item.id===COIN_NORMAL_ID && coinAuditBench(item)) &&
      output.length===1 && output[0].id===COIN_ELITE_ID && coinAuditBench(output[0]))
    return {ok:true,gain:0,merged:true,coin:output[0]};
  return fail('盟约之币使用后的资金或 UID、库存变化无法核对');
}
