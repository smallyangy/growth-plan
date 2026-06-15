# 数字复述（Digit Span）实施设计

> 状态：已批准，待实施
> 起草日期：2026-06-15
> 调研来源：`docs/research/2026-06-11-6y-focus-games.md` B2 条目

## 目的

在「果果成长计划」中新增一个儿童听觉工作记忆训练游戏——数字复述。家长看着屏幕念出一串随机数字，孩子口头复述，由家长判定对错。游戏以"手动调位数"为核心交互，记录本轮总题数、对错数以及达到的最高位数，作为家长观察孩子短时记忆能力的窗口。

## 用户场景

- 孩子：5-7 岁，能坐住 10-15 分钟
- 时长：每天 ≤ 5 分钟（一轮通常 10-15 题）
- 设备：手机/平板（H5 为主，小程序兼容）
- 阅读人：家长，全程主导念题与判定

## 训练能力

- 听觉专注（auditory attention）
- 工作记忆（working memory / digit span）

## 范围

### 包含

1. 新页面 `src/pages/game/digit-span.vue`（约 400-500 行）
2. 首页重构：`appList` 加第 6 项"数字复述"，保持 3×2 网格
3. 3 个屏幕状态：准备屏 / 答题屏 / 成绩单
4. 手动调位数（`+1位` / `原位` / `-1位`，下限 3，无上限）
5. 家长两键判定（✓ 正确 / ✗ 失败）+ 0.5s 绿/红脉冲动画
6. 成绩单：总题数、对、错、最高位数
7. 首页入口图标（用 MiniMax API 生成）
8. 离开未结束本轮时的二次确认

### 不包含（YAGNI）

- 倒序模式、干扰模式、二人比赛
- 历史最佳（`localStorage` 持久化）
- 语音识别 / 合成（TTS / ASR）
- 横屏适配
- 振动反馈（`uni.vibrateShort`）
- 单元测试（项目当前无测试体系）
- 多语言、暗色模式

## 关键架构

### 1. 数据结构

```typescript
interface Attempt {
    digitCount: number;            // 本题几位
    digits: number[];              // 本题数字，如 [1,5,8,3]，1-9 随机
    result: 'correct' | 'wrong' | null;  // 家长判定，null = 未判定
}

type GameState = 'idle' | 'playing' | 'finished';

interface Round {
    state: GameState;
    currentDigits: number[];       // 当前题的数字
    currentDigitCount: number;     // 当前题的位数
    history: Attempt[];            // 本轮所有题
    correctCount: number;          // 累计对题数
    wrongCount: number;            // 累计错题数
    feedback: 'correct' | 'wrong' | null;  // 最近一次判定反馈（驱动脉冲动画）
}
```

### 2. 状态机

```
idle(初始 / 结束本轮后)
  ↓ 点"开始本轮"
playing(每次显示新一题,等家长点 ✓/✗)
  ├─ 点 ✓ → feedback='correct' → correctCount++ → 等点 +1/原位/-1
  ├─ 点 ✗ → feedback='wrong'   → wrongCount++   → 等点 +1/原位/-1
  ↓ 点 +1位 → 出新题(位数+1)
  ↓ 点 原位 → 出新题(位数不变)
  ↓ 点 -1位 → 出新题(max(位数-1, 3))
  ↓ 点"结束本轮" → finished(成绩单)
  ↓ finished → 点"再来一轮" → idle
```

### 3. 关键不变量

- `currentDigitCount` 永远 ≥ 3（无上限）
- `history.length` 永远 = `correctCount + wrongCount`（每题判定一次）
- `maxDigitCount` 不存为单独状态，使用 `Math.max(...history.map(a => a.digitCount), 0)` 实时计算
- 数字生成范围 1-9，**不包含 0**（避免"零/欧"读音歧义和儿童混淆）

### 4. 出题函数

```typescript
const generateDigits = (count: number): number[] => {
    return Array.from(
        { length: count },
        () => mock.Random.integer(1, 9),  // 1-9 随机，不含 0
    );
};
```

## 交互流程

### 屏幕 A：准备屏 (idle)

```
┌─────────────────────────────────┐
│  🏠 顶栏（返回首页）               │
├─────────────────────────────────┤
│         🎯 图标                   │
│     「数字复述」                   │
│  家长念数字，孩子复述               │
│       [ 开始本轮 ]                │
│  说明：                           │
│  · 屏幕上的数字请家长念给孩子        │
│  · 孩子复述后点 ✓/✗               │
│  · 三档按钮：+1位 / 原位 / -1位     │
│  · 想结束点"结束本轮"              │
└─────────────────────────────────┘
```

### 屏幕 B：答题屏 (playing)

```
┌─────────────────────────────────┐
│  🏠 顶栏（返回会二次确认）          │
├─────────────────────────────────┤
│  进度: 第 5 题 · 最高 4 位         │  ← 顶部状态条
├─────────────────────────────────┤
│  ┌─────────────────────────┐     │
│  │   1  ·  5  ·  8         │     │  ← 数字大字卡片
│  │                         │     │     Claymorphism 双层阴影
│  │   3 位:撑满 / 4-6 位:横向排开│     │
│  └─────────────────────────┘     │
│                                 │
│  家长听到孩子复述后:               │
│  [   ✓ 正确   ]  [   ✗ 失败   ]   │  ← 主判定按钮
│  ─── 判定后出现下一题选择 ───       │  ← v-if feedback!=null
│  [ +1位 ] [ 原位 ] [ -1位 ]        │  ← 三档,min 3
│  [ 结束本轮 ]                     │  ← 浅色小按钮,常驻
└─────────────────────────────────┘
```

### 屏幕 C：成绩单 (finished)

```
┌─────────────────────────────────┐
│       🏆 完成弹窗（居中卡片）       │
│       「本轮成绩」                 │
│       ┌──────────┐              │
│       │   5      │              │  ← 最高位大字（96rpx，主色）
│       │   位     │              │
│       └──────────┘              │
│   总题数: 12                      │
│   ✓ 正确:  8                     │
│   ✗ 失败:  4                     │
│  [ 再来一轮 ]   [ 回首页 ]         │
└─────────────────────────────────┘
```

## 视觉设计（沿用 maze/linggu 已建立的主题）

### 颜色与阴影

- 主色 `#ff85a1`、强调橙 `#F97316`
- 双层阴影配方（沿用 maze）：
  ```css
  box-shadow:
      inset -2rpx -2rpx 6rpx rgba(255,255,255,0.6),
      inset 2rpx 2rpx 6rpx rgba(194,90,112,0.15),
      4rpx 4rpx 12rpx rgba(194,90,112,0.18);
  ```
- 背景渐变：`linear-gradient(160deg, #fff0f3 0%, #ffe4ec 100%)`
- 装饰球：4 个浮动的 Claymorphism 球（与 linggu/maze 完全一致）

### 数字卡片参数

| 位数 | 字号 | 卡片内边距 |
|------|------|-----------|
| 3 位 | 72rpx | 48rpx |
| 4 位 | 60rpx | 40rpx |
| 5 位 | 50rpx | 32rpx |
| 6 位及以上 | 44rpx | 28rpx |

- 数字之间用 `·` 圆点分隔，加大间距
- 数字卡片圆角 24rpx，白底

### 判定反馈动画

**绿色脉冲（对点）**：
```css
@keyframes pulseGreen {
    0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    30%  { background: linear-gradient(135deg, #d8ffe0, #a8f0b8); }
    100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
}
.card--correct { animation: pulseGreen 0.5s ease-out; }
```

**红色脉冲（错点）**：
```css
@keyframes pulseRed {
    0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    30%  { background: linear-gradient(135deg, #ffe0e0, #ffb8b8); }
    100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
}
.card--wrong { animation: pulseRed 0.5s ease-out; }
```

`prefers-reduced-motion: reduce` 时降为即时切换。

### 主按钮（✓ 正确）

```css
.btn-correct {
    background: linear-gradient(145deg, #a8f0b8 0%, #6dd680 100%);
    color: #fff;
    box-shadow:
        inset 0 3rpx 6rpx rgba(255,255,255,0.3),
        inset 0 -4rpx 0 #4a9c5a,
        0 8rpx 20rpx rgba(100, 200, 120, 0.3);
}
```

### 主按钮（✗ 失败）

```css
.btn-wrong {
    background: linear-gradient(145deg, #ffa0a0 0%, #f06060 100%);
    color: #fff;
    box-shadow:
        inset 0 3rpx 6rpx rgba(255,255,255,0.3),
        inset 0 -4rpx 0 #c03030,
        0 8rpx 20rpx rgba(200, 60, 60, 0.3);
}
```

### 三档按钮（+1位 / 原位 / -1位）

- 等宽分布，flex 1
- 与主按钮风格一致但稍小（高 56rpx，圆角 28rpx）
- 配色：主色 `#ff85a1`

### "结束本轮" 按钮

- 浅灰描边、低饱和（避免与主操作争夺视线）
- 高度 40rpx，居中下方

### 不使用 emoji

按 ui-ux-pro-max 硬规则，用 SVG 替代：
- 🎯 准备屏图标 → 圆形靶心 SVG
- 🏆 成绩单图标 → 奖杯 SVG
- 进度条文字 → 纯文字
- ✓/✗ 按钮 → 用 SVG 而非字符（保持跨平台一致）

## ui-ux-pro-max 调用方式

- **不调用 "plan" 模式**：会输出独立设计稿，与项目主题冲突
- **调用 "review" 模式**：实施完成后用它对生成的页面做视觉检查，纠偏
- 实施阶段直接复用上述 token 和阴影配方，保证与 linggu/maze 一致

## 文件改动

```
新增 src/pages/game/digit-span.vue              # 主页面 ~450 行
新增 src/static/images/digit-span-icon.png      # 首页入口图标（MiniMax API 生成）
修改 src/pages.json                              # 新增路由
修改 src/pages/index/index.vue                   # appList 加第 6 项
```

## 图标生成

用 MiniMax 文生图 API（参考 memory: `minimax-text-to-image.md`）。

**Prompt**：
> App icon for a children digit memory game. Soft pink pastel background. A speech bubble containing the number sequence "1 2 3" with a small ear icon. 3D claymorphism style, kid-friendly, no text. Square format.

**调用模板**（沿用 `docs/superpowers/specs/2026-06-12-number-maze-design.md` 第 280-294 行的 curl 模板，改 prompt 和输出文件名）：

```bash
KEY=$(cat docs/minimax/key | tr -d '\n')
curl -s https://api.minimaxi.com/v1/image_generation \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "image-01",
    "prompt": "App icon for a children digit memory game. Soft pink pastel background. A speech bubble containing the number sequence \"1 2 3\" with a small ear icon. 3D claymorphism style, kid-friendly, no text. Square format.",
    "aspect_ratio": "1:1",
    "n": 1,
    "response_format": "url",
    "prompt_optimizer": true
  }' > /tmp/digit_span_icon_response.json
URL=$(cat /tmp/digit_span_icon_response.json | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image_urls'][0])")
curl -s -o src/static/images/digit-span-icon.png "$URL"
```

如果 API 返回 JPEG，用 `sips` 转 PNG（与舒尔特/maze 图标经验一致）。

## 首页重构

`src/pages/index/index.vue` 的 `appList` 加第 6 项：

```typescript
const appList = [
    { name: '文字学习', path: '/pages/word/index', icon: '...' },
    { name: '基础运算', path: '/pages/math/base', icon: '...' },
    { name: '领鼓游戏', path: '/pages/game/linggu', icon: '...' },
    { name: '舒尔特专注力', path: '/pages/game/shulte', icon: '/static/images/shulte-icon.png' },
    { name: '数字迷宫', path: '/pages/game/maze', icon: '/static/images/maze-icon.png' },
    { name: '数字复述', path: '/pages/game/digit-span', icon: '/static/images/digit-span-icon.png' },
];
```

CSS 网格保持 `repeat(3, 1fr)`（6 卡片 3×2 排布）。如果窄屏拥挤，在 plan 阶段评估是否需将卡片尺寸或字号微调。

## 验收标准

- [ ] 3 个屏幕（idle / playing / finished）正确切换
- [ ] 进入页面默认 3 位，数字 1-9 随机（无 0）
- [ ] 数字同时显示，无 0
- [ ] `+1位` / `原位` / `-1位` 三个按钮 min 3 边界保护
- [ ] ✓/✗ 判定后，数字卡片有 0.5s 绿/红脉冲动画
- [ ] 进度条实时刷新；最高位仅在变化时更新
- [ ] 离开未结束本轮 → 弹 `uni.showModal` 二次确认
- [ ] 成绩单：总题数、对、错、最高位 4 个数字均正确
- [ ] 首页 6 卡片 3×2 网格展示
- [ ] `npm run type-check` 通过
- [ ] `npx eslint` 0 errors
- [ ] dev server 启动无 "Failed to resolve" 错误

## 调研步骤

1. 编写 `docs/superpowers/plans/2026-06-15-digit-span.md`（实施计划）
2. 用 MiniMax API 生成图标
3. 派 subagent 按 plan 顺序执行（约 6-8 个 task）
4. 用 ui-ux-pro-max review 模式做视觉检查
5. 端到端验证（type-check, eslint, dev server, 走完 3 个屏幕）
6. 报告交付

## 已知风险

- **6 岁孩子对 0 的辨识**：决定不包含 0，纯 1-9 随机
- **6 位以上的视觉密度**：字号随位数缩放但不限制上限；如实际玩时拥挤再加硬上限
- **首页 6 卡片在窄屏的拥挤度**：现有 5 个用 `repeat(3, 1fr)` 已偏小，加到 6 个可能需要微调尺寸/字号 — 在 plan 阶段验证
- **API 返回 JPEG**：与舒尔特/maze 图标经验一致，需用 `sips` 转 PNG

## 完成标准

- 报告文件已 commit
- spec 已 self-review 通过
- 用户已 review 确认
