import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as Model from '../src/model.js';
import { resolveGamePlan, isLiveItemPause } from '../src/engine/plan-adapter.js';

test('总开关暂停抓取但不改逐项配置，恢复不是全部启用且不清零',()=>{
  const [a,b,c]=Model.ITEMS;
  const original=Model.normalizePlan({items:[{id:a.id,enabled:true,limit:3,ownedTarget:2,autoUse:true},
    {id:b.id,enabled:false},{id:c.id,enabled:true,limit:1}],itemSession:{used:{[a.id]:1,[c.id]:1},epoch:4}});
  assert.equal(original.items[2].capPaused,true);
  const paused=Model.normalizePlan({...original,itemBuyingPaused:true});
  assert.deepEqual(paused.items,original.items);
  assert.deepEqual(paused.itemSession,original.itemSession);
  assert.equal(resolveGamePlan(paused,{}).plan.items.length,0);
  const restored=Model.normalizePlan({...paused,itemBuyingPaused:false});
  assert.deepEqual(restored,original);
  assert.equal(restored.items[1].enabled,false);
  assert.equal(restored.items[2].capPaused,true);
  assert.equal(isLiveItemPause(original,paused),true);
  assert.equal(isLiveItemPause(paused,restored),true);
  assert.equal(isLiveItemPause(original,{...paused,buy:['changed']}),false);
  assert.equal(isLiveItemPause(original,{...paused,itemSession:{used:{},epoch:5}}),false);
  assert.equal(isLiveItemPause(original,{...paused,items:paused.items.map(item=>({...item,limit:7}))}),false);
  assert.equal(Model.normalizePlan({itemBuyingPaused:'true'}).itemBuyingPaused,undefined);
  assert.equal(Model.exportConfig(paused).plan.itemBuyingPaused,undefined);
  assert.equal(Model.importConfig(Model.exportConfig(original),paused).plan.itemBuyingPaused,true);
  assert.equal(Model.nextItemMatch(paused).plan.itemBuyingPaused,true);
});
test('总开关提供暂停/恢复按钮，先持久保存；在途计数绕过总开关但不绕过映射核验',()=>{
  const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const host=fs.readFileSync(new URL('../src/runtime-host.js',import.meta.url),'utf8');
  assert.match(ui,/data-action="items-master-toggle"/);
  assert.match(ui,/恢复原配置/);assert.match(ui,/全部暂停/);
  const toggle=ui.slice(ui.indexOf('function toggleAllItemBuying'),ui.indexOf('function renderItems'));
  assert.match(toggle,/await saveQueue/);assert.match(toggle,/liveItemPause:true/);
  assert.doesNotMatch(toggle,/setItemEnabled|toggleItemEnabled|nextItemMatch/);
  assert.match(host,/itemBuyingPaused:false,items:/);
});
