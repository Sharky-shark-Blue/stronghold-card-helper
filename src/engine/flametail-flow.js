// Pure, independently checked in both worlds. Does not grant any UID sale authority.
export function canSellSurplusGift(ctx, uid, plan, chess) {
  const unit=ctx?.unitByUid?.get(uid), base=unit?.base;
  if(!ctx?.ok || !unit || !base || !chess?.[base] || !ctx.ownedCopies)return false;
  const kept=(Array.isArray(plan?.keep) ? plan.keep : []).some(id=>
    id===base || (chess?.[id]?.baseId===base && !!chess[base]));
  if(!kept)return true;
  const limit=plan?.keepRules?.[base]?.limit, held=ctx.ownedCopies[base];
  return Number.isInteger(limit) && limit>0 && limit<=99 && Number.isInteger(held) &&
    held-(unit.golden ? 3 : 1)>=limit;
}

