import { build } from "esbuild";
import { existsSync } from "fs";

// Drittanbieter-Pakete sind extern (werden als node_modules mitgeliefert)
// Workspace-Pakete (@ella/*) werden direkt eingebettet
const external = [
  "cheerio",
  "dotenv",
  "express",
  "googleapis",
  "mammoth",
  "msedge-tts",
  "multer",
  "mysql2",
  "pdf-parse",
  "turndown",
  "xlsx",
  "ffmpeg-static",
  "@xenova/transformers",
  // Transitive die ebenfalls dynamic require nutzen
  "sharp",
  "onnxruntime-node",
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
