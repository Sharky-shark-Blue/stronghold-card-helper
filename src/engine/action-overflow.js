// Only call inside a fully audited buy/sell action, never for idle/manual changes.
// Normalize one-way refill for surviving, identical old UIDs; the enclosing action audit
// must still prove EVERY disappearance, new UID, equipment return, and reward.
export function normalizeActionRefill(before, after) {
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
