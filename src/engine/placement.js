// Placement-only tolerance, shared by the controller and MAIN. Never equates different UIDs,
// identities, elite flags, equipment counts, or moves into/out of the temporary overflow area.
export function compatiblePlacementArea(before, after) {
  return before===after || (before==='hand' && after==='board') || (before==='board' && after==='hand');
}
export function sameUnitWithPlacement(before, after) {
  return !!before && !!after && before.uid===after.uid && before.id===after.id && before.base===after.base &&
    before.golden===after.golden && before.equipped===after.equipped && compatiblePlacementArea(before.area,after.area);
}
export function changedDeployment(before, after) {
  return sameUnitWithPlacement(before,after) && before.area!==after.area;
}
