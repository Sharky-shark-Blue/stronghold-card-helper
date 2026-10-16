import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { itemPurchaseState } from '../src/ui.js';

test('启用、禁用、已满互斥：手动禁用优先，次数与实时持有分别判断满额',()=>{
  assert.equal(itemPurchaseState({enabled:true,limit:null},0,0),'enabled');
  assert.equal(itemPurchaseState({enabled:false,limit:1,ownedTarget:3},1,3),'disabled');
  assert.equal(itemPurchaseState({enabled:false,capPaused:true,limit:1},1,0),'full');
  assert.equal(itemPurchaseState({enabled:true,ownedTarget:3},0,3),'full');
  assert.equal(itemPurchaseState({enabled:true,ownedTarget:3},0,2),'enabled');
  assert.equal(itemPurchaseState({enabled:true,ownedTarget:3},0,null),'enabled');
  assert.equal(itemPurchaseState({enabled:true,limit:1},1,0),'full');
});
test('三态独立配色，已满点击不会调用启用或清零，实时库存更新会更新状态',()=>{
  const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../styles/icons.css',import.meta.url),'utf8');
  const toggle=ui.slice(ui.indexOf('function toggleItemEntry'),ui.indexOf('function renderItems'));
  assert.ok(toggle.indexOf("if(itemState(item)==='full')") < toggle.indexOf('Model.toggleItemEnabled'));
  assert.match(toggle,/不会清零次数/);
  assert.match(ui,/row.dataset.purchaseState=status/);
  assert.match(ui,/button.textContent=ITEM_STATE_LABEL\[status\]/);
  assert.match(css,/data-purchase-state="enabled"\].*border-color:#34d399/);
  assert.match(css,/data-purchase-state="disabled"\].*border-color:#f87171/);
  assert.match(css,/data-purchase-state="full"\].*border-color:#fbbf24/);
});
