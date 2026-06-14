// 宇宙っぽい環境音(BGM)と効果音(SFX)を Web Audio API で手続き生成する。
// 音源ファイル不要・著作権フリー。
//  - BGM: 低い持続音(ドローン)を数音重ね、ゆっくり動くローパスで「呼吸」させ、合成リバーブで広げる。
//          ときどき星のまたたきのような柔らかいベル音。
//  - SFX: 天体が太陽に飲み込まれた/太陽系の彼方へ飛び去った瞬間に鳴らす。
// ブラウザの自動再生制限のため、実際に音が出るのは最初のユーザー操作のあと。

const STORE = 'mslab-bgm';
let ctx = null;
let master = null;     // BGM 用の音量(フェードイン/アウト)
let reverb = null;
let sfxBus = null;     // 効果音用バス(BGMのON/OFFやフェードと独立して鳴る)
let playing = false;   // BGM(ドローン)が再生中か
let dronesBuilt = false;
let bellTimer = null;

export function bgmEnabled() {
  try { return localStorage.getItem(STORE) !== 'off'; } catch { return true; } // 既定 ON
}
function setStore(on) { try { localStorage.setItem(STORE, on ? 'on' : 'off'); } catch { /* ignore */ } }
export function isPlaying() { return playing; }

// ノイズ減衰で簡易インパルス応答(宇宙的な広いリバーブ)を作る
function makeReverbIR(seconds = 3.6, decay = 2.2) {
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return buf;
}

// AudioContext と共通の音声グラフ(master/reverb/sfxBus)を一度だけ用意する。
// 効果音だけ鳴らしたい(BGMはOFF)場合もあるので、ドローン生成とは分けている。
function ensureGraph() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  reverb = ctx.createConvolver();
  reverb.buffer = makeReverbIR();
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.7;
  reverb.connect(reverbGain).connect(master);

  // 効果音バス: 直接出力 + 専用の長いリバーブ(なめらかな尾)。master を通さないので
  // BGMが消音/フェード中でも効果音はしっかり鳴る。離散ディレイ(ポンポン反復)は使わない。
  sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.9;
  sfxBus.connect(ctx.destination);
  const sfxVerb = ctx.createConvolver();
  sfxVerb.buffer = makeReverbIR(5.0, 2.8); // 長く暗い余韻
  const sfxVerbGain = ctx.createGain();
  sfxVerbGain.gain.value = 0.55;
  sfxBus.connect(sfxVerb);
  sfxVerb.connect(sfxVerbGain).connect(ctx.destination);
}

function build() {
  ensureGraph();
  dronesBuilt = true;

  // ドローンを通すローパス + ゆっくり動かす LFO(呼吸感)
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 480;
  filter.Q.value = 0.7;
  filter.connect(master);
  filter.connect(reverb);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.045;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 260;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();

  // 低い持続音(A をルートにした和音)。わずかにデチューンを揺らして厚みを出す
  const freqs = [55, 82.41, 110, 164.81];
  for (const f of freqs) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.value = 0.09;
    const det = ctx.createOscillator();
    det.frequency.value = 0.06 + Math.random() * 0.06;
    const detG = ctx.createGain();
    detG.gain.value = 2 + Math.random() * 3;
    det.connect(detG).connect(o.detune);
    det.start();
    o.connect(g).connect(filter);
    o.start();
  }
}

// 星のまたたき(ペンタトニックの柔らかいベル)
const SCALE = [220.0, 246.94, 293.66, 329.63, 392.0, 440.0];
function scheduleBell() {
  if (!playing || !ctx) return;
  const now = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = SCALE[(Math.random() * SCALE.length) | 0] * (Math.random() < 0.5 ? 1 : 2);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.10, now + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);
  o.connect(g);
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.value = Math.random() * 1.6 - 0.8;
    g.connect(p);
    p.connect(reverb);
    p.connect(master);
  } else {
    g.connect(reverb);
    g.connect(master);
  }
  o.start(now);
  o.stop(now + 4);
  bellTimer = setTimeout(scheduleBell, 5000 + Math.random() * 7000);
}

export function startBGM() {
  ensureGraph();
  if (!dronesBuilt) build();
  if (ctx.state === 'suspended') ctx.resume();
  if (playing) return;
  playing = true;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0.12, t + 3); // ゆっくりフェードイン
  scheduleBell();
}

export function stopBGM() {
  if (!ctx || !playing) return;
  playing = false;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 1.2); // ゆっくりフェードアウト
  if (bellTimer) { clearTimeout(bellTimer); bellTimer = null; }
}

// ボタン用: ON/OFF を切り替えて新しい状態(再生中か)を返す
export function toggleBGM() {
  if (playing) { stopBGM(); setStore(false); } else { startBGM(); setStore(true); }
  return playing;
}

// ---------- 効果音(SFX) ----------
// ノイズバッファ(whoosh 用)。一度だけ生成して使い回す。
let noiseBuf = null;
function getNoise() {
  if (noiseBuf) return noiseBuf;
  const len = Math.floor(ctx.sampleRate * 1.5);
  noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

// 太陽(ブラックホール)に飲み込まれた:
// 低音がゆっくり膨らみながら沈み込み、共鳴フィルターで「渦に吸い込まれる」質感を出し、
// 最後に事象の地平面を越える重い一撃(ドゥゥン)で終わる。明るい高音・鋭い立ち上がりは無し。
function sfxAbsorbed() {
  const now = ctx.currentTime;
  const dur = 2.0;

  // 共鳴ローパス(だんだん閉じて吸い込まれる感じ)
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(520, now);
  lp.frequency.exponentialRampToValueAtTime(70, now + dur);
  lp.Q.value = 7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.5, now + 0.6);     // ゆっくり膨らむ(ポップ防止)
  g.gain.setValueAtTime(0.5, now + dur - 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  lp.connect(g).connect(sfxBus);

  // 沈み込む低音(わずかにデチューンして不気味なうなり)
  for (const [f0, f1, type, gain] of [
    [104, 26, 'sine', 1.0],
    [105.5, 25, 'sine', 0.7],
    [62, 19, 'triangle', 0.6],
  ]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const og = ctx.createGain();
    og.gain.value = gain;
    o.connect(og).connect(lp);
    o.start(now);
    o.stop(now + dur + 0.1);
  }

  // 渦に巻き込まれるノイズ(低く絞り込む)
  const n = ctx.createBufferSource();
  n.buffer = getNoise();
  n.loop = true;
  const nlp = ctx.createBiquadFilter();
  nlp.type = 'lowpass';
  nlp.Q.value = 4;
  nlp.frequency.setValueAtTime(380, now);
  nlp.frequency.exponentialRampToValueAtTime(55, now + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, now);
  ng.gain.linearRampToValueAtTime(0.16, now + 0.7);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  n.connect(nlp).connect(ng).connect(sfxBus);
  n.start(now);
  n.stop(now + dur + 0.1);

  // 事象の地平面を越える重い一撃(低周波なので「ポップ」ではなく「ドゥゥン」)
  const imp = ctx.createOscillator();
  imp.type = 'sine';
  const t0 = now + dur * 0.8;
  imp.frequency.setValueAtTime(58, t0);
  imp.frequency.exponentialRampToValueAtTime(20, t0 + 0.9);
  const ig = ctx.createGain();
  ig.gain.setValueAtTime(0.0001, t0);
  ig.gain.exponentialRampToValueAtTime(0.75, t0 + 0.1);
  ig.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
  imp.connect(ig).connect(sfxBus);
  imp.start(t0);
  imp.stop(t0 + 1.1);
}

// 太陽系の彼方へ飛び去った:
// 明るい上昇音はやめ、低く重いうなりが片側へパンしながら遠ざかってフェードする。
// ドップラーで少しピッチが下がり、長いリバーブの尾で「闇に消えていく」余韻を残す。
function sfxEscaped() {
  const now = ctx.currentTime;
  const dur = 1.9;

  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(820, now);
  lp.frequency.exponentialRampToValueAtTime(130, now + dur);
  lp.Q.value = 2;

  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.4, now + 0.3);    // やわらかく立ち上げる(ポップ防止)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

  // 片側へパンして遠ざかる
  let tail = g;
  if (ctx.createStereoPanner) {
    const p = ctx.createStereoPanner();
    p.pan.setValueAtTime(0, now);
    p.pan.linearRampToValueAtTime(Math.random() < 0.5 ? -1 : 1, now + dur * 0.85);
    g.connect(p);
    tail = p;
  }
  tail.connect(sfxBus);

  // 低く重いうなり(下降 = ドップラー)
  for (const [f0, f1, type, gain] of [
    [175, 52, 'sawtooth', 0.45],
    [88, 30, 'sine', 0.8],
  ]) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, now);
    o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    const og = ctx.createGain();
    og.gain.value = gain;
    o.connect(og).connect(lp);
    o.start(now);
    o.stop(now + dur + 0.1);
  }
  lp.connect(g);

  // 低い風切り(下へスイープして遠ざかる)
  const n = ctx.createBufferSource();
  n.buffer = getNoise();
  n.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(550, now);
  bp.frequency.exponentialRampToValueAtTime(110, now + dur);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.0001, now);
  ng.gain.linearRampToValueAtTime(0.14, now + 0.35);
  ng.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  n.connect(bp).connect(ng).connect(tail);
  n.start(now);
  n.stop(now + dur + 0.1);
}

// イベント種別に応じた効果音を鳴らす。🔇(消音)のときは鳴らさない。
export function playSfx(type) {
  if (!bgmEnabled()) return;
  ensureGraph();
  if (ctx.state === 'suspended') ctx.resume();
  if (type === 'absorbed') sfxAbsorbed();
  else if (type === 'escaped') sfxEscaped();
}
