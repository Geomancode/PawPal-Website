import * as maplibregl from "maplibre-gl";

// MapLibre 6 requires an explicit worker URL when used through a bundler.
maplibregl.setWorkerUrl(
  new URL("maplibre-gl/dist/maplibre-gl-worker.mjs", import.meta.url).toString(),
);

export * from "maplibre-gl";
