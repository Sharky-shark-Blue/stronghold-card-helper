import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as Model from '../src/model.js';
import {tradePlanKey} from '../src/engine/plan-adapter.js';
const A='chess_icon_a',B='chess_icon_b',C='chess_icon_c',D='chess_icon_d';
const create=extra=>Model.normalizePlan({buy:[A,B,C],keep:[A,C,D],...extra});

test('旧方案默认仍用原列表，紧凑偏好保留，初始图标顺序与各名单一致',()=>{
 const p=create({compact:true});assert.equal(p.iconOnly,false);assert.equal(p.compact,true);
 assert.deepEqual(p.iconOrder,{buy:[A,B,C],keep:[A,C,D]});
});
test('仅图标是严格布尔值，不把字符串或其他真值当作开启',()=>{
 for(const value of ['true',1,{},null])assert.equal(create({iconOnly:value}).iconOnly,false);
 assert.equal(create({iconOnly:true}).iconOnly,true);
});
test('图标顺序去重并剔除未知、跨名单和危险ID，补齐未排列条目',()=>{
 const p=create({iconOrder:{buy:[C,C,D,'__proto__','missing',A],keep:[D,B]}});
 assert.deepEqual(p.iconOrder,{buy:[C,A,B],keep:[D,A,C]});
});
test('新增条目追加到图标顺序末尾，移除后不留下悬空ID',()=>{
 let p=create({iconOrder:{buy:[C,A,B]}});p=Model.normalizePlan(Model.addOperator(p,D));
 assert.deepEqual(p.iconOrder.buy,[C,A,B,D]);
 p=Model.normalizePlan(Model.removeOperator(p,A).plan);assert.deepEqual(p.iconOrder.buy,[C,B,D]);
});
test('拖到目标前面与后面分别插入，不修改原方案',()=>{
 const p=create(),before=JSON.stringify(p);
 assert.deepEqual(Model.moveIconOperator(p,C,A).iconOrder.buy,[C,A,B]);
 assert.deepEqual(Model.moveIconOperator(p,A,C,true).iconOrder.buy,[B,C,A]);
 assert.equal(JSON.stringify(p),before);
});
test('支持中间条目移到末尾后再移到最前',()=>{
 const p=Model.moveIconOperator(create(),B,C,true);
 assert.deepEqual(p.iconOrder.buy,[A,C,B]);
 assert.deepEqual(Model.moveIconOperator(p,B,A).iconOrder.buy,[B,A,C]);
});
test('自己、原地、未知来源/目标及非干员名单排序都不写回',()=>{
 const p=create();
 for(const args of [[A,A],[A,B],[B,A,true],['missing',A],[A,'missing'],[A,C,true,'items']])
  assert.equal(Model.moveIconOperator(p,...args),p);
});
test('买入和保留的显示顺序独立保存',()=>{
 const p=create(),q=Model.moveIconOperator(p,D,A,false,'keep');
 assert.deepEqual(q.iconOrder.keep,[D,A,C]);assert.deepEqual(q.iconOrder.buy,p.iconOrder.buy);
});
test('拖动锁定或禁用项只改位置，锁、手动禁用和保留规则都保留',()=>{
 const p=create({locks:{buy:[A],keep:[D]},disabled:{buy:[B],keep:[D]},keepRules:{D:{limit:3,minFunds:20}}});
 const q=Model.moveIconOperator(p,D,A,false,'keep');
 for(const key of ['buy','keep','locks','disabled','keepRules','items','itemSession'])assert.deepEqual(q[key],p[key]);
});
test('过滤隐藏的条目仍保留在完整顺序中，普通列表顺序不受拖动影响',()=>{
 const catalogue={operators:[A,B,C].map((id,i)=>({id,name:'角色'+i,buyable:true,bonds:[],bondNames:[],charId:'',tier:1}))};
 const p=create({disabled:{buy:[B]},filters:{buy:{enabledOnly:true}}});
 const q=Model.moveIconOperator(p,C,A);
 assert.deepEqual(q.iconOrder.buy,[C,A,B]);assert.deepEqual(Model.addedOperators(catalogue,q).map(o=>o.id),[A,C]);
 assert.deepEqual(q.buy,[A,B,C]);
});
test('导出导入和保存恢复保留图标模式、密度与两份图标顺序',()=>{
 const p=Model.moveIconOperator(create({iconOnly:true,compact:true}),C,A);
 const restored=Model.normalizePlan(JSON.parse(JSON.stringify(p)));
 const imported=Model.importConfig(Model.exportConfig(p),create()).plan;
 for(const q of [restored,imported]){assert.equal(q.iconOnly,true);assert.equal(q.compact,true);assert.deepEqual(q.iconOrder,p.iconOrder);}
});
test('导入没有新字段的旧配置安全回退，绝不把旧顺序套到另一份名单',()=>{
 const result=Model.importConfig({buy:[B,A],keep:[D]},create({iconOnly:true}));
 assert.equal(result.ok,true);assert.equal(result.plan.iconOnly,false);assert.deepEqual(result.plan.iconOrder,{buy:[B,A],keep:[D]});
});
test('手动干员也可排序，名称与两份名单的独立禁用状态不变',()=>{
 const id='manual_icon_test',p=create({buy:[A,id,B],keep:[id],customOperators:[{id,name:'图标手动测试'}],disabled:{buy:[id],keep:[]}});
 const q=Model.moveIconOperator(p,id,A);assert.deepEqual(q.iconOrder.buy,[id,A,B]);
 assert.deepEqual(q.customOperators,p.customOperators);assert.deepEqual(q.disabled,p.disabled);
});
test('图标模式和排序不会改变交易方案键；真实禁用仍会改变',()=>{
 const p=create(),q=Model.moveIconOperator({...p,iconOnly:true,compact:true},C,A);
 assert.equal(tradePlanKey(q),tradePlanKey(p));
 assert.notEqual(tradePlanKey(Model.toggleDisabled(q,A)),tradePlanKey(q));
});
test('图标瓦片仅包含头像，沿用原禁用动作与双右键路径，拖动监听会清理',()=>{
 const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
 const tile=ui.slice(ui.indexOf('function iconTileMarkup'),ui.indexOf('function keepOwnedCount'));
 assert.match(tile,/operatorAvatar\(op\)/);assert.doesNotMatch(tile,/draggable="true"/);assert.match(tile,/data-action="disable"/);
 assert.doesNotMatch(tile,/operator-text|operator-bonds|entry-actions|keep-rules|data-keep-limit/);
 assert.match(ui,/data-action="icons"/);assert.match(ui,/lastRight.kind === plan.active/);
 for(const event of ['pointerdown','pointermove','pointerup','pointercancel','lostpointercapture'])assert.ok(ui.includes("removeEventListener('"+event+"'"));
 assert.match(fs.readFileSync(new URL('../build.mjs',import.meta.url),'utf8'),/'moveIconOperator'/);
});
