import assert from 'node:assert/strict';
import { build } from 'esbuild';

const { outputFiles } = await build({ entryPoints: ['src/services/chisaAIService.ts'], bundle: true, write: false, format: 'esm', platform: 'node', define: { 'import.meta.env.VITE_API_URL': '"https://test.invalid"' } });
const calls = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  const body = options.body ? JSON.parse(options.body) : undefined;
  calls.push({ url, body });
  if (url.endsWith('/session')) return Response.json({ token: 'fixture.jwt.internal', expiresAt: Date.now() / 1000 + 3600, refreshAt: Date.now() / 1000 + 1800 });
  return Response.json({ exists: true });
};
try {
  const { chisaAIService: service } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
  await service.getModels();
  assert.equal(calls.length, 1, 'public model metadata must not exchange a session');
  const schoolToken = 'fixture-school-token';
  await Promise.all([
    service.getChatList(schoolToken, null),
    service.getChatHistory(schoolToken, 'fixture-chat', null),
    service.checkUserV3(schoolToken),
    service.deleteChat(schoolToken, 'fixture-chat'),
    service.createUserV3(schoolToken),
  ]);
  assert.equal(calls.filter(call => call.url.endsWith('/session')).length, 1, 'authenticated calls share one session exchange');
  for (const call of calls.filter(call => call.body && !call.url.endsWith('/session'))) {
    assert.equal(call.body.accessToken, 'fixture.jwt.internal', call.url);
    assert(!JSON.stringify(call.body).includes(schoolToken), 'AI body must not leak school token');
  }
  const before = calls.length;
  await assert.rejects(service.getChatList('', null), /School session is required/);
  assert.equal(calls.length, before, 'missing school token must fail before fetch');
  console.log('PASS ChisaAI service: public models, one exchange, five JWT-only calls, missing-token rejection.');
} finally {
  globalThis.fetch = originalFetch;
}
