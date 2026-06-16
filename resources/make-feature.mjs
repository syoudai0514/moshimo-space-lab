// Google Play 用フィーチャーグラフィック(1024x500)を生成する。
// 「ブラックホールの降着円盤」の質感はそのままに、アプリの主題=
// 「本物の重力で“もしも”を実験し、惑星が弾き飛ばされる」を表現する。
// 軌道を外れて飛んでいく惑星(もしも!)を主役に加え、テーマ文も実験寄りに。

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
    <radialGradient id="bg" cx="32%" cy="48%" r="92%">
      <stop offset="0%" stop-color="#172759"/>
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
    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fffdf2"/>
      <stop offset="42%" stop-color="#ffe58a"/>
      <stop offset="100%" stop-color="rgba(255,150,40,0)"/>
    </radialGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textglow" x="-35%" y="-45%" width="170%" height="190%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${stars(190)}

  <!-- 主役: 降着円盤をまとった恒星(=実験で崩壊しかけた太陽)と、それを回る惑星たち -->
  <g transform="translate(212 286)">
    <g transform="rotate(-13)">
      <!-- 降着円盤(ブラックホールのテイスト) -->
      <ellipse rx="262" ry="74" fill="url(#disk)" opacity="0.34" filter="url(#glow)"/>
      <ellipse rx="230" ry="50" fill="none" stroke="#ffd56a" stroke-width="27" opacity="0.88" filter="url(#glow)"/>
      <ellipse rx="184" ry="37" fill="none" stroke="#ff7b1f" stroke-width="18" opacity="0.95"/>
      <!-- 中心の恒星(まだ光っている) -->
      <circle r="100" fill="url(#sun)" filter="url(#glow)"/>
      <circle r="48" fill="#fff3cf" filter="url(#softglow)"/>
      <!-- 内側を回る惑星 -->
      <circle cx="-184" cy="5" r="12" fill="#7fb0ff"/>
      <circle cx="150" cy="-8" r="9" fill="#ffd08a"/>
    </g>
    <!-- 軌道を外れて飛んでいく惑星(=もしもの実験!)。左上の空きへ -->
    <g transform="rotate(-150)">
      <line x1="104" y1="0" x2="300" y2="0" stroke="rgba(255,217,122,0.78)" stroke-width="7"
            stroke-linecap="round" stroke-dasharray="16 13" filter="url(#softglow)"/>
      <circle cx="316" cy="0" r="16" fill="#ffd97a" filter="url(#softglow)"/>
    </g>
  </g>

  <!-- テーマ文(右側) -->
  <g filter="url(#textglow)">
    <text x="712" y="166" text-anchor="middle" font-family="${FONT}" font-weight="bold" font-size="52" fill="#eef5ff">Break the Universe</text>
    <text x="722" y="232" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="37" fill="#ffd86d">こわして学ぶ、宇宙の実験室。</text>
    <text x="722" y="292" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="25" fill="#a9c8ff">太陽を消す? 木星を恒星に? 惑星を弾き飛ばす?</text>
    <text x="722" y="330" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="25" fill="#a9c8ff">本物の重力で「もしも」を実験</text>
  </g>

  <text x="722" y="430" text-anchor="middle" font-family="${JPFONT}" font-weight="bold" font-size="29" fill="#dce8ff">もしも宇宙ラボ ・ What-If Space Lab</text>
</svg>`;

const out = resolve(here, '../store/feature-graphic.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('✅ wrote', out, '(1024x500)');
