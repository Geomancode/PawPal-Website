// Deterministic hook lifecycle runner: executes the production hook body with
// state/effect scheduling, not a DOM or a claim about React/browser rendering.
export function hookHarness() {
  const slots = []; let index = 0, dirty = false; const pending = [];
  const api = {
    useState(initial) {
      const i = index++;
      if (!slots[i]) slots[i] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, update => { const next = typeof update === 'function' ? update(slots[i].value) : update; if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; } }];
    },
    useRef(initial) { const i=index++; if(!slots[i]) slots[i]={current:initial};return slots[i]; },
    useSyncExternalStore(_subscribe, getSnapshot) { return getSnapshot(); },
    useEffect(effect, deps) {
      const i = index++; const old = slots[i];
      if (!old || deps.some((d,j) => !Object.is(d, old.deps[j]))) {
        slots[i] = { ...old, deps };
        pending.push(() => { old?.cleanup?.(); slots[i].cleanup = effect(); });
      }
    },
  };
  let hook, value;
  const render = () => { index = 0; dirty = false; value = hook(); return value; };
  const flush = async () => {
    for (let i=0;i<15;i++) {
      while (pending.length) pending.shift()();
      await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
      if (dirty) render();
    }
    return value;
  };
  return { api, mount(fn) { hook=fn; return render(); }, render, flush, get value() { return value; }, cleanup() { for (const s of slots) s?.cleanup?.(); } };
}
