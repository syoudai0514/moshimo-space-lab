// アプリアイコン・スプラッシュの元画像を生成する。
// SVG で「宇宙を実験する(もしもの軌道)」を表現し、sharp で PNG 化する。
// 生成後に `npm run assets` で各解像度のアイコン/スプラッシュに展開する。

import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// 中央の「実験のモチーフ」: 輝く恒星 + 2本の傾いた軌道 + 軌道上の惑星 +
// 軌道を外れて飛んでいく惑星(=もしもの実験)。アプリのアクセント色(琥珀/青)で。
function motif(cx, cy, s) {
  return `
    <g transform="translate(${cx} ${cy}) rotate(-22)">
      <!-- 外側の軌道 -->
      <ellipse rx="${s * 0.95}" ry="${s * 0.42}" fill="none"
        stroke="rgba(130,170,255,0.55)" stroke-width="${s * 0.025}"/>
      <!-- 内側の軌道 -->
      <ellipse rx="${s * 0.58}" ry="${s * 0.26}" fill="none"
        stroke="rgba(130,170,255,0.40)" stroke-width="${s * 0.022}"/>
      <!-- 中心の恒星(グロー) -->
      <circle r="${s * 0.30}" fill="url(#sun)"/>
      <circle r="${s * 0.165}" fill="#fff3cf"/>
      <!-- 内側軌道の惑星 -->
      <circle cx="${s * 0.58}" cy="0" r="${s * 0.075}" fill="#7fb0ff"/>
      <!-- 外れて飛んでいく惑星(もしも!) -->
      <g transform="rotate(-35)">
        <line x1="${s * 0.55}" y1="0" x2="${s * 1.25}" y2="0"
          stroke="rgba(255,217,122,0.7)" stroke-width="${s * 0.02}" stroke-dasharray="${s * 0.05} ${s * 0.04}"/>
        <circle cx="${s * 1.28}" cy="0" r="${s * 0.085}" fill="#ffd97a"/>
      </g>
    </g>`;
}

const defs = `
  <defs>
    <radialGradient id="bg" cx="38%" cy="32%" r="85%">
      <stop offset="0%" stop-color="#16244e"/>
      <stop offset="55%" stop-color="#0a1230"/>
      <stop offset="100%" stop-color="#04060f"/>
    </radialGradient>
    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff6dd"/>
      <stop offset="45%" stop-color="#ffd97a"/>
      <stop offset="100%" stop-color="rgba(255,180,80,0)"/>
    </radialGradient>
  </defs>`;

function iconSvg(size) {
  const r = size * 0.235; // 角丸(参考用。最終は assets ツールがマスクする)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
    ${motif(size * 0.5, size * 0.52, size * 0.30)}
  </svg>`;
}

// 適応アイコン(前景): 背景は assets ツールが付けるので透過 + 中央に収める
function iconForegroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    ${motif(size * 0.5, size * 0.5, size * 0.22)}
  </svg>`;
}

function splashSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${motif(size * 0.5, size * 0.5, size * 0.16)}
  </svg>`;
}

async function png(svg, out) {
  await sharp(Buffer.from(svg)).png().toFile(resolve(here, out));
  console.log('✅', out);
}

await png(iconSvg(1024), 'icon.png');
await png(iconForegroundSvg(1024), 'icon-foreground.png');
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#0a1230"/></svg>`, 'icon-background.png');
await png(splashSvg(2732), 'splash.png');
await png(splashSvg(2732), 'splash-dark.png');
