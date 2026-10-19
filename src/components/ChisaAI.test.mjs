// Run: node src/components/ChisaAI.test.mjs (jsdom installed outside repository).
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { mkdtemp, writeFile } from 'node:fs/promises';

const scratch = process.env.CHISA_TEST_SCRATCH || 'C:/Users/LEGION/AppData/Local/hermes/cache/scratch/chisa-test';
const { JSDOM } = await import(pathToFileURL(`${scratch}/node_modules/jsdom/lib/api.js`));
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'https://test.invalid/#existing' });
for (const key of ['window', 'document', 'DOMParser', 'FormData', 'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'NodeFilter', 'MutationObserver', 'CustomEvent', 'Event', 'MouseEvent', 'KeyboardEvent', 'getComputedStyle']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.requestAnimationFrame = window.requestAnimationFrame = cb => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = window.cancelAnimationFrame = clearTimeout;
globalThis.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
window.HTMLElement.prototype.scrollIntoView = () => {};
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
const requests = [];
let rejectHistory = true;
globalThis.fixture = {
  getChatList: async (_token,page) => ({ chats: [{chatUUID:'existing',title:'Tên đã lưu',updatedAt:'2026-01-01',messageCount:2},...(page?[{chatUUID:'older',title:'Chat cũ hơn',updatedAt:'2025-01-01',messageCount:4}]:[])], next_token:page?null:'page2' }),
  getChatHistory: async () => { if (rejectHistory) throw new Error('History 404 access denied'); return {messages:[{id:'u0',role:'user',parts:[{type:'text',text:'old'}]},{id:'a0',role:'assistant',parts:[{type:'text',text:'old answer'}]}],next_token:null}; },
  getModels: async () => ({models:[{safeName:'ChisaAI',modelId:'openai/test',isDefault:true}]}),
  checkUserV3: async () => true,
};
let failChat = true;
let partialChat = false;
let releaseStream;
globalThis.fetch = async (_url, options) => {
  requests.push(JSON.parse(options.body));
  if (failChat) return new Response('Offline', {status:503});
  if (partialChat) return new Response(new ReadableStream({start(controller) {
    const encoder=new TextEncoder();
    for (const chunk of [{type:'start',messageId:'partial'},{type:'text-start',id:'text'},{type:'text-delta',id:'text',delta:'<iframe src="https://evil.invalid"></iframe>PARTIAL'}]) controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    releaseStream=()=>{controller.enqueue(encoder.encode(`data: ${JSON.stringify({type:'error',errorText:'stream failed'})}\n\n`));controller.close();};
  }}),{headers:{'content-type':'text/event-stream','x-vercel-ai-ui-message-stream':'v1'}});
  const chunks = [{type:'start',messageId:`a-new-${requests.length}`},{type:'text-start',id:'txt'},{type:'text-delta',id:'txt',delta:'<iframe src="https://evil.invalid"></iframe>safe'},{type:'text-end',id:'txt'},{type:'finish'}];
  return new Response(chunks.map(c => `data: ${JSON.stringify(c)}\n\n`).join('')+'data: [DONE]\n\n', {headers:{'content-type':'text/event-stream','x-vercel-ai-ui-message-stream':'v1'}});
};
const result = await build({stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import App from './src/components/ChisaAI';export const root=createRoot(document.getElementById('root'));root.render(React.createElement(App));`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'esm',platform:'browser',jsx:'automatic',define:{'import.meta.env.VITE_API_URL':'"https://test.invalid"'},loader:{'.css':'empty'},plugins:[{name:'test-seams',setup(b){b.onResolve({filter:/services\/chisaAIService|types\/user|infsh\/code-block|ui\/GradientText/},args=>({path:args.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'tsx',contents:args.path.includes('chisaAIService')?'export const chisaAIService=globalThis.fixture;':args.path.includes('types/user')?`export const AuthStorage={getUser:()=>({UserID:'test',FullName:'Test'}),getUserToken:()=> 'fixture',getTokenWithAuth:async()=> 'fixture'};`:`export default function Stub({children}){return children};export const CodeBlock=Stub;`}));}}]});
const dir = await mkdtemp(`${scratch}/bundle-`);
await writeFile(`${dir}/app.mjs`, result.outputFiles[0].text);
const app = await import(pathToFileURL(`${dir}/app.mjs`));
const wait = async () => { await new Promise(r => setTimeout(r,100)); };
const button = text => [...document.querySelectorAll('button')].find(e=>e.textContent.trim()===text);
const type = text => {const el=document.querySelector('textarea');Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(el,text);el.dispatchEvent(new Event('input',{bubbles:true}));};
const send = async text => {type(text);await wait();document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await wait();};
try {
  await wait();await wait();
  await send('blocked');
  assert.equal(requests.length,0,'failed hydration must block sending');
  assert.match(document.body.textContent,/History 404 access denied/,'history failure visible');
  rejectHistory=false;
  button('Thử tải lại lịch sử').click();await wait();
  await send('new question');
  assert.equal(requests.length,1);
  button('Thử lại').click();await wait();
  assert.equal(requests[1].trigger,'submit-message','retry trailing user must submit, not regenerate old assistant');
  assert.equal(requests[1].messageId,requests[0].messages.at(-1).id);
  assert.equal(requests[1].messages.at(-1).parts[0].text,'new question');
  failChat=false;
  await send('after error');
  assert.equal(requests.length,3,'send allowed after error');
  assert.equal(document.querySelectorAll('iframe').length,0,'streamed HTML sanitized');
  partialChat=true;
  await send('partial turn');
  for (let attempt = 0; attempt < 30 && !document.body.textContent.includes('PARTIAL'); attempt++) await wait();
  assert.match(document.body.textContent,/PARTIAL/);
  assert.equal(document.querySelectorAll('iframe').length,0,'HTML sanitized while SDK still streaming');
  releaseStream();await wait();partialChat=false;
  button('Thử lại').click();await wait();
  assert.equal(requests.at(-1).trigger,'regenerate-message');
  assert.equal(requests.at(-1).messageId,'partial','partial retry targets current assistant only');
  button('Lịch sử').click();await wait();
  assert.ok(document.querySelector('[role="dialog"]'),'history is a drawer dialog');
  assert.equal(document.querySelector('[role="dialog"]').getAttribute('data-vaul-drawer-direction'),'bottom','history slides up from bottom');
  assert.match(document.body.textContent,/Tên đã lưu/,'title preserved');
  button('Tải thêm chat').click();await wait();
  assert.equal(document.querySelectorAll('button[aria-label="Xóa đoạn chat Tên đã lưu"]').length,1,'list pages deduplicated');
  assert.match(document.body.textContent,/Chat cũ hơn/);
  await new Promise(r=>setTimeout(r,2200));
  assert.match(document.body.textContent,/Chat cũ hơn/,'refresh retains appended pages');
  button('Đóng').click();await wait();
  const deferred = () => { let resolve; const promise=new Promise(r=>resolve=r); return {promise,resolve}; };
  const slowA=deferred();const slowB=deferred();
  fixture.getChatHistory=async (_token,id) => id==='slow-a'?slowA.promise:slowB.promise;
  window.location.hash='slow-a';await wait();
  window.location.hash='slow-b';await wait();
  slowB.resolve({messages:[{id:'b',role:'user',parts:[{type:'text',text:'LATEST CHAT B'}]}],next_token:'older'});await wait();
  slowA.resolve({messages:[{id:'a',role:'user',parts:[{type:'text',text:'STALE CHAT A'}]}],next_token:null});await wait();
  assert.match(document.body.textContent,/LATEST CHAT B/);
  assert.doesNotMatch(document.body.textContent,/STALE CHAT A/,'late hydration ignored');
  const oldPage=deferred();fixture.getChatHistory=()=>oldPage.promise;
  button('Tải tin nhắn cũ hơn').click();await wait();
  button('Chat mới').click();await wait();
  oldPage.resolve({messages:[{id:'old',role:'user',parts:[{type:'text',text:'STALE PAGE'}]}],next_token:null});await wait();
  assert.doesNotMatch(document.body.textContent,/STALE PAGE/,'late page ignored after switch');
  let deleteResolve;let deletes=0;
  fixture.deleteChat=async()=>{deletes++;return new Promise(r=>deleteResolve=r);};
  button('Lịch sử').click();await wait();
  document.querySelector('button[aria-label="Xóa đoạn chat Tên đã lưu"]').click();await wait();
  assert.equal(deletes,0,'delete requires confirmation');
  button('Xóa đoạn chat').click();await wait();
  assert.equal(deletes,1);
  assert.equal(button('Đang xóa...').disabled,true);
  const retainedHash=window.location.hash;
  deleteResolve(true);await wait();
  assert.equal(window.location.hash,retainedHash,'deleting another chat does not switch current chat');
  assert.doesNotMatch(document.querySelector('[role="dialog"]').textContent,/Tên đã lưu/,'deleted list entry removed');
  console.log('PASS hydration gate/retry; SDK submit/partial retry; send-after-error; active SSE sanitization; drawer/title; page merge/dedupe; stale hydration/page guards; delete confirmation/loading');
} finally {app.root.unmount();dom.window.close();}
