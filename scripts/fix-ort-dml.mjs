#!/usr/bin/env node
/**
 * Removes incompatible native modules that @huggingface/transformers installs
 * but that fail on systems without Windows AI Platform / newer VCRT.
 *
 * 1. nested onnxruntime-node v1.21.0  — onnxruntime.dll requires Windows AI DLLs
 *    → Node.js falls back to root v1.14.0 (works everywhere, CPU-only)
 *
 * 2. nested sharp v0.34.x inside @huggingface/transformers
 *    → delete so Node.js uses root sharp v0.32.6 which works on all Windows builds
 *
 * 3. @img/sharp-* platform binaries (pulled by sharp v0.33+/v0.34+)
 *    → root sharp v0.32.6 uses its own build/Release/*.node, no @img needed
 */
import { existsSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const nm = resolve(root, "node_modules");

const targets = [
  resolve(nm, "@huggingface/transformers/node_modules/onnxruntime-node"),
  resolve(nm, "@huggingface/transformers/node_modules/sharp"),
  resolve(nm, "@img"),
];

for (const target of targets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(
      `[postinstall] Removed ${target.replace(root + "\\", "").replace(root + "/", "")}`,
    );
  }
}
