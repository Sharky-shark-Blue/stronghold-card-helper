import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runDesktopBackgroundCases} from './desktop-background-static-cases.mjs';
import {createAutoController} from '../src/engine/auto-controller.js';
import {createAutoReady} from '../src/engine/auto-ready.js';
const code=fs.readFileSync(new URL('../background.js',import.meta.url),'utf8');
for(const result of await runDesktopBackgroundCases(sandbox=>vm.runInNewContext(code,sandbox)))
  test('Electron启动黑盒：'+result.name,()=>assert.equal(result.pass,true,JSON.stringify(result)));
test('Electron在窗口创建之前等待加载同目录扩展，不依赖扩展图标',()=>{
  const source=fs.readFileSync(new URL('../../resources/app/client.cjs',import.meta.url),'utf8');
  assert.match(source,/path\.resolve\(__dirname,'\.\.','\.\.','卫记牌器'\)/);
  assert(source.indexOf('await loadCardKeeperExtension(')>=0);
  assert(source.indexOf('await loadCardKeeperExtension(')<source.indexOf('new BrowserWindow('));
});
test('自动创建控制器即使读取到旧开启设置，也不自动交易或准备',async()=>{
  let intents=0,locks=0;
  const action=async()=>{intents++;return true;};
  const acquireLock=async()=>{locks++;return()=>{};};
  const read=()=>({connection:{status:'online'},match:{private:{hand:[],board:[],temp:[],shop:{slots:[]}}}});
  const controller=createAutoController({read,subscribe:()=>()=>{},buy:action,sell:action,refresh:action,
    useCoin:action,reward:action,mergeReward:action,acquireLock,
    getPlan:()=>({autoPlanOn:true,buy:[],keep:[]}),chess:{}});
  const ready=createAutoReady({read,getOptions:()=>({enabled:true,confirmed:true}),available:()=>true,
    tradeBusy:()=>false,handoff(){},acquireLock,prepare:action,claim:async()=>true,audit:async()=>{}});
  try{await new Promise(resolve=>setTimeout(resolve,25));
    assert.equal(controller.running,false);assert.equal(ready.running,false);
    assert.equal(intents,0);assert.equal(locks,0);
  }finally{controller.stop('static test');ready.stop('static test');}
});
