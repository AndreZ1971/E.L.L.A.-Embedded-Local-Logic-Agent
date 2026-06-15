// Converts favicon.svg → icon.ico for electron-builder
// Uses @napi-rs/canvas to render, then packs into ICO format manually

import { createCanvas } from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));

// Draw the ELLA icon (mirrors favicon.svg)
function drawElla(canvas) {
  const ctx = canvas.getContext("2d");
  const s = canvas.width;
  const sc = s / 32;

  // Background rounded rect
  ctx.fillStyle = "#7c6af7";
  const r = 7 * sc;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(s - r, 0);
  ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r);
  ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s);
  ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // E letter path (scaled from SVG viewBox 32x32)
  ctx.fillStyle = "white";
  ctx.beginPath();
  // M5.5,7 H20 V11 H9.5 V14.5 H18.5 V18.5 H9.5 V22 H20 V26 H5.5 Z
  ctx.moveTo(5.5 * sc, 7 * sc);
  ctx.lineTo(20 * sc, 7 * sc);
  ctx.lineTo(20 * sc, 11 * sc);
  ctx.lineTo(9.5 * sc, 11 * sc);
  ctx.lineTo(9.5 * sc, 14.5 * sc);
  ctx.lineTo(18.5 * sc, 14.5 * sc);
  ctx.lineTo(18.5 * sc, 18.5 * sc);
  ctx.lineTo(9.5 * sc, 18.5 * sc);
  ctx.lineTo(9.5 * sc, 22 * sc);
  ctx.lineTo(20 * sc, 22 * sc);
  ctx.lineTo(20 * sc, 26 * sc);
  ctx.lineTo(5.5 * sc, 26 * sc);
  ctx.closePath();
  ctx.fill();

  // Dot (circle cx=25.5 cy=23.5 r=2.5)
  ctx.beginPath();
  ctx.arc(25.5 * sc, 23.5 * sc, 2.5 * sc, 0, Math.PI * 2);
  ctx.fill();
}

// Build ICO file from multiple PNG buffers
// ICO format: header + directory entries + image data
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = dirEntrySize * count;

  let dataOffset = headerSize + dirSize;
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push({ size: pngBuffers[i].length, offset: dataOffset });
    dataOffset += pngBuffers[i].length;
  }

  const buf = Buffer.alloc(dataOffset);
  // ICO header
  buf.writeUInt16LE(0, 0); // reserved
  buf.writeUInt16LE(1, 2); // type: ICO
  buf.writeUInt16LE(count, 4); // image count

  for (let i = 0; i < count; i++) {
    const base = headerSize + i * dirEntrySize;
    const sz = sizes[i] >= 256 ? 0 : sizes[i]; // 256 → 0 in ICO spec
    buf.writeUInt8(sz, base); // width
    buf.writeUInt8(sz, base + 1); // height
    buf.writeUInt8(0, base + 2); // color count
    buf.writeUInt8(0, base + 3); // reserved
    buf.writeUInt16LE(1, base + 4); // color planes
    buf.writeUInt16LE(32, base + 6); // bits per pixel
    buf.writeUInt32LE(entries[i].size, base + 8);
    buf.writeUInt32LE(entries[i].offset, base + 12);
  }

  // Image data
  let pos = headerSize + dirSize;
  for (const png of pngBuffers) {
    png.copy(buf, pos);
    pos += png.length;
  }

  return buf;
}

const sizes = [16, 32, 48, 64, 128, 256];
const pngs = [];

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  drawElla(canvas);
  pngs.push(canvas.toBuffer("image/png"));
}

const ico = buildIco(pngs, sizes);
const outPath = resolve(__dir, "assets", "icon.ico");

import { mkdirSync } from "fs";
mkdirSync(resolve(__dir, "assets"), { recursive: true });
writeFileSync(outPath, ico);
console.log(`Icon written: ${outPath} (${(ico.length / 1024).toFixed(1)} KB)`);
