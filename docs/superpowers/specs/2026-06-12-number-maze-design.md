# 数字迷宫（Number Maze）实施设计

> 状态：已批准，待实施
> 起草日期：2026-06-12

## 目的

在「果果成长计划」中新增一个儿童专注力训练游戏——数字迷宫。区别于舒尔特方格的"点击顺序数字"，数字迷宫通过**手指沿路径拖拽**完成 1→N 的顺序点击，训练视觉追踪、路径规划、动作连贯性三种能力的组合。

## 用户场景

- 孩子：6 岁，能坐住 10-15 分钟，手指精细动作尚在发展中
- 时长：每天 ≤ 10 分钟
- 设备：手机/平板（H5 为主，小程序兼容）
- 阅读人：家长，目标是照着带孩子玩

## 报告组织（按训练能力分类）

本设计直接对应 `docs/research/2026-06-11-6y-focus-games.md` 中 A2 数字迷宫条目（"A. 视觉专注"分类下的"进阶"游戏）。

## 范围

### 包含

1. 新页面 `src/pages/game/maze/index.vue`（约 500-600 行）
2. 首页重构：`appList` 从 2×2 改为 2×3 网格（6 个位）
3. 3 个难度（3×3 入门 / 5×5 标准 / 5×5 双色）
4. 拖拽交互（手指沿路径移动，途经预期数字则通关，途经墙/非预期数字则错误）
5. 完成弹窗 + 计时器 + 最佳成绩（`uni.setStorageSync`）
6. 首页入口图标（用 MiniMax API 生成）

### 不包含（YAGNI）

- 排行榜、用户登录
- 多语言、暗色模式
- 横屏适配
- 振动反馈（`uni.vibrateShort`）
- 反向模式（25→1 留 v0.2）
- 倒计时模式
- 关卡/解锁系统
- 单元测试（项目当前无测试体系）

## 关键架构

### 1. 数据结构

```typescript
type Difficulty = 'easy' | 'standard' | 'dual';
type CellType = 'wall' | 'path' | 'start' | 'end' | 'numbered';

interface Cell {
    row: number;
    col: number;
    type: CellType;
    number: number | null;       // 仅 numbered 单元格有
    color?: 'red' | 'blue';      // 仅双色模式
    status: 'idle' | 'correct' | 'wrong';
}

type Maze = Cell[][];
```

### 2. 预制骨架 + 随机微变

每难度预制 2-3 个候选骨架（手画的 2D 数组），每局随机选一个，再移除 1-2 个"可选"墙（保留主路径连通性）做微变。

```typescript
// 骨架示例（3x3 S 形），真实值在 src/pages/game/maze/index.vue 定义
const SKELETON_3X3_S = [
    ['S', '1', '2'],
    ['#', '#', '3'],
    ['9', '8', '4'],
    // 7, 6, 5 会按路径顺序填入
];
```

骨架的"路径单元"会被随机分配 1-9（3×3）或 1-25（5×5）的数字（按路径顺序）。

### 3. 核心交互流

```
idle 状态
  ↓ 用户触摸 number 1
dragging 状态：开始计时
  ↓ 手指持续 touchmove
每帧检测 fingerRow/fingerCol
  ├─ 墙（type === 'wall'）→ 红色脉冲，errorCount++，不停止
  ├─ 数字（type === 'numbered'）→ 若 number === currentTarget → 绿色脉冲，currentTarget++；否则 → 红色脉冲，errorCount++
  ├─ 路径/起点/终点（type !== 'wall'）→ 正常通过，无反馈
  ↓
touchend 时
  ├─ currentTarget > max → finished 状态，停止计时，弹完成窗
  └─ currentTarget <= max → 视为放弃，重置进度（不算最佳成绩）
```

### 4. 拖拽精度

- 每个 cell 至少 80rpx × 80rpx（5×5 模式），满足 44px 最小触摸目标
- `touch-action: none` 防止页面滚动干扰
- Vue 3 修饰符 `@touchmove.prevent`
- 用 `e.touches[0].clientX/Y - gridContainerRect.left/top` 计算手指在 grid 内的相对坐标
- 相对坐标 ÷ cellSize 得到当前所在 cell

### 5. 状态机

```typescript
type GameState = 'idle' | 'dragging' | 'finished';
```

- `idle` → 渲染完整迷宫，等待触摸 number 1
- `dragging` → 计时中，接收 touchmove
- `finished` → 完成弹窗

### 6. 视觉反馈

- **墙**：与背景同色（视觉"消失"），或用浅粉渐变让"墙感"清晰
- **路径**：白色背景 + 4rpx 浅灰边框
- **数字格**：与舒尔特方格一致（双层阴影 + 圆角 24rpx）
- **拖拽中**：
  - 当前所在 cell 画浅粉色光环（"你正经过这里"）
  - 走过的路径从起点到当前点变粉色（用 SVG overlay 跟踪）
- **完成时**：与舒尔特方格一致的弹窗

### 7. 数据持久化

```typescript
const STORAGE_KEY = 'maze_best';
// 形状：{ easy: number | null, standard: number | null, dual: number | null }
```

复用舒尔特方格的 `loadBest` / `saveBest` 模式（不抽象为公共模块，按 YAGNI）。

## 视觉设计（与舒尔特方格保持一致 + 迷宫拖拽专项）

### 基础规范（复用舒尔特）

- Claymorphism，圆角 16-24rpx
- 主色 `#ff85a1`，强调橙 `#F97316`
- 难度色：入门=薄荷绿 `#98FF98`、标准=天空蓝 `#ADD8E6`、双色=暖橙 `#FFD3B6`
- 双色模式的路径色：红 `#EF4444` / 蓝 `#3B82F6`
- 边框 `4rpx solid #fff`
- 双层阴影（inset light + inset dark + outer drop）
- `touch-action: manipulation/none`
- `@media (prefers-reduced-motion: reduce)` 包裹所有动画
- 难度切换器 = 3 张卡片（与舒尔特一致）
- 计时器胶囊（与舒尔特一致）
- 完成弹窗 = 居中卡片 + SVG 奖章 + 入场 scale 动画

### 迷宫单元格参数

| 元素 | 5×5 模式 | 3×3 模式 |
|------|----------|----------|
| 单元尺寸 | 100rpx × 100rpx | 140rpx × 140rpx |
| 单元间距 | 8rpx | 12rpx |
| 数字字号 | 48rpx | 72rpx |
| 圆角 | 16rpx | 24rpx |
| 起点/终点 | 路径样式 + 内部小图标（🏁/🏆 SVG） | 同 |

### 双层阴影配方

```css
box-shadow:
    inset -2rpx -2rpx 6rpx rgba(255,255,255,0.6),
    inset 2rpx 2rpx 6rpx rgba(194,90,112,0.15),
    4rpx 4rpx 12rpx rgba(194,90,112,0.18);
```

### 拖拽视觉反馈（4 个状态）

**a. 当前所在格：粉色光环**
```css
.cell--cursor::after {
    content: '';
    position: absolute;
    inset: -6rpx;
    border-radius: inherit;
    border: 4rpx solid $primary;
    box-shadow: 0 0 16rpx rgba(255, 133, 161, 0.6);
    pointer-events: none;
    animation: glow 1s ease-in-out infinite;
}
```

**b. 已走路径：粉色痕迹（SVG overlay）**
- 单元格上方叠一个 absolute 的 `<svg>` 元素
- 监听 currentTarget 变化时，从上一点中心 → 当前点中心画 8rpx 宽粉色线条
- 用 cubic-bezier 缓动，duration 200ms

**c. 红色脉冲（错点）**
```css
@keyframes pulseRed {
    0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    30%  { background: linear-gradient(135deg, #ffe0e0, #ffb8b8); }
    100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
}
.cell--wrong { animation: pulseRed 0.5s ease-out; }
```

**d. 绿色脉冲（对点）**
```css
@keyframes pulseGreen {
    0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    30%  { background: linear-gradient(135deg, #d8ffe0, #a8f0b8); }
    100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
}
.cell--correct { animation: pulseGreen 0.5s ease-out; }
```

`prefers-reduced-motion` 时全部降为即时切换。

### 三大区布局

```
┌─────────────────────────────────┐
│  🏠 顶栏 (8%)                    │  ← 返回首页 icon
├─────────────────────────────────┤
│  难度切换器 (18%)                │  ← 3 张卡片（与舒尔特一致）
├─────────────────────────────────┤
│  迷宫主区 (62%)                  │  ← 5×5 或 3×3 grid
│  ⏱ 浮动计时器 (右上角覆盖)        │  ← 半透明胶囊
│  路径 overlay (absolute)         │  ← SVG 粉色痕迹
├─────────────────────────────────┤
│  底部控制 (12%)                  │  ← 最佳成绩 + 开始/重置
└─────────────────────────────────┘
```

### 移动端响应式

| 视口 | 5×5 单元 | 3×3 单元 |
|------|---------|---------|
| iPhone SE (375px) | 60rpx | 80rpx |
| iPhone 14 (390px) | 68rpx | 92rpx |
| iPhone 14 Pro Max (430px) | 76rpx | 100rpx |
| iPad mini (768px) | 100rpx | 140rpx |

**拖拽准确性关键点：**
- `touch-action: none` 在 grid 容器上
- Vue 3 修饰符 `@touchmove.prevent` 阻止默认
- `overscroll-behavior: contain` 防止 iOS 弹性滚动
- `e.preventDefault()` 在 touchstart 也调用一次（双保险）
- 监听 `touchend` 而非 `mouseup`

**误触避免：**
- 必须触摸 number 1 才能开始（`gameState === 'idle' → 'dragging'`）
- 触摸普通路径/起点/终点不开始游戏
- `@touchstart` 在 number 1 之外触发 → 忽略

### 不使用 emoji
按 ui-ux-pro-max 硬规则，用 SVG 替代：
- ⏱ 计时器 → 圆形 + 时针分针 SVG
- 🏁 起点 → 三角旗 SVG
- 🏆 终点 → 奖杯 SVG
- 🏅 完成弹窗奖章 → 复用舒尔特 SVG

## 文件改动

```
新增：src/pages/game/maze/index.vue                       # 主页面 ~550 行
新增：src/static/images/maze-icon.png                     # 首页入口图标（MiniMax API 生成）
修改：src/pages.json                                       # 新增路由
修改：src/pages/index/index.vue                            # appList 加第 5 项 + CSS 网格从 2 列改 3 列
```

## 图标生成

用 MiniMax 文生图 API（参考 memory: `minimax-text-to-image.md`）。

**Prompt：**
> App icon for a children number maze attention game. Soft pink pastel background. A simple maze path with a start flag, ending at a flag with number 1. 3D claymorphism style, kid-friendly, no text. Square format.

**调用：**
```bash
KEY=$(cat docs/minimax/key | tr -d '\n')
curl -s https://api.minimaxi.com/v1/image_generation \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "image-01",
    "prompt": "App icon for a children number maze attention game. Soft pink pastel background. A simple maze path with a start flag, ending at a flag with number 1. 3D claymorphism style, kid-friendly, no text. Square format.",
    "aspect_ratio": "1:1",
    "n": 1,
    "response_format": "url",
    "prompt_optimizer": true
  }' > /tmp/maze_icon_response.json
URL=$(cat /tmp/maze_icon_response.json | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image_urls'][0])")
curl -s -o src/static/images/maze-icon.png "$URL"
```

如果 API 返回 JPEG，用 `sips` 转 PNG（与舒尔特图标经验一致）。

## 首页重构

`src/pages/index/index.vue` 的 `appList` 从 4 项改 5 项：

```typescript
const appList = [
    { name: '文字学习', path: '/pages/word/index', icon: '...' },
    { name: '基础运算', path: '/pages/math/base', icon: '...' },
    { name: '领鼓游戏', path: '/pages/game/linggu', icon: '...' },
    { name: '舒尔特专注力', path: '/pages/game/shulte', icon: '/static/images/shulte-icon.png' },
    { name: '数字迷宫', path: '/pages/game/maze', icon: '/static/images/maze-icon.png' },
];
```

CSS 网格从 `grid-template-columns: repeat(2, 1fr)` 改为 `repeat(3, 1fr)`（移动端一屏 6 个，3×2 排布）。

## 验收标准

- [ ] 3 个难度都能玩
- [ ] 拖拽流畅：墙/非预期数字 → 红色脉冲 + errorCount++，预期数字 → 绿色脉冲 + currentTarget++
- [ ] 走完所有数字 → 完成弹窗 + 计时停止
- [ ] 最佳成绩持久化（uni.setStorageSync）
- [ ] 首页 6 卡片 2×3 网格展示
- [ ] `npm run type-check` 通过（除 linggu 预存错误外）
- [ ] `npx eslint` 0 errors
- [ ] dev server 启动无 "Failed to resolve" 错误

## 调研步骤

1. 编写 `docs/superpowers/plans/2026-06-12-number-maze.md`（实施计划）
2. 派 subagent 按 plan 顺序执行（约 8-10 个 task）
3. 端到端验证
4. 报告交付

## 已知风险

- **拖拽检测的精度** — 6 岁孩子手指粗、动作不精确，cell 至少 80rpx 是底线；`touch-action: none` 防止误滚动
- **API 返回 JPEG** — 与舒尔特图标经验一致，需用 `sips` 转 PNG
- **预制骨架需要手画** — 3 个难度 × 2-3 个候选 = 6-9 个迷宫，需要在 plan 阶段手画好存为常量

## 完成标准

- 报告文件已 commit
- spec 已 self-review 通过
- 用户已 review 确认
