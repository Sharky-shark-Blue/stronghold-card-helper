import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import path from 'node:path';import os from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{loadCardKeeperExtension}=require('../../resources/app/cardkeeper-extension.cjs');
async function fixture(legacy=false){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'wei-cache-static-')),extension=path.join(dir,'extension'),profile=path.join(dir,'profile');
 await fs.mkdir(path.join(extension,'src'),{recursive:true});
 for(const file of ['manifest.json','background.js','desktop-boot.js','content-script.js','runtime-main.js','src/panel-page.js'])await fs.writeFile(path.join(extension,file),file==='manifest.json'?'{}':'// '+file);
 const calls=[],api={async loadExtension(){calls.push(['load']);return {id:'staticextension',version:'0.3.8'};},removeExtension(id){calls.push(['remove',id]);}};
 const session={async clearStorageData(options){calls.push(['storage',options]);},async clearCodeCaches(options){calls.push(['code',options]);}};
 if(legacy)Object.assign(session,api);else session.extensions=api;
 return {extension,profile,session,calls,dispose:()=>fs.rm(dir,{recursive:true,force:true})};
}
test('首次或未知旧后台按扩展origin重载，绝不清Cookie、localstorage和全站缓存',async()=>{
 const f=await fixture();try{const r=await loadCardKeeperExtension(f.session,f.extension,f.profile);assert.equal(r.reset,true);
  assert.deepEqual(f.calls.map(c=>c[0]),['load','remove','storage','code','load']);
  assert.deepEqual(f.calls.find(c=>c[0]==='storage')[1],{origin:'chrome-extension://staticextension',storages:['serviceworkers','cachestorage']});
  assert(f.calls.find(c=>c[0]==='code')[1].urls.every(u=>u.startsWith('chrome-extension://staticextension/')));
 }finally{await f.dispose();}
});
test('指纹未变化不重复清理，新后台源码即使版本号相同也会刷新',async()=>{
 const f=await fixture();try{await loadCardKeeperExtension(f.session,f.extension,f.profile);f.calls.length=0;
  assert.equal((await loadCardKeeperExtension(f.session,f.extension,f.profile)).reset,false);assert.deepEqual(f.calls,[['load']]);
  await fs.appendFile(path.join(f.extension,'background.js'),'\n// changed without version bump');f.calls.length=0;
  assert.equal((await loadCardKeeperExtension(f.session,f.extension,f.profile)).reset,true);assert.equal(f.calls.filter(c=>c[0]==='storage').length,1);
 }finally{await f.dispose();}
});
test('兼容旧session加载API但不放宽清理范围',async()=>{
 const f=await fixture(true);try{assert.equal((await loadCardKeeperExtension(f.session,f.extension,f.profile)).reset,true);}finally{await f.dispose();}
});
test('缓存清理失败必须上报，不能写入成功指纹',async()=>{
 const f=await fixture();try{f.session.clearStorageData=async()=>{throw Error('static denied');};
  await assert.rejects(loadCardKeeperExtension(f.session,f.extension,f.profile),/static denied/);
  await assert.rejects(fs.access(path.join(f.profile,'cardkeeper-extension-cache.json')));
 }finally{await f.dispose();}
});
