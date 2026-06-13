import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGalaxy, createBackgroundStars } from './galaxy.js?v=2';
import { SolarSystem, POS_SCALE, EARTH_MASS } from './solarsystem.js?v=4';
import { createUniverse, epochInfo, formatUniverseTime, NOW_GYR, END_GYR } from './universe.js?v=2';
import { createAtoms, atomEpochInfo, formatAtomTime, ATOM_LOG_MIN, ATOM_LOG_MAX } from './atoms.js?v=2';
import { SCENARIOS, EVENT_EXPLAIN, SIM_DISCLAIMER } from './scenarios.js?v=3';
import { LANGS, getLang, setLang, t, applyStaticI18n, SC_FURIGANA } from './i18n.js?v=2';

// 実験の表示用タイトル・問い。日本語のときは子供向けにふりがな付き。
const scTitle = (sc) => (getLang() === 'ja' ? (SC_FURIGANA[sc.id]?.title ?? sc.title) : sc.title);
const scQuestion = (sc) => (getLang() === 'ja' ? (SC_FURIGANA[sc.id]?.q ?? sc.question) : sc.question);

const APP_URL = 'https://syoudai0514.github.io/moshimo-space-lab/';

// ---------- レンダラー ----------
const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

// ---------- 太陽系シーン ----------
const solar = new SolarSystem();

const solarCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.005, 6000);
solarCam.position.set(0, 30, 65);
const solarControls = new OrbitControls(solarCam, canvas);
solarControls.enableDamping = true;
solarControls.minDistance = 0.02;
solarControls.maxDistance = 1800;

// ---------- 銀河シーン ----------
const galaxyScene = new THREE.Scene();
const galaxy = createGalaxy();
galaxyScene.add(galaxy.group);
galaxyScene.add(createBackgroundStars());

const galaxyCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 3000);
galaxyCam.position.set(0, 17, 26);
const galaxyControls = new OrbitControls(galaxyCam, canvas);
galaxyControls.enableDamping = true;
galaxyControls.minDistance = 4;
galaxyControls.maxDistance = 120;
galaxyControls.enabled = false;

// ---------- 宇宙の歴史シーン ----------
const universe = createUniverse();

const universeCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 4000);
universeCam.position.set(0, 35, 85);
const universeControls = new OrbitControls(universeCam, canvas);
universeControls.enableDamping = true;
universeControls.minDistance = 0.3; // 銀河1つ1つに寄れる
universeControls.maxDistance = 500;
universeControls.enabled = false;

// ---------- 原子の誕生シーン ----------
const atoms = createAtoms();

const atomsCam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
atomsCam.position.set(0, 7, 30);
const atomsControls = new OrbitControls(atomsCam, canvas);
atomsControls.enableDamping = true;
atomsControls.minDistance = 4;
atomsControls.maxDistance = 90;
atomsControls.enabled = false;

// ---------- 状態 ----------
let mode = 'solar';          // 'solar' | 'galaxy' | 'universe'
let solarPlaying = true;
let galaxyPlaying = false;
let galaxyTime = 0;          // 百万年
const GALAXY_RANGE = 3000;
const GALAXY_RATE = 80;      // 再生速度 80百万年/秒
let universePlaying = false;
let universeS = 0;           // 宇宙の歴史スライダー位置 (0〜1)
let atomsPlaying = false;
let atomsS = 0;              // 原子の誕生スライダー位置 (0〜1)
const atomsSliderToYears = (s) => Math.pow(10, ATOM_LOG_MIN + s * (ATOM_LOG_MAX - ATOM_LOG_MIN));
let followKey = null;        // 追従中の天体キー
const BASE_DATE = new Date(); // 「現在」の基準

// 宇宙の歴史スライダー:
//   [0, U_FLASH]   … 誕生の瞬間(無 → ビッグバンの閃光)
//   [U_FLASH, U_SPLIT] … 対数スケール(最初の3分〜10億年の大事件を引き伸ばす)
//   [U_SPLIT, 1]   … 線形(10億年〜238億年)
const U_FLASH = 0.05;
const U_SPLIT = 0.45;
const U_LOG_MIN = -15;       // 10^-15 十億年 ≈ 30秒
function sliderToGyr(s) {
  if (s <= 0) return 0; // 宇宙誕生前の「無」
  if (s <= U_FLASH) return Math.pow(10, -19 + (s / U_FLASH) * 4); // 閃光ゾーン
  if (s <= U_SPLIT) {
    return Math.pow(10, U_LOG_MIN + ((s - U_FLASH) / (U_SPLIT - U_FLASH)) * (0 - U_LOG_MIN));
  }
  return 1 + ((s - U_SPLIT) / (1 - U_SPLIT)) * (END_GYR - 1);
}
function gyrToSlider(t) {
  if (t <= 0) return 0;
  if (t <= 1e-15) return U_FLASH * (Math.log10(Math.max(t, 1e-19)) + 19) / 4;
  if (t <= 1) {
    return U_FLASH + (U_SPLIT - U_FLASH) * (Math.log10(t) - U_LOG_MIN) / (0 - U_LOG_MIN);
  }
  return U_SPLIT + ((t - 1) / (END_GYR - 1)) * (1 - U_SPLIT);
}

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const timeDisplay = $('time-display');
const playBtn = $('play-btn');
const speedSelect = $('speed-select');
const galaxySpeedSelect = $('galaxy-speed-select');
const galaxySlider = $('galaxy-slider');
const universeSlider = $('universe-slider');
const atomsSlider = $('atoms-slider');
const epochDisplay = $('epoch-display');
const nowBtn = $('now-btn');
const resetBtn = $('reset-btn');
const clearTrailsBtn = $('clear-trails-btn');
const planetPanel = $('planet-panel');
const panelToggle = $('panel-toggle');
const bodySelect = $('body-select');
const bodyInfo = $('body-info');
const sizeSlider = $('size-slider');
const massSlider = $('mass-slider');
const distSlider = $('dist-slider');
const distField = $('dist-field');
const sizeValue = $('size-value');
const massValue = $('mass-value');
const distValue = $('dist-value');
const exaggSlider = $('exagg-slider');
const exaggValue = $('exagg-value');
const followBtn = $('follow-btn');
const circularizeBtn = $('circularize-btn');
const swapField = $('swap-field');
const swapSelect = $('swap-select');
const swapBtn = $('swap-btn');
const deleteBtn = $('delete-btn');
const addPlanetBtn = $('add-planet-btn');
const addStarBtn = $('add-star-btn');

// 天体セレクトを構築(追加・リセットで作り直す)
function rebuildBodySelect() {
  const prev = bodySelect.value;
  bodySelect.innerHTML = '';
  for (const b of solar.bodies) {
    const opt = document.createElement('option');
    opt.value = b.key;
    opt.textContent = b.name;
    bodySelect.appendChild(opt);
  }
  if ([...bodySelect.options].some((o) => o.value === prev)) bodySelect.value = prev;
}
rebuildBodySelect();
bodySelect.value = 'earth';

// ---------- トースト通知 ----------
const toasts = $('toasts');
// ev は文字列、または { type, msg }。type に解説があるトーストはタップで開ける
function toast(ev) {
  const isObj = typeof ev === 'object';
  const msg = isObj ? ev.msg : ev;
  const explain = isObj ? EVENT_EXPLAIN[ev.type] : null;
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = explain ? `${msg} 💡` : msg;
  const life = explain ? 7000 : 3600; // 解説付きは読む時間を長めに
  if (explain) {
    div.classList.add('has-explain');
    div.addEventListener('click', () => openModal(explain.title, explain.body + disclaimerHtml()));
  }
  toasts.appendChild(div);
  setTimeout(() => div.classList.add('fade'), life);
  setTimeout(() => div.remove(), life + 800);
}

// ---------- 実験の記録 ----------
const eventLogEl = $('event-log');
const eventLog = []; // { time: '+1.2年', msg }
function logEvent(msg) {
  eventLog.push({ time: `+${solar.time.toFixed(1)}年`, msg });
  if (eventLog.length > 50) eventLog.shift();
  renderLog();
}
function renderLog() {
  if (eventLog.length === 0) {
    eventLogEl.innerHTML = `<p class="hint">${t('lab.logEmpty')}</p>`;
    return;
  }
  eventLogEl.innerHTML = eventLog
    .slice()
    .reverse()
    .map((e) => `<div class="log-row"><span class="log-time">${e.time}</span>${e.msg}</div>`)
    .join('');
}
function clearLog() {
  eventLog.length = 0;
  renderLog();
}

solar.onEvent = (ev) => {
  toast(ev);
  logEvent(ev.msg);
};

// ---------- 解説モーダル ----------
const modalOverlay = $('modal-overlay');
function disclaimerHtml() {
  return `<div class="disclaimer">${SIM_DISCLAIMER}</div>`;
}
function openModal(title, html) {
  $('modal-title').textContent = title;
  $('modal-body').innerHTML = html;
  modalOverlay.classList.remove('hidden');
}
$('modal-close').addEventListener('click', () => modalOverlay.classList.add('hidden'));
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
});

// ---------- もしも実験室 ----------
const labPanel = $('lab-panel');
const scenarioList = $('scenario-list');
const scenarioBanner = $('scenario-banner');
let activeScenario = null;

function renderScenarioList() {
  scenarioList.innerHTML = '';
  for (const sc of SCENARIOS) {
    const btn = document.createElement('button');
    btn.className = 'scenario-card';
    btn.dataset.id = sc.id;
    if (activeScenario && activeScenario.id === sc.id) btn.classList.add('active');
    btn.innerHTML = `<div class="sc-title">${sc.emoji} ${scTitle(sc)}</div><div class="sc-q">${scQuestion(sc)}</div>`;
    btn.addEventListener('click', () => startScenario(sc));
    scenarioList.appendChild(btn);
  }
}
renderScenarioList();

function startScenario(sc) {
  if (mode !== 'solar') setMode('solar');
  solar.reset();
  clearLog();
  clearEdits();
  followKey = null;
  sc.setup(solar);
  activeScenario = sc;
  speedSelect.value = sc.speed;
  solarPlaying = true;
  labPanel.classList.add('hidden');
  $('scenario-banner-title').innerHTML = `${sc.emoji} ${scTitle(sc)}`;
  scenarioBanner.classList.remove('hidden');
  for (const el of scenarioList.children) {
    el.classList.toggle('active', el.dataset.id === sc.id);
  }
  logEvent(`🧪 実験開始: ${sc.title}`);
  toast('🧪 実験スタート!何が起きるか観察しよう(💡解説 で答え合わせ)');
  updatePlayBtn();
  refreshPanel();
  updateTimeDisplay();
  // Android 版のみ: 実験の切り替えタイミングでときどき全画面広告(頻度は内部で制御)。
  // Web 版では MSLabAds が未定義なので何も起きない。
  window.MSLabAds?.maybeShowInterstitial?.();
}

function endScenario() {
  activeScenario = null;
  scenarioBanner.classList.add('hidden');
  for (const el of scenarioList.children) el.classList.remove('active');
}

$('lab-toggle').addEventListener('click', () => {
  if (mode !== 'solar') setMode('solar');
  observeMenu.classList.add('hidden');
  labPanel.classList.toggle('hidden');
});
$('lab-close').addEventListener('click', () => labPanel.classList.add('hidden'));

$('scenario-explain-btn').addEventListener('click', () => {
  if (!activeScenario) return;
  openModal(
    `${activeScenario.emoji} ${activeScenario.title}`,
    `<div class="sc-watch">👀 観察ポイント: ${activeScenario.watch}</div>`
      + activeScenario.explain
      + disclaimerHtml()
  );
});

$('scenario-end-btn').addEventListener('click', () => {
  endScenario();
  solar.reset();
  clearEdits();
  followKey = null;
  updateFollowBtn();
  refreshPanel();
  updateTimeDisplay();
  toast('↺ 実験を終了して元に戻しました');
});

// ---------- 結果シェア ----------
$('share-btn').addEventListener('click', openShareMenu);

// ---- 結果の集計(スコア化) ----
function survivalStats() {
  let absorbed = 0, escaped = 0, alive = 0, total = 0;
  for (const b of solar.bodies) {
    if (b.key === 'sun') continue;
    total++;
    if (!b.alive) absorbed++;
    else if (b.escaped) escaped++;
    else alive++;
  }
  return { total, absorbed, escaped, alive, years: solar.time };
}

function scoreLine() {
  const s = survivalStats();
  return `🏆 生存 ${s.alive}/${s.total}　🔥 ${s.absorbed}　🚀 ${s.escaped}`;
}

function freeOutcomeLine(s) {
  if (s.absorbed && s.escaped) return '惑星を飲み込ませたり弾き飛ばしたり、宇宙で大暴れ。';
  if (s.absorbed) return '惑星を太陽に飲み込ませてみた。';
  if (s.escaped) return '惑星を宇宙の彼方へ弾き飛ばしてみた。';
  return '本物の重力で太陽系をいじって遊べる実験室。';
}

// ---- 変更点(レシピ)の記録 ----
// 他の人がマネしやすいように、ユーザーがいじった内容を覚えておく。
// 同じ天体への同じ種類の変更は最新の値で上書き(挿入順は保持)。
const editLog = new Map(); // key -> 表示テキスト
function recordEdit(key, text) { editLog.delete(key); editLog.set(key, text); }
function dropEdit(key) { editLog.delete(key); }
function clearEdits() { editLog.clear(); }
function changeSummary() { return [...editLog.values()]; }
function fmtScale(x) { return x >= 10 ? `×${Math.round(x)}` : `×${x.toFixed(2)}`; }

// シェア本文: 結果を文章化 + 変更レシピ + ハッシュタグ + URL(引用したくなる一言を狙う)
function buildShareText() {
  const s = survivalStats();
  const title = activeScenario ? `${activeScenario.emoji} ${activeScenario.title}` : '🪐 自由実験モード';
  const outcome = activeScenario?.shareLine ?? freeOutcomeLine(s);
  const result = (s.absorbed || s.escaped)
    ? `→ ${s.years.toFixed(1)}年で 🔥${s.absorbed}個飲み込み / 🚀${s.escaped}個射出（生存 ${s.alive}/${s.total}）`
    : `→ ${s.years.toFixed(1)}年経過、全${s.total}惑星が生存中`;
  const changes = changeSummary();
  const recipe = changes.length ? `\n🛠 変更: ${changes.slice(0, 4).join('、')}` : '';
  return `${title}\n${outcome}\n${result}${recipe}\n\n#もしも宇宙ラボ #宇宙シミュレーション\n${APP_URL}`;
}

// ---- シェアメニュー ----
const shareMenu = $('share-menu');
function openShareMenu() {
  if (mode !== 'solar') setMode('solar');
  $('share-preview').textContent = buildShareText();
  shareMenu.classList.remove('hidden');
}
function closeShareMenu() { shareMenu.classList.add('hidden'); }
$('share-menu-close').addEventListener('click', closeShareMenu);
$('share-image').addEventListener('click', () => { closeShareMenu(); shareImage(); });
$('share-video').addEventListener('click', () => { closeShareMenu(); recordClip(); });
$('share-x').addEventListener('click', () => {
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(buildShareText()), '_blank');
});
$('share-line').addEventListener('click', () => {
  window.open('https://line.me/R/msg/text/?' + encodeURIComponent(buildShareText()), '_blank');
});
$('share-copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(buildShareText());
    toast('🔗 シェア用のテキストをコピーしました');
  } catch {
    toast('コピーできませんでした');
  }
  closeShareMenu();
});

// ---- 画像カード ----
async function shareImage() {
  const blob = await buildShareCardBlob();
  const file = new File([blob], 'moshimo-space-lab.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'もしも宇宙ラボ', text: buildShareText() });
    } catch { /* キャンセル */ }
  } else {
    downloadBlob(blob, 'moshimo-space-lab.png');
    toast('📸 結果カードを画像として保存しました');
  }
}

async function buildShareCardBlob() {
  // 最新フレームを描き直してからキャプチャする
  renderer.render(solar.scene, solarCam);

  const size = 1080;
  const card = document.createElement('canvas');
  card.width = size;
  card.height = size;
  const ctx = card.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  const src = renderer.domElement;
  const s = Math.max(size / src.width, size / src.height);
  ctx.drawImage(src, (size - src.width * s) / 2, (size - src.height * s) / 2, src.width * s, src.height * s);

  let g = ctx.createLinearGradient(0, 0, 0, 230);
  g.addColorStop(0, 'rgba(0,0,8,0.88)');
  g.addColorStop(1, 'rgba(0,0,8,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, 230);
  g = ctx.createLinearGradient(0, size - 460, 0, size);
  g.addColorStop(0, 'rgba(0,0,8,0)');
  g.addColorStop(1, 'rgba(0,0,8,0.92)');
  ctx.fillStyle = g;
  ctx.fillRect(0, size - 460, size, 460);

  ctx.fillStyle = '#ffe3b8';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText('🧪 もしも宇宙ラボ', 40, 82);
  ctx.fillStyle = '#cfe1ff';
  ctx.font = '32px sans-serif';
  ctx.fillText(activeScenario ? `${activeScenario.emoji} ${activeScenario.title}` : '自由実験モード', 40, 142);

  // 下段テキスト: スコア → 経過時間 → 変更点(あれば) or 直近イベント → URL
  let y = size - 410;
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 40px sans-serif';
  ctx.fillText(scoreLine(), 40, y);
  y += 54;

  ctx.fillStyle = '#ffe9c0';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(formatSolarTime(solar.time), 40, y);
  y += 50;

  const changes = changeSummary();
  if (changes.length) {
    // 「何をいじったか」= 他の人がマネできるレシピ
    ctx.fillStyle = '#9fe0ff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('🛠 変更した点', 40, y);
    y += 40;
    ctx.fillStyle = '#dce8ff';
    ctx.font = '27px sans-serif';
    for (const c of changes.slice(0, 5)) {
      ctx.fillText('・' + c, 40, y);
      y += 36;
    }
  } else {
    ctx.fillStyle = '#dce8ff';
    ctx.font = '30px sans-serif';
    const recent = eventLog.filter((e) => !e.msg.startsWith('🧪')).slice(-3);
    recent.forEach((e) => { ctx.fillText(`${e.time} ${e.msg}`, 40, y); y += 42; });
  }

  ctx.fillStyle = '#8fa5cc';
  ctx.font = '26px sans-serif';
  ctx.fillText('#もしも宇宙ラボ　' + APP_URL, 40, size - 26);

  return new Promise((res) => card.toBlob(res, 'image/png'));
}

function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ---- 動画(崩壊クリップ)書き出し ----
const VIDEO_TYPES = [
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm;codecs=vp8', 'webm'],
  ['video/webm', 'webm'],
  ['video/mp4', 'mp4'],
];
function pickVideoType() {
  if (!window.MediaRecorder) return null;
  for (const [mime, ext] of VIDEO_TYPES) {
    try { if (MediaRecorder.isTypeSupported(mime)) return { mime, ext }; } catch { /* ignore */ }
  }
  return null;
}

const recIndicator = $('rec-indicator');
let recorder = null;
const REC_SECONDS = 6;

// キャンバスの映像を数秒録画して、崩壊の「動き」をそのままシェアする。
// (静止画より圧倒的に伝わる = バズりの本命)
function recordClip() {
  if (recorder) { recorder.stop(); return; } // 撮影中にもう一度押したら早めに停止
  const canStream = typeof renderer.domElement.captureStream === 'function';
  const vtype = pickVideoType();
  if (!canStream || !vtype) {
    toast('このブラウザは動画書き出しに未対応です。📸 画像でシェアしてください');
    return;
  }
  if (mode !== 'solar') setMode('solar');
  solarPlaying = true;
  updatePlayBtn();

  const stream = renderer.domElement.captureStream(30);
  const chunks = [];
  try {
    recorder = new MediaRecorder(stream, { mimeType: vtype.mime, videoBitsPerSecond: 8_000_000 });
  } catch {
    recorder = null;
    toast('動画の初期化に失敗しました。📸 画像でシェアしてください');
    return;
  }
  recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = async () => {
    recorder = null;
    recIndicator.classList.add('hidden');
    const blob = new Blob(chunks, { type: vtype.mime });
    const file = new File([blob], `moshimo-space-lab.${vtype.ext}`, { type: vtype.mime });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'もしも宇宙ラボ', text: buildShareText() });
      } catch { /* キャンセル */ }
    } else {
      downloadBlob(blob, `moshimo-space-lab.${vtype.ext}`);
      toast('🎬 崩壊の動画を保存しました');
    }
  };

  recorder.start();
  let remain = REC_SECONDS;
  recIndicator.textContent = `⏺ REC ${remain}`;
  recIndicator.classList.remove('hidden');
  toast('🎬 これから6秒間を録画中…崩壊の瞬間を撮ろう!(もう一度シェアで停止)');
  const iv = setInterval(() => {
    remain--;
    recIndicator.textContent = remain > 0 ? `⏺ REC ${remain}` : '⏺ 保存中…';
    if (remain <= 0) { clearInterval(iv); if (recorder) recorder.stop(); }
  }, 1000);
}

// ---------- 時間表示 ----------
function formatSolarTime(years) {
  const d = new Date(BASE_DATE.getTime() + years * 365.25 * 24 * 3600 * 1000);
  const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  return `${dateStr} (+${years.toFixed(2)}年)`;
}

function formatGalaxyTime(myr) {
  if (Math.abs(myr) < 1) return '現在の銀河系';
  const abs = Math.abs(myr);
  const label = abs >= 100
    ? `${(abs / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}億年`
    : `${Math.round(abs)}百万年`;
  return myr > 0 ? `${label}後の銀河系` : `${label}前の銀河系`;
}

function updateTimeDisplay() {
  if (mode === 'solar') {
    timeDisplay.textContent = formatSolarTime(solar.time);
    zoomBtn.classList.add('hidden');
  } else if (mode === 'galaxy') {
    timeDisplay.textContent = formatGalaxyTime(galaxyTime);
    zoomBtn.classList.add('hidden');
  } else if (mode === 'universe') {
    const t = sliderToGyr(universeS);
    timeDisplay.textContent = formatUniverseTime(t);
    const epoch = epochInfo(t);
    epochDisplay.innerHTML = `<b>${epoch.title}</b> ${epoch.desc}`;
    // 原子が生まれる前後の時代(〜200万年)だけミクロの世界にズームできる
    const canZoom = t > 0 && t < 0.002;
    zoomBtn.classList.toggle('hidden', !canZoom);
    zoomBtn.textContent = '🔬 ミクロの世界を見る(原子ができるまで)';
  } else {
    const t = atomsSliderToYears(atomsS);
    timeDisplay.textContent = formatAtomTime(t);
    const epoch = atomEpochInfo(t);
    epochDisplay.innerHTML = `<b>${epoch.title}</b> ${epoch.desc}`
      + '<br>🔴陽子 ⚪中性子 🔵電子 🟡光';
    zoomBtn.classList.remove('hidden');
    zoomBtn.textContent = '🔭 宇宙全体に戻る';
  }
}

// ---------- モード切替 ----------
function isPlaying() {
  if (mode === 'solar') return solarPlaying;
  if (mode === 'galaxy') return galaxyPlaying;
  if (mode === 'universe') return universePlaying;
  return atomsPlaying;
}

function updatePlayBtn() {
  const p = isPlaying();
  playBtn.innerHTML = p ? t('time.play') : t('time.pause');
  playBtn.classList.toggle('playing', p);
}

function setMode(next) {
  mode = next;
  const isSolar = mode === 'solar';
  const isGalaxy = mode === 'galaxy';
  const isUniverse = mode === 'universe';
  const isAtoms = mode === 'atoms';
  $('back-to-lab').classList.toggle('hidden', isSolar);
  observeMenu.classList.add('hidden');
  solarControls.enabled = isSolar;
  galaxyControls.enabled = isGalaxy;
  universeControls.enabled = isUniverse;
  atomsControls.enabled = isAtoms;
  // UIの出し分け
  panelToggle.classList.toggle('hidden', !isSolar);
  speedSelect.classList.toggle('hidden', !isSolar);
  resetBtn.classList.toggle('hidden', !isSolar);
  clearTrailsBtn.classList.toggle('hidden', !isSolar);
  $('share-btn').classList.toggle('hidden', !isSolar);
  scenarioBanner.classList.toggle('hidden', !(isSolar && activeScenario));
  galaxySlider.classList.toggle('hidden', !isGalaxy);
  galaxySpeedSelect.classList.toggle('hidden', isSolar);
  nowBtn.classList.toggle('hidden', !isGalaxy && !isUniverse);
  universeSlider.classList.toggle('hidden', !isUniverse);
  atomsSlider.classList.toggle('hidden', !isAtoms);
  epochDisplay.classList.toggle('hidden', !isUniverse && !isAtoms);
  if (!isSolar) {
    planetPanel.classList.add('hidden');
    labPanel.classList.add('hidden');
  }
  updatePlayBtn();
  updateTimeDisplay();
}

// ---------- ナビゲーション(観察モード・ウェルカム) ----------
const observeMenu = $('observe-menu');

// セッション中はじめて入るモードにだけ、役割の説明を出す
const introduced = new Set();
function introToast(key, msg) {
  if (introduced.has(key)) return;
  introduced.add(key);
  toast(msg);
}

$('back-to-lab').addEventListener('click', () => setMode('solar'));

$('observe-toggle').addEventListener('click', () => {
  observeMenu.classList.toggle('hidden');
  labPanel.classList.add('hidden');
});
$('observe-close').addEventListener('click', () => observeMenu.classList.add('hidden'));

$('go-galaxy').addEventListener('click', () => {
  setMode('galaxy');
  introToast('galaxy', '🌌 実験していた太陽系は、この銀河の片隅(中心から約2.6万光年)にあります');
});

$('go-universe').addEventListener('click', () => {
  setMode('universe');
  introToast('universe', '🌠 宇宙138億年の歴史。▶ 再生 でビッグバンから始まります');
});

// 宇宙の歴史 ⇄ 原子の誕生 を同じ時間軸のままズームで行き来する
const zoomBtn = $('zoom-btn');
zoomBtn.addEventListener('click', () => {
  if (mode === 'universe') {
    const years = Math.max(sliderToGyr(universeS) * 1e9, 3e-8); // 1秒未満は1秒に丸める
    atomsS = THREE.MathUtils.clamp(
      (Math.log10(years) - ATOM_LOG_MIN) / (ATOM_LOG_MAX - ATOM_LOG_MIN), 0, 1);
    atomsSlider.value = atomsS;
    universePlaying = false;
    setMode('atoms');
    introToast('atoms', '🔬 同じ時代のミクロの世界。▶ 再生 で原子ができるまでを見られます');
  } else if (mode === 'atoms') {
    const gyr = Math.min(atomsSliderToYears(atomsS) / 1e9, END_GYR);
    universeS = gyrToSlider(gyr);
    universeSlider.value = universeS;
    universe.setTime(gyr);
    atomsPlaying = false;
    setMode('universe');
  }
});

// ---------- ウェルカム画面 ----------
const welcomeOverlay = $('welcome-overlay');
if (!localStorage.getItem('mslab-welcome-v1')) {
  welcomeOverlay.classList.remove('hidden');
}
function dismissWelcome(openLab) {
  localStorage.setItem('mslab-welcome-v1', '1');
  welcomeOverlay.classList.add('hidden');
  if (openLab) {
    if (mode !== 'solar') setMode('solar');
    labPanel.classList.remove('hidden');
  }
}
$('welcome-start').addEventListener('click', () => dismissWelcome(true));
$('welcome-free').addEventListener('click', () => dismissWelcome(false));
$('help-btn').addEventListener('click', () => welcomeOverlay.classList.remove('hidden'));

// ---------- 再生コントロール ----------
playBtn.addEventListener('click', () => {
  if (mode === 'solar') solarPlaying = !solarPlaying;
  else if (mode === 'galaxy') galaxyPlaying = !galaxyPlaying;
  else if (mode === 'universe') {
    // 終端で再生したら最初(ビッグバン)から
    if (!universePlaying && universeS >= 0.999) universeS = 0;
    universePlaying = !universePlaying;
  } else {
    if (!atomsPlaying && atomsS >= 0.999) atomsS = 0;
    atomsPlaying = !atomsPlaying;
  }
  updatePlayBtn();
});

resetBtn.addEventListener('click', () => {
  endScenario();
  clearLog();
  clearEdits();
  solar.reset();
  followKey = null;
  updateFollowBtn();
  updateTimeDisplay();
  refreshPanel();
  toast('↺ 最初の状態に戻しました');
});

clearTrailsBtn.addEventListener('click', () => {
  solar.clearAllTrails();
});

galaxySlider.addEventListener('input', () => {
  galaxyTime = parseFloat(galaxySlider.value);
  galaxy.setTime(galaxyTime);
  updateTimeDisplay();
});

nowBtn.addEventListener('click', () => {
  if (mode === 'galaxy') {
    galaxyTime = 0;
    galaxySlider.value = 0;
    galaxy.setTime(0);
  } else if (mode === 'universe') {
    universeS = gyrToSlider(NOW_GYR);
    universeSlider.value = universeS;
    universe.setTime(NOW_GYR);
  }
  updateTimeDisplay();
});

universeSlider.addEventListener('input', () => {
  universeS = parseFloat(universeSlider.value);
  universe.setTime(sliderToGyr(universeS));
  updateTimeDisplay();
});

atomsSlider.addEventListener('input', () => {
  atomsS = parseFloat(atomsSlider.value);
  updateTimeDisplay();
});

// ---------- 天体パネル ----------
panelToggle.addEventListener('click', () => {
  const willOpen = planetPanel.classList.contains('hidden');
  planetPanel.classList.toggle('hidden');
  // パネルを開くときはシミュレーションを一時停止して、落ち着いて設定できるように
  if (willOpen && mode === 'solar') {
    solarPlaying = false;
    updatePlayBtn();
  }
});
$('panel-close').addEventListener('click', () => planetPanel.classList.add('hidden'));

function formatEarthMass(solarMass) {
  const em = solarMass / EARTH_MASS;
  if (em >= 10000) return `地球の約${Math.round(em / 1000) * 1000}倍`;
  if (em >= 10) return `地球の約${Math.round(em)}倍`;
  if (em >= 0.95 && em < 1.05) return '地球と同じ';
  return `地球の約${em.toPrecision(2)}倍`;
}

function refreshInfo() {
  const b = solar.getBody(bodySelect.value);
  const sun = solar.bodies[0];
  const lines = [`<b>${b.name}</b>`];
  if (!b.alive) {
    lines.push('💨 いまは存在しません(リセットで復活)');
  } else {
    if (b.escaped) lines.push('🚀 太陽系のかなたへ…');
    if (b.key !== 'sun') {
      const r = b.pos.distanceTo(sun.pos);
      const v = b.vel.clone().sub(sun.vel).length() * 4.74; // AU/年 → km/s
      lines.push(`太陽からの距離: ${r.toFixed(2)} AU`);
      lines.push(`速度: ${v.toFixed(1)} km/s`);
    }
    const radiusKm = b.radiusKm * b.sizeScale;
    lines.push(`半径: ${Math.round(radiusKm).toLocaleString()} km (地球の${(radiusKm / 6371).toPrecision(3)}倍)`);
    lines.push(b.key === 'sun'
      ? `質量: 太陽の${solar.effMass(b).toPrecision(3)}倍`
      : `質量: ${formatEarthMass(solar.effMass(b))}`);
  }
  bodyInfo.innerHTML = lines.join('<br>');
}

function refreshPanel() {
  rebuildBodySelect(); // 追加・リセット後も天体リストを常に同期
  const b = solar.getBody(bodySelect.value);
  sizeSlider.value = Math.log10(b.sizeScale);
  massSlider.value = Math.log10(b.massScale);
  sizeValue.textContent = `×${b.sizeScale.toFixed(2)}`;
  massValue.textContent = `×${b.massScale.toFixed(2)}`;
  exaggValue.textContent = `×${Math.round(solar.exaggeration)}`;
  exaggSlider.value = Math.log10(solar.exaggeration);
  const isSun = b.key === 'sun';
  const planetEditable = !isSun && b.alive;
  distField.classList.toggle('hidden', !planetEditable);
  circularizeBtn.classList.toggle('hidden', !planetEditable);
  swapField.classList.toggle('hidden', !b.alive);
  deleteBtn.classList.toggle('hidden', !b.alive);
  if (planetEditable) {
    const r = b.pos.distanceTo(solar.bodies[0].pos);
    distSlider.value = Math.log10(Math.max(r, 0.05));
    distValue.textContent = `${r.toFixed(2)} AU`;
  }
  if (b.alive) {
    // 入れ替え相手のセレクトを作り直す(自分と消滅した惑星は除く。太陽も選べる)
    const prev = swapSelect.value;
    swapSelect.innerHTML = '';
    for (const other of solar.bodies) {
      if (other.key === b.key || !other.alive) continue;
      const opt = document.createElement('option');
      opt.value = other.key;
      opt.textContent = other.name;
      swapSelect.appendChild(opt);
    }
    if ([...swapSelect.options].some((o) => o.value === prev)) swapSelect.value = prev;
  }
  updateFollowBtn();
  refreshInfo();
}

bodySelect.addEventListener('change', refreshPanel);

sizeSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const scale = Math.pow(10, parseFloat(sizeSlider.value));
  solar.setSizeScale(key, scale);
  sizeValue.textContent = `×${scale.toFixed(2)}`;
  if (Math.abs(scale - 1) < 0.01) dropEdit(`size:${key}`);
  else recordEdit(`size:${key}`, `${solar.getBody(key).name}の大きさ ${fmtScale(scale)}`);
  refreshInfo();
});

massSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const scale = Math.pow(10, parseFloat(massSlider.value));
  solar.setMassScale(key, scale);
  massValue.textContent = `×${scale.toFixed(2)}`;
  if (Math.abs(scale - 1) < 0.01) dropEdit(`mass:${key}`);
  else recordEdit(`mass:${key}`, `${solar.getBody(key).name}の重さ ${fmtScale(scale)}`);
  refreshInfo();
});

distSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const au = Math.pow(10, parseFloat(distSlider.value));
  solar.setDistanceAU(key, au);
  distValue.textContent = `${au.toFixed(2)} AU`;
  recordEdit(`dist:${key}`, `${solar.getBody(key).name}を ${au.toFixed(2)}AU へ`);
  refreshInfo();
});

exaggSlider.addEventListener('input', () => {
  const e = Math.pow(10, parseFloat(exaggSlider.value));
  solar.setExaggeration(e);
  exaggValue.textContent = `×${Math.round(e)}`;
});

circularizeBtn.addEventListener('click', () => {
  const b = solar.getBody(bodySelect.value);
  solar.circularize(b.key);
  recordEdit(`circ:${b.key}`, `${b.name}を円軌道に`);
  toast(`⭕ ${b.name}を円軌道に乗せました`);
  refreshPanel();
});

swapBtn.addEventListener('click', () => {
  const a = solar.getBody(bodySelect.value);
  const b = solar.getBody(swapSelect.value);
  if (!b) return;
  solar.swapBodies(a.key, b.key);
  recordEdit(`swap:${[a.key, b.key].sort().join('-')}`, `${a.name}⇄${b.name} 入れ替え`);
  toast(`🔄 ${a.name}と${b.name}の場所を入れ替えました`);
  refreshPanel();
});

deleteBtn.addEventListener('click', () => {
  const b = solar.getBody(bodySelect.value);
  if (!b.alive) return;
  solar.removeBody(b.key);
  recordEdit(`del:${b.key}`, `${b.name}を消した`);
  toast(`🗑 ${b.name}を消しました${b.key === 'sun' ? '(重力が消えて惑星が飛んでいきます)' : ''}`);
  refreshPanel();
});

// 天体を追加(惑星・恒星を複数にできる)
const PLANET_COLORS = [0x6ab0ff, 0xff9d5c, 0x8de08d, 0xc79bff, 0xff7ab0, 0x57d6c4, 0xffd76a];
let addPlanetCount = 0;
let addStarCount = 0;

function afterAddBody(b, label) {
  recordEdit(`add:${b.key}`, label);
  rebuildBodySelect();
  bodySelect.value = b.key;
  refreshPanel();
  toast(`➕ ${b.name}を追加しました`);
}

addPlanetBtn.addEventListener('click', () => {
  addPlanetCount++;
  const name = `新惑星${addPlanetCount}`;
  const b = solar.addBody({
    name,
    mass: 3e-6 * (0.5 + Math.random() * 3),       // 地球の0.5〜3.5倍くらい
    radiusKm: 5000 + Math.random() * 8000,
    color: PLANET_COLORS[(addPlanetCount - 1) % PLANET_COLORS.length],
    distanceAU: 0.6 + Math.random() * 2.6,
    star: false,
  });
  afterAddBody(b, `${name}を追加`);
});

addStarBtn.addEventListener('click', () => {
  addStarCount++;
  const name = `太陽${String.fromCharCode(66 + (addStarCount - 1) % 25)}`; // 太陽B, C, …
  const b = solar.addBody({
    name,
    mass: 1.0,                                     // 太陽と同じ質量
    radiusKm: 696000,
    color: 0xffd75e,
    distanceAU: 4 + Math.random() * 3,
    star: true,
  });
  afterAddBody(b, `${name}(恒星)を追加`);
});

// ---------- 追従カメラ ----------
function updateFollowBtn() {
  const active = followKey !== null && followKey === bodySelect.value;
  followBtn.innerHTML = active ? t('panel.followOn') : t('panel.follow');
  followBtn.classList.toggle('active', active);
}

followBtn.addEventListener('click', () => {
  const key = bodySelect.value;
  if (followKey === key) {
    followKey = null;
  } else {
    followKey = key;
    const b = solar.getBody(key);
    if (b.alive) {
      // カメラを天体の近くへ寄せる
      const target = b.pos.clone().multiplyScalar(POS_SCALE);
      const dir = solarCam.position.clone().sub(solarControls.target).normalize();
      const dist = Math.min(
        Math.max(solar.displayRadius(b) * 14, 0.15),
        solarCam.position.distanceTo(target)
      );
      solarControls.target.copy(target);
      solarCam.position.copy(target).addScaledVector(dir, dist);
    }
  }
  updateFollowBtn();
});

function applyFollow() {
  if (!followKey) return;
  const b = solar.getBody(followKey);
  if (!b.alive) { followKey = null; updateFollowBtn(); return; }
  const target = b.pos.clone().multiplyScalar(POS_SCALE);
  const delta = target.clone().sub(solarControls.target);
  solarControls.target.copy(target);
  solarCam.position.add(delta);
}

// ---------- タップ選択 & ドラッグ移動 (太陽系モードのみ) ----------
const raycaster = new THREE.Raycaster();
const pointerNdc = new THREE.Vector2();
let pointerState = null; // { id, key, downX, downY, dragging, plane }

canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'solar' || pointerState) return;
  // アトラクト再生中の最初のタップは「解除」だけに使う(天体を拾わない)。
  // 実際の解除は document の pointerdown が行う。
  if (attractMode) return;
  // メイン画面(3Dビュー)を触ったら天体パネルを閉じる(✕ボタン以外でも閉じられるように)。
  // この後タップで天体を選んだ場合は pointerup で開き直される。
  planetPanel.classList.add('hidden');
  const hit = solar.pickBody(solarCam, e.clientX, e.clientY, innerWidth, innerHeight);
  if (!hit) return;
  pointerState = { id: e.pointerId, key: hit.key, downX: e.clientX, downY: e.clientY, dragging: false, plane: null };
  solarControls.enabled = false; // このジェスチャー中は視点操作を止める
});

canvas.addEventListener('pointermove', (e) => {
  if (!pointerState || e.pointerId !== pointerState.id) return;
  const moved = Math.hypot(e.clientX - pointerState.downX, e.clientY - pointerState.downY);
  if (!pointerState.dragging && moved > 8) {
    pointerState.dragging = true; // ドラッグ開始(シミュレーションは一時停止)
    const b = solar.getBody(pointerState.key);
    pointerState.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -b.pos.y * POS_SCALE);
  }
  if (pointerState.dragging) {
    pointerNdc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    raycaster.setFromCamera(pointerNdc, solarCam);
    const out = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(pointerState.plane, out)) {
      solar.setDisplayPosition(pointerState.key, out);
    }
  }
});

function endPointer(e, cancelled) {
  if (!pointerState || e.pointerId !== pointerState.id) return;
  if (pointerState.dragging) {
    solar.clearTrail(pointerState.key); // 軌跡を引き直す
    recordEdit(`drag:${pointerState.key}`, `${solar.getBody(pointerState.key).name}を手で移動`);
    refreshPanel();
  } else if (!cancelled) {
    // タップ → 天体を選択してパネルを開く
    bodySelect.value = pointerState.key;
    refreshPanel();
    planetPanel.classList.remove('hidden');
  }
  pointerState = null;
  solarControls.enabled = mode === 'solar';
}
canvas.addEventListener('pointerup', (e) => endPointer(e, false));
canvas.addEventListener('pointercancel', (e) => endPointer(e, true));

// ---------- アトラクトモード ----------
// 初回ロード時、何も操作しないあいだは派手な「もしも」を自動再生し続ける。
// 流入した人が最初の数秒で「崩壊」を目にして、自分でも触りたくなる導線。
// 画面に触れる/何か操作した時点で解除され、まっさらな太陽系から遊び始められる。
const ATTRACT_IDS = ['sun-vanish', 'jupiter-star', 'mars-heavy', 'all-fall', 'jupiter-monster', 'sun-mercury-swap'];
const ATTRACT_PERIOD = 13; // 秒ごとに次のシナリオへ切り替え
let attractMode = false;
let attractTimer = 0;
let attractIdx = -1;

const attractHint = $('attract-hint');

function startAttract() {
  attractMode = true;
  attractHint.classList.remove('hidden');
  nextAttract();
}

function nextAttract() {
  let i;
  do { i = Math.floor(Math.random() * ATTRACT_IDS.length); }
  while (i === attractIdx && ATTRACT_IDS.length > 1);
  attractIdx = i;
  const sc = SCENARIOS.find((s) => s.id === ATTRACT_IDS[i]);
  solar.reset();
  clearLog();
  if (sc) {
    sc.setup(solar);
    speedSelect.value = sc.speed;
  }
  solarPlaying = true;
  attractTimer = 0;
}

function stopAttract() {
  if (!attractMode) return;
  attractMode = false;
  attractHint.classList.add('hidden');
  endScenario();
  solar.reset();
  clearLog();
  clearEdits();
  followKey = null;
  updateFollowBtn();
  refreshPanel();
  updateTimeDisplay();
}

// どこかを操作したら自動再生を終了(バブリング = 各要素の処理より前に確実に拾う)
document.addEventListener('pointerdown', () => { if (attractMode) stopAttract(); });

// ---------- メインループ ----------
const clock = new THREE.Clock();
let infoTick = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (mode === 'solar') {
    if (attractMode) {
      attractTimer += dt;
      if (attractTimer >= ATTRACT_PERIOD) nextAttract();
    }
    const dragging = pointerState !== null && pointerState.dragging;
    if (solarPlaying && !dragging) {
      solar.advance(parseFloat(speedSelect.value) * dt);
      updateTimeDisplay();
    }
    solar.syncVisuals();
    applyFollow();
    solarControls.update();
    renderer.render(solar.scene, solarCam);

    // パネルの数値を定期的に更新
    if (!planetPanel.classList.contains('hidden') && ++infoTick % 15 === 0) {
      refreshInfo();
    }
  } else if (mode === 'galaxy') {
    if (galaxyPlaying) {
      galaxyTime += GALAXY_RATE * parseFloat(galaxySpeedSelect.value) * dt;
      if (galaxyTime > GALAXY_RANGE) galaxyTime = -GALAXY_RANGE; // 端まで来たらループ
      galaxySlider.value = galaxyTime;
      galaxy.setTime(galaxyTime);
      updateTimeDisplay();
    }
    galaxyControls.update();
    renderer.render(galaxyScene, galaxyCam);
  } else if (mode === 'universe') {
    if (universePlaying) {
      // スライダー空間を一定速度で進む(全史をちょうどいいテンポで再生)
      universeS += 0.022 * parseFloat(galaxySpeedSelect.value) * dt;
      if (universeS >= 1) { universeS = 1; universePlaying = false; updatePlayBtn(); }
      universeSlider.value = universeS;
      universe.setTime(sliderToGyr(universeS));
      updateTimeDisplay();
    }
    universeControls.update();
    renderer.render(universe.scene, universeCam);
  } else {
    if (atomsPlaying) {
      atomsS += 0.03 * parseFloat(galaxySpeedSelect.value) * dt;
      if (atomsS >= 1) { atomsS = 1; atomsPlaying = false; updatePlayBtn(); }
      atomsSlider.value = atomsS;
      updateTimeDisplay();
    }
    atoms.update(clock.elapsedTime, atomsSliderToYears(atomsS));
    atomsControls.update();
    renderer.render(atoms.scene, atomsCam);
  }
}

window.addEventListener('resize', () => {
  updateTopOffset();
  renderer.setSize(window.innerWidth, window.innerHeight);
  for (const cam of [solarCam, galaxyCam, universeCam, atomsCam]) {
    cam.aspect = window.innerWidth / window.innerHeight;
    cam.updateProjectionMatrix();
  }
});

// ---------- 言語切り替え ----------
const langSelect = $('lang-select');
for (const [code, label] of LANGS) {
  const opt = document.createElement('option');
  opt.value = code;
  opt.textContent = label;
  langSelect.appendChild(opt);
}
langSelect.value = getLang();
document.documentElement.lang = getLang();

// ヘッダーの高さ(言語やふりがなで段数・高さが変わる)に合わせて、
// 上部に貼り付くパネル類の位置を下げる。これで「天体の設定」等との重なりを防ぐ。
function updateTopOffset() {
  const h = document.getElementById('header').offsetHeight || 52;
  document.documentElement.style.setProperty('--top-offset', `${h + 6}px`);
}

function applyAllI18n() {
  applyStaticI18n();
  updatePlayBtn();
  updateFollowBtn();
  renderLog();
  renderScenarioList(); // 実験カードのふりがな/言語を反映
  if (activeScenario) $('scenario-banner-title').innerHTML = `${activeScenario.emoji} ${scTitle(activeScenario)}`;
  if (!shareMenu.classList.contains('hidden')) {
    $('share-preview').textContent = buildShareText();
  }
  updateTopOffset(); // ヘッダー高さ(ふりがな/言語で変わる)にパネル位置を追従
}

langSelect.addEventListener('change', () => {
  setLang(langSelect.value);
  applyAllI18n();
});

applyAllI18n();
refreshPanel();
setMode('solar');
updateTimeDisplay();
startAttract();
animate();
