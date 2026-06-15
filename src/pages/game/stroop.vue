<template>
    <view class="stroop-page">
        <!-- Claymorphism 背景装饰球 -->
        <view class="bg-ball ball-1"></view>
        <view class="bg-ball ball-2"></view>
        <view class="bg-ball ball-3"></view>
        <view class="bg-ball ball-4"></view>

        <!-- 顶栏:返回首页按钮 -->
        <view class="stroop-header">
            <view
                class="stroop-home-btn"
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

        <!-- 屏幕 A: 准备屏 (idle) — 选难度 -->
        <view
            v-if="round.state === 'idle'"
            class="stroop-idle"
        >
            <view class="stroop-icon">
                <!-- 颜料盘 SVG -->
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
                        fill="#fff"
                        stroke="#c25a70"
                        stroke-width="3"
                    />
                    <circle
                        cx="22"
                        cy="22"
                        r="6"
                        fill="#EF4444"
                    />
                    <circle
                        cx="42"
                        cy="22"
                        r="6"
                        fill="#3B82F6"
                    />
                    <circle
                        cx="22"
                        cy="42"
                        r="6"
                        fill="#EAB308"
                    />
                    <circle
                        cx="42"
                        cy="42"
                        r="6"
                        fill="#22C55E"
                    />
                    <circle
                        cx="32"
                        cy="32"
                        r="5"
                        fill="#c25a70"
                    />
                </svg>
            </view>
            <view class="stroop-title">Stroop 颜色冲突</view>
            <view class="stroop-desc">说出墨水颜色（不是字！）</view>

            <view class="stroop-difficulty-row">
                <view
                    v-for="d in ['easy', 'standard', 'advanced'] as Difficulty[]"
                    :key="d"
                    class="stroop-difficulty-card"
                    :class="{
                        'stroop-difficulty-card--active': round.difficulty === d,
                    }"
                    @click="selectDifficulty(d)"
                >
                    <view class="stroop-difficulty-card__label">
                        {{ d === 'easy' ? '入门' : d === 'standard' ? '标准' : '进阶' }}
                    </view>
                    <view class="stroop-difficulty-card__hint">
                        {{ d === 'easy' ? '2 色' : d === 'standard' ? '4 色' : '1秒/字' }}
                    </view>
                </view>
            </view>

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

            <view class="stroop-tips">
                <view class="stroop-tips-title">玩法说明</view>
                <view class="stroop-tips-line">· 每个字用错位颜色书写</view>
                <view class="stroop-tips-line">· 点字 → 点下方颜色按钮作答</view>
                <view class="stroop-tips-line">· 3 组 × 30秒，组间 5 秒休息</view>
                <view class="stroop-tips-line">· 进阶：有时念字，有时看颜色</view>
            </view>
        </view>

        <!-- 屏幕 B: 答题屏 (group-playing) -->
        <view
            v-else-if="round.state === 'group-playing'"
            class="stroop-playing"
        >
            <!-- 顶栏:组号 / 倒计时 / 模式 -->
            <view class="stroop-status-row">
                <text class="stroop-status-text">
                    第 {{ round.currentGroupIndex + 1 }}/3 组 · ⏱
                    {{ Math.ceil(round.remainingMs / 1000) }}s
                </text>
                <view
                    class="stroop-mode-badge"
                    :class="`stroop-mode-badge--${round.groups[round.currentGroupIndex]?.mode}`"
                >
                    <svg
                        v-if="round.groups[round.currentGroupIndex]?.mode === 'ink'"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="#fff"
                            stroke-width="2"
                        />
                        <circle
                            cx="8"
                            cy="8"
                            r="3"
                            fill="#EF4444"
                        />
                        <circle
                            cx="16"
                            cy="8"
                            r="3"
                            fill="#3B82F6"
                        />
                        <circle
                            cx="8"
                            cy="16"
                            r="3"
                            fill="#EAB308"
                        />
                        <circle
                            cx="16"
                            cy="16"
                            r="3"
                            fill="#22C55E"
                        />
                    </svg>
                    <svg
                        v-else-if="round.groups[round.currentGroupIndex]?.mode === 'word'"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <path
                            d="M4 5 H20 V19 H4 Z"
                            stroke="#fff"
                            stroke-width="2"
                            fill="none"
                        />
                        <path
                            d="M8 9 H16 M8 13 H16 M8 17 H13"
                            stroke="#fff"
                            stroke-width="1.5"
                            stroke-linecap="round"
                        />
                    </svg>
                    <svg
                        v-else
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        fill="none"
                    >
                        <path
                            d="M5 12 L19 12 M5 8 L19 16 M5 16 L19 8"
                            stroke="#fff"
                            stroke-width="2"
                            stroke-linecap="round"
                        />
                    </svg>
                    <text class="stroop-mode-badge__text">
                        {{
                            round.groups[round.currentGroupIndex]?.mode === 'ink'
                                ? '颜色'
                                : round.groups[round.currentGroupIndex]?.mode === 'word'
                                  ? '字念'
                                  : '混合'
                        }}
                    </text>
                </view>
            </view>

            <!-- 4 行 × 6 字 卡片 -->
            <view class="stroop-grid">
                <view
                    v-for="(row, r) in chunkedChars"
                    :key="`row-${r}-${round.currentGroupIndex}`"
                    class="stroop-grid-row"
                >
                    <view
                        v-for="(char, c) in row"
                        :key="`char-${r * 6 + c}-${round.currentGroupIndex}`"
                        class="stroop-char"
                        :class="{
                            'stroop-char--selected': round.selectedCharIndex === r * 6 + c,
                            [`stroop-char--${char.status}`]: char.status !== 'idle',
                        }"
                        :style="{ color: INK_HEX[char.ink] }"
                        @click="selectChar(r * 6 + c)"
                    >
                        <text>{{ WORD_LABEL[char.word] }}</text>
                    </view>
                </view>
            </view>

            <!-- 颜色按钮 4 个 -->
            <view class="stroop-color-buttons">
                <view
                    v-for="c in DIFFICULTY_CONFIG[round.difficulty].colors"
                    :key="c"
                    class="stroop-color-btn"
                    :class="`stroop-color-btn--${c}`"
                    @click="judge(c)"
                >
                    <view
                        class="stroop-color-btn__swatch"
                        :style="{ background: INK_HEX[c] }"
                    ></view>
                    <text class="stroop-color-btn__label">{{ COLOR_LABELS[c] }}</text>
                </view>
            </view>
        </view>

        <!-- 屏幕 C: 组间休息 (group-rest) -->
        <view
            v-else-if="round.state === 'group-rest'"
            class="stroop-rest"
        >
            <view class="stroop-rest-title">下一组：第 {{ round.currentGroupIndex + 2 }}/3 组</view>
            <view class="stroop-rest-mode">
                {{
                    round.groups[round.currentGroupIndex + 1]?.mode === 'ink'
                        ? '颜色模式'
                        : round.groups[round.currentGroupIndex + 1]?.mode === 'word'
                          ? '字念模式'
                          : '混合模式'
                }}
            </view>
            <view class="stroop-rest-countdown">
                {{ Math.ceil(round.restRemainingMs / 1000) }}
            </view>
            <view class="stroop-rest-subtitle">休息一下</view>
            <view
                v-if="round.groups[round.currentGroupIndex]"
                class="stroop-rest-last-result"
            >
                上组成绩：答对 {{ round.groups[round.currentGroupIndex].correctCount }} / 答错
                {{ round.groups[round.currentGroupIndex].wrongCount }}
            </view>
        </view>

        <!-- 屏幕 D: 整局结束 (finished) 弹窗 -->
        <view
            v-if="round.state === 'finished'"
            class="stroop-modal-mask"
            @click.self="resetRound"
        >
            <view class="stroop-modal-card">
                <svg
                    class="stroop-medal"
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
                <view class="stroop-modal-title">本轮成绩</view>

                <view class="stroop-modal-highlight-row">
                    <view class="stroop-modal-highlight">
                        <text class="stroop-modal-highlight-num">{{ totalCorrect }}</text>
                        <text class="stroop-modal-highlight-slash">/</text>
                        <text class="stroop-modal-highlight-total">{{ totalChars }}</text>
                    </view>
                    <view class="stroop-modal-percent">{{ accuracyPercent }}%</view>
                </view>

                <view class="stroop-modal-stats">
                    <view
                        v-for="(g, i) in round.groups"
                        :key="i"
                        class="stroop-modal-stat"
                    >
                        <text class="stroop-modal-stat__label">
                            第 {{ i + 1 }} 组 ·
                            {{ g.mode === 'ink' ? '颜色' : g.mode === 'word' ? '字念' : '混合' }}
                        </text>
                        <text class="stroop-modal-stat__value">
                            {{ g.correctCount }}/{{ g.chars.length }}
                        </text>
                    </view>
                </view>

                <view class="stroop-modal-actions">
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
    import { ref, computed, onUnmounted } from 'vue';

    // ===== 类型定义 =====
    type Color = 'red' | 'blue' | 'yellow' | 'green';
    type GroupMode = 'ink' | 'word' | 'mixed';
    type Difficulty = 'easy' | 'standard' | 'advanced';
    type GameState = 'idle' | 'group-rest' | 'group-playing' | 'finished';

    interface Char {
        word: Color;
        ink: Color;
        status: 'idle' | 'correct' | 'wrong' | 'skipped';
        expectedAnswer: Color;
    }

    interface DifficultyConfig {
        colors: Color[];
        perCharTimeMs: number | null;
        groupModes: GroupMode[];
    }

    interface Group {
        index: number;
        mode: GroupMode;
        chars: Char[];
        correctCount: number;
        wrongCount: number;
        startedAt: number | null;
    }

    interface Round {
        state: GameState;
        difficulty: Difficulty;
        groups: Group[];
        currentGroupIndex: number;
        selectedCharIndex: number | null;
        selectedAt: number | null;
        remainingMs: number;
        restRemainingMs: number;
    }

    // ===== 难度配置 =====
    const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
        easy: {
            colors: ['red', 'blue'],
            perCharTimeMs: null,
            groupModes: ['ink', 'ink', 'ink'],
        },
        standard: {
            colors: ['red', 'blue', 'yellow', 'green'],
            perCharTimeMs: null,
            groupModes: ['ink', 'ink', 'ink'],
        },
        advanced: {
            colors: ['red', 'blue', 'yellow', 'green'],
            perCharTimeMs: 1000,
            groupModes: ['ink', 'word', 'mixed'],
        },
    };

    // ===== 初始状态（idle） =====
    const round = ref<Round>({
        state: 'idle',
        difficulty: 'standard',
        groups: [],
        currentGroupIndex: 0,
        selectedCharIndex: null,
        selectedAt: null,
        remainingMs: 30000,
        restRemainingMs: 5000,
    });

    // ===== 计算属性 =====
    const totalCorrect = computed(() =>
        round.value.groups.reduce((sum, g) => sum + g.correctCount, 0),
    );
    const totalWrong = computed(() => round.value.groups.reduce((sum, g) => sum + g.wrongCount, 0));
    const totalChars = computed(() =>
        round.value.groups.reduce((sum, g) => sum + g.chars.length, 0),
    );
    const accuracyPercent = computed(() => {
        const total = totalCorrect.value + totalWrong.value;
        if (total === 0) return 0;
        return Math.round((totalCorrect.value / total) * 100);
    });

    const chunkedChars = computed(() => {
        const group = round.value.groups[round.value.currentGroupIndex];
        if (!group) return [] as Char[][];
        const chunked: Char[][] = [];
        for (let i = 0; i < group.chars.length; i += 6) {
            chunked.push(group.chars.slice(i, i + 6));
        }
        return chunked;
    });

    // ===== 颜色 → 视觉常量 =====
    const INK_HEX: Record<Color, string> = {
        red: '#EF4444',
        blue: '#3B82F6',
        yellow: '#EAB308',
        green: '#22C55E',
    };

    const WORD_LABEL: Record<Color, string> = {
        red: '红',
        blue: '蓝',
        yellow: '黄',
        green: '绿',
    };

    // ===== 工具函数 =====
    const COLOR_LABELS: Record<Color, string> = {
        red: '红',
        blue: '蓝',
        yellow: '黄',
        green: '绿',
    };

    const generateChars = (count: number, colors: Color[]): Char[] => {
        return Array.from({ length: count }, () => {
            const word = colors[Math.floor(Math.random() * colors.length)];
            let ink = colors[Math.floor(Math.random() * colors.length)];
            // 强制 ink !== word，保留 Stroop 冲突张力
            while (ink === word) {
                ink = colors[Math.floor(Math.random() * colors.length)];
            }
            return { word, ink, status: 'idle', expectedAnswer: ink };
        });
    };

    const computeExpectedAnswer = (word: Color, ink: Color, mode: GroupMode): Color => {
        if (mode === 'ink') return ink;
        if (mode === 'word') return word;
        // mixed: 50/50（在出题时确定一次）
        return Math.random() < 0.5 ? ink : word;
    };

    const buildGroup = (index: number, mode: GroupMode, colors: Color[]): Group => {
        const chars = generateChars(24, colors).map(c => ({
            ...c,
            expectedAnswer: computeExpectedAnswer(c.word, c.ink, mode),
        }));
        return {
            index,
            mode,
            chars,
            correctCount: 0,
            wrongCount: 0,
            startedAt: null,
        };
    };

    // ===== 核心游戏控制 =====
    let timerId: number | null = null;

    const startRound = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        const cfg = DIFFICULTY_CONFIG[round.value.difficulty];
        const groups = cfg.groupModes.map((mode, i) => buildGroup(i, mode, cfg.colors));
        round.value = {
            state: 'group-playing',
            difficulty: round.value.difficulty,
            groups,
            currentGroupIndex: 0,
            selectedCharIndex: null,
            selectedAt: null,
            remainingMs: 30000,
            restRemainingMs: 5000,
        };
        startGroup(0);
        startTimer();
    };

    const startGroup = (index: number) => {
        round.value.currentGroupIndex = index;
        round.value.remainingMs = 30000;
        round.value.selectedCharIndex = null;
        round.value.selectedAt = null;
        const group = round.value.groups[index];
        if (group) {
            group.startedAt = Date.now();
        }
        round.value.state = 'group-playing';
    };

    const startRest = () => {
        round.value.restRemainingMs = 5000;
        round.value.selectedCharIndex = null;
        round.value.selectedAt = null;
        round.value.state = 'group-rest';
    };

    const selectChar = (charIndex: number) => {
        if (round.value.state !== 'group-playing') return;
        const group = round.value.groups[round.value.currentGroupIndex];
        if (!group) return;
        const char = group.chars[charIndex];
        // 已判定的字不能再选
        if (char.status !== 'idle') return;
        round.value.selectedCharIndex = charIndex;
        round.value.selectedAt = Date.now();
    };

    const judge = (answer: Color) => {
        if (round.value.state !== 'group-playing') return;
        if (round.value.selectedCharIndex === null) return;
        const group = round.value.groups[round.value.currentGroupIndex];
        if (!group) return;
        const char = group.chars[round.value.selectedCharIndex];
        if (char.status !== 'idle') return;
        if (answer === char.expectedAnswer) {
            char.status = 'correct';
            group.correctCount += 1;
        } else {
            char.status = 'wrong';
            group.wrongCount += 1;
        }
        // 清除选中（这样下一字可重新选中）
        round.value.selectedCharIndex = null;
        round.value.selectedAt = null;
    };

    const handleCharTimeout = () => {
        if (round.value.selectedCharIndex === null) return;
        const group = round.value.groups[round.value.currentGroupIndex];
        if (!group) return;
        const char = group.chars[round.value.selectedCharIndex];
        if (char.status !== 'idle') return;
        char.status = 'skipped';
        group.wrongCount += 1;
        round.value.selectedCharIndex = null;
        round.value.selectedAt = null;
    };

    const handleGroupTimeout = () => {
        const group = round.value.groups[round.value.currentGroupIndex];
        if (!group) return;
        // 未答的字全标 skipped
        group.chars.forEach(c => {
            if (c.status === 'idle') {
                c.status = 'skipped';
                group.wrongCount += 1;
            }
        });
        round.value.selectedCharIndex = null;
        round.value.selectedAt = null;
        // 进入下一组或 finished
        if (round.value.currentGroupIndex < round.value.groups.length - 1) {
            startRest();
        } else {
            round.value.state = 'finished';
        }
    };

    const startNextGroup = () => {
        const nextIndex = round.value.currentGroupIndex + 1;
        if (nextIndex < round.value.groups.length) {
            startGroup(nextIndex);
        } else {
            round.value.state = 'finished';
        }
    };

    const startTimer = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        timerId = setInterval(() => {
            if (round.value.state === 'group-playing') {
                round.value.remainingMs = Math.max(0, round.value.remainingMs - 100);
                // 进阶 1秒/字 单独检查
                if (
                    round.value.selectedCharIndex !== null &&
                    round.value.selectedAt !== null &&
                    Date.now() - round.value.selectedAt >= 1000
                ) {
                    handleCharTimeout();
                }
                if (round.value.remainingMs <= 0) {
                    handleGroupTimeout();
                }
            } else if (round.value.state === 'group-rest') {
                round.value.restRemainingMs = Math.max(0, round.value.restRemainingMs - 100);
                if (round.value.restRemainingMs <= 0) {
                    startNextGroup();
                }
            }
        }, 100) as unknown as number;
    };

    // ===== 难度切换 / 离开 =====
    const selectDifficulty = (d: Difficulty) => {
        if (round.value.state === 'group-playing' || round.value.state === 'group-rest') return;
        round.value.difficulty = d;
    };

    const resetRound = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        round.value = {
            state: 'idle',
            difficulty: round.value.difficulty,
            groups: [],
            currentGroupIndex: 0,
            selectedCharIndex: null,
            selectedAt: null,
            remainingMs: 30000,
            restRemainingMs: 5000,
        };
    };

    const goHome = () => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
        uni.reLaunch({ url: '/pages/index/index' });
    };

    const handleHomeClick = () => {
        // 离开游戏中时弹二次确认
        if (round.value.state === 'group-playing' || round.value.state === 'group-rest') {
            uni.showModal({
                title: '退出确认',
                content: '当前还在游戏中，确定要离开吗？',
                confirmText: '确定离开',
                cancelText: '继续玩',
                success: res => {
                    if (res.confirm) {
                        goHome();
                    }
                },
            });
        } else {
            goHome();
        }
    };

    onUnmounted(() => {
        if (timerId !== null) {
            clearInterval(timerId);
            timerId = null;
        }
    });
</script>

<style lang="scss" scoped>
    // ===== 主题变量（与 digit-span/maze 一致） =====
    $primary: #ff85a1;
    $primary-dark: #c25a70;
    $primary-light: #ffd9e1;
    $bg: #fff0f3;
    $bg-end: #ffe4ec;
    $text-main: #3d1a26;
    $text-soft: #c25a70;

    $color-red: #ef4444;
    $color-blue: #3b82f6;
    $color-yellow: #eab308;
    $color-green: #22c55e;

    .stroop-page {
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
    .stroop-header {
        position: relative;
        z-index: 1;
        margin-bottom: 24rpx;
    }
    .stroop-home-btn {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff;
        border-radius: 20rpx;
        border: 3rpx solid $primary-light;
        box-shadow:
            inset -2rpx -2rpx 4rpx rgba(255, 255, 255, 0.5),
            inset 2rpx 2rpx 4rpx rgba(194, 90, 112, 0.12),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15);
        transition: transform 0.15s;
    }
    .stroop-home-btn:active {
        transform: scale(0.92);
    }

    // ===== 屏幕 A: 准备屏 =====
    .stroop-idle {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24rpx;
        padding-top: 24rpx;
    }
    .stroop-icon {
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
    .stroop-title {
        font-size: 48rpx;
        font-weight: 800;
        color: $text-main;
        letter-spacing: 2rpx;
        text-shadow: 0 3rpx 0 rgba(194, 90, 112, 0.2);
    }
    .stroop-desc {
        font-size: 28rpx;
        color: $text-soft;
        font-weight: 600;
    }

    // ===== 难度卡片 =====
    .stroop-difficulty-row {
        display: flex;
        gap: 16rpx;
        width: 100%;
        max-width: 600rpx;
        margin-top: 16rpx;
    }
    .stroop-difficulty-card {
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
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border: 4rpx solid #fff;
        box-shadow:
            inset -3rpx -3rpx 8rpx rgba(255, 255, 255, 0.5),
            inset 3rpx 3rpx 8rpx rgba(194, 90, 112, 0.12),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.15);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .stroop-difficulty-card__label {
        font-size: 32rpx;
        font-weight: 700;
        color: $text-main;
    }
    .stroop-difficulty-card__hint {
        font-size: 22rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .stroop-difficulty-card--active {
        transform: translateY(-8rpx);
        border-color: $primary;
        box-shadow:
            inset -3rpx -3rpx 8rpx rgba(255, 255, 255, 0.5),
            inset 3rpx 3rpx 8rpx rgba(194, 90, 112, 0.18),
            6rpx 8rpx 20rpx rgba(194, 90, 112, 0.3);
    }
    .stroop-difficulty-card:active {
        transform: scale(0.97);
    }
    .stroop-difficulty-card--active:active {
        transform: translateY(-8rpx) scale(0.97);
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
        margin-top: 16rpx;
    }
    .btn-start:active {
        transform: scale(0.95) translateY(4rpx);
        box-shadow:
            inset 0 3rpx 6rpx rgb(255 255 255 / 0.2),
            inset 0 -3rpx 0 $primary-dark,
            0 6rpx 14rpx rgba(194, 90, 112, 0.2);
    }
    .stroop-tips {
        margin-top: 16rpx;
        padding: 32rpx 36rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 24rpx;
        border: 3rpx solid #fff;
        box-shadow:
            inset -3rpx -3rpx 8rpx rgba(255, 255, 255, 0.5),
            inset 3rpx 3rpx 8rpx rgba(194, 90, 112, 0.12),
            6rpx 6rpx 16rpx rgba(194, 90, 112, 0.15);
        width: 100%;
        max-width: 600rpx;
    }
    .stroop-tips-title {
        font-size: 28rpx;
        font-weight: 700;
        color: $primary-dark;
        margin-bottom: 12rpx;
    }
    .stroop-tips-line {
        font-size: 24rpx;
        color: $text-soft;
        line-height: 1.8;
    }

    // ===== 屏幕 B: 答题屏 =====
    .stroop-playing {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 24rpx;
    }
    .stroop-status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 8rpx;
    }
    .stroop-status-text {
        font-size: 28rpx;
        font-weight: 700;
        color: $primary-dark;
    }
    .stroop-mode-badge {
        display: flex;
        align-items: center;
        gap: 6rpx;
        padding: 8rpx 16rpx;
        border-radius: 20rpx;
        font-size: 24rpx;
        font-weight: 700;
        color: #fff;
        box-shadow:
            inset 0 2rpx 4rpx rgb(255 255 255 / 0.3),
            0 2rpx 8rpx rgba(194, 90, 112, 0.2);
    }
    .stroop-mode-badge--ink {
        background: linear-gradient(145deg, #ffb0c0, $primary);
    }
    .stroop-mode-badge--word {
        background: linear-gradient(145deg, #a8d8ff, #3b82f6);
    }
    .stroop-mode-badge--mixed {
        background: linear-gradient(145deg, #d8a8ff, #a855f7);
    }
    .stroop-mode-badge__text {
        font-size: 24rpx;
        font-weight: 700;
    }

    // ===== 4 行 × 6 字 卡片 =====
    .stroop-grid {
        padding: 24rpx 16rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 24rpx;
        border: 4rpx solid #fff;
        box-shadow:
            inset -3rpx -3rpx 8rpx rgba(255, 255, 255, 0.5),
            inset 3rpx 3rpx 8rpx rgba(194, 90, 112, 0.12),
            6rpx 6rpx 16rpx rgba(194, 90, 112, 0.15);
        display: flex;
        flex-direction: column;
        gap: 16rpx;
    }
    .stroop-grid-row {
        display: flex;
        justify-content: space-around;
        align-items: center;
    }
    .stroop-char {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 56rpx;
        font-weight: 800;
        line-height: 1;
        border-radius: 16rpx;
        cursor: pointer;
        // 黄字可读性: 白色描边
        text-shadow:
            0 0 2rpx #fff,
            0 0 2rpx #fff;
        transition: transform 0.15s;
        user-select: none;
    }
    .stroop-char:active {
        transform: scale(0.95);
    }
    .stroop-char--selected {
        background: rgba(255, 133, 161, 0.15);
        border: 4rpx solid $primary;
        box-shadow:
            inset -2rpx -2rpx 4rpx rgba(255, 255, 255, 0.5),
            inset 2rpx 2rpx 4rpx rgba(194, 90, 112, 0.15),
            0 0 16rpx rgba(255, 133, 161, 0.6);
    }
    .stroop-char--correct {
        animation: pulseGreen 0.5s ease-out;
    }
    .stroop-char--wrong {
        animation: pulseRed 0.5s ease-out;
    }
    .stroop-char--skipped {
        animation: pulseGray 0.3s ease-out;
        opacity: 0.4;
    }

    // ===== 颜色按钮 =====
    .stroop-color-buttons {
        display: flex;
        gap: 16rpx;
        width: 100%;
        margin-top: 16rpx;
    }
    .stroop-color-btn {
        flex: 1;
        height: 120rpx;
        border-radius: 24rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border: 3rpx solid #fff;
        box-shadow:
            inset -2rpx -2rpx 4rpx rgba(255, 255, 255, 0.6),
            inset 2rpx 2rpx 4rpx rgba(194, 90, 112, 0.12),
            4rpx 4rpx 12rpx rgba(194, 90, 112, 0.18);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6rpx;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .stroop-color-btn:active {
        transform: scale(0.95);
    }
    .stroop-color-btn__swatch {
        width: 48rpx;
        height: 48rpx;
        border-radius: 50%;
        border: 2rpx solid #fff;
        box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
    }
    .stroop-color-btn__label {
        font-size: 26rpx;
        font-weight: 700;
        color: $text-main;
    }

    // ===== 屏幕 C: 组间休息 =====
    .stroop-rest {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24rpx;
        padding-top: 120rpx;
    }
    .stroop-rest-title {
        font-size: 32rpx;
        font-weight: 700;
        color: $primary-dark;
    }
    .stroop-rest-mode {
        font-size: 28rpx;
        color: $text-soft;
        font-weight: 600;
        padding: 8rpx 24rpx;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 20rpx;
    }
    .stroop-rest-countdown {
        font-size: 200rpx;
        font-weight: 800;
        color: $primary;
        line-height: 1;
        text-shadow: 0 6rpx 0 rgba(194, 90, 112, 0.15);
    }
    .stroop-rest-subtitle {
        font-size: 28rpx;
        color: $text-soft;
    }
    .stroop-rest-last-result {
        margin-top: 16rpx;
        font-size: 26rpx;
        color: $text-soft;
        padding: 16rpx 32rpx;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 16rpx;
    }

    // ===== 屏幕 D: 整局结束弹窗 =====
    .stroop-modal-mask {
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
    .stroop-modal-card {
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
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.15),
            12rpx 12rpx 32rpx rgba(194, 90, 112, 0.3);
        animation: cardIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .stroop-medal {
        width: 96px;
        height: 96px;
    }
    .stroop-modal-title {
        font-size: 40rpx;
        font-weight: 800;
        color: $primary-dark;
        letter-spacing: 3rpx;
    }
    .stroop-modal-highlight-row {
        display: flex;
        align-items: baseline;
        gap: 16rpx;
    }
    .stroop-modal-highlight {
        display: flex;
        align-items: baseline;
        gap: 4rpx;
    }
    .stroop-modal-highlight-num {
        font-size: 80rpx;
        font-weight: 800;
        color: $primary;
        line-height: 1;
        text-shadow: 0 4rpx 0 rgba(194, 90, 112, 0.15);
    }
    .stroop-modal-highlight-slash {
        font-size: 48rpx;
        color: $primary-light;
    }
    .stroop-modal-highlight-total {
        font-size: 48rpx;
        font-weight: 700;
        color: $primary-dark;
    }
    .stroop-modal-percent {
        font-size: 36rpx;
        font-weight: 800;
        color: $primary;
        padding: 8rpx 16rpx;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 16rpx;
    }
    .stroop-modal-stats {
        display: flex;
        gap: 12rpx;
        width: 100%;
    }
    .stroop-modal-stat {
        flex: 1;
        text-align: center;
        background: linear-gradient(135deg, #fff5f8, #ffe4ec);
        border-radius: 16rpx;
        padding: 12rpx 8rpx;
        box-shadow: inset 0 2rpx 4rpx rgba(255, 255, 255, 0.5);
        display: flex;
        flex-direction: column;
        gap: 4rpx;
    }
    .stroop-modal-stat__label {
        font-size: 20rpx;
        color: $text-soft;
        font-weight: 600;
    }
    .stroop-modal-stat__value {
        font-size: 32rpx;
        color: $primary-dark;
        font-weight: 800;
    }
    .stroop-modal-actions {
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
    @keyframes pulseGray {
        0% {
            background: rgba(0, 0, 0, 0);
        }
        30% {
            background: rgba(128, 128, 128, 0.3);
        }
        100% {
            background: rgba(0, 0, 0, 0);
        }
    }

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .stroop-modal-card,
        .stroop-modal-mask,
        .stroop-char--correct,
        .stroop-char--wrong,
        .stroop-char--skipped,
        .bg-ball {
            animation: none;
        }
        .btn-start,
        .stroop-color-btn,
        .stroop-difficulty-card,
        .btn-modal-primary,
        .btn-modal-secondary,
        .stroop-home-btn,
        .stroop-char {
            transition: none;
        }
    }
</style>
