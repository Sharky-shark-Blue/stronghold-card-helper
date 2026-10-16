// Sparse display layout only. Never changes membership, enabled flags or transaction priority.
export const GRID_MAX_CELLS = 2048;
export function normalizeIconGrid(raw, orderedIds) {
  const allowed=new Set(orderedIds), seen=new Set(), slots=[];
  if(Array.isArray(raw))for(const id of raw.slice(0,GRID_MAX_CELLS)) {
    const keep=typeof id==='string' && allowed.has(id) && !seen.has(id);
    slots.push(keep ? id : null);if(keep)seen.add(id);
  }
  while(slots.length && slots.at(-1)===null)slots.pop();
  for(const id of orderedIds)if(!seen.has(id)) {
    if(slots.length<GRID_MAX_CELLS)slots.push(id);
    else {const free=slots.indexOf(null);if(free<0)break;slots[free]=id;}
    seen.add(id);
  }
  return slots;
}
export function placeIconGrid(slots, sourceId, cell) {
  if(!Array.isArray(slots) || !Number.isInteger(cell) || cell<0 || cell>=GRID_MAX_CELLS)return null;
  const source=slots.indexOf(sourceId);if(source<0 || source===cell)return null;
  const next=slots.slice(0,GRID_MAX_CELLS);next[source]=null;
  while(next.length<=cell)next.push(null);
  let carried=sourceId;
  for(let index=cell;index<GRID_MAX_CELLS;index++) {
    const displaced=next[index] ?? null;next[index]=carried;
    if(displaced===null){
      while(next.length && next.at(-1)===null)next.pop();
      return next;
    }
    carried=displaced;
  }
  return null; // Full tail: do not discard an icon or alter the caller's array.
}
