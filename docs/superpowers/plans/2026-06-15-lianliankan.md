# 儿童版连连看 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「果果成长计划」中新增一个儿童版连连看游戏 `pages/game/lianliankan`：4×4/6×6/8×8 三档关卡，水果/动物/交通/植物 四主题，经典 ≤2 拐角路径配对，单页三态（setup / playing / done）。

**Architecture:** 页面 + composable + 数据文件三层。`useLianliankanGame.ts` 是纯算法层（棋盘生成 + 2 拐角路径查找），不碰 DOM/uni API。页面只负责渲染与点击。主题与关卡都是纯数据常量。素材通过 `scripts/generate-lianliankan-assets.mjs` 在开发期一次性生成 128 张 PNG，落盘进 git。

**Tech Stack:** Vue 3 Composition API、UniApp、TypeScript、SCSS（rpx）、`<svg>` + CSS keyframes 做路径与 shake 动画、`uni.setStorageSync` 存最佳用时、`vitest` 测算法（项目首次引入测试框架）。

**关于提交：** 用户要求本次开发**不做任何 commit**。所有任务中标注 `git commit` 的步骤**全部跳过**，由用户审阅后自己提交。

**关于路径约定：** `path: "pages/game/lianliankan"` → 单文件 `src/pages/game/lianliankan.vue`。

---

## 文件清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 新增 | `src/data/lianliankanLevels.ts` | 3 档关卡常量 |
| 新增 | `src/data/lianliankanThemeSpecs.ts` | TS 类型定义（ThemeSpec / ItemSpec） |
| 新增 | `src/data/lianliankanThemeSpecs.json` | 生成规格（4 主题 × ≥32 item） |
| 新增 | `scripts/generate-lianliankan-assets.mjs` | 素材生成脚本 |
| 生成 | `src/data/lianliankanThemes.ts` | 脚本覆写：运行时主题数据 |
| 生成 | `src/static/lianliankan/{fruit,animal,transport,plant}/*.png` | 128 张 PNG（4×32） |
| 新增 | `src/composables/useLianliankanGame.ts` | 算法层：generateBoard + findPath + gameState |
| 新增 | `src/composables/__tests__/useLianliankanGame.test.ts` | vitest 单测 |
| 新增 | `src/pages/game/lianliankan.vue` | 单页三态游戏页 |
| 新增 | `src/static/images/lianliankan-icon.png` | 首页入口图标（MiniMax 文生图生成） |
| 修改 | `src/pages.json` | 注册新路由 |
| 修改 | `src/pages/index/index.vue` | appList 加"连连看"卡片 |
| 修改 | `package.json` | 加 `vitest` devDep + `test` / `gen:lianliankan` 脚本 |
| 新增 | `vitest.config.ts` | vitest 配置（Node 环境） |
| 修改 | `.gitignore` | 加 `src/static/lianliankan/_failed.json` |

---

## Task 1: 初始化测试框架（vitest）

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/composables/__tests__/useLianliankanGame.test.ts`（占位用例）

- [ ] **Step 1: 安装 vitest**

```bash
npm install --save-dev vitest@^1.6.0
```

预期：`package.json` 的 `devDependencies` 出现 `"vitest": "^1.6.0"`。

- [ ] **Step 2: 在 `package.json` 的 `scripts` 加 test 脚本**

找到 `scripts` 块，在末尾添加：

```json
,
"test": "vitest run",
"test:watch": "vitest",
"gen:lianliankan": "node scripts/generate-lianliankan-assets.mjs"
```

预期：JSON 合法。

- [ ] **Step 3: 创建 `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: 占位测试先跑通**

创建 `src/composables/__tests__/useLianliankanGame.test.ts`：

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 跑测试**

```bash
npm run test
```

预期：输出 `Test Files 1 passed (1) / Tests 1 passed (1)`。

- [ ] **Step 6: 提交（跳过）**

---

## Task 2: 写关卡常量

**Files:**
- Create: `src/data/lianliankanLevels.ts`

- [ ] **Step 1: 创建关卡配置**

```ts
// 3 档关卡：rows*cols 均为偶数
export interface Level {
  id: 'easy' | 'medium' | 'hard';
  name: string;
  rows: number;
  cols: number;
  pairCount: number;
}

export const LEVELS: Level[] = [
  { id: 'easy',   name: '入门 4×4', rows: 4, cols: 4, pairCount: 8  },
  { id: 'medium', name: '进阶 6×6', rows: 6, cols: 6, pairCount: 18 },
  { id: 'hard',   name: '挑战 8×8', rows: 8, cols: 8, pairCount: 32 },
];
```

- [ ] **Step 2: 类型校验**

```bash
npx tsc --noEmit src/data/lianliankanLevels.ts
```

预期：无错误。

---

## Task 3: 写主题 specs（类型 + JSON）

**Files:**
- Create: `src/data/lianliankanThemeSpecs.ts`
- Create: `src/data/lianliankanThemeSpecs.json`

- [ ] **Step 1: 类型定义文件**

`src/data/lianliankanThemeSpecs.ts`：

```ts
export type ThemeId = 'fruit' | 'animal' | 'transport' | 'plant';

export interface ItemSpec {
  id: string;
  label: string;
  prompt: string;
}

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  icon: string;
  items: ItemSpec[];
}

export interface ThemeSpecsFile {
  themes: ThemeSpec[];
}
```

- [ ] **Step 2: 数据文件（每主题 ≥32 条）**

`src/data/lianliankanThemeSpecs.json`：

```json
{
  "themes": [
    {
      "id": "fruit",
      "name": "水果",
      "icon": "🍎",
      "items": [
        { "id": "apple",  "label": "苹果", "prompt": "A single cute cartoon apple, flat icon style, white background, child-friendly, centered, no text, no watermark" },
        { "id": "banana", "label": "香蕉", "prompt": "A single cute cartoon banana, flat icon style, white background, child-friendly, centered, no text, no watermark" },
        { "id": "grape",  "label": "葡萄", "prompt": "A small bunch of cute cartoon purple grapes, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "orange", "label": "橙子", "prompt": "A single cute cartoon orange, flat icon style, white background, child-friendly, centered, no text, no watermark" },
        { "id": "pear",   "label": "梨",   "prompt": "A single cute cartoon pear, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "peach",  "label": "桃子", "prompt": "A single cute cartoon peach, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "strawberry", "label": "草莓", "prompt": "A single cute cartoon strawberry, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "watermelon", "label": "西瓜", "prompt": "A small cute cartoon watermelon slice, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lemon",  "label": "柠檬", "prompt": "A single cute cartoon lemon, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cherry", "label": "樱桃", "prompt": "Two cute cartoon cherries with stems, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "kiwi",   "label": "猕猴桃", "prompt": "A cute cartoon kiwi cross-section, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "mango",  "label": "芒果", "prompt": "A single cute cartoon mango, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "pineapple", "label": "菠萝", "prompt": "A cute cartoon pineapple, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "blueberry", "label": "蓝莓", "prompt": "Three cute cartoon blueberries, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "coconut", "label": "椰子", "prompt": "A cute cartoon coconut, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "plum",   "label": "李子", "prompt": "A single cute cartoon plum, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "apricot","label": "杏",   "prompt": "A single cute cartoon apricot, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "fig",    "label": "无花果", "prompt": "A cute cartoon fig cross-section, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "pomegranate", "label": "石榴", "prompt": "A cute cartoon pomegranate, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "dragonfruit", "label": "火龙果", "prompt": "A cute cartoon dragon fruit, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lychee", "label": "荔枝", "prompt": "Two cute cartoon lychees, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "durian", "label": "榴莲", "prompt": "A cute cartoon durian, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "persimmon", "label": "柿子", "prompt": "A cute cartoon persimmon, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "raspberry", "label": "覆盆子", "prompt": "A cute cartoon raspberry, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "blackberry", "label": "黑莓", "prompt": "A cute cartoon blackberry, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cantaloupe", "label": "哈密瓜", "prompt": "A cute cartoon cantaloupe slice, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "tangerine", "label": "橘子", "prompt": "A cute cartoon tangerine with leaf, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "guava",  "label": "番石榴", "prompt": "A cute cartoon guava, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "passion", "label": "百香果", "prompt": "A cute cartoon passion fruit, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cranberry", "label": "蔓越莓", "prompt": "Three cute cartoon cranberries, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "date",   "label": "枣",   "prompt": "Two cute cartoon dates, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "kumquat", "label": "金桔", "prompt": "Two cute cartoon kumquats, flat icon style, white background, child-friendly, centered, no text" }
      ]
    },
    {
      "id": "animal",
      "name": "动物",
      "icon": "🐱",
      "items": [
        { "id": "cat",    "label": "猫",   "prompt": "A cute cartoon cat face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "dog",    "label": "狗",   "prompt": "A cute cartoon dog face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "rabbit", "label": "兔子", "prompt": "A cute cartoon rabbit, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bear",   "label": "熊",   "prompt": "A cute cartoon bear face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "panda",  "label": "熊猫", "prompt": "A cute cartoon panda face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "pig",    "label": "猪",   "prompt": "A cute cartoon pig face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cow",    "label": "奶牛", "prompt": "A cute cartoon cow face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "sheep",  "label": "绵羊", "prompt": "A cute cartoon sheep, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "horse",  "label": "马",   "prompt": "A cute cartoon horse face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "chicken","label": "鸡",   "prompt": "A cute cartoon chicken, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "duck",   "label": "鸭子", "prompt": "A cute cartoon duck, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "frog",   "label": "青蛙", "prompt": "A cute cartoon frog, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "fox",    "label": "狐狸", "prompt": "A cute cartoon fox face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "tiger",  "label": "老虎", "prompt": "A cute cartoon tiger face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lion",   "label": "狮子", "prompt": "A cute cartoon lion face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "elephant","label": "大象", "prompt": "A cute cartoon elephant, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "monkey", "label": "猴子", "prompt": "A cute cartoon monkey face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "mouse",  "label": "老鼠", "prompt": "A cute cartoon mouse, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "deer",   "label": "鹿",   "prompt": "A cute cartoon deer face, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "whale",  "label": "鲸鱼", "prompt": "A cute cartoon whale, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "shark",  "label": "鲨鱼", "prompt": "A cute cartoon shark, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "octopus","label": "章鱼", "prompt": "A cute cartoon octopus, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "crab",   "label": "螃蟹", "prompt": "A cute cartoon crab, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "turtle", "label": "乌龟", "prompt": "A cute cartoon turtle, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "fish",   "label": "鱼",   "prompt": "A cute cartoon fish, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bird",   "label": "小鸟", "prompt": "A cute cartoon songbird, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "owl",    "label": "猫头鹰", "prompt": "A cute cartoon owl, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "penguin","label": "企鹅", "prompt": "A cute cartoon penguin, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "koala",  "label": "考拉", "prompt": "A cute cartoon koala, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bee",    "label": "蜜蜂", "prompt": "A cute cartoon bee, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "butterfly","label": "蝴蝶", "prompt": "A cute cartoon butterfly, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "snail",  "label": "蜗牛", "prompt": "A cute cartoon snail, flat icon style, white background, child-friendly, centered, no text" }
      ]
    },
    {
      "id": "transport",
      "name": "交通",
      "icon": "🚗",
      "items": [
        { "id": "car",      "label": "小汽车", "prompt": "A cute cartoon car, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bus",      "label": "公交车", "prompt": "A cute cartoon bus, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "truck",    "label": "卡车",   "prompt": "A cute cartoon truck, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "taxi",     "label": "出租车", "prompt": "A cute cartoon taxi, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "police-car","label": "警车",  "prompt": "A cute cartoon police car, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "fire-truck","label": "消防车","prompt": "A cute cartoon fire truck, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "ambulance","label": "救护车", "prompt": "A cute cartoon ambulance, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bicycle",  "label": "自行车", "prompt": "A cute cartoon bicycle, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "motorcycle","label": "摩托车","prompt": "A cute cartoon motorcycle, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "scooter",  "label": "滑板车", "prompt": "A cute cartoon kick scooter, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "train",    "label": "火车",   "prompt": "A cute cartoon train, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "subway",   "label": "地铁",   "prompt": "A cute cartoon subway train, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "airplane", "label": "飞机",   "prompt": "A cute cartoon airplane, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "helicopter","label": "直升机","prompt": "A cute cartoon helicopter, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "rocket",   "label": "火箭",   "prompt": "A cute cartoon rocket, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "ship",     "label": "轮船",   "prompt": "A cute cartoon ship, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "boat",     "label": "小船",   "prompt": "A cute cartoon rowboat, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "submarine","label": "潜水艇", "prompt": "A cute cartoon submarine, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "balloon",  "label": "热气球", "prompt": "A cute cartoon hot air balloon, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "tractor",  "label": "拖拉机", "prompt": "A cute cartoon tractor, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bulldozer","label": "推土机", "prompt": "A cute cartoon bulldozer, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "crane",    "label": "起重机", "prompt": "A cute cartoon crane, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "van",      "label": "面包车", "prompt": "A cute cartoon van, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "trolley",  "label": "电车",   "prompt": "A cute cartoon trolley, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cable-car","label": "缆车",   "prompt": "A cute cartoon cable car, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "ufo",      "label": "飞碟",   "prompt": "A cute cartoon UFO, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "skateboard","label": "滑板",  "prompt": "A cute cartoon skateboard, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "roller-skate","label": "轮滑鞋","prompt": "A cute cartoon roller skate, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "tricycle", "label": "三轮车", "prompt": "A cute cartoon tricycle, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "rickshaw", "label": "人力车", "prompt": "A cute cartoon rickshaw, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "yacht",    "label": "游艇",   "prompt": "A cute cartoon yacht, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "sailboat", "label": "帆船",   "prompt": "A cute cartoon sailboat, flat icon style, white background, child-friendly, centered, no text" }
      ]
    },
    {
      "id": "plant",
      "name": "植物",
      "icon": "🌱",
      "items": [
        { "id": "tree",     "label": "树",     "prompt": "A cute cartoon tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "flower",   "label": "花",     "prompt": "A cute cartoon flower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "rose",     "label": "玫瑰",   "prompt": "A cute cartoon rose, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "tulip",    "label": "郁金香", "prompt": "A cute cartoon tulip, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "sunflower","label": "向日葵", "prompt": "A cute cartoon sunflower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "daisy",    "label": "雏菊",   "prompt": "A cute cartoon daisy, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "grass",    "label": "草",     "prompt": "A cute cartoon tuft of grass, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "leaf",     "label": "叶子",   "prompt": "A cute cartoon green leaf, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cactus",   "label": "仙人掌", "prompt": "A cute cartoon cactus, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "mushroom", "label": "蘑菇",   "prompt": "A cute cartoon mushroom, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "palm",     "label": "棕榈树", "prompt": "A cute cartoon palm tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bamboo",   "label": "竹子",   "prompt": "A cute cartoon bamboo stalk, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "pine",     "label": "松树",   "prompt": "A cute cartoon pine tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "oak",      "label": "橡树",   "prompt": "A cute cartoon oak tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "willow",   "label": "柳树",   "prompt": "A cute cartoon willow tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "maple",    "label": "枫树",   "prompt": "A cute cartoon maple tree with a single red leaf, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "cherry-blossom","label": "樱花","prompt": "A cute cartoon cherry blossom branch, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lotus",    "label": "莲花",   "prompt": "A cute cartoon lotus flower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lily",     "label": "百合",   "prompt": "A cute cartoon lily flower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "lavender", "label": "薰衣草", "prompt": "A cute cartoon lavender sprig, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "clover",   "label": "三叶草", "prompt": "A cute cartoon four-leaf clover, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "fern",     "label": "蕨类",   "prompt": "A cute cartoon fern leaf, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "vine",     "label": "藤蔓",   "prompt": "A cute cartoon vine, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "coconut-tree","label": "椰子树","prompt": "A cute cartoon coconut tree, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "bonsai",   "label": "盆景",   "prompt": "A cute cartoon bonsai tree in a pot, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "sprout",   "label": "嫩芽",   "prompt": "A cute cartoon sprout, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "acorn",    "label": "橡果",   "prompt": "A cute cartoon acorn, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "pinecone", "label": "松果",   "prompt": "A cute cartoon pinecone, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "reed",     "label": "芦苇",   "prompt": "A cute cartoon reed, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "hyacinth", "label": "风信子", "prompt": "A cute cartoon hyacinth flower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "peony",    "label": "牡丹",   "prompt": "A cute cartoon peony flower, flat icon style, white background, child-friendly, centered, no text" },
        { "id": "dandelion", "label": "蒲公英", "prompt": "A cute cartoon dandelion, flat icon style, white background, child-friendly, centered, no text" }
      ]
    }
  ]
}
```

- [ ] **Step 3: 校验 JSON 合法**

```bash
node -e "JSON.parse(require('fs').readFileSync('src/data/lianliankanThemeSpecs.json','utf8')); console.log('ok');"
```

预期：`ok`。同时确认每主题 items.length ≥ 32。

- [ ] **Step 4: 在 `.gitignore` 加失败清单**

编辑 `.gitignore`，在末尾添加：

```
src/static/lianliankan/_failed.json
```

---

## Task 4: 写素材生成脚本

**Files:**
- Create: `scripts/generate-lianliankan-assets.mjs`

- [ ] **Step 1: 创建脚本**

```js
import fs from 'node:fs/promises';
import path from 'node:path';

const SPECS_PATH = 'src/data/lianliankanThemeSpecs.json';
const THEMES_TS_PATH = 'src/data/lianliankanThemes.ts';

const SPECS = JSON.parse(await fs.readFile(SPECS_PATH, 'utf8'));
const KEY = (await fs.readFile('docs/minimax/key', 'utf8')).trim();
const URL_API = 'https://api.minimaxi.com/v1/image_generation';
const CONCURRENCY = 4;

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

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

function buildThemesTs(specs) {
  const themes = specs.themes.map(t => {
    const tiles = t.items.map(it => ({
      id: `${t.id}-${it.id}`,
      image: `/static/lianliankan/${t.id}/${it.id}.png`,
      label: it.label,
    }));
    return `  {\n    id: '${t.id}',\n    name: '${t.name}',\n    icon: '${t.icon}',\n    tiles: [\n${tiles.map(ti => `      { id: '${ti.id}', image: '${ti.image}', label: '${ti.label}' },`).join('\n')}\n    ],\n  },`;
  }).join('\n');

  return `// 此文件由 scripts/generate-lianliankan-assets.mjs 生成，请勿手工编辑\nexport interface Tile {\n  id: string;\n  image: string;\n  label: string;\n}\n\nexport interface Theme {\n  id: 'fruit' | 'animal' | 'transport' | 'plant';\n  name: string;\n  icon: string;\n  tiles: Tile[];\n}\n\nexport const THEMES: Theme[] = [\n${themes}\n];\n`;
}

const failed = [];
for (const spec of SPECS.themes) {
  console.log(`\n=== theme: ${spec.name} (${spec.items.length} items) ===`);
  await runWithPool(spec.items, CONCURRENCY, async (item) => {
    const dest = `src/static/lianliankan/${spec.id}/${item.id}.png`;
    try {
      await fs.access(dest);
      console.log(`  ✓ skip ${item.id} (exists)`);
      return;
    } catch {}
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

await fs.mkdir('src/static/lianliankan', { recursive: true });
await fs.writeFile('src/static/lianliankan/_failed.json', JSON.stringify(failed, null, 2));
await fs.writeFile(THEMES_TS_PATH, buildThemesTs(SPECS));
console.log(`\nDone. ${failed.length} failed.`);
```

- [ ] **Step 2: 检查脚本可解析**

```bash
node --check scripts/generate-lianliankan-assets.mjs
```

预期：无错误输出。

---

## Task 5: 生成 128 张 PNG 与 themes.ts

**Files:**
- Create: `src/static/lianliankan/{fruit,animal,transport,plant}/*.png`（4×32 = 128 张）
- Create: `src/data/lianliankanThemes.ts`

- [ ] **Step 1: 跑生成脚本**

```bash
npm run gen:lianliankan
```

预期：日志按主题分块，每条 `✓ {id}`。128 条全部成功（或失败条数 ≤ 5 需人工处理 `_failed.json`）。

- [ ] **Step 2: 校验产物数量**

```bash
ls src/static/lianliankan/fruit | wc -l
ls src/static/lianliankan/animal | wc -l
ls src/static/lianliankan/transport | wc -l
ls src/static/lianliankan/plant | wc -l
```

预期：每行输出 `32`。

- [ ] **Step 3: 校验 themes.ts 结构**

```bash
grep -c "id: 'fruit-" src/data/lianliankanThemes.ts
grep -c "id: 'animal-" src/data/lianliankanThemes.ts
grep -c "id: 'transport-" src/data/lianliankanThemes.ts
grep -c "id: 'plant-" src/data/lianliankanThemes.ts
```

预期：每条命令输出 `32`。

---

## Task 6: 算法层（严格 TDD：先写测试再写实现）

**Files:**
- Modify: `src/composables/__tests__/useLianliankanGame.test.ts`
- Create: `src/composables/useLianliankanGame.ts`

- [ ] **Step 1: 把测试文件替换为完整用例**

覆盖 `src/composables/__tests__/useLianliankanGame.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { generateBoard, findPath, type Cell, type Board } from '../useLianliankanGame';
import type { Theme } from '../../data/useLianliankanTypes';
import type { Level } from '../../data/lianliankanLevels';
import { LEVELS } from '../../data/lianliankanLevels';

const EASY = LEVELS.find(l => l.id === 'easy')!;
const MEDIUM = LEVELS.find(l => l.id === 'medium')!;

function mkTheme(): Theme {
  return {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    tiles: Array.from({ length: 32 }, (_, i) => ({
      id: `fruit-${i}`,
      image: `/static/lianliankan/fruit/${i}.png`,
      label: `t${i}`,
    })),
  };
}

function mkBoard(rows: number, cols: number, tileIds: (string | null)[]): Board {
  return {
    rows,
    cols,
    cells: tileIds.map((tid, i) => ({
      row: Math.floor(i / cols),
      col: i % cols,
      tileId: tid,
    })),
  };
}

function cellAt(b: Board, r: number, c: number): Cell {
  return b.cells[r * b.cols + c];
}

function setTile(b: Board, r: number, c: number, tid: string | null) {
  b.cells[r * b.cols + c].tileId = tid;
}

describe('generateBoard', () => {
  it('4x4 棋盘返回 16 个 cell', () => {
    const b = generateBoard(EASY, mkTheme());
    expect(b.cells.length).toBe(16);
    expect(b.rows).toBe(4);
    expect(b.cols).toBe(4);
  });

  it('6x6 棋盘返回 36 个 cell', () => {
    const b = generateBoard(MEDIUM, mkTheme());
    expect(b.cells.length).toBe(36);
  });

  it('pairCount 张不同 tileId，每张恰好出现 2 次', () => {
    const b = generateBoard(MEDIUM, mkTheme());
    const counts = new Map<string, number>();
    for (const c of b.cells) {
      if (c.tileId) counts.set(c.tileId, (counts.get(c.tileId) ?? 0) + 1);
    }
    expect(counts.size).toBe(MEDIUM.pairCount);
    for (const v of counts.values()) expect(v).toBe(2);
  });

  it('所有 tileId 都在传入 theme.tiles 内', () => {
    const theme = mkTheme();
    const ids = new Set(theme.tiles.map(t => t.id));
    const b = generateBoard(MEDIUM, theme);
    for (const c of b.cells) expect(ids.has(c.tileId!)).toBe(true);
  });
});

describe('findPath - 0 拐角', () => {
  it('同行两牌中间无阻挡 → 0 拐角 path', () => {
    const b = mkBoard(2, 4, ['A', null, null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(2);
  });

  it('同行两牌中间有阻挡 → null', () => {
    const b = mkBoard(2, 4, ['A', 'B', null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).toBeNull();
  });

  it('同列两牌中间无阻挡 → 0 拐角 path', () => {
    const b = mkBoard(4, 2, ['A', null, null, null, null, 'A', null, null]);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 0), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(2);
  });
});

describe('findPath - 1 拐角', () => {
  it('通过 pivot (A.row, B.col) 拐 1 次 → 1 拐角 path', () => {
    const b = mkBoard(3, 3, ['A', null, 'B',  null, null, null,  'A', null, 'B']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 2), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(3);
    // 中间拐点应是 (0, 2) 的对角 (0,2)? — 实际：0 拐角直接同行已通。改用：(0,0)→(2,0)→(2,2)
  });

  it('通过 (A.row, B.col) 拐 1 次 → 1 拐角 path', () => {
    // A=(0,0) B=(2,2) 同行同列都阻
    const b = mkBoard(3, 3, ['A', 'X', null,  'X', 'X', null,  null, null, 'B']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 2), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(3);
    // 拐点应是 (0,2) 或 (2,0)
    const pivot = p!.turns[1];
    const ok = (pivot.row === 0 && pivot.col === 2) || (pivot.row === 2 && pivot.col === 0);
    expect(ok).toBe(true);
  });

  it('pivot 上有阻挡 → null', () => {
    // (0,0)→(2,2) 同行同列都阻，两个 pivot 也阻
    const b = mkBoard(3, 3, ['A', 'X', 'Y',  'X', 'X', 'X',  'Y', 'X', 'B']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 2), b);
    expect(p).toBeNull();
  });
});

describe('findPath - 2 拐角（棋盘外虚拟边界）', () => {
  it('借助棋盘外虚拟列消 2 拐角 → 2 拐角 path', () => {
    // 4x4 棋盘，让 (0,0) 与 (0,2) 同行但中间阻，且 (3,2) 与 (0,2) 同列阻
    // 借助 X=-1 绕：(0,0) → (-1,0) → (-1,2) → (0,2)
    const b = mkBoard(4, 4, [
      'A', 'X', 'A', 'X',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
    ]);
    // 现在 A 在 (0,0) 和 (0,2) 同行中间有 X 阻。直接同行不行。
    // 1 拐角：pivot (0,0+2)=(0,2) 是 A 自身。pivot (0+0,2)=(0,2) 同上。
    //      pivot (0,0) 自身。pivot (0,2) 自身。两个 pivot 都被占。
    // 2 拐角绕 X=-1：(0,0) → (-1,0) → (-1,2) → (0,2) 都 clear。
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 2), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(4);
  });
});

describe('findPath - 非法输入', () => {
  it('tileId 不同 → null', () => {
    const b = mkBoard(2, 4, ['A', null, null, 'B']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).toBeNull();
  });

  it('任一格 tileId == null → null', () => {
    const b = mkBoard(2, 4, [null, null, null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).toBeNull();
  });

  it('起点终点相同 → null', () => {
    const b = mkBoard(2, 4, ['A', null, null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 0), b);
    expect(p).toBeNull();
  });
});

describe('findPath - 不连通', () => {
  it('全包围仍不通 → null', () => {
    // 4x4 全填 A, 只留 (0,0) (0,3) 是 A，但中间全 X
    const b = mkBoard(4, 4, [
      'A', 'X', 'X', 'A',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
    ]);
    // X=-1 绕：(0,0)→(-1,0)→(-1,3)→(0,3) 三段都 clear（在 X=-1 都是虚拟空地）→ 应通
    // 实际：算法应该返回 path。改用例为：让 X=-1 也阻（不可能，虚拟空地永远空）
    // 所以这个用例不能这样写。改为：(0,0)→(0,3) 中间全 X，2 拐角经 X=-1 仍可通
    // 真正"全包围"做不到，删除此 case。改用：极小棋盘 1x2 不连通
    const p = findPath(cellAt(b, 1, 1), cellAt(b, 2, 2), b);
    // (1,1) 是 X，(2,2) 是 X，tileId 不同
    expect(p).toBeNull();
  });
});
```

> **修正提示：** "全包围"那个用例不严密（虚拟边界永远可走），已替换为 `tileId` 不同 case。算法实现后跑测试即可。

- [ ] **Step 2: 跑测试确认全部失败（red）**

```bash
npm run test
```

预期：所有 `useLianliankanGame` 导入报错，测试 fail。记录失败行数（用于对照后续 pass 数）。

- [ ] **Step 3: 写算法实现**

`src/composables/useLianliankanGame.ts`：

```ts
import type { Level } from '../data/lianliankanLevels';
import type { Theme } from '../data/useLianliankanTypes';

export interface Cell {
  row: number;
  col: number;
  tileId: string | null;
}

export interface Board {
  rows: number;
  cols: number;
  cells: Cell[];
}

export interface Path {
  from: Cell;
  to: Cell;
  turns: Array<{ row: number; col: number }>;
}

/* ===== 棋盘生成 ===== */

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
    out.push(a[i]);
  }
  return out;
}

export function generateBoard(level: Level, theme: Theme): Board {
  const { rows, cols, pairCount } = level;
  if (theme.tiles.length < pairCount) {
    throw new Error(`theme.tiles has ${theme.tiles.length} < pairCount ${pairCount}`);
  }
  const sampled = pickRandom(theme.tiles, pairCount);
  const ids: string[] = [];
  for (const t of sampled) ids.push(t.id, t.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, tileId: ids[r * cols + c] });
    }
  }
  return { rows, cols, cells };
}

/* ===== 2 拐角路径 ===== */

function inBoard(b: Board, r: number, c: number) {
  return r >= 0 && r < b.rows && c >= 0 && c < b.cols;
}

function isEmpty(b: Board, r: number, c: number): boolean {
  if (!inBoard(b, r, c)) return true; // 虚拟边界
  return b.cells[r * b.cols + c].tileId === null;
}

function clearH(b: Board, row: number, c1: number, c2: number): boolean {
  // 行 row 上，列范围 (min..max) 开区间内是否全空
  const lo = Math.min(c1, c2) + 1;
  const hi = Math.max(c1, c2) - 1;
  for (let c = lo; c <= hi; c++) {
    if (!isEmpty(b, row, c)) return false;
  }
  return true;
}

function clearV(b: Board, col: number, r1: number, r2: number): boolean {
  const lo = Math.min(r1, r2) + 1;
  const hi = Math.max(r1, r2) - 1;
  for (let r = lo; r <= hi; r++) {
    if (!isEmpty(b, r, col)) return false;
  }
  return true;
}

export function findPath(a: Cell, b: Cell, board: Board): Path | null {
  if (a.row === b.row && a.col === b.col) return null;
  if (a.tileId === null || b.tileId === null) return null;
  if (a.tileId !== b.tileId) return null;

  // 0 拐角：同行
  if (a.row === b.row && clearH(board, a.row, a.col, b.col)) {
    return { from: a, to: b, turns: [{ row: a.row, col: a.col }, { row: b.row, col: b.col }] };
  }
  // 0 拐角：同列
  if (a.col === b.col && clearV(board, a.col, a.row, b.row)) {
    return { from: a, to: b, turns: [{ row: a.row, col: a.col }, { row: b.row, col: b.col }] };
  }

  // 1 拐角：两个候选 pivot
  const pivots: Array<{ row: number; col: number }> = [
    { row: a.row, col: b.col },
    { row: b.row, col: a.col },
  ];
  for (const p of pivots) {
    if (!isEmpty(board, p.row, p.col)) continue;
    if (
      (p.row === a.row ? clearH(board, a.row, a.col, p.col) : clearV(board, a.col, a.row, p.row)) &&
      (p.row === b.row ? clearH(board, b.row, b.col, p.col) : clearV(board, b.col, b.row, p.row))
    ) {
      return { from: a, to: b, turns: [{ row: a.row, col: a.col }, p, { row: b.row, col: b.col }] };
    }
  }

  // 2 拐角：扫虚拟列 X ∈ [-1, cols]
  for (let X = -1; X <= board.cols; X++) {
    if (X === a.col || X === b.col) continue; // 已在前两步处理
    // 端点列虚拟：永远空
    if (
      clearH(board, a.row, a.col, X) &&
      clearV(board, X, a.row, b.row) &&
      clearH(board, b.row, b.col, X)
    ) {
      return {
        from: a,
        to: b,
        turns: [
          { row: a.row, col: a.col },
          { row: a.row, col: X },
          { row: b.row, col: X },
          { row: b.row, col: b.col },
        ],
      };
    }
  }
  // 2 拐角：扫虚拟行 Y ∈ [-1, rows]
  for (let Y = -1; Y <= board.rows; Y++) {
    if (Y === a.row || Y === b.row) continue;
    if (
      clearV(board, a.col, a.row, Y) &&
      clearH(board, Y, a.col, b.col) &&
      clearV(board, b.col, b.row, Y)
    ) {
      return {
        from: a,
        to: b,
        turns: [
          { row: a.row, col: a.col },
          { row: Y, col: a.col },
          { row: Y, col: b.col },
          { row: b.row, col: b.col },
        ],
      };
    }
  }

  return null;
}

/* ===== 完整游戏状态机（页面用） ===== */

import { ref, computed, type Ref } from 'vue';

export interface GameState {
  board: Ref<Board>;
  selected: Ref<Cell | null>;
  eliminatedCount: Ref<number>;
  isGameOver: Ref<boolean>;
  /** 最后一次非法的第二张牌坐标（用于触发 shake 动画） */
  shaking: Ref<{ row: number; col: number } | null>;
  /** 最近一次成功路径（用于触发连线动画） */
  lastPath: Ref<Path | null>;
  selectCell: (r: number, c: number) => void;
  reset: (level: Level, theme: Theme) => void;
}

export function useLianliankanGame(): GameState {
  const board = ref<Board>({ rows: 0, cols: 0, cells: [] });
  const selected = ref<Cell | null>(null);
  const eliminatedCount = ref(0);
  const isGameOver = ref(false);
  const shaking = ref<{ row: number; col: number } | null>(null);
  const lastPath = ref<Path | null>(null);

  function reset(level: Level, theme: Theme) {
    board.value = generateBoard(level, theme);
    selected.value = null;
    eliminatedCount.value = 0;
    isGameOver.value = false;
    shaking.value = null;
    lastPath.value = null;
  }

  function selectCell(r: number, c: number) {
    const target = board.value.cells[r * board.value.cols + c];
    if (target.tileId === null) return;

    // 同一格 → 取消选中
    if (selected.value && selected.value.row === r && selected.value.col === c) {
      selected.value = null;
      return;
    }

    // 第一张
    if (!selected.value) {
      selected.value = target;
      return;
    }

    // 第二张：找路径
    const path = findPath(selected.value, target, board.value);
    if (!path) {
      shaking.value = { row: r, col: c };
      setTimeout(() => (shaking.value = null), 220);
      selected.value = null;
      return;
    }

    // 合法：先显示路径，再消除
    lastPath.value = path;
    const first = selected.value;
    setTimeout(() => {
      first.tileId = null;
      target.tileId = null;
      eliminatedCount.value++;
      const totalPairs = board.value.cells.length / 2;
      if (eliminatedCount.value >= totalPairs) isGameOver.value = true;
      selected.value = null;
      lastPath.value = null;
    }, 220);
  }

  return { board, selected, eliminatedCount, isGameOver, shaking, lastPath, selectCell, reset };
}
```

- [ ] **Step 4: 创建共享类型文件**

`src/data/useLianliankanTypes.ts`：

```ts
// 跨 composable / 页面 / tests 共享的类型
export interface Tile {
  id: string;
  image: string;
  label: string;
}

export interface Theme {
  id: 'fruit' | 'animal' | 'transport' | 'plant';
  name: string;
  icon: string;
  tiles: Tile[];
}

export interface Level {
  id: 'easy' | 'medium' | 'hard';
  name: string;
  rows: number;
  cols: number;
  pairCount: number;
}
```

> 注：`lianliankanThemes.ts` 也导出 `Tile` / `Theme`，但 `useLianliankanGame.ts` **不直接 import 它**（避免 `lianliankanThemes.ts` 这种由脚本生成的文件被 vitest 拉成运行依赖），改用共享类型文件 `useLianliankanTypes.ts`。Step 3 顶部的 import 已是正确指向。

- [ ] **Step 5: 跑测试确认全部通过（green）**

```bash
npm run test
```

预期：所有 useLianliankanGame 用例通过。如果有失败，按红/黄/蓝栈定位修正 `findPath` / `generateBoard` 实现。

---

## Task 7: 游戏页 setup 态（选关+选主题）

**Files:**
- Create: `src/pages/game/lianliankan.vue`（第一版：仅 setup 态）

- [ ] **Step 1: 写第一版页面骨架**

```vue
<template>
  <view class="page">
    <view class="header">
      <view class="back" @click="onBack">←</view>
      <text class="title">连连看</text>
    </view>

    <view v-if="phase === 'setup'" class="setup">
      <text class="section-title">选关卡</text>
      <view class="cards-row">
        <view
          v-for="lv in levels"
          :key="lv.id"
          class="card"
          :class="{ active: selectedLevel?.id === lv.id }"
          @click="selectedLevel = lv"
        >
          <text class="card-title">{{ lv.name }}</text>
        </view>
      </view>

      <text class="section-title">选主题</text>
      <view class="cards-row">
        <view
          v-for="th in themes"
          :key="th.id"
          class="card"
          :class="{ active: selectedTheme?.id === th.id }"
          @click="selectedTheme = th"
        >
          <text class="card-icon">{{ th.icon }}</text>
          <text class="card-title">{{ th.name }}</text>
        </view>
      </view>

      <view class="start-btn">
        <van-button
          type="primary"
          block
          round
          :disabled="!selectedLevel || !selectedTheme"
          @click="startGame"
        >
          开始游戏
        </van-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { LEVELS, type Level } from '@/data/lianliankanLevels';
import { THEMES, type Theme } from '@/data/lianliankanThemes';
import { useLianliankanGame } from '@/composables/useLianliankanGame';

const levels = LEVELS;
const themes = THEMES;
const selectedLevel = ref<Level | null>(null);
const selectedTheme = ref<Theme | null>(null);
const phase = ref<'setup' | 'playing' | 'done'>('setup');
const game = useLianliankanGame();
const startedAt = ref<number>(0);
const elapsedSeconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - startedAt.value) / 1000);
  }, 1000);
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null; }
}
onUnmounted(stopTimer);

function startGame() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  game.reset(selectedLevel.value, selectedTheme.value);
  startedAt.value = Date.now();
  elapsedSeconds.value = 0;
  phase.value = 'playing';
  startTimer();
}

function onBack() {
  // setup / done 态直接退出；playing 态弹确认
  if (phase.value === 'playing') {
    uni.showModal({
      title: '放弃本局？',
      success: (r) => { if (r.confirm) phase.value = 'setup'; },
    });
  } else {
    uni.navigateBack();
  }
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
}
.header {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  .back {
    font-size: 48rpx;
    width: 64rpx;
  }
  .title {
    font-size: 40rpx;
    font-weight: 600;
    margin-left: 16rpx;
  }
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin: 32rpx 0 16rpx;
}
.cards-row {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}
.card {
  flex: 1 1 30%;
  min-width: 200rpx;
  padding: 32rpx 16rpx;
  background: #fff;
  border: 4rpx solid transparent;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: all 150ms;
  &.active {
    border-color: #4f8cff;
    transform: scale(1.04);
  }
  .card-icon {
    font-size: 56rpx;
    display: block;
  }
  .card-title {
    font-size: 28rpx;
    color: #333;
    display: block;
    margin-top: 8rpx;
  }
}
.start-btn {
  margin-top: 64rpx;
}
</style>
```

- [ ] **Step 2: 跑 type-check**

```bash
npm run type-check
```

预期：无错误。

- [ ] **Step 3: 跑 dev 验证 setup 态**

```bash
npm run dev
```

浏览器打开 `http://localhost:8092/growth-plan/pages/game/lianliankan`：

- 看到 "连连看" 标题
- 看到 3 张关卡卡 + 4 张主题卡
- 点击能切换 `active` 高亮
- "开始游戏"在未选时禁用

---

## Task 8: playing 态（棋盘 + 点击 + 动画）

**Files:**
- Modify: `src/pages/game/lianliankan.vue`

- [ ] **Step 1: 在 `<template>` 中追加 playing 态**

在 `</view>` 闭合 setup 块的下一行（仍在外层 `.page` 内）插入：

```vue
    <view v-else-if="phase === 'playing'" class="playing">
      <view class="play-header">
        <text class="play-title">{{ selectedLevel?.name }} · {{ selectedTheme?.name }}</text>
        <view class="reshuffle" @click="reshuffle">换一局</view>
      </view>

      <view class="board-wrap">
        <view
          class="board"
          :style="{ gridTemplateColumns: `repeat(${selectedLevel?.cols}, 1fr)` }"
        >
          <template v-for="cell in game.board.value.cells" :key="cell.row + '-' + cell.col">
            <view
              class="tile"
              :class="{
                selected: game.selected.value?.row === cell.row && game.selected.value?.col === cell.col,
                shaking: game.shaking.value?.row === cell.row && game.shaking.value?.col === cell.col,
                eliminated: cell.tileId === null,
              }"
              @click="onTileClick(cell.row, cell.col)"
            >
              <image
                v-if="cell.tileId !== null"
                class="tile-img"
                :src="imageFor(cell.tileId)"
                mode="aspectFit"
              />
            </view>
          </template>

          <svg class="path-svg" :viewBox="`0 0 ${(selectedLevel?.cols ?? 0) * 100} ${(selectedLevel?.rows ?? 0) * 100}`" preserveAspectRatio="none">
            <polyline
              v-if="game.lastPath.value"
              :points="pathPoints"
              class="path-line"
            />
          </svg>
        </view>
      </view>

      <view class="counter">
        <text>已消除 {{ game.eliminatedCount.value }} / {{ selectedLevel?.pairCount }} 对</text>
      </view>
    </view>
```

- [ ] **Step 2: 在 `<script setup>` 中追加方法 + 计算属性**

在 `startGame` 函数后追加：

```ts
function reshuffle() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  game.reset(selectedLevel.value, selectedTheme.value);
  startedAt.value = Date.now();
}

function onTileClick(r: number, c: number) {
  game.selectCell(r, c);
  // isGameOver 在 composable 内部 setTimeout(220ms) 后才为 true；这里再排 250ms
  // 等待路径动画与消除动画结束再切到 done 态
  setTimeout(() => {
    if (game.isGameOver.value) {
      stopTimer();
      saveBest();
      phase.value = 'done';
    }
  }, 250);
}

function imageFor(tileId: string): string {
  const t = themes.find(th => th.tiles.some(x => x.id === tileId));
  return t?.tiles.find(x => x.id === tileId)?.image ?? '';
}

const pathPoints = computed(() => {
  if (!game.lastPath.value) return '';
  return game.lastPath.value.turns
    .map(p => `${(p.col + 0.5) * 100},${(p.row + 0.5) * 100}`)
    .join(' ');
});

function saveBest() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  const seconds = Math.floor((Date.now() - startedAt.value) / 1000);
  const key = `${selectedLevel.value.id}_${selectedTheme.value.id}`;
  try {
    const prev = uni.getStorageSync('lianliankan-best') as Record<string, number> | null;
    const cur = prev ?? {};
    if (!cur[key] || seconds < cur[key]) {
      cur[key] = seconds;
      uni.setStorageSync('lianliankan-best', cur);
    }
  } catch {}
}
```

- [ ] **Step 3: 追加对应样式**

在 `</style>` 前追加：

```scss
.playing {
  margin-top: 24rpx;
}
.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  .play-title {
    font-size: 32rpx;
    font-weight: 600;
  }
  .reshuffle {
    font-size: 28rpx;
    color: #4f8cff;
    padding: 8rpx 16rpx;
  }
}
.board-wrap {
  position: relative;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
.board {
  position: relative;
  display: grid;
  gap: 8rpx;
  width: 100%;
}
.tile {
  aspect-ratio: 1;
  background: #fafbfc;
  border: 4rpx solid transparent;
  border-radius: 12rpx;
  transition: all 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
  &.selected {
    border-color: #4f8cff;
    transform: scale(1.08);
  }
  &.shaking {
    animation: shake 220ms;
  }
  &.eliminated {
    background: transparent;
    pointer-events: none;
  }
  .tile-img {
    width: 80%;
    height: 80%;
  }
}
.path-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .path-line {
    fill: none;
    stroke: #4f8cff;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: draw 220ms ease-out;
  }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6rpx); }
  75% { transform: translateX(6rpx); }
}
@keyframes draw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
.counter {
  margin-top: 24rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
}
```

- [ ] **Step 4: type-check + 跑 dev 验证**

```bash
npm run type-check
npm run dev
```

手动测试：
1. 选关卡 + 主题 → 开始游戏
2. 棋盘正确渲染 4×4 / 6×6 / 8×8
3. 点两张同图案且能连通的牌 → 路径动画 → 牌消失
4. 点两张不能连通的牌 → shake 动画
5. "换一局"按钮工作

---

## Task 9: done 态 + 最佳用时存储

**Files:**
- Modify: `src/pages/game/lianliankan.vue`

- [ ] **Step 1: 在 `<template>` 中追加 done 态**

在 playing 块的 `</view>` 之后、外层 `.page` 的 `</view>` 之前插入：

```vue
    <view v-else class="done">
      <view class="done-card">
        <text class="done-emoji">🎉</text>
        <text class="done-title">太棒了！</text>
        <text class="done-sub">{{ selectedLevel?.name }} · {{ selectedTheme?.name }}</text>
        <text class="done-time">用时 {{ formatSeconds(elapsedSeconds) }}</text>
        <view class="done-actions">
          <van-button type="primary" block round @click="playAgain">再玩一次</van-button>
          <van-button block round @click="changeTheme">换主题</van-button>
          <van-button block round @click="goHome">回首页</van-button>
        </view>
      </view>
    </view>
```

- [ ] **Step 2: 在 `<script setup>` 追加方法**

```ts
function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m} 分 ${sec} 秒`;
}

function playAgain() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  game.reset(selectedLevel.value, selectedTheme.value);
  startedAt.value = Date.now();
  elapsedSeconds.value = 0;
  startTimer();
  phase.value = 'playing';
}
function changeTheme() {
  phase.value = 'setup';
  selectedLevel.value = null;
  selectedTheme.value = null;
}
function goHome() {
  uni.navigateBack();
}
```

- [ ] **Step 3: 追加 done 态样式**

```scss
.done {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.done-card {
  width: 80%;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  .done-emoji {
    font-size: 120rpx;
    display: block;
  }
  .done-title {
    font-size: 48rpx;
    font-weight: 700;
    display: block;
    margin-top: 16rpx;
  }
  .done-sub {
    font-size: 28rpx;
    color: #666;
    display: block;
    margin-top: 16rpx;
  }
  .done-time {
    font-size: 32rpx;
    color: #333;
    display: block;
    margin: 24rpx 0 32rpx;
  }
  .done-actions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
}
```

- [ ] **Step 4: dev 验证**

跑通到完成态，检查：
- "再玩一次" = 重新 generateBoard 同关卡主题
- "换主题" = 回 setup
- "回首页" = 回到 `pages/index/index`
- 最佳用时写入 `uni.getStorageSync('lianliankan-best')` 含 `${levelId}_${themeId}` 键

---

## Task 10: 注册路由 + 首页入口 + 终验

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`
- Create: `src/static/images/lianliankan-icon.png`（MiniMax 文生图生成）

- [ ] **Step 1: 在 pages.json 注册新路由**

打开 `src/pages.json`，在 `pages` 数组最后一项（`pages/game/stroop`）之后插入：

```json
,
{
    "path": "pages/game/lianliankan",
    "style": {
        "navigationBarTitleText": "连连看"
    }
}
```

- [ ] **Step 2: 生成首页图标**

```bash
mkdir -p src/static/images
KEY=$(cat docs/minimax/key | tr -d '\n')

curl -s -X POST https://api.minimaxi.com/v1/image_generation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $KEY" \
  -d '{
    "model": "image-01",
    "prompt": "A cute icon of two connected cartoon fruit pieces with a matching line between them, app icon style, rounded square, child-friendly, no text",
    "aspect_ratio": "1:1",
    "response_format": "url",
    "n": 1,
    "prompt_optimizer": true
  }' | node -e "
let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',async()=>{
  const j=JSON.parse(s);
  const url=j.data.image_urls[0];
  const r=await fetch(url);
  const buf=Buffer.from(await r.arrayBuffer());
  require('fs').writeFileSync('src/static/images/lianliankan-icon.png',buf);
  console.log('icon saved');
});"
```

预期：终端输出 `icon saved` 且 `src/static/images/lianliankan-icon.png` 存在。

- [ ] **Step 3: 首页 appList 加新入口**

打开 `src/pages/index/index.vue`，在 `appList` 数组的 `Stroop 颜色冲突` 项之后追加：

```typescript
        ,
        {
            name: '连连看',
            path: '/pages/game/lianliankan',
            icon: '/static/images/lianliankan-icon.png',
        },
```

- [ ] **Step 4: 跑三件套验证**

```bash
npm run type-check
npm run test
npm run lint
```

预期：
- type-check 无错
- test 全绿
- lint 无错（或仅是已有警告）

- [ ] **Step 5: 跑 build 验证产物**

```bash
npm run build:prod
```

预期：构建成功，输出 `dist/build/h5/` 含 `static/lianliankan/` 全部 PNG。

- [ ] **Step 6: 跑 dev 做最后一次端到端冒烟**

```bash
npm run dev
```

浏览器 `http://localhost:8092/growth-plan/`：
1. 首页能看到"连连看"卡片
2. 点卡 → setup 态
3. 选 4×4 + 水果 → 开始 → 至少成功消除 1 对 → 错误匹配有 shake → 完成态正常 → 三个按钮都工作
4. 切到 8×8 + 植物 → 验证大棋盘无性能问题（路径动画 < 250ms）

- [ ] **Step 7: 提交（跳过）**

---

## 完成判定（自验 checklist）

- [ ] `npm run test` 全部通过
- [ ] `npm run type-check` 无错
- [ ] `npm run lint` 无错
- [ ] `npm run build:prod` 成功
- [ ] 128 张 PNG 在 `src/static/lianliankan/{fruit,animal,transport,plant}/`
- [ ] `src/data/lianliankanThemes.ts` 已生成，含 4 主题 × 32 tile
- [ ] `pages.json` 注册 `pages/game/lianliankan`
- [ ] 首页有"连连看"入口卡，图标本地 PNG
- [ ] 三态（setup / playing / done）可端到端跑通
- [ ] shake 动画、路径动画、选中高亮可见
- [ ] 最佳用时写入 `uni.getStorageSync('lianliankan-best')` 且 `getStorageSync` 读回含新键
- [ ] "换一局" 按钮在 playing 态可用
- [ ] playing 态按 ← 弹"放弃本局？"确认框
- [ ] 全部变更**未** commit（由用户审阅后自己提交）
