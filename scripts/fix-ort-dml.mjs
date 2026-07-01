#!/usr/bin/env node
/**
 * Removes incompatible native DLLs and modules after npm install.
 *
 * 1. DirectML.dll from onnxruntime-node v1.21.0 (win32/x64 + arm64)
 *    → This system lacks Windows AI Platform DLLs that DirectML.dll depends on.
 *      Removing it forces ORT to use the CPU execution provider only.
 *      Both @xenova/transformers (wakeword) and @huggingface/transformers (Kokoro)
 *      work fine without DirectML.
 *
 * 2. nested sharp inside @huggingface/transformers
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

// Remove DirectML.dll from all ort-node installations (keeps the rest of the package intact)
const dmlDlls = [
  resolve(nm, "onnxruntime-node/bin/napi-v3/win32/x64/DirectML.dll"),
  resolve(nm, "onnxruntime-node/bin/napi-v3/win32/arm64/DirectML.dll"),
  resolve(
    nm,
    "@huggingface/transformers/node_modules/onnxruntime-node/bin/napi-v3/win32/x64/DirectML.dll",
  ),
  resolve(
    nm,
    "@huggingface/transformers/node_modules/onnxruntime-node/bin/napi-v3/win32/arm64/DirectML.dll",
  ),
];

for (const dll of dmlDlls) {
  if (existsSync(dll)) {
    rmSync(dll, { force: true });
    console.log(
      `[postinstall] Removed ${dll.replace(root + "\\", "").replace(root + "/", "")}`,
    );
  }
}

// Remove incompatible nested sharp packages
const sharpTargets = [
  resolve(nm, "@huggingface/transformers/node_modules/sharp"),
  resolve(nm, "@img"),
];

for (const target of sharpTargets) {
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
    console.log(
      `[postinstall] Removed ${target.replace(root + "\\", "").replace(root + "/", "")}`,
    );
  }
}
