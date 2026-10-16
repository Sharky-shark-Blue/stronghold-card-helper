import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as M from '../src/model.js';
const catalogue = JSON.parse(await readFile(new URL('../data/catalogue.json', import.meta.url)));
const op = catalogue.operators.find(value => value.buyable);

test('真实快照包含 133 位干员、112 位买入候选和 23 个盟约', () => {
  assert.equal(catalogue.operators.length, 133);
  assert.equal(catalogue.operators.filter(x => x.buyable).length, 112);
  assert.equal(catalogue.bonds.length, 23);
  assert.equal(new Set(catalogue.operators.map(x => x.id)).size, 133);
});
test('初始方案没有名单或启用状态', () => {
  const p = M.normalizePlan(null);
  assert.deepEqual(p.buy, []); assert.deepEqual(p.keep, []);
  assert.equal(p.draftEnabled, false); assert.equal(p.width, 400);
});
test('归一化拒绝错误类型与无效 ID，合并锁定项', () => {
  const p = M.normalizePlan({ buy:['a','a','<script>',42], locks:{buy:['b']}, width:9999, filters:{buy:{query:5,tier:55}} });
  assert.deepEqual(p.buy,['a','b']); assert.deepEqual(p.locks.buy,['b']);
  assert.equal(p.width,400); assert.equal(p.filters.buy.query,''); assert.equal(p.filters.buy.tier,0);
});
test('锁定会自动选中，取消选择不会移除锁定干员', () => {
  const p = M.toggleLock(M.normalizePlan(null),op.id);
  assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.locks.buy,[op.id]);
  const result = M.toggleSelection(p,op.id);
  assert.equal(result.reason,'locked'); assert.deepEqual(result.plan.buy,[op.id]);
});
test('解锁不会自动取消选择，之后可取消', () => {
  let p = M.toggleLock(M.normalizePlan(null),op.id);
  p = M.toggleLock(p,op.id);
  assert.deepEqual(p.locks.buy,[]); assert.deepEqual(p.buy,[op.id]);
  assert.deepEqual(M.toggleSelection(p,op.id).plan.buy,[]);
});
test('买入与保留互相独立', () => {
  let p = M.toggleLock(M.normalizePlan(null),op.id,'buy');
  p = M.toggleSelection(p,op.id,'keep').plan;
  p = M.clearUnlocked(p,'keep');
  assert.deepEqual(p.keep,[]); assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.locks.keep,[]);
});
test('批量清空不移除锁定项', () => {
  let p = M.examplePlan(catalogue), locks = [...p.locks.buy];
  p = M.clearUnlocked(p);
  assert.deepEqual(p.buy,locks); assert.equal(p.keep.length,4);
});
test('搜索支持名称、静态 ID 和盟约', () => {
  const p = M.normalizePlan(null);
  for (const query of [op.name,op.id,op.bondNames[0]]) {
    assert.ok(M.filterOperators(catalogue,M.updateFilter(p,{query})).some(x => x.id === op.id));
  }
});
test('买入隐藏角色被排除，但可加入保留名单', () => {
  const p = M.normalizePlan(null), hidden = catalogue.operators.find(x => x.hidden);
  assert.ok(hidden);
  assert.ok(!M.filterOperators(catalogue,p).some(x => x.id === hidden.id));
  assert.ok(M.filterOperators(catalogue,p,'keep').some(x => x.id === hidden.id));
});
test('阶级、盟约与只看已选组合筛选', () => {
  let p = M.toggleSelection(M.normalizePlan(null),op.id).plan;
  p = M.updateFilter(p,{tier:op.tier,bond:op.bonds[0],selectedOnly:true});
  assert.deepEqual(M.filterOperators(catalogue,p).map(x => x.id),[op.id]);
});
test('批量选中不重复，并保留原有选择', () => {
  const visible = catalogue.operators.filter(x => x.buyable).slice(0,4);
  let p = M.selectVisible(M.normalizePlan(null),visible);
  p = M.selectVisible(p,visible);
  assert.equal(p.buy.length,4); assert.deepEqual(p.keep,[]);
});
test('列表筛选状态独立，纯函数不修改输入', () => {
  const p = M.normalizePlan(null), original = JSON.stringify(p);
  const next = M.updateFilter(p,{query:'隐现'},'buy');
  assert.equal(next.filters.keep.query,''); assert.equal(JSON.stringify(p),original);
});

test('旧方案自动迁移，现有名单与锁定不丢失', () => {
  const p=M.normalizePlan({schema:1,buy:[op.id],locks:{buy:[op.id]}});
  assert.equal(p.schema,3); assert.deepEqual(p.buy,[op.id]);
  assert.deepEqual(p.disabled,{buy:[],keep:[]});
});
test('单击新增不会重复添加，另一份名单不受影响', () => {
  let p=M.addOperator(M.normalizePlan(null),op.id);
  p=M.addOperator(p,op.id); assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.keep,[]);
});
test('常态列表只显示已添加项，保持添加顺序', () => {
  const choices=catalogue.operators.filter(x=>x.buyable).slice(0,3);
  let p=M.normalizePlan(null); assert.equal(M.addedOperators(catalogue,p).length,0);
  for(const x of choices.toReversed())p=M.addOperator(p,x.id);
  assert.deepEqual(M.addedOperators(catalogue,p).map(x=>x.id),choices.toReversed().map(x=>x.id));
});
test('禁用不移除，再次切换恢复启用，状态独立', () => {
  let p=M.addOperator(M.normalizePlan(null),op.id);
  p=M.addOperator(p,op.id,'keep'); p=M.toggleDisabled(p,op.id).plan;
  assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.disabled.buy,[op.id]); assert.deepEqual(p.disabled.keep,[]);
  assert.equal(M.addedOperators(catalogue,p).length,1);
  p=M.toggleDisabled(p,op.id).plan; assert.deepEqual(p.disabled.buy,[]);
});
test('禁用状态经保存恢复，未添加项不能禁用', () => {
  let p=M.toggleDisabled(M.addOperator(M.normalizePlan(null),op.id),op.id).plan;
  p=M.normalizePlan(JSON.parse(JSON.stringify(p))); assert.deepEqual(p.disabled.buy,[op.id]);
  const empty=M.normalizePlan(null); assert.equal(M.toggleDisabled(empty,op.id).reason,'missing');
});
test('只看启用筛选不改变已添加列表和禁用状态', () => {
  let p=M.toggleDisabled(M.addOperator(M.normalizePlan(null),op.id),op.id).plan;
  p=M.updateFilter(p,{enabledOnly:true}); assert.equal(M.addedOperators(catalogue,p).length,0);
  assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.disabled.buy,[op.id]);
});
test('移除清理禁用状态，重新新增默认启用', () => {
  let p=M.toggleDisabled(M.addOperator(M.normalizePlan(null),op.id),op.id).plan;
  p=M.removeOperator(p,op.id).plan; assert.deepEqual(p.disabled.buy,[]);
  p=M.addOperator(p,op.id); assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.disabled.buy,[]);
});
test('锁定项仍可禁用，批量清空保留其禁用状态', () => {
  let p=M.toggleLock(M.normalizePlan(null),op.id);
  p=M.toggleDisabled(p,op.id).plan; p=M.clearUnlocked(p);
  assert.deepEqual(p.buy,[op.id]); assert.deepEqual(p.disabled.buy,[op.id]);
  assert.equal(M.removeOperator(p,op.id).reason,'locked');
});
test('新增弹窗候选不受主列表筛选影响，也不修改主列表', () => {
  let p=M.updateFilter(M.normalizePlan(null),{query:'不存在的名称',enabledOnly:true,selectedOnly:true});
  const before=JSON.stringify(p); assert.equal(M.addedOperators(catalogue,p).length,0);
  assert.equal(M.candidateOperators(catalogue,p,{}).length,112);
  assert.equal(M.candidateOperators(catalogue,p,{},'keep').length,133); assert.equal(JSON.stringify(p),before);
});
test('归一化移除悬空禁用 ID，在容量上限保留所有锁定项', () => {
  const p=M.normalizePlan({buy:Array.from({length:512},(_,i)=>'id_'+i),locks:{buy:['id_511','locked_new']},disabled:{buy:['missing','id_0']}});
  assert.equal(p.buy.length,512); assert.ok(p.buy.includes('id_511')); assert.ok(p.buy.includes('locked_new'));
  assert.deepEqual(p.disabled.buy,['id_0']);
});


test('schema 2 方案迁移后保留原有禁用与锁定状态', () => {
  const p=M.normalizePlan({schema:2,buy:[op.id],locks:{buy:[op.id]},disabled:{buy:[op.id]}});
  assert.equal(p.schema,3);assert.deepEqual(p.customOperators,[]);assert.deepEqual(p.disabled.buy,[op.id]);assert.deepEqual(p.locks.buy,[op.id]);
});
test('目录外名称可手动添加并显示，不伪造游戏元数据', () => {
  const result=M.addNamedOperator(catalogue,M.normalizePlan(null),'  未收录测试干员  ','manual_test_a');
  assert.equal(result.reason,'');assert.equal(result.custom,true);assert.equal(result.name,'未收录测试干员');
  const p=M.normalizePlan(result.plan);assert.deepEqual(p.buy,['manual_test_a']);
  const row=M.addedOperators(catalogue,p)[0];assert.equal(row.name,'未收录测试干员');assert.equal(row.custom,true);assert.equal(row.charId,'');assert.equal(row.tier,0);assert.deepEqual(row.bonds,[]);
});
test('目录内名称直接使用已有静态条目，不创建重复手动角色', () => {
  const result=M.addNamedOperator(catalogue,M.normalizePlan(null),op.name,'manual_unused');
  assert.equal(result.id,op.id);assert.equal(result.custom,false);assert.equal(result.plan.customOperators.length,0);
});
test('手动名称去除首尾空白，重复名称不重新启用禁用项', () => {
  let p=M.addNamedOperator(catalogue,M.normalizePlan(null),'Test   干员','manual_test_a').plan;
  p=M.toggleDisabled(p,'manual_test_a').plan;
  const result=M.addNamedOperator(catalogue,p,'  ＴＥＳＴ 干员  ','manual_test_b');
  assert.equal(result.reason,'duplicate');assert.deepEqual(result.plan.disabled.buy,['manual_test_a']);assert.equal(result.plan.customOperators.length,1);
});
test('同一手动干员可加入买入和保留两份名单，状态独立', () => {
  let p=M.addNamedOperator(catalogue,M.normalizePlan(null),'额外干员','manual_test_a').plan;
  p=M.addNamedOperator(catalogue,p,'额外干员','manual_unused','keep').plan;
  assert.deepEqual(p.buy,['manual_test_a']);assert.deepEqual(p.keep,['manual_test_a']);assert.equal(p.customOperators.length,1);
  p=M.toggleDisabled(p,'manual_test_a').plan;assert.deepEqual(p.disabled.keep,[]);
});
test('手动角色的名称、禁用和锁定随 JSON 保存恢复', () => {
  let p=M.addNamedOperator(catalogue,M.normalizePlan(null),'保存测试角色','manual_saved').plan;
  p=M.toggleLock(p,'manual_saved');p=M.toggleDisabled(p,'manual_saved').plan;
  p=M.normalizePlan(JSON.parse(JSON.stringify(p)));
  assert.equal(M.addedOperators(catalogue,p)[0].name,'保存测试角色');assert.deepEqual(p.disabled.buy,['manual_saved']);assert.deepEqual(p.locks.buy,['manual_saved']);
});
test('移除自定义条目仅清理不再被任何名单引用的名称', () => {
  let p=M.addNamedOperator(catalogue,M.normalizePlan(null),'跨名单角色','manual_cross').plan;
  p=M.addNamedOperator(catalogue,p,'跨名单角色','manual_unused','keep').plan;
  p=M.removeOperator(p,'manual_cross').plan;assert.equal(p.customOperators.length,1);assert.equal(M.addedOperators(catalogue,p,'keep')[0].name,'跨名单角色');
  p=M.removeOperator(p,'manual_cross','keep').plan;assert.equal(p.customOperators.length,0);
});
test('手动角色参与搜索和只看启用，不擅自分配阶级盟约', () => {
  let p=M.addNamedOperator(catalogue,M.normalizePlan(null),'额外名字','manual_search').plan;
  p=M.updateFilter(p,{query:'额外'});assert.equal(M.addedOperators(catalogue,p).length,1);
  p=M.updateFilter(p,{tier:1});assert.equal(M.addedOperators(catalogue,p).length,0);
  p=M.updateFilter(p,{tier:0});p=M.toggleDisabled(p,'manual_search').plan;p=M.updateFilter(p,{enabledOnly:true});assert.equal(M.addedOperators(catalogue,p).length,0);
});
test('空白、过长名称和伪装为游戏 ID 的自定义记录被拒绝', () => {
  const p=M.normalizePlan(null);
  assert.equal(M.addNamedOperator(catalogue,p,'   ','manual_empty').reason,'empty');
  assert.equal(M.addNamedOperator(catalogue,p,'干'.repeat(41),'manual_long').reason,'name');
  assert.equal(M.addNamedOperator(catalogue,p,'额外角色','chess_fake').reason,'id');
  assert.equal(M.addNamedOperator(catalogue,p,'额外\u202e角色','manual_bidi').reason,'name');
});
test('名称作为纯文本保存，Unicode 按字符计数', () => {
  const text='<img src=x onerror=alert(1)>';
  const result=M.addNamedOperator(catalogue,M.normalizePlan(null),text,'manual_text');
  assert.equal(result.reason,'');assert.equal(result.plan.customOperators[0].name,text);
  assert.equal(M.addNamedOperator(catalogue,M.normalizePlan(null),'𠮷'.repeat(40),'manual_unicode').reason,'');
});
test('非法或悬空手动记录清理后不会留下不可见的名单项', () => {
  const p=M.normalizePlan({buy:['manual_missing','manual_bad','manual_ok'],customOperators:[{id:'manual_bad',name:' '},{id:'manual_ok',name:'有效角色'},{id:'chess_fake',name:'错误标识'}]});
  assert.deepEqual(p.buy,['manual_ok']);assert.deepEqual(p.customOperators,[{id:'manual_ok',name:'有效角色'}]);
});
test('不在买入候选中的目录角色也可作为未匹配手动条目记录', () => {
  const hidden=catalogue.operators.find(x=>x.hidden);
  const result=M.addNamedOperator(catalogue,M.normalizePlan(null),hidden.name,'manual_hidden');
  assert.equal(result.reason,'');assert.equal(result.custom,true);assert.equal(M.addedOperators(catalogue,result.plan)[0].id,'manual_hidden');
});
test('容量不足不产生未显示的自定义记录', () => {
  const p=M.normalizePlan({buy:Array.from({length:512},(_,i)=>'existing_'+i)});
  const result=M.addNamedOperator(catalogue,p,'额外角色','manual_capacity');assert.equal(result.reason,'capacity');assert.deepEqual(result.plan.customOperators,[]);
});

test('图鉴外道具名称可以录入、保存，静态目录内名称不会创建伪造 ID', () => {
  let p=M.normalizePlan(null);
  const added=M.addNamedItem(p,'  新道具  ','manual_item_new');
  assert.equal(added.changed,true);assert.equal(added.custom,true);
  p=M.normalizePlan(JSON.parse(JSON.stringify(added.plan)));
  assert.deepEqual(p.items,[{id:'manual_item_new',name:'新道具',limit:null,enabled:false,minFunds:null}]);
  assert.equal(M.addNamedItem(p,'　新道具　','manual_item_other').reason,'duplicate');
  const known=M.addNamedItem(p,'炎国短刀','manual_item_unused');
  assert.equal(known.custom,false);
  assert.deepEqual(known.plan.items[1],{id:'chess_item_3_04_e_a',limit:null,enabled:false,minFunds:null});
  assert.equal(M.addNamedItem(known.plan,'炎国短刀','manual_item_other').reason,'duplicate');
});
test('道具仅接受安全名称和道具专用 ID，旧记录和无效计数正确迁移', () => {
  const empty=M.normalizePlan(null);
  assert.deepEqual(empty.itemSession,{used:{},epoch:0});
  assert.equal(M.addNamedItem(empty,' ','manual_item_blank').reason,'empty');
  assert.equal(M.addNamedItem(empty,'新道具','chess_item_fake').reason,'id');
  assert.equal(M.addNamedItem(empty,'道具\u202e','manual_item_bidi').reason,'name');
  assert.deepEqual(M.normalizePlan({items:[{id:'chess_item_3_04_e_a',limit:2},{id:'manual_item_bad',name:'\u202e',limit:3},{id:'chess_item_fake',name:'假道具'}],itemSession:{used:{chess_item_3_04_e_a:-1,manual_item_bad:4}}}).items,[{id:'chess_item_3_04_e_a',limit:2,enabled:false,minFunds:null}]);
  assert.deepEqual(M.normalizePlan({items:[{id:'chess_item_3_04_e_a',limit:2}],itemSession:{used:{chess_item_3_04_e_a:-1}}}).itemSession.used,{});
});
test('本局买入次数手动记数、保存，只有下一对局才清零；上限与名单保留', () => {
  let p=M.addNamedItem(M.normalizePlan(null),'其他道具','manual_item_track').plan;
  p=M.setItemLimit(p,'manual_item_track',2).plan;
  p=M.recordItemPurchase(p,'manual_item_track',1).plan;
  p=M.recordItemPurchase(p,'manual_item_track',1).plan;
  assert.equal(M.recordItemPurchase(p,'manual_item_track',1).changed,false);
  p=M.normalizePlan(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(p.itemSession.used,{manual_item_track:2});
  p=M.nextItemMatch(p).plan;
  assert.deepEqual(p.items,[{id:'manual_item_track',name:'其他道具',limit:2,enabled:false,minFunds:null}]);
  assert.deepEqual(p.itemSession.used,{});
  assert.equal(p.itemSession.epoch,1);
  assert.equal(M.nextItemMatch(p).changed,true);
  p=M.recordItemPurchase(p,'manual_item_track',1).plan;
  assert.deepEqual(M.removeItem(p,'manual_item_track').plan.itemSession.used,{});
  assert.throws(()=>M.setItemLimit(p,'manual_item_track',100),/1–99/);
});
test('道具累计次数与干员持有目标分离，下一对局只重置道具',()=>{
  let p=M.normalizePlan({buy:['chess_buy'],keep:['chess_keep'],items:[{id:'chess_item_3_04_e_a',limit:2}],
    itemSession:{used:{chess_item_3_04_e_a:1}},keepSession:{used:{chess_keep:999}}});
  assert.equal(p.items[0].enabled,false);assert.deepEqual(p.keepRules.chess_keep,{limit:null,minFunds:null});
  p=M.setItemEnabled(p,'chess_item_3_04_e_a',true).plan;
  p=M.setItemMinFunds(p,'chess_item_3_04_e_a',0).plan;
  p=M.setKeepLimit(p,'chess_keep',2).plan;
  p=M.setKeepMinFunds(p,'chess_keep',10).plan;
  p=M.normalizePlan(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(p.buy,['chess_buy']);assert.ok(!('keepSession' in p));assert.deepEqual(p.disabled.keep,[]);
  assert.deepEqual(p.keepRules.chess_keep,{limit:2,minFunds:10});assert.equal(p.items[0].minFunds,0);
  const epoch=p.itemSession.epoch;
  p=M.nextItemMatch(p).plan;
  assert.deepEqual(p.itemSession.used,{});assert.ok(!('keepSession' in p));assert.equal(p.itemSession.epoch,epoch+1);
  assert.deepEqual(p.keepRules.chess_keep,{limit:2,minFunds:10});
  assert.match(M.confirmPurchaseCount(p,'item','chess_item_3_04_e_a',epoch,1).reason,/切换对局/);
  const rejected=M.confirmPurchaseCount(p,'keep','chess_keep',p.itemSession.epoch,1);
  assert.equal(rejected.changed,false);assert.match(rejected.reason,/库存/);assert.ok(!('keepSession' in rejected.plan));
  assert.throws(()=>M.setKeepMinFunds(p,'chess_keep',-1),/资金/);
});

test('道具抓取上限默认不限：留空保存、启用不会被自动禁用、计数可超过 99', () => {
  const ITEM='chess_item_3_04_e_a';
  let p=M.addItem(M.normalizePlan(null),ITEM).plan;
  assert.equal(p.items[0].limit,null);
  p=M.normalizePlan(JSON.parse(JSON.stringify(M.setItemEnabled(p,ITEM,true).plan)));
  assert.equal(p.items[0].limit,null);assert.equal(p.items[0].enabled,true);
  p=M.normalizePlan({...p,itemSession:{epoch:0,used:{[ITEM]:150}}});
  assert.equal(p.items[0].enabled,true);assert.equal(M.itemCapReached(p,p.items[0]),false);assert.equal(p.itemSession.used[ITEM],150);
  assert.equal(M.recordItemPurchase(p,ITEM,1).plan.itemSession.used[ITEM],151);
  assert.equal(M.confirmPurchaseCount(p,'item',ITEM,0,151).changed,true);
  // 设上限后照旧：用满自动禁用；再清空恢复不限。
  const capped=M.setItemLimit(p,ITEM,3).plan;assert.equal(capped.items[0].enabled,false);
  assert.equal(M.setItemLimit(capped,ITEM,null).plan.items[0].limit,null);
  assert.throws(()=>M.setItemLimit(p,ITEM,0));assert.throws(()=>M.setItemLimit(p,ITEM,100));
  // 旧记录：显式数字保留，缺省为不限，损坏数值回到 1。
  assert.deepEqual(M.normalizePlan({items:[{id:ITEM,limit:2}]}).items[0].limit,2);
  assert.equal(M.normalizePlan({items:[{id:ITEM}]}).items[0].limit,null);
  assert.equal(M.normalizePlan({items:[{id:ITEM,limit:0}]}).items[0].limit,1);
});

test('配置导出不含本局计数与启停状态，导入整份覆盖并保留当前道具累计次数', () => {
  let p = M.normalizePlan({ buy: ['chess_a'], keep: ['chess_k'], keepRules: { chess_k: { limit: 3, minFunds: 5 } }, width: 440, compact: true, draftEnabled: true,
    items: [{ id: 'chess_item_3_04_e_a', enabled: true, limit: null, minFunds: 0 }], itemSession: { used: { chess_item_3_04_e_a: 4 }, epoch: 2 }, keepSession: { used: { chess_k: 1 } } });
  const out = M.exportConfig(p, { now: '2026-10-15T00:00:00.000Z', app: 'test' });
  assert.equal(out.format, M.CONFIG_FORMAT); assert.equal(out.version, 1); assert.equal(out.exportedAt, '2026-10-15T00:00:00.000Z');
  for (const key of ['itemSession', 'keepSession', 'draftEnabled', 'itemsView']) assert.ok(!(key in out.plan), key);
  assert.deepEqual(out.plan.keepRules.chess_k, { limit: 3, minFunds: 5 }); assert.equal(out.plan.width, 440);
  const current = M.normalizePlan({ buy: ['chess_x'], keep: ['chess_k'], items: [{ id: 'chess_item_3_04_e_a', enabled: false, limit: 1, minFunds: 0 }], itemSession: { used: { chess_item_3_04_e_a: 2 }, epoch: 7 }, keepSession: { used: { chess_k: 2 } } });
  const r = M.importConfig(JSON.stringify(out), current);
  assert.equal(r.ok, true); assert.deepEqual(r.plan.buy, ['chess_a']); assert.equal(r.plan.width, 440); assert.equal(r.plan.compact, true);
  assert.equal(r.plan.draftEnabled, false); assert.equal(r.plan.itemSession.epoch, 7); assert.equal(r.plan.itemSession.used.chess_item_3_04_e_a, 2);
  assert.ok(!('keepSession' in r.plan)); assert.deepEqual(r.summary, { buy: 1, keep: 1, items: 1, custom: 0, exportedAt: '2026-10-15T00:00:00.000Z' });
  assert.equal(M.importConfig('\uFEFF' + JSON.stringify(out), current).ok, true);
  assert.equal(M.importConfig(M.normalizePlan(p), current).ok, true); // 旧版直接保存的方案对象
  assert.equal(M.importConfig('not json', current).reason, 'json');
  assert.equal(M.importConfig('{"a":1}', current).reason, 'format');
  assert.equal(M.importConfig(JSON.stringify({ ...out, version: 99 }), current).reason, 'version');
  assert.equal(M.importConfig('x'.repeat(M.MAX_CONFIG_CHARS + 1), current).reason, 'size');
});
