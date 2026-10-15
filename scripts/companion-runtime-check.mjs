// Browser-only fixtures: no production bypass, model key, or live backend writes.
// Browser plugin not available; uses the repository's existing Playwright dependency.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const base = process.env.COMPANION_TEST_BASE_URL || 'http://127.0.0.1:3126';
assert(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Fixture harness only runs against localhost');
const evidence = process.env.COMPANION_TEST_EVIDENCE_DIR || fileURLToPath(new URL('../../evidence/companion-qwen/web', import.meta.url));
await mkdir(evidence, { recursive: true });
let publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ctmoljqcjjmgdcsbyfdi.supabase.co';
try {
  const local = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  publicUrl = local.match(/^NEXT_PUBLIC_SUPABASE_URL=["']?([^\s"']+)/m)?.[1] || publicUrl;
} catch { /* A local environment file is optional. */ }
const authKey = `sb-${new URL(publicUrl).hostname.split('.')[0]}-auth-token`;
const owner = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';
const pets = [{ id: '11111111-1111-4111-a111-111111111111', name: 'Luna', species_group: 'cat', breed: null, bio: null, avatar_url: null, status: 'active' }, { id: '22222222-2222-4222-a222-222222222222', name: 'Miso', species_group: 'dog', breed: null, bio: null, avatar_url: null, status: 'active' }];
const user = { id: owner, email: 'companion-fixture@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: { display_name: 'Fixture owner' }, created_at: '2026-01-01T00:00:00Z' };
const fixtureToken = [Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url'), Buffer.from(JSON.stringify({ sub: owner, exp: 4102444800, role: 'authenticated' })).toString('base64url'), 'fixture-only'].join('.');
const authSession = { access_token: fixtureToken, refresh_token: 'fixture-only', token_type: 'bearer', expires_in: 360000, expires_at: 4102444800, user };
const browser = await chromium.launch({ headless: true });
const errors = [];
let page;

async function fixture({ signedIn = true, noPets = false, unavailable = false, delayPets = 0 } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(({ authKey, authSession, signedIn }) => {
    localStorage.setItem('pawpal-consent-v1', 'essential');
    if (signedIn && !localStorage.getItem('companion-fixture-seeded')) { localStorage.setItem(authKey, JSON.stringify(authSession)); localStorage.setItem('companion-fixture-seeded', 'yes'); }
  }, { authKey, authSession, signedIn });
  const byPet = new Map(pets.map(pet => [pet.id, { enabled: false, consent_epoch: 0, invalidation_revision: 0, memory_revision: 0, sessions: [], memories: [] }]));
  const calls = [];
  const control = { unavailable, failSend: false, delaySend: 0, conflict: false, noteConflict: false, stalePageOnce: false, delaySettings: 0 };
  const settings = state => ({ enabled: state.enabled, consent_epoch: state.consent_epoch, invalidation_revision: state.invalidation_revision, memory_revision: state.memory_revision });
  const reset = state => { state.invalidation_revision++; state.sessions.forEach(session => { session.messages = []; }); };
  const addMemory = (state, petId, text) => { state.memory_revision++; state.memories.unshift({ id: randomUUID(), pet_id: petId, source_id: randomUUID(), source_revision: 1, version: 1, event_at: new Date().toISOString(), content: text }); };
  await context.route('**/*', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === new URL(base).origin) return route.continue();
    const headers = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
    const ok = data => route.fulfill({ status: 200, headers, body: JSON.stringify(data) });
    const fail = (code, status = 503) => route.fulfill({ status, headers, body: JSON.stringify({ error: { code, retryable: true, request_id: 'fixture' } }) });
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    if (url.pathname.includes('/auth/v1/user')) return ok(user);
    if (url.pathname.includes('/auth/v1/logout')) return ok({});
    if (url.pathname.includes('/auth/v1/token')) return ok(authSession);
    if (!url.pathname.endsWith('/functions/v1/companion-chat')) return ok([]);
    const body = request.postDataJSON(); calls.push(body);
    if (body.operation === 'pets.list') {
      if (delayPets) await new Promise(resolve => setTimeout(resolve, delayPets));
      return control.unavailable ? fail('model_unavailable') : ok({ pets: noPets ? [] : pets });
    }
    const state = byPet.get(body.pet_id);
    assert(state, 'Every operation targets a known owned pet');
    const latest = () => state.sessions.at(-1);
    if (body.operation === 'settings.get') { if (control.delaySettings) await new Promise(resolve => setTimeout(resolve, control.delaySettings)); return ok(settings(state)); }
    if (body.operation === 'settings.enable' || body.operation === 'settings.revoke') {
      state.enabled = body.operation === 'settings.enable'; state.consent_epoch++; reset(state);
      if (!state.enabled) state.memories = [];
      return ok(settings(state));
    }
    if (body.operation === 'session.latest') return ok({ session: latest() || null });
    if (body.operation === 'session.start') {
      const session = { session_id: randomUUID(), pet_id: body.pet_id, mode: 'companion', messages: [] }; state.sessions.push(session); return ok(session);
    }
    if (body.operation === 'memory.list') {
      const all = state.enabled ? state.memories : [];
      const start = body.cursor ? Math.max(0, all.findIndex(item => item.id === body.cursor.id) + 1) : 0;
      const items = all.slice(start, start + body.limit);
      const response = { memories: items, next_cursor: start + items.length < all.length ? { id: items.at(-1).id, created_at: items.at(-1).event_at } : null, memory_revision: state.memory_revision, invalidation_revision: state.invalidation_revision };
      if (control.stalePageOnce) { control.stalePageOnce = false; state.consent_epoch++; state.memories = []; state.memory_revision++; reset(state); }
      return ok(response);
    }
    if (body.operation === 'source.record') { if (control.noteConflict) { control.noteConflict = false; state.consent_epoch++; state.memory_revision++; state.memories = []; reset(state); return fail('version_conflict', 409); } addMemory(state, body.pet_id, body.text); return ok({ source_id: state.memories[0].source_id, source_revision: 1, status: 'ready' }); }
    if (body.operation === 'memory.feedback') {
      const item = state.memories.find(memory => memory.id === body.memory_id); assert(item);
      assert.equal(body.expected_version, item.version); state.memories = state.memories.filter(memory => memory.id !== item.id); reset(state);
      if (body.action === 'correct') addMemory(state, body.pet_id, body.replacement);
      return ok({ status: 'ready' });
    }
    if (body.operation === 'chat.history') {
      const session = state.sessions.find(item => item.session_id === body.session_id); assert(session);
      return ok({ ...settings(state), pet_id: body.pet_id, session_id: body.session_id, messages: session.messages });
    }
    if (body.operation === 'chat.send') {
      if (control.failSend) { control.failSend = false; return fail('model_unavailable'); }
      if (control.conflict) { control.conflict = false; reset(state); return fail('version_conflict', 409); }
      if (control.delaySend) await new Promise(resolve => setTimeout(resolve, control.delaySend));
      assert.equal(body.expected_epoch, state.consent_epoch); assert.equal(body.expected_invalidation_revision, state.invalidation_revision);
      const session = state.sessions.find(item => item.session_id === body.session_id); assert(session);
      const reply = `${pets.find(pet => pet.id === body.pet_id).name} fixture reply: ${body.message}`;
      const existing = session.messages.find(item => item.id === `${body.request_id}-assistant`);
      if (!existing) {
        session.messages.push({ id: `${body.request_id}-user`, role: 'user', text: body.message, created_at: new Date().toISOString() }, { id: `${body.request_id}-assistant`, role: 'assistant', text: reply, created_at: new Date().toISOString() });
        if (body.remember) { assert(state.enabled); addMemory(state, body.pet_id, body.message); }
      }
      return ok({ reply, pet_id: body.pet_id, session_id: body.session_id, request_id: body.request_id, emotion: 'happy', context: { contract_version: 1, ...settings(state), pet_id: body.pet_id, session_id: body.session_id, episodes: state.memories.map(item => ({ id: item.id, text: item.content, evidence_ids: [item.source_id] })), evidence_refs: [], traits: [], uncertainties: [] } });
    }
    throw new Error(`Unexpected fixture operation ${body.operation}`);
  });
  const p = await context.newPage();
  p.on('pageerror', error => errors.push(error.message));
  p.on('console', msg => { if (msg.type() === 'error' && !/Failed to load resource.*(?:503|409)/.test(msg.text())) errors.push(msg.text()); });
  return { context, page: p, calls, control, byPet };
}
async function screenshot(name, fullPage = true) { await page.screenshot({ path: `${evidence}/${name}.png`, fullPage }); }
async function visible(text) { await page.getByText(text, { exact: true }).waitFor({ state: 'visible' }); }
async function send(text) { await page.getByLabel('Your message', { exact: true }).fill(text); await page.getByRole('button', { name: 'Send', exact: true }).click(); await visible(`Luna fixture reply: ${text}`); }
async function noOverflow() { assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow'); }

try {
  let run = await fixture({ signedIn: false }); page = run.page;
  await page.goto(`${base}/companion`); await visible('Come spend a little time together');
  assert.match(await page.title(), /Cyber companion/); assert.equal(await page.locator('h1').count(), 1); assert(await page.locator('meta[name="description"]').getAttribute('content'));
  await screenshot('01-signed-out'); await run.context.close(); console.log('PASS signed-out state, metadata, single h1');

  run = await fixture({ noPets: true }); page = run.page; await page.goto(`${base}/companion`); await visible('Your companion needs a pet profile'); await screenshot('02-no-pets'); await run.context.close(); console.log('PASS no-pets state');

  run = await fixture({ unavailable: true }); page = run.page; await page.goto(`${base}/companion`); await visible('Your companion is unavailable right now. Please try again shortly.'); await screenshot('03-service-unavailable'); run.control.unavailable = false; await page.getByRole('button', { name: 'Try again' }).click(); await visible('Hello, it’s Luna.'); await run.context.close(); console.log('PASS unavailable state and actual retry recovery');

  run = await fixture({ delayPets: 800 }); page = run.page; await page.goto(`${base}/companion`); await visible('Getting your companion ready…'); await screenshot('04-loading'); await visible('Hello, it’s Luna.');
  assert.equal(await page.getByRole('checkbox').count(), 0); await screenshot('05-ready-learning-off');
  await send('Hello from the browser fixture'); assert.equal(run.calls.filter(call => call.operation === 'chat.send').at(-1).remember, false);
  await page.reload(); await visible('Luna fixture reply: Hello from the browser fixture'); console.log('PASS chat send and scoped history survives reload; default remember=false');
  await page.getByRole('button', { name: 'Enable memory learning', exact: true }).click(); await visible('Memory learning is on');
  await page.getByLabel('A moment to remember').fill('Luna likes her blue ball.'); await page.getByRole('button', { name: 'Save this memory', exact: true }).click(); await page.locator('aside li').getByText('Luna likes her blue ball.', { exact: true }).waitFor(); await page.waitForFunction(() => document.getElementById('companion-note').value === '');
  await page.getByRole('checkbox').check(); await send('Luna enjoys evening walks.'); assert.equal(run.calls.filter(call => call.operation === 'chat.send').at(-1).remember, true);
  await page.getByText('Memories provided for this reply', { exact: true }).click(); await screenshot('06-chat-with-memory-desktop'); await noOverflow();
  const blue = page.locator('li').filter({ hasText: 'Luna likes her blue ball.' }); await blue.getByRole('button', { name: 'Correct', exact: true }).click(); await page.getByLabel('What should I remember instead?').fill('Luna likes her green ball.'); await page.getByRole('button', { name: 'Save correction', exact: true }).click(); await page.locator('aside li').getByText('Luna likes her green ball.', { exact: true }).waitFor(); assert.equal(await page.getByRole('log').getByText('Luna fixture reply: Luna enjoys evening walks.', { exact: true }).count(), 0); assert.equal(await page.getByText('Luna likes her blue ball.', { exact: true }).count(), 0);
  await page.locator('li').filter({ hasText: 'Luna likes her green ball.' }).getByRole('button', { name: 'Forget', exact: true }).click(); await page.getByText('Luna likes her green ball.', { exact: true }).waitFor({ state: 'detached' });
  await screenshot('07-correct-forget-clears-history'); console.log('PASS explicit notes, remember opt-in, sources, correction and forgetting invalidate history');

  run.control.noteConflict = true; await page.getByLabel('A moment to remember').fill('old epoch note'); await page.getByRole('button', { name: 'Save this memory', exact: true }).click(); await visible('Your pet’s memory changed on another device. Review the refreshed conversation, then send again.');
  const oldNote = run.calls.filter(call => call.operation === 'source.record').at(-1); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await page.getByLabel('A moment to remember').waitFor(); assert.equal(await page.getByLabel('A moment to remember').inputValue(), '');
  await page.getByLabel('A moment to remember').fill('new epoch note'); await page.getByRole('button', { name: 'Save this memory', exact: true }).click(); await page.locator('aside li').getByText('new epoch note', { exact: true }).waitFor(); const newNote = run.calls.filter(call => call.operation === 'source.record').at(-1); assert.notEqual(newNote.request_id, oldNote.request_id); assert.notEqual(newNote.expected_epoch, oldNote.expected_epoch); console.log('PASS note conflict recovery discards pending id at consent epoch change');
  await page.setViewportSize({ width: 375, height: 812 }); await noOverflow(); await screenshot('13-memory-enabled-mobile'); await page.setViewportSize({ width: 1440, height: 1000 });

  run.control.failSend = true; await page.getByLabel('Your message', { exact: true }).fill('retry-safe message'); await page.getByRole('button', { name: 'Send', exact: true }).click(); await visible('Your companion is unavailable right now. Please try again shortly.'); await screenshot('08-retry-message'); const failed = run.calls.filter(call => call.operation === 'chat.send').at(-1).request_id; await page.getByRole('button', { name: 'Retry message', exact: true }).click(); await visible('Luna fixture reply: retry-safe message'); assert.equal(run.calls.filter(call => call.operation === 'chat.send').at(-1).request_id, failed); console.log('PASS retry reuses the same request id');

  run.control.conflict = true; await page.getByLabel('Your message', { exact: true }).fill('version test'); await page.getByRole('button', { name: 'Send', exact: true }).click(); await visible('Your pet’s memory changed on another device. Review the refreshed conversation, then send again.'); await page.getByRole('button', { name: 'Retry message', exact: true }).click(); await visible('Luna fixture reply: version test'); console.log('PASS cross-device version conflict refreshes state and next send');

  const oldSession = run.calls.filter(call => call.operation === 'chat.send').at(-1).session_id; await page.getByRole('button', { name: 'New conversation' }).click(); await visible('Hello, it’s Luna.'); await send('new-session message'); assert.notEqual(run.calls.filter(call => call.operation === 'chat.send').at(-1).session_id, oldSession); console.log('PASS new conversation uses a new server session');
  run.control.delaySend = 750; await page.getByLabel('Your message', { exact: true }).fill('Luna-only delayed message'); await Promise.all([page.waitForRequest(request => request.url().includes('companion-chat') && request.postDataJSON()?.operation === 'chat.send'), page.getByRole('button', { name: 'Send', exact: true }).click()]); await page.getByLabel('Your companion', { exact: true }).selectOption(pets[1].id); await visible('Hello, it’s Miso.'); await page.waitForTimeout(1000); assert.equal(await page.getByText('Luna fixture reply: Luna-only delayed message', { exact: true }).count(), 0); await screenshot('09-pet-switch-isolation');
  await page.getByLabel('Your companion', { exact: true }).selectOption(pets[0].id); await visible('Luna fixture reply: Luna-only delayed message'); console.log('PASS delayed response cannot leak across pet switch; each pet restores its own history');
  const fixtureState = run.byPet.get(pets[0].id); fixtureState.memories = Array.from({ length: 21 }, (_, index) => ({ id: randomUUID(), pet_id: pets[0].id, source_id: randomUUID(), source_revision: 1, version: 1, event_at: new Date().toISOString(), content: `bulk-memory-${index}` })); fixtureState.memory_revision++;
  await page.reload(); await page.getByRole('button', { name: 'Load more', exact: true }).waitFor(); await visible('bulk-memory-0');
  fixtureState.enabled = false; fixtureState.consent_epoch++; fixtureState.memory_revision++; fixtureState.invalidation_revision++; fixtureState.memories = []; fixtureState.sessions.forEach(session => { session.messages = []; });
  await page.getByRole('button', { name: 'Load more', exact: true }).click(); await visible('Memory learning is off'); assert.equal(await page.getByText('bulk-memory-0', { exact: true }).count(), 0); assert.equal(await page.getByText('Luna fixture reply: Luna-only delayed message', { exact: true }).count(), 0); console.log('PASS pagination detects external revoke and clears old memories/history');
  await page.getByRole('button', { name: 'Enable memory learning', exact: true }).click(); await visible('Memory learning is on');
  fixtureState.memories = [{ id: randomUUID(), pet_id: pets[0].id, source_id: randomUUID(), source_revision: 1, version: 1, event_at: new Date().toISOString(), content: 'stale page must never render' }]; fixtureState.memory_revision++;
  run.control.stalePageOnce = true; run.control.delaySettings = 40; await page.reload(); await visible('Your pet’s memory changed on another device. Review the refreshed conversation, then send again.'); assert.equal(await page.getByText('stale page must never render', { exact: true }).count(), 0); await page.getByRole('button', { name: 'Try again', exact: true }).click(); await visible('Memory learning is on'); run.control.delaySettings = 0; console.log('PASS old memory page/new settings interleaving rejected before render');
  await page.getByRole('button', { name: 'Turn off & forget memories' }).click(); await visible('Memory learning is off'); await visible('No saved memories yet.'); assert.equal(await page.getByRole('checkbox').count(), 0); console.log('PASS revoke clears memories and message opt-in');

  await page.setViewportSize({ width: 375, height: 812 }); await noOverflow(); await screenshot('10-mobile-375');
  await page.setViewportSize({ width: 768, height: 1024 }); await noOverflow(); await screenshot('11-tablet-768');
  await page.goto(`${base}/zh/companion`); await page.getByRole('heading', { name: '赛博宠物', exact: true }).waitFor(); await visible('记忆学习已关闭'); await screenshot('12-chinese-locale');
  await page.goto(`${base}/de/companion`); await page.getByRole('heading', { name: 'Digitaler Begleiter', exact: true }).waitFor(); await noOverflow(); console.log('PASS 375/768/1440 layouts and Chinese/German localized routes');
  await page.goto(`${base}/companion`); await visible('Hello, it’s Luna.'); await page.setViewportSize({ width: 1440, height: 1000 });
  run.control.delaySend = 750; await page.getByLabel('Your message', { exact: true }).fill('signout-private-message'); await Promise.all([page.waitForRequest(request => request.url().includes('companion-chat') && request.postDataJSON()?.operation === 'chat.send'), page.getByRole('button', { name: 'Send', exact: true }).click()]); await page.getByRole('button', { name: 'Open account menu' }).click(); await page.getByRole('button', { name: 'Sign Out', exact: true }).click(); await page.waitForURL(base + '/'); await page.goto(`${base}/companion`); await visible('Come spend a little time together'); assert.equal(await page.getByRole('log').count(), 0); console.log('PASS signout removes private companion state');
  await run.context.close();
  assert.deepEqual(errors, [], 'No app console or runtime errors (expected HTTP 503/409 fixtures excluded)');
  console.log('PASS all companion browser fixture checks. MOCK BACKEND ONLY: does not prove live Qwen deployment.');
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: `${evidence}/failure.png`, fullPage: true });
  console.error(error); process.exitCode = 1;
} finally { await browser.close(); }
