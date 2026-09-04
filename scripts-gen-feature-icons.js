// Generate 22 feature icon PNGs (1024x1024, line-art on transparent bg).
const sharp = require('sharp');
const fs = require('fs');

const ICONS = {
  career: {
    color: '#C5A87C',
    body: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
  },
  heart: {
    color: '#D8788A',
    body: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  },
  health: {
    color: '#B5CD7E',
    body: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
  },
  brain: {
    color: '#9CA8A3',
    body: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>',
  },
  spiritual: {
    color: '#E7D2A8',
    body: '<circle cx="12" cy="12" r="4"/><path d="M12 4V2"/><path d="M12 22v-2"/><path d="M4 12H2"/><path d="M22 12h-2"/><path d="m6.34 6.34-1.41-1.41"/><path d="m19.07 19.07-1.41-1.41"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  },
  children: {
    color: '#C2A4D4',
    body: '<path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  },
  flame: {
    color: '#E7A264',
    body: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  },
  waves: {
    color: '#6FB6A8',
    body: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  },
  target: {
    color: '#C5A87C',
    body: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  },
  moon: {
    color: '#B5CD7E',
    body: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  },
  sparkles: {
    color: '#E7D2A8',
    body: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  },
  message: {
    color: '#9CA8A3',
    body: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  },
  calendar: {
    color: '#C5A87C',
    body: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/>',
  },
  clock: {
    color: '#C5A87C',
    body: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  },
  user: {
    color: '#E7D2A8',
    body: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  },
  shield: {
    color: '#B5CD7E',
    body: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  },
  book: {
    color: '#C5A87C',
    body: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"/>',
  },
  chart: {
    color: '#9CA8A3',
    body: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M7 16V9"/><path d="M11 16V5"/><path d="M15 16v-3"/><path d="M19 16V8"/>',
  },
  telescope: {
    color: '#B5CD7E',
    body: '<path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.275l13.504-4.44"/><path d="m13.56 11.747 4.332-9.386a.904.904 0 0 1 1.18-.497l1.957.988a.904.904 0 0 1 .348 1.227l-4.438 9.42"/><path d="m7.7 16.79-1.5 4.2"/><path d="M4 22h5"/><circle cx="15" cy="12" r="1"/>',
  },
  link: {
    color: '#9CA8A3',
    body: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  },
  star: {
    color: '#E7D2A8',
    body: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  },
  users: {
    color: '#C5A87C',
    body: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
};

const dir = 'public/icons/feature';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

(async () => {
  for (const [name, def] of Object.entries(ICONS)) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${def.color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">` +
      def.body +
      `</svg>`;
    await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile(`${dir}/feature-${name}.png`);
  }
  console.log(`Generated ${Object.keys(ICONS).length} feature icons`);
})();
