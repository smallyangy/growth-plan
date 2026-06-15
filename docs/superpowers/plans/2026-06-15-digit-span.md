# 数字复述（Digit Span）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「果果成长计划」中新增一个儿童听觉工作记忆训练游戏页面——数字复述，家长看着屏幕念出随机数字串，孩子口头复述，由家长两键判定对错，统计本轮成绩（总题数/对/错/最高位）。

**Architecture:** 单文件 Vue 页面（`src/pages/game/digit-span.vue`，约 400-500 行），使用 Vue 3 `<script setup>` + TypeScript + UniApp rpx 响应式单位。3 个状态机屏幕（idle / playing / finished）通过 v-if 切换。游戏状态全部在组件内 reactive；**不做** localStorage 持久化（YAGNI：v1 不存历史最佳）。首页 appList 加第 6 项"数字复述"，CSS 网格保持 3×2。

**Tech Stack:** Vue 3 Composition API、UniApp、TypeScript、SCSS（rpx）、Math.random、uni.showModal

**关于测试：** 仓库当前无测试体系（无 jest/vitest 配置），按需求 YAGNI 不引入。每步通过"类型检查 + 手动跑 dev 验证"保证正确性。

**关于提交：** 用户要求本次开发**不做任何 commit**。所有任务中标注 `git commit` 的步骤**全部跳过**，subagent 不要执行 commit 动作，由用户在审阅后自己决定提交时机。

**关于路径约定：** 项目 pages.json 路径约定：
- `path: "pages/X/Y"` → 单文件 `Y.vue`
- 本计划用前者：**单文件 `src/pages/game/digit-span.vue`**

---

## 文件清单

| 操作 | 路径 | 说明 |
|------|------|------|
| 新增 | `src/pages/game/digit-span.vue` | 主页面，约 400-500 行 |
| 新增 | `src/static/images/digit-span-icon.png` | 首页入口图标（MiniMax 文生图生成） |
| 修改 | `src/pages.json` | 在 pages 数组中插入新路由 |
| 修改 | `src/pages/index/index.vue` | appList 加第 6 项"数字复述" |

---

## Task 1: 注册路由和首页入口

**Files:**
- Modify: `src/pages.json`
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 在 pages.json 中注册新路由**

打开 `src/pages.json`，在 `pages` 数组最后一项（`pages/game/maze`）之后插入：

```json
,
{
    "path": "pages/game/digit-span",
    "style": {
        "navigationBarTitleText": "数字复述"
    }
}
```

预期：JSON 仍是合法 JSON，`pages` 数组含 6 项。

- [ ] **Step 2: 修改首页 appList 加第 6 项**

打开 `src/pages/index/index.vue`，在 `appList` 数组最后一项（`数字迷宫`）之后添加：

```typescript
        ,
        {
            name: '数字复述',
            path: '/pages/game/digit-span',
            icon: 'https://smallyangy.github.io/myImgs/docImgs/202510100838290.png',
        },
```

预期：`appList` 数组含 6 项。图标先用占位 URL，Task 2 会换成文生图生成的本地路径。

- [ ] **Step 3: 验证首页能正常显示 6 个卡片**

```bash
npm run dev
```

浏览器打开 `http://localhost:8092/growth-plan/`，检查首页是否正常显示 6 个卡片（3×2 排布）。

预期：6 个卡片 3 列 2 行排布，不挤压变形。

- [ ] **Step 4: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 2: 生成数字复述专属首页图标

**Files:**
- Create: `src/static/images/digit-span-icon.png`
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
    "prompt": "App icon for a children digit memory game. Soft pink pastel background. A speech bubble containing the number sequence \"1 2 3\" with a small ear icon. 3D claymorphism style, kid-friendly, no text. Square format.",
    "aspect_ratio": "1:1",
    "n": 1,
    "response_format": "url",
    "prompt_optimizer": true
  }' > /tmp/digit_span_icon_response.json
```

预期：响应 `base_resp.status_code` 为 0，`data.image_urls` 数组含 1 个 URL。

- [ ] **Step 2: 下载图片到项目（API 返回 JPEG 时用 sips 转 PNG）**

```bash
URL=$(cat /tmp/digit_span_icon_response.json | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['image_urls'][0])")
curl -s -o src/static/images/digit-span-icon-raw.jpg "$URL"

# 检查是否为 JPEG（API 经验），若是则用 sips 转 PNG
file src/static/images/digit-span-icon-raw.jpg
sips -s format png src/static/images/digit-span-icon-raw.jpg --out src/static/images/digit-span-icon.png
rm src/static/images/digit-span-icon-raw.jpg
ls -lh src/static/images/digit-span-icon.png
file src/static/images/digit-span-icon.png
```

预期：`file` 命令显示 PNG 格式，文件大小约 100-500KB。

- [ ] **Step 3: 验证 key 仍在 .gitignore 中**

```bash
git check-ignore docs/minimax/key
# 应输出：docs/minimax/key
# 如果没被忽略，必须现在加入 .gitignore
grep -q "docs/minimax" .gitignore || echo "docs/minimax/key" >> .gitignore
```

- [ ] **Step 4: 更新首页 appList 引用新图标**

打开 `src/pages/index/index.vue`，将"数字复述"项的 `icon` 改为：

```typescript
        {
            name: '数字复述',
            path: '/pages/game/digit-span',
            icon: '/static/images/digit-span-icon.png',
        },
```

- [ ] **Step 5: 验证首页能加载新图标**

刷新浏览器，检查"数字复述"卡片的图标是否正确显示（粉色背景 + 数字气泡）。

预期：图标显示正常，无 404。

- [ ] **Step 6: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 3: 创建页面骨架 + 数据模型

**Files:**
- Create: `src/pages/game/digit-span.vue`

- [ ] **Step 1: 创建文件并写入骨架**

新建 `src/pages/game/digit-span.vue`，写入：

```vue
<template>
    <view class="ds-page">
        <view class="placeholder">数字复述</view>
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
        return Math.max(...round.value.history.map((a) => a.digitCount));
    });
</script>

<style lang="scss" scoped>
    .ds-page {
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

## Task 4: 实现核心游戏逻辑

**Files:**
- Modify: `src/pages/game/digit-span.vue`（在 `<script setup>` 中添加函数）

- [ ] **Step 1: 添加 generateDigits 工具函数**

在 `maxDigitCount` 计算属性之后添加：

```typescript
    // ===== 工具函数 =====
    const generateDigits = (count: number): number[] => {
        return Array.from(
            { length: count },
            () => Math.floor(Math.random() * 9) + 1, // 1-9 随机，不含 0
        );
    };
```

- [ ] **Step 2: 添加 startRound 函数**

在 `generateDigits` 函数之后添加：

```typescript
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
```

- [ ] **Step 3: 添加 judge 函数**

在 `startRound` 函数之后添加：

```typescript
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
```

- [ ] **Step 4: 添加 nextWithDelta 函数**

在 `judge` 函数之后添加：

```typescript
    const nextWithDelta = (delta: number) => {
        if (round.value.state !== 'playing' || round.value.feedback === null) return;
        // delta = +1 / 0 / -1
        const newCount = Math.max(3, round.value.currentDigitCount + delta);
        round.value.currentDigits = generateDigits(newCount);
        round.value.currentDigitCount = newCount;
        // 重置反馈，让 ✓/✗ 按钮重新出现
        round.value.feedback = null;
    };
```

- [ ] **Step 5: 添加 endRound 函数**

在 `nextWithDelta` 函数之后添加：

```typescript
    const endRound = () => {
        if (round.value.state !== 'playing') return;
        // 没有任何题目直接回到 idle，否则进入 finished 弹成绩单
        if (round.value.history.length === 0) {
            round.value.state = 'idle';
        } else {
            round.value.state = 'finished';
        }
    };
```

- [ ] **Step 6: 添加 resetRound 函数**

在 `endRound` 函数之后添加：

```typescript
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
```

- [ ] **Step 7: 添加 goHome 函数**

在 `resetRound` 函数之后添加：

```typescript
    const goHome = () => {
        uni.reLaunch({ url: '/pages/index/index' });
    };
```

- [ ] **Step 8: 添加 handleHomeClick 函数（带二次确认）**

在 `goHome` 函数之后添加：

```typescript
    const handleHomeClick = () => {
        // 离开未结束本轮时弹二次确认
        if (round.value.state === 'playing' && round.value.history.length > 0) {
            uni.showModal({
                title: '退出确认',
                content: '本轮还有未结束的题目，确定要离开吗？',
                confirmText: '确定离开',
                cancelText: '继续玩',
                success: (res) => {
                    if (res.confirm) {
                        uni.reLaunch({ url: '/pages/index/index' });
                    }
                },
            });
        } else {
            uni.reLaunch({ url: '/pages/index/index' });
        }
    };
```

- [ ] **Step 9: 类型检查**

```bash
npm run type-check
```

预期：无错误。

- [ ] **Step 10: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 5: 实现 3 屏界面模板

**Files:**
- Modify: `src/pages/game/digit-span.vue`（template 部分）

- [ ] **Step 1: 替换 template，添加 3 屏结构**

完整替换 `<template>` 为：

```vue
<template>
    <view class="ds-page">
        <!-- Claymorphism 背景装饰球 -->
        <view class="bg-ball ball-1"></view>
        <view class="bg-ball ball-2"></view>
        <view class="bg-ball ball-3"></view>
        <view class="bg-ball ball-4"></view>

        <!-- 顶栏：返回首页按钮 -->
        <view class="ds-header">
            <view class="ds-home-btn" @click="handleHomeClick">
                <svg viewBox="0 0 24 24" width="36" height="36" fill="none">
                    <path d="M3 12 L12 3 L21 12" stroke="#c25a70" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M5 10 V20 H19 V10" stroke="#c25a70" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
                </svg>
            </view>
        </view>

        <!-- 屏幕 A: 准备屏 (idle) -->
        <view v-if="round.state === 'idle'" class="ds-idle">
            <view class="ds-icon">
                <svg viewBox="0 0 64 64" width="96" height="96" fill="none">
                    <circle cx="32" cy="32" r="28" fill="#ff85a1" stroke="#fff" stroke-width="3" />
                    <circle cx="32" cy="32" r="20" fill="#fff" />
                    <circle cx="32" cy="32" r="12" fill="#ff85a1" />
                    <circle cx="32" cy="32" r="5" fill="#fff" />
                </svg>
            </view>
            <view class="ds-title">数字复述</view>
            <view class="ds-desc">家长念数字，孩子复述</view>
            <view class="btn-start" @click="startRound">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
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
        <view v-else-if="round.state === 'playing'" class="ds-playing">
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
                    {{ d }}<text v-if="i < round.currentDigits.length - 1" class="ds-sep"> · </text>
                </text>
            </view>

            <view class="ds-label">家长听到孩子复述后：</view>

            <!-- 判定阶段：✓ / ✗ 按钮 -->
            <view v-if="round.feedback === null" class="ds-judge-row">
                <view class="btn-correct" @click="judge('correct')">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                        <path d="M5 12 L10 17 L19 7" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    正确
                </view>
                <view class="btn-wrong" @click="judge('wrong')">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none">
                        <path d="M6 6 L18 18 M18 6 L6 18" stroke="#fff" stroke-width="3" stroke-linecap="round" />
                    </svg>
                    失败
                </view>
            </view>

            <!-- 选长度阶段：+1位 / 原位 / -1位 -->
            <view v-else class="ds-length-row">
                <view class="btn-length" @click="nextWithDelta(1)">+1位</view>
                <view class="btn-length" @click="nextWithDelta(0)">原位</view>
                <view class="btn-length" @click="nextWithDelta(-1)">-1位</view>
            </view>

            <view class="btn-end" @click="endRound">结束本轮</view>
        </view>

        <!-- 屏幕 C: 成绩单 (finished) -->
        <view v-if="round.state === 'finished'" class="ds-modal-mask" @click.self="resetRound">
            <view class="ds-modal-card">
                <svg class="ds-medal" viewBox="0 0 64 64" width="96" height="96">
                    <circle cx="32" cy="32" r="22" fill="#FFD700" stroke="#FFA500" stroke-width="2" />
                    <circle cx="32" cy="32" r="16" fill="#FFEC8B" />
                    <text x="32" y="40" text-anchor="middle" font-size="20" font-weight="800" fill="#FF8C00">★</text>
                    <path d="M22 8 L18 0 L26 4 L32 0 L38 4 L46 0 L42 8" fill="#FF6B6B" stroke="#C0392B" stroke-width="1" />
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
                    <view class="btn-modal-primary" @click="startRound">再来一轮</view>
                    <view class="btn-modal-secondary" @click="goHome">回首页</view>
                </view>
            </view>
        </view>
    </view>
</template>
```

- [ ] **Step 2: 类型检查**

```bash
npm run type-check
```

预期：无错误（即使还没有样式，因为 v-if 等会处理）。

- [ ] **Step 3: 提交（跳过）**

> 用户要求不做 commit，此步跳过。

---

## Task 6: Claymorphism 视觉样式

**Files:**
- Modify: `src/pages/game/digit-span.vue`（仅 `<style>` 块）

- [ ] **Step 1: 替换 style 块为完整视觉样式**

完整替换 `<style lang="scss" scoped>` 块为：

```scss
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
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50%      { transform: translateY(-14px) rotate(4deg); }
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
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.6),
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
        0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
        30%  { background: linear-gradient(135deg, #d8ffe0, #a8f0b8); }
        100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
    }
    @keyframes pulseRed {
        0%   { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
        30%  { background: linear-gradient(135deg, #ffe0e0, #ffb8b8); }
        100% { background: linear-gradient(135deg, #fff5f8, #ffe4ec); }
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
    .btn-correct, .btn-wrong {
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
    .btn-correct:active, .btn-wrong:active {
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
            inset -4rpx -4rpx 16rpx rgba(255, 255, 255, 0.6),
            inset 4rpx 4rpx 16rpx rgba(194, 90, 112, 0.15),
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
    .btn-modal-primary, .btn-modal-secondary {
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
    .btn-modal-primary:active, .btn-modal-secondary:active {
        transform: scale(0.95);
    }

    @keyframes maskIn {
        from { opacity: 0; }
        to   { opacity: 1; }
    }
    @keyframes cardIn {
        from { transform: scale(0.5); opacity: 0; }
        to   { transform: scale(1); opacity: 1; }
    }

    // ===== 减少动效 =====
    @media (prefers-reduced-motion: reduce) {
        .ds-modal-card, .ds-modal-mask,
        .ds-digit-card--correct, .ds-digit-card--wrong,
        .bg-ball {
            animation: none;
        }
        .btn-start, .btn-correct, .btn-wrong,
        .btn-length, .btn-end, .btn-modal-primary, .btn-modal-secondary,
        .ds-home-btn {
            transition: none;
        }
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

## Task 7: 端到端验证

**Files:**
- (no code changes)

- [ ] **Step 1: 跑完整类型检查**

```bash
npm run type-check
```

预期：无错误（除预存的 linggu.vue 错误外）。

- [ ] **Step 2: 启动 dev 服务器**

```bash
npm run dev
```

预期：dev server 启动无 "Failed to resolve" 错误（确认 `src/pages/game/digit-span.vue` 是单文件路径，不是子目录）。

- [ ] **Step 3: 浏览器手动测试 3 屏状态**

在浏览器中：

1. 打开首页 → 看到 6 个卡片 3×2 排布
2. 点击"数字复述" → 进入 idle 屏，看到标题、靶心图标、"开始本轮"按钮、玩法说明
3. 点击"开始本轮" → 进入 playing 屏，看到 3 个随机数字（如 `5 · 2 · 8`），"第 1 题 · 最高 0 位"进度条
4. 点"✓ 正确" → 数字卡片有 0.5s 绿色脉冲；按钮切换为 +1位 / 原位 / -1位
5. 点"+1位" → 出新题，4 位数字
6. 再答几题（含正确和失败），验证红色脉冲
7. 验证"-1位"边界：当前 3 位时点 -1位 应仍为 3 位
8. 点"结束本轮" → 进入 finished 屏，看到成绩单弹窗（最高位大字 + 总题数/对/错）
9. 点击弹窗外部或空白处 → 弹窗关闭，回到 idle
10. 再开始一轮后点"回首页" → 回到首页

- [ ] **Step 4: 验证返回确认**

1. 开始一轮后答 1 题
2. 点击左上角 home 按钮 → 弹"退出确认"对话框
3. 选"继续玩" → 留在 playing 屏
4. 再次点 home → 选"确定离开" → 回到首页

- [ ] **Step 5: 检查无 console 错误**

浏览器 devtools console 应该没有红色 error（vconsole 警告除外）。

- [ ] **Step 6: 验证数字范围 1-9**

开始一轮，记录出现的数字。**预期：所有数字都在 1-9 范围内，无 0、无小数、无负数**。

- [ ] **Step 7: lint 检查（如有）**

```bash
npx eslint --fix src/pages/game/digit-span.vue 2>&1 | tail -20
```

预期：prettier 自动修复大部分格式问题。

- [ ] **Step 8: 用 ui-ux-pro-max review 模式做视觉检查**

按 spec 要求,实施完成后调用 `ui-ux-pro-max` 的 **review** 模式（**不**用 plan 模式,会与项目主题冲突）,针对生成的 `src/pages/game/digit-span.vue` 做视觉一致性纠偏:
- 颜色 / 阴影 / 圆角是否与 maze / linggu 一致
- 数字卡片在 3 / 4 / 5 / 6+ 位的字号过渡是否合理
- 主按钮 / 三档按钮 / 结束本轮按钮的视觉权重是否清晰

预期: review 输出建议,subagent 据此做必要的微调（不改结构,只调颜色 / 间距 / 字号）。

- [ ] **Step 9: 提交（跳过）**

> 用户要求不做 commit，此步跳过。`git status` 可用于查看未提交改动。

---

## 验收清单

- [ ] 3 个屏幕（idle / playing / finished）正确切换
- [ ] 进入页面默认 3 位，数字 1-9 随机（无 0）
- [ ] 数字同时显示在卡片上，无动画
- [ ] `+1位` / `原位` / `-1位` 三个按钮 min 3 边界保护
- [ ] ✓/✗ 判定后，数字卡片有 0.5s 绿/红脉冲动画
- [ ] 进度条"第 N 题 · 最高 M 位"实时刷新
- [ ] 离开未结束本轮 → 弹 `uni.showModal` 二次确认
- [ ] 成绩单：最高位大字 + 总题数/对/错 4 个数字均正确
- [ ] 首页 6 卡片 3×2 网格展示
- [ ] Claymorphism 视觉风格统一（与 maze/linggu 保持一致）
- [ ] 不用 emoji 当 UI 图标（用 SVG 替代：靶心、奖章、奖杯、首页按钮、勾叉）
- [ ] `@media (prefers-reduced-motion: reduce)` 包裹所有动画
- [ ] `npm run type-check` 通过
- [ ] Lint 0 errors

## 不在范围（YAGNI）

- 倒序模式、干扰模式、二人比赛
- 历史最佳（`localStorage` 持久化）
- 语音识别/合成（TTS / ASR）
- 横屏适配
- 振动反馈（`uni.vibrateShort`）
- 单元测试（项目无测试体系）
- 多语言、暗色模式
- 计时器（这游戏不需要计时间，由家长控制节奏）
- 单题难度模式（不含加减乘除）
