<template>
    <view class="shulte-page">
        <view class="difficulty-row">
            <view
                v-for="d in ['easy', 'standard', 'reverse'] as Difficulty[]"
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
                v-if="gameState === 'playing' || gameState === 'finished'"
                class="grid"
                :class="`grid--${currentDifficulty}`"
            >
                <view
                    v-for="(cell, idx) in cells"
                    :key="`${gameId}-${idx}`"
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
            <view
                v-else
                class="grid-placeholder"
            >
                点击"开始"挑战
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
    import { ref, onMounted, onUnmounted } from 'vue';

    type Difficulty = 'easy' | 'standard' | 'reverse';

    interface CellItem {
        num: number;
        status: 'idle' | 'correct' | 'wrong';
    }

    // ===== 难度配置 =====
    const DIFFICULTY_CONFIG: Record<
        Difficulty,
        { size: number; max: number; reverse: boolean; label: string }
    > = {
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
    const gameId = ref(0);

    // ===== 工具函数 =====
    function generateGrid(max: number): CellItem[] {
        const nums = Array.from({ length: max }, (_, i) => i + 1);
        // Fisher-Yates 洗牌
        for (let i = nums.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        return nums.map(n => ({ num: n, status: 'idle' }));
    }

    // ===== 游戏控制 =====
    let timerId: number | null = null;

    function startGame() {
        gameId.value += 1;
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
        gameId.value += 1;
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
        // 完成时记录的 elapsed 是当前用时
        // finishGame 已经把 elapsed 写入 bestRecord（如破纪录）
        // 这里通过 elapsed === bestRecord 来判断"是否刚刚破纪录"
        return elapsed.value === bestRecord.value[currentDifficulty.value];
    }

    function handleCellClick(cell: CellItem) {
        if (gameState.value !== 'playing') return;
        if (cell.status !== 'idle') return;
        const cfg = DIFFICULTY_CONFIG[currentDifficulty.value];
        const expected = currentTarget.value;

        if (cell.num === expected) {
            cell.status = 'correct';
            setTimeout(() => {
                cell.status = 'idle';
            }, 500);
            currentTarget.value = cfg.reverse ? currentTarget.value - 1 : currentTarget.value + 1;

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

    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });
</script>

<style lang="scss" scoped>
    // ===== 主题变量 =====
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $accent: #f97316;
    $text: #1e1b4b;

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
        color: $primary-dark;
    }
    .difficulty-card--easy {
        background: linear-gradient(135deg, #f0fff0, #d8f5d8);
    }
    .difficulty-card--standard {
        background: linear-gradient(135deg, #f0f8ff, #d8ebf5);
    }
    .difficulty-card--reverse {
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
    .grid--easy {
        grid-template-columns: repeat(4, 140rpx);
    }
    .grid--standard,
    .grid--reverse {
        grid-template-columns: repeat(5, 110rpx);
    }
    .grid-placeholder {
        font-size: 32rpx;
        color: $primary-dark;
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
        transition:
            transform 0.15s ease-out,
            background 0.4s ease-out,
            box-shadow 0.4s ease-out;
    }
    .grid--standard .cell,
    .grid--reverse .cell {
        width: 110rpx;
        height: 110rpx;
        font-size: 48rpx;
    }
    .grid--reverse .cell {
        font-size: 52rpx;
    }
    .cell:active {
        transform: scale(0.95);
    }
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
        color: $primary-dark;
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
        color: $primary-dark;
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

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .modal-card,
        .modal-mask,
        .modal-record {
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
