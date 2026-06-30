#!/usr/bin/env node
/**
 * Removes the nested onnxruntime-node inside @huggingface/transformers so Node.js
 * falls back to the root onnxruntime-node v1.14.0 (used by @xenova/transformers).
 *
 * @huggingface/transformers v3.x ships with onnxruntime-node v1.21.0 which bundles
 * a large onnxruntime.dll that depends on Windows AI Platform DLLs (DirectML etc.)
 * not available on all systems — causing "The operating system cannot run %1." on load.
 * Root v1.14.0 is smaller, has no GPU-provider DLLs, and works everywhere.
 * ELLA uses device:"cpu" so v1.14.0 is fully sufficient.
 */
import { existsSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const nestedOrt = resolve(
  root,
  "node_modules/@huggingface/transformers/node_modules/onnxruntime-node",
);

if (existsSync(nestedOrt)) {
  rmSync(nestedOrt, { recursive: true, force: true });
  console.log(
    "[postinstall] Nested onnxruntime-node v1.21.0 removed — using root v1.14.0 for Kokoro TTS",
  );
}
