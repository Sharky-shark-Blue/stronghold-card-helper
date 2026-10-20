import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import * as Model from '../src/model.js';
const source=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8'),css=fs.readFileSync(new URL('../styles/ui.css',import.meta.url),'utf8');
test('配置导入入口直接使用原生可聚焦文件框，不依赖hidden控件脚本点击',()=>{
 const label=source.match(/<label class="tool-button config-import-trigger"[^>]*>[\s\S]*?<\/label>/)?.[0];assert(label);
 assert.match(label,/<input id="config-file" type="file"/);assert.match(label,/accept="\.json,application\/json"/);assert.match(label,/aria-label="导入配置 JSON 文件"/);
 assert(!/\bhidden\b|tabindex="-1"/.test(label));assert(!/configFile\.click\s*\(/.test(source));
});
test('原生文件框每次激活清空旧选择和错误，事件随工作台销毁清理',()=>{
 assert.match(source,/const configFileClick = \(\) => \{configError\(''\);configFile\.value='';\}/);
 assert.match(source,/configFile\.addEventListener\('click',configFileClick\)/);assert.match(source,/configFile\.removeEventListener\('click',configFileClick\)/);
 assert.match(source,/const file = configFile\.files\?\.\[0\]; configFile\.value = ''; void importConfigFile\(file\)/);
});
test('文件框覆盖可见导入入口并保留焦点标记，不使用display:none阻断原生交互',()=>{
 const rule=css.match(/\.config-import-trigger\s*>\s*input\[type="file"\]\s*\{([^}]+)\}/)?.[1];assert(rule);assert.match(rule,/position:absolute/);assert.match(rule,/display:block/);assert.match(rule,/width:100%/);assert.match(rule,/height:100%/);assert.match(rule,/opacity:0/);assert(!/pointer-events:none|display:none/.test(rule));assert.match(css,/\.config-import-trigger:focus-within/);
});
test('导入保留包装专属授权和本局计数，但不恢复运行开关',()=>{
 const id='chess_item_5_07_e_a',current=Model.normalizePlan({items:[{id,enabled:true}],itemSession:{used:{[id]:3},epoch:9}});
 const file=Model.exportConfig(Model.normalizePlan({buy:['chess_char_4_19_a'],items:[{id,enabled:true,ownedTarget:2,allowEquippedMerge:true}],draftEnabled:true}));
 const imported=Model.importConfig(JSON.stringify(file),current);assert.equal(imported.ok,true);assert.equal(imported.plan.items[0].allowEquippedMerge,true);assert.equal(imported.plan.items[0].ownedTarget,2);assert.equal(imported.plan.itemSession.used[id],3);assert.equal(imported.plan.itemSession.epoch,9);assert.equal(imported.plan.draftEnabled,false);
 assert.equal(Model.importConfig('{not json',current).ok,false);assert.equal(current.itemSession.used[id],3);
});
