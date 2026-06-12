# 舒尔特方格（Schulte Grid）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「果果成长计划」中新增一个儿童专注力训练游戏页面——舒尔特方格，玩家按 1→N（反序则 N→1）依次点击方格内的数字，越快越好。

**Architecture:** 单文件 Vue 页面（`src/pages/game/shulte/index.vue`），使用 Vue 3 `<script setup>` + TypeScript + UniApp rpx 响应式单位。游戏状态全部在组件内 reactive，不引入 store；最佳成绩用 `uni.setStorageSync` 本地持久化。

**Tech Stack:** Vue 3 Composition API、UniApp、TypeScript、SCSS（rpx）、uni.setStorageSync

**关于测试：** 仓库当前无测试体系（无 jest/vitest 配置），按需求 YAGNI 不引入。每步通过"类型检查 + 手动跑 dev 验证"保证正确性。

**关于提交：** 用户要求本次开发**不做任何 commit**。所有任务中标注 `git commit` 的步骤**全部跳过**，subagent 不要执行 commit 动作，由用户在审阅后自己决定提交时机。

---

## 文件清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 新增 | `src/pages/game/shulte.vue` | 主页面，约 763 行（含格式化后） |
| 新增 | `src/static/images/shulte-icon.png` | 首页入口图标（MiniMax 文生图生成） |
| 修改 | `src/pages.json` | 在 pages 数组中插入新路由 |
| 修改 | `src/pages/index/index.vue` | appList 第 4 项替换为「舒尔特专注力」并换图标 |
| 修改 | `.gitignore` | 添加 `docs/minimax/key` |

> **重要修正（实施时发现）：** 最初 Task 2 创建了 `src/pages/game/shulte/index.vue`（子目录形式），但 `pages.json` 的 `path: "pages/game/shulte"` 不带 `/index` 后缀，被 UniApp/Vite 解析为单文件 `pages/game/shulte.vue`。Task 10 验证时发现 dev server 报 `Failed to resolve import "./pages/game/shulte.vue"`，已将文件移动到正确位置。

> 本项目 pages.json 路径约定：
> - `path: "pages/word/index"` → `src/pages/word/index.vue`（子目录 + `/index`）
> - `path: "pages/math/base"` → `src/pages/math/base.vue`（单文件，无 `/index`）
> - `path: "pages/game/linggu"` → `src/pages/game/linggu.vue`（单文件，无 `/index`）
> - `path: "pages/game/shulte"` → `src/pages/game/shulte.vue`（单文件，无 `/index`）

> **规律：** 当 path 不带 `/index` 后缀时，UniApp 期望一个单文件 `.vue`；当 path 带 `/index` 时，期望子目录里的 `index.vue`。

---

## Task 1: 注册路由和首页入口

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 在 pages.json 中注册新路由**

打开 `src/pages.json`，在 `pages` 数组最后一项（`pages/math/base`）之后插入：

```json
,
{
    "path": "pages/game/shulte",
    "style": {
        "navigationBarTitleText": "舒尔特专注力"
    }
}
```

预期：JSON 仍是合法 JSON，`pages` 数组含 5 项。

- [ ] **Step 2: 修改首页 appList 第 4 项**

打开 `src/pages/index/index.vue`，将 `appList` 数组的第 4 项从：

```typescript
{
    name: '敬请期待',
    path: '',
    icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838290.png',
},
```

改为（图标先用占位，Task 1.5 会换成文生图生成的图标）：

```typescript
{
    name: '舒尔特专注力',
    path: '/pages/game/shulte',
    icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838290.png',
},
```

预期：首页第 4 张卡片可点击，跳转到新页面。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 1.5: 生成舒尔特方格专属首页图标

**Files:**
- Create: `src/static/images/shulte-icon.png`
- Modify: `src/pages/index/index.vue`（使用新图标）

- [ ] **Step 1: 调用 MiniMax 文生图 API 生成图标**

```bash
mkdir -p src/static/images
KEY=$(cat docs/minimax/key | tr -d '\n')

curl -s https://api.minimaxi.com/v1/image_generation \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "image-01",
    "prompt": "App icon for a children Schulte Grid attention training game. Soft pink pastel background. A 5x5 grid of rounded squares in pastel colors (mint, sky blue, peach, cream). The number 1 in the center cell is highlighted in pink. Cute 3D claymorphism style, simple, clean, kid-friendly, no text. Square format.",
    "aspect_ratio": "1:1",
    "n": 1,
    "response_format": "url",
    "prompt_optimizer": true
  }' > /tmp/shulte_icon_response.json
```

预期：响应 `base_resp.status_code` 为 0，`data.image_urls` 数组含 1 个 URL。

- [ ] **Step 2: 下载图片到项目**

```bash
URL=$(cat /tmp/shulte_icon_response.json | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image_urls'][0])")
curl -s -o src/static/images/shulte-icon.png "$URL"
ls -lh src/static/images/shulte-icon.png
file src/static/images/shulte-icon.png
```

预期：文件存在，大小约 100-500KB，`file` 命令显示 PNG 格式。

- [ ] **Step 3: 检查 key 文件未被提交到 git**

```bash
git check-ignore docs/minimax/key
# 应输出：docs/minimax/key
# 如果没被忽略，必须现在加入 .gitignore
grep -q "docs/minimax" .gitignore || echo "docs/minimax/key" >> .gitignore
```

- [ ] **Step 4: 更新首页 appList 引用新图标**

打开 `src/pages/index/index.vue`，将第 4 项 `icon` 改为：

```typescript
{
    name: '舒尔特专注力',
    path: '/pages/game/shulte',
    icon: '/static/images/shulte-icon.png',
},
```

- [ ] **Step 5: 验证首页能加载新图标**

启动 dev：

```bash
npm run dev
```

浏览器打开首页，检查"舒尔特专注力"卡片的图标是否正确显示（粉色背景 + 5×5 网格）。

预期：图标显示正常，无 404。

- [ ] **Step 6: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 2: 创建页面骨架和数据模型

**Files:**
- Create: `src/pages/game/shulte/index.vue`

- [ ] **Step 1: 创建文件并写入骨架**

新建 `src/pages/game/shulte/index.vue`，写入：

```vue
<template>
    <view class="shulte-page">
        <view class="placeholder">舒尔特方格</view>
    </view>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    type Difficulty = 'easy' | 'standard' | 'reverse';

    interface CellItem {
        num: number;
        status: 'idle' | 'correct' | 'wrong';
    }

    // ===== 难度配置 =====
    const DIFFICULTY_CONFIG: Record<Difficulty, { size: number; max: number; reverse: boolean; label: string }> = {
        easy: { size: 4, max: 16, reverse: false, label: '入门' },
        standard: { size: 5, max: 25, reverse: false, label: '标准' },
        reverse: { size: 5, max: 25, reverse: true, label: '反序' },
    };

    // ===== 响应式状态 =====
    const currentDifficulty = ref<Difficulty>('standard');
    const gameState = ref<'idle' | 'playing' | 'finished'>('idle');
    const cells = ref<CellItem[]>([]);
    const currentTarget = ref(1);
    const startTime = ref(0);
    const elapsed = ref(0);
    const errorCount = ref(0);
    const bestRecord = ref<Record<Difficulty, number | null>>({
        easy: null,
        standard: null,
        reverse: null,
    });

    // ===== 工具函数 =====
    function generateGrid(max: number): CellItem[] {
        const nums = Array.from({ length: max }, (_, i) => i + 1);
        // Fisher-Yates 洗牌
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        return nums.map((n) => ({ num: n, status: 'idle' }));
    }
</script>

<style lang="scss" scoped>
    .shulte-page {
        min-height: 100vh;
    }
</style>
```

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

预期：无错误。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 3: 实现核心游戏逻辑（开始/重置/点击）

**Files:**
- Modify: `src/pages/game/shulte/index.vue`（在 `<script setup>` 中添加逻辑，在 `<template>` 中添加按钮）

- [ ] **Step 1: 添加游戏控制函数到 `<script setup>`**

在 `generateGrid` 函数之后添加：

```typescript
    // ===== 游戏控制 =====
    let timerId: number | null = null;

    function startGame() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        cells.value = generateGrid(cfg.max);
        currentTarget.value = cfg.reverse ? cfg.max : 1;
        startTime.value = Date.now();
        elapsed.value = 0;
        errorCount.value = 0;
        gameState.value = 'playing';

        timerId = setInterval(() => {
            elapsed.value = (Date.now() - startTime.value) / 1000;
        }, 100) as unknown as number;
    }

    function resetGame() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        gameState.value = 'idle';
        cells.value = [];
        currentTarget.value = 1;
        elapsed.value = 0;
        errorCount.value = 0;
    }

    function handleCellClick(cell: CellItem) {
        if (gameState.value !== 'playing') return;
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const expected = currentTarget.value;
        // 注：原本写为 cfg.reverse ? cfg.max + 1 - currentTarget.value : currentTarget.value
        // 但 currentTarget 初始值在 reverse 模式下是 cfg.max，所以 expected 直接等于 currentTarget 即可。
        // Task 3 实施时 implementer 发现了这个 bug 并修复。

        if (cell.num === expected) {
            cell.status = 'correct';
            // 0.5s 后清除状态（避免重渲染堆积）
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
            currentTarget.value = cfg.reverse
                ? currentTarget.value - 1
                : currentTarget.value + 1;

            if (
                (cfg.reverse && currentTarget.value < 1) ||
                (!cfg.reverse && currentTarget.value > cfg.max)
            ) {
                finishGame();
            }
        } else {
            cell.status = 'wrong';
            errorCount.value += 1;
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
        }
    }

    function finishGame() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        elapsed.value = (Date.now() - startTime.value) / 1000;
        gameState.value = 'finished';
        const prev = bestRecord.value[currentDifficulty.value];
        if (prev === null || elapsed.value < prev) {
            bestRecord.value[currentDifficulty.value] = elapsed.value;
            saveBest();
        }
    }
```

（注意：`saveBest` 函数在 Task 6 中实现。）

- [ ] **Step 2: 添加 timer 清理**

在 `<script setup>` 末尾（`finishGame` 函数之后）添加：

```typescript
    import { onUnmounted } from 'vue';

    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });
```

（提示：如果 IDE 提示 `onUnmounted` 应在文件顶部 import，调整 import 顺序。）

- [ ] **Step 3: 类型检查**

```bash
npm run type-check
```

预期：会报 `saveBest` 未定义（这是预期，下个 Task 解决，先继续）。先 commit。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 4: 实现最佳成绩持久化

**Files:**
- Modify: `src/pages/game/shulte/index.vue`

- [ ] **Step 1: 添加 onMounted 加载和 saveBest 函数**

在 `<script setup>` 顶部 import 区改为：

```typescript
    import { ref, onMounted, onUnmounted } from 'vue';
```

在 `finishGame` 函数之后添加：

```typescript
    // ===== 持久化 =====
    const STORAGE_KEY = 'shulte_best';

    function loadBest() {
        try {
            const raw = uni.getStorageSync(STORAGE_KEY);
            if (raw && typeof raw === 'object') {
                bestRecord.value = {
                    easy: raw.easy ?? null,
                    standard: raw.standard ?? null,
                    reverse: raw.reverse ?? null,
                };
            }
        } catch (e) {
            // 忽略
        }
    }

    function saveBest() {
        try {
            uni.setStorageSync(STORAGE_KEY, bestRecord.value);
        } catch (e) {
            // 忽略
        }
    }

    onMounted(() => {
        loadBest();
    });
```

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

预期：无错误。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 5: 实现难度切换器

**Files:**
- Modify: `src/pages/game/shulte/index.vue`（template + script + style）

- [ ] **Step 1: 添加 selectDifficulty 函数**

在 `<script setup>` 中 `resetGame` 函数之后添加：

```typescript
    function selectDifficulty(d: Difficulty) {
        if (currentDifficulty.value === d) return;
        currentDifficulty.value = d;
        if (gameState.value !== 'idle') {
            resetGame();
        }
    }
```

- [ ] **Step 2: 在 template 中添加难度卡片占位**

替换 `<template>` 的内容为：

```vue
<template>
    <view class="shulte-page">
        <view class="difficulty-row">
            <view
                v-for="d in (['easy', 'standard', 'reverse'] as Difficulty[])"
                :key="d"
                class="difficulty-card"
                :class="[
                    `difficulty-card--${d}`,
                    { 'difficulty-card--active': currentDifficulty === d },
                ]"
                @click="selectDifficulty(d)"
            >
                <view class="difficulty-card__label">
                    {{ DIFFICULTY_CONFIG[d].label }}
                </view>
                <view class="difficulty-card__size">
                    {{ DIFFICULTY_CONFIG[d].size }}×{{ DIFFICULTY_CONFIG[d].size }}
                </view>
            </view>
        </view>
        <view class="placeholder">舒尔特方格</view>
    </view>
</template>
```

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 6: 实现主网格区

**Files:**
- Modify: `src/pages/game/shulte/index.vue`（template + style）

- [ ] **Step 1: 替换 template，添加网格和计时器**

完整替换 `<template>` 为：

```vue
<template>
    <view class="shulte-page">
        <view class="difficulty-row">
            <view
                v-for="d in (['easy', 'standard', 'reverse'] as Difficulty[])"
                :key="d"
                class="difficulty-card"
                :class="[
                    `difficulty-card--${d}`,
                    { 'difficulty-card--active': currentDifficulty === d },
                ]"
                @click="selectDifficulty(d)"
            >
                <view class="difficulty-card__label">
                    {{ DIFFICULTY_CONFIG[d].label }}
                </view>
                <view class="difficulty-card__size">
                    {{ DIFFICULTY_CONFIG[d].size }}×{{ DIFFICULTY_CONFIG[d].size }}
                </view>
            </view>
        </view>

        <view class="grid-wrap">
            <view class="timer-pill">
                ⏱ {{ formatTime(elapsed) }}
            </view>
            <view
                v-if="gameState === 'playing' || gameState === 'finished'"
                class="grid"
                :class="`grid--${currentDifficulty}`"
            >
                <view
                    v-for="(cell, idx) in cells"
                    :key="idx"
                    class="cell"
                    :class="[
                        `cell--${cell.status}`,
                        { 'cell--disabled': gameState === 'finished' },
                    ]"
                    @click="handleCellClick(cell)"
                >
                    {{ cell.num }}
                </view>
            </view>
            <view v-else class="grid-placeholder">
                点击"开始"挑战
            </view>
        </view>

        <view class="control-row">
            <view class="best">
                最佳 {{ bestRecord[currentDifficulty] ? formatTime(bestRecord[currentDifficulty]!) : '—' }}
            </view>
            <view
                v-if="gameState !== 'playing'"
                class="btn-primary"
                @click="startGame"
            >
                {{ gameState === 'finished' ? '再来一局' : '开始' }}
            </view>
            <view
                v-else
                class="btn-secondary"
                @click="resetGame"
            >
                重置
            </view>
        </view>
    </view>
</template>
```

- [ ] **Step 2: 添加 formatTime 函数**

在 `<script setup>` 中 `selectDifficulty` 函数之后添加：

```typescript
    function formatTime(seconds: number): string {
        return seconds.toFixed(1) + 's';
    }
```

- [ ] **Step 3: 类型检查 + 提交（跳过）**

```bash
npm run type-check
```

> 用户要求不做 commit，git add/commit 跳过。

预期：type-check 无错误。

---

## Task 7: 实现完成弹窗

**Files:**
- Modify: `src/pages/game/shulte/index.vue`（template + style + 新增 replay 函数）

- [ ] **Step 1: 添加 replay 函数**

在 `<script setup>` 中 `formatTime` 函数之后添加：

```typescript
    function replay() {
        startGame();
    }

    function isNewRecord(): boolean {
        if (gameState.value !== 'finished') return false;
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        // 完成时记录的 elapsed 是当前用时
        // 与存储中"完成前"的 best 对比已经在 finishGame 内做；
        // 这里通过 elapsed === bestRecord 来判断"是否刚刚破纪录"
        return elapsed.value === bestRecord.value[currentDifficulty.value];
    }
```

- [ ] **Step 2: 在 template 末尾（`</view>` 闭合 shulte-page 之前）插入弹窗**

在 `</view>` 关闭 `<view class="shulte-page">` 之前插入：

```vue
        <view v-if="gameState === 'finished'" class="modal-mask" @click.self="selectDifficulty(currentDifficulty)">
            <view class="modal-card">
                <view class="modal-medal">🏅</view>
                <view class="modal-title">完成啦！</view>
                <view class="modal-stats">
                    <view class="modal-stat">
                        <view class="modal-stat__label">本次用时</view>
                        <view class="modal-stat__value">{{ formatTime(elapsed) }}</view>
                    </view>
                    <view class="modal-stat">
                        <view class="modal-stat__label">错误次数</view>
                        <view class="modal-stat__value">{{ errorCount }}</view>
                    </view>
                </view>
                <view v-if="isNewRecord()" class="modal-record">🏆 新纪录！</view>
                <view class="modal-actions">
                    <view class="btn-primary" @click="replay">再来一局</view>
                    <view class="btn-secondary" @click="resetGame">换难度</view>
                </view>
            </view>
        </view>
```

（提示：暂用 emoji 字符；Task 9 视觉打磨时换成 SVG。）

- [ ] **Step 3: 类型检查 + 提交（跳过）**

```bash
npm run type-check
```

> 用户要求不做 commit，git add/commit 跳过。

---

## Task 8: Claymorphism 视觉风格

**Files:**
- Modify: `src/pages/game/shulte/index.vue`（仅 `<style>` 块）

- [ ] **Step 1: 替换 style 块为完整视觉样式**

完整替换 `<style lang="scss" scoped>` 块为：

```scss
<style lang="scss" scoped>
    // ===== 主题变量 =====
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $primary-light: #ffd9e1;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $accent: #F97316;
    $text: #1e1b4b;
    $text-soft: #c25a70;

    $green: #22C55E;
    $red: #EF4444;
    $mint: #98FF98;
    $sky: #ADD8E6;
    $peach: #FFD3B6;

    .shulte-page {
        min-height: 100vh;
        background: linear-gradient(180deg, $bg 0%, $bg-end 100%);
        padding: 24rpx 32rpx 48rpx;
        display: flex;
        flex-direction: column;
        gap: 32rpx;
        color: $text;
        font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
    }

    // ===== 难度卡片 =====
    .difficulty-row {
        display: flex;
        gap: 16rpx;
        justify-content: space-between;
    }
    .difficulty-card {
        flex: 1;
        height: 140rpx;
        border-radius: 24rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        cursor: pointer;
        touch-action: manipulation;
        background: #fff;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.6),
            inset 4rpx 4rpx 12rpx rgba(194, 90, 112, 0.12),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
    }
    .difficulty-card__label {
        font-size: 32rpx;
        font-weight: 700;
        color: $text;
    }
    .difficulty-card__size {
        font-size: 24rpx;
        color: $text-soft;
    }
    .difficulty-card--easy { background: linear-gradient(135deg, #f0fff0, #d8f5d8); }
    .difficulty-card--standard { background: linear-gradient(135deg, #f0f8ff, #d8ebf5); }
    .difficulty-card--reverse { background: linear-gradient(135deg, #fff5eb, #ffe0c8); }
    .difficulty-card--active {
        transform: translateY(-8rpx);
        border-color: $primary;
        box-shadow:
            inset -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.6),
            inset 4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15),
            6rpx 8rpx 20rpx rgba(194, 90, 112, 0.3);
    }
    .difficulty-card:active {
        transform: scale(0.97);
    }
    .difficulty-card--active:active {
        transform: translateY(-8rpx) scale(0.97);
    }

    // ===== 网格区 =====
    .grid-wrap {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 600rpx;
    }
    .timer-pill {
        position: absolute;
        top: 0;
        right: 0;
        padding: 8rpx 20rpx;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 24rpx;
        font-size: 28rpx;
        font-weight: 700;
        color: $primary-dark;
        box-shadow:
            inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6),
            2rpx 2rpx 8rpx rgba(194, 90, 112, 0.2);
        z-index: 2;
    }
    .grid {
        display: grid;
        gap: 16rpx;
        padding: 24rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 32rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.5),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.12),
            8rpx 8rpx 24rpx rgba(194, 90, 112, 0.18);
        touch-action: manipulation;
    }
    .grid--easy { grid-template-columns: repeat(4, 140rpx); }
    .grid--standard, .grid--reverse { grid-template-columns: repeat(5, 110rpx); }
    .grid-placeholder {
        font-size: 32rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .cell {
        width: 100%;
        height: 140rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 24rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 12rpx rgba(255, 255, 255, 0.6),
            inset 4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15),
            6rpx 6rpx 16rpx rgba(194, 90, 112, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 64rpx;
        font-weight: 700;
        color: $primary-dark;
        cursor: pointer;
        user-select: none;
        transition: transform 0.15s ease-out, background 0.4s ease-out, box-shadow 0.4s ease-out;
    }
    .grid--standard .cell, .grid--reverse .cell {
        width: 110rpx;
        height: 110rpx;
        font-size: 48rpx;
    }
    .grid--reverse .cell { font-size: 52rpx; }
    .cell:active { transform: scale(0.95); }
    .cell--correct {
        background: linear-gradient(135deg, #d8ffe0, #a8f0b8);
        color: #166534;
    }
    .cell--wrong {
        background: linear-gradient(135deg, #ffe0e0, #ffb8b8);
        color: #991b1b;
    }
    .cell--disabled {
        pointer-events: none;
        opacity: 0.7;
    }

    // ===== 控制行 =====
    .control-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16rpx;
        padding: 0 8rpx;
    }
    .best {
        font-size: 28rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .btn-primary, .btn-secondary {
        height: 88rpx;
        padding: 0 48rpx;
        border-radius: 44rpx;
        font-size: 32rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        touch-action: manipulation;
        border: 4rpx solid #fff;
        transition: transform 0.15s ease-out, box-shadow 0.2s;
    }
    .btn-primary {
        background: linear-gradient(145deg, #ffb0c0, $primary);
        color: #fff;
        box-shadow:
            inset 0 4rpx 8rpx rgba(255, 255, 255, 0.3),
            inset 0 -4rpx 0 $primary-dark,
            0 8rpx 20rpx rgba(194, 90, 112, 0.3);
    }
    .btn-secondary {
        background: #fff;
        color: $primary-dark;
        box-shadow:
            inset 0 4rpx 8rpx rgba(255, 255, 255, 0.6),
            0 6rpx 16rpx rgba(194, 90, 112, 0.2);
    }
    .btn-primary:active, .btn-secondary:active {
        transform: scale(0.95);
    }

    // ===== 弹窗 =====
    .modal-mask {
        position: fixed;
        inset: 0;
        background: rgba(31, 27, 75, 0.4);
        backdrop-filter: blur(8rpx);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 50;
        animation: maskIn 0.3s ease-out;
    }
    .modal-card {
        width: 80vw;
        max-width: 600rpx;
        background: #fff;
        border-radius: 32rpx;
        padding: 48rpx 32rpx 32rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.6),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.15),
            12rpx 12rpx 32rpx rgba(194, 90, 112, 0.3);
        animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-medal {
        font-size: 96rpx;
        line-height: 1;
    }
    .modal-title {
        font-size: 56rpx;
        font-weight: 800;
        color: $primary-dark;
        letter-spacing: 4rpx;
    }
    .modal-stats {
        display: flex;
        gap: 32rpx;
        width: 100%;
        justify-content: center;
    }
    .modal-stat {
        flex: 1;
        text-align: center;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 20rpx;
        padding: 16rpx;
        box-shadow: inset 0 2rpx 4rpx rgba(255, 255, 255, 0.6);
    }
    .modal-stat__label {
        font-size: 24rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .modal-stat__value {
        font-size: 40rpx;
        color: $primary-dark;
        font-weight: 800;
    }
    .modal-record {
        font-size: 36rpx;
        font-weight: 800;
        color: $accent;
        animation: recordBlink 0.4s ease-in-out 2;
    }
    .modal-actions {
        display: flex;
        gap: 16rpx;
        width: 100%;
    }
    .modal-actions .btn-primary, .modal-actions .btn-secondary {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
    }

    @keyframes maskIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes cardIn {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
    }
    @keyframes recordBlink {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .modal-card, .modal-mask, .modal-record {
            animation: none;
        }
        .cell, .difficulty-card, .btn-primary, .btn-secondary {
            transition: none;
        }
    }
</style>
```

- [ ] **Step 2: 类型检查 + 启动 dev 验证**

```bash
npm run type-check
```

预期：无错误。

启动 H5 手动验证：

```bash
npm run dev
```

预期：浏览器打开 `http://localhost:8092/growth-plan/`，首页"舒尔特专注力"入口可点击，进入页面，3 张难度卡片渲染，点击"开始"出现 5×5 数字，点击数字有颜色反馈，计时器走动，完成后弹窗出现。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 9: 把 emoji 图标换成 SVG

**Files:**
- Modify: `src/pages/game/shulte/index.vue`

- [ ] **Step 1: 替换 ⏱ 为 SVG**

在 template 中找到 `⏱ {{ formatTime(elapsed) }}`，替换为：

```vue
<svg viewBox="0 0 24 24" width="28" height="28" fill="none" style="vertical-align: middle; margin-right: 6rpx;">
    <circle cx="12" cy="13" r="8" stroke="#c25a70" stroke-width="2" fill="none" />
    <path d="M12 9v4l3 2" stroke="#c25a70" stroke-width="2" stroke-linecap="round" />
    <path d="M9 3h6" stroke="#c25a70" stroke-width="2" stroke-linecap="round" />
</svg>
{{ formatTime(elapsed) }}
```

- [ ] **Step 2: 替换 🏅 为 SVG 奖章**

在 template 中找到 `<view class="modal-medal">🏅</view>`，替换为：

```vue
<svg class="modal-medal" viewBox="0 0 64 64" width="96" height="96">
    <circle cx="32" cy="32" r="22" fill="#FFD700" stroke="#FFA500" stroke-width="2" />
    <circle cx="32" cy="32" r="16" fill="#FFEC8B" />
    <text x="32" y="40" text-anchor="middle" font-size="20" font-weight="800" fill="#FF8C00">★</text>
    <path d="M22 8 L18 0 L26 4 L32 0 L38 4 L46 0 L42 8" fill="#FF6B6B" stroke="#C0392B" stroke-width="1" />
</svg>
```

- [ ] **Step 3: 替换 🏆 为 SVG 奖杯**

在 template 中找到 `<view v-if="isNewRecord()" class="modal-record">🏆 新纪录！</view>`，替换为：

```vue
<view v-if="isNewRecord()" class="modal-record">
    <svg viewBox="0 0 24 24" width="36" height="36" style="vertical-align: middle; margin-right: 8rpx;">
        <path d="M5 4h14v4a5 5 0 0 1-5 5h-4A5 5 0 0 1 5 8V4z" fill="#F97316" stroke="#C2410C" stroke-width="1" />
        <path d="M5 6H2v2a3 3 0 0 0 3 3" fill="none" stroke="#F97316" stroke-width="1.5" />
        <path d="M19 6h3v2a3 3 0 0 1-3 3" fill="none" stroke="#F97316" stroke-width="1.5" />
        <rect x="9" y="16" width="6" height="3" fill="#C25A70" />
        <rect x="7" y="19" width="10" height="3" rx="1" fill="#C25A70" />
    </svg>
    新纪录！
</view>
```

同时把 `.modal-record` 改为 flex 布局让 SVG 和文字居中：

```scss
    .modal-record {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36rpx;
        font-weight: 800;
        color: $accent;
        animation: recordBlink 0.4s ease-in-out 2;
    }
```

- [ ] **Step 4: 类型检查**

```bash
npm run type-check
```

预期：无错误。

> 用户要求不做 commit，git add/commit 跳过。

---

## Task 10: 端到端验证

**Files:**
- (no code changes)

- [ ] **Step 1: 跑完整类型检查**

```bash
npm run type-check
```

预期：无错误。

- [ ] **Step 2: 启动 dev 服务器**

```bash
npm run dev
```

- [ ] **Step 3: 浏览器手动测试 3 个难度**

在浏览器中（推荐 iPhone SE 模拟器）：

1. 打开首页 → 点击"舒尔特专注力"入口
2. 默认显示标准 5×5；点击"开始"
3. 按 1→25 顺序点击数字（其中故意点错 2 次，验证红色脉冲 + 错误数 +2）
4. 完成后验证：
   - 弹窗显示用时 + 错误数
   - "🏆 新纪录！" 显示
   - "最佳" 显示刚保存的成绩
   - "再来一局"重置网格并继续计时
5. 切换到"入门 4×4"，点击"开始"，验证 4×4 网格
6. 切换到"反序 5×5"，点击"开始"，验证应从 25→1 点
7. 刷新页面，验证"最佳"成绩保留
8. 关闭浏览器再打开 dev，验证成绩仍在

- [ ] **Step 4: 检查无 console 错误**

浏览器 devtools console 应该没有红色 error。

- [ ] **Step 5: lint 检查（如有）**

```bash
npm run lint
```

预期：无错误或仅有 pre-existing warnings。

- [ ] **Step 6: 提交（跳过）**

> 用户要求不做 commit，此步跳过。`git status` 可用于查看未提交改动。

---

## 验收清单

- [ ] 3 个难度（4×4 / 5×5 / 5×5 反序）均能跑
- [ ] 计时精确到 0.1s，刷新页面不丢
- [ ] 点对绿脉冲、点错红脉冲（不停止游戏）
- [ ] 完成弹窗带入场动画 + 渐变 + "新纪录"提示
- [ ] 最佳成绩用 uni.setStorageSync 持久化
- [ ] 首页"敬请期待" → "舒尔特专注力"
- [ ] Claymorphism 视觉风格统一（双层阴影 + 圆角 + 渐变）
- [ ] 不用 emoji 当 UI 图标（用 SVG 替代）
- [ ] `touch-action: manipulation` + `@media (prefers-reduced-motion)` 已加
- [ ] `npm run type-check` 通过

## 不在范围（YAGNI）

- 排行榜、用户登录
- 多语言、暗色模式
- 横屏适配
- 振动反馈（uni.vibrateShort）
- 单元测试
- 完成动画的"扩散"效果（已用 modal 居中弹窗替代）
- 中途暂停/恢复
