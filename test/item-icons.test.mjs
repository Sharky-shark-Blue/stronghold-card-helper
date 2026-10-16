import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as Model from '../src/model.js';
import {tradePlanKey} from '../src/engine/plan-adapter.js';
const [A,B,C,D]=Model.ITEMS.slice(0,4).map(x=>x.id);
const create=extra=>Model.normalizePlan({buy:['operator_a'],keep:['operator_b'],items:[A,B,C].map(id=>({id,enabled:false,limit:null})),...extra});

test('旧方案道具图标顺序默认沿用原道具数组，三份名单的顺序独立',()=>{
 const p=create();assert.deepEqual(p.itemIconOrder,[A,B,C]);assert.deepEqual(p.iconOrder,{buy:['operator_a'],keep:['operator_b']});
});
test('道具顺序清理重复、未知、跨名单和危险ID，并补齐漏项',()=>{
 assert.deepEqual(create({itemIconOrder:[C,C,'operator_a','__proto__','missing',A]}).itemIconOrder,[C,A,B]);
});
test('道具可以移到目标前或后，来源方案不被修改',()=>{
 const p=create(),snapshot=JSON.stringify(p);
 assert.deepEqual(Model.moveItemIcon(p,C,A).itemIconOrder,[C,A,B]);
 assert.deepEqual(Model.moveItemIcon(p,A,C,true).itemIconOrder,[B,C,A]);assert.equal(JSON.stringify(p),snapshot);
});
test('自己、原地以及非法来源或目标不会写回',()=>{
 const p=create();for(const args of [[A,A],[A,B],[B,A,true],['missing',B],[A,'missing']])assert.equal(Model.moveItemIcon(p,...args),p);
});
test('新增和移除道具后，图标顺序追加新项并清理旧项',()=>{
 let p=create({itemIconOrder:[C,A,B]});p=Model.normalizePlan(Model.addItem(p,D).plan);
 assert.deepEqual(p.itemIconOrder,[C,A,B,D]);p=Model.normalizePlan(Model.removeItem(p,A).plan);assert.deepEqual(p.itemIconOrder,[C,B,D]);
});
test('道具拖动不改真实购买/自动使用顺序、规则、累计、开关或干员名单',()=>{
 const p=create({items:[{id:A,limit:4,enabled:true,minFunds:20,autoUse:true},{id:B,limit:null,enabled:false}],itemSession:{used:{[A]:2},epoch:7}});
 const q=Model.moveItemIcon(p,B,A);
 for(const key of ['items','itemSession','buy','keep','iconOrder','disabled','keepRules'])assert.deepEqual(q[key],p[key]);
 assert.equal(tradePlanKey(q),tradePlanKey(p));
});
test('道具图标模式与排序可保存、导出、导入；旧配置自动回退默认顺序',()=>{
 const p=Model.moveItemIcon(create({iconOnly:true,compact:true}),C,A);
 const q=Model.importConfig(Model.exportConfig(p),create()).plan;
 assert.equal(q.iconOnly,true);assert.equal(q.compact,true);assert.deepEqual(q.itemIconOrder,p.itemIconOrder);
 const old=Model.importConfig({buy:[],keep:[],items:p.items},p).plan;assert.deepEqual(old.itemIconOrder,p.items.map(x=>x.id));
});
test('手动名称道具同样支持排序，名称与启用状态不会丢失',()=>{
 const id='manual_item_icon_test',p=create({items:[{id:A},{id,name:'图标道具测试',enabled:false}]});
 const q=Model.moveItemIcon(p,id,A);assert.deepEqual(q.itemIconOrder,[id,A]);assert.deepEqual(q.items,p.items);
});
test('拖动达到上限的道具不会清零或重新启用；明确手动启用才按原规则清零',()=>{
 const p=create({items:[{id:A,limit:2,enabled:true,autoUse:true},{id:B}],itemSession:{used:{[A]:2},epoch:0}});
 assert.equal(p.items[0].enabled,false);const q=Model.moveItemIcon(p,A,B,true);
 assert.equal(q.items[0].enabled,false);assert.equal(q.itemSession.used[A],2);assert.equal(q.items[0].autoUse,true);
 const r=Model.toggleItemEnabled(q,A);assert.equal(r.plan.items[0].enabled,true);assert.equal(r.plan.itemSession.used[A]||0,0);assert.equal(r.plan.items[0].autoUse,true);
});
test('关闭购买不会关闭独立自动使用；真实购买开关仍改变交易方案键',()=>{
 const p=create({items:[{id:A,enabled:false,autoUse:true}]});const q=Model.toggleItemEnabled(p,A).plan;
 assert.equal(q.items[0].autoUse,true);assert.notEqual(tradePlanKey(p),tradePlanKey(q));
});
test('道具图标只含图片，沿用购买开关；正常列表与图标均接受双右键',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 const tile=ui.slice(ui.indexOf('function itemIconMarkup'),ui.indexOf('function toggleItemEntry'));
 assert.match(tile,/itemAvatar\(item,name\)/);assert.match(tile,/data-action="item-toggle"/);assert.match(tile,/data-entry-kind="items"/);
 assert.doesNotMatch(tile,/keep-rules|operator-text|data-item-limit/);
 assert.match(tile,/item-owned-badge/);assert.match(ui,/function updateItemOwnedCounts/);assert.match(ui,/本局持有/);
 assert.ok(ui.includes("$('#item-list').contains(row)"));assert.ok(ui.includes("row.closest('#keep-item-icons') ? quickToggleItem(itemId) : toggleItemEntry(itemId)"));
 assert.match(ui,/\[\.\.\.plan.items\]/);assert.match(ui,/plan\.iconOnly\?plan\.itemIconOrder:plan\.itemSession\.used/);
});
test('道具网格、键盘排序和离线构建都已接入，累计确认仍能取消旧清零确认',()=>{
 const css=fs.readFileSync(new URL('../styles/icons.css',import.meta.url),'utf8');
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 assert.match(css,/#item-list\{/);assert.match(ui,/plan\.itemsView \? plan\.itemIconOrder/);
 assert.ok(ui.includes('plan=result.plan;resetItemConfirm();render();'));
 assert.match(fs.readFileSync(new URL('../build.mjs',import.meta.url),'utf8'),/'moveItemIcon'/);
});
