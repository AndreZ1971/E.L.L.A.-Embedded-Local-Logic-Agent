#!/usr/bin/env node
/**
 * Removes DirectML.dll from the nested onnxruntime-node inside @huggingface/transformers.
 * onnxruntime-node >=1.17 bundles DirectML.dll for GPU acceleration, but it requires
 * the Windows AI Platform runtime which is not available on all systems. Since ELLA
 * uses device:"cpu" for Kokoro TTS, DirectML is not needed. Without this DLL present,
 * the binding loads correctly and falls back to CPU-only inference.
 */
import { existsSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const dmlPath = resolve(
  root,
  "node_modules/@huggingface/transformers/node_modules/onnxruntime-node/bin/napi-v3/win32/x64/DirectML.dll",
);

if (existsSync(dmlPath)) {
  renameSync(dmlPath, dmlPath + ".disabled");
  console.log(
    "[postinstall] DirectML.dll disabled (CPU-only mode for Kokoro TTS)",
  );
} else if (existsSync(dmlPath + ".disabled")) {
  // already disabled, nothing to do
} else {
  // Not present at all — nested ort was not installed or already cleaned
}
