// Run: node scripts/check-schedule-ui.cjs (offline; real component code, mocked service seams).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function harness(name, initial = {}) {
  const states = [];
  let cursor = 0;
  const requests = [];
  const Input = () => null;
  const ErrorMessage = () => null;
  const Calendar = () => null;
  const hooks = {
    ...React,
    useState(value) {
      const index = cursor++;
      if (!(index in states)) states[index] = typeof value === 'function' ? value() : value;
      return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
    },
    useEffect() {},
    useCallback: value => value,
    useMemo: callback => callback(),
    useRef: value => ({ current: value }),
    memo: value => value,
  };
  const box = ({ children }) => React.createElement('div', null, children);
  const services = {
    cacheService: { get: async () => null, getStale: async () => null, set: async () => {} },
    examCacheService: { get: async () => [], getStale: async () => null },
    ApiService: {
      getSchedule: async request => { requests.push(request.StudentID); throw new Error('offline fixture'); },
      testnet: async () => false,
    },
  };
  const exports = {};
  const filename = path.join(__dirname, '../src/components', name + '.tsx');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(compiled, {
    exports,
    require(module) {
      if (module === 'react') return hooks;
      if (module === 'date-fns' || module === 'date-fns/locale') return require(module);
      if (module.endsWith('.css')) return {};
      if (module === 'react-router-dom') return { useLocation: () => ({ pathname: '/' }), useNavigate: () => () => {} };
      if (module === 'react-hot-toast') return { toast: { error() {}, success() {} } };
      if (module === 'react-big-calendar') return { Calendar, dateFnsLocalizer: () => ({}) };
      if (module.endsWith('/StudentIdInput')) return { StudentIdInput: Input };
      if (module.endsWith('/ErrorMessage')) return { ErrorMessage };
      if (module.endsWith('/user')) return { AuthStorage: { getUser: () => null, isLoggedIn: () => false } };
      if (module.endsWith('/dateUtils')) return { getNextClass: () => null, hasClassesInNext7Days: () => false, isWithinNext7Days: () => false, getRealtimeStatus: () => 2 };
      if (module.endsWith('/scheduleUtils')) return { addScheduleMetadata: value => value, detectDuplicateSchedules: () => [] };
      if (module.endsWith('/tinhtrang')) return { isTinhTrangCancelled: value => value === 1, getTinhTrangInfo: () => null };
      for (const [key, value] of Object.entries(services)) if (module.endsWith('/' + key[0].toLowerCase() + key.slice(1))) return { [key]: value };
      return new Proxy({}, { get: (_, key) => key === '__esModule' ? true : box });
    },
    window: { innerWidth: 1200 }, navigator: { onLine: false }, console, Date,
    FormData: class { constructor(form) { this.form = form; } get(key) { return this.form[key]; } },
  }, { filename });
  Object.assign(states, initial);
  const Component = exports[name];
  return { states, requests, Input, ErrorMessage, Calendar, render(props = {}) { cursor = 0; return Component(props); } };
}

function find(tree, predicate) {
  if (!tree || typeof tree !== 'object') return undefined;
  if (predicate(tree)) return tree;
  for (const child of React.Children.toArray(tree.props?.children)) {
    const match = find(child, predicate);
    if (match) return match;
  }
}

async function retryCheck(name) {
  const h = harness(name);
  const first = h.render();
  await find(first, element => element.type === h.Input).props.onSubmit('123456789');
  const failed = h.render();
  find(failed, element => element.type === h.ErrorMessage).props.onRetry();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(h.requests, ['123456789', '123456789'], name + ': initial failure must retain retry ID');
  console.log('PASS ' + name + ' initial-failure retry');
  const form = find(h.render(), element => element.type === 'form');
  assert.ok(form, name + ': error view must allow changing MSSV');
  assert.equal(find(form, element => element.type === 'input').props.defaultValue, '123456789');
  await form.props.onSubmit({ preventDefault() {}, currentTarget: { studentId: '987654321' } });
  assert.equal(h.requests.at(-1), '987654321');
  const requestCount = h.requests.length;
  await form.props.onSubmit({ preventDefault() {}, currentTarget: { studentId: 'invalid' } });
  assert.equal(h.requests.length, requestCount, 'invalid input must not reach services');
  assert.equal(h.states[3], '987654321', 'invalid input must not replace the attempted ID');
  console.log('PASS ' + name + ' error-view change ID');
}

(async () => {
  await retryCheck('StudentSchedule');
  await retryCheck('TimetablePage');
  const dashboard = harness('StudentSchedule', { 2: { data: [[], [], []] }, 8: [{ TenKT: 'Exam-only fixture' }] });
  assert.match(renderToStaticMarkup(dashboard.render()), /Lịch thi riêng/, 'exams must render without upcoming classes');
  console.log('PASS dashboard exam-only section');
  const calendar = harness('Timetable');
  const tree = calendar.render({ schedules: [], exams: [{ TenKT: 'Valid', NgayThi: '09/10/2026', GioThi: '09:30' }] });
  const rendered = find(tree, element => element.type === calendar.Calendar);
  assert.ok(rendered, 'exam-only calendar must not render class-empty state');
  assert.equal(rendered.props.events.length, 1);
  assert.equal(rendered.props.events[0].start.getHours(), 9);
  console.log('PASS calendar exam-only event');
  const mixed = calendar.render({ schedules: [], exams: [
    { TenKT: 'Valid', NgayThi: '2026-10-09', GioThi: '' },
    { TenKT: 'Missing', NgayThi: '', GioThi: '09:00' },
    { TenKT: 'Malformed', NgayThi: 'not-a-date', GioThi: '09:00' },
    { TenKT: 'Impossible', NgayThi: '31/02/2026', GioThi: '09:00' },
    { TenKT: 'Bad time', NgayThi: '2026-10-09', GioThi: '24:00' },
  ] });
  const validEvents = find(mixed, element => element.type === calendar.Calendar).props.events;
  assert.equal(validEvents.length, 1, 'invalid exams must be omitted, never assigned today');
  assert.equal(validEvents[0].start.getHours(), 8, 'preserve missing-time default');
  assert.match(renderToStaticMarkup(mixed), /4 lịch thi.*ngày\/giờ không hợp lệ/, 'omissions must be explained');
  const invalidOnly = calendar.render({ schedules: [], exams: [{ TenKT: 'Missing', NgayThi: '' }] });
  assert.equal(find(invalidOnly, element => element.type === calendar.Calendar), undefined);
  assert.match(renderToStaticMarkup(invalidOnly), /1 lịch thi.*ngày\/giờ không hợp lệ/);
  console.log('PASS invalid exam omission, warning, empty-state warning');
  assert.equal(find(calendar.render({ schedules: [], exams: [] }), element => element.type === calendar.Calendar), undefined);
  console.log('PASS calendar truly empty');
})().catch(error => { console.error(error); process.exitCode = 1; });