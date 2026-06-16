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

## ☁️ クラウドビルド(Android Studio が無くてもビルドできる)
GitHub Actions 上で APK / AAB をビルドする仕組みを用意しています
(`.github/workflows/android-build.yml`)。手元の PC に Android Studio や Android SDK が
無くても、ブラウザだけでビルドできます。

### A. 動作確認用のデバッグ APK(署名不要・すぐ使える)
1. GitHub のリポジトリ → **Actions** タブ → 左の **「Android Build」** を選択。
2. 右上の **「Run workflow」** → ブランチ `main` を選んで実行。
   (`main` に push しても自動で走ります)
3. 完了したら、その実行ページ下部の **Artifacts** から **`app-debug-apk`** をダウンロード。
4. ZIP を展開して出てくる `app-debug.apk` を Android 端末に転送し、
   「提供元不明のアプリ」を許可してインストール → 実機で動作確認。

> 本番 AdMob ID に切り替え済み(`TESTING=false`)。動作確認時は自分の端末をテストデバイスに
> 登録するか、表示確認を最小限にしてください(本番広告の自己クリック/連打はアカウント停止リスク)。

### B. Play 提出用の署名済み AAB(keystore を Secrets に登録すると自動生成)
署名鍵(keystore)を一度だけ作り、その内容を GitHub の Secrets に登録すると、
CI が **署名済みの `app-release.aab`** まで自動で出力します(Play Console にそのまま提出可)。

1. **keystore を作成**(手元に Java があれば PC で1回だけ。なくさないこと):
   ```bash
   keytool -genkey -v -keystore release.jks -keyalg RSA -keysize 2048 \
     -validity 10000 -alias upload
   ```
   → 設定したパスワードと別名(alias `upload`)を控える。`release.jks` は紛失厳禁・**コミットしない**。

2. **keystore を base64 文字列に変換**:
   ```bash
   base64 -w0 release.jks   # mac は base64 -i release.jks
   ```

3. リポジトリ → **Settings → Secrets and variables → Actions → New repository secret** で
   次の **4 つ**を登録:
   | Secret 名 | 値 |
   |---|---|
   | `ANDROID_KEYSTORE_BASE64` | 手順2で出力した base64 文字列 |
   | `ANDROID_KEYSTORE_PASSWORD` | キーストアのパスワード |
   | `ANDROID_KEY_ALIAS` | 別名(例: `upload`) |
   | `ANDROID_KEY_PASSWORD` | 鍵のパスワード(別名のパスワード) |

4. 再度 **Run workflow** を実行 → Artifacts に **`app-release-aab`** が増えます。
   これをダウンロードして、下の「5. Google Play Console で公開」へ。

> Secrets が未登録のうちは AAB ステップは自動でスキップされ、デバッグ APK だけ出ます。
> ローカルの Android Studio でビルドする場合は、この Secrets は不要です(従来どおりの署名フロー)。

---

## 2. AdMob 設定(本番 ID 設定済み)
**本番 AdMob ID に切り替え済みです**(`TESTING=false`)。以下の **2 か所**に本番 ID が入っています。

1. **アプリ ID** … `android/app/src/main/AndroidManifest.xml`
   ```xml
   <meta-data
     android:name="com.google.android.gms.ads.APPLICATION_ID"
     android:value="ca-app-pub-5902840391247067~9692736343" />  <!-- 本番アプリ ID -->
   ```
2. **広告ユニット ID と本番フラグ** … `src/native/main.js`
   ```js
   const TESTING = false;  // 本番
   const AD_UNITS = {
     interstitial: 'ca-app-pub-5902840391247067/6234008495', // 本番広告ユニット ID
   };
   ```
   ソースを変更したら `npm run sync` を忘れずに。

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
