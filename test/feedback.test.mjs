import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createInlineFeedback } from '../src/ui.js';

// DOM 接口替身验证提示生命周期；真实布局另由浏览器回归检查。
function fixture() {
  const slots=Object.fromEntries(['main','picker','items','settings','utility'].map(name=>{
    const classes=new Set();return [name,{name,title:'',children:[],defaultText:'原有说明',
      classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)},
      append(node){if(node.parentElement)node.parentElement.children=node.parentElement.children.filter(x=>x!==node);this.children.push(node);node.parentElement=this;}}];
  }));
  const node={hidden:true,textContent:'',parentElement:null,focus(){throw new Error('提示不得抢焦点');}};
  Object.defineProperty(node,'innerHTML',{set(){throw new Error('提示必须使用纯文本');}});
  slots.main.append(node);
  let context='main',serial=0;
  const timers=new Map(),cancelled=[];
  const api=createInlineFeedback(node,()=>slots[context],{
    setTimer(fn,ms){const id=serial++;timers.set(id,{fn,ms});return id;},
    clearTimer(id){cancelled.push(id);timers.delete(id);},
  });
  return {api,node,slots,timers,cancelled,context:name=>{context=name;}};
}

test('普通点击反馈进入主状态位，而不是根节点上的悬浮层',()=>{
  const h=fixture();assert.equal(h.api.show('已启用松果。'),true);
  assert.equal(h.node.parentElement,h.slots.main);assert.equal(h.node.hidden,false);
  assert.equal(h.node.textContent,'已启用松果。');assert.ok(h.slots.main.classList.contains('has-feedback'));
  assert.equal(h.slots.main.title,'已启用松果。');
});

test('提示仍在2800毫秒后自动隐藏，并恢复原说明',()=>{
  const h=fixture();h.api.show('完成');const timer=h.timers.get(0);
  assert.equal(timer.ms,2800);timer.fn();
  assert.equal(h.node.hidden,true);assert.equal(h.node.textContent,'');assert.equal(h.slots.main.title,'');
  assert.equal(h.slots.main.classList.contains('has-feedback'),false);assert.equal(h.slots.main.defaultText,'原有说明');
});

test('连续点击取消旧定时器，已排队的旧回调也不能隐藏新提示',()=>{
  const h=fixture();h.api.show('第一条');const old=h.timers.get(0).fn;h.api.show('第二条');
  assert.ok(h.cancelled.includes(0));old();assert.equal(h.node.textContent,'第二条');assert.equal(h.node.hidden,false);
  h.timers.get(1).fn();assert.equal(h.node.hidden,true);
});

test('新增干员、道具、设置和工具弹窗都使用各自的正常流状态位',()=>{
  const h=fixture();h.api.show('主界面');
  for(const context of ['picker','items','settings','utility']){
    const previous=h.node.parentElement;h.context(context);h.api.show(context);
    assert.equal(previous.classList.contains('has-feedback'),false);
    assert.equal(h.node.parentElement,h.slots[context]);assert.equal(h.slots[context].children.length,1);
  }
  assert.equal(Object.values(h.slots).reduce((n,s)=>n+s.children.length,0),1);
});

test('切换或关闭弹窗清空旧反馈，不把上一页面的提示带到下一弹窗',()=>{
  const h=fixture();h.context('picker');h.api.show('原弹窗');h.api.clear();
  h.context('settings');assert.equal(h.node.hidden,true);assert.equal(h.node.textContent,'');
  assert.equal(h.slots.picker.classList.contains('has-feedback'),false);assert.equal(h.timers.size,0);
});

test('销毁工作台清理定时器，迟到回调和后续调用不再修改界面',()=>{
  const h=fixture();h.api.show('旧提示');const old=h.timers.get(0).fn;h.api.destroy();old();
  assert.equal(h.api.show('已关闭后的提示'),false);assert.equal(h.node.hidden,true);assert.equal(h.node.textContent,'');
  assert.equal(h.timers.size,0);
});

test('不存在可用状态位时保持隐藏，不能回退成遮挡内容的悬浮消息',()=>{
  const h=fixture();h.api.show('上一条');h.context('missing');assert.equal(h.api.show('未知上下文'),false);
  assert.equal(h.node.hidden,true);assert.equal(h.timers.size,0);assert.equal(h.slots.main.classList.contains('has-feedback'),false);
});

test('用户名称和错误信息只作为纯文本显示，完整内容保留在状态位标题中',()=>{
  const h=fixture(),text='<img src=x onerror=alert(1)> 仅文本';h.api.show(text);
  assert.equal(h.node.textContent,text);assert.equal(h.slots.main.title,text);
});

test('提示不主动聚焦，也不修改列表滚动位置',()=>{
  const h=fixture();Object.defineProperty(h.slots.main,'scrollTop',{get:()=>37,set(){throw new Error('不能滚动列表');}});
  h.api.show('完成');h.api.clear();assert.equal(h.slots.main.scrollTop,37);
});

test('界面预留五类反馈位置，并移除根级高层悬浮规则；设置内容独立滚动',()=>{
  const ui=fs.readFileSync(new URL('../src/ui.js',import.meta.url),'utf8');
  const theme=fs.readFileSync(new URL('../styles/theme.css',import.meta.url),'utf8');
  for(const scope of ['main','picker','items','settings','utility'])assert.match(ui,new RegExp('data-feedback-slot="'+scope+'"'));
  assert.equal((ui.match(/class="toast"/g)||[]).length,1);
  assert.match(ui,/utility-foot \[data-feedback-default\]/);
  assert.doesNotMatch(ui,/utility-foot>span/);
  assert.match(theme,/\.feedback-slot>\.toast\{position:static;inset:auto;z-index:auto;[^}]*pointer-events:none/);
  assert.match(theme,/grid-template-rows:18px;block-size:18px/);
  assert.match(theme,/\.settings-content\{min-height:0;overflow-y:auto/);
  assert.doesNotMatch(theme,/\.workflow>\.toast/);
  assert.doesNotMatch(fs.readFileSync(new URL('../styles/workflow.css',import.meta.url),'utf8'),/\.workflow>\.toast/);
  assert.doesNotMatch(fs.readFileSync(new URL('../styles/ui.css',import.meta.url),'utf8'),/\.workbench>\.toast/);
});
