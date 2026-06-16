// 太陽系版アプリアイコンの元画像を生成する。
// 中心に輝く太陽 + 傾けた公転軌道に乗った惑星を、SVGで描く。
// 既存の make-art.mjs と同じ宇宙背景・星屑のトーンに合わせている。

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
    <radialGradient id="sun" cx="46%" cy="42%" r="60%">
      <stop offset="0%" stop-color="#fffdf2"/>
      <stop offset="34%" stop-color="#ffe58a"/>
      <stop offset="68%" stop-color="#ffb12d"/>
      <stop offset="100%" stop-color="#ff7a1d"/>
    </radialGradient>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffcf6e" stop-opacity="0.9"/>
      <stop offset="45%" stop-color="#ff9a3c" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#ff7a1d" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="earth" cx="38%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#9fd0ff"/>
      <stop offset="55%" stop-color="#3f7fd0"/>
      <stop offset="100%" stop-color="#173a73"/>
    </radialGradient>
    <radialGradient id="mars" cx="38%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#ff9e6e"/>
      <stop offset="60%" stop-color="#cf5a32"/>
      <stop offset="100%" stop-color="#7a2a16"/>
    </radialGradient>
    <radialGradient id="saturn" cx="38%" cy="34%" r="75%">
      <stop offset="0%" stop-color="#ffeebc"/>
      <stop offset="60%" stop-color="#e3c47a"/>
      <stop offset="100%" stop-color="#9c7c3a"/>
    </radialGradient>
    <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="14" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
      <feGaussianBlur stdDeviation="5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>`;
}

// cx,cy 中心、s 基準サイズ。軌道を -22度 傾けた太陽系。
function solarMotif(cx, cy, s) {
  const tilt = -22;
  // 軌道半径(横)と扁平率
  const orbits = [
    { rx: 0.62, ry: 0.24 },
    { rx: 0.92, ry: 0.36 },
    { rx: 1.24, ry: 0.48 },
  ];
  let rings = '';
  for (const o of orbits) {
    rings += `<ellipse rx="${s * o.rx}" ry="${s * o.ry}" fill="none" stroke="#9fc0ff" stroke-width="${s * 0.018}" opacity="0.42"/>`;
  }

  // 各軌道上の惑星(角度はそれぞれ別に置いて動きを出す)
  const planet = (orb, angDeg, pr, fill) => {
    const a = (angDeg * Math.PI) / 180;
    const px = Math.cos(a) * s * orb.rx;
    const py = Math.sin(a) * s * orb.ry;
    return `<circle cx="${px.toFixed(2)}" cy="${py.toFixed(2)}" r="${(s * pr).toFixed(2)}" fill="${fill}"/>`;
  };

  return `
    <g transform="translate(${cx} ${cy}) rotate(${tilt})">
      ${rings}
      ${planet(orbits[2], 18, 0.085, 'url(#saturn)')}
      ${planet(orbits[1], 158, 0.075, 'url(#mars)')}
      ${planet(orbits[0], -68, 0.08, 'url(#earth)')}
      <circle r="${s * 0.74}" fill="url(#sunGlow)"/>
      <circle r="${s * 0.30}" fill="url(#sun)" filter="url(#softGlow)"/>
    </g>`;
}

function iconSvg(size, transparent = false) {
  const r = size * 0.235;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${defs()}
    ${transparent ? '' : `<rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>${stars(size, 110)}`}
    ${solarMotif(size * 0.5, size * 0.5, size * 0.3)}
  </svg>`;
}

async function png(svg, out, size) {
  await sharp(Buffer.from(svg)).png().toFile(resolve(here, out));
  console.log('✅', out, size);
}

await png(iconSvg(1024), '../store/icon-512-solar-src.png', 1024);
// 512 に縮小して書き出し(透過なし)
await sharp(resolve(here, '../store/icon-512-solar-src.png'))
  .resize(512, 512)
  .flatten({ background: '#070b1f' })
  .png()
  .toFile(resolve(here, '../store/icon-512-solar.png'));
console.log('✅ store/icon-512-solar.png (512)');
