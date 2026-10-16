import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as Model from '../src/model.js';
import { isLiveItemToggle } from '../src/engine/plan-adapter.js';
const id=Model.ITEMS[0].id, other=Model.ITEMS[1].id;
const plan=()=>Model.normalizePlan({items:[{id,enabled:true,limit:3,ownedTarget:2,autoUse:true},{id:other,enabled:true}],itemSession:{used:{[id]:1},epoch:2}});
test('热切换只放行同一局的一件道具开关，不能夹带名单或规则修改',()=>{
  const a=plan(), b=Model.normalizePlan({...a,items:a.items.map(item=>item.id===id?{...item,enabled:false}:item)});
  assert.equal(isLiveItemToggle(a,b,id),true);
  assert.equal(isLiveItemToggle(b,a,id),true);
  assert.equal(isLiveItemToggle(a,b,'missing'),false);
  assert.equal(isLiveItemToggle(a,{...b,buy:['some_operator']},id),false);
  assert.equal(isLiveItemToggle(a,{...b,itemSession:{used:{},epoch:3}},id),false);
  assert.equal(isLiveItemToggle(a,{...b,items:b.items.map(item=>({...item,limit:7}))},id),false);
  assert.equal(isLiveItemToggle(a,{...b,items:b.items.map(item=>({...item,enabled:false}))},id),false);
  assert.equal(isLiveItemToggle(a,{...b,itemSession:{...b.itemSession,used:{[id]:2}}},id),true);
  assert.equal(b.itemSession.used[id],1);assert.equal(b.items[0].autoUse,true);
});
test('快捷区只在保留仅图标模式出现，沿用原图与三态，切换不清零且先保存',()=>{
  const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  assert.match(ui,/plan.iconOnly && !plan.itemsView && plan.active==='keep'/);
  assert.match(ui,/itemIconMarkup\(item,name\)\.replace/);
  assert.match(ui,/id="keep-item-icons"/);
  const toggle=ui.slice(ui.indexOf('function quickToggleItem'),ui.indexOf('function renderItems'));
  assert.match(toggle,/await saveQueue/);assert.match(toggle,/liveItemToggle:id/);
  assert.doesNotMatch(toggle,/setItemEnabled|toggleItemEnabled|nextItemMatch/);
  assert.match(toggle,/if\(itemState\(item\)==='full'\)/);
});
