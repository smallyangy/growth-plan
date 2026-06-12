# 数字迷宫（Number Maze）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「果果成长计划」中新增一个儿童专注力训练游戏页面——数字迷宫，玩家通过**手指拖拽**从起点 1 沿视觉路径拖到终点 N，每经过一个数字格验证正确性。

**Architecture:** 单文件 Vue 页面（`src/pages/game/maze.vue`，约 500-600 行），使用 Vue 3 `<script setup>` + TypeScript + UniApp rpx 响应式单位。3 个难度（3×3 / 5×5 / 5×5 双色），难度切换在同一页面。游戏状态全部在组件内 reactive；最佳成绩用 `uni.setStorageSync` 本地持久化。首页 appList 从 4 项扩到 5 项，CSS 网格从 2 列改 3 列。

**Tech Stack:** Vue 3 Composition API、UniApp、TypeScript、SCSS（rpx）、uni.setStorageSync

**关于测试：** 仓库当前无测试体系（无 jest/vitest 配置），按需求 YAGNI 不引入。每步通过"类型检查 + 手动跑 dev 验证"保证正确性。

**关于提交：** 用户要求本次开发**不做任何 commit**。所有任务中标注 `git commit` 的步骤**全部跳过**，subagent 不要执行 commit 动作。

**关于路径约定：** 项目 pages.json 路径约定：
- `path: "pages/X/Y"` → 单文件 `Y.vue`（本项目舒尔特方格、领鼓游戏、基础运算都用此）
- `path: "pages/X/Y/index"` → 子目录 `Y/index.vue`
- 本计划的数字迷宫用前者：**单文件 `src/pages/game/maze.vue`**

---

## 文件清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 新增 | `src/pages/game/maze.vue` | 主页面，约 500-600 行 |
| 新增 | `src/static/images/maze-icon.png` | 首页入口图标（MiniMax 文生图生成） |
| 修改 | `src/pages.json` | 在 pages 数组中插入新路由 |
| 修改 | `src/pages/index/index.vue` | appList 加第 5 项 + CSS 网格从 2 列改 3 列 |

---

## Task 1: 注册路由和首页重构（2×2 → 2×3 网格 + 第 5 项）

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 在 pages.json 中注册新路由**

打开 `src/pages.json`，在 `pages` 数组最后一项（`pages/game/shulte`）之后插入：

```json
,
{
    "path": "pages/game/maze",
    "style": {
        "navigationBarTitleText": "数字迷宫"
    }
}
```

预期：JSON 仍是合法 JSON，`pages` 数组含 5 项。

- [ ] **Step 2: 修改首页 appList 加第 5 项**

打开 `src/pages/index/index.vue`，在 `appList` 数组最后一项（`舒尔特专注力`）之后添加：

```typescript
        ,
        {
            name: '数字迷宫',
            path: '/pages/game/maze',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838290.png',
        },
```

预期：`appList` 数组含 5 项（文字学习、基础运算、领鼓游戏、舒尔特专注力、数字迷宫）。图标先用占位，Task 1.5 会换成文生图生成的图标。

- [ ] **Step 3: 修改首页 CSS 网格从 2 列改 3 列**

在 `src/pages/index/index.vue` 的 `<style>` 块中找到：

```scss
.app-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 32rpx;
    padding: 0 24rpx;
}
```

改为：

```scss
.app-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24rpx;
    padding: 0 24rpx;
}
```

预期：5 个卡片在移动端排成 2 行（第一行 3 个，第二行 2 个）。可能需要调整 `.app-item` 的最小高度使其在 3 列下不挤压。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 1.5: 生成数字迷宫专属首页图标

**Files:**
- Create: `src/static/images/maze-icon.png`
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
    "prompt": "App icon for a children number maze attention game. Soft pink pastel background. A simple maze path with a start flag, ending at a flag with number 1. 3D claymorphism style, kid-friendly, no text. Square format.",
    "aspect_ratio": "1:1",
    "n": 1,
    "response_format": "url",
    "prompt_optimizer": true
  }' > /tmp/maze_icon_response.json
```

预期：响应 `base_resp.status_code` 为 0，`data.image_urls` 数组含 1 个 URL。

- [ ] **Step 2: 下载图片到项目（API 返回 JPEG 时用 sips 转 PNG）**

```bash
URL=$(cat /tmp/maze_icon_response.json | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image_urls'][0])")
curl -s -o src/static/images/maze-icon-raw.jpg "$URL"

# 检查是否为 JPEG（API 经验），若是则用 sips 转 PNG
file src/static/images/maze-icon-raw.jpg
sips -s format png src/static/images/maze-icon-raw.jpg --out src/static/images/maze-icon.png
rm src/static/images/maze-icon-raw.jpg
ls -lh src/static/images/maze-icon.png
file src/static/images/maze-icon.png
```

预期：`file` 命令显示 PNG 格式，文件大小约 100-500KB。

- [ ] **Step 3: 验证 key 仍在 .gitignore 中**

```bash
git check-ignore docs/minimax/key
# 应输出：docs/minimax/key
```

- [ ] **Step 4: 更新首页 appList 引用新图标**

打开 `src/pages/index/index.vue`，将"数字迷宫"项的 `icon` 改为：

```typescript
        {
            name: '数字迷宫',
            path: '/pages/game/maze',
            icon: '/static/images/maze-icon.png',
        },
```

- [ ] **Step 5: 验证首页能加载新图标**

```bash
npm run dev
```

浏览器打开 `http://localhost:8092/growth-plan/`，检查"数字迷宫"卡片的图标是否正确显示（粉色背景 + 迷宫路径）。

预期：图标显示正常，无 404。

- [ ] **Step 6: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 2: 创建页面骨架和数据模型

**Files:**
- Create: `src/pages/game/maze.vue`

- [ ] **Step 1: 创建文件并写入骨架**

新建 `src/pages/game/maze.vue`，写入：

```vue
<template>
    <view class="maze-page">
        <view class="placeholder">数字迷宫</view>
    </view>
</template>

<script setup lang="ts">
    import { ref } from 'vue';

    type Difficulty = 'easy' | 'standard' | 'dual';

    type CellType = 'wall' | 'path' | 'start' | 'end' | 'numbered';

    interface Cell {
        row: number;
        col: number;
        type: CellType;
        number: number | null;
        color?: 'red' | 'blue';
        status: 'idle' | 'correct' | 'wrong';
    }

    type Maze = Cell[][];

    // ===== 难度配置 =====
    const DIFFICULTY_CONFIG: Record<Difficulty, { size: number; total: number; label: string }> = {
        easy: { size: 3, total: 9, label: '入门' },
        standard: { size: 5, total: 25, label: '标准' },
        dual: { size: 5, total: 25, label: '双色' },
    };

    // ===== 响应式状态 =====
    const currentDifficulty = ref<Difficulty>('standard');
    const gameState = ref<'idle' | 'dragging' | 'finished'>('idle');
    const cells = ref<Maze>([]);
    const currentTarget = ref(1);
    const startTime = ref(0);
    const elapsed = ref(0);
    const errorCount = ref(0);
    const bestRecord = ref<Record<Difficulty, number | null>>({
        easy: null,
        standard: null,
        dual: null,
    });
    const gameId = ref(0);
</script>

<style lang="scss" scoped>
    .maze-page {
        min-height: 100vh;
    }
</style>
```

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

预期：无新错误（linggu 预存错误除外）。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 3: 定义预制迷宫骨架和加载器

**Files:**
- Modify: `src/pages/game/maze.vue`（在 `<script setup>` 中添加迷宫数据）

- [ ] **Step 1: 添加迷宫骨架定义**

在 `bestRecord` ref 之后，添加骨架数据。设计原则：**所有 3 个难度的迷宫都是全填充（无墙）**，所有格子都是路径，只是数字按特定路径顺序排列。这样设计是为了让数字 1-N 都能放得下，同时让"拖拽"交互的视觉路径（SVG overlay）有意义。

**迷宫数据结构**（用二维数组表示）：
- `'.'` = 路径单元（将分配数字）
- 数字字符 `1`-`25` = 已预分配数字的单元

```typescript
    // ===== 预制骨架 =====
    // 迷宫设计原则：所有格子都是路径（无墙），按特定路径顺序分配数字 1-N
    // 路径顺序决定了"拖拽时手指应该走哪条路线"

    // 3x3 S 形：S → 1→2→3→4→5→6→7→8→9
    const MAZE_3X3_S = [
        ['1', '2', '3'],
        ['.', '.', '4'],
        ['9', '8', '5'],
        // 7, 6 在 S 形状的两个角
    ];

    // 5x5 螺旋：从外圈到内圈
    const MAZE_5X5_SPIRAL = [
        ['1',  '2',  '3',  '4',  '5'],
        ['16', '.',  '.',  '.',  '6'],
        ['15', '.',  '.',  '.',  '7'],
        ['14', '.',  '.',  '.',  '8'],
        ['13', '12', '11', '10', '9'],
    ];

    // 5x5 双色：红 1R-12R + 蓝 1B-13B
    // 数字按交替模式排列：1R 在 (0,0)，1B 在 (0,4)，2R 在 (1,0)，等等
    const MAZE_5X5_DUAL: Array<Array<string>> = (() => {
        const grid: string[][] = Array.from({ length: 5 }, () =>
            Array.from({ length: 5 }, () => '.')
        );
        // 红色 1-12 沿左侧
        for (let i = 0; i < 12; i++) {
            const r = Math.floor(i / 2);
            const c = i % 2 === 0 ? 0 : 4;
            grid[r][c] = `R${i + 1}`;
        }
        // 蓝色 1-13 沿右侧
        for (let i = 0; i < 13; i++) {
            const r = Math.floor(i / 2);
            const c = i % 2 === 0 ? 4 : 0;
            grid[r][c] = `B${i + 1}`;
        }
        return grid;
    })();

    const SKELETONS: Record<Difficulty, Array<Array<string>>> = {
        easy: [MAZE_3X3_S],
        standard: [MAZE_5X5_SPIRAL],
        dual: [MAZE_5X5_DUAL],
    };
```

- [ ] **Step 2: 添加迷宫加载器**

在 `SKELETONS` 常量之后添加：

```typescript
    function loadMaze(difficulty: Difficulty): Maze {
        const cfg = DIFFICULTY_CONFIG[difficulty];
        const candidates = SKELETONS[difficulty];
        const skeleton = candidates[0]; // MVP：只用第 1 个候选；v0.2 可加多个

        const grid: Maze = [];
        for (let r = 0; r < cfg.size; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < cfg.size; c++) {
                const symbol = skeleton[r]?.[c] ?? '.';
                if (symbol === '.') {
                    row.push({ row: r, col: c, type: 'path', number: null, status: 'idle' });
                } else if (symbol.startsWith('R') || symbol.startsWith('B')) {
                    const color = symbol[0].toLowerCase() as 'red' | 'blue';
                    const num = parseInt(symbol.slice(1), 10);
                    row.push({ row: r, col: c, type: 'numbered', number: num, color, status: 'idle' });
                } else if (symbol === 'S') {
                    row.push({ row: r, col: c, type: 'start', number: null, status: 'idle' });
                } else if (symbol === 'E') {
                    row.push({ row: r, col: c, type: 'end', number: null, status: 'idle' });
                } else {
                    // 数字字符（'1' 到 '25'）
                    const num = parseInt(symbol, 10);
                    row.push({ row: r, col: c, type: 'numbered', number: num, status: 'idle' });
                }
            }
            grid.push(row);
        }
        return grid;
    }
```

- [ ] **Step 3: 类型检查**

```bash
npm run type-check
```

预期：无新错误。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 4: 实现核心拖拽游戏逻辑

**Files:**
- Modify: `src/pages/game/maze.vue`（在 `<script setup>` 中添加逻辑，更新 import）

- [ ] **Step 1: 更新 import**

将 `import { ref } from 'vue';` 改为：

```typescript
    import { ref, onUnmounted } from 'vue';
```

- [ ] **Step 2: 添加游戏控制函数**

在 `loadMaze` 函数之后、`SKELETONS` 常量之前（或者逻辑上合理的位置）添加：

```typescript
    // ===== 游戏控制 =====
    let timerId: number | null = null;
    let currentCursorRow = 0;
    let currentCursorCol = 0;

    // 期望下一个数字（按双色模式交替规则）
    function getExpectedNumber(): number {
        if (currentDifficulty.value === 'dual') {
            // 双色模式：currentTarget 数字 1, 2, 3, ... 对应交替的 R/B
            // currentTarget=1 → R1, currentTarget=2 → B1, currentTarget=3 → R2, ...
            // 即：奇数 → 红色 (1R, 2R, ...)，偶数 → 蓝色 (1B, 2B, ...)
            const isRed = currentTarget.value % 2 === 1;
            const sequence = Math.ceil(currentTarget.value / 2);
            return isRed ? sequence : sequence; // 返回的是序列号（1-12 红, 1-13 蓝）
        }
        return currentTarget.value;
    }

    // 检查当前 cell 是否是期望的下一个
    function isExpectedCell(cell: Cell): boolean {
        if (cell.type !== 'numbered' || cell.number === null) return false;
        if (currentDifficulty.value === 'dual') {
            if (!cell.color) return false;
            const expected = getExpectedNumber();
            const isRed = currentTarget.value % 2 === 1;
            const expectedColor = isRed ? 'red' : 'blue';
            return cell.number === expected && cell.color === expectedColor;
        }
        return cell.number === currentTarget.value;
    }

    function getMaxTarget(): number {
        if (currentDifficulty.value === 'dual') {
            // 双色：12 红 + 13 蓝 = 25 步
            return 25;
        }
        return DIFFICULTY_CONFIG[currentDifficulty.value].total;
    }

    function startGame() {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        gameId.value += 1;
        cells.value = loadMaze(currentDifficulty.value);
        currentTarget.value = 1;
        currentCursorRow = -1;
        currentCursorCol = -1;
        startTime.value = Date.now();
        elapsed.value = 0;
        errorCount.value = 0;
        gameState.value = 'dragging';

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
        currentCursorRow = -1;
        currentCursorCol = -1;
        elapsed.value = 0;
        errorCount.value = 0;
    }

    function handleTouchMove(clientX: number, clientY: number, gridRect: DOMRect | null) {
        if (gameState.value !== 'dragging') return;
        if (!gridRect) return;

        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const cellSize = gridRect.width / cfg.size;
        const localX = clientX - gridRect.left;
        const localY = clientY - gridRect.top;
        if (localX < 0 || localY < 0 || localX >= gridRect.width || localY >= gridRect.height) {
            return;
        }
        const col = Math.floor(localX / cellSize);
        const row = Math.floor(localY / cellSize);
        if (row === currentCursorRow && col === currentCursorCol) return; // 没移动

        currentCursorRow = row;
        currentCursorCol = col;

        const cell = cells.value[row]?.[col];
        if (!cell) return;

        // 验证 cell
        if (isExpectedCell(cell)) {
            cell.status = 'correct';
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
            currentTarget.value += 1;
            if (currentTarget.value > getMaxTarget()) {
                finishGame();
            }
        } else {
            // 任何非预期的 numbered cell 都是错（path/start/end 都不算错）
            if (cell.type === 'numbered' && cell.number !== null) {
                cell.status = 'wrong';
                errorCount.value += 1;
                setTimeout(() => {
                    cell.status = 'idle';
                }, 500);
            }
            // 走过的路径 cell 也记录（用于粉色痕迹）
        }
    }

    function handleTouchStart(cell: Cell) {
        if (gameState.value !== 'idle') return;
        // 必须在 number 1 (或 1R) 上开始
        if (!isExpectedCell(cell)) return;
        startGame();
    }

    function handleTouchEnd() {
        if (gameState.value !== 'dragging') return;
        // 如果 currentTarget > max 说明已完成（finishGame 已调用）
        if (currentTarget.value > getMaxTarget()) return;
        // 否则视为放弃 — 重置进度
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        // 不算完成，不记成绩
        gameState.value = 'idle';
        // 清空状态但保留 best record
        elapsed.value = 0;
        errorCount.value = 0;
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

**注意：** `saveBest` 在 Task 5 添加。`handleTouchMove` 接收的 `gridRect: DOMRect | null` 在 Task 7 模板中通过 ref 传入。

- [ ] **Step 3: 添加 timer 清理**

在 `finishGame` 函数之后添加：

```typescript
    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });
```

- [ ] **Step 4: 类型检查（预期 saveBest 报错，可接受）**

```bash
npm run type-check
```

预期：除 linggu 预存错误外，可能有"saveBest not defined"。这是预期的，Task 5 会解决。

- [ ] **Step 5: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 5: 最佳成绩持久化

**Files:**
- Modify: `src/pages/game/maze.vue`

- [ ] **Step 1: 更新 import**

将 `import { ref, onUnmounted } from 'vue';` 改为：

```typescript
    import { ref, onMounted, onUnmounted } from 'vue';
```

- [ ] **Step 2: 添加持久化函数**

在 `onUnmounted` 之后添加：

```typescript
    // ===== 持久化 =====
    const STORAGE_KEY = 'maze_best';

    function loadBest() {
        try {
            const raw = uni.getStorageSync(STORAGE_KEY);
            if (raw && typeof raw === 'object') {
                bestRecord.value = {
                    easy: raw.easy ?? null,
                    standard: raw.standard ?? null,
                    dual: raw.dual ?? null,
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

- [ ] **Step 3: 类型检查**

```bash
npm run type-check
```

预期：无新错误。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 6: 实现难度切换器

**Files:**
- Modify: `src/pages/game/maze.vue`（template + script）

- [ ] **Step 1: 添加 selectDifficulty 函数**

在 `resetGame` 函数之后添加：

```typescript
    function selectDifficulty(d: Difficulty) {
        if (currentDifficulty.value === d) return;
        currentDifficulty.value = d;
        if (gameState.value !== 'idle') {
            resetGame();
        }
    }
```

- [ ] **Step 2: 替换 template 添加难度卡片**

替换整个 `<template>` 块为：

```vue
<template>
    <view class="maze-page">
        <view class="difficulty-row">
            <view
                v-for="d in (['easy', 'standard', 'dual'] as Difficulty[])"
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
        <view class="placeholder">数字迷宫</view>
    </view>
</template>
```

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 7: 实现主迷宫网格区

**Files:**
- Modify: `src/pages/game/maze.vue`（template + script）

- [ ] **Step 1: 添加 formatTime 函数**

在 `selectDifficulty` 函数之后添加：

```typescript
    function formatTime(seconds: number): string {
        return seconds.toFixed(1) + 's';
    }
```

- [ ] **Step 2: 替换完整 template（含迷宫、计时器、控制）**

完整替换 `<template>` 为：

```vue
<template>
    <view class="maze-page">
        <view class="difficulty-row">
            <view
                v-for="d in (['easy', 'standard', 'dual'] as Difficulty[])"
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
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" style="vertical-align: middle; margin-right: 6rpx;">
                    <circle cx="12" cy="13" r="8" stroke="#c25a70" stroke-width="2" fill="none" />
                    <path d="M12 9v4l3 2" stroke="#c25a70" stroke-width="2" stroke-linecap="round" />
                    <path d="M9 3h6" stroke="#c25a70" stroke-width="2" stroke-linecap="round" />
                </svg>
                {{ formatTime(elapsed) }}
            </view>
            <view
                v-if="gameState !== 'idle' || cells.length > 0"
                class="grid"
                :class="`grid--${currentDifficulty}`"
                @touchstart="onGridTouchStart"
                @touchmove.prevent="onGridTouchMove"
                @touchend="onGridTouchEnd"
            >
                <view
                    v-for="(row, r) in cells"
                    :key="`${gameId}-${r}`"
                    class="grid-row"
                >
                    <view
                        v-for="(cell, c) in row"
                        :key="`${gameId}-${r}-${c}`"
                        class="cell"
                        :class="[
                            `cell--${cell.type}`,
                            `cell--${cell.status}`,
                            { 'cell--cursor': gameState === 'dragging' && r === currentCursorRow && c === currentCursorCol }
                        ]"
                        @click="onCellClick(cell)"
                    >
                        <view v-if="cell.type === 'numbered' && cell.number !== null" class="cell__number">
                            {{ cell.number }}
                        </view>
                        <view v-else-if="cell.type === 'start'" class="cell__icon">🏁</view>
                        <view v-else-if="cell.type === 'end'" class="cell__icon">🏆</view>
                    </view>
                </view>
            </view>
            <view v-else class="grid-placeholder">
                点击数字 1 开始
            </view>
        </view>

        <view class="control-row">
            <view class="best">
                最佳 {{ bestRecord[currentDifficulty] !== null ? formatTime(bestRecord[currentDifficulty] as number) : '—' }}
            </view>
            <view
                v-if="gameState !== 'dragging'"
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

**注意：**
- `cell--cursor` 高亮当前拖拽所在格（粉色光环，由 CSS 实现）
- `@touchstart`/`@touchmove`/`@touchend` 在 grid 上而非 cell 上（避免 cell 切换时丢失事件）
- `🏁`/`🏆` 是临时 emoji，Task 11 替换为 SVG
- `@click` 是兜底：拖拽失效时（如无 touch 设备）仍能用点击

- [ ] **Step 3: 添加 touch 事件处理函数到 script**

在 `formatTime` 函数之后添加：

```typescript
    // ===== Touch event handlers =====
    // 实际项目中 grid 容器需要 ref 才能在 touchmove 中获取位置
    // 这里使用一个简单方法：依赖 UniApp 的事件对象
    function onGridTouchStart(e: TouchEvent) {
        if (gameState.value !== 'idle') return;
        const touch = e.touches[0];
        if (!touch) return;
        // 计算 finger 在 grid 内的 cell 坐标
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const cellSize = rect.width / cfg.size;
        const col = Math.floor((touch.clientX - rect.left) / cellSize);
        const row = Math.floor((touch.clientY - rect.top) / cellSize);
        const cell = cells.value[row]?.[col];
        if (cell) handleTouchStart(cell);
    }

    function onGridTouchMove(e: TouchEvent) {
        const touch = e.touches[0];
        if (!touch) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        handleTouchMove(touch.clientX, touch.clientY, rect);
    }

    function onGridTouchEnd() {
        handleTouchEnd();
    }

    function onCellClick(cell: Cell) {
        // 点击作为拖拽的兜底（PC 端或无 touch 设备）
        if (gameState.value === 'idle') {
            handleTouchStart(cell);
        } else if (gameState.value === 'dragging') {
            // 用点击位置作为 touch 位置（不太准确但能跑）
            // 实际主要靠 touchmove
        }
    }
```

- [ ] **Step 4: 类型检查**

```bash
npm run type-check
```

预期：无新错误（除 linggu 预存外）。

- [ ] **Step 5: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 8: 实现 SVG 路径覆盖层（粉色痕迹）

**Files:**
- Modify: `src/pages/game/maze.vue`（template + script + style）

- [ ] **Step 1: 跟踪已走路径**

在 `bestRecord` ref 附近添加已走路径记录：

```typescript
    // 记录已走过的"路径段"：每段从 [r1, c1] 到 [r2, c2]
    interface PathSegment {
        from: [number, number];
        to: [number, number];
    }
    const walkedPath = ref<PathSegment[]>([]);
```

- [ ] **Step 2: 在 handleTouchMove 中追加段**

找到 `handleTouchMove` 函数，在 `currentCursorRow = row; currentCursorCol = col;` 之后添加：

```typescript
        // 记录路径段（从上一位置到当前位置）
        if (currentCursorRow !== row || currentCursorCol !== col) {
            // 这里需要上一次位置，简化：跳过
        }
```

实际上需要在 handleTouchMove 中保留"上一次位置"：

```typescript
    let lastCursorRow = -1;
    let lastCursorCol = -1;

    function handleTouchMove(clientX: number, clientY: number, gridRect: DOMRect | null) {
        if (gameState.value !== 'dragging') return;
        if (!gridRect) return;

        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const cellSize = gridRect.width / cfg.size;
        const localX = clientX - gridRect.left;
        const localY = clientY - gridRect.top;
        if (localX < 0 || localY < 0 || localX >= gridRect.width || localY >= gridRect.height) {
            return;
        }
        const col = Math.floor(localX / cellSize);
        const row = Math.floor(localY / cellSize);
        if (row === currentCursorRow && col === currentCursorCol) return;

        // 记录路径段
        if (lastCursorRow >= 0 && lastCursorCol >= 0) {
            walkedPath.value.push({
                from: [lastCursorRow, lastCursorCol],
                to: [row, col],
            });
        }

        lastCursorRow = row;
        lastCursorCol = col;
        currentCursorRow = row;
        currentCursorCol = col;

        const cell = cells.value[row]?.[col];
        if (!cell) return;

        if (isExpectedCell(cell)) {
            cell.status = 'correct';
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
            currentTarget.value += 1;
            if (currentTarget.value > getMaxTarget()) {
                finishGame();
            }
        } else if (cell.type === 'numbered' && cell.number !== null) {
            cell.status = 'wrong';
            errorCount.value += 1;
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
        }
    }
```

- [ ] **Step 3: 在 startGame/resetGame 中清空 walkedPath**

在 `startGame` 函数中，找到 `gameId.value += 1;` 之后添加：

```typescript
        walkedPath.value = [];
        lastCursorRow = -1;
        lastCursorCol = -1;
```

在 `resetGame` 函数中，找到 `gameState.value = 'idle';` 之后添加：

```typescript
        walkedPath.value = [];
        lastCursorRow = -1;
        lastCursorCol = -1;
```

- [ ] **Step 4: 在 template 中添加 SVG overlay**

在 `.grid` 元素的开始标签内（保持 @touchstart 等事件）添加一个绝对定位的 SVG，覆盖在 grid 之上：

```vue
            <view
                v-if="gameState !== 'idle' || cells.length > 0"
                class="grid"
                :class="`grid--${currentDifficulty}`"
                @touchstart="onGridTouchStart"
                @touchmove.prevent="onGridTouchMove"
                @touchend="onGridTouchEnd"
            >
                <svg class="grid-overlay" :viewBox="`0 0 ${gridPxSize} ${gridPxSize}`" preserveAspectRatio="none">
                    <line
                        v-for="(seg, i) in walkedPath"
                        :key="`seg-${i}`"
                        :x1="seg.from[1] * cellPxSize + cellPxSize / 2"
                        :y1="seg.from[0] * cellPxSize + cellPxSize / 2"
                        :x2="seg.to[1] * cellPxSize + cellPxSize / 2"
                        :y2="seg.to[0] * cellPxSize + cellPxSize / 2"
                        stroke="#ff85a1"
                        stroke-width="6"
                        stroke-linecap="round"
                        opacity="0.7"
                    />
                </svg>
                <view
                    v-for="(row, r) in cells"
                    :key="`${gameId}-${r}`"
                    class="grid-row"
                >
                    <view
                        v-for="(cell, c) in row"
                        :key="`${gameId}-${r}-${c}`"
                        class="cell"
                        :class="[...]"
                        @click="onCellClick(cell)"
                    >
                        ...
                    </view>
                </view>
            </view>
```

**注意：**
- `gridPxSize` 和 `cellPxSize` 是在 script 中计算的常量（基于 `rpx`，转 `px`）
- 简化：直接用 `rpx` 数值，通过 `viewBox` 和 `preserveAspectRatio` 让 SVG 自适应

- [ ] **Step 5: 添加计算属性到 script**

在 `bestRecord` 之后添加：

```typescript
    // 用于 SVG overlay 坐标计算（使用 rpx 单位的等价 px）
    const gridPxSize = ref(500); // 假设 grid 渲染为 500rpx 见方（CSS 控制实际尺寸）
    const cellPxSize = computed(() => {
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        return 500 / cfg.size;
    });
```

**注意：** 这里需要 `computed` 从 'vue' 导入：

```typescript
    import { ref, computed, onMounted, onUnmounted } from 'vue';
```

- [ ] **Step 6: 类型检查**

```bash
npm run type-check
```

预期：无新错误。

- [ ] **Step 7: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 9: 实现完成弹窗

**Files:**
- Modify: `src/pages/game/maze.vue`（template + script）

- [ ] **Step 1: 添加 replay 和 isNewRecord 函数**

在 `formatTime` 函数之后添加：

```typescript
    function replay() {
        startGame();
    }

    function isNewRecord(): boolean {
        if (gameState.value !== 'finished') return false;
        return elapsed.value === bestRecord.value[currentDifficulty.value];
    }
```

- [ ] **Step 2: 在 template 末尾添加完成弹窗**

在 `<view class="control-row">` 闭合 `</view>` 之后、`<view class="maze-page">` 闭合 `</view>` 之前插入：

```vue
        <view v-if="gameState === 'finished'" class="modal-mask" @click.self="resetGame">
            <view class="modal-card">
                <svg class="modal-medal" viewBox="0 0 64 64" width="96" height="96">
                    <circle cx="32" cy="32" r="22" fill="#FFD700" stroke="#FFA500" stroke-width="2" />
                    <circle cx="32" cy="32" r="16" fill="#FFEC8B" />
                    <text x="32" y="40" text-anchor="middle" font-size="20" font-weight="800" fill="#FF8C00">★</text>
                    <path d="M22 8 L18 0 L26 4 L32 0 L38 4 L46 0 L42 8" fill="#FF6B6B" stroke="#C0392B" stroke-width="1" />
                </svg>
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
                <view class="modal-actions">
                    <view class="btn-primary" @click="replay">再来一局</view>
                    <view class="btn-secondary" @click="resetGame">返回</view>
                </view>
            </view>
        </view>
```

- [ ] **Step 3: 类型检查**

```bash
npm run type-check
```

预期：无新错误。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 10: Claymorphism 视觉风格

**Files:**
- Modify: `src/pages/game/maze.vue`（仅 `<style>` 块）

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
    $blue: #3B82F6;

    .maze-page {
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
    .difficulty-card--dual { background: linear-gradient(135deg, #fff5eb, #ffe0c8); }
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
        display: flex;
        align-items: center;
    }
    .grid {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 8rpx;
        padding: 24rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 32rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.5),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.12),
            8rpx 8rpx 24rpx rgba(194, 90, 112, 0.18);
        touch-action: none;
        overscroll-behavior: contain;
    }
    .grid-overlay {
        position: absolute;
        inset: 24rpx;
        width: calc(100% - 48rpx);
        height: calc(100% - 48rpx);
        pointer-events: none;
        z-index: 1;
    }
    .grid-row {
        display: flex;
        gap: 8rpx;
    }
    .grid--easy .cell { width: 140rpx; height: 140rpx; font-size: 72rpx; }
    .grid--standard .cell, .grid--dual .cell { width: 100rpx; height: 100rpx; font-size: 48rpx; }
    .grid-placeholder {
        font-size: 32rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .cell {
        position: relative;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 16rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6),
            inset 2rpx 2rpx 6rpx rgba(194, 90, 112, 0.15),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        color: $primary-dark;
        font-weight: 700;
        user-select: none;
        transition: transform 0.15s ease-out, background 0.4s ease-out, box-shadow 0.4s ease-out;
    }
    .cell--path {
        background: linear-gradient(135deg, #ffffff, #f8f8f8);
    }
    .cell--start, .cell--end {
        background: linear-gradient(135deg, #fff5e0, #ffe8c0);
    }
    .cell__number {
        font-size: inherit;
    }
    .cell__icon {
        font-size: 56rpx;
        line-height: 1;
    }
    .cell--correct {
        animation: pulseGreen 0.5s ease-out;
    }
    .cell--wrong {
        animation: pulseRed 0.5s ease-out;
    }
    .cell--cursor {
        border-color: $primary;
        box-shadow:
            inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6),
            inset 2rpx 2rpx 6rpx rgba(194, 90, 112, 0.15),
            0 0 24rpx rgba(255, 133, 161, 0.7),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.18);
    }
    .cell--red .cell__number { color: $red; }
    .cell--blue .cell__number { color: $blue; }

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
        width: 96px;
        height: 96px;
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
        display: flex;
        align-items: center;
        justify-content: center;
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
    @keyframes pulseRed {
        0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
        30%  { background: linear-gradient(135deg, #ffe0e0, #ffb8b8); }
        100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    }
    @keyframes pulseGreen {
        0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
        30%  { background: linear-gradient(135deg, #d8ffe0, #a8f0b8); }
        100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    }
    @keyframes glow {
        0%, 100% { box-shadow: 0 0 16rpx rgba(255, 133, 161, 0.6); }
        50% { box-shadow: 0 0 28rpx rgba(255, 133, 161, 0.9); }
    }

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .modal-card, .modal-mask, .modal-record,
        .cell--correct, .cell--wrong, .cell--cursor {
            animation: none;
        }
        .cell, .difficulty-card, .btn-primary, .btn-secondary {
            transition: none;
        }
    }
</style>
```

**重要修正：** 这个 CSS 已经把 SVG 替换 emoji 的步骤合并了。Task 11 主要是清理（不再需要），但还需要在 template 中把 🏁/🏆 换成 SVG（见 Task 11 Step 1）。

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

预期：无新错误（除 linggu 预存）。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 11: 替换 emoji 图标为 SVG

**Files:**
- Modify: `src/pages/game/maze.vue`（template）

- [ ] **Step 1: 替换 🏁 起点 emoji 为 SVG**

在 template 中找到：

```vue
<view v-else-if="cell.type === 'start'" class="cell__icon">🏁</view>
<view v-else-if="cell.type === 'end'" class="cell__icon">🏆</view>
```

替换为：

```vue
<view v-else-if="cell.type === 'start'" class="cell__icon">
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
        <line x1="6" y1="22" x2="6" y2="4" stroke="#c25a70" stroke-width="2" stroke-linecap="round" />
        <path d="M6 4 L20 8 L6 12 Z" fill="#ff85a1" stroke="#c25a70" stroke-width="1.5" stroke-linejoin="round" />
    </svg>
</view>
<view v-else-if="cell.type === 'end'" class="cell__icon">
    <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
        <path d="M5 4h14v4a5 5 0 0 1-5 5h-4A5 5 0 0 1 5 8V4z" fill="#FFD700" stroke="#C25A70" stroke-width="1" />
        <path d="M5 6H2v2a3 3 0 0 0 3 3" fill="none" stroke="#FFD700" stroke-width="1.5" />
        <path d="M19 6h3v2a3 3 0 0 1-3 3" fill="none" stroke="#FFD700" stroke-width="1.5" />
        <rect x="9" y="16" width="6" height="3" fill="#c25a70" />
        <rect x="7" y="19" width="10" height="3" rx="1" fill="#c25a70" />
    </svg>
</view>
```

**注意：** 当前 Task 3 的迷宫骨架中没有 start/end 类型的格子（都是 numbered），所以这两行可能永远不会显示。但保留以备未来 v0.2 扩展。

- [ ] **Step 2: 确认 timer pill 已用 SVG**

Task 10 的 CSS 已经处理 timer pill 内的 SVG。template 中 Task 7 已加 SVG 圆形 + 时针。检查：

```bash
grep -n "⏱\|🏁\|🏆\|🏅" src/pages/game/maze.vue
```

预期：无输出（全部已换 SVG）。

- [ ] **Step 3: 类型检查 + 提交（跳过）**

```bash
npm run type-check
```

> 用户要求不做 commit，此步跳过。

---

## Task 12: 端到端验证

**Files:**
- (无代码改动，仅验证)

- [ ] **Step 1: 跑完整类型检查**

```bash
npm run type-check
```

预期：无错误（除预存的 linggu.vue 错误外）。

- [ ] **Step 2: 启动 dev 服务器**

```bash
npm run dev
```

预期：dev server 启动无 "Failed to resolve" 错误（用 `src/pages/game/maze.vue` 单文件路径，不要建成子目录）。

- [ ] **Step 3: 浏览器手动测试 3 个难度**

在浏览器中：

1. 打开首页 → 看到 5 个卡片 2×3 排布
2. 点击"数字迷宫" → 看到 3 张难度卡片
3. 切换到"入门 3×3" → 看到 3×3 网格，9 个数字 1-9
4. 点击数字 1 → 游戏开始，计时器启动
5. 用鼠标（或手指）依次拖过 2、3、4、5、6、7、8、9
6. 松开手指 → 看到完成弹窗，含用时和错误数
7. 切换到"标准 5×5" → 看到 5×5 网格
8. 切换到"双色 5×5" → 看到 12 红 + 13 蓝数字，颜色不同
9. 测试交替点击：1R（红 1）→ 1B（蓝 1）→ 2R（红 2）→ 2B（蓝 2）→ ...
10. 刷新页面 → "最佳"成绩应保留

- [ ] **Step 4: 检查无 console 错误**

浏览器 devtools console 应该没有红色 error（vconsole 警告除外）。

- [ ] **Step 5: lint 修复（如有）**

```bash
npx eslint --fix src/pages/game/maze.vue 2>&1 | tail -20
```

预期：prettier 自动修复大部分格式问题。

- [ ] **Step 6: 提交（如有 lint 改动则跳过，因用户要求）**

> 用户要求不做 commit，此步跳过。

---

## 验收清单

- [ ] 3 个难度（3×3 入门 / 5×5 标准 / 5×5 双色）都能玩
- [ ] 拖拽交互：触摸 number 1 开始，touchmove 持续检测 cell
- [ ] 预期数字 → 绿色脉冲，currentTarget++
- [ ] 墙/非预期数字 → 红色脉冲，errorCount++（无墙，但非预期数字触发）
- [ ] 路径（path/start/end cell）→ 无反馈
- [ ] 松开时若 currentTarget > max → 完成弹窗 + 计时停止
- [ ] 最佳成绩持久化（uni.setStorageSync）
- [ ] 首页 6 卡片 2×3 网格展示
- [ ] SVG 路径 overlay 显示已走路径（粉色痕迹）
- [ ] 当前所在 cell 粉色光环
- [ ] 双色模式颜色正确（红 12 + 蓝 13）
- [ ] 交替点击顺序：1R → 1B → 2R → 2B → ... → 12R → 12B → 13B
- [ ] Claymorphism 视觉风格统一
- [ ] 不用 emoji 当 UI 图标（用 SVG 替代）
- [ ] `touch-action: none` + `@touchmove.prevent` + `overscroll-behavior: contain` 已加
- [ ] `@media (prefers-reduced-motion: reduce)` 包裹所有动画
- [ ] `npm run type-check` 通过
- [ ] Lint 0 errors

## 不在范围（YAGNI）

- 排行榜
- 倒计时模式
- 关卡/解锁
- 单元测试
- 反向模式
- 多迷宫变体（当前每难度只用 1 个骨架，v0.2 可加）
- 多语言、暗色模式
- 横屏适配
- 振动反馈
- 用户登录
- 拖拽时的"墙"（当前所有格子都是路径，v0.2 可加真迷宫）
