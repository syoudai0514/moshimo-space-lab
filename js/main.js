import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createGalaxy, createBackgroundStars } from './galaxy.js?v=2';
import { SolarSystem, POS_SCALE, EARTH_MASS } from './solarsystem.js?v=15';
import { createUniverse, epochInfo, formatUniverseTime, NOW_GYR, END_GYR } from './universe.js?v=3';
import { createAtoms, atomEpochInfo, formatAtomTime, ATOM_LOG_MIN, ATOM_LOG_MAX } from './atoms.js?v=3';
import { SCENARIOS } from './scenarios.js?v=4';
import { LANGS, getLang, setLang, t, tPlain, applyStaticI18n, fmtYears, furi, getFurigana, setFurigana, SC_FURIGANA } from './i18n.js?v=12';
import { SCENARIO_I18N, OBSERVE_I18N } from './i18n-data.js?v=2';
import { bgmEnabled, startBGM, toggleBGM, isPlaying as bgmIsPlaying, playSfx, unlockAudio } from './audio.js?v=7';

const SI = (sc) => SCENARIO_I18N[getLang()]?.[sc.id]; // 現在言語の実験翻訳(無ければ undefined)
// 実験の表示用タイトル・問い。日本語のときは子供向けにふりがな付き。
const scTitle = (sc) => (getLang() === 'ja' ? furi(SC_FURIGANA[sc.id]?.title ?? sc.title) : (SI(sc)?.title ?? sc.title));
const scQuestion = (sc) => (getLang() === 'ja' ? furi(SC_FURIGANA[sc.id]?.q ?? sc.question) : (SI(sc)?.q ?? sc.question));
const scWatch = (sc) => (getLang() === 'ja' ? sc.watch : (SI(sc)?.watch ?? sc.watch));
const scExplain = (sc) => (getLang() === 'ja' ? sc.explain : (SI(sc)?.explain ?? sc.explain));
// 共有用(プレーン): タイトル・キャッチコピーを選択言語で
const scShareTitle = (sc) => (getLang() === 'ja' ? sc.title : (SI(sc)?.title ?? sc.title));
const scShareLine = (sc) => (getLang() === 'ja' ? sc.shareLine : (SI(sc)?.share ?? sc.shareLine));
// 天体名(追加天体は生成時の名前、元の9天体は翻訳)
const bodyName = (b) => (b && b.extra ? b.name : t(`body.${b.key}`));
// "{x}" を置換する簡易フォーマッタ
const fmt = (str, obj) => str.replace(/\{(\w+)\}/g, (_, k) => (obj[k] ?? ''));

const APP_URL = 'https://syoudai0514.github.io/moshimo-space-lab/';

// 物理定数(脱出速度の表示などに使う)。solarsystem.js と同じ単位系: AU・年・太陽質量。
const GRAV = 4 * Math.PI * Math.PI;   // 万有引力定数 G
const KMS_PER_AUYR = 4.74;            // AU/年 → km/s
const DEFAULT_SPEED = '0.0833';       // 既定の再生速度(1ヶ月/秒)

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
const speedField = $('speed-field');
const orbspeedSlider = $('orbspeed-slider');
const orbspeedValue = $('orbspeed-value');
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
    opt.textContent = bodyName(b);
    bodySelect.appendChild(opt);
  }
  if ([...bodySelect.options].some((o) => o.value === prev)) bodySelect.value = prev;
}

// 3Dラベルを現在の言語に更新
function relabelBodies() {
  for (const b of solar.bodies) solar.setBodyLabel(b.key, bodyName(b));
}
rebuildBodySelect();
bodySelect.value = 'earth';

// ---------- トースト通知 + 履歴 ----------
// 画面には「最新の1件だけ」を出して動きを隠さない。過去の通知は 🔔 ベルに溜め、
// タップで履歴を開いて後から読める。
const toasts = $('toasts');
const notifBell = $('notif-bell');
const notifCount = $('notif-count');
const notifPanel = $('notif-panel');
const notifListEl = $('notif-list');
const notifLog = []; // { msg, explain }  新しいものが末尾
const NOTIF_MAX = 40;
let toastTimers = [];

// ev は文字列、または { type, msg }。type に解説がある通知はタップで解説を開ける
function toast(ev) {
  const isObj = typeof ev === 'object';
  const msg = isObj ? ev.msg : ev;
  const type = isObj ? ev.type : null;
  const explain = type ? { title: t(`event.${type}.title`), body: t(`event.${type}.body`) } : null;

  notifLog.push({ msg, explain });
  if (notifLog.length > NOTIF_MAX) notifLog.shift();

  showLatestToast(msg, explain);

  if (notifBell.classList.contains('hidden')) {
    notifBell.classList.remove('hidden'); // 初出現でヘッダーの段数が変わりうる
    updateTopOffset();
  }
  notifCount.textContent = notifLog.length;
  if (!notifPanel.classList.contains('hidden')) renderNotifList();
}

// 最新の1件だけを上部に表示(前のトーストは消す)
function showLatestToast(msg, explain) {
  for (const tmr of toastTimers) clearTimeout(tmr);
  toastTimers = [];
  toasts.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = explain ? `${msg} 💡` : msg;
  if (explain) {
    div.classList.add('has-explain');
    div.addEventListener('click', () => openModal(explain.title, explain.body + disclaimerHtml()));
  }
  toasts.appendChild(div);
  const life = explain ? 7000 : 3600;
  toastTimers.push(setTimeout(() => div.classList.add('fade'), life));
  toastTimers.push(setTimeout(() => div.remove(), life + 800));
}

function renderNotifList() {
  if (notifLog.length === 0) {
    notifListEl.innerHTML = `<p class="hint">${t('notif.empty')}</p>`;
    return;
  }
  notifListEl.innerHTML = '';
  for (let i = notifLog.length - 1; i >= 0; i--) { // 新しい順
    const n = notifLog[i];
    const row = document.createElement('div');
    row.className = 'notif-row' + (n.explain ? ' has-explain' : '');
    row.textContent = n.explain ? `${n.msg} 💡` : n.msg;
    if (n.explain) {
      row.addEventListener('click', () => openModal(n.explain.title, n.explain.body + disclaimerHtml()));
    }
    notifListEl.appendChild(row);
  }
}

function clearNotifs() {
  notifLog.length = 0;
  toasts.innerHTML = '';
  const wasShown = !notifBell.classList.contains('hidden');
  notifBell.classList.add('hidden');
  notifPanel.classList.add('hidden');
  if (wasShown) updateTopOffset(); // ヘッダーの段数が戻りうる
}

notifBell.addEventListener('click', () => {
  const willOpen = notifPanel.classList.contains('hidden');
  notifPanel.classList.toggle('hidden');
  if (willOpen) renderNotifList();
});
$('notif-close').addEventListener('click', () => notifPanel.classList.add('hidden'));

// ---------- 実験の記録 ----------
const eventLogEl = $('event-log');
const eventLog = []; // { time: '+1.2年', msg }
function logEvent(msg) {
  eventLog.push({ time: `+${solar.time.toFixed(1)}${t('unit.yr')}`, msg });
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
  clearNotifs(); // 通知の履歴(🔔)も一緒にリセット
}

solar.onEvent = (ev) => {
  playSfx(ev.type);              // 効果音はデモ中でも鳴らす(連発はaudio側で間引く)
  if (ev.type === 'supernova') triggerFlash(); // 大爆発はデモ中でも画面を光らせる
  if (attractMode) return;       // デモ中は通知・ログ・振動は出さない(キャプションと被らないように)
  const msg = fmt(t(`event.${ev.type}.msg`), { name: bodyName(solar.getBody(ev.key)) });
  toast({ type: ev.type, msg });
  logEvent(msg);
  if (navigator.vibrate) {
    if (ev.type === 'supernova') navigator.vibrate([60, 40, 200, 60, 120]); // 大爆発
    else if (ev.type === 'absorbed') navigator.vibrate([45, 35, 130]); // 落下 → ドスンという衝突
    else if (ev.type === 'escaped') navigator.vibrate(220);       // ひと息に飛び去る
  }
};

// ---------- 解説モーダル ----------
const modalOverlay = $('modal-overlay');
function disclaimerHtml() {
  return `<div class="disclaimer">${t('sim.disclaimer')}</div>`;
}
function openModal(title, html) {
  $('modal-title').innerHTML = title; // ふりがな(ruby)を表示できるよう innerHTML
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
  logEvent(fmt(t('toast.expStartLog'), { title: scShareTitle(sc) }));
  toast(t('toast.expStart'));
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
    `${activeScenario.emoji} ${scTitle(activeScenario)}`,
    `<div class="sc-watch">${t('modal.watch')}${scWatch(activeScenario)}</div>`
      + scExplain(activeScenario)
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
  toast(t('toast.expEnd'));
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
  return `🏆 ${tPlain('card.survivors')} ${s.alive}/${s.total}　🔥 ${s.absorbed}　🚀 ${s.escaped}`;
}

function freeOutcomeLine(s) {
  if (s.absorbed && s.escaped) return t('share.outBoth');
  if (s.absorbed) return t('share.outAbsorbed');
  if (s.escaped) return t('share.outEscaped');
  return t('share.outNone');
}

// ---- 変更点(レシピ)の記録 ----
// 他の人がマネしやすいように、ユーザーがいじった内容を覚えておく。
// 同じ天体への同じ種類の変更は最新の値で上書き(挿入順は保持)。
const editLog = new Map(); // key -> { type, params }(表示時に現在言語で整形)
function recordEdit(key, type, params) { editLog.delete(key); editLog.set(key, { type, params: params || {} }); }
function dropEdit(key) { editLog.delete(key); }
function clearEdits() { editLog.clear(); }
function changeSummary() {
  return [...editLog.values()].map(({ type, params }) => {
    const p = { ...params };
    if (p.key != null) p.name = bodyName(solar.getBody(p.key) || { extra: true, name: p.key });
    if (p.key2 != null) p.name2 = bodyName(solar.getBody(p.key2) || { extra: true, name: p.key2 });
    return fmt(t(`edit.${type}`), p);
  });
}
function fmtScale(x) { return x >= 10 ? `×${Math.round(x).toLocaleString()}` : `×${x.toFixed(2)}`; }

// シェア本文: 結果を文章化 + 変更レシピ + ハッシュタグ + URL(引用したくなる一言を狙う)
function buildShareText() {
  const s = survivalStats();
  const title = activeScenario ? `${activeScenario.emoji} ${scShareTitle(activeScenario)}` : `🪐 ${tPlain('card.free')}`;
  const outcome = activeScenario ? scShareLine(activeScenario) : freeOutcomeLine(s);
  const y = s.years.toFixed(1);
  const result = (s.absorbed || s.escaped)
    ? fmt(t('share.resultHit'), { y, a: s.absorbed, e: s.escaped, al: s.alive, t: s.total })
    : fmt(t('share.resultSafe'), { y, t: s.total });
  const changes = changeSummary();
  const sep = getLang() === 'ja' ? '、' : ' / ';
  const recipe = changes.length ? `\n${t('share.recipePrefix')}${changes.slice(0, 4).join(sep)}` : '';
  return `${title}\n${outcome}\n${result}${recipe}\n\n${t('share.hashtags')}\n${APP_URL}`;
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
    toast(t('toast.copyOk'));
  } catch {
    toast(t('toast.copyFail'));
  }
  closeShareMenu();
});

// ---- 画像カード ----
async function shareImage() {
  const blob = await buildShareCardBlob();
  const file = new File([blob], 'moshimo-space-lab.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: tPlain('app.title'), text: buildShareText() });
    } catch { /* キャンセル */ }
  } else {
    downloadBlob(blob, 'moshimo-space-lab.png');
    toast(t('toast.imgSaved'));
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
  ctx.fillText(tPlain('app.title'), 40, 82);
  ctx.fillStyle = '#cfe1ff';
  ctx.font = '32px sans-serif';
  ctx.fillText(activeScenario ? `${activeScenario.emoji} ${scShareTitle(activeScenario)}` : tPlain('card.free'), 40, 142);

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
    ctx.fillText(tPlain('card.changes'), 40, y);
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
  ctx.fillText(`${t('share.hashtags').split(' ')[0]}　${APP_URL}`, 40, size - 26);

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
    toast(t('toast.videoUnsupported'));
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
    toast(t('toast.videoInitFail'));
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
        await navigator.share({ files: [file], title: tPlain('app.title'), text: buildShareText() });
      } catch { /* キャンセル */ }
    } else {
      downloadBlob(blob, `moshimo-space-lab.${vtype.ext}`);
      toast(t('toast.videoSaved'));
    }
  };

  recorder.start();
  let remain = REC_SECONDS;
  recIndicator.textContent = `⏺ REC ${remain}`;
  recIndicator.classList.remove('hidden');
  toast(t('toast.videoRec'));
  const iv = setInterval(() => {
    remain--;
    recIndicator.textContent = remain > 0 ? `⏺ REC ${remain}` : t('rec.saving');
    if (remain <= 0) { clearInterval(iv); if (recorder) recorder.stop(); }
  }, 1000);
}

// ---------- 時間表示 ----------
function formatSolarTime(years) {
  const d = new Date(BASE_DATE.getTime() + years * 365.25 * 24 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return fmt(t('date.fmt'), {
    y: d.getFullYear(),
    m: getLang() === 'ja' ? d.getMonth() + 1 : pad(d.getMonth() + 1),
    d: getLang() === 'ja' ? d.getDate() : pad(d.getDate()),
    yr: years.toFixed(2),
  });
}

function formatGalaxyTime(myr) {
  const L = getLang();
  const O = L !== 'ja' ? OBSERVE_I18N[L] : null;
  if (Math.abs(myr) < 1) return O?.['galaxy.now'] ?? '現在の銀河系';
  const label = fmtYears(Math.abs(myr) * 1e6); // myr(百万年) → 年
  const jaTmpl = myr > 0 ? `${label}後の銀河系` : `${label}前の銀河系`;
  const tmpl = O?.[myr > 0 ? 'galaxy.after' : 'galaxy.before'] ?? jaTmpl;
  return tmpl.replace(/\{label\}/g, label);
}

// 観察モードの年代テキストを現在言語で(ja は元の日本語、他は OBSERVE_I18N)
function epochText(epoch, field) {
  const L = getLang();
  if (L === 'ja') return epoch[field];
  return OBSERVE_I18N[L]?.[`${epoch.id}.${field}`] ?? epoch[field];
}
function updateTimeDisplay() {
  if (mode === 'solar') {
    timeDisplay.textContent = formatSolarTime(solar.time);
    zoomBtn.classList.add('hidden');
  } else if (mode === 'galaxy') {
    timeDisplay.textContent = formatGalaxyTime(galaxyTime);
    zoomBtn.classList.add('hidden');
  } else if (mode === 'universe') {
    const gyr = sliderToGyr(universeS);
    timeDisplay.textContent = formatUniverseTime(gyr);
    const epoch = epochInfo(gyr);
    epochDisplay.innerHTML = `<b>${epochText(epoch, 'title')}</b> ${epochText(epoch, 'desc')}`;
    // 原子が生まれる前後の時代(〜200万年)だけミクロの世界にズームできる
    const canZoom = gyr > 0 && gyr < 0.002;
    zoomBtn.classList.toggle('hidden', !canZoom);
    zoomBtn.textContent = t('time.zoomMicro');
  } else {
    const yrs = atomsSliderToYears(atomsS);
    timeDisplay.textContent = formatAtomTime(yrs);
    const epoch = atomEpochInfo(yrs);
    epochDisplay.innerHTML = `<b>${epochText(epoch, 'title')}</b> ${epochText(epoch, 'desc')}`
      + `<br>${t('atoms.legend')}`;
    zoomBtn.classList.remove('hidden');
    zoomBtn.textContent = t('time.zoomBack');
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
  introToast('galaxy', t('intro.galaxy'));
});

$('go-universe').addEventListener('click', () => {
  setMode('universe');
  introToast('universe', t('intro.universe'));
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
    introToast('atoms', t('intro.atoms'));
  } else if (mode === 'atoms') {
    const gyr = Math.min(atomsSliderToYears(atomsS) / 1e9, END_GYR);
    universeS = gyrToSlider(gyr);
    universeSlider.value = universeS;
    universe.setTime(gyr);
    atomsPlaying = false;
    setMode('universe');
  }
});

// ---------- ウェルカム / オープニングメニュー ----------
const welcomeOverlay = $('welcome-overlay');
if (!localStorage.getItem('mslab-welcome-v1')) {
  welcomeOverlay.classList.remove('hidden'); // 初回はデモの上にメニューを重ねて表示
}
function showMenu() { welcomeOverlay.classList.remove('hidden'); }
function dismissWelcome(openLab) {
  localStorage.setItem('mslab-welcome-v1', '1');
  welcomeOverlay.classList.add('hidden');
  stopAttract();              // デモを止めて、まっさらな太陽系へ
  if (openLab) {
    if (mode !== 'solar') setMode('solar');
    labPanel.classList.remove('hidden');
  }
}
$('welcome-start').addEventListener('click', () => dismissWelcome(true));
$('welcome-free').addEventListener('click', () => dismissWelcome(false));
$('welcome-demo').addEventListener('click', () => {
  welcomeOverlay.classList.add('hidden');
  startAttract();            // デモをもう一度
});
$('help-btn').addEventListener('click', showMenu);

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

// カメラの視点(位置・注視点・追従)を初期状態に戻す
function resetSolarView() {
  followKey = null;
  solarCam.position.set(0, 30, 65);
  solarControls.target.set(0, 0, 0);
  solarControls.update();
}

resetBtn.addEventListener('click', () => {
  endScenario();
  clearLog();
  clearEdits();
  solar.reset();
  resetSolarView();             // 視点も最初の俯瞰に戻す
  speedSelect.value = DEFAULT_SPEED; // 速度も既定(1ヶ月/秒)に戻す
  updateFollowBtn();
  updateTimeDisplay();
  refreshPanel();
  toast(t('toast.reset'));
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
  if (em >= 0.95 && em < 1.05) return t('mass.earthSame');
  let n;
  if (em >= 10000) n = (Math.round(em / 1000) * 1000).toLocaleString();
  else if (em >= 10) n = Math.round(em).toLocaleString();
  else n = em.toPrecision(2);
  return fmt(t('mass.earthApprox'), { n });
}

function refreshInfo() {
  const b = solar.getBody(bodySelect.value);
  const sun = solar.bodies[0];
  const lines = [`<b>${bodyName(b)}</b>`];
  if (!b.alive) {
    lines.push(t('info.notExist'));
  } else {
    if (b.escaped) lines.push(t('info.escaped'));
    if (b.key !== 'sun') {
      const r = b.pos.distanceTo(sun.pos);
      const v = b.vel.clone().sub(sun.vel).length() * KMS_PER_AUYR; // AU/年 → km/s
      lines.push(fmt(t('info.dist'), { r: r.toFixed(2) }));
      lines.push(fmt(t('info.speed'), { v: v.toFixed(1) }));
      // 脱出速度(第二宇宙速度) v=√(2GM/r)。いまの速度がこれを超えると二度と戻らない。
      if (sun.alive && r > 1e-6) {
        const vEsc = Math.sqrt(2 * GRAV * solar.effMass(sun) / r) * KMS_PER_AUYR;
        lines.push(fmt(t('info.escapeV'), { v: vEsc.toFixed(1) }));
        if (v >= vEsc) lines.push(t('info.overEscape'));
      }
    }
    const radiusKm = b.radiusKm * b.sizeScale;
    lines.push(fmt(t('info.radius'), { km: Math.round(radiusKm).toLocaleString(), x: (radiusKm / 6371).toPrecision(3) }));
    lines.push(b.key === 'sun'
      ? fmt(t('info.massSun'), { x: solar.effMass(b).toPrecision(3) })
      : fmt(t('info.massEarth'), { v: formatEarthMass(solar.effMass(b)) }));
  }
  bodyInfo.innerHTML = lines.join('<br>');
}

function refreshPanel() {
  rebuildBodySelect(); // 追加・リセット後も天体リストを常に同期
  const b = solar.getBody(bodySelect.value);
  sizeSlider.value = Math.log10(b.sizeScale);
  massSlider.value = Math.log10(b.massScale);
  sizeValue.textContent = `×${b.sizeScale.toFixed(2)}`;
  massValue.textContent = fmtScale(b.massScale);
  exaggValue.textContent = `×${Math.round(solar.exaggeration)}`;
  exaggSlider.value = Math.log10(solar.exaggeration);
  const isSun = b.key === 'sun';
  const planetEditable = !isSun && b.alive;
  distField.classList.toggle('hidden', !planetEditable);
  speedField.classList.toggle('hidden', !planetEditable);
  circularizeBtn.classList.toggle('hidden', !planetEditable);
  swapField.classList.toggle('hidden', !b.alive);
  deleteBtn.classList.toggle('hidden', !b.alive);
  if (planetEditable) {
    const r = b.pos.distanceTo(solar.bodies[0].pos);
    distSlider.value = Math.log10(Math.max(r, 0.05));
    distValue.textContent = `${r.toFixed(2)} AU`;
    const f = THREE.MathUtils.clamp(solar.orbitalSpeedFactor(b.key), 0, parseFloat(orbspeedSlider.max));
    orbspeedSlider.value = f;
    setOrbSpeedLabel(f);
  }
  if (b.alive) {
    // 入れ替え相手のセレクトを作り直す(自分と消滅した惑星は除く。太陽も選べる)
    const prev = swapSelect.value;
    swapSelect.innerHTML = '';
    for (const other of solar.bodies) {
      if (other.key === b.key || !other.alive) continue;
      const opt = document.createElement('option');
      opt.value = other.key;
      opt.textContent = bodyName(other);
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
  else recordEdit(`size:${key}`, 'size', { key, x: fmtScale(scale) });
  refreshInfo();
});

massSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const scale = Math.pow(10, parseFloat(massSlider.value));
  solar.setMassScale(key, scale);
  massValue.textContent = fmtScale(scale);
  if (Math.abs(scale - 1) < 0.01) dropEdit(`mass:${key}`);
  else recordEdit(`mass:${key}`, 'mass', { key, x: fmtScale(scale) });
  refreshInfo();
});

distSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const au = Math.pow(10, parseFloat(distSlider.value));
  solar.setDistanceAU(key, au);
  distValue.textContent = `${au.toFixed(2)} AU`;
  recordEdit(`dist:${key}`, 'dist', { key, au: au.toFixed(2) });
  refreshInfo();
});

// 公転(横向き)の速さ: 円軌道速度の倍率。0=落下 / 1=円軌道 / √2=脱出
function orbRegime(f) {
  if (f <= 0.05) return tPlain('orbspeed.fall');
  if (f >= Math.SQRT2) return tPlain('orbspeed.escape');
  if (Math.abs(f - 1) <= 0.05) return tPlain('orbspeed.circle');
  return tPlain('orbspeed.ellipse');
}
function setOrbSpeedLabel(f) {
  orbspeedValue.textContent = `×${f.toFixed(2)} (${orbRegime(f)})`;
}
orbspeedSlider.addEventListener('input', () => {
  const key = bodySelect.value;
  const f = parseFloat(orbspeedSlider.value);
  solar.setOrbitalSpeed(key, f);
  setOrbSpeedLabel(f);
  recordEdit(`speed:${key}`, 'speed', { key, x: f.toFixed(2) });
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
  recordEdit(`circ:${b.key}`, 'circ', { key: b.key });
  toast(fmt(t('toast.circ'), { name: bodyName(b) }));
  refreshPanel();
});

swapBtn.addEventListener('click', () => {
  const a = solar.getBody(bodySelect.value);
  const b = solar.getBody(swapSelect.value);
  if (!b) return;
  solar.swapBodies(a.key, b.key);
  recordEdit(`swap:${[a.key, b.key].sort().join('-')}`, 'swap', { key: a.key, key2: b.key });
  toast(fmt(t('toast.swap'), { name: bodyName(a), name2: bodyName(b) }));
  refreshPanel();
});

deleteBtn.addEventListener('click', () => {
  const b = solar.getBody(bodySelect.value);
  if (!b.alive) return;
  solar.removeBody(b.key);
  recordEdit(`del:${b.key}`, 'del', { key: b.key });
  toast(fmt(t('toast.del'), { name: bodyName(b) }) + (b.key === 'sun' ? t('toast.delSun') : ''));
  refreshPanel();
});

// 天体を追加(惑星・恒星を複数にできる)
const PLANET_COLORS = [0x6ab0ff, 0xff9d5c, 0x8de08d, 0xc79bff, 0xff7ab0, 0x57d6c4, 0xffd76a];
let addPlanetCount = 0;
let addStarCount = 0;

function afterAddBody(b, type) {
  recordEdit(`add:${b.key}`, type, { key: b.key });
  rebuildBodySelect();
  bodySelect.value = b.key;
  refreshPanel();
  toast(fmt(t('toast.added'), { name: b.name }));
}

addPlanetBtn.addEventListener('click', () => {
  addPlanetCount++;
  const name = fmt(t('body.newPlanet'), { n: addPlanetCount });
  const b = solar.addBody({
    name,
    mass: 3e-6 * (0.5 + Math.random() * 3),       // 地球の0.5〜3.5倍くらい
    radiusKm: 5000 + Math.random() * 8000,
    color: PLANET_COLORS[(addPlanetCount - 1) % PLANET_COLORS.length],
    distanceAU: 0.6 + Math.random() * 2.6,
    star: false,
  });
  afterAddBody(b, 'add');
});

addStarBtn.addEventListener('click', () => {
  addStarCount++;
  const name = fmt(t('body.newStar'), { n: String.fromCharCode(66 + (addStarCount - 1) % 25) }); // B, C, …
  const b = solar.addBody({
    name,
    mass: 1.0,                                     // 太陽と同じ質量
    radiusKm: 696000,
    color: 0xffd75e,
    distanceAU: 4 + Math.random() * 3,
    star: true,
  });
  afterAddBody(b, 'addStar');
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
  // デモ再生中に画面をタップ → メニューを出す(デモは背後で流れ続ける)。
  // ゲームのオープニングと同じ「デモ → タップでメニュー → 選ぶ」挙動。
  if (attractMode) { showMenu(); return; }
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
    recordEdit(`drag:${pointerState.key}`, 'drag', { key: pointerState.key });
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
// 毎サイクル「見慣れた太陽系をすこし回す(溜め) → いきなり"もしも"が発動(ドン!)」という
// 動画と同じ演出を、ランダムなシナリオで生のシミュレーションとして見せる。
// 画面に触れた時点で解除され、まっさらな太陽系から遊び始められる。
const CINEMATIC_IDS = ['sun-vanish', 'all-fall', 'jupiter-monster', 'jupiter-star', 'sun-mercury-swap'];
const ATTRACT_PERIOD = 12; // 秒ごとに次の「もしも」へ
const OPENING_CALM = 1.1;        // 溜め: 普通に公転を見せる秒数
const OPENING_SPEED = '0.25';    // 溜めのあいだはゆったり
const OPENING_BANG_SPEED = '1';  // 発動の瞬間にテンポアップ
let attractMode = false;
let attractTimer = 0;
let attractIdx = -1;
let attractBangPending = false;
let attractBangSc = null;        // 発動するシナリオ

const attractHint = $('attract-hint');
const flashEl = $('flash');
function triggerFlash() {
  if (!flashEl) return;
  flashEl.classList.add('on');                 // 一瞬で白く(transition 0s)
  requestAnimationFrame(() => flashEl.classList.remove('on')); // そこから0.5sでフェード
}

// オープニングのキャッチコピー(動画と同じ。日本語が主役・英語は控えめ字幕)。
// cjp は [青パート, アンバーパート] の2色。
const CINE_TEXT = {
  'sun-vanish': { hj: 'もしも太陽が消えたら？', he: 'What if the Sun vanished?',
    cjp: ['うわぁ！！', 'どっか行った！？'], ce: 'Whoa!! Where did they go!?' },
  'all-fall': { hj: 'もしも惑星がぜんぶ止まったら？', he: 'What if every planet stopped?',
    cjp: ['つぎつぎ', 'のみこまれる！？'], ce: 'One by one, into the Sun!' },
  'jupiter-monster': { hj: 'もしも木星が太陽より重くなったら？', he: 'What if Jupiter outweighed the Sun?',
    cjp: ['主役、', '交代！？'], ce: 'Jupiter takes over the system!' },
  'jupiter-star': { hj: 'もしも木星が恒星になったら？', he: 'What if Jupiter became a star?',
    cjp: ['なに？！', 'この動き？！'], ce: 'What IS this motion?!' },
  'sun-mercury-swap': { hj: 'もしも太陽と水星を入れ替えたら？', he: 'What if the Sun and Mercury swapped?',
    cjp: ['うわっ、', 'ぐちゃぐちゃ！？'], ce: 'Total chaos!?' },
};
const captionEl = $('attract-caption');
function showHookCaption(sc) {
  const t = CINE_TEXT[sc?.id];
  if (!captionEl || !t) { captionEl?.classList.add('hidden'); return; }
  captionEl.innerHTML = `<div class="jp">${t.hj}</div><div class="en">${t.he}</div>`;
  captionEl.classList.remove('hidden', 'pop');
}
function showClimaxCaption(sc) {
  const t = CINE_TEXT[sc?.id];
  if (!captionEl || !t) return;
  captionEl.innerHTML =
    `<div class="jp"><span class="b">${t.cjp[0]}</span><span class="a">${t.cjp[1]}</span></div>`
    + `<div class="en">${t.ce}</div>`;
  captionEl.classList.remove('hidden');
  captionEl.classList.remove('pop'); void captionEl.offsetWidth; captionEl.classList.add('pop'); // 再アニメ
}
function hideCaption() { captionEl?.classList.add('hidden'); }

function startAttract() {
  if (mode !== 'solar') setMode('solar'); // デモは太陽系モードで
  attractMode = true;
  attractHint.classList.remove('hidden');
  panelToggle.classList.add('hidden'); // デモ中は「天体の設定」を隠してキャプションと被らせない
  labPanel.classList.add('hidden');
  observeMenu.classList.add('hidden');
  nextAttract();
}

function nextAttract() {
  attractTimer = 0;
  // 直前と違う「もしも」をランダムに選ぶ
  let i;
  do { i = Math.floor(Math.random() * CINEMATIC_IDS.length); }
  while (i === attractIdx && CINEMATIC_IDS.length > 1);
  attractIdx = i;
  attractBangSc = SCENARIOS.find((s) => s.id === CINEMATIC_IDS[i]);
  // まずは普通の太陽系をゆっくり回す(溜め)。発動は溜めが終わってから。
  solar.reset();
  clearLog();
  speedSelect.value = OPENING_SPEED;
  attractBangPending = true;
  solarPlaying = true;
  showHookCaption(attractBangSc); // 「もしも〜？」を表示
}

function stopAttract() {
  if (!attractMode) return;
  attractMode = false;
  attractBangPending = false;
  attractBangSc = null;
  attractHint.classList.add('hidden');
  hideCaption();
  panelToggle.classList.remove('hidden'); // 設定ボタンを戻す
  endScenario();
  solar.reset();
  clearLog();
  clearEdits();
  followKey = null;
  speedSelect.value = DEFAULT_SPEED; // デモ終了後はまっさらな太陽系を既定速度(1ヶ月/秒)で
  updateFollowBtn();
  refreshPanel();
  updateTimeDisplay();
}

// デモはメニューからの選択で止める(タップ即終了ではなく、ワンタップでメニューを出す)。

// ---------- メインループ ----------
const clock = new THREE.Clock();
let infoTick = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);

  if (mode === 'solar') {
    if (attractMode) {
      attractTimer += dt;
      // 溜めが終わったら、選ばれた「もしも」を“その場”で発動(位置・速度はそのまま)+ 閃光
      if (attractBangPending && attractTimer >= OPENING_CALM) {
        attractBangPending = false;
        attractBangSc?.setup(solar);
        speedSelect.value = OPENING_BANG_SPEED;
        triggerFlash();
        showClimaxCaption(attractBangSc); // 「うわぁ！！どっか行った！？」等に切替
      }
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

// ふりがな ON/OFF トグル(日本語表示のときだけ出す)
const furiToggle = $('furi-toggle');
function updateFuriToggle() {
  const ja = getLang() === 'ja';
  furiToggle.classList.toggle('hidden', !ja);
  if (ja) furiToggle.textContent = `${tPlain('furi.label')} ${getFurigana() ? 'ON' : 'OFF'}`;
}
furiToggle.addEventListener('click', () => {
  setFurigana(!getFurigana());
  applyAllI18n();
});

// 宇宙っぽいBGM。ボタンでON/OFF、最初の操作で鳴り始める(自動再生制限の回避)。
const bgmBtn = $('bgm-toggle');
const updateBgmBtn = () => { bgmBtn.textContent = bgmEnabled() ? '🔊' : '🔇'; };
updateBgmBtn();
bgmBtn.addEventListener('click', () => { toggleBGM(); updateBgmBtn(); });
// iOS Safari は pointerdown では音声を解放せず、touchend/click でないと解放されない。
// そこで「1回で打ち切らず」毎ジェスチャーで解放を試みる(unlockAudio/startBGM は冪等)。
// pointerdown が空振りしても、続く touchend/click で確実に鳴り出す。
function kickAudio(e) {
  if (e && e.target && e.target.closest && e.target.closest('#bgm-toggle')) return; // 🔊ボタンは自前で
  unlockAudio();                 // resume を試す(解放済みなら実質ノーオペ)
  if (bgmEnabled()) startBGM();  // startBGM は再生中なら何もしない(冪等)
}
for (const evt of ['pointerdown', 'touchend', 'mousedown', 'click', 'keydown']) {
  document.addEventListener(evt, kickAudio, { passive: true });
}

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
  relabelBodies();       // 3Dラベルの天体名を反映
  refreshInfo();         // 天体パネルの情報も
  if (activeScenario) $('scenario-banner-title').innerHTML = `${activeScenario.emoji} ${scTitle(activeScenario)}`;
  if (!shareMenu.classList.contains('hidden')) {
    $('share-preview').textContent = buildShareText();
  }
  updateTimeDisplay();   // 観察モードの時刻・年代表示も言語反映
  updateFuriToggle();    // ふりがなトグルの表示/ラベル
  if (!speedField.classList.contains('hidden')) setOrbSpeedLabel(parseFloat(orbspeedSlider.value));
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
