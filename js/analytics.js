// アクセス解析(GoatCounter)。Web版(GitHub Pages)でのみ作動する。
//
// 目的: 「何人が・どのくらい遊び・どの実験を触ったか」を集計し、ニーズ分析に使う。
// 個人の特定はしない(GoatCounter は Cookie 無し・個人を追跡しない軽量解析)。
//
// 重要: Android アプリ(Capacitor)は localhost で動くため、ここは作動しない。
//       → アプリの挙動・Google Play のデータ安全性には一切影響しない。

// ▼ GoatCounter のコード(サブドメイン)。goatcounter.com で無料登録して取得する。
//   例: コードを "moshimospacelab" にすると集計画面は
//       https://moshimospacelab.goatcounter.com になる。
const GC_CODE = 'moshimospacelab';

// Pages 本番ドメインでだけ計測する(アプリ=localhost / ローカル開発では無効)。
const ON_WEB = /(^|\.)github\.io$/.test(location.hostname);

let ready = false;
const pending = []; // count.js 読み込み前に発生したイベントを貯めておく

function flush() {
  if (!window.goatcounter || !window.goatcounter.count) return;
  ready = true;
  while (pending.length) window.goatcounter.count(pending.shift());
}

// 任意のイベントを記録する。name 例: 'scenario/sun-gone', 'mode/galaxy', 'playtime/3min'
export function track(name) {
  if (!ON_WEB) return; // アプリ・ローカルでは何もしない
  const ev = { path: `evt/${name}`, title: name, event: true };
  if (ready && window.goatcounter?.count) window.goatcounter.count(ev);
  else pending.push(ev);
}

// 滞在時間(=どのくらい遊んだか)を、表示中の実時間で計測してマイルストーン送信する。
// unload に頼らず、節目(1/3/5/10/20/30分)を超えた瞬間に1回だけ送るので取りこぼしにくい。
const MILESTONES = [
  [60, '1min'], [180, '3min'], [300, '5min'],
  [600, '10min'], [1200, '20min'], [1800, '30min'],
];
function startPlaytimeTracking() {
  let activeSec = 0;
  let sent = 0;
  setInterval(() => {
    if (document.visibilityState !== 'visible') return; // 裏に回っている間は数えない
    activeSec += 10;
    while (sent < MILESTONES.length && activeSec >= MILESTONES[sent][0]) {
      track(`playtime/${MILESTONES[sent][1]}`);
      sent++;
    }
  }, 10000);
}

export function initAnalytics() {
  if (!ON_WEB) return; // ★アプリ・ローカルでは解析を読み込まない
  window.goatcounter = window.goatcounter || {};
  const s = document.createElement('script');
  s.async = true;
  s.src = '//gc.zgo.at/count.js';
  s.setAttribute('data-goatcounter', `https://${GC_CODE}.goatcounter.com/count`);
  s.addEventListener('load', flush); // 読み込み後に貯まったイベントを送る
  document.head.appendChild(s);
  // 念のため遅延でも flush(load を取りこぼした場合)
  setTimeout(flush, 3000);
  startPlaytimeTracking();
}
