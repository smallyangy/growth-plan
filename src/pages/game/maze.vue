<template>
    <view class="maze-page">
        <view class="difficulty-row">
            <view
                v-for="d in ['easy', 'standard', 'dual'] as Difficulty[]"
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
                <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    fill="none"
                    style="vertical-align: middle; margin-right: 6rpx"
                >
                    <circle
                        cx="12"
                        cy="13"
                        r="8"
                        stroke="#c25a70"
                        stroke-width="2"
                        fill="none"
                    />
                    <path
                        d="M12 9v4l3 2"
                        stroke="#c25a70"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                    <path
                        d="M9 3h6"
                        stroke="#c25a70"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
                {{ formatTime(elapsed) }}
            </view>
            <view
                v-if="gameState !== 'idle' || cells.length > 0"
                ref="gridRef"
                class="grid"
                :class="`grid--${currentDifficulty}`"
                @touchstart="onGridTouchStart"
                @touchmove.prevent="onGridTouchMove"
                @touchend="onGridTouchEnd"
                @mousedown="onGridMouseDown"
                @mousemove="onGridMouseMove"
                @mouseup="onGridMouseUp"
                @mouseleave="onGridMouseLeave"
            >
                <svg
                    class="grid-overlay"
                    :viewBox="`0 0 ${gridPxSize} ${gridPxSize}`"
                    preserveAspectRatio="none"
                >
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
                        :class="[
                            `cell--${cell.type}`,
                            `cell--${cell.status}`,
                            {
                                'cell--cursor':
                                    gameState === 'dragging' &&
                                    r === currentCursorRow &&
                                    c === currentCursorCol,
                            },
                        ]"
                        @click="onCellClick(cell)"
                    >
                        <view
                            v-if="cell.type === 'numbered' && cell.number !== null"
                            class="cell__number"
                        >
                            {{ cell.number }}
                        </view>
                        <view
                            v-else-if="cell.type === 'start'"
                            class="cell__icon"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="48"
                                height="48"
                                fill="none"
                            >
                                <line
                                    x1="6"
                                    y1="22"
                                    x2="6"
                                    y2="4"
                                    stroke="#c25a70"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                />
                                <path
                                    d="M6 4 L20 8 L6 12 Z"
                                    fill="#ff85a1"
                                    stroke="#c25a70"
                                    stroke-width="1.5"
                                    stroke-linejoin="round"
                                />
                            </svg>
                        </view>
                        <view
                            v-else-if="cell.type === 'end'"
                            class="cell__icon"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                width="48"
                                height="48"
                                fill="none"
                            >
                                <path
                                    d="M5 4h14v4a5 5 0 0 1-5 5h-4A5 5 0 0 1 5 8V4z"
                                    fill="#FFD700"
                                    stroke="#C25A70"
                                    stroke-width="1"
                                />
                                <path
                                    d="M5 6H2v2a3 3 0 0 0 3 3"
                                    fill="none"
                                    stroke="#FFD700"
                                    stroke-width="1.5"
                                />
                                <path
                                    d="M19 6h3v2a3 3 0 0 1-3 3"
                                    fill="none"
                                    stroke="#FFD700"
                                    stroke-width="1.5"
                                />
                                <rect
                                    x="9"
                                    y="16"
                                    width="6"
                                    height="3"
                                    fill="#c25a70"
                                />
                                <rect
                                    x="7"
                                    y="19"
                                    width="10"
                                    height="3"
                                    rx="1"
                                    fill="#c25a70"
                                />
                            </svg>
                        </view>
                    </view>
                </view>
            </view>
            <view
                v-else
                class="grid-placeholder"
            >
                点击数字 1 开始
            </view>
        </view>

        <view class="control-row">
            <view class="best">
                最佳
                {{
                    bestRecord[currentDifficulty] !== null
                        ? formatTime(bestRecord[currentDifficulty] as number)
                        : '—'
                }}
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

        <view
            v-if="gameState === 'finished'"
            class="modal-mask"
            @click.self="resetGame"
        >
            <view class="modal-card">
                <svg
                    class="modal-medal"
                    viewBox="0 0 64 64"
                    width="96"
                    height="96"
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="22"
                        fill="#FFD700"
                        stroke="#FFA500"
                        stroke-width="2"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="16"
                        fill="#FFEC8B"
                    />
                    <text
                        x="32"
                        y="40"
                        text-anchor="middle"
                        font-size="20"
                        font-weight="800"
                        fill="#FF8C00"
                    >
                        ★
                    </text>
                    <path
                        d="M22 8 L18 0 L26 4 L32 0 L38 4 L46 0 L42 8"
                        fill="#FF6B6B"
                        stroke="#C0392B"
                        stroke-width="1"
                    />
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
                <view
                    v-if="isNewRecord()"
                    class="modal-record"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="36"
                        height="36"
                        style="vertical-align: middle; margin-right: 8rpx"
                    >
                        <path
                            d="M5 4h14v4a5 5 0 0 1-5 5h-4A5 5 0 0 1 5 8V4z"
                            fill="#F97316"
                            stroke="#C2410C"
                            stroke-width="1"
                        />
                        <path
                            d="M5 6H2v2a3 3 0 0 0 3 3"
                            fill="none"
                            stroke="#F97316"
                            stroke-width="1.5"
                        />
                        <path
                            d="M19 6h3v2a3 3 0 0 1-3 3"
                            fill="none"
                            stroke="#F97316"
                            stroke-width="1.5"
                        />
                        <rect
                            x="9"
                            y="16"
                            width="6"
                            height="3"
                            fill="#C25A70"
                        />
                        <rect
                            x="7"
                            y="19"
                            width="10"
                            height="3"
                            rx="1"
                            fill="#C25A70"
                        />
                    </svg>
                    新纪录！
                </view>
                <view class="modal-actions">
                    <view
                        class="btn-primary"
                        @click="replay"
                    >
                        再来一局
                    </view>
                    <view
                        class="btn-secondary"
                        @click="resetGame"
                    >
                        返回
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted } from 'vue';

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

    // 模板 ref：grid 实际 DOM 元素（用于触摸坐标计算）
    const gridRef = ref<HTMLElement | null>(null);

    // 用于 SVG overlay 坐标计算
    const GRID_PX = 500; // 与 CSS 中 grid 实际渲染宽度对应（rpx 系统下大致 500rpx 见方）
    const gridPxSize = ref(GRID_PX);
    const cellPxSize = computed(() => {
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        return GRID_PX / cfg.size;
    });

    // ===== 随机路径生成 =====
    // 迭代 DFS：每次开新局生成一条访问所有单元格的随机路径
    function randomPath(size: number): Array<[number, number]> {
        const visited = new Set<string>();
        const path: Array<[number, number]> = [];
        const stack: Array<[number, number]> = [[0, 0]];

        while (stack.length > 0) {
            const [r, c] = stack[stack.length - 1];
            const key = `${r},${c}`;
            if (!visited.has(key)) {
                visited.add(key);
                path.push([r, c]);
            }
            // 找未访问的邻居（上下左右）
            const neighbors: Array<[number, number]> = [];
            if (r > 0 && !visited.has(`${r - 1},${c}`)) neighbors.push([r - 1, c]);
            if (r < size - 1 && !visited.has(`${r + 1},${c}`)) neighbors.push([r + 1, c]);
            if (c > 0 && !visited.has(`${r},${c - 1}`)) neighbors.push([r, c - 1]);
            if (c < size - 1 && !visited.has(`${r},${c + 1}`)) neighbors.push([r, c + 1]);

            if (neighbors.length === 0) {
                stack.pop();
            } else {
                // 随机选一个未访问邻居
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                stack.push(next);
            }
        }
        return path;
    }

    // ===== 迷宫加载器 =====
    function loadMaze(difficulty: Difficulty): Maze {
        const cfg = DIFFICULTY_CONFIG[difficulty];
        const path = randomPath(cfg.size);
        const max = path.length;

        // 初始化空 grid（所有 cell 都是 path）
        const grid: Maze = [];
        for (let r = 0; r < cfg.size; r++) {
            const row: Cell[] = [];
            for (let c = 0; c < cfg.size; c++) {
                row.push({ row: r, col: c, type: 'path', number: null, status: 'idle' });
            }
            grid.push(row);
        }

        if (difficulty === 'dual') {
            // 双色：12 红 + 13 蓝，路径前 12 个为红，后 13 个为蓝
            for (let i = 0; i < 12; i++) {
                const [r, c] = path[i];
                grid[r][c] = { row: r, col: c, type: 'numbered', number: i + 1, color: 'red', status: 'idle' };
            }
            for (let i = 0; i < 13; i++) {
                const [r, c] = path[12 + i];
                grid[r][c] = { row: r, col: c, type: 'numbered', number: i + 1, color: 'blue', status: 'idle' };
            }
        } else {
            // 单色：1-max 沿路径顺序
            for (let i = 0; i < max; i++) {
                const [r, c] = path[i];
                grid[r][c] = { row: r, col: c, type: 'numbered', number: i + 1, status: 'idle' };
            }
        }

        return grid;
    }

    // ===== 游戏控制 =====
    let timerId: number | null = null;
    let currentCursorRow = 0;
    let currentCursorCol = 0;
    let lastCursorRow = -1;
    let lastCursorCol = -1;

    // 记录已走过的"路径段"：每段从 [r1, c1] 到 [r2, c2]
    interface PathSegment {
        from: [number, number];
        to: [number, number];
    }
    const walkedPath = ref<PathSegment[]>([]);

    // 期望下一个数字（按双色模式交替规则）
    // currentTarget=1 → R1（红 1），currentTarget=2 → B1（蓝 1），currentTarget=3 → R2（红 2），...
    // 即：奇数 → 红色序列，偶数 → 蓝色序列
    function getExpectedSequence(): { color: 'red' | 'blue'; num: number } {
        const isRed = currentTarget.value % 2 === 1;
        const sequence = Math.ceil(currentTarget.value / 2);
        return isRed ? { color: 'red', num: sequence } : { color: 'blue', num: sequence };
    }

    // 检查当前 cell 是否是期望的下一个
    function isExpectedCell(cell: Cell): boolean {
        if (cell.type !== 'numbered' || cell.number === null) return false;
        if (currentDifficulty.value === 'dual') {
            if (!cell.color) return false;
            const expected = getExpectedSequence();
            return cell.number === expected.num && cell.color === expected.color;
        }
        return cell.number === currentTarget.value;
    }

    function getMaxTarget(): number {
        if (currentDifficulty.value === 'dual') {
            return 25; // 12 红 + 13 蓝 = 25 步
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
        lastCursorRow = -1;
        lastCursorCol = -1;
        walkedPath.value = [];
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
        lastCursorRow = -1;
        lastCursorCol = -1;
        walkedPath.value = [];
        elapsed.value = 0;
        errorCount.value = 0;
    }

    function selectDifficulty(d: Difficulty) {
        if (currentDifficulty.value === d) return;
        currentDifficulty.value = d;
        if (gameState.value !== 'idle') {
            resetGame();
        }
    }

    function formatTime(seconds: number): string {
        return seconds.toFixed(1) + 's';
    }

    function replay() {
        startGame();
    }

    function isNewRecord(): boolean {
        if (gameState.value !== 'finished') return false;
        return elapsed.value === bestRecord.value[currentDifficulty.value];
    }

    // ===== Touch + Mouse event handlers =====
    // 工具函数：从 gridRef 提取实际 DOM 元素
    // UniApp H5 compile 时，<view> 是 Vue 组件，ref 拿到的是组件实例，需用 .$el
    function getGridEl(): HTMLElement | null {
        const ref = gridRef.value as any;
        if (!ref) return null;
        // 1. 如果是 Vue 组件实例，取其 $el
        if (ref.$el && typeof ref.$el.getBoundingClientRect === 'function') {
            return ref.$el;
        }
        // 2. 如果本身是 HTMLElement
        if (typeof ref.getBoundingClientRect === 'function') {
            return ref;
        }
        // 3. 兜底：用 document.querySelector
        if (typeof document !== 'undefined') {
            const el = document.querySelector('.grid') as HTMLElement | null;
            if (el) return el;
        }
        return null;
    }

    // ===== 共享指针处理（touch + mouse 共用） =====
    function processPointerDown(clientX: number, clientY: number) {
        const el = getGridEl();
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const cellSize = rect.width / cfg.size;
        const col = Math.floor((clientX - rect.left) / cellSize);
        const row = Math.floor((clientY - rect.top) / cellSize);
        const cell = cells.value[row]?.[col];
        if (cell) handleTouchStart(cell);
    }

    function processPointerMove(clientX: number, clientY: number) {
        const el = getGridEl();
        if (!el) return;
        const rect = el.getBoundingClientRect();
        handleTouchMove(clientX, clientY, rect);
    }

    function processPointerUp() {
        handleTouchEnd();
    }

    // ===== Touch handlers =====
    function onGridTouchStart(e: TouchEvent) {
        if (gameState.value !== 'idle') return;
        const touch = e.touches[0];
        if (!touch) return;
        processPointerDown(touch.clientX, touch.clientY);
    }

    function onGridTouchMove(e: TouchEvent) {
        const touch = e.touches[0];
        if (!touch) return;
        processPointerMove(touch.clientX, touch.clientY);
    }

    function onGridTouchEnd() {
        processPointerUp();
    }

    // ===== Mouse handlers =====
    // 跟踪鼠标按下状态（用于 mousemove 是否触发 cell 验证）
    const isMouseDown = ref(false);

    function onGridMouseDown(e: MouseEvent) {
        // 只响应左键
        if (e.button !== 0) return;
        e.preventDefault(); // 防止文本选中等
        isMouseDown.value = true;
        processPointerDown(e.clientX, e.clientY);

        // 全局监听 mouseup（用户可能在 grid 外松开）
        if (typeof window !== 'undefined') {
            const onWindowMouseUp = () => {
                if (isMouseDown.value) {
                    isMouseDown.value = false;
                    processPointerUp();
                }
                window.removeEventListener('mouseup', onWindowMouseUp);
            };
            window.addEventListener('mouseup', onWindowMouseUp);
        }
    }

    function onGridMouseMove(e: MouseEvent) {
        if (!isMouseDown.value) return;
        processPointerMove(e.clientX, e.clientY);
    }

    function onGridMouseUp(e: MouseEvent) {
        if (e.button !== 0) return;
        if (!isMouseDown.value) return;
        isMouseDown.value = false;
        processPointerUp();
    }

    function onGridMouseLeave() {
        // 鼠标按下时移出 grid：当作"放弃"（同 touchend 在外部的情况）
        // 不结束游戏，只是停止接收后续 move 事件（mouseup 在外部由 window 监听处理）
    }

    function onCellClick(cell: Cell) {
        // 点击作为拖拽的兜底（PC 端或无 touch 设备）
        if (gameState.value === 'idle') {
            handleTouchStart(cell);
        }
        // 在 dragging 状态下，touchmove 处理连续验证
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
        if (row === currentCursorRow && col === currentCursorCol) return;

        // 记录路径段（从上一位置到当前位置）
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
            // 非预期数字 → 红色脉冲 + errorCount++
            cell.status = 'wrong';
            errorCount.value += 1;
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
        }
        // path/start/end cell 走过不触发任何反馈
    }

    function handleTouchStart(cell: Cell) {
        if (gameState.value !== 'idle') return;
        // 必须在期望的下一个数字上开始
        if (!isExpectedCell(cell)) return;
        startGame();
    }

    function handleTouchEnd() {
        if (gameState.value !== 'dragging') return;
        // 如果 currentTarget > max 说明已完成（finishGame 已调用）
        if (currentTarget.value > getMaxTarget()) return;
        // 否则视为放弃 — 重置进度，不算完成
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        gameState.value = 'idle';
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

    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });

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
</script>

<style lang="scss" scoped>
    // ===== 主题变量 =====
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $primary-light: #ffd9e1;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $accent: #f97316;
    $text: #1e1b4b;
    $text-soft: #c25a70;
    $red: #ef4444;
    $blue: #3b82f6;

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
        transition:
            transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 0.2s;
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
    .difficulty-card--easy {
        background: linear-gradient(135deg, #f0fff0, #d8f5d8);
    }
    .difficulty-card--standard {
        background: linear-gradient(135deg, #f0f8ff, #d8ebf5);
    }
    .difficulty-card--dual {
        background: linear-gradient(135deg, #fff5eb, #ffe0c8);
    }
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
    .grid--easy .cell {
        width: 140rpx;
        height: 140rpx;
        font-size: 72rpx;
    }
    .grid--standard .cell,
    .grid--dual .cell {
        width: 100rpx;
        height: 100rpx;
        font-size: 48rpx;
    }
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
        transition:
            transform 0.15s ease-out,
            background 0.4s ease-out,
            box-shadow 0.4s ease-out;
    }
    .cell--path {
        background: linear-gradient(135deg, #ffffff, #f8f8f8);
    }
    .cell--start,
    .cell--end {
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
    .cell--red .cell__number {
        color: $red;
    }
    .cell--blue .cell__number {
        color: $blue;
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
    .btn-primary,
    .btn-secondary {
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
        transition:
            transform 0.15s ease-out,
            box-shadow 0.2s;
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
    .btn-primary:active,
    .btn-secondary:active {
        transform: scale(0.95);
    }

    // ===== 弹窗 =====
    .modal-mask {
        position: fixed;
        inset: 0;
        background: rgba(31, 27, 75, 0.4);
        backdrop-filter: blur(8px);
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
    .modal-actions .btn-primary,
    .modal-actions .btn-secondary {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
    }

    @keyframes maskIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    @keyframes cardIn {
        from {
            transform: scale(0.5);
            opacity: 0;
        }
        to {
            transform: scale(1);
            opacity: 1;
        }
    }
    @keyframes recordBlink {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.15);
        }
    }
    @keyframes pulseRed {
        0% {
            background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        }
        30% {
            background: linear-gradient(135deg, #ffe0e0, #ffb8b8);
        }
        100% {
            background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        }
    }
    @keyframes pulseGreen {
        0% {
            background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        }
        30% {
            background: linear-gradient(135deg, #d8ffe0, #a8f0b8);
        }
        100% {
            background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        }
    }

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .modal-card,
        .modal-mask,
        .modal-record,
        .cell--correct,
        .cell--wrong,
        .cell--cursor {
            animation: none;
        }
        .cell,
        .difficulty-card,
        .btn-primary,
        .btn-secondary {
            transition: none;
        }
    }
</style>
