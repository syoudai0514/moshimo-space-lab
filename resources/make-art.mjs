// アプリアイコン・スプラッシュの元画像を生成する。
// ブラックホールの降着円盤 + 超新星ジェットを、SVGで再現性高く描く。

import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

function stars(size, count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.7 + Math.random() * 2.1;
    const o = 0.18 + Math.random() * 0.58;
    out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}" fill="#dbe7ff" opacity="${o.toFixed(2)}"/>`;
  }
  return out;
}

function defs() {
  return `
  <defs>
    <radialGradient id="bg" cx="42%" cy="34%" r="85%">
      <stop offset="0%" stop-color="#172456"/>
      <stop offset="48%" stop-color="#070b1f"/>
      <stop offset="100%" stop-color="#010208"/>
    </radialGradient>
    <radialGradient id="shadow" cx="50%" cy="50%" r="52%">
      <stop offset="0%" stop-color="#000000"/>
      <stop offset="66%" stop-color="#000000"/>
      <stop offset="72%" stop-color="#10131b"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="disk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff3bf"/>
      <stop offset="18%" stop-color="#ffb12d"/>
      <stop offset="52%" stop-color="#ff6f1f"/>
      <stop offset="82%" stop-color="#a51f10"/>
      <stop offset="100%" stop-color="#2f0705"/>
    </linearGradient>
    <linearGradient id="jet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e9fbff" stop-opacity="0"/>
      <stop offset="32%" stop-color="#92e4ff" stop-opacity="0.92"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="68%" stop-color="#78d8ff" stop-opacity="0.82"/>
      <stop offset="100%" stop-color="#3b79ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="16" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="hardGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <mask id="eventHorizon">
      <rect width="100%" height="100%" fill="white"/>
      <circle cx="0" cy="0" r="1" fill="black"/>
    </mask>
  </defs>`;
}

function blackHoleMotif(cx, cy, s, showJets = true) {
  const jet = showJets
    ? `<g transform="rotate(-18)">
        <path d="M 0 ${-s * 0.22} C ${-s * 0.08} ${-s * 0.95}, ${-s * 0.02} ${-s * 1.38}, 0 ${-s * 1.72}
                 C ${s * 0.07} ${-s * 1.36}, ${s * 0.1} ${-s * 0.9}, 0 ${-s * 0.22} Z"
              fill="url(#jet)" opacity="0.92" filter="url(#glow)"/>
        <path d="M 0 ${s * 0.22} C ${s * 0.08} ${s * 0.95}, ${s * 0.02} ${s * 1.38}, 0 ${s * 1.72}
                 C ${-s * 0.07} ${s * 1.36}, ${-s * 0.1} ${s * 0.9}, 0 ${s * 0.22} Z"
              fill="url(#jet)" opacity="0.72" filter="url(#glow)"/>
      </g>`
    : '';

  return `
    <g transform="translate(${cx} ${cy})">
      ${jet}
      <ellipse rx="${s * 1.18}" ry="${s * 0.35}" fill="url(#disk)" opacity="0.38" filter="url(#glow)" transform="rotate(-10)"/>
      <ellipse rx="${s * 1.05}" ry="${s * 0.25}" fill="none" stroke="#ffd66f" stroke-width="${s * 0.13}" opacity="0.92" filter="url(#hardGlow)" transform="rotate(-10)"/>
      <ellipse rx="${s * 0.86}" ry="${s * 0.19}" fill="none" stroke="#ff7a1d" stroke-width="${s * 0.09}" opacity="0.9" transform="rotate(-10)"/>
      <ellipse rx="${s * 0.72}" ry="${s * 0.54}" fill="none" stroke="#f5fbff" stroke-width="${s * 0.055}" opacity="0.88" filter="url(#hardGlow)"/>
      <circle r="${s * 0.38}" fill="url(#shadow)"/>
      <circle r="${s * 0.39}" fill="none" stroke="#090b12" stroke-width="${s * 0.16}"/>
      <path d="M ${-s * 1.0} ${s * 0.06} C ${-s * 0.42} ${s * 0.28}, ${s * 0.34} ${s * 0.22}, ${s * 1.06} ${-s * 0.04}"
            fill="none" stroke="#fff1ba" stroke-width="${s * 0.075}" opacity="0.95" filter="url(#hardGlow)"/>
      <circle r="${s * 0.30}" fill="#000000"/>
    </g>`;
}

function iconSvg(size, transparent = false) {
  const r = size * 0.235;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    ${transparent ? '' : `<rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>${stars(size, 120)}`}
    ${blackHoleMotif(size * 0.5, size * 0.52, size * 0.24, true)}
  </svg>`;
}

function splashSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    <rect width="${size}" height="${size}" fill="url(#bg)"/>
    ${stars(size, 420)}
    ${blackHoleMotif(size * 0.5, size * 0.5, size * 0.13, true)}
  </svg>`;
}

async function png(svg, out) {
  await sharp(Buffer.from(svg)).png().toFile(resolve(here, out));
  console.log('✅', out);
}

await png(iconSvg(1024), 'icon.png');
await png(iconSvg(1024, true), 'icon-foreground.png');
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#070b1f"/></svg>`, 'icon-background.png');
await png(splashSvg(2732), 'splash.png');
await png(splashSvg(2732), 'splash-dark.png');
