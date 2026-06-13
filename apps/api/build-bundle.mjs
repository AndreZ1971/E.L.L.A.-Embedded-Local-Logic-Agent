import { build } from "esbuild";
import { existsSync } from "fs";

// Externe Pakete: native Addons die nicht gebundelt werden können.
// @napi-rs/canvas: native Canvas-Addon das pdf-parse optional lädt.
//   → als external markieren damit esbuild es nicht inliniert.
//   → DOMMatrix-Stub im Banner verhindert den Crash wenn Canvas nicht verfügbar.
// @xenova/transformers: ONNX native, nur lazy via Whisper-Feature geladen.
const external = ["@napi-rs/canvas", "@xenova/transformers"];

// DOMMatrix-Stub: Node.js hat diese Browser-API nicht.
// pdf-parse/canvas versucht DOMMatrix zu nutzen — der Stub verhindert den Crash.
// Echte Canvas-Funktionalität ist für ELLA nicht erforderlich.
const domMatrixStub = `
if (typeof DOMMatrix === "undefined") {
  global.DOMMatrix = class DOMMatrix {
    constructor() { this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0; }
    static fromMatrix(m) { return new DOMMatrix(); }
    multiply() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    inverse() { return this; }
    transformPoint(p) { return p ?? { x:0, y:0 }; }
  };
}
if (typeof ImageData === "undefined") {
  global.ImageData = class ImageData {
    constructor(w, h) { this.width=w; this.height=h; this.data=new Uint8ClampedArray(w*h*4); }
  };
}
if (typeof Path2D === "undefined") {
  global.Path2D = class Path2D { constructor() {} };
}
`;

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
  banner: {
    js:
      `const __esm_import_meta_url = require("url").pathToFileURL(__filename).href;\n` +
      domMatrixStub,
  },
  define: {
    "import.meta.url": "__esm_import_meta_url",
  },
});

console.log("Bundle OK: dist/bundle.cjs");
