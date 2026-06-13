import { build } from "esbuild";
import { existsSync } from "fs";

// Nur @xenova/transformers bleibt extern — es hat echte ONNX-native-Bindings
// und wird nur lazy in whisper.ts geladen (kein Top-Level-Import von index.ts).
//
// ffmpeg-static / msedge-tts: pure JS (binary-path wird erst bei Feature-Nutzung
// gebraucht, nicht beim Start) → eingebettet, kein Crash beim Laden.
// sharp / onnxruntime-node: nirgends direkt von index.ts importiert → kein Problem.
const external = ["@xenova/transformers"];

await build({
  entryPoints: ["dist/index.js"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: "dist/bundle.cjs",
  external,
  loader: { ".node": "copy" },
  keepNames: true,
  logLevel: "info",
  // import.meta.url Polyfill für CJS-Output
  banner: {
    js: `const __esm_import_meta_url = require("url").pathToFileURL(__filename).href;`,
  },
  define: {
    "import.meta.url": "__esm_import_meta_url",
  },
});

console.log("Bundle OK: dist/bundle.cjs");
