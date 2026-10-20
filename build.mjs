import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = name => readFile(path.join(root, name), 'utf8');
const [baseCss, modelSource, uiSource, catalogue] = await Promise.all([
  read('styles/ui.css'), read('src/model.js'), read('src/ui.js'), read('data/catalogue.json'),
]);
const skinCss=await read('styles/tlipoca.css');
const css=baseCss+'\n'+await read('styles/workflow.css')+'\n'+await read('styles/theme.css')+'\n'+await read('styles/icons.css')+'\n'+skinCss+'\n'+await read('styles/motion.css')+'\n'+await read('styles/tlipoca-art.css');
const brand = (await read('styles/tlipoca-art.css')).match(/--tlipoca-user-icon:url\("([^"]+)"\)/)?.[1] || skinCss.match(/--tlipoca-avatar:url\("([^"]+)"\)/)?.[1] ||
  'data:image/png;base64,' + (await readFile(path.join(root, '图标.png'))).toString('base64');
const manifest = JSON.parse(await read('manifest.json'));
// A small, explicit offline preview bundler for these two local modules only.
// The installable extension keeps native ES modules and its strict CSP.
const removeExports = text => text.replace(/^export (?=(?:async )?function|const |let )/gm, '');
const itemsSource = removeExports(await read('src/engine/items.js'));
const gridSource=removeExports(await read('src/icon-grid.js'));
const gridViewSource=removeExports(await read('src/icon-grid-view.js'));
const exports = ['STORAGE_KEY','CONFIG_FORMAT','exportConfig','importConfig','MAX_CONFIG_CHARS','DEFAULT_HOTKEY','normalizeHotkey','hotkeyFromEvent','hotkeyProblem','hotkeyLabel','matchesHotkey','GAME_DEFAULT_KEYS','normalizeGameKeys','gameHotkeyConflict','hotkeyIsTyping','KINDS','normalizePlan','filterOperators','updateFilter','toggleSelection','toggleLock','clearUnlocked','selectVisible','examplePlan','addedOperators','candidateOperators','addOperator','removeOperator','toggleDisabled','moveIconOperator','moveItemIcon','MAX_ICON_GRID_CELLS','iconGridSlots','previewIconGrid','moveIconToCell','allOperators','addNamedOperator','MAX_MANUAL_NAME_LENGTH','ITEMS','addItem','addNamedItem','setItemLimit','setItemOwnedTarget','observeItemMatch','setItemEnabled','toggleItemEnabled','setItemAutoUse','setItemEquippedMerge','itemCapReached','setItemMinFunds','setKeepLimit','setKeepMinFunds','removeItem','recordItemPurchase','confirmPurchaseCount','nextItemMatch'];
const model = `${itemsSource}\n${gridSource}\nconst Model = (() => {\n${removeExports(modelSource.replace(/^import[\s\S]*?;\r?\n/gm, ''))}\nreturn {${exports.join(',')}};\n})();`;
const quickSource=removeExports(await read('src/quick-dock.js'));
const ui = gridViewSource+'\n'+removeExports(uiSource.replace(/^import[\s\S]*?;\r?\n/gm,''));
const data = JSON.stringify(JSON.parse(catalogue)).replace(/</g, '\\u003c');
const script = `${model}\n${ui}\n${quickSource}\n
const catalogue = ${data};
const brandUrl = ${JSON.stringify(brand)};
const launcher = document.querySelector('.launcher');
const collapse = () => { document.body.classList.add('is-collapsed'); launcher.hidden = false; };
launcher.addEventListener('click', () => { document.body.classList.remove('is-collapsed'); launcher.hidden = true; });
let previewDock=null,previewReady=false,previewRunning=false;
const previewKey = 'wei.workbench.preview.v1';
window.weiWorkbench = await mountWorkbench(document.querySelector('#app'), {
  catalogue, brandUrl, version: ${JSON.stringify(manifest.version)}, preview: true, serverLabel: '卫戍协议 · 静态名单快照',
  storage: { async get() { return JSON.parse(localStorage.getItem(previewKey) || 'null'); }, async set(value) { localStorage.setItem(previewKey, JSON.stringify(value)); },
    async getBackup() { return JSON.parse(localStorage.getItem(previewKey + '.backup') || 'null'); }, async setBackup(value) { localStorage.setItem(previewKey + '.backup', JSON.stringify(value)); } },
  onRuntimeAction:async type=>{if(type==='ready.toggle')previewReady=!previewReady;else if(type==='ready.stop')previewReady=false;else if(type==='auto.toggle')previewRunning=!previewRunning;else return {};
    window.weiWorkbench.updateRuntime({ready:true,readyReady:true,readyRunning:previewReady,readyMessage:previewReady?'离线模拟已开启，不发送准备':'已关闭',running:previewRunning});syncQuickPreview();return {};},
  onPlanChange:()=>{if(previewDock)syncQuickPreview();},onQuickOpen:kind=>previewDock?.show(kind),onCollapse: collapse, onClose: collapse,
  onResize(width) { document.documentElement.style.setProperty('--dock-width', width + 'px'); },
});
const syncQuickPreview=()=>{const plan=window.weiWorkbench.getPlan();previewDock?.update({uiReady:true,ready:true,eligible:true,autoReady:plan.autoReady,readyReady:true,readyRunning:previewReady,readyMessage:previewReady?'离线模拟，不发送准备':'已关闭',paused:plan.itemBuyingPaused,running:previewRunning,
  items:plan.items.map(item=>({id:item.id,name:Model.ITEMS.find(rec=>rec.id===item.id)?.name || item.name || item.id,enabled:item.enabled,status:item.capPaused?'full':item.enabled?'enabled':'disabled'}))});};

previewDock=createQuickDock({parent:document.body,onOpenPanel:()=>{document.body.classList.remove('is-collapsed');launcher.hidden=true;},
  onAction:async(command,id)=>{if(command==='auto'){previewRunning=!previewRunning;syncQuickPreview();return {message:'仅预览，不发送游戏操作'};}
    const result=await window.weiWorkbench.quickAction(command,id);syncQuickPreview();return result;},
  storage:{async get(){return null;},async set(){}}});
syncQuickPreview();
`;
if (/<\/script/i.test(script)) throw new Error('Preview script contains an unsafe closing tag');
const runtimeFiles = ['src/engine/catalogue.js','src/engine/game-icons.js','src/engine/inventory.js','src/engine/placement.js','src/engine/coin-audit.js','src/engine/action-overflow.js','src/engine/flametail-flow.js','src/engine/packaging.js','src/engine/trade-audit.js','src/engine/flametail-audit.js','src/engine/auto-policy.js','src/engine/item-policy.js','src/engine/manual-policy.js','src/engine/auto-controller.js','src/engine/transport.js','src/engine/audit-log.js','src/engine/plan-adapter.js','src/engine/auto-ready.js','src/quick-dock.js','src/runtime-host.js'];
const roundStatsSource=removeExports(await read('src/engine/round-stats.js'));
const placementSource=removeExports(await read('src/engine/placement.js'));
const coinAuditSource=removeExports((await read('src/engine/coin-audit.js')).replace(/^import[\s\S]*?;\r?\n/gm,''));
const overflowSource=removeExports(await read('src/engine/action-overflow.js'));
const flametailFlowSource=removeExports(await read('src/engine/flametail-flow.js'));
const packagingSource=removeExports((await read('src/engine/packaging.js')).replace(/^import[\s\S]*?;\r?\n/gm,''));
const tradeSource=removeExports((await read('src/engine/trade-audit.js')).replace(/^import[\s\S]*?;\r?\n/gm,''));
const itemMergeSafetySource=removeExports((await read('src/engine/item-policy.js')).replace(/^import[\s\S]*?;\r?\n/gm,''));
const flametailAuditSource=removeExports((await read('src/engine/flametail-audit.js')).replace(/^import[\s\S]*?;\r?\n/gm,''));
await writeFile(path.join(root,'runtime-main.js'),`// Generated MAIN bridge; edit src/main-bridge.js and src/engine/ shared audit modules.\n(() => {\n${roundStatsSource}\n${placementSource}\n${coinAuditSource}\n${overflowSource}\n${flametailFlowSource}\n${packagingSource}\n${tradeSource}\n${flametailAuditSource}\nconst ItemMergeSafety=(()=>{\n${itemMergeSafetySource}\nreturn {planItemMerge,auditItemPurchase};\n})();\n${await read('src/main-bridge.js')}\n})();\n`,'utf8');
const runtimeSources = await Promise.all(runtimeFiles.map(read));
const runtimeBody = runtimeSources.map(source => removeExports(source.replace(/^import[\s\S]*?;\r?\n/gm,''))).join('\n');
await writeFile(path.join(root,'content-script.js'),`// Generated local runtime v${manifest.version}; edit src/runtime-host.js and src/engine/.\n(() => {\nconst BUILD_VERSION=${JSON.stringify(manifest.version)};\n${model}\n${runtimeBody}\n})();\n`,'utf8');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>卫戍协议拿牌器｜界面预览</title><style>${css}</style></head>
<body class="preview"><div id="app"></div><button class="launcher" type="button" hidden aria-label="展开卫戍协议拿牌器"><img src="${brand}" alt=""><span>工作台</span></button>
<main class="preview-stage" aria-label="布局示意，不是真实游戏画面">
  <header class="preview-bar"><img src="${brand}" alt=""><strong>卫戍协议</strong><span>界面预览 · 离线</span></header>
  <footer class="preview-foot"><span>双悬浮控制</span><span>v${manifest.version}</span></footer>
</main><script type="module">${script}</script></body></html>`;
await writeFile(path.join(root, 'ui-preview.html'), html, 'utf8');
console.log('Built extension runtime and offline UI preview. The preview never connects to a match or performs game actions.');
