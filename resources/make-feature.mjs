// Google Play 用フィーチャーグラフィック(1024x500)を生成する。
// SVG で「崩壊する太陽系 + 飛んでいく惑星」を描き、コピーとアプリ名(日英併記)を載せて
// sharp で PNG 化する。絵文字に頼らず、惑星・軌跡は図形で描画(フォント依存を避ける)。
import sharp from 'sharp';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const W = 1024;
const H = 500;
const FONT = 'DejaVu Sans, FreeSans, IPAGothic, sans-serif';
const JPFONT = 'IPAGothic, DejaVu Sans, sans-serif';

let stars = '';
for (let i = 0; i < 160; i++) {
  const x = (Math.random() * W).toFixed(1);
  const y = (Math.random() * H).toFixed(1);
  const r = (Math.random() * 1.6 + 0.3).toFixed(2);
  const o = (Math.random() * 0.7 + 0.18).toFixed(2);
  stars += `<circle cx="${x}" cy="${y}" r="${r}" fill="#cdd9ff" opacity="${o}"/>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0c1538"/>
      <stop offset="0.55" stop-color="#070b1f"/>
      <stop offset="1" stop-color="#02030a"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#fff4cf"/>
      <stop offset="0.32" stop-color="#ffcf6a" stop-opacity="0.85"/>
      <stop offset="1" stop-color="#ffcf6a" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="planet" cx="0.35" cy="0.32" r="0.85">
      <stop offset="0" stop-color="#cfe7ff"/>
      <stop offset="1" stop-color="#3f7fd0"/>
    </radialGradient>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="7" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars}

  <g transform="translate(120 440)">
    <circle r="250" fill="url(#sun)"/>
    <g transform="rotate(-18)">
      <ellipse rx="310" ry="124" fill="none" stroke="rgba(130,170,255,0.30)" stroke-width="2"/>
      <ellipse rx="200" ry="80" fill="none" stroke="rgba(130,170,255,0.22)" stroke-width="2"/>
    </g>
    <circle r="50" fill="#ffe6a6"/>
    <circle r="32" fill="#fff7dc"/>
  </g>

  <path d="M 200 360 C 430 250, 660 175, 930 55" fill="none"
        stroke="rgba(255,217,122,0.7)" stroke-width="5"
        stroke-dasharray="15 13" stroke-linecap="round"/>
  <circle cx="930" cy="55" r="34" fill="#ffd97a" opacity="0.28" filter="url(#softglow)"/>
  <circle cx="930" cy="55" r="19" fill="url(#planet)"/>

  <g filter="url(#glow)">
    <text x="512" y="248" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="122">
      <tspan fill="#d6e4ff">Wow… </tspan><tspan fill="#ffd24d">BYE!?</tspan>
    </text>
  </g>

  <text x="512" y="338" text-anchor="middle" font-family="${JPFONT}" font-weight="bold"
        font-size="40" fill="#aac4ef" letter-spacing="1">What-If Space Lab　／　もしも宇宙ラボ</text>
</svg>`;

const out = resolve(here, '../store/feature-graphic.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✅ wrote', out, '(1024x500)');
