import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {runLauncherStaticCases} from './launcher-static-cases.mjs';
const code=fs.readFileSync(new URL('../desktop-boot.js',import.meta.url),'utf8');
for(const result of await runLauncherStaticCases(sandbox=>vm.runInNewContext(code,sandbox)))
  test('入口黑盒：'+result.name,()=>assert.equal(result.pass,true,JSON.stringify(result)));
test('缩小及拖动只影响入口，展开工作台仍固定左侧',()=>{
  const host=fs.readFileSync(new URL('../src/runtime-host.js',import.meta.url),'utf8');
  assert.match(host,/position:fixed;left:0;top:0;bottom:0/);
  assert.doesNotMatch(host,/launcher\.v1/);
  assert.match(code,/positionKey=`wei\.workbench\.launcher\.v1:\$\{location\.origin\}`/);
});
