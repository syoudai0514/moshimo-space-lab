// 多言語(日本語/英語/中国語/韓国語)とふりがな。
//  - 日本語の値には、子供向けに <ruby> でふりがなを入れている(他言語はプレーン)。
//  - 値は innerHTML として描画する前提(自前の信頼できる文字列のみ)。
//  - 取得は t(key): 現在の言語 → 英語 → 日本語 → key の順にフォールバック。
//    中国語・韓国語でまだ訳していない長い解説は、英語にフォールバックする。

export const LANGS = [
  ['ja', '日本語'],
  ['en', 'English'],
  ['zh', '中文'],
  ['ko', '한국어'],
];

// localStorage は Safari のプライベートモード等で例外を投げることがあるので安全に扱う
function lsGet(k) { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null; } catch { return null; } }
function lsSet(k, v) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(k, v); } catch { /* ignore */ } }

let lang = lsGet('mslab-lang') || 'ja';
export function getLang() { return lang; }
export function setLang(l) {
  lang = l;
  lsSet('mslab-lang', l);
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}

export function t(key) {
  const d = DICT[lang];
  if (d && d[key] != null) return d[key];
  if (DICT.en[key] != null) return DICT.en[key];
  if (DICT.ja[key] != null) return DICT.ja[key];
  return key;
}

// ふりがな(ruby)を取り除いてプレーンな文字列にする。
// <option> やキャンバス描画など、HTMLを描画できない場所で使う。
export function stripRuby(html) {
  return html.replace(/<rt>.*?<\/rt>/g, '').replace(/<\/?[^>]+>/g, '');
}

// プレーンテキスト版(ふりがな・タグなし)
export function tPlain(key) {
  return stripRuby(t(key));
}

// data-i18n 属性を持つ要素にまとめて流し込む
export function applyStaticI18n(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) {
    const val = t(el.dataset.i18n);
    // <option> は中の <ruby> を描画できないので、ふりがなを外したテキストを入れる
    if (el.tagName === 'OPTION') el.textContent = stripRuby(val);
    else el.innerHTML = val;
  }
}

const DICT = {
  ja: {
    // --- ヘッダー / タブ ---
    'app.title': '🧪 もしも<ruby>宇宙<rt>うちゅう</rt></ruby>ラボ',
    'tab.backToLab': '←&nbsp;<ruby>実験室<rt>じっけんしつ</rt></ruby>',
    'tab.lab': '🧪&nbsp;<ruby>実験<rt>じっけん</rt></ruby>',
    'tab.observe': '🔭&nbsp;<ruby>観察<rt>かんさつ</rt></ruby>',
    // --- ウェルカム ---
    'welcome.h': '🧪 もしも<ruby>宇宙<rt>うちゅう</rt></ruby>ラボへようこそ',
    'welcome.p1': 'ここは、<ruby>宇宙<rt>うちゅう</rt></ruby>をいじくり<ruby>倒<rt>たお</rt></ruby>せる<ruby>実験室<rt>じっけんしつ</rt></ruby>。<br>もしも<ruby>太陽<rt>たいよう</rt></ruby>が<ruby>消<rt>き</rt></ruby>えたら? <ruby>木星<rt>もくせい</rt></ruby>が<ruby>恒星<rt>こうせい</rt></ruby>になったら?',
    'welcome.p2': '<ruby>本物<rt>ほんもの</rt></ruby>の<ruby>重力計算<rt>じゅうりょくけいさん</rt></ruby>で「もしも」を<ruby>試<rt>ため</rt></ruby>して、<br>なぜそうなるのかを<ruby>学<rt>まな</rt></ruby>ぼう。',
    'welcome.start': '🧪 <ruby>実験<rt>じっけん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>んで<ruby>始<rt>はじ</rt></ruby>める',
    'welcome.free': '🪐 <ruby>自由<rt>じゆう</rt></ruby>にいじってみる',
    'welcome.hint': '🔭 <ruby>右上<rt>みぎうえ</rt></ruby>の「<ruby>観察<rt>かんさつ</rt></ruby>」から、<ruby>銀河<rt>ぎんが</rt></ruby>や<ruby>宇宙<rt>うちゅう</rt></ruby>138<ruby>億年<rt>おくねん</rt></ruby>の<ruby>歴史<rt>れきし</rt></ruby>も<ruby>見<rt>み</rt></ruby>られます',
    // --- 観察メニュー ---
    'observe.h': '🔭 <ruby>観察<rt>かんさつ</rt></ruby>モード',
    'observe.hint': '<ruby>実験<rt>じっけん</rt></ruby>の<ruby>舞台<rt>ぶたい</rt></ruby>である<ruby>宇宙<rt>うちゅう</rt></ruby>を、ちがうスケールで<ruby>眺<rt>なが</rt></ruby>める<ruby>資料室<rt>しりょうしつ</rt></ruby>です。',
    'observe.galaxy.t': '🌌 <ruby>銀河系<rt>ぎんがけい</rt></ruby>',
    'observe.galaxy.d': '<ruby>実験<rt>じっけん</rt></ruby>していた<ruby>太陽系<rt>たいようけい</rt></ruby>は、この<ruby>天<rt>あま</rt></ruby>の<ruby>川銀河<rt>がわぎんが</rt></ruby>の<ruby>片隅<rt>かたすみ</rt></ruby>にある。±30<ruby>億年<rt>おくねん</rt></ruby>の<ruby>回転<rt>かいてん</rt></ruby>を<ruby>見<rt>み</rt></ruby>る',
    'observe.universe.t': '🌠 <ruby>宇宙<rt>うちゅう</rt></ruby>の<ruby>歴史<rt>れきし</rt></ruby>',
    'observe.universe.d': 'ビッグバンから238<ruby>億年<rt>おくねん</rt></ruby>まで。<ruby>原子<rt>げんし</rt></ruby>が<ruby>生<rt>う</rt></ruby>まれる<ruby>前<rt>まえ</rt></ruby>の<ruby>時代<rt>じだい</rt></ruby>には 🔬 でズームインできる',
    // --- 実験室パネル ---
    'lab.h': '🧪 もしも<ruby>実験室<rt>じっけんしつ</rt></ruby>',
    'lab.hint': '<ruby>実験<rt>じっけん</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶとシミュレーションが<ruby>始<rt>はじ</rt></ruby>まります。<ruby>何<rt>なに</rt></ruby>が<ruby>起<rt>お</rt></ruby>きるか<ruby>予想<rt>よそう</rt></ruby>してから<ruby>試<rt>ため</rt></ruby>そう。',
    'lab.logHead': '📜 <ruby>実験<rt>じっけん</rt></ruby>の<ruby>記録<rt>きろく</rt></ruby>',
    'lab.logEmpty': 'まだ<ruby>記録<rt>きろく</rt></ruby>はありません',
    // --- 実験バナー ---
    'banner.explain': '💡 <ruby>解説<rt>かいせつ</rt></ruby>',
    'banner.end': '✕ <ruby>終了<rt>しゅうりょう</rt></ruby>',
    // --- 天体パネル ---
    'panel.toggle': '⚙ <ruby>天体<rt>てんたい</rt></ruby>の<ruby>設定<rt>せってい</rt></ruby>',
    'panel.h': '<ruby>天体<rt>てんたい</rt></ruby>の<ruby>設定<rt>せってい</rt></ruby>',
    'panel.select': '<ruby>天体<rt>てんたい</rt></ruby>を<ruby>選択<rt>せんたく</rt></ruby>',
    'panel.size': '<ruby>大<rt>おお</rt></ruby>きさ',
    'panel.mass': '<ruby>重<rt>おも</rt></ruby>さ',
    'panel.dist': '<ruby>太陽<rt>たいよう</rt></ruby>からの<ruby>距離<rt>きょり</rt></ruby>',
    'panel.editHint': '※ <ruby>重<rt>おも</rt></ruby>さ・<ruby>距離<rt>きょり</rt></ruby>を<ruby>変<rt>か</rt></ruby>えると、その<ruby>瞬間<rt>しゅんかん</rt></ruby>から<ruby>重力<rt>じゅうりょく</rt></ruby>で<ruby>軌道<rt>きどう</rt></ruby>が<ruby>変<rt>か</rt></ruby>わります。<ruby>惑星<rt>わくせい</rt></ruby>は<ruby>直接<rt>ちょくせつ</rt></ruby>ドラッグでも<ruby>動<rt>うご</rt></ruby>かせます',
    'panel.circularize': '⭕ この<ruby>位置<rt>いち</rt></ruby>で<ruby>円軌道<rt>えんきどう</rt></ruby>に<ruby>乗<rt>の</rt></ruby>せる',
    'panel.swap': '<ruby>別<rt>べつ</rt></ruby>の<ruby>天体<rt>てんたい</rt></ruby>と<ruby>場所<rt>ばしょ</rt></ruby>を<ruby>入<rt>い</rt></ruby>れ<ruby>替<rt>か</rt></ruby>え (<ruby>太陽<rt>たいよう</rt></ruby>もOK)',
    'panel.swapBtn': '🔄 <ruby>実行<rt>じっこう</rt></ruby>',
    'panel.follow': '🎯 この<ruby>天体<rt>てんたい</rt></ruby>を<ruby>追<rt>お</rt></ruby>いかける',
    'panel.followOn': '🎯 <ruby>追従中<rt>ついじゅうちゅう</rt></ruby> (タップで<ruby>解除<rt>かいじょ</rt></ruby>)',
    'panel.addPlanet': '➕ <ruby>惑星<rt>わくせい</rt></ruby>を<ruby>追加<rt>ついか</rt></ruby>',
    'panel.addStar': '➕ <ruby>太陽<rt>たいよう</rt></ruby>を<ruby>追加<rt>ついか</rt></ruby>',
    'panel.delete': '🗑 この<ruby>天体<rt>てんたい</rt></ruby>を<ruby>消<rt>け</rt></ruby>す',
    'panel.deleteHint': '※ <ruby>消<rt>け</rt></ruby>すと<ruby>重力<rt>じゅうりょく</rt></ruby>もなくなります。<ruby>太陽<rt>たいよう</rt></ruby>を<ruby>消<rt>け</rt></ruby>すと、すべての<ruby>惑星<rt>わくせい</rt></ruby>がまっすぐ<ruby>飛<rt>と</rt></ruby>んでいきます(リセットで<ruby>復活<rt>ふっかつ</rt></ruby>)',
    'panel.exagg': '<ruby>表示<rt>ひょうじ</rt></ruby>サイズの<ruby>倍率<rt>ばいりつ</rt></ruby>',
    'panel.exaggHint': '※ <ruby>太陽<rt>たいよう</rt></ruby>と<ruby>惑星<rt>わくせい</rt></ruby>の<ruby>大<rt>おお</rt></ruby>きさの<ruby>比率<rt>ひりつ</rt></ruby>は<ruby>常<rt>つね</rt></ruby>に<ruby>本物<rt>ほんもの</rt></ruby>どおり。×1にすると<ruby>実際<rt>じっさい</rt></ruby>のスケール<ruby>感<rt>かん</rt></ruby>(<ruby>惑星<rt>わくせい</rt></ruby>はほぼ<ruby>点<rt>てん</rt></ruby>)になります',
    // --- 時間バー ---
    'time.zoom': '🔬 ミクロの<ruby>世界<rt>せかい</rt></ruby>を<ruby>見<rt>み</rt></ruby>る',
    'time.now': '<ruby>現在<rt>げんざい</rt></ruby>',
    'time.play': '⏸ <ruby>停止<rt>ていし</rt></ruby>',
    'time.pause': '▶ <ruby>再生<rt>さいせい</rt></ruby>',
    'time.clearTrails': '🧹 <ruby>軌跡<rt>きせき</rt></ruby>を<ruby>消<rt>け</rt></ruby>す',
    'time.reset': '↺ リセット',
    'time.share': '📣 シェア',
    'time.toNow': '⏺ <ruby>現在<rt>げんざい</rt></ruby>へ',
    'speed.day': '1<ruby>日<rt>にち</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.week': '1<ruby>週間<rt>しゅうかん</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.month': '1ヶ<ruby>月<rt>げつ</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.3month': '3ヶ<ruby>月<rt>げつ</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.year': '1<ruby>年<rt>ねん</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.5year': '5<ruby>年<rt>ねん</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    'speed.10year': '10<ruby>年<rt>ねん</rt></ruby>/<ruby>秒<rt>びょう</rt></ruby>',
    // --- シェアメニュー ---
    'share.h': '📣 シェアする',
    'share.hint': 'いまの<ruby>実験結果<rt>じっけんけっか</rt></ruby>を、SNSや<ruby>友<rt>とも</rt></ruby>だちにシェアできます。',
    'share.video': '🎬 <ruby>崩壊<rt>ほうかい</rt></ruby>の<ruby>動画<rt>どうが</rt></ruby>を<ruby>撮<rt>と</rt></ruby>る(6<ruby>秒<rt>びょう</rt></ruby>)',
    'share.image': '📸 <ruby>結果<rt>けっか</rt></ruby>カードを<ruby>画像<rt>がぞう</rt></ruby>で<ruby>保存<rt>ほぞん</rt></ruby>',
    'share.x': '𝕏 でツイートする',
    'share.line': 'LINE で<ruby>送<rt>おく</rt></ruby>る',
    'share.copy': '🔗 テキストをコピー',
    // --- アトラクト / 録画 ---
    'attract.hint': '▶ <ruby>自動<rt>じどう</rt></ruby>デモ<ruby>再生中<rt>さいせいちゅう</rt></ruby>　— <ruby>画面<rt>がめん</rt></ruby>をタップで<ruby>操作<rt>そうさ</rt></ruby>スタート',
    // --- カード / シェア文 ---
    'card.changes': '🛠 <ruby>変更<rt>へんこう</rt></ruby>した<ruby>点<rt>てん</rt></ruby>',
    'card.free': '<ruby>自由実験<rt>じゆうじっけん</rt></ruby>モード',
    'lang.label': '🌐 <ruby>言語<rt>げんご</rt></ruby>',
  },

  en: {
    'app.title': '🧪 What-If Space Lab',
    'tab.backToLab': '← Lab',
    'tab.lab': '🧪 Experiments',
    'tab.observe': '🔭 Observe',
    'welcome.h': '🧪 Welcome to What-If Space Lab',
    'welcome.p1': 'A lab where you can mess with the universe.<br>What if the Sun vanished? What if Jupiter became a star?',
    'welcome.p2': "Try your “what-ifs” with real gravity physics,<br>and learn why things happen.",
    'welcome.start': '🧪 Pick an experiment',
    'welcome.free': '🪐 Just play freely',
    'welcome.hint': '🔭 From “Observe” (top right) you can also see the galaxy and 13.8 billion years of cosmic history.',
    'observe.h': '🔭 Observe Mode',
    'observe.hint': 'A gallery for viewing the universe — the stage of your experiments — at different scales.',
    'observe.galaxy.t': '🌌 The Galaxy',
    'observe.galaxy.d': 'The Solar System you experimented on sits in a corner of the Milky Way. See ±3 billion years of rotation.',
    'observe.universe.t': '🌠 History of the Universe',
    'observe.universe.d': 'From the Big Bang to 23.8 billion years. Before atoms existed, zoom in with 🔬.',
    'lab.h': '🧪 What-If Lab',
    'lab.hint': 'Pick an experiment to start the simulation. Guess what will happen before you try!',
    'lab.logHead': '📜 Experiment log',
    'lab.logEmpty': 'No records yet',
    'banner.explain': '💡 Explain',
    'banner.end': '✕ End',
    'panel.toggle': '⚙ Body settings',
    'panel.h': 'Body settings',
    'panel.select': 'Select a body',
    'panel.size': 'Size',
    'panel.mass': 'Mass',
    'panel.dist': 'Distance from Sun',
    'panel.editHint': '※ Changing mass or distance bends the orbit from that instant via gravity. You can also drag planets directly.',
    'panel.circularize': '⭕ Put into a circular orbit here',
    'panel.swap': 'Swap places with another body (Sun is OK)',
    'panel.swapBtn': '🔄 Swap',
    'panel.follow': '🎯 Follow this body',
    'panel.followOn': '🎯 Following (tap to stop)',
    'panel.addPlanet': '➕ Add planet',
    'panel.addStar': '➕ Add star',
    'panel.delete': '🗑 Delete this body',
    'panel.deleteHint': '※ Deleting removes its gravity too. Delete the Sun and every planet flies off in a straight line (Reset to restore).',
    'panel.exagg': 'Display size multiplier',
    'panel.exaggHint': '※ The size ratio between Sun and planets is always true to life. At ×1 you get the real scale (planets are nearly dots).',
    'time.zoom': '🔬 See the micro world',
    'time.now': 'Now',
    'time.play': '⏸ Pause',
    'time.pause': '▶ Play',
    'time.clearTrails': '🧹 Clear trails',
    'time.reset': '↺ Reset',
    'time.share': '📣 Share',
    'time.toNow': '⏺ To now',
    'speed.day': '1 day/s',
    'speed.week': '1 week/s',
    'speed.month': '1 month/s',
    'speed.3month': '3 months/s',
    'speed.year': '1 year/s',
    'speed.5year': '5 years/s',
    'speed.10year': '10 years/s',
    'share.h': '📣 Share',
    'share.hint': 'Share your current result on social media or with friends.',
    'share.video': '🎬 Record the collapse (6s)',
    'share.image': '📸 Save result card image',
    'share.x': '𝕏 Tweet',
    'share.line': 'Send on LINE',
    'share.copy': '🔗 Copy text',
    'attract.hint': '▶ Auto demo playing — tap the screen to take over',
    'card.changes': '🛠 What I changed',
    'card.free': 'Free experiment mode',
    'lang.label': '🌐 Language',
  },

  zh: {
    'app.title': '🧪 假如宇宙实验室',
    'tab.backToLab': '← 实验室',
    'tab.lab': '🧪 实验',
    'tab.observe': '🔭 观察',
    'welcome.h': '🧪 欢迎来到假如宇宙实验室',
    'welcome.p1': '这里是可以随意摆弄宇宙的实验室。<br>假如太阳消失了？假如木星变成恒星？',
    'welcome.p2': '用真实的引力计算尝试各种“假如”，<br>并学习其中的原理。',
    'welcome.start': '🧪 选择一个实验开始',
    'welcome.free': '🪐 自由摆弄',
    'welcome.hint': '🔭 从右上角的“观察”还能看到银河系和宇宙138亿年的历史。',
    'observe.h': '🔭 观察模式',
    'observe.hint': '以不同尺度观察作为实验舞台的宇宙的资料室。',
    'observe.galaxy.t': '🌌 银河系',
    'observe.galaxy.d': '你实验的太阳系位于银河系的一角。观看±30亿年的旋转。',
    'observe.universe.t': '🌠 宇宙的历史',
    'observe.universe.d': '从大爆炸到238亿年。在原子诞生之前的时代，可用🔬放大观察。',
    'lab.h': '🧪 假如实验室',
    'lab.hint': '选择实验即可开始模拟。先猜猜会发生什么再试试吧。',
    'lab.logHead': '📜 实验记录',
    'lab.logEmpty': '还没有记录',
    'banner.explain': '💡 讲解',
    'banner.end': '✕ 结束',
    'panel.toggle': '⚙ 天体设置',
    'panel.h': '天体设置',
    'panel.select': '选择天体',
    'panel.size': '大小',
    'panel.mass': '质量',
    'panel.dist': '与太阳的距离',
    'panel.editHint': '※ 改变质量或距离后，会立刻通过引力改变轨道。也可以直接拖动行星。',
    'panel.circularize': '⭕ 在此位置进入圆形轨道',
    'panel.swap': '与其他天体交换位置（太阳也可以）',
    'panel.swapBtn': '🔄 执行',
    'panel.follow': '🎯 跟踪这个天体',
    'panel.followOn': '🎯 跟踪中（点按解除）',
    'panel.addPlanet': '➕ 添加行星',
    'panel.addStar': '➕ 添加太阳',
    'panel.delete': '🗑 删除这个天体',
    'panel.deleteHint': '※ 删除后引力也会消失。删除太阳后，所有行星都会径直飞走（重置可恢复）。',
    'panel.exagg': '显示大小的倍率',
    'panel.exaggHint': '※ 太阳与行星的大小比例始终真实。设为×1即为真实比例（行星几乎是点）。',
    'time.zoom': '🔬 看看微观世界',
    'time.now': '现在',
    'time.play': '⏸ 暂停',
    'time.pause': '▶ 播放',
    'time.clearTrails': '🧹 清除轨迹',
    'time.reset': '↺ 重置',
    'time.share': '📣 分享',
    'time.toNow': '⏺ 回到现在',
    'speed.day': '1天/秒',
    'speed.week': '1周/秒',
    'speed.month': '1个月/秒',
    'speed.3month': '3个月/秒',
    'speed.year': '1年/秒',
    'speed.5year': '5年/秒',
    'speed.10year': '10年/秒',
    'share.h': '📣 分享',
    'share.hint': '可以把当前的实验结果分享到社交网络或发给朋友。',
    'share.video': '🎬 录制崩坏视频（6秒）',
    'share.image': '📸 保存结果卡片图片',
    'share.x': '𝕏 发推',
    'share.line': '用 LINE 发送',
    'share.copy': '🔗 复制文本',
    'attract.hint': '▶ 正在自动演示 — 点按屏幕开始操作',
    'card.changes': '🛠 改动的地方',
    'card.free': '自由实验模式',
    'lang.label': '🌐 语言',
  },

  ko: {
    'app.title': '🧪 만약 우주 연구소',
    'tab.backToLab': '← 실험실',
    'tab.lab': '🧪 실험',
    'tab.observe': '🔭 관찰',
    'welcome.h': '🧪 만약 우주 연구소에 오신 것을 환영합니다',
    'welcome.p1': '여기는 우주를 마음껏 주무를 수 있는 실험실.<br>만약 태양이 사라진다면? 목성이 항성이 된다면?',
    'welcome.p2': '진짜 중력 계산으로 “만약”을 시험해 보고,<br>왜 그렇게 되는지 배워 봐요.',
    'welcome.start': '🧪 실험을 골라 시작하기',
    'welcome.free': '🪐 자유롭게 만져보기',
    'welcome.hint': '🔭 오른쪽 위 “관찰”에서 은하와 우주 138억 년의 역사도 볼 수 있어요.',
    'observe.h': '🔭 관찰 모드',
    'observe.hint': '실험의 무대인 우주를 다른 스케일로 바라보는 자료실입니다.',
    'observe.galaxy.t': '🌌 은하계',
    'observe.galaxy.d': '실험하던 태양계는 이 은하수의 한구석에 있습니다. ±30억 년의 회전을 보세요.',
    'observe.universe.t': '🌠 우주의 역사',
    'observe.universe.d': '빅뱅부터 238억 년까지. 원자가 생기기 전 시대는 🔬로 확대할 수 있어요.',
    'lab.h': '🧪 만약 실험실',
    'lab.hint': '실험을 고르면 시뮬레이션이 시작됩니다. 무슨 일이 일어날지 예상해 보고 시험해 봐요.',
    'lab.logHead': '📜 실험 기록',
    'lab.logEmpty': '아직 기록이 없습니다',
    'banner.explain': '💡 해설',
    'banner.end': '✕ 종료',
    'panel.toggle': '⚙ 천체 설정',
    'panel.h': '천체 설정',
    'panel.select': '천체 선택',
    'panel.size': '크기',
    'panel.mass': '질량',
    'panel.dist': '태양으로부터의 거리',
    'panel.editHint': '※ 질량·거리를 바꾸면 그 순간부터 중력으로 궤도가 바뀝니다. 행성은 직접 드래그할 수도 있어요.',
    'panel.circularize': '⭕ 이 위치에서 원궤도에 올리기',
    'panel.swap': '다른 천체와 위치 교환 (태양도 가능)',
    'panel.swapBtn': '🔄 실행',
    'panel.follow': '🎯 이 천체를 따라가기',
    'panel.followOn': '🎯 추적 중 (탭하면 해제)',
    'panel.addPlanet': '➕ 행성 추가',
    'panel.addStar': '➕ 태양 추가',
    'panel.delete': '🗑 이 천체를 지우기',
    'panel.deleteHint': '※ 지우면 중력도 사라집니다. 태양을 지우면 모든 행성이 직선으로 날아갑니다(리셋하면 복구).',
    'panel.exagg': '표시 크기 배율',
    'panel.exaggHint': '※ 태양과 행성의 크기 비율은 항상 실제 그대로. ×1로 하면 실제 스케일(행성은 거의 점)이 됩니다.',
    'time.zoom': '🔬 미시 세계 보기',
    'time.now': '현재',
    'time.play': '⏸ 정지',
    'time.pause': '▶ 재생',
    'time.clearTrails': '🧹 궤적 지우기',
    'time.reset': '↺ 리셋',
    'time.share': '📣 공유',
    'time.toNow': '⏺ 현재로',
    'speed.day': '1일/초',
    'speed.week': '1주/초',
    'speed.month': '1개월/초',
    'speed.3month': '3개월/초',
    'speed.year': '1년/초',
    'speed.5year': '5년/초',
    'speed.10year': '10년/초',
    'share.h': '📣 공유하기',
    'share.hint': '지금의 실험 결과를 SNS나 친구에게 공유할 수 있어요.',
    'share.video': '🎬 붕괴 영상 찍기(6초)',
    'share.image': '📸 결과 카드를 이미지로 저장',
    'share.x': '𝕏 트윗하기',
    'share.line': 'LINE으로 보내기',
    'share.copy': '🔗 텍스트 복사',
    'attract.hint': '▶ 자동 데모 재생 중 — 화면을 탭하면 조작 시작',
    'card.changes': '🛠 바꾼 점',
    'card.free': '자유 실험 모드',
    'lang.label': '🌐 언어',
  },
};
