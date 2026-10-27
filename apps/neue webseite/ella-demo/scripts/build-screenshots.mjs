#!/usr/bin/env node
// Konvertiert Screenshots aus Bilder-de/ und Bilder-en/ zu WebP (1600px + 800px srcset)
// Aufruf: node scripts/build-screenshots.mjs

import sharp from "sharp";
import { readdir, mkdir } from "fs/promises";
import { join, basename, extname } from "path";

const MATERIAL = "P:/Projekte/E.L.L.A/neue webseite";
const OUT = "public/media/screenshots";
const QUALITY = 78;

async function convertDir(srcDir, outDir) {
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter(
    (f) => /\.(png|jpe?g)$/i.test(f) && !f.startsWith("no "),
  );

  for (const file of files) {
    const src = join(srcDir, file);
    const slug = basename(file, extname(file))
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9äöü\-]/g, "");
    const name1600 = `${slug}.webp`;
    const name800 = `${slug}-800.webp`;

    await sharp(src)
      .resize(1600, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(outDir, name1600));

    await sharp(src)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(outDir, name800));

    console.log(`  ✓ ${file} → ${name1600} + ${name800}`);
  }
}

async function convertDirective(srcDir, outDir) {
  await mkdir(outDir, { recursive: true });
  const files = (await readdir(srcDir)).filter(
    (f) => f.startsWith("no ") && /\.(jpe?g|png)$/i.test(f),
  );

  for (const file of files) {
    const src = join(srcDir, file);
    const slug = file
      .replace(/^no\s+/i, "")
      .replace(extname(file), "")
      .toLowerCase()
      .replace(/\s+/g, "-");
    const name = `${slug}.webp`;

    await sharp(src)
      .resize(1600, null, { withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(join(outDir, name));

    console.log(`  ✓ ${file} → ${name}`);
  }
}

console.log("Screenshots DE:");
await convertDir(join(MATERIAL, "Bilder-de"), join(OUT, "de"));
console.log("Directive DE:");
await convertDirective(
  join(MATERIAL, "Bilder-de"),
  "public/media/directive/de",
);
console.log("Directive EN:");
await convertDirective(
  join(MATERIAL, "Bilder-en"),
  "public/media/directive/en",
);
console.log("Fertig!");
