import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectMatch, auditSale } from '../src/engine/auto-policy.js';
const pack='chess_item_5_07_e_a', A='char_a',G='char_a_gold',B='char_b';
const chess={ [A]:{baseId:A,goldenId:G,upgradeNum:3},[G]:{baseId:A,isGolden:true},[B]:{baseId:B} };
const gameItems={[pack]:{id:pack,name:'商业包装方案',desc:'每出售8名干员，额外获得一个此装备携带者的初始同名干员'}};
const unit=(uid,id=A,items=[])=>({kind:'chess',uid,id,items});
function snap(hand=[],board=[unit(10,A,[{uid:100,id:pack}])]) {
  return inspectMatch({connection:{status:'online'},me:{playerId:'me'},room:{code:'room',inMatch:true,seats:[{playerId:'me'}]},
    match:{public:{phase:'PREP',round:2,players:[{playerId:'me'}]},private:{alive:true,ready:false,funds:20,hand,board,temp:[],shop:{slots:[],refreshPrice:1}}}},chess);
}
test('装备包装方案触发同名赠员时核验额外新UID',()=>{
  const before=snap([unit(1,B)]), after=snap([unit(2,A)]);
  const result=auditSale(before,after,1,{chess,gameItems});
  assert.equal(result.ok,true);assert.deepEqual(result.packagingGifts.map(g=>g.uid),[2]);
  assert.equal(result.packagingMerged,false);
  assert.equal(auditSale(before,snap(),1,{chess,gameItems}).ok,true);
});
test('包装赠员与两份普通自动合成精锐的守恒及材料UID可核对',()=>{
  const before=snap([unit(1,B),unit(3),unit(4)]),after=snap([unit(5,G)]);
  const result=auditSale(before,after,1,{chess,gameItems});
  assert.equal(result.ok,true);assert.equal(result.packagingMerged,true);
  assert.equal(result.packagingGifts[0].id,G);
  assert.equal(auditSale(before,snap([unit(5)]),1,{chess,gameItems}).ok,false);
});
test('无装备、效果未知、赠员错名、数量超限、旧UID异常及额外装备仍阻止',()=>{
  const before=snap([unit(1,B)]),after=snap([unit(2)]);
  assert.equal(auditSale(before,after,1,{chess}).ok,false);
  assert.equal(auditSale(snap([unit(1,B)],[]),snap([unit(2)],[]),1,{chess,gameItems}).ok,false);
  assert.equal(auditSale(before,snap([unit(2,B)]),1,{chess,gameItems}).ok,false);
  assert.equal(auditSale(before,snap([unit(2),unit(3)]),1,{chess,gameItems}).ok,false);
  assert.equal(auditSale(before,snap([unit(2)],[]),1,{chess,gameItems}).ok,false);
  assert.equal(auditSale(before,snap([unit(2),{kind:'item',uid:200,id:'unknown'}]),1,{chess,gameItems}).ok,false);
  const otherEffect={[pack]:{name:'商业包装方案',desc:'每出售8名干员，获得同盟约干员'}};
  assert.equal(auditSale(before,after,1,{chess,gameItems:otherEffect}).ok,false); // No verified bond data.
});
test('同盟约版本只按本服描述与真实图鉴盟约匹配，异盟约赠员拒绝',()=>{
  const shared={...chess,[A]:{...chess[A],bonds:['bond_x']},[B]:{...chess[B],bonds:['bond_x']}};
  const effect={[pack]:{name:'商业包装方案',desc:'每出售8名干员，获得装备者的同盟约初始干员'}};
  assert.equal(auditSale(snap([unit(1)]),snap([unit(2,B)]),1,{chess:shared,gameItems:effect}).ok,true);
  assert.equal(auditSale(snap([unit(1)]),snap([unit(2,B)]),1,{chess:{...shared,[B]:{...shared[B],bonds:['bond_y']}},gameItems:effect}).ok,false);
});
