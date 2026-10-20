// Pure fixtures shared by Node and browser Console: no store writes or game intents.
export function runPackagingStaticCases({inspectMatch,auditPackagingSale,packagingGiftDisposition}) {
  const A='char_pack_a',G='char_pack_a_gold',B='char_pack_b',PACK='chess_item_5_07_e_a';
  const chess={[A]:{baseId:A,goldenId:G,upgradeNum:3},[G]:{baseId:A,isGolden:true},[B]:{baseId:B}};
  const gameItems={[PACK]:{name:'商业包装方案',desc:'每出售8名干员，额外获得一个此装备携带者的初始同名干员'}};
  const op=(uid,id=A,items=[])=>({uid,id,kind:'chess',items});
  const carrier=op(10,A,[{uid:100,id:PACK}]);
  function snap(hand=[],{board=[carrier],temp=[],items=[]}={}) {
    return inspectMatch({connection:{status:'online'},me:{playerId:'static'},room:{code:'static',inMatch:true,seats:[{playerId:'static'}]},
      match:{public:{phase:'PREP',round:1,players:[{playerId:'static'}]},private:{alive:true,ready:false,funds:20,
        hand:[...hand,...items],board,temp,shop:{level:2,slots:[],refreshPrice:1}}}},chess);
  }
  const simpleBefore=()=>snap([op(1,B),op(7)]),simpleAfter=()=>snap([op(2),op(7)]);
  const specs=[
    {name:'名单外普通赠员入出售队列，原有同名UID不入队',before:simpleBefore(),after:simpleAfter(),q:[2]},
    {name:'保留名单中的普通赠员保留',before:simpleBefore(),after:simpleAfter(),keep:[A],q:[],k:[2]},
    {name:'其他保留项不影响名单外赠员',before:simpleBefore(),after:simpleAfter(),keep:[B],q:[2]},
    {name:'受部署保护的赠员不出售',before:simpleBefore(),after:simpleAfter(),protectedUids:[2],q:[],k:[2]},
    {name:'临时区包装赠员可入队',before:simpleBefore(),after:snap([op(7)],{temp:[op(2)]}),q:[2]},
    {name:'棋盘新赠员不自动出售',before:simpleBefore(),after:snap([op(7)],{board:[carrier,op(2)]}),q:[],k:[2]},
    {name:'精锐赠员合成材料均获本轮授权才入队',before:snap([op(1,B),op(3),op(4)]),after:snap([op(5,G)]),authorizedUids:[3,4],q:[5],merge:[3,4]},
    {name:'精锐赠员包含两张旧库存时保留',before:snap([op(1,B),op(3),op(4)]),after:snap([op(5,G)]),q:[],k:[5]},
    {name:'精锐赠员含一张未授权旧卡时保留',before:snap([op(1,B),op(3),op(4)]),after:snap([op(5,G)]),authorizedUids:[3],q:[],k:[5]},
    {name:'精锐材料的保护传播至新UID',before:snap([op(1,B),op(3),op(4)]),after:snap([op(5,G)]),authorizedUids:[3,4],protectedUids:[4],q:[],k:[5]},
    {name:'精锐赠员遵守基础干员保留名单',before:snap([op(1,B),op(3),op(4)]),after:snap([op(5,G)]),authorizedUids:[3,4],keep:[A],q:[],k:[5]},
    {name:'棋盘材料即使有旧授权也不盲卖合成结果',before:snap([op(1,B),op(3)],{board:[carrier,op(4)]}),after:snap([op(5,G)]),authorizedUids:[3,4],q:[],k:[5]},
    {name:'已配装材料的保护传播至合成输出',before:snap([op(1,B),op(3,A,[{uid:201,id:'old_equip'}]),op(4)]),after:snap([op(5,G)],{items:[{kind:'item',uid:201,id:'old_equip'}]}),authorizedUids:[3,4],q:[],k:[5]},
    {name:'没有包装效果的新UID不获出售授权',before:simpleBefore(),after:simpleAfter(),gameItems:null,ok:false,q:[]},
    {name:'没有携带者不能仅凭新UID猜测赠员',before:snap([op(1,B)],{board:[]}),after:snap([op(2)],{board:[]}),ok:false,q:[]},
    {name:'赠员错名拒绝授权',before:snap([op(1,B)]),after:snap([op(2,B)]),ok:false,q:[]},
    {name:'赠员数量超限拒绝授权',before:snap([op(1,B)]),after:snap([op(2),op(3)]),ok:false,q:[]},
    {name:'旧UID额外消失时拒绝授权',before:simpleBefore(),after:snap([op(2)]),ok:false,q:[]},
    {name:'伴随未知装备新增时拒绝授权',before:simpleBefore(),after:snap([op(2),op(7)],{items:[{kind:'item',uid:200,id:'unknown'}]}),ok:false,q:[]},
    {name:'旧库存原地保留不伪装成包装赠员',before:simpleBefore(),after:snap([op(7)]),q:[]},
    {name:'旧装备携带者消失时拒绝授权',before:simpleBefore(),after:snap([op(2),op(7)],{board:[]}),ok:false,q:[]},
  ];
  return specs.map(spec=>{
    try{
      if(!spec.before.ok || !spec.after.ok)throw Error('Invalid static snapshot');
      const audited=auditPackagingSale(spec.before,spec.after,1,{chess,gameItems:Object.hasOwn(spec,'gameItems')?spec.gameItems:gameItems});
      const disposition=packagingGiftDisposition(audited,spec.before,spec);
      const q=disposition.queued.map(x=>x.uid),k=disposition.kept.map(x=>x.uid);
      const pass=audited.ok===(spec.ok!==false) && JSON.stringify(q)===JSON.stringify(spec.q) &&
        JSON.stringify(k)===JSON.stringify(spec.k || []) && (!spec.merge ||
          JSON.stringify(audited.packagingMerges?.[0]?.consumedUids)===JSON.stringify(spec.merge));
      return {name:spec.name,pass,...(!pass?{q,k,reason:audited.reason,ok:audited.ok}: {})};
    }catch(error){return {name:spec.name,pass:false,error:error.message};}
  });
}
