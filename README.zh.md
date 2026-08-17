# MPOINTS TRACKER

> **26.08.11** · React + Vite + Firebase PWA · 适用于桌面游戏和卡牌游戏的多设备记分工具

**阅读语言：** [English](README.md) · [Español](README.es.md) · [Deutsch](README.de.md) · [Français](README.fr.md) · [日本語](README.ja.md)

---

## 概述

MPoints Tracker 是一款**渐进式 Web 应用**，用于和朋友玩桌面游戏、卡牌游戏时记录得分。它收录了 **23 个可见游戏**（UNO 系列、Truco、Chinchón、Rummy、扑克、21 点、Generala、国际象棋、Canasta、Burako 等），**离线可用**、**云同步**、支持**玩家关联和邀请**，并可**安装到任何设备**。

**部署：** Cloudflare Pages
**生产地址：** `mpoints-tracker.pages.dev`
**当前版本：** `26.08.11`

### 亮点

- 🎲 **23 个游戏**，每个游戏都有专属记分板、规则和统计（UNO 系列、Truco、扑克、21 点、Generala、国际象棋、Sushi Do!、Canasta、Burako、Chancho、Chinchón、Rummy 等）。
- 📴 **离线优先**：通过 `localStorage`（`bgt_v6`）+ IndexedDB 离线缓存本地持久化，带防抖的云同步。
- 🔗 **玩家与邀请**：通过 QR/UID 关联玩家、分享对局、接受邀请。
- 🎨 **完整主题**：浅色 / 深色 / OLED、Material You（Monet）强调色，以及**自定义强调色**选择器。
- 🌍 **6 种语言**：ES、EN、DE、FR、JA、ZH。
- 🏆 **冠军**：全球排行、正面交锋和公开主页。
- 🎵 **Spotify 迷你播放器**（可选）：游戏时控制音乐。
- 📦 **可安装 PWA**，带 Service Worker 缓存。

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 + Vite 8 + TypeScript |
| 后端 / 认证 | Firebase 11（Auth + Firestore） |
| 本地持久化 | `localStorage`（`bgt_v6`）+ IndexedDB（Firestore 离线） |
| 样式 | CSS 自定义属性 + Liquid Glass 设计 |
| i18n | 自研系统（`TRANSLATIONS` + `useT` hook） |
| 测试 | Playwright（多设备）+ Vitest |
| 部署 | Cloudflare Pages（`wrangler`） |

---

## 快速开始

```bash
npm install        # 安装依赖（或：pnpm install）
npm run dev        # 开发服务器 localhost:5173
npm run build      # 生产构建到 /dist
npm run preview    # 预览构建
npm run deploy     # 构建 + 部署到 Cloudflare Pages
```

### 测试

```bash
npm run test:unit  # Vitest 单元测试（jsdom）
npm run test       # Playwright E2E（需要开发服务器运行中）
npm run test:logic # Playwright 桌面逻辑套件
npm run test:layout# Playwright 多视口套件（7 个项目）
npm run test:fast  # logic + foldable-closed
npm run lint       # ESLint
```

### 不使用 `npm` 的本地验证

这台机器上推荐的本地流程：

```powershell
node .\scripts\verify-local.mjs
```

该运行器依次执行：

- `typecheck`
- `build`
- `vitest`
- Playwright **无浏览器**契约套件
- 针对 Settings/Champions/游戏开关的 Playwright 套件（自行启动 `vite preview`；主浏览器 `msedge`，失败时回退到内置 Chromium；如果两者都无法运行，会在 `test-results/local-verify/summary.json` 中报告，而不会与功能失败混淆）

如需用直接二进制运行单个步骤：

```powershell
node .\node_modules\eslint\bin\eslint.js .
node .\scripts\typecheck.mjs
node .\node_modules\vite\bin\vite.js build
node .\node_modules\vitest\vitest.mjs run
node .\node_modules\playwright\cli.js test --project=logic tests\reusable-switches.spec.js
```

`node .\scripts\typecheck.mjs` 会优先使用 `node_modules/typescript`，否则通过 `corepack pnpm dlx` 回退到临时工具链（本地缓存 `.corepack/`）。

---

## 项目结构

### 架构一览

```
entry (main.tsx)
  └─ routes (routes.tsx / routeLoaders.ts)   → 浏览器路由、入口守卫、预热
       └─ App.tsx                             → 外壳编排：hooks、context、layout
            └─ AppLayout.tsx                  → chrome：头部、底部导航、分区切换
                 ├─ HomeTab / GameDetail / Rules / Champs / Settings / Admin / History
                 └─ AppContext (context/AppContext.tsx) → 共享应用状态
```

- **路由**由 URL 驱动（`createBrowserRouter`），页面懒加载，加载器会预热深层链接以避免可见回退。
- **状态**放在聚焦的 hooks（`useTheme`、`useAuth`、`useMatches`、`useGameSession`、`useNavigation` 等）中，通过 `AppContext` 全局暴露。
- **数据**流经 `services/*`（Firestore 辅助）和 `lib/*`（存储、统计、彩带、Spotify 客户端）。
- **样式**是基于设计令牌的分层 CSS（`tokens → base → components → utilities`）；**不使用 CSS-in-JS**。
- **i18n** 是一个小型自研运行时：所有可见字符串都在 `src/data/translations/*.ts` 中，每个 key 都必须存在于**全部 6 种语言**中。

### 目录树

```
src/
├── App.tsx                    # 外壳编排：认证、主题、导航、context 接线
├── main.tsx                   # 入口点：RouterProvider + Service Worker 注册
├── routes/
│   ├── routes.tsx             # 浏览器路由 + 入口守卫 + 懒加载页面
│   └── routeLoaders.ts        # 深层链接预热/校验（shell、history、settings、游戏）
├── index.css                  # 样式入口（分层 CSS）
├── styles/
│   ├── tokens.css             # 设计令牌 + light/dark/oled 主题 + 强调模式
│   ├── base.css               # 重置 / 基础层
│   ├── components.css         # 组件层
│   └── utilities.css          # 工具类和视觉辅助
│
├── components/
│   ├── auth/                  # 登录、二维码扫描、用户搜索、邀请链接、关联玩家
│   ├── games/                 # 每个游戏一个 NewMatch 表单 + 共享计分输入
│   ├── home/                  # HomeTab：目录、筛选、hero 卡片、homeModel（视图模型）
│   ├── settings/              # 设置分区（主题、效果、语言、分组、账号）
│   ├── seo/SEO.tsx            # 每个路由的 meta 标签
│   └── ui/                    # 可复用：AppShell、AppHeader、GroupPicker、Toast、ThemeToggle 等
│
├── context/
│   └── AppContext.tsx         # 共享应用上下文（对局、分组、Spotify 偏好等）
│
├── data/
│   ├── games.ts               # GAMES 目录（id、名称、颜色、图标、标签）
│   ├── rules.ts               # RulesPage 的规则文案
│   ├── scoreTables.ts         # UNO 系列计分表
│   ├── sushiDo.ts             # Sushi Do! 常量/辅助
│   ├── portionFoods.ts        # 份量计数器的食物目录
│   └── translations/          # 6 种语言：es（默认）、en、de、fr、ja、zh
│
├── hooks/                     # useTheme、useAuth、useMatches、useGameSession、
│                              # useNavigation、useOnlineStatus、useWakeLock、useHaptic 等
├── lib/                       # storage、stats、confetti、firebase、inviteService、spotifyClient
├── pages/                     # GameDetail、HomeTab、Rules、Champs、History、Settings、Admin 等
├── services/                  # authService、userService、matchService（Firestore 辅助）
└── types.ts                   # 共享 TypeScript 类型
```

> **约定：** 触摸目标 ≥ 40px、使用 `100dvh`（绝不用 `100vh`）、交互元素带 `data-testid`、所有字符串放入 `TRANSLATIONS`、在需要的地方使用 `React.memo`/`useCallback` 记忆化、子函数在其父组件之前声明。

---

## 游戏目录（23 个可见游戏）

### UNO 系列
| ID | 名称 | 胜利条件 |
|----|------|----------|
| `uno` | UNO | 500 分 |
| `uno_no_mercy` | UNO No Mercy | 1000 分 + 仁慈规则 |
| `uno_flip` | UNO Flip | 500 分（明面/暗面） |
| `uno_dos` | DOS | 200 分 |

### 纸牌游戏
| ID | 名称 | 类型 |
|----|------|------|
| `truco` | Truco | 组队或个人，15/30 分 |
| `chancho` | Chancho | 按字母淘汰 |
| `esquinados` | Esquinados | 每轮胜者 |
| `chin` | Chin | 无牌 1v1 |
| `chinchon` | Chinchón | 淘汰制，100 分上限 |
| `canasta` | Canasta | 5000 分 · 组队或个人 |
| `sushi_do` | Sushi Do! | 500 分 · 每种口味 6 张 |
| `rummy` | Rummy | 500 分 · 组合 |
| `burako` | Burako | 2000 分 · 个人或组队 |

### 桌面游戏
| ID | 名称 | 胜利条件 |
|----|------|----------|
| `ajedrez` | 国际象棋 | 1v1，对局胜者 |
| `monopoly` | 大富翁 | 对局胜者 |
| `life` | 人生之旅 | 对局胜者 |

### 赌场与骰子
| ID | 名称 | 类型 |
|----|------|------|
| `poker` | 扑克 | 每轮胜者 |
| `blackjack` | 21 点 | 21，可选 CPU |
| `generala` | Generala | 5 骰组合 |

### 休闲
| ID | 名称 | 类型 |
|----|------|------|
| `racha_perdida` | 连胜记录器 | 记录中断的连胜 |
| `portion_counter` | 份量计数器 | 选择食物 + 简单计数 |
| `basta_dym` | Basta! | 3 张主题卡 · 每轮 A-Z 字母 |
| `custom` | 自由对局 | 自由 / 可配置计分 |

### Home / Games

- `HomeTab` 组合了顶部编辑区，包含 `featured` + `recent`。
- 只有 **Recent** 使用横向轨道；普通目录不复用可滚动轨道。
- `homeModel.ts` 避免视觉重复：已在顶部推广的游戏不会在同一视图的底部目录中再次渲染。
- Hero 封面使用一致的占位符和 `loading="lazy"`；如果图片失败，矢量 hero 仍作为回退。

### 内部隐藏 ID

`sushi`、`pizza`、`hamburguesa`、`pancho`、`empanadas`、`facturas`、`sanguchitos`、`cookies`、`otros_porciones` — 为兼容/历史保留并使用 `PorcionNewMatch`，但不会作为可见游戏出现在 Home 中。

---

## 数据架构

### localStorage（`bgt_v6`）

```js
{
  uno: [ /* 对局数组 */ ],
  truco: [ /* ... */ ],
  __theme: true,        // 遗留：已持久化的主题
  // ... 其余游戏 ID
}
```

### Firestore

```
users/{uid}/
  └── data: { 与 localStorage 结构相同 }

users/{uid}/shared_matches/
  └── {matchId}: {
        ...matchData,
        _gameId, _sharedBy, _sharedByUid, _sharedAt
      }
```

### 对局结构（UNO 示例）

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
  // 游戏专属字段...
}
```

---

## 国际化（i18n）

**语言：** `es`（默认）、`en`、`de`、`zh`、`ja`、`fr`

```js
// 在 App 中创建翻译函数并通过 context 共享
const t = useT(lang);
t("saveMatch");

// 绝不在 TRANSLATIONS 中调用 t()
// 绝不在组件中硬编码字符串
// 每个新 key 都必须存在于所有支持的语言中
```

检测：`detectLang()` → localStorage → `navigator.language` → 回退 `es`

现行决策：2026 年 5 月评估过 `i18next` / `react-i18next`。出于成本/收益和运行时简单性，当前决策是**保留自研系统**。参见 [`docs/decisions/i18n-evaluation-2026-05.md`](docs/decisions/i18n-evaluation-2026-05.md)。

---

## 路由与认证

```text
createBrowserRouter
  ├─ /                 → 应用外壳 + 预热加载器
  ├─ /login            → 显式认证入口
  ├─ /rules            → 规则
  ├─ /champions        → 冠军
  ├─ /settings         → 设置 + query 参数归一化
  ├─ /history          → 历史 + 筛选归一化
  ├─ /game/:gameId     → 当前游戏 + gameId 校验 + 懒加载预载
  └─ /admin            → ProtectedRoute → 应用外壳
```

### 访问流程

```text
/login
  ├─ authChecked=false → 认证加载中
  ├─ offline           → 全局横幅 + 本地模式（不承诺同步）
  ├─ Google OAuth
  ├─ 邮箱/密码 → LoginForm（useFormStatus + useOptimistic）
  └─ 访客模式 → 无云同步

/admin
  ├─ fbAuth.currentUser || bgt_last_uid → 可访问
  └─ 无会话 → 重定向到 /login
```

### 持久化与同步

- `src/services/authService.ts` 初始化 `setPersistence(fbAuth, indexedDBLocalPersistence)`。
- `src/hooks/useAuth.ts` 恢复会话、加载 `userdata/{uid}`、迁移遗留数据并吸收 `shared_matches`。
- `src/hooks/useMatches.ts` 每次变更后防抖（1200ms）并调用 `saveDataToCloud(uid, data)`。
- `src/hooks/useOnlineStatus.ts` 提供离线回退视觉。
- `src/routes/routeLoaders.ts` 在深层入口预热 `App` 和当前游戏，避免可见回退。

---

## 主题设置

### 颜色模式

- `bgt_theme_mode`：`light | dark | system`
- 激活主题是派生的：`system` 跟随操作系统，`dark` + `oled` 启用纯黑 OLED 表面（`bgt_oled`）。

### 强调色模式

强调色驱动应用的 **chrome**（底部导航活动胶囊、统计视图、活动控件），而**游戏卡片**和**游戏详情页**保留各自的游戏颜色。

- `bgt_theme_accent`：`default | monet | custom`
  - **默认** — 青色强调色（`#006d77`）。
  - **Monet** — Android 可用时的 Material You 颜色（bridge `android-dynamic-color`），带本地回退色板。
  - **自定义颜色** — 用户选择的任意十六进制（*设置 → 设置 → 应用主题*中的色板 + 自由取色器）。
- `bgt_theme_custom_accent`：用户选择的十六进制（`#rrggbb`）。
- 自定义十六进制以内联 `--theme-custom-accent` / `--theme-custom-on-accent`（on-accent 根据亮度推导）暴露，`html[data-theme-accent="custom"]` 通过 `color-mix` 为 light/dark/OLED 重建所有强调角色（容器、描边、导航胶囊、控件）。
- 登录用户会将 `themeAccent` / `themeCustomAccent` 同步到 `userdata/{uid}`（与 `spotifyPosition` 相同模式），并在其他设备上恢复。

`useTheme.ts` 将基础模式、强调色和 OLED 分开。Monet 使用 `DynamicThemeContract` + `data-theme-source="android-dynamic-color"`，不会伪装不存在的 Web API；自定义颜色是独立模式，不与 bridge 冲突。

在 CSS 中：

- `html[data-theme]` 控制 light/dark/oled 表面
- `html[data-theme-accent="monet"]` 将 `--accent-*` 重新映射到 Material 角色
- `html[data-theme-accent="custom"]` 从用户十六进制重新映射 `--accent-*`
- `html[data-theme-source="android-dynamic-color"]` 允许外部 bridge 注入 `--dynamic-*`

OLED 与 Monet/Custom 共存：OLED 主导中性色/表面，强调色继续为强调、焦点、胶囊和控件着色。

---

## Spotify 迷你播放器

Spotify 选项位于 *设置 → 设置*，**默认关闭**。启用后，应用会显示一个全局迷你播放器，支持 OAuth PKCE、Web Playback SDK 和 Spotify Web API：当前歌曲、艺术家、封面、活动设备、进度、可展开队列、实时音量、随机播放、循环、上一首/下一首、播放/暂停、已存歌曲同步、歌曲搜索、已存播放列表、断开连接，以及 SDK 注册 `device_id` 时转移到浏览器。滚动时播放器会折叠成带活动封面的悬浮按钮，点击后重新展开。

移动端：点击展开播放器外部会关闭它；滚动也会折叠。折叠「气泡」的位置可配置（居中、左、右、可拖动），并保存在 `bgt_spotify_position`（云端：`spotifyPosition`）。

要真正连接，需要配置 `VITE_SPOTIFY_CLIENT_ID` 和重定向 URI：

- 生产：`https://your-domain/settings`
- 本地开发：`http://127.0.0.1:5173/settings`（如果使用 `localhost`，再加 `http://localhost:5173/settings`）

Web 集成需要 Spotify **Premium** 账户。令牌保留在 `localStorage` 中，并在断开连接、退出登录或刷新被拒绝时删除。OAuth 回调会校验 `state`、一次性消费 `code_verifier`，并从 URL 清理 `code`/`state`/`error`。

Scopes：`streaming`、`user-read-playback-state`、`user-modify-playback-state`、`user-read-currently-playing`、`user-library-read`、`user-library-modify`、`playlist-read-private`、`playlist-read-collaborative`。在添加音乐库/播放列表之前授权的会话需要重新连接以授予这些权限。

---

## localStorage 键

| 键 | 用途 |
|----|------|
| `bgt_v6` | 主数据（对局 + 主题） |
| `bgt_theme_mode` | `"light"` / `"dark"` / `"system"` |
| `bgt_theme_accent` | `"default"` / `"monet"` / `"custom"` |
| `bgt_theme_custom_accent` | 自定义强调色十六进制（`#rrggbb`） |
| `bgt_spotify_enabled` | `"1"` / `"0"` |
| `bgt_spotify_position` | `"center"` / `"left"` / `"right"` / `"draggable"` |
| `bgt_spotify_tokens` | 本地 Spotify OAuth PKCE 令牌 |
| `bgt_spotify_code_verifier` | 临时 OAuth 登录验证器 |
| `bgt_spotify_oauth_state` | 临时 OAuth 登录状态 |
| `bgt_wakelock` | 屏幕常亮启用时为 `"1"` |
| `bgt_oled` | OLED 表面启用时为 `"1"` |
| `bgt_splash_seen` | 启动屏显示过后为 `"1"` |
| `bgt_lang` | 保存的语言 |
| `bgt_drafts` | 各游戏的进行中草稿（`{ [gameId]: draft }`） |
| `bgt_haptic` | 触觉反馈关闭时为 `"0"` |
| `bgt_reduce_effects` | 减少效果启用时为 `"1"` |
| `bgt_last_uid` | 有会话的最后一个 UID（会话提示） |
| `bgt_player_groups` | 已保存的玩家分组 |
| `bgt_last_group_v` | 每个游戏最后使用的分组 |
| `bgt_nav_order` | 底部导航顺序 |
| `bgt_onboarding_seen` | 引导完成后为 `"1"` |
| `bgt_guest_mode` / `bgt_guest_name` | 访客模式 / 访客名称 |
| `bgt_install_dismissed` / `_later` | 安装横幅忽略 |

### 备份与历史

*设置 → 设置 → 高级*可导出完整的 JSON 对局备份，并在另一台设备上导入（导入会用文件中的有效游戏键替换本地对局数据，然后走正常的持久化/同步流程）。历史视图也会将当前筛选结果（玩家、游戏、日期）导出为 JSON。

---

## PWA / Service Worker

- `public/sw.js`：资源 `CacheFirst`，Firestore 请求 `NetworkFirst`，规则/离线文档 `StaleWhileRevalidate`。
- `public/manifest.webmanifest`：可在 Android/iOS/Desktop 安装。
- 图标位于 `public/icons/`（16、32、180、192、512px）。
- 安全/CORS 头在 `public/_headers`（Cloudflare Pages），重定向在 `public/_redirects`。
- 已为部署的应用配置严格的内容安全策略（包含 Spotify WebSocket 域名）。

---

## 开发规则（重要）

```text
✅ 始终使用 100dvh（绝不用 100vh）
✅ 触摸目标最小 40px
✅ 完整文件（绝不是 diff）
✅ 子函数在父组件之前声明
✅ 在适当处使用 React.memo / useMemo / useCallback
✅ 交互元素带 data-testid
✅ 所有字符串放入 TRANSLATIONS（所有支持的语言）
❌ 禁止硬编码字符串
❌ 禁止在 TRANSLATIONS 中调用 t()
❌ 禁止模块间私有全局变量
❌ 禁止循环依赖
❌ 没有依据时禁止发明 Firestore 结构
```

---

## 关键 CSS 变量

```css
--bg        /* 主背景 */
--bg2       /* 次背景（卡片、弹窗） */
--tx        /* 主文本 */
--tx2       /* 次文本 */
--accent    /* 全局强调色 */
--gc        /* 游戏颜色（按活动游戏内联注入） */
--r         /* 基础圆角 */
--blur      /* backdrop-filter 模糊 */
--glass-border  /* liquid glass 边框 */
--nomercy   /* UNO No Mercy / 21 点专用色 */
```

---

## UNO 数据模型

UNO 系列（`uno`、`uno_no_mercy`、`uno_flip`、`uno_dos`）不再按败者收取剩余分数。每轮使用每种牌型的单一聚合输入，`SCORE_TABLES` 计算总分；该总分只记给当轮胜者。

UNO 草稿可以持久化：

- `roundInput`
- `inactivePlayers`
- `rosterEvents`

`rosterEvents` 记录带 `effectiveRound` 的非破坏性加入/离开事件。当玩家离开进行中的对局时，支持的默认行为是保留其记录，仅从未来的活动名单中移除；记分板保留其历史分数，胜者按钮只使用活动玩家。

---

## 管理员

- 管理员访问通过 Firebase 自定义声明 `{ admin: true }`（在 `useAuth.ts` 中通过 `token.claims.admin` 验证）。
- 从可信的 Firebase Admin 环境设置声明，并强制刷新 ID 令牌。
- 「Admin」导航项仅在声明为 `true` 时可见。
- `AdminPage.tsx` 管理特权操作。

---

## 添加新游戏

1. 创建 `src/components/games/NuevoJuegoNewMatch.tsx`
2. 在 `src/data/games.ts` → `GAMES` 对象中添加条目
3. 在 `src/data/translations/*.ts` 中为所有支持的语言添加新 key
4. 在 `games.ts` 中添加 `getTagline()` 映射
5. 在 `src/data/rules.ts` 中添加规则
6. 在 `GameDetail.tsx` 中导入组件并通过 `game.type` 连接
7. 添加到 `src/components/home/homeModel.ts` 中的对应分组

---

## 支持的设备（Playwright）

| 项目 | 视口 |
|------|------|
| `mobile-small` | 375×667 |
| `mobile-large` | 430×932 |
| `tablet` | 768×1024 |
| `foldable-open` | 717×512 |
| `foldable-closed` | 412×914 |
| `desktop` | 1280×800 |
| `layout-legacy` | 1280×800 |
| `logic` | 1280×800 |

测试位于 `./tests/` · 配置在 `playwright.config.js`
