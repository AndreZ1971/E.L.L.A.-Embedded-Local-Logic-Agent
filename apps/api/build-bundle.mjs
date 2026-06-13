import { build } from "esbuild";
import { existsSync } from "fs";

// Nur Pakete mit nativen Bindings oder Binaries bleiben extern.
// Pure-JS-Pakete (express, dotenv, cheerio, …) werden direkt eingebettet —
// das macht node_modules im Installer überflüssig und kleiner.
const external = [
  "mysql2", // native bindings
  "ffmpeg-static", // binary
  "@xenova/transformers", // ONNX + native
  "sharp", // native
  "onnxruntime-node", // native
  // msedge-tts nutzt dynamic require für optionale native deps
  "msedge-tts",
];

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
