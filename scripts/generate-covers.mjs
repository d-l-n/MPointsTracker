import sharp from "sharp";
import { existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "public", "games", "covers");

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const W = 640;
const H = 360;

const GAMES = [
  { id: "uno", name: "UNO", color: "#E63946", accent: "#ff6b6b" },
  { id: "uno_no_mercy", name: "UNO No Mercy", color: "#2D2D2D", accent: "#ff8c42" },
  { id: "uno_flip", name: "UNO Flip", color: "#7B2FBE", accent: "#b87cff" },
  { id: "uno_dos", name: "DOS", color: "#2980B9", accent: "#58a6ff" },
  { id: "truco", name: "Truco", color: "#8B5E3C", accent: "#b78a60" },
  { id: "chancho", name: "Chancho", color: "#E91E8C", accent: "#ff5db1" },
  { id: "esquinados", name: "Esquinados", color: "#2E7D32", accent: "#4fd17d" },
  { id: "chin", name: "Chin", color: "#8B1A1A", accent: "#9ea7ff" },
  { id: "chinchon", name: "Chinchón", color: "#E67E22", accent: "#ff9c45" },
  { id: "rummy", name: "Rummy", color: "#2980B9", accent: "#4ca3ff" },
  { id: "poker", name: "Poker", color: "#E63946", accent: "#ff6f61" },
  { id: "blackjack", name: "Blackjack", color: "#2D2D2D", accent: "#ffb347" },
  { id: "burako", name: "Burako", color: "#8E44AD", accent: "#cb7cff" },
  { id: "generala", name: "Generala", color: "#D4A017", accent: "#ffd54a" },
  { id: "ajedrez", name: "Ajedrez", color: "#4A4A6A", accent: "#9ea7ff" },
  { id: "racha_perdida", name: "Racha Perdida", color: "#6C3483", accent: "#b37dff" },
  { id: "sushi_do", name: "Sushi Do!", color: "#D94841", accent: "#ff8d7b" },
  { id: "portion_counter", name: "Contador de Porciones", color: "#1ABC9C", accent: "#3dd9b8" },
  { id: "basta_dym", name: "Basta!", color: "#2F7DE1", accent: "#67a6ff" },
  { id: "monopoly", name: "Monopoly", color: "#E63946", accent: "#ff7c72" },
  { id: "life", name: "Life", color: "#27AE60", accent: "#52d681" },
  { id: "custom", name: "Juego Libre", color: "#7b6fff", accent: "#9f8cff" },
  { id: "canasta", name: "Canasta", color: "#C0392B", accent: "#ff7d6b" },
];

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

async function generate(game) {
  const { r, g, b } = hexToRgb(game.color);
  const { r: ar, g: ag, b: ab } = hexToRgb(game.accent);

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:rgb(${r},${g},${b})" />
        <stop offset="50%" style="stop-color:rgb(${Math.floor((r+ar)/2)},${Math.floor((g+ag)/2)},${Math.floor((b+ab)/2)})" />
        <stop offset="100%" style="stop-color:rgb(${Math.floor(r*0.6)},${Math.floor(g*0.6)},${Math.floor(b*0.6)})" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="60%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:rgba(0,0,0,0)" />
        <stop offset="100%" style="stop-color:rgba(0,0,0,0.55)" />
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)" rx="24" />
    <circle cx="${W*0.2}" cy="${H*0.3}" r="${H*0.35}" fill="rgba(255,255,255,0.06)" />
    <circle cx="${W*0.8}" cy="${H*0.7}" r="${H*0.25}" fill="rgba(0,0,0,0.08)" />
    <rect width="${W}" height="${H}" fill="url(#overlay)" rx="24" />
    <text x="${W/2}" y="${H*0.48}" text-anchor="middle" dominant-baseline="central"
      font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="800"
      fill="rgba(255,255,255,0.92)" letter-spacing="2">${game.name}</text>
  </svg>`;

  const outPath = resolve(OUT, `${game.id}.webp`);
  await sharp(Buffer.from(svg))
    .resize(W, H)
    .webp({ quality: 85, effort: 4 })
    .toFile(outPath);
  console.log(`  ✓ ${game.id} → ${outPath}`);
}

async function main() {
  console.log(`Generating ${GAMES.length} WebP covers…\n`);
  for (const game of GAMES) {
    await generate(game);
  }
  console.log(`\nDone — ${GAMES.length} covers in ${OUT}`);
}

main().catch(console.error);
