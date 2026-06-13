// 宇宙っぽい環境音(BGM)を Web Audio API で手続き生成する。音源ファイル不要・著作権フリー。
//  - 低い持続音(ドローン)を数音重ね、ゆっくり動くローパスフィルターで「呼吸」させる
//  - 合成リバーブ(畳み込み)で広がりを出す
//  - ときどき星のまたたきのような柔らかいベル音を鳴らす
// ブラウザの自動再生制限のため、実際に音が出るのは最初のユーザー操作のあと。

const STORE = 'mslab-bgm';
let ctx = null;
let master = null;
let reverb = null;
let playing = false;
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

function build() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  reverb = ctx.createConvolver();
  reverb.buffer = makeReverbIR();
  const reverbGain = ctx.createGain();
  reverbGain.gain.value = 0.7;
  reverb.connect(reverbGain).connect(master);

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
  if (!ctx) build();
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
