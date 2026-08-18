# MPOINTS TRACKER

> **26.08.12** · React + Vite + Firebase PWA · ボードゲーム・カードゲーム用のマルチデバイス得点トラッカー

**このドキュメントの言語:** [English](README.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [中文](README.zh.md)

---

## 概要

MPoints Tracker は、友人とのボードゲーム・カードゲームの得点記録のための**プログレッシブウェブアプリ**です。**23 の表示可能なゲーム**（UNO ファミリー、Truco、Chinchón、Rummy、ポーカー、ブラックジャック、Generala、チェス、カナスタ、ブラコなど）を収録し、**オフライン**で動作し、**クラウドに同期**し、**プレイヤー連携と招待**をサポートし、**あらゆる端末にインストール**できます。

**デプロイ:** Cloudflare Pages
**本番 URL:** `mpoints-tracker.pages.dev`
**現在のリリース:** `26.08.12`

### 主な特長

- 🎲 **23 のゲーム**：ゲーム固有の得点ボード・ルール・統計（UNO ファミリー、Truco、ポーカー、ブラックジャック、Generala、チェス、Sushi Do!、カナスタ、ブラコ、Chancho、Chinchón、Rummy など）。
- 📴 **オフライン・ファースト**：`localStorage`（`bgt_v6`）によるローカル保存 + IndexedDB オフラインキャッシュ、デバウンス付きクラウド同期。
- 🔗 **プレイヤーと招待**：QR/UID でプレイヤーをリンク、対戦を共有、招待を受け付け。
- 🎨 **完全なテーマ設定**：ライト / ダーク / OLED、Material You（Monet）アクセント、**カスタムアクセントカラー**選択。
- 🌍 **6 言語**：ES、EN、DE、FR、JA、ZH。
- 🏆 **チャンピオン**：グローバルランキング、直接対決、公開プロフィール。
- 🎵 **Spotify ミニプレイヤー**（任意）：プレイ中に音楽を操作。
- 📦 **インストール可能な PWA**（service worker キャッシュ付き）。

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 19 + Vite 8 + TypeScript |
| バックエンド / Auth | Firebase 11（Auth + Firestore） |
| ローカル保存 | `localStorage`（`bgt_v6`）+ IndexedDB（Firestore オフライン） |
| スタイル | CSS カスタムプロパティ + Liquid Glass デザイン |
| i18n | 自作システム（`TRANSLATIONS` + `useT` フック） |
| テスト | Playwright（マルチデバイス）+ Vitest |
| デプロイ | Cloudflare Pages（`wrangler`） |

---

## クイックスタート

```bash
npm install        # 依存関係をインストール（または: pnpm install）
npm run dev        # 開発サーバー（localhost:5173）
npm run build      # 本番ビルド（/dist）
npm run preview    # ビルドのプレビュー
npm run deploy     # ビルド + Cloudflare Pages へデプロイ
```

### テスト

```bash
npm run test:unit  # Vitest によるユニットテスト（jsdom）
npm run test       # Playwright E2E（開発サーバー起動が必要）
npm run test:logic # Playwright デスクトップ論理スイート
npm run test:layout# Playwright マルチビューポートスイート（7 プロジェクト）
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### `npm` を使わないローカル検証

このマシンでの推奨ローカルフロー：

```powershell
node .\scripts\verify-local.mjs
```

このランナーは次の順に実行します：

- `typecheck`
- `build`
- `vitest`
- Playwright **ブラウザレス**契約スイート
- Settings/Champions/ゲームスイッチを対象とした Playwright スイート（`vite preview` を自身で起動。メインブラウザは `msedge`、失敗時は同梱 Chromium にフォールバック。どちらも実行できない場合は `test-results/local-verify/summary.json` に報告し、機能的な失敗とは混ぜません）

個別ステップを直接バイナリで実行する場合：

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` は `node_modules/typescript` があればそれを使用し、なければ `corepack pnpm dlx` による一時ツールチェーン（ローカルキャッシュ `.corepack/`）にフォールバックします。

---

## プロジェクト構成

### アーキテクチャの概観

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → ブラウザルーター、エントリーガード、プリウォーミング
       └─ App.tsx                             → シェル・オーケストレーション: hooks、context、layout
            └─ AppLayout.tsx                  → クローム: ヘッダー、下部ナビ、セクション切替
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → 共有アプリ状態
```

- **ルーティング**は URL 駆動（`createBrowserRouter`）。Lazy ページと、ディープリンクをプリウォームして可視フォールバックを避けるローダーを採用。
- **状態**は焦点を絞ったフック（`useTheme`、`useAuth`、`useMatches`、`useGameSession`、`useNavigation` など）に置き、`AppContext` 経由でアプリ全体に公開。
- **データ**は `services/*`（Firestore ヘルパー）と `lib/*`（storage、stats、紙吹雪、Spotify クライアント）を通って流れます。
- **スタイル**は設計トークンに基づくレイヤー化 CSS（`tokens → base → components → utilities`）。**CSS-in-JS は不使用**。
- **i18n** は小さな自作ランタイム：表示されるすべての文字列は `src/data/translations/*.ts` にあり、各キーは**6 言語すべて**に存在する必要があります。

### ディレクトリツリー

```
src/
├── App.tsx                    # シェル・オーケストレーション: auth、theme、navigation、context 配線
├── main.tsx                   # エントリーポイント: RouterProvider + service worker 登録
├── routes/
│   ├── routes.tsx             # ブラウザルーター + エントリーガード + lazy ページ
│   └── routeLoaders.ts        # ディープリンクのプリウォーミング/検証（shell、history、settings、ゲーム）
├── index.css                  # スタイルの入口（レイヤー化 CSS）
├── styles/
│   ├── tokens.css             # デザイントークン + light/dark/oled テーマ + アクセントモード
│   ├── base.css               # リセット / ベースレイヤー
│   ├── components.css         # コンポーネントレイヤー
│   └── utilities.css          # ユーティリティと視覚的ヘルパー
│
├── components/
│   ├── auth/                  # ログイン、QR スキャナー、ユーザー検索、招待リンク、リンク済みプレイヤー
│   ├── games/                 # ゲームごとの NewMatch フォーム + 共有スコア入力
│   ├── home/                  # HomeTab: カタログ、フィルター、ヒーローカード、homeModel（ビューモデル）
│   ├── settings/              # 設定セクション（テーマ、効果、言語、グループ、アカウント）
│   ├── seo/SEO.tsx            # ルートごとのメタタグ
│   └── ui/                    # 再利用可能: AppShell、AppHeader、GroupPicker、Toast、ThemeToggle など
│
├── context/
│   └── AppContext.tsx         # 共有アプリコンテキスト（対戦、グループ、Spotify 設定など）
│
├── data/
│   ├── games.ts               # GAMES カタログ（id、名前、色、アイコン、タグ）
│   ├── rules.ts               # RulesPage 用ルール文
│   ├── scoreTables.ts         # UNO ファミリーの得点テーブル
│   ├── sushiDo.ts             # Sushi Do! の定数/ヘルパー
│   ├── portionFoods.ts        # ポーションカウンターの食品カタログ
│   └── translations/          # 6 言語: es（デフォルト）、en、de、fr、ja、zh
│
├── hooks/                     # useTheme、useAuth、useMatches、useGameSession、
│                              # useNavigation、useOnlineStatus、useWakeLock、useHaptic など
├── lib/                       # storage、stats、confetti、firebase、inviteService、spotifyClient
├── pages/                     # GameDetail、HomeTab、Rules、Champs、History、Settings、Admin など
├── services/                  # authService、userService、matchService（Firestore ヘルパー）
└── types.ts                   # 共有 TypeScript 型
```

> **規約:** タッチターゲット ≥ 40px、`100dvh`（決して `100vh` ではない）、インタラクティブ要素に `data-testid`、すべての文字列を `TRANSLATIONS` に、必要な箇所で `React.memo`/`useCallback` によるメモ化、サブ関数は親コンポーネントより先に宣言。

---

## ゲームカタログ（表示 23 ゲーム）

### UNO ファミリー
| ID | 名前 | 勝利条件 |
|----|------|----------|
| `uno` | UNO | 500 pts |
| `uno_no_mercy` | UNO No Mercy | 1000 pts + 慈悲ルール |
| `uno_flip` | UNO Flip | 500 pts（明るい面/暗い面） |
| `uno_dos` | DOS | 200 pts |

### カードゲーム
| ID | 名前 | タイプ |
|----|------|--------|
| `truco` | Truco | チームまたは個人、15/30 pts |
| `chancho` | Chancho | 文字による脱落 |
| `esquinados` | Esquinados | ラウンド勝者 |
| `chin` | Chin | カードなし 1v1 |
| `chinchon` | Chinchón | 脱落制、100 pts 上限 |
| `canasta` | カナスタ | 5000 pts · チームまたは個人 |
| `sushi_do` | Sushi Do! | 500 pts · 各味 6 枚揃え |
| `rummy` | Rummy | 500 pts · 組み合わせ |
| `burako` | ブラコ | 2000 pts · 個人またはチーム |

### テーブル・ボードゲーム
| ID | 名前 | 勝利条件 |
|----|------|----------|
| `ajedrez` | チェス | 1v1、対戦勝利者 |
| `monopoly` | モノポリー | 対戦勝利者 |
| `life` | Life | 対戦勝利者 |

### カジノ・ダイス
| ID | 名前 | タイプ |
|----|------|--------|
| `poker` | ポーカー | ラウンド勝者 |
| `blackjack` | ブラックジャック | 21（CPU 任意） |
| `generala` | Generala | 5 個のダイス組み合わせ |

### カジュアル
| ID | 名前 | タイプ |
|----|------|--------|
| `racha_perdida` | 連勝記録ブレーカー | 連勝記録の記録 |
| `portion_counter` | ポーションカウンター | 食べ物を選ぶ + シンプルカウンター |
| `basta_dym` | Basta! | テーマカード 3 枚 · ラウンドごと A-Z |
| `custom` | フリープレイ | 自由 / 設定可能なスコア |

### Home / Games

- `HomeTab` は `featured` + `recent` の上部編集ブロックを構成します。
- 横レールを使うのは **Recent** のみ。通常カタログはスクロール可能なレールを再利用しません。
- `homeModel.ts` は視覚的な重複を防ぎます：上部で既にプロモートされたゲームは、同じビューの下部カタログに再レンダリングされません。
- ヒーローカバーは一貫したプレースホルダーと `loading="lazy"` を使用。画像が失敗しても、ベクターヒーローがフォールバックとして残ります。

### 内部の隠し ID

`sushi`、`pizza`、`hamburguesa`、`pancho`、`empanadas`、`facturas`、`sanguchitos`、`cookies`、`otros_porciones` — 互換性/履歴のために保持され、`PorcionNewMatch` を使用しますが、Home には表示されません。

---

## データアーキテクチャ

### localStorage（`bgt_v6`）

```js
{
  uno: [ /* 対戦配列 */ ],
  truco: [ /* ... */ ],
  __theme: true,        // レガシー: 永続化されたテーマ
  // ... 残りのゲーム ID
}
```

### Firestore

```
users/{uid}/
  └── data: { localStorage と同じ構造 }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### 対戦の構造（UNO の例）

```js
{
  id: "lm8k2abc",          // mkId() → timestamp36 + random
  date: 1713000000000,     // Date.now()
  players: [
    { name: "Ana", score: 520 },
    { name: "Beto", score: 310 },
    { name: "Carlos", score: 480 }
  ],
  winner: "Ana",
  rounds: 12,
  duration: 18,
  // ゲーム固有のフィールド...
}
```

---

## 国際化（i18n）

**言語:** `es`（デフォルト）、`en`、`de`、`zh`、`ja`、`fr`

```js
// App では翻訳関数を生成し、コンテキスト経由で共有する
const t = useT(lang);
t("saveMatch");

// TRANSLATIONS 内で t() を呼ばない
// コンポーネントに文字列をハードコードしない
// 新しいキーはすべて対応言語に存在させること
```

検出: `detectLang()` → localStorage → `navigator.language` → フォールバック `es`

現在の決定: `i18next` / `react-i18next` は 2026 年 5 月に評価されました。コスト/利益とランタイムの単純さから、**自作システムを維持**する決定です。詳しくは [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md) を参照。

---

## ルーティングと認証

```text
createBrowserRouter
  ├─ /                 → アプリシェル + プリウォーミングローダー
  ├─ /login            → 明示的な認証エントリー
  ├─ /rules            → ルール
  ├─ /champions        → チャンピオン
  ├─ /settings         → 設定 + クエリパラメータ正規化
  ├─ /history          → 履歴 + フィルター正規化
  ├─ /game/:gameId     → アクティブなゲーム + gameId 検証 + lazy プリロード
  └─ /admin            → ProtectedRoute → アプリシェル
```

### アクセスフロー

```text
/login
  ├─ authChecked=false → 認証ロード中
  ├─ offline           → グローバルバナー + ローカルモード（同期の約束なし）
  ├─ Google OAuth
  ├─ メール/パスワード → LoginForm（useFormStatus + useOptimistic）
  └─ ゲストモード → クラウド同期なし

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → アクセス可
  └─ セッションなし → /login へリダイレクト
```

### 永続化と同期

- `src/services/authService.ts` が `setPersistence(fbAuth, indexedDBLocalPersistence)` を初期化。
- `src/hooks/useAuth.ts` がセッションを復元し、`userdata/{uid}` を読み込み、レガシーデータを移行し、`shared_matches` を取り込みます。
- `src/hooks/useMatches.ts` が変更ごとにデバウンス（1200 ms）し、`saveDataToCloud(uid, data)` を呼びます。
- `src/hooks/useOnlineStatus.ts` がオフライン時のフォールバック表示を提供。
- `src/routes/routeLoaders.ts` がディープエントリーで `App` とアクティブなゲームをプリウォームし、可視フォールバックを回避。

---

## テーマ設定

### カラーモード

- `bgt_theme_mode`: `light | dark | system`
- アクティブテーマは派生します：`system` は OS に追従し、`dark` + `oled` は純黒 OLED サーフェスを有効化（`bgt_oled`）。

### アクセントモード

アクセントはアプリの**クローム**（下部ナビのアクティブピル、統計ビュー、アクティブコントロール）を駆動し、**ゲームカード**と**ゲーム詳細画面**はゲームごとの色を維持します。

- `bgt_theme_accent`: `default | monet | custom`
  - **デフォルト** — ティールアクセント（`#006d77`）。
  - **Monet** — Android で利用可能な場合の Material You カラー（bridge `android-dynamic-color`）、ローカルフォールバックパレット付き。
  - **カスタムカラー** — ユーザーが選んだ任意の hex（*設定 → 設定 → アプリデザイン*のスウォッチ + フリーカラーピッカー）。
- `bgt_theme_custom_accent`: ユーザーが選んだ hex（`#rrggbb`）。
- カスタム hex はインラインの `--theme-custom-accent` / `--theme-custom-on-accent`（on-accent は輝度から導出）として公開され、`html[data-theme-accent="custom"]` は `color-mix` で light/dark/OLED 向けにすべてのアクセントロール（コンテナ、アウトライン、ナビピル、コントロール）を再構築します。
- 認証済みユーザーでは `themeAccent` / `themeCustomAccent` が `userdata/{uid}` に同期され（`spotifyPosition` と同じパターン）、他の端末で復元されます。

`useTheme.ts` はベースモード、アクセント、OLED を分離します。Monet は `DynamicThemeContract` + `data-theme-source="android-dynamic-color"` を使用し、存在しない Web API を偽装しません。カスタムカラーはブリッジと競合しない独立モードです。

CSS では：

- `html[data-theme]` が light/dark/oled サーフェスを制御
- `html[data-theme-accent="monet"]` が `--accent-*` を Material ロールに再マップ
- `html[data-theme-accent="custom"]` が `--accent-*` をユーザー hex から再マップ
- `html[data-theme-source="android-dynamic-color"]` が外部ブリッジによる `--dynamic-*` 注入を許可

OLED と Monet/Custom は共存します：OLED がニュートラル/サーフェスを支配し、アクセントがアクセント・フォーカス・ピル・コントロールを引き続き彩ります。

---

## Spotify ミニプレイヤー

Spotify オプションは *設定 → 設定* にあり、**デフォルトではオフ**です。有効にすると、OAuth PKCE、Web Playback SDK、Spotify Web API を使用したグローバルミニプレイヤーが表示されます：曲、アーティスト、カバー、アクティブデバイス、進行状況、展開可能なキュー、ライブ音量、シャッフル、リピート、前へ/次へ、再生/一時停止、保存曲の同期、曲検索、保存プレイリスト、切断、SDK が `device_id` を登録したときのブラウザへの転送。スクロールするとアクティブカバーのフローティングボタンに折りたたまれ、タップで再び展開します。

モバイルでは、展開されたプレイヤーの外をタップすると閉じ、スクロールでも折りたたまれます。折りたたまれた「バブル」の位置は設定可能（中央、左、右、ドラッグ可能）で、`bgt_spotify_position` に保存されます（クラウド: `spotifyPosition`）。

実際に接続するには、`VITE_SPOTIFY_CLIENT_ID` とリダイレクト URI を設定します：

- 本番: `https://your-domain/settings`
- ローカル開発: `http://127.0.0.1:5173/settings`（`localhost` を使用する場合は `http://localhost:5173/settings` も）

Web 統合には Spotify **Premium** アカウントが必要です。トークンは `localStorage` に残り、切断・ログアウト・リフレッシュ拒否時に削除されます。OAuth コールバックは `state` を検証し、`code_verifier` を一度だけ消費し、URL から `code`/`state`/`error` を削除します。

Scopes: `streaming`、`user-read-playback-state`、`user-modify-playback-state`、`user-read-currently-playing`、`user-library-read`、`user-library-modify`、`playlist-read-private`、`playlist-read-collaborative`。ライブラリ/プレイリスト追加前に認可されたセッションは、これらのスコープを付与するために再接続が必要です。

---

## localStorage キー

| キー | 用途 |
|------|------|
| `bgt_v6` | メインデータ（対戦 + テーマ） |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | カスタムアクセント hex（`#rrggbb`） |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | ローカルの Spotify OAuth PKCE トークン |
| `bgt_spotify_code_verifier` | 一時的な OAuth ログイン verifier |
| `bgt_spotify_oauth_state` | 一時的な OAuth ログイン state |
| `bgt_wakelock` | 画面 wake lock が有効なら `"1"` |
| `bgt_oled` | OLED サーフェスが有効なら `"1"` |
| `bgt_splash_seen` | スプラッシュ表示後に `"1"` |
| `bgt_lang` | 保存された言語 |
| `bgt_drafts` | ゲームごとの進行中ドラフト（`{ [gameId]: draft }`） |
| `bgt_haptic` | 触覚フィードバック無効なら `"0"` |
| `bgt_reduce_effects` | 効果削減有効なら `"1"` |
| `bgt_last_uid` | セッションのある最後の UID（セッションヒント） |
| `bgt_player_groups` | 保存されたプレイヤーグループ |
| `bgt_last_group_v` | ゲームごとの最後に使用したグループ |
| `bgt_nav_order` | 下部ナビの順序 |
| `bgt_onboarding_seen` | オンボーディング完了後に `"1"` |
| `bgt_guest_mode` / `bgt_guest_name` | ゲストモード / ゲスト名 |
| `bgt_install_dismissed` / `_later` | インストールバナーの却下 |

### バックアップと履歴

*設定 → 設定 → 詳細* から対戦の完全な JSON バックアップをエクスポートし、別の端末にインポートできます（インポートはローカルの対戦データをファイルの有効なゲームキーで置き換え、通常の永続化/同期フローを使用）。履歴ビューは現在のフィルター結果（プレイヤー、ゲーム、日付）も JSON でエクスポートします。

---

## PWA / Service Worker

- `public/sw.js`: アセットは `CacheFirst`、Firestore リクエストは `NetworkFirst`、ルール/オフラインドキュメントは `StaleWhileRevalidate`。
- `public/manifest.webmanifest`: Android/iOS/Desktop にインストール可能。
- アイコンは `public/icons/`（16、32、180、192、512px）。
- セキュリティ/CORS ヘッダーは `public/_headers`（Cloudflare Pages）、リダイレクトは `public/_redirects`。
- デプロイされたアプリには厳格な Content-Security-Policy が設定されています（Spotify WebSocket ドメインを含む）。

---

## 開発ルール（重要）

```text
✅ 常に 100dvh（決して 100vh ではない）
✅ タッチターゲット最低 40px
✅ 完全なファイル（決して差分ではない）
✅ サブ関数は親コンポーネントより前に宣言
✅ React.memo / useMemo / useCallback を適切に使用
✅ インタラクティブ要素に data-testid
✅ すべての文字列を TRANSLATIONS に（全対応言語）
❌ ハードコードされた文字列は禁止
❌ TRANSLATIONS 内で t() を使用しない
❌ モジュール間のプライベートなグローバル変数は禁止
❌ 循環依存は禁止
❌ 根拠なく Firestore 構造を発明しない
```

---

## 主要 CSS 変数

```css
--bg        /* メイン背景 */
--bg2       /* セカンダリ背景（カード、モーダル） */
--tx        /* メインテキスト */
--tx2       /* セカンダリテキスト */
--accent    /* グローバルアクセント */
--gc        /* ゲームカラー（アクティブなゲームごとにインライン注入） */
--r         /* 基本角丸 */
--blur      /* backdrop-filter blur */
--glass-border  /* liquid glass ボーダー */
--nomercy   /* UNO No Mercy / Blackjack 専用カラー */
```

---

## UNO データモデル

UNO ファミリー（`uno`、`uno_no_mercy`、`uno_flip`、`uno_dos`）は敗者ごとの残り得点を課しません。各ラウンドはカードタイプごとの単一の集約入力を使用し、`SCORE_TABLES` が合計を計算します。その合計はラウンド勝者に一度だけ加算されます。

UNO ドラフトは以下を永続化できます：

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` は `effectiveRound` 付きの非破壊的な参加/退出イベントを記録します。プレイヤーが進行中の対戦を退出した場合、サポートされるデフォルトは、記録に残しつつ将来のアクティブロースターからのみ除外することです。スコアボードは履歴スコアを保持し、勝者ボタンはアクティブプレイヤーのみを使用します。

---

## 管理者（Admin）

- 管理者アクセスは Firebase custom claims `{ admin: true }` による（`useAuth.ts` で `token.claims.admin` を検証）。
- 信頼できる Firebase Admin 環境から claim を設定し、ID トークンの更新を強制します。
- 「Admin」ナビ項目は claim が `true` の場合のみ表示されます。
- `AdminPage.tsx` が特権操作を管理します。

---

## 新しいゲームを追加する

1. `src/components/games/NuevoJuegoNewMatch.tsx` を作成
2. `src/data/games.ts` → `GAMES` オブジェクトにエントリを追加
3. `src/data/translations/*.ts` の全対応言語に新しいキーを追加
4. `games.ts` に `getTagline()` マッピングを追加
5. `src/data/rules.ts` にルールを追加
6. `GameDetail.tsx` でコンポーネントをインポートし、`game.type` で接続
7. `src/components/home/homeModel.ts` の対応グループに追加

---

## 対応デバイス（Playwright）

| プロジェクト | ビューポート |
|-------------|------------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

テストは `./tests/` · 設定は `playwright.config.js`
