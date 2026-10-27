#!/usr/bin/env node
// Konvertiert die 219 PNG-Frames in WebP (Desktop 1444px + Mobil 720px)
// Aufruf: node scripts/build-frames.mjs
// Quelle: P:\Projekte\E.L.L.A\neue webseite\e-l-l-a-deine-ki-lebt-...\bulk-renamed-files-batch-1\

import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { join } from "path";

const SRC =
  "P:/Projekte/E.L.L.A/neue webseite/e-l-l-a-deine-ki-lebt-auf-deinem-computer-nicht-in-der-cloud/bulk-renamed-files-batch-1";
const DST_DESKTOP = "public/media/frames/desktop";
const DST_MOBILE = "public/media/frames/mobile";
const QUALITY = 70;
const DESKTOP_WIDTH = 1444;
const MOBILE_WIDTH = 720;

await mkdir(DST_DESKTOP, { recursive: true });
await mkdir(DST_MOBILE, { recursive: true });

const files = (await readdir(SRC)).filter((f) => f.endsWith(".png")).sort();
console.log(`${files.length} Frames gefunden`);

let doneDesktop = 0;
let doneMobile = 0;

const BATCH = 8;
for (let i = 0; i < files.length; i += BATCH) {
  const batch = files.slice(i, i + BATCH);
  await Promise.all(
    batch.map(async (file) => {
      const src = join(SRC, file);
      const name = file.replace(".png", ".webp");

      await sharp(src)
        .resize(DESKTOP_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(join(DST_DESKTOP, name));
      doneDesktop++;

      await sharp(src)
        .resize(MOBILE_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(join(DST_MOBILE, name));
      doneMobile++;

      process.stdout.write(
        `\r  Desktop: ${doneDesktop}/${files.length}  Mobil: ${doneMobile}/${files.length}`,
      );
    }),
  );
}

console.log("\n  Fertig!");

// Größe prüfen
const { statSync } = await import("fs");
let totalDesktop = 0,
  totalMobile = 0;
for (const f of files) {
  const name = f.replace(".png", ".webp");
  totalDesktop += statSync(join(DST_DESKTOP, name)).size;
  totalMobile += statSync(join(DST_MOBILE, name)).size;
}
console.log(`  Desktop: ${(totalDesktop / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Mobil:   ${(totalMobile / 1024 / 1024).toFixed(1)} MB`);
