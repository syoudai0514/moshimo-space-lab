// Google Play 用フィーチャーグラフィック(1024x500)を生成する。
// ブラックホール降着円盤と超新星ジェットを主役にして、ストアで一瞬で内容が伝わる絵にする。

import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 500;
const FONT = 'DejaVu Sans, FreeSans, IPAGothic, sans-serif';
const JPFONT = 'IPAGothic, DejaVu Sans, sans-serif';

function stars(count) {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * W).toFixed(1);
    const y = (Math.random() * H).toFixed(1);
    const r = (Math.random() * 1.7 + 0.3).toFixed(2);
    const o = (Math.random() * 0.64 + 0.16).toFixed(2);
    out += `<circle cx="${x}" cy="${y}" r="${r}" fill="#dbe7ff" opacity="${o}"/>`;
  }
  return out;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="bg" cx="34%" cy="46%" r="88%">
      <stop offset="0%" stop-color="#162557"/>
      <stop offset="54%" stop-color="#060a1d"/>
      <stop offset="100%" stop-color="#010208"/>
    </radialGradient>
    <linearGradient id="disk" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fff7c9"/>
      <stop offset="18%" stop-color="#ffc145"/>
      <stop offset="48%" stop-color="#ff751f"/>
      <stop offset="78%" stop-color="#9f1b10"/>
      <stop offset="100%" stop-color="#210304"/>
    </linearGradient>
    <linearGradient id="jet" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="36%" stop-color="#8fe8ff" stop-opacity="0.88"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="64%" stop-color="#78d2ff" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#3b79ff" stop-opacity="0"/>
    </linearGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textglow" x="-35%" y="-45%" width="170%" height="190%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(190)}

  <g transform="translate(205 252) rotate(-12)">
    <ellipse rx="300" ry="86" fill="url(#disk)" opacity="0.36" filter="url(#glow)"/>
    <ellipse rx="268" ry="58" fill="none" stroke="#ffd56a" stroke-width="32" opacity="0.9" filter="url(#glow)"/>
    <ellipse rx="214" ry="44" fill="none" stroke="#ff7b1f" stroke-width="22" opacity="0.95"/>
    <ellipse rx="180" ry="132" fill="none" stroke="#f8fbff" stroke-width="13" opacity="0.82" filter="url(#textglow)"/>
    <circle r="76" fill="#000"/>
    <circle r="94" fill="none" stroke="#050711" stroke-width="34"/>
    <path d="M -270 14 C -112 64, 92 52, 286 -8" fill="none" stroke="#fff0b8" stroke-width="18" opacity="0.95" filter="url(#glow)"/>
    <circle r="70" fill="#000"/>
  </g>

  <g transform="translate(805 250) rotate(19)">
    <path d="M 0 -28 C -34 -188, -16 -276, 0 -352 C 24 -270, 38 -176, 0 -28 Z" fill="url(#jet)" filter="url(#glow)"/>
    <path d="M 0 28 C 34 188, 16 276, 0 352 C -24 270, -38 176, 0 28 Z" fill="url(#jet)" opacity="0.78" filter="url(#glow)"/>
    <circle r="72" fill="#fff3cf" opacity="0.24" filter="url(#glow)"/>
    <circle r="18" fill="#ffffff"/>
  </g>

  <g filter="url(#textglow)">
    <text x="675" y="178" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="62" fill="#eef5ff">Break the Universe</text>
    <text x="675" y="250" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="42" fill="#ffd86d">宇宙をこわして、学ぶ。</text>
    <text x="675" y="316" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="29" fill="#a9c8ff">ブラックホールも、超新星爆発も、指先で実験</text>
  </g>

  <text x="675" y="414" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="30" fill="#dce8ff">もしも宇宙ラボ</text>
</svg>`;

const out = resolve(here, '../store/feature-graphic.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✅ wrote', out, '(1024x500)');
