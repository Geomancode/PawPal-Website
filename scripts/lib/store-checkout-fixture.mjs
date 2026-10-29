// Closed transports for the actual checkout route/helper. Never opens sockets,
// reads environment files, starts services, or creates payments.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as crypto from 'node:crypto';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '../..');
export function sourceModule(relative, dependencies = {}, environment = {}, globals = {}) {
  const filename = path.join(root, relative);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const context = { ...globals, exports: {}, process: { env: environment }, Date, URL, console, TextEncoder, Uint8Array, require(name) {
    if (name === 'node:crypto') return crypto;
    if (!Object.hasOwn(dependencies, name)) throw Error(`Unmocked import forbidden: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(code, context, { filename });
  return context.exports;
}
export const catalog = sourceModule('src/lib/checkoutCatalog.ts');
export const shipping = sourceModule('src/lib/checkoutShipping.ts');
export const guard = sourceModule('src/lib/stripeGuard.ts', {}, { STRIPE_SECRET_KEY: 'sk_test_synthetic_only' });
export const locales = sourceModule('src/i18n/locales.ts');
export const routing = sourceModule('src/i18n/routing.ts', { './locales': locales });
export const stockHelper = sourceModule('src/lib/storeCheckout.ts', { '@/lib/checkoutCatalog': catalog });
export const validShipping = { fullName: 'Synthetic Owner', email: 'qa@example.invalid', address: 'Synthetic Street', city: 'Synthetic City', zipCode: '9000', country: 'Belgium', phone: '123' };
export const product = { id: 'synthetic', name: 'Trusted Catalog Item', price: '10.25', currency: 'EUR', published: true, in_stock: true, stock_quantity: 2, stock_reserved: 0, stock_version: 0 };
export const ownerA = "b1500000-0000-4000-8000-000000000001";
export const ownerB = "b1500000-0000-4000-8000-000000000002";
export function checkoutFixture(options = {}) {
  const env = { STRIPE_SECRET_KEY: 'sk_test_synthetic_only' };
  const state = { rows: [structuredClone(product)], dbError: null, rpcFailure: null, failBind: false, loseBindAck: false, loseCreateAck: false, failCreate: false, stripeReads: 0, stripeCreates: [], rpcCalls: [], errors: [], reservations: new Map(), sessions: new Map(), lines: new Map(), orders: new Map(), sequence: 0, beforeReserve: null, ...options };
  const result = (data) => ({ data: structuredClone(data), error: null });
  const failure = (message) => ({ data: null, error: { message } });
  const release = (r) => { if (r.state !== 'held') return; for (const i of r.items) { const p = state.rows.find((p) => p.id === i.product_id); p.stock_reserved -= i.quantity; p.stock_version++; } r.state = 'released'; };
  const admin = { async rpc(name, args) {
    state.rpcCalls.push({ name, args: structuredClone(args) });
    if (state.dbError || state.rpcFailure === name) return failure('synthetic_database_unavailable');
    if (name === 'list_due_store_checkouts') return result([]);
    if (name === 'reserve_store_checkout') {
      if (state.beforeReserve) await state.beforeReserve();
      let r = state.reservations.get(args.p_attempt_id);
      if (r) return r.owner_id === args.p_owner_id && r.request_sha256 === args.p_request_sha256 ? result(r) : failure('store_attempt_conflict');
      let lineItems;
      try { lineItems = catalog.catalogLineItems(args.p_items.map((i) => ({ id: i.product_id, quantity: i.quantity })), state.rows.map((p) => ({ ...p, stock_quantity: p.stock_quantity - (p.stock_reserved ?? 0) }))); }
      catch { return failure('store_out_of_stock'); }
      r = { owner_id: args.p_owner_id, attempt_id: args.p_attempt_id, request_sha256: args.p_request_sha256, state: 'held', created_at: new Date().toISOString(), expires_at: new Date(Date.now() + 31 * 60 * 1000).toISOString(), create_started_at: null, session_id: null, session_url: null, currency: 'EUR', checkout_payload: structuredClone(args.p_checkout_payload), items: lineItems.map((i) => ({ product_id: i.price_data.product_data.metadata.product_id, name: i.price_data.product_data.name, unit_amount: i.price_data.unit_amount, quantity: i.quantity })) };
      r.subtotal_cents = r.items.reduce((s, i) => s + i.unit_amount * i.quantity, 0);
      r.shipping_cents = r.subtotal_cents >= 5000 ? 0 : 599; r.tax_cents = 0; r.total_cents = r.subtotal_cents + r.shipping_cents;
      for (const i of r.items) { const p = state.rows.find((p) => p.id === i.product_id); p.stock_reserved = (p.stock_reserved ?? 0) + i.quantity; p.stock_version = (p.stock_version ?? 0) + 1; }
      state.reservations.set(r.attempt_id, r); return result(r);
    }
    const r = state.reservations.get(args.p_attempt_id);
    if (!r) return failure('store_attempt_not_found');
    if (name === 'get_store_checkout') return result(r);
    if (name === 'begin_store_checkout_create') {
      if (r.state !== 'held' || r.session_id) return result(r);
      if (!r.create_started_at && Date.parse(r.expires_at) <= Date.now() + 30 * 60 * 1000) return failure('store_create_window_elapsed');
      if (r.create_started_at && Date.parse(r.create_started_at) <= Date.now() - 23 * 60 * 60 * 1000) return failure('store_create_recovery_requires_review');
      r.create_started_at ??= new Date().toISOString(); return result(r);
    }
    if (name === 'cancel_store_checkout_before_create') {
      if (r.create_started_at || r.session_id) return failure('store_provider_request_may_exist');
      release(r); return result(r);
    }
    if (name === 'bind_store_checkout') {
      if (state.failBind) return failure('synthetic_bind_failure');
      if (r.session_id && r.session_id !== args.p_session_id) return failure('store_session_conflict');
      r.session_id = args.p_session_id; r.session_url = args.p_session_url;
      if (state.loseBindAck) { state.loseBindAck = false; return failure('synthetic_lost_bind_response'); }
      return result(r);
    }
    if (name === 'observe_store_checkout') {
      assert.equal(r.session_id, args.p_session_id); assert.equal(r.total_cents, args.p_amount_total); assert.equal(r.currency, args.p_currency);
      if (r.state === 'held' && args.p_payment_status === 'paid') {
        for (const i of r.items) { const p = state.rows.find((p) => p.id === i.product_id); p.stock_quantity -= i.quantity; p.stock_reserved -= i.quantity; p.stock_version++; }
        r.state = 'paid'; state.orders.set(r.attempt_id, { ...structuredClone(r), id: r.attempt_id, paid_at: new Date().toISOString(), shipping: r.checkout_payload.shipping });
      } else if (r.state === 'held' && args.p_payment_status === 'unpaid' && (args.p_session_status === 'expired' || (args.p_session_status === 'complete' && args.p_payment_intent_status === 'canceled'))) release(r);
      return result(r);
    }
    throw Error(`Unexpected RPC: ${name}`);
  } };
  class Stripe {
    constructor(key) { assert.equal(key, env.STRIPE_SECRET_KEY); }
    checkout = { sessions: {
      create: async (params, { idempotencyKey }) => {
        state.stripeCreates.push({ params: structuredClone(params), idempotencyKey });
        if (state.failCreate) throw Object.assign(Error('Synthetic rejected request'), { type: 'StripeInvalidRequestError', statusCode: 400 });
        let session = state.sessions.get(idempotencyKey);
        if (!session) {
          const id = `cs_test_synthetic_${++state.sequence}`;
          const subtotal = params.line_items.reduce((n,i) => n + i.quantity * i.price_data.unit_amount,0);
          const fee = params.shipping_options[0].shipping_rate_data.fixed_amount.amount;
          session = { id, url: `https://checkout.example.invalid/${id}`, mode: 'payment', status: 'open', payment_status: 'unpaid', livemode: false, metadata: structuredClone(params.metadata), client_reference_id: params.client_reference_id, currency: 'eur', customer_email: params.customer_email, amount_subtotal: subtotal, amount_total: subtotal + fee, total_details: { amount_shipping: fee, amount_tax: 0, amount_discount: 0 }, shipping_cost: { amount_total: fee }, payment_intent: null };
          state.sessions.set(idempotencyKey, session);
          state.lines.set(id, params.line_items.map((i) => ({ description: i.price_data.product_data.name, quantity: i.quantity, amount_total: i.quantity * i.price_data.unit_amount, currency: i.price_data.currency, price: { unit_amount: i.price_data.unit_amount, product: { metadata: i.price_data.product_data.metadata } } })));
        } else assert.deepEqual(structuredClone(params), state.stripeCreates.find((c) => c.idempotencyKey === idempotencyKey).params, 'A retry must keep every Stripe parameter unchanged');
        if (state.loseCreateAck) { state.loseCreateAck = false; throw Error('Synthetic lost create response'); }
        return structuredClone(session);
      },
      retrieve: async (id) => { state.stripeReads++; const session = [...state.sessions.values()].find((s) => s.id === id); if (!session) throw Error('Unknown synthetic session'); return structuredClone(session); },
      listLineItems: async (id, params) => { assert.equal(params.limit, 100); return { data: structuredClone(state.lines.get(id)), has_more: false, object: 'list', url: '/synthetic' }; },
    } };
  }
  const scopedClient = (token) => ({ async rpc(name, args) {
    const owner = token === 'token-a' ? ownerA : token === 'token-b' ? ownerB : null;
    if (name === 'get_my_store_checkout') {
      const r = [...state.reservations.values()].find(r => r.session_id === args.p_session_id && r.owner_id === owner);
      return result(r ? {owner_id:owner,attempt_id:r.attempt_id,session_id:r.session_id}:null);
    }
    if (name === 'get_my_store_orders') return result({items:[...state.orders.values()].filter(r=>r.owner_id===owner),next_cursor:null,has_more:false});
    throw Error(`Unexpected user RPC ${name}`);
  } });
  const identity = sourceModule('src/lib/storeIdentity.ts', {
    'next/server': { NextResponse: { json: (value, init) => Response.json(value, init) } },
    '@/lib/supabaseServer': { supabaseServer: { auth: { getUser: async token => ({data:{user:token==='token-a'?{id:ownerA}:token==='token-b'?{id:ownerB}:null},error:null}) } }, createUserScopedSupabaseClient: scopedClient },
  });
  const route = sourceModule('src/app/api/checkout/route.ts', {
    'next/server': { NextResponse: { json: (value, init) => Response.json(value, init) } }, stripe: Stripe,
    '@/lib/storeIdentity': identity,
    '@/lib/supabaseAdmin': { getSupabaseAdmin: () => admin }, '@/lib/checkoutCatalog': catalog,
    '@/lib/storeCheckout': stockHelper, '@/lib/checkoutShipping': shipping, '@/lib/stripeGuard': guard,
    '@/i18n/locales': locales, '@/i18n/routing': routing, '@/lib/errorReporting': { reportError: (error) => state.errors.push(String(error)) },
  }, env);
  function body(overrides = {}) { return { attemptId: crypto.randomUUID(), items: [{ id: product.id, quantity: 1 }], shipping: validShipping, locale: 'en', ...overrides }; }
  async function post(payload = body(), token = 'token-a') { const response = await route.POST(new Request('http://127.0.0.1:3224/api/checkout', { method: 'POST', headers: { ...(token ? {authorization:`Bearer ${token}`} : {}), 'content-type': 'application/json', origin: 'http://127.0.0.1:3224' }, body: JSON.stringify(payload) })); return { status: response.status, data: await response.json() }; }
  const common = {'next/server': {}, stripe: Stripe, '@/lib/storeIdentity': identity,
    '@/lib/supabaseAdmin': {getSupabaseAdmin:()=>admin}, '@/lib/storeCheckout':stockHelper,
    '@/lib/stripeGuard':guard, '@/lib/errorReporting':{reportError:error=>state.errors.push(String(error))}};
  const sessionRoute = sourceModule('src/app/api/checkout/session/route.ts',common,env);
  const ordersRoute = sourceModule('src/app/api/store/orders/route.ts',common,env);
  async function get(route, url, token='token-a') {
    const request = new Request(url,{headers:token?{authorization:`Bearer ${token}`}:{}});
    request.nextUrl = new URL(url);
    const response = await route.GET(request); return {status:response.status,data:await response.json(),headers:response.headers};
  }
  return { state, admin, Stripe, route, body, post, helper: stockHelper,
    session:(id,token)=>get(sessionRoute,'http://127.0.0.1/api/checkout/session?session_id='+id,token),
    orders:token=>get(ordersRoute,'http://127.0.0.1/api/store/orders',token) };

}
