// One-off icon generator: writes public/icons/nav-breath.png (512×512 PNG)
// from an inline Wind/breath SVG, using sharp.

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "public", "icons", "nav-breath.png");

// 512×512 viewBox icon — concentric breath rings + a 4-leaf clover at center,
// in Baydin's editorial gold over ink background.
const svg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#1A1714"/>
      <stop offset="100%" stop-color="#0A0908"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E8C98A"/>
      <stop offset="55%" stop-color="#C5A572"/>
      <stop offset="100%" stop-color="#8A6A2B"/>
    </linearGradient>
    <radialGradient id="core" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFE3B0" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#C5A572" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#C5A572" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>

  <!-- subtle outer aura -->
  <circle cx="256" cy="256" r="200" fill="#C5A572" opacity="0.06"/>

  <!-- breath rings -->
  <circle cx="256" cy="256" r="180" stroke="#C5A572" stroke-opacity="0.18" stroke-width="2" fill="none"/>
  <circle cx="256" cy="256" r="138" stroke="#C5A572" stroke-opacity="0.30" stroke-width="2" fill="none"/>
  <circle cx="256" cy="256" r="96"  stroke="#C5A572" stroke-opacity="0.50" stroke-width="2" fill="none"/>

  <!-- phase tick marks (4 cardinal — box breathing 4-4-4-4) -->
  <g stroke="#C5A572" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round">
    <line x1="256" y1="60"  x2="256" y2="78"/>
    <line x1="452" y1="256" x2="434" y2="256"/>
    <line x1="256" y1="452" x2="256" y2="434"/>
    <line x1="60"  y1="256" x2="78"  y2="256"/>
  </g>

  <!-- core glow -->
  <circle cx="256" cy="256" r="80" fill="url(#core)"/>

  <!-- clover (breath/luck) — 4 leaves + stem -->
  <g transform="translate(256 256)" stroke="url(#gold)" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="M0 0 C -10 -30 -40 -40 -55 -25 C -70 -10 -55 25 -10 25 C -5 25 0 22 0 0 Z" fill="#C5A572" fill-opacity="0.18"/>
    <path d="M0 0 C 10 -30 40 -40 55 -25 C 70 -10 55 25 10 25 C 5 25 0 22 0 0 Z" fill="#C5A572" fill-opacity="0.18"/>
    <path d="M0 0 C -10 30 -40 40 -55 25 C -70 10 -55 -25 -10 -25 C -5 -25 0 -22 0 0 Z" fill="#C5A572" fill-opacity="0.18"/>
    <path d="M0 0 C 10 30 40 40 55 25 C 70 10 55 -25 10 -25 C 5 -25 0 -22 0 0 Z" fill="#C5A572" fill-opacity="0.18"/>
    <line x1="0" y1="0" x2="0" y2="80"/>
  </g>

  <!-- center pip -->
  <circle cx="256" cy="256" r="6" fill="url(#gold)"/>
</svg>`;

writeFileSync("/tmp/nav-breath.svg", svg);

await sharp(Buffer.from(svg))
  .resize(512, 512, { fit: "contain" })
  .png()
  .toFile(outPath);

console.log("Wrote", outPath);
