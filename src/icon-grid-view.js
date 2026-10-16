// Grid geometry and DOM preview, independent of the plan and all game transactions.
const GRID_RESERVE_CELLS = 32;
export function iconGridMarkup(slots, entries, markup, maxCells) {
  const byId=new Map(entries.map(entry=>[entry.id,entry]));
  const length=Math.min(maxCells,Math.max(32,slots.length+GRID_RESERVE_CELLS));
  return Array.from({length},(_,index)=>{
    const entry=byId.get(slots[index]);
    return entry ? markup(entry).replace('<button ',`<button data-grid-cell="${index}" `) :
      `<span class="icon-grid-cell${slots[index] ? ' is-filtered-cell' : ''}${index>=slots.length ? ' is-grid-reserve' : ''}" data-grid-cell="${index}" aria-hidden="true"></span>`;
  }).join('');
}
export function gridColumns(list) {
  const view=list.ownerDocument.defaultView, style=view.getComputedStyle(list);
  const columns=style.gridTemplateColumns.split(/\s+/).filter(value=>/^\d/.test(value));
  return Math.max(1,columns.length);
}
export function pointGridCell(list, scroller, x, y, maxCells) {
  const rect=list.getBoundingClientRect(), clip=scroller.getBoundingClientRect();
  if(x<Math.max(rect.left,clip.left) || x>Math.min(rect.right,clip.right) ||
    y<Math.max(rect.top,clip.top) || y>Math.min(rect.bottom,clip.bottom))return null;
  const style=list.ownerDocument.defaultView.getComputedStyle(list);
  const size=parseFloat(style.getPropertyValue('--operator-icon-size')) || 44;
  const gapX=parseFloat(style.columnGap) || 0, gapY=parseFloat(style.rowGap) || 0;
  const left=rect.left+(parseFloat(style.paddingLeft) || 0), top=rect.top+(parseFloat(style.paddingTop) || 0);
  const columns=gridColumns(list);
  const col=Math.max(0,Math.min(columns-1,Math.floor((x-left+gapX/2)/(size+gapX))));
  const row=Math.max(0,Math.floor((y-top+gapY/2)/(size+gapY)));
  const index=row*columns+col;
  return index<maxCells ? index : null;
}
export function previewGridDom(state, slots, maxCells, targetCell) {
  const list=state.list, doc=list.ownerDocument, columns=gridColumns(list);
  const count=Math.min(maxCells,Math.max(state.cellCount,slots.length+GRID_RESERVE_CELLS,targetCell+columns*2));
  const fragment=doc.createDocumentFragment();
  for(let index=0;index<count;index++) {
    const id=slots[index];let node=id===state.id ? state.placeholder : state.tileNodes.get(id);
    if(!node){
      node=state.emptyNodes.get(index);
      if(!node){node=doc.createElement('span');node.className='icon-grid-cell';node.setAttribute('aria-hidden','true');state.emptyNodes.set(index,node);}
    }
    node.dataset.gridCell=String(index);
    node.classList.toggle('is-grid-reserve',index>=slots.length);
    node.classList.toggle('is-grid-target',index===targetCell);
    fragment.append(node);
  }
  list.replaceChildren(fragment);state.cellCount=count;
}
export function restoreGridDom(state) {
  if(!state.originalChildren)return;
  state.originalChildren.forEach((node,index)=>{node.dataset.gridCell=String(index);node.classList.remove('is-grid-target');node.classList.toggle('is-grid-reserve',index>=state.baseSlots.length);});
  state.list.replaceChildren(...state.originalChildren);
}
