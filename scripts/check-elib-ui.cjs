// Offline labeled fixtures; actual Elib TSX and real React/Radix/QR rendering.
// Run: node scripts/check-elib-ui.cjs [qr|menu]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const QRCode = require('react-qr-code').default;
const modules = new Map();
const states = [], clipboard = [];
let cursor = 0;
const hooks = { ...React, useEffect() {}, useRef: value => ({ current: value }),
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial;
    return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; } };
function load(file) {
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} }; modules.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, console, Date,
    navigator: { clipboard: { writeText: text => clipboard.push(text) } },
    require(name) {
      if (file.endsWith('Elib.tsx') && name === 'react') return hooks;
      if (name === '@/services/elibService') return { ELIB_SERVICE: new Proxy({}, { get() { throw Error('API access forbidden in fixture'); } }) };
      if (name === '@/types/user') return { AuthStorage: { getUser: () => ({ UserID: 'fixture-user' }) } };
      if (name === 'react-hot-toast') return { success() {} };
      if (name.endsWith('.css')) return {};
      if (name.includes('/LHU_UI/')) return { default: () => null, __esModule: true };
      if (name.startsWith('.') || name.startsWith('@/')) {
        const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
        const resolved = ['.tsx', '.ts'].map(ext => base + ext).find(fs.existsSync);
        return load(resolved);
      }
      return require(name);
    } });
  return module.exports;
}
const Elib = load(path.resolve('src/components/Elib.tsx')).default;
const dialog = load(path.resolve('src/components/ui/dialog.tsx'));
const dropdown = load(path.resolve('src/components/ui/dropdown-menu.tsx'));
const render = () => { cursor = 0; return Elib({}); };
function nodes(tree) {
  const result = [];
  function walk(node) { if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) return node.forEach(walk);
    result.push(node); walk(node.props?.children); }
  walk(tree); return result;
}
render();
states[0] = [{ DangKyID: 'fixture-booking', TenPhong: 'Fixture room (offline)',
  DocGiaDangKy: 'fixture-user', TrangThai: 1, ThoiGianBD: '2099-01-01T09:00:00',
  ThoiGianKT: '2099-01-01T10:00:00', ThietBi: '[]' }];
states[5] = 4;
const checks = {
  qr() {
    states[3] = true; states[4] = 'fixture-booking';
    const tree = nodes(render());
    const qr = tree.find(node => node.type === QRCode);
    assert.ok(qr, 'QR fixture must render a real QR encoder, not an icon');
    assert.equal(qr.props.value, 'LIB-fixture-booking');
    const svg = renderToStaticMarkup(qr);
    assert.match(svg, /<svg/); assert.match(svg, /<path/);
    assert.equal(svg, renderToStaticMarkup(React.createElement(QRCode, qr.props)), 'same LIB payload must produce same SVG');
    assert.ok(tree.some(node => node.type === dialog.Dialog && node.props.open === true), 'QR needs Radix focus/Escape dialog');
    const copy = tree.find(node => node.type === 'button' && node.props.children?.includes('Sao chép mã'));
    copy.props.onClick(); assert.deepEqual(clipboard, ['LIB-fixture-booking']);
    console.log('PASS qr: real SVG, existing LIB payload, copy, Radix dialog (offline fixture)');
  },
  menu() {
    states[3] = false;
    const tree = nodes(render());
    const card = tree.find(node => node.props?.booking);
    const cardNodes = nodes(card.type(card.props));
    const trigger = cardNodes.find(node => node.type === dropdown.DropdownMenuTrigger);
    assert.ok(trigger, 'booking fixture needs Radix keyboard menu trigger');
    assert.ok(trigger.props.children.props['aria-label'], 'icon trigger needs accessible name');
    assert.ok(cardNodes.some(node => node.type === dropdown.DropdownMenuContent && node.props.align === 'end'));
    const markup = renderToStaticMarkup(React.createElement(card.type, card.props));
    assert.match(markup, /aria-haspopup="menu"/); assert.match(markup, /aria-expanded="false"/);
    const calendar = tree.find(node => node.props?.components?.toolbar);
    const toolbar = nodes(calendar.props.components.toolbar({ label: 'Fixture day', onNavigate() {} }));
    for (const label of ['Ngày trước', 'Ngày tiếp theo']) assert.ok(toolbar.some(node => node.type === 'button' && node.props['aria-label'] === label));
    console.log('PASS menu: real Radix SSR semantics, named trigger/navigation (offline fixture)');
  },
};
let failed = false;
for (const [name, check] of Object.entries(checks)) {
  if (process.argv[2] && process.argv[2] !== name) continue;
  try { check(); } catch (error) { failed = true; console.error(`FAIL ${name}: ${error.message}`); }
}
process.exitCode = failed ? 1 : 0;
