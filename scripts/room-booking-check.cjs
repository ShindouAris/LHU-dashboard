// Offline regression check: actual TSX, real dayjs; stub only hooks/UI/API seams.
// Run: node scripts/room-booking-check.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const dayjs = require('dayjs');
const source = fs.readFileSync('src/components/LHU_UI/Elib_register.tsx', 'utf8');
const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true, target: ts.ScriptTarget.ES2020,
} }).outputText;
const room = { PhongID: 1, TenPhong: 'Room', isBusy: 0 };
function harness() {
    const states = [], refs = [], calls = [], errors = [], logs = [];
    let cursor = 0, refCursor = 0, closed = 0, booked = 0, response;
    const React = {
        useState(initial) {
            const index = cursor++;
            if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
            return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
        },
        useRef(initial) { const index = refCursor++; return refs[index] ||= { current: initial }; },
        useEffect() {},
    };
    const jsx = (type, props) => ({ type, props });
    const service = { dang_ky_phong_hoc_nhom(payload) {
        calls.push(payload);
        return new Promise((resolve, reject) => { response = { resolve, reject }; });
    } };
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, Date, Error, console: {
        log: (...args) => logs.push(args), error() {},
    }, require(name) {
        if (name === 'react') return React;
        if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
        if (name === 'dayjs') return dayjs;
        if (name === '@/services/elibService') return { ELIB_SERVICE: service };
        if (name === 'react-hot-toast') return { error: value => errors.push(value), success() {} };
        return new Proxy({ __esModule: true, default: name.includes('power-off') ? 'PowerOffSlide' : name }, {
            get(target, key) { return key in target ? target[key] : key; },
        });
    } });
    function render() {
        cursor = refCursor = 0;
        const tree = module.exports.default({ onClose: () => closed++, onBookingSuccess: () => booked++ });
        const nodes = [];
        function walk(node) {
            if (!node || typeof node !== 'object') return;
            if (Array.isArray(node)) return node.forEach(walk);
            if (typeof node.type === 'function') return walk(node.type(node.props));
            nodes.push(node);
            walk(node.props?.children);
        }
        walk(tree);
        return nodes;
    }
    render();
    Object.assign(states, { 0: { data: [room] }, 1: { data: [] }, 2: 1, 4: false,
        6: dayjs().add(1, 'day').toDate(), 7: '09:00', 8: '10:00' });
    return { states, calls, errors, logs, render, get response() { return response; },
        get closed() { return closed; }, get booked() { return booked; } };
}
const button = (nodes, text) => nodes.find(node => node.type === 'Button' && node.props.children === text);
const confirm = nodes => nodes.find(node => node.type === 'PowerOffSlide').props.onPowerOff();
const checks = {
    async validation() {
        for (const change of [
            h => { h.states[7] = 'bad'; },
            h => { h.states[8] = null; },
            h => { h.states[8] = '08:00'; },
            h => { h.states[6] = new Date(NaN); },
            h => { h.states[0] = { data: [{ ...room, isBusy: 1 }] }; },
            h => { h.states[3] = [{ ThietBiID: 1, SoLuongDKMuon: 1.5 }]; },
            h => { h.states[1] = { data: [{ ThietBiID: 1, SoLuong: 1, SoLuongDaMuon: 0 }] };
                h.states[3] = [{ ThietBiID: 1, SoLuongDKMuon: 2 }]; },
        ]) {
            const h = harness();
            change(h);
            await confirm(h.render());
            assert.equal(h.calls.length, 0, 'invalid booking must not reach API');
            assert.equal(h.closed, 0);
        }
        const h = harness();
        const submission = button(h.render(), 'Tôi đồng ý và xác nhận đăng ký').props.onClick();
        h.response.resolve({ success: false, message: 'unavailable' });
        await submission;
        assert.equal(h.closed, 0);
        assert.equal(h.states[2], 1);
        assert.equal(h.errors.at(-1), 'unavailable');
    },
    pickers() {
        const h = harness();
        const pickers = h.render().filter(node => node.type === 'TimePicker');
        for (const picker of pickers) {
            assert.equal(picker.props.value.isValid(), true, 'picker value must be a valid date');
            assert.equal(picker.props.minTime.isValid(), true);
            assert.equal(picker.props.maxTime.isValid(), true);
        }
        pickers[0].props.onChange(dayjs(new Date(NaN)));
        assert.equal(h.states[7], null);
        assert.equal(button(h.render(), 'Đăng Ký').props.disabled, true);
    },
    accessibility() {
        const h = harness();
        const roomNode = h.render().find(node => node.props?.onClick && node.props?.['aria-pressed'] !== undefined);
        assert.ok(roomNode, 'room must expose accessible selection');
        assert.equal(roomNode.type, 'button');
        assert.equal(roomNode.props.type, 'button');
        assert.equal(roomNode.props['aria-pressed'], true);
        roomNode.props.onClick();
        h.states[0].data[0].isBusy = 1;
        assert.equal(h.render().find(node => node.props?.['aria-pressed'] !== undefined).props.disabled, true);
        h.states[0].data[0].isBusy = 0;
        assert.ok(button(h.render(), 'Tôi đồng ý và xác nhận đăng ký'), 'confirmation needs native keyboard button');
    },
    async submission() {
        const h = harness();
        const nodes = h.render();
        const first = confirm(nodes);
        assert.equal(h.calls.length, 1, 'first confirmation must submit');
        const second = confirm(nodes);
        assert.equal(h.calls.length, 1, 'same-render duplicate confirmation must not submit');
        h.response.reject(new Error('offline'));
        await Promise.all([first, second]);
        assert.equal(h.closed, 0, 'failure must not close form');
        assert.equal(h.states[2], 1, 'failure must preserve room');
        assert.equal(h.errors.at(-1), 'offline');
        const retry = confirm(h.render());
        assert.equal(h.calls.length, 2, 'failure must allow retry');
        assert.equal(h.calls[1].ThoiGianBD, `${dayjs(h.states[6]).format('YYYY-MM-DD')} 09:00`);
        h.response.resolve({ success: true, madatcho: 'test-id' });
        await retry;
        assert.equal(h.booked, 1);
        assert.equal(h.closed, 1);
        assert.equal(h.logs.length, 0, 'booking payload must not be logged');
    },
    dates() {
        const h = harness();
        assert.equal(button(h.render(), 'Đăng Ký').props.disabled, false, 'future booking must be enabled');
        h.states[6] = dayjs().subtract(1, 'day').toDate();
        assert.equal(button(h.render(), 'Đăng Ký').props.disabled, true, 'past date must be disabled');
        h.states[6] = new Date();
        h.states[7] = dayjs().subtract(1, 'minute').format('HH:mm');
        assert.equal(button(h.render(), 'Đăng Ký').props.disabled, true, 'past time today must be disabled');
        h.states[7] = dayjs().add(1, 'minute').format('HH:mm');
        h.states[8] = dayjs().add(2, 'minute').format('HH:mm');
        assert.equal(button(h.render(), 'Đăng Ký').props.disabled, false, 'future time today must be enabled');
    },
};
(async () => {
    let failed = false;
    for (const [name, check] of Object.entries(checks)) {
        if (process.argv[2] && process.argv[2] !== name) continue;
        try { await check(); console.log(`PASS ${name}`); }
        catch (error) { failed = true; console.error(`FAIL ${name}: ${error.message}`); }
    }
    process.exitCode = failed ? 1 : 0;
})();