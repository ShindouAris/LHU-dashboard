import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const source = await readFile(new URL('../src/services/chisaAISession.ts', import.meta.url), 'utf8').catch(() => '');
assert.ok(source.includes('getChisaAISession'), 'session helper must exist');
const code = ts.transpileModule(source.replace('import.meta.env.VITE_API_URL', '"https://api.invalid"'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { getChisaAISession } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const realFetch = globalThis.fetch;
const realNow = Date.now;
let now = 1_800_000_000_000;
let calls = [];
let respond = () => Response.json({ token: 'jwt-1', refreshAt: (now + 30 * 60_000) / 1000, expiresAt: (now + 35 * 60_000) / 1000 });
Date.now = () => now;
globalThis.fetch = async (url, options) => {
  calls.push({ url, ...options, body: JSON.parse(options.body) });
  return respond();
};
try {
  assert.deepEqual(await Promise.all([getChisaAISession('school-a'), getChisaAISession('school-a')]), ['jwt-1', 'jwt-1']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.invalid/chisaAI/v3/session');
  assert.deepEqual(calls[0].body, { accessToken: 'school-a' });
  assert.equal(calls[0].method, 'POST');
  assert.equal(await getChisaAISession('school-a'), 'jwt-1');
  assert.equal(calls.length, 1);
  console.log('PASS exchange single-flight and memory cache');
  now += 30 * 60_000;
  respond = () => Response.json({ token: 'jwt-2', refreshAt: (now + 30 * 60_000) / 1000, expiresAt: (now + 35 * 60_000) / 1000 });
  assert.deepEqual(await Promise.all([getChisaAISession('school-a'), getChisaAISession('school-a')]), ['jwt-2', 'jwt-2']);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, 'https://api.invalid/chisaAI/v3/session/refresh');
  assert.deepEqual(calls[1].body, { token: 'jwt-1' });
  console.log('PASS request-driven refresh at 30 minutes, single-flight');
  now += 30 * 60_000;
  respond = () => { throw new TypeError('offline'); };
  assert.equal(await getChisaAISession('school-a'), 'jwt-2');
  respond = () => new Response('', { status: 503 });
  assert.equal(await getChisaAISession('school-a'), 'jwt-2');
  now += 5 * 60_000;
  await assert.rejects(getChisaAISession('school-a'));
  assert.equal(calls.at(-1).url, 'https://api.invalid/chisaAI/v3/session');
  console.log('PASS transient fallback only before expiry; expired sessions exchange');
  respond = () => Response.json({ token: 'jwt-b', refreshAt: (now + 30 * 60_000) / 1000, expiresAt: (now + 35 * 60_000) / 1000 });
  assert.equal(await getChisaAISession('school-b'), 'jwt-b');
  now += 30 * 60_000;
  respond = () => new Response('', { status: 401 });
  const before401 = calls.length;
  await assert.rejects(getChisaAISession('school-b'));
  assert.equal(calls.length, before401 + 1, '401 must not auto-exchange');
  respond = () => Response.json({ token: 'jwt-b-new', refreshAt: (now + 30 * 60_000) / 1000, expiresAt: (now + 35 * 60_000) / 1000 });
  assert.equal(await getChisaAISession('school-b'), 'jwt-b-new');
  assert.equal(calls.at(-1).url, 'https://api.invalid/chisaAI/v3/session');
  assert.deepEqual(calls.at(-1).body, { accessToken: 'school-b' });
  console.log('PASS account isolation; 401 invalidates without automatic school-token retry');
  const beforeEmpty = calls.length;
  await assert.rejects(getChisaAISession('  '));
  assert.equal(calls.length, beforeEmpty);
  for (const invalid of [null, {}, { token: '', refreshAt: 1, expiresAt: 2 }, { token: 'bad', refreshAt: 'later', expiresAt: 'never' }, { token: 'expired', refreshAt: now / 1000 - 10, expiresAt: now / 1000 }, { token: 'bad-order', refreshAt: now / 1000 + 30, expiresAt: now / 1000 + 10 }]) {
    respond = () => Response.json(invalid);
    await assert.rejects(getChisaAISession('invalid-school'));
  }
  console.log('PASS empty input and malformed/expired response validation');
  respond = () => new Response('', { status: 401 });
  const beforeExchange401 = calls.length;
  await assert.rejects(getChisaAISession('rejected-school'));
  assert.equal(calls.length, beforeExchange401 + 1);
  console.log('PASS failed exchange has no retry loop');
  now += 30 * 60_000;
  respond = () => new Response('', { status: 400 });
  await assert.rejects(getChisaAISession('school-b'));
  console.log('PASS non-transient HTTP failure never returns cached JWT');
  respond = async () => {
    now += 6 * 60_000;
    throw new TypeError('slow network failure');
  };
  await assert.rejects(getChisaAISession('school-b'));
  console.log('PASS expiry rechecked after in-flight failure');
  console.log('All ChisaAI session regression checks passed.');
} finally {
  globalThis.fetch = realFetch;
  Date.now = realNow;
}
