# Android リリース手順(もしも宇宙ラボ)

このアプリは Web アプリを **Capacitor** で Android アプリ化しています。
最終的なビルド・署名・Google Play への提出は、あなたのパソコン(Android Studio が必要)で行います。

---

## 0. 必要なもの
- **Android Studio**(最新版。これに Android SDK / Gradle が含まれます)
- **Node.js 18 以上**
- **Google Play デベロッパー アカウント**(初回のみ $25 / 登録は1回きり)
- **AdMob アカウント**(無料・広告を出すなら必須)

---

## 1. プロジェクトの準備(ターミナル)
リポジトリを clone したフォルダで:

```bash
npm install          # 依存パッケージを入れる
npm run sync         # www/ を組み立て、Android プロジェクトに反映
npx cap open android # Android Studio でプロジェクトを開く
```

> `npm run sync` は「Web アセットのコピー + ネイティブスクリプトのバンドル + `cap sync`」をまとめて実行します。
> `index.html` / `js/` / `css/` を編集したら、毎回 `npm run sync` をやり直してください。

---

## 2. AdMob を本番用に切り替える(広告で収益化する場合)
今は **Google 公式のテスト広告 ID** が入っています。テスト ID のままだと実際の収益は発生しません。
本番に切り替えるには、AdMob 管理画面でアプリと広告ユニットを作成し、**2 か所**を書き換えます。

1. **アプリ ID** … `android/app/src/main/AndroidManifest.xml`
   ```xml
   <meta-data
     android:name="com.google.android.gms.ads.APPLICATION_ID"
     android:value="ca-app-pub-XXXXXXXX~XXXXXXXX" />  <!-- ← 本物のアプリ ID -->
   ```
2. **広告ユニット ID と本番フラグ** … `src/native/main.js`
   ```js
   const TESTING = false;  // ← 本番は false
   const AD_UNITS = {
     interstitial: 'ca-app-pub-XXXXXXXX/XXXXXXXX', // ← 本物の広告ユニット ID
   };
   ```
   書き換えたら `npm run sync` を忘れずに。

> ⚠️ 実機で動作確認をするときも、自分の端末を「テストデバイス」に登録するか、テスト ID を使ってください。
> 自分で本番広告をタップ/表示しすぎると、AdMob アカウントが停止されることがあります。

---

## 3. 署名キーの作成(初回のみ)
Google Play にアップロードするには署名が必要です。Android Studio のメニューから:

`Build > Generate Signed App Bundle / APK… > Android App Bundle`
→ 「Create new…」でキーストア(`.jks`)を作成。

- キーストアのファイルとパスワードは**絶対に紛失しないこと**(なくすと以後アップデートできません)。
- `.jks` ファイルはリポジトリに**コミットしない**(`.gitignore` 済み)。

---

## 4. リリース用 AAB をビルド
Android Studio の `Build > Generate Signed App Bundle` を最後まで進めると、
`android/app/release/app-release.aab` が出力されます。

(コマンドで行う場合は、キーストア情報を設定のうえ `cd android && ./gradlew bundleRelease`)

---

## 5. Google Play Console で公開
1. [Play Console](https://play.google.com/console) で新しいアプリを作成(言語: 日本語、無料)。
2. **ストアの掲載情報**: `store/listing-ja.md` の文章をコピペ。
3. **グラフィック**:
   - アプリアイコン 512×512(`resources/icon.png` を 512px に縮小)
   - フィーチャーグラフィック 1024×500(`store/feature-graphic.png`)
   - スクリーンショット 2枚以上(実機/エミュレータで撮影)
4. **プライバシーポリシー URL**:
   `https://syoudai0514.github.io/moshimo-space-lab/privacy.html`
5. **データ セーフティ フォーム**: AdMob を使うため、
   「広告 ID(Advertising ID)を収集・共有する」を申告する必要があります。
   - 収集する情報: アプリのアクティビティ / デバイス識別子(広告 ID)
   - 目的: 広告またはマーケティング
6. **コンテンツのレーティング**: アンケートに回答(教育アプリ・暴力等なし)。
7. **対象年齢**: 13歳以上を想定。
8. リリース > 製品版(またはまず内部テスト)に、手順4の `.aab` をアップロード。

---

## バージョンの上げ方(アップデート時)
`android/app/build.gradle` の以下を上げてからビルド:
```gradle
versionCode 2          // アップロードのたびに +1(整数)
versionName "1.0.1"    // 表示用バージョン
```

---

## 補足: Web 版との関係
- リポジトリ直下の `index.html` / `js/` / `css/` / `vendor/` が Web アプリ本体で、
  GitHub Pages(`https://syoudai0514.github.io/moshimo-space-lab/`)はこれを配信しています。
- `www/` は Android 用にこれらをコピーして組み立てる**生成物**(`.gitignore` 済み・コミット不要)。
- 広告などネイティブ専用の処理は `src/native/main.js` に書きます。Web 版では読み込まれません。
