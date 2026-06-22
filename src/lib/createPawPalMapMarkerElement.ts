type PawPalMapMarkerTone = "mission" | "place" | "post" | "search";

type PawPalMapMarkerElementOptions = {
  icon: string;
  color: string;
  label?: string;
  tone?: PawPalMapMarkerTone;
};

const ROOT_WIDTH = 150;
const ROOT_HEIGHT_WITH_LABEL = 108;
const ROOT_HEIGHT_COMPACT = 82;
const CORE_SIZE = 56;
const TAIL_HEIGHT = 12;

export function createPawPalMapMarkerElement({
  icon,
  color,
  label,
  tone = "place",
}: PawPalMapMarkerElementOptions): HTMLElement {
  const hasLabel = Boolean(label);
  const root = document.createElement("div");
  root.className = "pawpal-map-marker";
  root.dataset.pawpalMapMarker = tone;
  root.style.cssText = `
    width: ${hasLabel ? ROOT_WIDTH : 82}px;
    height: ${hasLabel ? ROOT_HEIGHT_WITH_LABEL : ROOT_HEIGHT_COMPACT}px;
    cursor: pointer;
    pointer-events: auto;
  `;

  const visual = document.createElement("div");
  visual.className = "pawpal-map-marker__visual";
  visual.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 100%;
    height: 100%;
    transform: translateX(-50%) scale(0.78);
    transform-origin: 50% 100%;
    opacity: 0;
    transition:
      transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1),
      opacity 180ms ease;
    will-change: transform, opacity;
  `;

  if (hasLabel) {
    visual.appendChild(createLabel(label!, color));
  }

  visual.appendChild(createTail(color));
  visual.appendChild(createCore(icon, color));
  root.appendChild(visual);

  const setVisualState = (scale: number, opacity = "1") => {
    visual.style.transform = `translateX(-50%) scale(${scale})`;
    visual.style.opacity = opacity;
  };

  requestAnimationFrame(() => setVisualState(1));
  root.addEventListener("mouseenter", () => setVisualState(1.08));
  root.addEventListener("mouseleave", () => setVisualState(1));
  root.addEventListener("focusin", () => setVisualState(1.08));
  root.addEventListener("focusout", () => setVisualState(1));

  return root;
}

function createCore(icon: string, color: string): HTMLElement {
  const core = document.createElement("div");
  core.className = "pawpal-map-marker__core";
  core.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: ${TAIL_HEIGHT - 1}px;
    width: ${CORE_SIZE}px;
    height: ${CORE_SIZE}px;
    transform: translateX(-50%);
    padding: 4px;
    border-radius: 999px;
    background: var(--color-paw-panel);
    border: 2px solid #ffffff;
    box-shadow:
      0 8px 18px rgba(0, 0, 0, 0.18),
      0 3px 10px rgba(0, 0, 0, 0.14);
  `;

  const ring = document.createElement("div");
  ring.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 3px;
    border-radius: 999px;
    border: 3px solid ${color};
    background:
      linear-gradient(135deg, color-mix(in srgb, ${color} 14%, transparent), var(--color-paw-panel));
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  const glyph = document.createElement("span");
  glyph.style.cssText = `
    width: 100%;
    height: 100%;
    border-radius: 999px;
    background: color-mix(in srgb, ${color} 16%, var(--color-paw-panel));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    line-height: 1;
    overflow: hidden;
  `;
  glyph.textContent = icon;

  ring.appendChild(glyph);
  core.appendChild(ring);
  return core;
}

function createTail(color: string): HTMLElement {
  const tail = document.createElement("div");
  tail.className = "pawpal-map-marker__tail";
  tail.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 20px;
    height: ${TAIL_HEIGHT}px;
    transform: translateX(-50%);
    background: ${color};
    clip-path: polygon(50% 100%, 0 0, 100% 0);
    filter: drop-shadow(0 4px 5px rgba(0, 0, 0, 0.16));
  `;
  return tail;
}

function createLabel(label: string, color: string): HTMLElement {
  const bubble = document.createElement("div");
  bubble.className = "pawpal-map-marker__label";
  bubble.style.cssText = `
    position: absolute;
    left: 50%;
    bottom: ${TAIL_HEIGHT + CORE_SIZE + 8}px;
    max-width: 126px;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 9px 5px 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--color-paw-panel) 96%, transparent);
    border: 1px solid color-mix(in srgb, ${color} 30%, transparent);
    box-shadow: 0 5px 12px rgba(0, 0, 0, 0.14);
    color: var(--color-paw-ink);
    font-family: var(--font-app-logo), var(--font-sans), system-ui, sans-serif;
  `;

  const dot = document.createElement("span");
  dot.style.cssText = `
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 999px;
    background: ${color};
    box-shadow: 0 0 7px color-mix(in srgb, ${color} 40%, transparent);
  `;

  const text = document.createElement("span");
  text.style.cssText = `
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.05;
  `;
  text.textContent = label;

  bubble.appendChild(dot);
  bubble.appendChild(text);
  return bubble;
}
