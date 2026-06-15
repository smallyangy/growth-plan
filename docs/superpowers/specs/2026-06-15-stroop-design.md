# Stroop 颜色冲突 实施设计

> 状态：已批准，待实施
> 起草日期：2026-06-15
> 调研来源：`docs/research/2026-06-11-6y-focus-games.md` C2 条目

## 目的

在「果果成长计划」中新增一个儿童选择性注意力训练游戏——Stroop 颜色冲突。屏幕上整批展示 4 行 × 5-6 个汉字，字本身（"红""蓝""黄""绿"）用错位颜色书写（如"红"字用蓝色墨水）。孩子点字再点颜色按钮作答。一轮固定 3 组，每组 30 秒，组间 5 秒休息。

## 用户场景

- 孩子：5-7 岁，能坐住 10-15 分钟
- 时长：一轮约 90-100 秒（含组间休息）
- 设备：手机/平板（H5 为主，小程序兼容）
- 阅读人：家长，全程陪玩示范

## 训练能力

- 选择性注意力（selective attention）
- 抑制控制（inhibitory control）

## 范围

### 包含

1. 新页面 `src/pages/game/stroop.vue`（约 600-700 行）
2. 首页重构：`appList` 加第 7 项"Stroop 颜色冲突"，3×2 网格 + 居中"敬请期待"占位
3. 3 档难度（入门 2 色 / 标准 4 色 / 进阶 4 色+1秒/字+模式切换）
4. 3 个游戏状态屏幕（idle / group-playing / group-rest）+ 1 个 finished 弹窗
5. 整批卡片展示：每组 4 行 × 5-6 字 = 20-24 个字
6. 交互：点字（高亮）→ 点颜色按钮判正错
7. 30秒/组倒计时；未答超时 = 错
8. 进阶模式的按组规则切换（颜色 / 字念 / 混合）
9. 整局成绩单（总对/总题/正确率 + 3 组明细）
10. 首页入口图标（MiniMax API 生成）

### 不包含（YAGNI）

- 历史最佳（`localStorage` 持久化）
- 单元测试（项目当前无测试体系）
- 多语言、暗色模式
- 横屏适配、振动反馈
- 教程/动画演示
- 跳过难度细分（只 3 档，不再多档）

## 关键架构

### 1. 数据结构

```typescript
// 4 种颜色(用 CSS 颜色名)
type Color = 'red' | 'blue' | 'yellow' | 'green';

// 一个字
interface Char {
    word: Color;             // 字本身写的颜色名,如"红"
    ink: Color;              // 实际墨水颜色(可能 != word)
    status: 'idle' | 'correct' | 'wrong' | 'skipped';
    expectedAnswer: Color;   // 根据本组模式(颜色/字念/混合)算出
}

// 一组的模式
type GroupMode = 'ink' | 'word' | 'mixed';

// 难度
type Difficulty = 'easy' | 'standard' | 'advanced';

interface DifficultyConfig {
    colors: Color[];             // 入门 2 色 / 标准 4 色 / 进阶 4 色
    perCharTimeMs: number | null; // 进阶 1000ms(每字 1 秒限时), 入门/标准 null(只按 30秒/组)
    groupModes: GroupMode[];     // 3 组的模式; 入门/标准固定全 'ink'; 进阶 ['ink','word','mixed']
}

// 一组
interface Group {
    index: number;               // 0/1/2
    mode: GroupMode;
    chars: Char[];               // 20-24 个字
    correctCount: number;
    wrongCount: number;          // 含未答
    startedAt: number | null;
}

// 整局
type GameState = 'idle' | 'group-rest' | 'group-playing' | 'finished';

interface Round {
    state: GameState;
    difficulty: Difficulty;
    groups: Group[];                  // 固定 3 组
    currentGroupIndex: number;
    selectedCharIndex: number | null;  // 当前点中的字(高亮)
    remainingMs: number;               // 本组剩余时间(ms)
    restRemainingMs: number;           // 组间休息剩余(ms)
}
```

### 2. 状态机

```
idle(初始 / 结束本轮后)
  ↓ 点"开始本轮"
group-playing(group 0, 30秒倒计时)
  ├─ 点字 → selectedCharIndex 变化(高亮)
  ├─ 点颜色 → judge: 正→correctCount++ 绿脉冲; 错→wrongCount++ 红脉冲
  ├─ 30秒到 → 未答的字全标 skipped(=wrong) → group-rest
  ↓ group-rest(5秒)
  ↓ 5秒到 → group-playing(group 1) 或 group-playing(group 2)
  ↓ 3 组完成 → finished(总成绩弹窗)
  ↓ finished → 点"再来一轮"→ idle
```

### 3. 关键不变量

- `groups.length === 3`,顺序固定
- 每组固定 20-24 个字(4 行 × 5-6 字)
- `selectedCharIndex === null` 时点颜色按钮不响应
- `expectedAnswer` 由模式决定:
  - `ink` 模式: `expected = char.ink`(墨水颜色)
  - `word` 模式: `expected = char.word`(字念)
  - `mixed` 模式: 50% 概率 ink, 50% 概率 word
- 进阶 1秒/字 超时 = skipped(灰色脉冲)
- 30秒/组 到时未答的字全标 skipped
- 黄字用 2rpx 白色 text-shadow 描边保证浅粉背景可读性

### 4. 出题函数

```typescript
const generateChars = (count: number, colors: Color[]): Char[] => {
    return Array.from({ length: count }, () => {
        const word = colors[Math.floor(Math.random() * colors.length)];
        let ink = colors[Math.floor(Math.random() * colors.length)];
        while (ink === word) {
            ink = colors[Math.floor(Math.random() * colors.length)]; // 强制字/墨水不同,保留 Stroop 冲突
        }
        return { word, ink, status: 'idle', expectedAnswer: ink };
    });
};
```

注意:在 Stroop 实验中,字与墨水相同时是"一致条件"(congruent),不同时是"冲突条件"(incongruent)。为保留冲突张力,**强制 ink !== word**。

### 5. 模式计算

```typescript
const computeExpectedAnswer = (word: Color, ink: Color, mode: GroupMode): Color => {
    if (mode === 'ink') return ink;
    if (mode === 'word') return word;
    // mixed: 50/50
    return Math.random() < 0.5 ? ink : word;
};
```

`mixed` 模式的 `expectedAnswer` 在出题时确定一次,后续不变。

### 6. 计时器

```typescript
let timerId: number | null = null;

// 每 100ms 检查一次
timerId = setInterval(() => {
    if (round.value.state === 'group-playing') {
        round.value.remainingMs -= 100;
        // 进阶 1秒/字 单独检查(在 selectedCharIndex 上)
        if (round.value.selectedCharIndex !== null) {
            // 进阶模式下,记录选中时间,超过 1000ms 自动标 skipped
        }
        if (round.value.remainingMs <= 0) {
            handleGroupTimeout();  // 未答全标 skipped,进入 group-rest
        }
    } else if (round.value.state === 'group-rest') {
        round.value.restRemainingMs -= 100;
        if (round.value.restRemainingMs <= 0) {
            startNextGroup();
        }
    }
}, 100) as unknown as number;
```

## 交互流程

### 屏幕 A: 准备屏 (idle) — 选难度

```
┌─────────────────────────────────┐
│  🏠 顶栏(返回首页)               │
├─────────────────────────────────┤
│         🎨 图标                  │
│     「Stroop 颜色冲突」          │
│  说出墨水颜色(不是字!)           │
│                                 │
│  ┌─────┐ ┌─────┐ ┌─────┐        │
│  │入门 │ │标准 │ │进阶 │        │
│  │2 色 │ │4 色 │ │1秒/字│       │
│  └─────┘ └─────┘ └─────┘        │
│       [ 开始本轮 ]              │
│                                 │
│  玩法:                          │
│  · 每个字用错位颜色书写           │
│  · 孩子点字→点颜色按钮作答        │
│  · 3 组 × 30秒,组间 5 秒休息     │
│  · 入门:看墨水颜色即可          │
│  · 进阶:有时念字,有时看颜色      │
└─────────────────────────────────┘
```

### 屏幕 B: 答题屏 (group-playing)

```
┌─────────────────────────────────┐
│  顶栏 home 按钮                  │
├─────────────────────────────────┤
│  第 1/3 组 · ⏱ 25s  [🎨 颜色模式]│  ← 顶栏(组号/倒计时/模式标志)
├─────────────────────────────────┤
│  红 蓝 蓝 黄 红  ← 4×5=20 字     │  ← 4 行卡片
│  绿 黄 红 蓝 绿                  │     每字用 CSS color 渲染
│  蓝 红 绿 黄 蓝                  │     点击高亮(粉色边框)
│  黄 绿 蓝 红 绿                  │
├─────────────────────────────────┤
│  [ 红 ] [ 蓝 ] [ 黄 ] [ 绿 ]    │  ← 4 个颜色按钮(色块+文字)
└─────────────────────────────────┘
```

**进阶模式 1秒/字 限时**:
- 选中字后,字周围出现倒计时圈(SVG 圆弧)
- 超时未答 → 灰色脉冲 + skipped
- 计时圈在颜色按钮按下时重置

### 屏幕 C: 组间休息 (group-rest)

```
┌─────────────────────────────────┐
│  下一组: 第 2/3 组                │
│  [🎨 颜色模式]                  │
│                                 │
│       5                         │  ← 大字倒计时
│                                 │
│  休息一下                        │
│  上组成绩:答对 18 / 答错 2       │
└─────────────────────────────────┘
```

### 屏幕 D: 整局结束 (finished 弹窗)

```
┌─────────────────────────────────┐
│       🏆 完成弹窗                │
│       「本轮成绩」               │
│       54 / 60                   │  ← 大字 总对/总题
│       90%                        │  ← 大字 正确率
│  ┌─ 第 1 组 ─┐ ┌─ 第 2 组 ─┐ ...│  ← 3 组明细
│  │颜色 18/20 │ │字念 17/20 │     │
│  └──────────┘ └──────────┘      │
│  [ 再来一轮 ]   [ 回首页 ]        │
└─────────────────────────────────┘
```

## 视觉设计 (沿用 maze/digit-span 已建立主题)

### 基础规范

- Claymorphism 粉色主题
- 双层阴影配方:`inset light + inset dark + outer drop`
- 4 个浮动背景装饰球(与 linggu/maze/digit-span 一致)
- 圆角 16-48rpx 视层级递增

### 颜色面板

```scss
$color-red:    #EF4444;
$color-blue:   #3B82F6;
$color-yellow: #EAB308;
$color-green:  #22C55E;
```

### 字渲染

- 字号:4 行卡片密度下用 56-72rpx
- 颜色用 CSS `color` 属性直接给 `<text>` 元素
- **黄字处理**: 加 `text-shadow: 0 0 2rpx #fff, 0 0 2rpx #fff` (2rpx 白色描边)
- 选中状态: 粉色边框 4rpx + 阴影

### 模式标志 (不用 emoji)

- 🎨 颜色模式 → 颜料盘 SVG
- 📖 字念模式 → 书本 SVG
- 🔀 混合模式 → 双向箭头 SVG

### 颜色按钮

- 色块 80×80rpx + 文字标签
- 选中高亮: 上移 4rpx + 粉色描边
- 颜色按钮位置(底栏)与选中字联动

### 反馈动画

- 正确: 0.5s 绿色脉冲(沿用 maze 配方)
- 错误: 0.5s 红色脉冲
- 超时: 0.3s 灰色脉冲
- `prefers-reduced-motion: reduce` 包裹所有动画

## ui-ux-pro-max 调用方式

- **不调用 plan 模式** — 会与项目主题冲突
- **调用 review 模式** — 实施完成后用它对生成的页面做视觉检查,纠偏
- 实施阶段直接复用上述 token 和阴影配方,保证与 digit-span/maze 一致

## 文件改动

```
新增 src/pages/game/stroop.vue                   # 主页面 ~600-700 行
新增 src/static/images/stroop-icon.png            # 首页入口图标
修改 src/pages.json                               # 新增路由(第 7 项)
修改 src/pages/index/index.vue                    # appList 加第 7 项
```

## 首页重构 (6 → 7 卡片)

现有 6 卡片 = 3×2 网格。加第 7 项"Stroop 颜色冲突"和第 8 项"敬请期待"占位,使布局保持整齐(底部 2 个占位卡)。

```typescript
const appList = [
    { name: '文字学习', path: '/pages/word/index', icon: '...' },
    { name: '基础运算', path: '/pages/math/base', icon: '...' },
    { name: '领鼓游戏', path: '/pages/game/linggu', icon: '...' },
    { name: '舒尔特专注力', path: '/pages/game/shulte', icon: '/static/images/shulte-icon.png' },
    { name: '数字迷宫', path: '/pages/game/maze', icon: '/static/images/maze-icon.png' },
    { name: '数字复述', path: '/pages/game/digit-span', icon: '/static/images/digit-span-icon.png' },
    { name: 'Stroop 颜色冲突', path: '/pages/game/stroop', icon: '/static/images/stroop-icon.png' },
    { name: '敬请期待', path: '', icon: '...' },
];
```

CSS 保持 `repeat(3, 1fr)`(8 卡片 3×3,前 6 个为游戏,7+8 占位)。

## 图标生成

用 MiniMax 文生图 API(参考 memory: `minimax-text-to-image.md`)。

**Prompt**:
> App icon for a children Stroop color conflict attention game. Soft pink pastel background. A Chinese character "红" written in blue ink. 3D claymorphism style, kid-friendly, no text. Square format.

**调用**: 沿用 `docs/superpowers/specs/2026-06-12-number-maze-design.md` 第 280-294 行的 `curl` 模板,改 prompt 和输出文件名 `stroop-icon.png`。

## 验收标准

- [ ] 3 档难度都可选 (入门 2 色 / 标准 4 色 / 进阶 4 色+1秒/字+模式切换)
- [ ] 每组 4 行 × 5-6 字 = 20-24 个汉字,字与墨水颜色错位(强制 ink !== word)
- [ ] 点字高亮(粉色边框) → 点颜色按钮判正错
- [ ] 30秒到时未答的字 = 错 (灰色脉冲 + wrongCount++)
- [ ] 3 组结束弹出总成绩(总对/总题/正确率 + 3 组明细)
- [ ] 进阶 3 组分别为 颜色/字念/混合 模式,组顶有标志(SVG 图标)
- [ ] 进阶 1秒/字 限时(超时未答 = 灰色脉冲)
- [ ] 黄字可读性处理(text-shadow 白色描边)
- [ ] 首页 7+1 占位卡片布局合理
- [ ] `npm run type-check` 通过
- [ ] `npx eslint` 0 errors
- [ ] dev server 启动无 "Failed to resolve"

## 调研步骤

1. 编写 `docs/superpowers/plans/2026-06-15-stroop.md`(实施计划)
2. 用 MiniMax API 生成图标
3. 派 subagent 按 plan 顺序执行(8-10 个 task)
4. 用 ui-ux-pro-max review 模式做视觉检查
5. 端到端验证(type-check, eslint, dev server, 3 档全跑)
6. 报告交付

## 已知风险

- **首页 7 卡片拥挤**: 3×2 + 第 7 项 + 第 8 项占位保持整齐
- **黄字对比度**: text-shadow 白色描边解决
- **"字念"模式按钮**: 4 个字按钮(红/蓝/黄/绿),与颜色按钮同位置切换
- **MiniMax API 返回 JPEG**: sips 转 PNG(已有经验)
- **1秒/字计时精度**: setInterval(100ms)检查,误差可接受
- **30秒/组 × 3组 = 90秒,加 5秒×2 = 100秒总时长**: 孩子能保持注意力
- **字/墨水冲突保持**: 强制 ink !== word 出题,避免变成"一致条件"游戏
- **"敬请期待" 占位**: 不要给空 path,沿用 digit-span 模式

## 完成标准

- 报告文件已 commit
- spec 已 self-review 通过
- 用户已 review 确认
