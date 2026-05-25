import { build } from "esbuild";
import { builtinModules } from "node:module";

const external = [
  "electron",
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/main/index.js",
  sourcemap: true,
  external,
});

await build({
  entryPoints: ["src/preload.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/main/preload.js",
  sourcemap: true,
  external,
});

console.log("Build OK — main + preload");
