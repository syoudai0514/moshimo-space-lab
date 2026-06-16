// Android(ネイティブ)版だけで動く起動スクリプト。
// Web 版(GitHub Pages)には読み込まれないので、ここに広告などネイティブ機能を書く。
//
// AdMob: 全画面の 3D ビューを邪魔しないよう、実験を切り替えるタイミングで
// ときどきインタースティシャル(全画面広告)を出す方式。

import { Capacitor } from '@capacitor/core';
import { AdMob } from '@capacitor-community/admob';

// ===================================================================
// ✅ 本番 AdMob ID に切り替え済み(Google Play 申請用)。
//    TESTING=false / 下記は AdMob 管理画面で発行した本物の広告ユニット ID。
//    AndroidManifest.xml の com.google.android.gms.ads.APPLICATION_ID も
//    本番アプリ ID (ca-app-pub-5902840391247067~9692736343) に合わせてある。
//
//    ⚠️ 本番 ID の状態で自分で広告を何度も表示・タップしないこと(アカウント停止リスク)。
//       実機での動作確認はテスト端末設定を使うか、最小限にとどめる。
// ===================================================================
const TESTING = false;
const AD_UNITS = {
  // 本番インタースティシャル広告ユニット ID
  interstitial: 'ca-app-pub-5902840391247067/6234008495',
};

// 広告の頻度制御
const WARMUP_MS = 90 * 1000;        // 起動後しばらくは広告を出さない
const MIN_INTERVAL_MS = 4 * 60 * 1000; // 前回表示からの最低間隔
const sessionStart = Date.now();
let lastShown = 0;
let initialized = false;
let showing = false;

async function init() {
  if (!Capacitor.isNativePlatform()) return; // Web では何もしない
  try {
    await AdMob.initialize({ initializeForTesting: TESTING });
    initialized = true;
  } catch (err) {
    console.warn('AdMob init failed', err);
  }
}

async function maybeShowInterstitial() {
  if (!initialized || showing) return;
  const now = Date.now();
  if (now - sessionStart < WARMUP_MS) return;
  if (now - lastShown < MIN_INTERVAL_MS) return;
  showing = true;
  try {
    await AdMob.prepareInterstitial({ adId: AD_UNITS.interstitial, isTesting: TESTING });
    await AdMob.showInterstitial();
    lastShown = Date.now();
  } catch (err) {
    console.warn('interstitial failed', err);
  } finally {
    showing = false;
  }
}

// アプリ本体(main.js)から呼べるように公開する。Web 版では未定義のままなので、
// 呼び出し側は window.MSLabAds?.maybeShowInterstitial?.() と安全に呼ぶ。
window.MSLabAds = { maybeShowInterstitial };

init();
