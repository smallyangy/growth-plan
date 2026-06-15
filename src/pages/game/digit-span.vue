<template>
    <view class="ds-page">
        <!-- Claymorphism 背景装饰球 -->
        <view class="bg-ball ball-1"></view>
        <view class="bg-ball ball-2"></view>
        <view class="bg-ball ball-3"></view>
        <view class="bg-ball ball-4"></view>

        <!-- 顶栏：返回首页按钮 -->
        <view class="ds-header">
            <view
                class="ds-home-btn"
                @click="handleHomeClick"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="36"
                    height="36"
                    fill="none"
                >
                    <path
                        d="M3 12 L12 3 L21 12"
                        stroke="#c25a70"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                    <path
                        d="M5 10 V20 H19 V10"
                        stroke="#c25a70"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        fill="none"
                    />
                </svg>
            </view>
        </view>

        <!-- 屏幕 A: 准备屏 (idle) -->
        <view
            v-if="round.state === 'idle'"
            class="ds-idle"
        >
            <view class="ds-icon">
                <svg
                    viewBox="0 0 64 64"
                    width="96"
                    height="96"
                    fill="none"
                >
                    <circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="#ff85a1"
                        stroke="#fff"
                        stroke-width="3"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="20"
                        fill="#fff"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="12"
                        fill="#ff85a1"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="5"
                        fill="#fff"
                    />
                </svg>
            </view>
            <view class="ds-title">数字复述</view>
            <view class="ds-desc">家长念数字，孩子复述</view>
            <view
                class="btn-start"
                @click="startRound"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="28"
                    height="28"
                    fill="currentColor"
                >
                    <path d="M8 5v14l11-7z" />
                </svg>
                开始本轮
            </view>
            <view class="ds-tips">
                <view class="ds-tips-title">玩法说明</view>
                <view class="ds-tips-line">· 屏幕上的数字请家长念给孩子听</view>
                <view class="ds-tips-line">· 孩子复述后点「✓ 正确」或「✗ 失败」</view>
                <view class="ds-tips-line">· 三档按钮：+1位 / 原位 / -1位（最少 3 位）</view>
                <view class="ds-tips-line">· 想结束点「结束本轮」查看成绩</view>
            </view>
        </view>

        <!-- 屏幕 B: 答题屏 (playing) -->
        <view
            v-else-if="round.state === 'playing'"
            class="ds-playing"
        >
            <view class="ds-progress">
                第 {{ round.history.length + 1 }} 题 · 最高 {{ maxDigitCount }} 位
            </view>

            <view
                class="ds-digit-card"
                :class="{
                    'ds-digit-card--correct': round.feedback === 'correct',
                    'ds-digit-card--wrong': round.feedback === 'wrong',
                }"
                :data-count="round.currentDigitCount"
            >
                <text
                    v-for="(d, i) in round.currentDigits"
                    :key="i"
                    class="ds-digit"
                >
                    {{ d }}
                    <text
                        v-if="i < round.currentDigits.length - 1"
                        class="ds-sep"
                    >
                        ·
                    </text>
                </text>
            </view>

            <view class="ds-label">家长听到孩子复述后：</view>

            <!-- 判定阶段：✓ / ✗ 按钮 -->
            <view
                v-if="round.feedback === null"
                class="ds-judge-row"
            >
                <view
                    class="btn-correct"
                    @click="judge('correct')"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="32"
                        height="32"
                        fill="none"
                    >
                        <path
                            d="M5 12 L10 17 L19 7"
                            stroke="#fff"
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                    正确
                </view>
                <view
                    class="btn-wrong"
                    @click="judge('wrong')"
                >
                    <svg
                        viewBox="0 0 24 24"
                        width="32"
                        height="32"
                        fill="none"
                    >
                        <path
                            d="M6 6 L18 18 M18 6 L6 18"
                            stroke="#fff"
                            stroke-width="3"
                            stroke-linecap="round"
                        />
                    </svg>
                    失败
                </view>
            </view>

            <!-- 选长度阶段：+1位 / 原位 / -1位 -->
            <view
                v-else
                class="ds-length-row"
            >
                <view
                    class="btn-length"
                    @click="nextWithDelta(1)"
                >
                    +1位
                </view>
                <view
                    class="btn-length"
                    @click="nextWithDelta(0)"
                >
                    原位
                </view>
                <view
                    class="btn-length"
                    @click="nextWithDelta(-1)"
                >
                    -1位
                </view>
            </view>

            <view
                class="btn-end"
                @click="endRound"
            >
                结束本轮
            </view>
        </view>

        <!-- 屏幕 C: 成绩单 (finished) -->
        <view
            v-if="round.state === 'finished'"
            class="ds-modal-mask"
            @click.self="resetRound"
        >
            <view class="ds-modal-card">
                <svg
                    class="ds-medal"
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
                <view class="ds-modal-title">本轮成绩</view>

                <view class="ds-modal-highlight">
                    <text class="ds-modal-highlight-num">{{ maxDigitCount }}</text>
                    <text class="ds-modal-highlight-unit">位</text>
                </view>

                <view class="ds-modal-stats">
                    <view class="ds-modal-stat">
                        <text class="ds-modal-stat__label">总题数</text>
                        <text class="ds-modal-stat__value">{{ round.history.length }}</text>
                    </view>
                    <view class="ds-modal-stat">
                        <text class="ds-modal-stat__label">✓ 正确</text>
                        <text class="ds-modal-stat__value">{{ round.correctCount }}</text>
                    </view>
                    <view class="ds-modal-stat">
                        <text class="ds-modal-stat__label">✗ 失败</text>
                        <text class="ds-modal-stat__value">{{ round.wrongCount }}</text>
                    </view>
                </view>

                <view class="ds-modal-actions">
                    <view
                        class="btn-modal-primary"
                        @click="startRound"
                    >
                        再来一轮
                    </view>
                    <view
                        class="btn-modal-secondary"
                        @click="goHome"
                    >
                        回首页
                    </view>
                </view>
            </view>
        </view>
    </view>
</template>

<script setup lang="ts">
    import { ref, computed } from 'vue';

    // ===== 类型定义 =====
    interface Attempt {
        digitCount: number;
        digits: number[];
        result: 'correct' | 'wrong';
    }

    type GameState = 'idle' | 'playing' | 'finished';

    interface Round {
        state: GameState;
        currentDigits: number[];
        currentDigitCount: number;
        history: Attempt[];
        correctCount: number;
        wrongCount: number;
        feedback: 'correct' | 'wrong' | null;
    }

    // ===== 初始状态（idle） =====
    const round = ref<Round>({
        state: 'idle',
        currentDigits: [],
        currentDigitCount: 3,
        history: [],
        correctCount: 0,
        wrongCount: 0,
        feedback: null,
    });

    // ===== 计算属性 =====
    const maxDigitCount = computed(() => {
        if (round.value.history.length === 0) return 0;
        return Math.max(...round.value.history.map(a => a.digitCount));
    });

    // ===== 工具函数 =====
    const generateDigits = (count: number): number[] => {
        return Array.from(
            { length: count },
            () => Math.floor(Math.random() * 9) + 1, // 1-9 随机，不含 0
        );
    };

    // ===== 核心游戏控制 =====
    const startRound = () => {
        round.value = {
            state: 'playing',
            currentDigits: generateDigits(3),
            currentDigitCount: 3,
            history: [],
            correctCount: 0,
            wrongCount: 0,
            feedback: null,
        };
    };

    const judge = (result: 'correct' | 'wrong') => {
        if (round.value.state !== 'playing' || round.value.feedback !== null) return;
        // 记录本轮历史
        round.value.history.push({
            digitCount: round.value.currentDigitCount,
            digits: [...round.value.currentDigits],
            result,
        });
        // 更新计数
        if (result === 'correct') {
            round.value.correctCount += 1;
        } else {
            round.value.wrongCount += 1;
        }
        // 设置反馈（驱动脉冲动画，并触发 +1位/原位/-1位 按钮出现）
        round.value.feedback = result;
    };

    const nextWithDelta = (delta: number) => {
        if (round.value.state !== 'playing' || round.value.feedback === null) return;
        // delta = +1 / 0 / -1
        const newCount = Math.max(3, round.value.currentDigitCount + delta);
        round.value.currentDigits = generateDigits(newCount);
        round.value.currentDigitCount = newCount;
        // 重置反馈，让 ✓/✗ 按钮重新出现
        round.value.feedback = null;
    };

    const endRound = () => {
        if (round.value.state !== 'playing') return;
        // 没有任何题目直接回到 idle，否则进入 finished 弹成绩单
        if (round.value.history.length === 0) {
            round.value.state = 'idle';
        } else {
            round.value.state = 'finished';
        }
    };

    const resetRound = () => {
        round.value = {
            state: 'idle',
            currentDigits: [],
            currentDigitCount: 3,
            history: [],
            correctCount: 0,
            wrongCount: 0,
            feedback: null,
        };
    };

    const goHome = () => {
        uni.reLaunch({ url: '/pages/index/index' });
    };

    const handleHomeClick = () => {
        // 离开未结束本轮时弹二次确认
        if (round.value.state === 'playing' && round.value.history.length > 0) {
            uni.showModal({
                title: '退出确认',
                content: '本轮还有未结束的题目，确定要离开吗？',
                confirmText: '确定离开',
                cancelText: '继续玩',
                success: res => {
                    if (res.confirm) {
                        uni.reLaunch({ url: '/pages/index/index' });
                    }
                },
            });
        } else {
            uni.reLaunch({ url: '/pages/index/index' });
        }
    };
</script>

<style lang="scss" scoped>
    // ===== 主题变量（与 maze 保持一致） =====
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $primary-light: #ffd9e1;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $text-main: #3d1a26;
    $text-soft: #c25a70;
    $green: #6dd680;
    $green-dark: #4a9c5a;
    $red: #f06060;
    $red-dark: #c03030;

    .ds-page {
        min-height: 100vh;
        background: linear-gradient(160deg, $bg 0%, $bg-end 100%);
        padding: 32rpx 32rpx 64rpx;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        touch-action: manipulation;
        color: $text-main;
        font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif;
    }

    // ===== Claymorphism 背景装饰球（与 linggu 一致） =====
    .bg-ball {
        position: absolute;
        border-radius: 50%;
        z-index: 0;
        pointer-events: none;
    }
    .ball-1 {
        top: 4%;
        left: 4%;
        width: 100px;
        height: 100px;
        background: radial-gradient(circle at 35% 35%, #ffeef3, #ffbdc8);
        box-shadow:
            inset -3px -3px 8px rgb(194 90 112 / 0.2),
            4px 4px 12px rgb(255 133 161 / 0.3);
        animation: float 8s ease-in-out infinite;
    }
    .ball-2 {
        top: 8%;
        right: 6%;
        width: 75px;
        height: 75px;
        background: radial-gradient(circle at 35% 35%, #fff4e6, #ffc9a0);
        box-shadow:
            inset -2px -2px 6px rgb(200 100 50 / 0.2),
            3px 3px 10px rgb(255 180 120 / 0.3);
        animation: float 10s ease-in-out infinite reverse;
    }
    .ball-3 {
        bottom: 14%;
        left: 8%;
        width: 120px;
        height: 120px;
        background: radial-gradient(circle at 35% 35%, #e8f4ff, #a8d8ff);
        box-shadow:
            inset -3px -3px 8px rgb(50 100 200 / 0.15),
            4px 4px 12px rgb(100 160 255 / 0.25);
        animation: float 12s ease-in-out infinite;
    }
    .ball-4 {
        bottom: 6%;
        right: 4%;
        width: 90px;
        height: 90px;
        background: radial-gradient(circle at 35% 35%, #e8ffe8, #a0e8b0);
        box-shadow:
            inset -2px -2px 6px rgb(50 160 80 / 0.15),
            3px 3px 10px rgb(100 200 120 / 0.3);
        animation: float 9s ease-in-out infinite reverse;
    }
    @keyframes float {
        0%,
        100% {
            transform: translateY(0) rotate(0deg);
        }
        50% {
            transform: translateY(-14px) rotate(4deg);
        }
    }

    // ===== 顶栏 =====
    .ds-header {
        position: relative;
        z-index: 1;
        margin-bottom: 24rpx;
    }
    .ds-home-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        border-radius: 20rpx;
        border: 3rpx solid $primary-light;
        box-shadow:
            inset -2rpx -2rpx 4rpx rgba(255, 255, 255, 0.6),
            inset 2rpx 2rpx 4rpx rgba(194, 90, 112, 0.12),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15);
        transition: transform 0.15s;
    }
    .ds-home-btn:active {
        transform: scale(0.92);
    }

    // ===== 屏幕 A: 准备屏 =====
    .ds-idle {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24rpx;
        padding-top: 40rpx;
    }
    .ds-icon {
        width: 160rpx;
        height: 160rpx;
        border-radius: 48rpx;
        background: linear-gradient(145deg, $primary-dark 0%, $primary 100%);
        border: 4rpx solid rgb(255 255 255 / 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow:
            inset 0 4rpx 8rpx rgb(255 255 255 / 0.3),
            inset 0 -4rpx 8rpx rgba(194, 90, 112, 0.2),
            0 8rpx 24rpx rgba(194, 90, 112, 0.3);
    }
    .ds-title {
        font-size: 56rpx;
        font-weight: 800;
        color: $text-main;
        letter-spacing: 4rpx;
        text-shadow: 0 3rpx 0 rgba(194, 90, 112, 0.2);
    }
    .ds-desc {
        font-size: 28rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .btn-start {
        display: flex;
        align-items: center;
        gap: 12rpx;
        padding: 0 64rpx;
        height: 96rpx;
        border-radius: 48rpx;
        font-size: 32rpx;
        font-weight: 700;
        letter-spacing: 2rpx;
        color: #fff;
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        border: 4rpx solid rgb(255 255 255 / 0.5);
        box-shadow:
            inset 0 4rpx 8rpx rgb(255 255 255 / 0.3),
            inset 0 -6rpx 0 $primary-dark,
            0 10rpx 24rpx rgba(194, 90, 112, 0.3);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
    }
    .btn-start:active {
        transform: scale(0.95) translateY(4rpx);
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.2),
            inset 0 -3rpx 0 $primary-dark,
            0 6rpx 14rpx rgba(194, 90, 112, 0.2);
    }
    .ds-tips {
        margin-top: 32rpx;
        padding: 32rpx 36rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 24rpx;
        border: 3rpx solid #fff;
        box-shadow:
            inset -3rpx -3rpx 8rpx rgba(255, 255, 255, 0.6),
            inset 3rpx 3rpx 8rpx rgba(194, 90, 112, 0.12),
            6rpx 6rpx 16rpx rgba(194, 90, 112, 0.15);
        width: 100%;
        max-width: 600rpx;
    }
    .ds-tips-title {
        font-size: 28rpx;
        font-weight: 700;
        color: $primary-dark;
        margin-bottom: 12rpx;
    }
    .ds-tips-line {
        font-size: 24rpx;
        color: $text-soft;
        line-height: 1.8;
    }

    // ===== 屏幕 B: 答题屏 =====
    .ds-playing {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 32rpx;
        padding-top: 16rpx;
    }
    .ds-progress {
        align-self: center;
        padding: 12rpx 32rpx;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 32rpx;
        font-size: 28rpx;
        font-weight: 700;
        color: $primary-dark;
        box-shadow:
            inset -2rpx -2rpx 6rpx rgba(255, 255, 255, 0.6),
            2rpx 2rpx 8rpx rgba(194, 90, 112, 0.2);
    }
    .ds-digit-card {
        margin-top: 32rpx;
        padding: 64rpx 48rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 32rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.5),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.12),
            8rpx 8rpx 24rpx rgba(194, 90, 112, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16rpx;
        min-width: 60vw;
    }
    .ds-digit {
        font-size: 72rpx;
        font-weight: 800;
        color: $primary-dark;
        line-height: 1;
    }
    .ds-sep {
        font-size: 48rpx;
        color: $primary-light;
        margin: 0 8rpx;
    }
    .ds-digit-card--correct {
        animation: pulseGreen 0.5s ease-out;
    }
    .ds-digit-card--wrong {
        animation: pulseRed 0.5s ease-out;
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

    // 字号随位数缩放（依据 spec 表格）
    // 3 位: 72rpx / 4 位: 60rpx / 5 位: 50rpx / 6+ 位: 44rpx
    .ds-digit-card[data-count='4'] .ds-digit {
        font-size: 60rpx;
    }
    .ds-digit-card[data-count='5'] .ds-digit {
        font-size: 50rpx;
    }
    .ds-digit-card[data-count='6'] .ds-digit,
    .ds-digit-card[data-count='7'] .ds-digit,
    .ds-digit-card[data-count='8'] .ds-digit,
    .ds-digit-card[data-count='9'] .ds-digit,
    .ds-digit-card[data-count='10'] .ds-digit {
        font-size: 44rpx;
    }

    .ds-label {
        font-size: 26rpx;
        color: $text-soft;
        font-weight: 600;
        margin-top: 16rpx;
    }
    .ds-judge-row {
        display: flex;
        gap: 32rpx;
        width: 100%;
        max-width: 600rpx;
    }
    .btn-correct,
    .btn-wrong {
        flex: 1;
        height: 120rpx;
        border-radius: 32rpx;
        font-size: 36rpx;
        font-weight: 700;
        letter-spacing: 2rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        color: #fff;
        border: 4rpx solid rgb(255 255 255 / 0.5);
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .btn-correct {
        background: linear-gradient(145deg, $green 0%, #5cb868 100%);
        box-shadow:
            inset 0 4rpx 8rpx rgb(255 255 255 / 0.3),
            inset 0 -6rpx 0 $green-dark,
            0 8rpx 20rpx rgba(100, 200, 120, 0.35);
    }
    .btn-wrong {
        background: linear-gradient(145deg, #ffa0a0 0%, $red 100%);
        box-shadow:
            inset 0 4rpx 8rpx rgb(255 255 255 / 0.3),
            inset 0 -6rpx 0 $red-dark,
            0 8rpx 20rpx rgba(200, 60, 60, 0.35);
    }
    .btn-correct:active,
    .btn-wrong:active {
        transform: scale(0.95) translateY(4rpx);
    }

    .ds-length-row {
        display: flex;
        gap: 16rpx;
        width: 100%;
        max-width: 600rpx;
    }
    .btn-length {
        flex: 1;
        height: 88rpx;
        border-radius: 24rpx;
        font-size: 30rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        border: 3rpx solid rgb(255 255 255 / 0.5);
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.3),
            inset 0 -4rpx 0 $primary-dark,
            0 6rpx 16rpx rgba(194, 90, 112, 0.25);
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
    }
    .btn-length:active {
        transform: scale(0.95) translateY(3rpx);
    }

    .btn-end {
        margin-top: 32rpx;
        padding: 0 40rpx;
        height: 64rpx;
        border-radius: 32rpx;
        font-size: 24rpx;
        font-weight: 600;
        color: $text-soft;
        background: rgba(255, 255, 255, 0.6);
        border: 2rpx solid #e0d0d4;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;
    }
    .btn-end:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.8);
    }

    // ===== 屏幕 C: 成绩单弹窗 =====
    .ds-modal-mask {
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
    .ds-modal-card {
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
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.5),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.12),
            12rpx 12rpx 32rpx rgba(194, 90, 112, 0.3);
        animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ds-medal {
        width: 96px;
        height: 96px;
    }
    .ds-modal-title {
        font-size: 40rpx;
        font-weight: 800;
        color: $primary-dark;
        letter-spacing: 3rpx;
    }
    .ds-modal-highlight {
        display: flex;
        align-items: baseline;
        gap: 8rpx;
        margin: 8rpx 0;
    }
    .ds-modal-highlight-num {
        font-size: 96rpx;
        font-weight: 800;
        color: $primary;
        line-height: 1;
        text-shadow: 0 4rpx 0 rgba(194, 90, 112, 0.15);
    }
    .ds-modal-highlight-unit {
        font-size: 32rpx;
        font-weight: 700;
        color: $primary-dark;
    }
    .ds-modal-stats {
        display: flex;
        gap: 16rpx;
        width: 100%;
        justify-content: center;
    }
    .ds-modal-stat {
        flex: 1;
        text-align: center;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 20rpx;
        padding: 16rpx 8rpx;
        box-shadow: inset 0 2rpx 4rpx rgba(255, 255, 255, 0.6);
        display: flex;
        flex-direction: column;
        gap: 6rpx;
    }
    .ds-modal-stat__label {
        font-size: 22rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .ds-modal-stat__value {
        font-size: 36rpx;
        color: $primary-dark;
        font-weight: 800;
    }
    .ds-modal-actions {
        display: flex;
        gap: 16rpx;
        width: 100%;
        margin-top: 8rpx;
    }
    .btn-modal-primary,
    .btn-modal-secondary {
        flex: 1;
        height: 88rpx;
        border-radius: 24rpx;
        font-size: 30rpx;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3rpx solid rgb(255 255 255 / 0.5);
        cursor: pointer;
        transition: all 0.2s;
    }
    .btn-modal-primary {
        background: linear-gradient(145deg, #ffb0c0 0%, $primary 100%);
        color: #fff;
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.3),
            inset 0 -4rpx 0 $primary-dark,
            0 6rpx 16rpx rgba(194, 90, 112, 0.3);
    }
    .btn-modal-secondary {
        background: #fff;
        color: $primary-dark;
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.6),
            0 4rpx 12rpx rgba(194, 90, 112, 0.18);
    }
    .btn-modal-primary:active,
    .btn-modal-secondary:active {
        transform: scale(0.95);
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

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .ds-modal-card,
        .ds-modal-mask,
        .ds-digit-card--correct,
        .ds-digit-card--wrong,
        .bg-ball {
            animation: none;
        }
        .btn-start,
        .btn-correct,
        .btn-wrong,
        .btn-length,
        .btn-end,
        .btn-modal-primary,
        .btn-modal-secondary,
        .ds-home-btn {
            transition: none;
        }
    }
</style>
