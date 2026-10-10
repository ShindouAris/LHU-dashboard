// Test-only hook/JSX harness. No network, credentials, or production stubs.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = require('node:path').resolve(__dirname, '..').replaceAll('\\', '/');
const ts = require(root + '/node_modules/typescript');
const source = fs.readFileSync(process.argv[2] || root + '/src/components/ChisaAI.tsx', 'utf8');
const ast = ts.createSourceFile('ChisaAI.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const declarations = ast.statements.filter(s => ts.isVariableStatement(s) && s.declarationList.declarations.some(d => ['ChatbotUI', 'EmptyState'].includes(d.name.getText(ast))));
const code = ts.transpileModule(declarations.map(s => s.getText(ast)).join('\n') + '\nexports.ChatbotUI = ChatbotUI; exports.EmptyState = EmptyState;', {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS}}).outputText;
const jsx = (type, props) => ({type, props: props || {}});
async function scenario(result, token = 'test-only-token') {
  let states = [], cursor = 0, effects = [], dependencies = [], calls = 0;
  const context = {exports: {}, API: '', console: {error() {}}, crypto: {randomUUID: () => 'test-chat'}, window: {location: {hash: ''}}, setTimeout: f => f(), navigator: {},
    require: () => ({jsx, jsxs: jsx, Fragment: 'Fragment'}), memo: f => f, useMemo: f => f(), useRef: value => ({current: value}),
    useState(value) { const i = cursor++; if (!(i in states)) states[i] = typeof value === 'function' ? value() : value; return [states[i], next => {states[i] = typeof next === 'function' ? next(states[i]) : next;}]; },
    useEffect(fn, deps) {const i = cursor++; if (!dependencies[i] || deps.some((v, j) => v !== dependencies[i][j])) {dependencies[i] = deps; if (fn.toString().includes('const checkUser') || fn.toString().includes('const load =')) effects.push(fn);}},
    AuthStorage: {getUserToken: () => token, getUser: () => null, getTokenWithAuth: () => token},
    chisaAIService: {async checkUserV3() {calls++; if (result instanceof Error) throw result; return result;}},
    DefaultChatTransport: class {}, useChat: () => ({messages: [], status: 'ready', id: 'test-chat', setMessages() {}})};
  for (const s of ast.statements.filter(ts.isImportDeclaration)) {
    const bindings = s.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) for (const e of bindings.elements) if (!(e.name.text in context)) context[e.name.text] = e.name.text;
    if (s.importClause?.name) context[s.importClause.name.text] = s.importClause.name.text;
  }
  vm.runInNewContext(code, context);
  const render = () => {cursor = 0; return context.exports.ChatbotUI();};
  const settle = async () => {for (const fn of effects.splice(0)) fn(); await new Promise(resolve => setImmediate(resolve)); return render();};
  render(); let tree = await settle();
  const nodes = tree => tree == null ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : typeof tree === 'object' ? [tree, ...nodes(tree.props?.children)] : [tree];
  const text = tree => nodes(tree).filter(n => typeof n === 'string').join(' ');
  if (result instanceof Error) {
    assert.match(text(tree), /Không thể kiểm tra trạng thái người dùng/, 'failure must replace infinite loading with visible check error');
    assert(!nodes(tree).some(n => n.type === 'LoaderIcon'), 'no loading spinner after rejection');
    assert(!nodes(tree).some(n => n.type === 'Dialog' || n.type === context.exports.EmptyState), 'failure must not grant access or show terms');
    const retry = nodes(tree).find(n => n.type === 'Button' && text(n) === 'Thử lại');
    assert(retry, 'check error must offer retry'); retry.props.onClick(); tree = render();
    assert.match(text(tree), /Đang kiểm tra trạng thái tài khoản/, 'retry returns to loading');
    tree = await settle(); assert.equal(calls, 2, 'retry rechecks exactly once');
    assert.match(text(tree), /Không thể kiểm tra trạng thái người dùng/);
    result = true; retry.props.onClick(); render(); tree = await settle();
    assert(nodes(tree).some(n => n.type === context.exports.EmptyState), 'successful retry grants access');
    assert(!text(tree).includes('Không thể kiểm tra trạng thái người dùng'), 'successful retry clears check error');
  } else if (token === null) {
    assert.equal(calls, 0); assert.match(text(tree), /Phiên đã hết hạn/);
    assert(!nodes(tree).some(n => n.type === 'Dialog'), 'missing token must not show account creation terms');
  } else if (result === false) assert(nodes(tree).some(n => n.type === 'Dialog' && n.props.open === true), 'nonexistent account shows terms');
  else {
    assert(nodes(tree).some(n => n.type === context.exports.EmptyState), 'existing account grants access');
    let selected;
    const modelTree = context.exports.EmptyState({models: [{safeName: 'Test Display Name', modelId: 'provider/test-id'}], selectedModel: 'Test Display Name', modelsLoading: false, inputValue: '', onModelChange: value => {selected = value;}, onModelSelectorOpenChange() {}});
    const trigger = nodes(modelTree).find(n => n.type === 'ModelSelectorTrigger');
    assert.match(text(trigger), /Test Display Name/, 'selected safeName is displayed instead of placeholder');
    nodes(modelTree).find(n => n.type === 'ModelSelectorItem').props.onSelect();
    assert.equal(selected, 'Test Display Name', 'model selection preserves existing API safeName contract');
  }
}
(async () => {
  await scenario(new Error('test-only network failure'));
  await scenario(false); await scenario(true); await scenario(false, null);
  console.log('PASS actual ChatbotUI: rejection, retry loading, repeated rejection, successful retry, denied terms, existing account, missing token. Test-only stubs; no live backend claim.');
})().catch(error => {console.error(error); process.exitCode = 1;});
