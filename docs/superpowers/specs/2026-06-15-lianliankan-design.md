# 儿童版连连看 · 设计稿

> 状态：待 review
> 起草日期：2026-06-15
> 关联：6 岁儿童专注力训练系列（与舒尔特、数字迷宫、数字复述、Stroop 同流程）

## 目的

为"果果成长计划"添加一款儿童版连连看游戏，作为 6 岁儿童**视觉专注 + 选择性注意 + 路径规划**的训练载体。新增一个独立页面 `pages/game/lianliankan`，接入首页入口。

训练目标对应项目既有 5 大类专注力的其中 3 类：
- 视觉专注（在大量卡片中扫到目标图案）
- 选择性注意力（屏蔽已消除/无配对的卡片）
- 任务切换（搜索 → 路径规划 → 点击操作）

## 用户场景

- 孩子：6 岁，能坐住 10-15 分钟
- 单次时长：≤ 10 分钟（受 `rpx` 棋盘自适应 + 不限时机制保障）
- 形式：App 内点屏互动
- 阅读人：家长 / 孩子

## 设计决策摘要

| 决策点 | 取值 | 原因 |
|---|---|---|
| 路径规则 | 经典 ≤2 拐角（含棋盘外虚拟边界） | 用户选择 |
| 卡片内容 | 4 主题：水果 / 动物 / 交通 / 植物 | 用户选择 |
| 难度结构 | 固定 4×4 → 6×6 → 8×8 | 用户选择 |
| 计时 | 不计时 | 用户选择（不制造焦虑） |
| 提示机制 | 不提供 | 用户选择（6 岁孩子用提示会绕开训练本身） |
| 素材来源 | MiniMax 文生图 API，并发 4，每个主题独立 | 用户选择 |
| 实现方向 | 🅲 游戏页 + composable + 数据文件 | 用户选择（算法可单测，关注点分离） |

---

## 1. 架构总览

### 文件清单

| 路径 | 职责 |
|---|---|
| `src/pages/game/lianliankan.vue` | 游戏主页面：主题/关卡选择 + 棋盘渲染 + 点击交互 + 完成动效 |
| `src/composables/useLianliankanGame.ts` | 核心算法：棋盘生成、2 拐角路径查找、合法性校验、胜负判定 |
| `src/data/lianliankanThemeSpecs.ts` | 4 套主题的生成规格（id / 中文名 / prompt），≥32 条/主题 |
| `src/data/lianliankanThemes.ts` | 运行时主题数据：`Tile[]`，`image` 指向已下载的本地 PNG |
| `src/data/lianliankanLevels.ts` | 3 档关卡配置（4×4 / 6×6 / 8×8） |
| `src/static/lianliankan/{theme}/{id}.png` | 生成下载的图片（每主题 ≥32 张，进 git） |
| `scripts/generate-lianliankan-assets.mjs` | 素材生成脚本（读 specs → 调 API → 下载 → 写 themes.ts） |
| `src/pages.json` *(改)* | 注册 `pages/game/lianliankan` 路由 |
| `src/pages/index/index.vue` *(改)* | 首页加"连连看"入口卡片 |
| `src/composables/__tests__/useLianliankanGame.test.ts` | 算法层单元测试 |

### 模块边界

- **页面 (lianliankan.vue)** 只懂 UI：调用 `useLianliankanGame()` 返回 reactive 状态来渲染，不知道算法细节。
- **Composable (useLianliankanGame)** 是纯逻辑层：输入 `(rows, cols, themeIds)`，输出 `{ board, selected, selectCell, isGameOver, ... }`。不碰 DOM，不碰 uni API。
- **Themes / Levels** 是纯数据：导出常量数组，被页面和 composable 同时引用。
- **Specs → Themes** 是构建期一次性的转换路径：specs 描述意图，themes 描述生成产物。

### 数据流（一句话）

> 页面拿配置 → 创建 composable → 渲染棋盘 → 用户点击 → composable 内 `selectCell` → 命中合法配对则消除并更新棋盘 → `isGameOver` 变 true → 页面展示完成态 → 写入本地存储。

---

## 2. 数据结构

```ts
// 棋盘上的一个格子
export interface Cell {
  row: number;          // 0..rows-1
  col: number;          // 0..cols-1
  tileId: string | null; // null = 已消除
}

// 整张棋盘
export interface Board {
  rows: number;
  cols: number;
  cells: Cell[];        // 长度 = rows * cols，行优先展开
}

// 一对格子之间的连接路径（含中间拐点），用于在 UI 上画出"连线动画"
export interface Path {
  from: Cell;
  to: Cell;
  turns: Array<{ row: number; col: number }>; // 拐点坐标（含起终点共 3-4 个点）
}

// 一张图片牌
export interface Tile {
  id: string;           // 'fruit-apple', 'animal-cat' ...
  image: string;        // 本地相对路径 '/static/lianliankan/fruit/apple.png'
  label: string;        // 中文名 '苹果'，为未来'汉字主题'预留
}

// 主题
export interface Theme {
  id: 'fruit' | 'animal' | 'transport' | 'plant';
  name: string;         // '水果'
  icon: string;         // 顶部选择卡的 emoji
  tiles: Tile[];        // 该主题下可用图片牌数组（≥ 32）
}

// 关卡
export interface Level {
  id: 'easy' | 'medium' | 'hard';
  name: string;         // '入门 4×4'
  rows: number;
  cols: number;
  pairCount: number;    // 4×4=8, 6×6=18, 8×8=32
}
```

### 一致性约束

- 棋盘生成时 `rows * cols` 必须是偶数 —— 4×4 / 6×6 / 8×8 已满足。
- `pairCount = rows * cols / 2`。
- 主题 `tiles.length ≥ 32`，保证 8×8 关卡能抽到不重复的 32 对。
- 棋盘摆放时：每对的两张牌从 `theme.tiles` 里**无放回抽样**，再 Fisher-Yates 洗牌。

### 关卡与主题常量

```ts
// src/data/lianliankanLevels.ts
export const LEVELS: Level[] = [
  { id: 'easy',   name: '入门 4×4', rows: 4, cols: 4, pairCount: 8  },
  { id: 'medium', name: '进阶 6×6', rows: 6, cols: 6, pairCount: 18 },
  { id: 'hard',   name: '挑战 8×8', rows: 8, cols: 8, pairCount: 32 },
];
```

---

## 3. 棋盘生成算法

```ts
function generateBoard(level: Level, theme: Theme): Board {
  const { rows, cols, pairCount } = level;

  // 1) 不放回抽 pairCount 个 tile
  const sampled = pickRandom(theme.tiles, pairCount);

  // 2) 每张复制成一对 → 摊平成 pairCount*2 个
  const tileIds = sampled.flatMap(t => [t.id, t.id]);

  // 3) Fisher-Yates 洗牌
  for (let i = tileIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tileIds[i], tileIds[j]] = [tileIds[j], tileIds[i]];
  }

  // 4) 行优先铺成 cells
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, tileId: tileIds[r * cols + c] });
    }
  }
  return { rows, cols, cells };
}
```

`pickRandom` 用 Fisher-Yates 子集版：从 `arr` 中抽 `n` 个不重复元素。

---

## 4. 2 拐角路径算法（核心）

输入：格子 A、格子 B、当前棋盘。
输出：找到一条 ≤2 拐角的合法路径则返回 `Path`，否则 `null`。

### ① 0 拐角（同行 / 同列且中间无阻挡）

```
如果 A.row == B.row：检查 A 与 B 之间所有 cell.tileId == null → 是 → 返回直线 path
如果 A.col == B.col：同上，竖直方向
```

### ② 1 拐角（两个候选拐点）

```
对 pivot ∈ {(A.row, B.col), (B.row, A.col)}：
  若 pivot 处 tileId == null（要么原本空，要么已被消除）
  且 A→pivot 同方向无阻挡
  且 pivot→B 同方向无阻挡
  → 返回带 1 个拐点的 path
```

### ③ 2 拐角（经典"贴边绕"技巧）

扫描**虚拟边界列** `X ∈ [-1, cols]`：

```
对每个 X：
  假设拐点 pivot1 = (A.row, X)，pivot2 = (B.row, X)
  X=-1 或 X=cols 时视为"棋盘外虚拟空地"，永远可走
  三段都要 clear：
    A→pivot1  水平方向（A.row, A.col 与 X 之间无阻挡）
    pivot1→pivot2  垂直方向（X 列，A.row 与 B.row 之间无阻挡）
    pivot2→B  水平方向（B.row, X 与 B.col 之间无阻挡）
  → 返回 2 拐角 path
```

再扫**虚拟边界行** `Y ∈ [-1, rows]`，逻辑对称。

### `clear(row, c1, c2, 'h')` 定义

> 行号 = `row`，列范围 `[min(c1,c2)+1, max(c1,c2)-1]` 内所有 cell 必须 `tileId == null`。**端点 c1、c2 自身不算阻挡**（允许 X=-1 / X=cols 这种"棋盘外"端点）。

### 复杂度与边界

- `clear()` 单次 O(rows) 或 O(cols)，单对判定最坏 O(cols + rows)
- 4×4 单次判定 O(8)；8×8 单次 O(16) —— 均毫秒级
- 棋盘生成保证 `rows * cols` 为偶数
- **死局防御**：MVP 不做"自动重排"，靠 UI 的"换一局"按钮逃生

---

## 5. UI 流程

### 单页三态切换

```
STATE: 'setup'     进来时默认
┌──────────────────────────────────────┐
│  ← 连连看                              │
│                                        │
│  选关卡                                 │
│  [入门 4×4] [进阶 6×6] [挑战 8×8]      │
│                                        │
│  选主题                                 │
│  [🍎水果] [🐱动物] [🚗交通] [🌱植物]   │
│                                        │
│       [   开始游戏   ]                  │
└──────────────────────────────────────┘

STATE: 'playing'   开始后
┌──────────────────────────────────────┐
│  ← 入门 4×4 · 水果   [换一局]          │
│                                        │
│   ┌──┬──┬──┬──┐                        │
│   │🍎│🍌│🍇│🍊│                        │
│   ├──┼──┼──┼──┤                        │
│   │🍎│🍌│🍇│🍊│   ← 棋盘                │
│   └──┴──┴──┴──┘                        │
│                                        │
│   已消除 0 / 8  对                      │
└──────────────────────────────────────┘

STATE: 'done'      全部消除后
┌──────────────────────────────────────┐
│          🎉 太棒了！                    │
│       入门 4×4 · 水果                   │
│       用时 1 分 23 秒                   │
│                                        │
│   [再玩一次]  [换主题]  [回首页]         │
└──────────────────────────────────────┘
```

### 交互细节

| 场景 | 行为 |
|---|---|
| 点击已选中的牌 | 取消选中（高亮消失） |
| 点击第二张牌 | composable 内 `findPath`：合法 → 路径动画 + 消除；不合法 → 第二张牌 shake 200ms + 取消第一张选中 |
| 点击空格 / 已消除 | 无响应 |
| "换一局"按钮 | 同关卡 + 同主题，重新 `generateBoard`（用于 8×8 出死局时逃生） |
| 游戏中按左上 ← | `uni.showModal` 确认"放弃本局？" |
| 完成态 | 用时 = 从 setup→playing 起算到全部消除；不强制要求刷新页面才记录 |

### 视觉规范

- **棋盘容器**：`width: 100%; padding: 24rpx;` 用 flex 自动等分；外加 `border-radius: 16rpx` 背景浅灰
- **每张牌**：`aspect-ratio: 1; background: #fff; border-radius: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.06);` 图片 `object-fit: contain` 占满 80%
- **选中态**：`border: 4rpx solid #4F8CFF; transform: scale(1.08);` 过渡 150ms
- **shake 动画**（非法第二张）：CSS keyframes `translateX(-6rpx → 6rpx → -6rpx → 0)` 200ms
- **路径动画**：在棋盘上方叠一层 `<svg>` 绝对定位，line 元素用 `<animate>` 在 200ms 内从 A 描到 B（含拐点），完成后两张牌淡出 200ms
- **完成弹层**：全屏 `rgba(0,0,0,.4)` + 居中卡片，圆角 24rpx，"太棒了"emoji 120rpx，按钮用项目现有 `<van-button>` 风格
- **字号 / 间距**：遵循 `src/uni.scss` 全局变量，不引入新 SCSS 变量
- **单位**：统一 `rpx`（项目 Stylelint 强制）

### 视觉规范

- 主题卡 / 关卡卡：自定义 `<view class="card">`，**不**用 van-card（van-card 是商品卡）
- 按钮：用项目里 `<van-button>`（已在 `main.ts` 全局注册）
- 弹层：完成态用项目里 `<van-overlay>` + `<van-dialog>`，跟 `stroop.vue` 风格一致

### 不做的事（YAGNI）

- ❌ 排行榜 / 计时模式 / 提示按钮
- ❌ 撤销（`Ctrl+Z`）
- ❌ 多指 / 长按手势
- ❌ 声音 / 震动
- ❌ 主题包下载 / 在线更新

---

## 6. 素材生成管道

> 开发阶段执行 `npm run gen:lianliankan` 一次，把图片全部生成并落盘到 git。脚本保留以便后续替换单图重跑。

### 文件分工

| 文件 | 内容 | 是否进 git |
|---|---|---|
| `src/data/lianliankanThemeSpecs.ts` | 生成规格：`{id, label, prompt}`，每主题 ≥32 条 | ✅ |
| `src/data/lianliankanThemes.ts` | 运行时数据：`Tile[]`，`image` 是生成后填入的本地路径 | ✅ |
| `src/static/lianliankan/{theme}/{id}.png` | 生成下载的图片 | ✅ |
| `scripts/generate-lianliankan-assets.mjs` | Node 脚本（开发时跑） | ✅ |
| `src/static/lianliankan/_failed.json` | 生成失败清单（生成后人工处理） | ❌（进 .gitignore） |

### 主题生成规格示例

```ts
// src/data/lianliankanThemeSpecs.ts
export interface ThemeSpec {
  id: 'fruit' | 'animal' | 'transport' | 'plant';
  name: string;
  icon: string;
  items: Array<{ id: string; label: string; prompt: string }>;
}

export const THEME_SPECS: ThemeSpec[] = [
  {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    items: [
      { id: 'apple',  label: '苹果', prompt: 'A single cute cartoon apple, flat icon style, white background, child-friendly, centered, no text, no watermark' },
      { id: 'banana', label: '香蕉', prompt: 'A single cute cartoon banana, flat icon style, white background, child-friendly, centered, no text, no watermark' },
      // ... ≥32 条
    ],
  },
  // animal / transport / plant 同结构
];
```

### 运行时数据（脚本生成后）

```ts
// src/data/lianliankanThemes.ts —— 由脚本覆写
export const THEMES: Theme[] = [
  {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    tiles: [
      { id: 'fruit-apple',  image: '/static/lianliankan/fruit/apple.png',  label: '苹果' },
      { id: 'fruit-banana', image: '/static/lianliankan/fruit/banana.png', label: '香蕉' },
      // ... 32 条
    ],
  },
  // ...
];
```

### 脚本核心逻辑

```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { THEME_SPECS } from '../src/data/lianliankanThemeSpecs.ts';

const KEY = (await fs.readFile('docs/minimax/key', 'utf8')).trim();
const URL_API = 'https://api.minimaxi.com/v1/image_generation';
const CONCURRENCY = 4;

// 1) 并发池
async function runWithPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// 2) 单图生成（含 3 次重试）
async function genOne(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(URL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          model: 'image-01',
          prompt,
          aspect_ratio: '1:1',
          response_format: 'url',
          n: 1,
          prompt_optimizer: true,
        }),
      });
      const j = await r.json();
      if (j.base_resp?.status_code === 0) return j.data.image_urls[0];
      throw new Error(`status ${j.base_resp?.status_code}: ${j.base_resp?.status_msg}`);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

// 3) 下载到本地
async function download(url, dest) {
  const r = await fetch(url);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

// 4) 主流程：每个 theme 单独跑完再跑下一个
const failed = [];
for (const spec of THEME_SPECS) {
  console.log(`\n=== theme: ${spec.name} (${spec.items.length} items) ===`);
  await runWithPool(spec.items, CONCURRENCY, async (item) => {
    const dest = `src/static/lianliankan/${spec.id}/${item.id}.png`;
    if (await fs.access(dest).then(() => true).catch(() => false)) {
      console.log(`  ✓ skip ${item.id} (exists)`);
      return;
    }
    try {
      const url = await genOne(item.prompt);
      await download(url, dest);
      console.log(`  ✓ ${item.id}`);
    } catch (e) {
      console.error(`  ✗ ${item.id}: ${e.message}`);
      failed.push({ theme: spec.id, item: item.id, error: e.message });
    }
  });
}

// 5) 写失败清单 + 覆写运行时主题数据
await fs.writeFile('src/static/lianliankan/_failed.json', JSON.stringify(failed, null, 2));
await rewriteThemesTs();
console.log(`\nDone. ${failed.length} failed.`);
```

### 关键设计选择

- **每个 theme 单独启动并发池**（"每个种类分开生成"）：fruit 全部完成再跑 animal。不混跑，便于观察每个主题的进度与失败重试
- **断点续跑**：启动时扫描已存在的 PNG，跳过已下载的；只生成缺失的
- **失败不阻断**：单条失败记录到 `_failed.json`，其他继续
- **prompt 稳定**：每条 item prompt 不变 → 重跑结果可复现

### `package.json` 新增

```json
"scripts": {
  "gen:lianliankan": "node scripts/generate-lianliankan-assets.mjs"
}
```

### 注意事项

- ⚠️ API 返回的 url 仅 24h 有效 → 脚本**下载完成后立刻释放** URL，不缓存
- ⚠️ `docs/minimax/key` 在 `.gitignore` 中，不进 git
- ⚠️ 预计产物：128 张 PNG × ~300KB ≈ 35-40MB，常规 git 提交
- ⚠️ Node 版本 ≥ 18（用 `fetch` / `ArrayBuffer` / top-level await）

### 完成判定

- `src/static/lianliankan/{fruit,animal,transport,plant}/` 各 ≥32 张 PNG
- `src/data/lianliankanThemes.ts` 已生成且 `image` 字段都指向本地路径
- `_failed.json` 为空（或全部被人工处理）

---

## 7. 边界 + 错误处理

| 场景 | 处理 |
|---|---|
| 8×8 出死局 | "换一局"按钮始终可用；点击后保持关卡+主题不变，重新 `generateBoard`。MVP 不做自动检测死局 |
| 选中的两张牌不连通 | 路径未找到 → 第二张牌 shake 200ms + 取消第一张选中 |
| setup 态点空白 | 无响应 |
| 游戏中按返回 | `uni.showModal({ title: '放弃本局？' })` 确认后回 setup 态 |
| 完成态点棋盘 | 无响应（避免误触） |
| 完成后再点完成态按钮 | "再玩一次"= 重新 generateBoard 同关卡主题；"换主题"= 回 setup 态保留当前关卡；"回首页"= `uni.navigateBack` |
| `uni.setStorageSync` 失败 | try/catch 静默吞掉（跟现有 `shulte.vue` 同款） |
| `theme.tiles.length < pairCount` | `generateBoard` 入口 `throw new Error(...)`（开发者配置错误） |
| 首次进入无最佳记录 | 不显示任何对比、不提示"打破纪录" |

### 数据持久化

仅保存**每关+每主题**的最佳用时，**不在 setup 态展示**（避免变成排行榜 / 制造压力）。

```ts
// uni.setStorageSync('lianliankan-best', { 'easy_fruit': 83, 'medium_animal': 142, ... })
// 类型：Record<string /* `${levelId}_${themeId}` */, number /* 秒 */>
```

- 仅在 STATE: 'done' 切到完成态的瞬间写一次
- H5 / 微信小程序都通过 `uni.setStorageSync` 持久化（无需后端）

---

## 8. 测试策略

> 项目当前 `src/components/` 下无现成测试文件。本次首次引入单元测试。

### 范围
只测算法层，**不测 UI**。

### 文件
`src/composables/__tests__/useLianliankanGame.test.ts`

### 用例清单

**`generateBoard`**
- 返回 `rows * cols` 个 cell
- 恰好 `pairCount` 个不同的 `tileId`，每个出现**正好 2 次**
- 所有 `tileId` 都在传入 theme.tiles 内（不混入外部 tile）

**`findPath`** —— 给定一个手工摆放的最小棋盘（建议 2×4）跑以下 case
- 同行两牌中间无阻挡 → 返回 0 拐角 path
- 同行两牌中间有阻挡 → 返回 null
- 同列两牌中间无阻挡 → 返回 0 拐角 path
- 通过 1 个 pivot 拐 1 次消除 → 返回 1 拐角 path 且 pivot 正确
- pivot 上有阻挡 → 返回 null
- 借助棋盘外虚拟列消 2 拐角 → 返回 2 拐角 path
- `tileId` 不同 → 返回 null
- 同一格 / 任一格 `tileId == null` → 返回 null
- 起点终点不在 0 拐角直线上、pivot 被占、扫描虚拟边界也不通 → 返回 null

### 不测
- ❌ 页面渲染
- ❌ uni API 调用
- ❌ 计时精度

### 实施前置条件

`package.json` 需新增 `vitest` 依赖与 `npm run test` 脚本（项目当前未配测试框架）。

---

## 9. 完成的检查清单（实施前自验）

- [ ] `src/composables/useLianliankanGame.ts` 导出 `generateBoard` 和 `findPath` 为具名 export
- [ ] `src/data/lianliankanThemeSpecs.ts` 4 个主题，每个 ≥ 32 个 item
- [ ] `scripts/generate-lianliankan-assets.mjs` 可运行
- [ ] `npm run gen:lianliankan` 执行完成，128 张 PNG 已下载到 `src/static/lianliankan/`
- [ ] `src/data/lianliankanThemes.ts` 已由脚本生成
- [ ] `src/data/lianliankanLevels.ts` 3 档，pairCount = rows*cols/2
- [ ] `src/pages/game/lianliankan.vue` 三态切换可用，无 console error
- [ ] `src/pages.json` 注册新路由
- [ ] `src/pages/index/index.vue` 新增入口卡片
- [ ] `vitest` 已加入 devDependencies，`npm run test` 可用
- [ ] `src/composables/__tests__/useLianliankanGame.test.ts` 用例全部通过
- [ ] 所有文件 commit 到 git（包含 PNG 产物）

---

## 不在范围内（YAGNI）

- 不支持 6 岁以外年龄段调优
- 不做计时模式 / 提示按钮 / 撤销
- 不做声音 / 震动
- 不做主题包下载 / 在线更新
- 不做排行榜
- 不动现有 5 个游戏的代码（除首页加一个入口卡片）