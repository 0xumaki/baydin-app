// Generate clover PNGs in various sizes from the source SVG.
const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('public/icons/luck-clover.svg');

Promise.all([
  sharp(svg).png().toFile('public/icons/luck-clover.png'),
  sharp(svg).resize(1024, 1024).png().toFile('public/icons/nav-earn-luck.png'),
  sharp(svg).resize(32, 32).png().toFile('public/favicon-32.png'),
  sharp(svg).resize(16, 16).png().toFile('public/favicon-16.png'),
  sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png'),
  sharp(svg).resize(192, 192).png().toFile('public/icon-192.png'),
  sharp(svg).resize(512, 512).png().toFile('public/icon-512.png'),
]).then(() => console.log('Generated clover PNGs'));

fs.copyFileSync('public/icons/luck-clover.svg', 'public/favicon.svg');
console.log('Copied luck-clover.svg to favicon.svg');
