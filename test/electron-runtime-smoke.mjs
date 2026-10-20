import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
function copy(source,target){
 if(fs.statSync(source).isDirectory()){fs.mkdirSync(target,{recursive:true});for(const name of fs.readdirSync(source))copy(path.join(source,name),path.join(target,name));}
 else fs.writeFileSync(target,fs.readFileSync(source));
}
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),root=path.resolve(project,'..');
const mode=process.argv[2] || 'native',dir=path.join(project,'test','.artifacts','electron-runtime-'+Date.now()+'-'+mode);
console.log('FIXTURE_PHASE prepare',mode);
fs.mkdirSync(path.join(dir,'resources','app'),{recursive:true});
for(const entry of fs.readdirSync(root,{withFileTypes:true}))if(entry.isFile()&&/\.(exe|dll|pak|dat|bin)$/.test(entry.name))fs.linkSync(path.join(root,entry.name),path.join(dir,entry.name));
fs.symlinkSync(path.join(root,'locales'),path.join(dir,'locales'),'junction');
console.log('FIXTURE_PHASE linked');
copy(path.join(project,'test','fixtures','electron-extension-main.cjs'),path.join(dir,'resources','app','main.cjs'));
fs.writeFileSync(path.join(dir,'resources','app','package.json'),JSON.stringify({name:'wei-static-extension-probe',version:'1.0.0',main:'main.cjs'}));
const extension=path.join(dir,'extension');
fs.mkdirSync(extension,{recursive:true});
for(const entry of ['src','styles','data','图标.png','manifest.json','background.js','desktop-boot.js','content-script.js','runtime-main.js','panel.html'])
  copy(path.join(project,entry),path.join(extension,entry));
console.log('FIXTURE_PHASE copied');
const manifest=JSON.parse(fs.readFileSync(path.join(extension,'manifest.json')));
if(mode==='page'){
 delete manifest.background;
 fs.writeFileSync(path.join(extension,'electron-probe-background.html'),'<!doctype html><script src="background.js"></script>');
}else if(mode==='mv2'){
 manifest.manifest_version=2;manifest.background={scripts:['background.js'],persistent:true};
 manifest.permissions=[...manifest.permissions.filter(p=>p!=='scripting'),...(manifest.host_permissions||[])];delete manifest.host_permissions;delete manifest.action;
 manifest.web_accessible_resources=manifest.web_accessible_resources.flatMap(r=>r.resources);manifest.content_security_policy=manifest.content_security_policy.extension_pages;
}
fs.writeFileSync(path.join(extension,'manifest.json'),JSON.stringify(manifest));
const env={...process.env,WEI_TEST_EXTENSION:extension,WEI_PROBE_MODE:mode,WEI_CACHE_HELPER:path.join(root,'resources','app','cardkeeper-extension.cjs')};delete env.ELECTRON_RUN_AS_NODE;
function launch(fix=false,seed=false){
 const report=path.join(dir,'result.json');if(fs.existsSync(report))fs.unlinkSync(report);
 const child=spawnSync(path.join(dir,'卫戍协议.exe'),[],{cwd:dir,env:{...env,WEI_PROBE_FIX_CACHE:fix?'1':'0',WEI_PROBE_SEED:seed?'1':'0'},encoding:'utf8',timeout:22000,maxBuffer:2*1024*1024,windowsHide:true});
 const value=fs.existsSync(report)?JSON.parse(fs.readFileSync(report)):{exitCode:child.status,error:child.error?.message};value.stderr=child.stderr?.slice(-1200);return value;
}
let result;
if(mode==='warm'){
 const background=path.join(extension,'background.js'),current=fs.readFileSync(background);
 fs.writeFileSync(background,`chrome.runtime.onMessage.addListener((message,sender,reply)=>{chrome.storage.local.set({__weiCacheFixture:'settings-kept'}).then(()=>reply({ok:false,reason:'STALE_WORKER_FIXTURE'}));return true;});`);
 fs.writeFileSync(path.join(extension,'fixture-preserve.html'),'<!doctype html><title>LOCAL STORAGE FIXTURE</title>');
 const first=launch(false,true);fs.writeFileSync(background,current);
 const stale=launch(),fixed=launch(true),stable=launch(true);
 const preserved=[first,stale,fixed,stable].every(value=>value.preserved?.cookie==='login-kept'&&value.preserved?.gameStorage==='game-storage-kept')&&[fixed,stable].every(value=>value.preserved?.settings==='settings-kept');
 result={first,stale,fixed,stable,preserved,pass:!first.dom?.host&&!stale.dom?.host&&fixed.dom?.host===true&&fixed.cacheReset===true&&stable.dom?.host===true&&stable.cacheReset===false&&preserved};
}else result=launch();
if(mode==='console')result.pass=result.staticConsole?.total>0&&result.staticConsole.passed===result.staticConsole.total;
if(mode==='picker')result.pass=result.filePicker?.total>0&&result.filePicker.passed===result.filePicker.total;
if(result.pass===false||result.fatal||result.timeout)process.exitCode=1;
console.log('B64_BEGIN');for(const chunk of Buffer.from(JSON.stringify(result)).toString('base64').match(/.{1,32}/g)||[])console.log(chunk);console.log('B64_END');
