<template>
  <view class="page">
    <view class="header">
      <view class="back" @click="onBack">←</view>
      <text class="title">连连看</text>
    </view>

    <view v-if="phase === 'setup'" class="setup">
      <text class="section-title">选关卡</text>
      <view class="cards-row">
        <view
          v-for="lv in levels"
          :key="lv.id"
          class="card"
          :class="{ active: selectedLevel?.id === lv.id }"
          @click="selectedLevel = lv"
        >
          <text class="card-title">{{ lv.name }}</text>
        </view>
      </view>

      <text class="section-title">选主题</text>
      <view class="cards-row">
        <view
          v-for="th in themes"
          :key="th.id"
          class="card"
          :class="{ active: selectedTheme?.id === th.id }"
          @click="selectedTheme = th"
        >
          <text class="card-icon">{{ th.icon }}</text>
          <text class="card-title">{{ th.name }}</text>
        </view>
      </view>

      <view class="start-btn">
        <van-button
          type="primary"
          block
          round
          :disabled="!selectedLevel || !selectedTheme"
          @click="startGame"
        >
          开始游戏
        </van-button>
      </view>
    </view>

    <view v-else-if="phase === 'playing'" class="playing">
      <view class="play-header">
        <text class="play-title">{{ selectedLevel?.name }} · {{ selectedTheme?.name }}</text>
        <view class="reshuffle" @click="onShuffle">再洗一次</view>
      </view>

      <view class="board-wrap">
        <view
          class="board"
          :style="{ gridTemplateColumns: `repeat(${selectedLevel?.cols}, 1fr)` }"
        >
          <template v-for="cell in game.board.value.cells" :key="cell.row + '-' + cell.col">
            <view
              class="tile"
              :class="{
                selected: game.selected.value?.row === cell.row && game.selected.value?.col === cell.col,
                shaking: game.shaking.value?.row === cell.row && game.shaking.value?.col === cell.col,
                eliminated: cell.tileId === null,
              }"
              @click="onTileClick(cell.row, cell.col)"
            >
              <image
                v-if="cell.tileId !== null"
                class="tile-img"
                :src="imageFor(cell.tileId)"
                mode="aspectFit"
              />
            </view>
          </template>

          <!--
            viewBox 是 cols*100 × rows*100，1 cell = 100 单位。
            视觉上 ~3px 的 gap 偏移（CSS grid gap 8rpx 让 cell 中心 ≠ (col+0.5)*100/W）
            在 6 岁视角可忽略，不修。
            2 拐角走虚拟边界（col=-1 / col=cols）时，pathPoints 把虚拟坐标
            钳到棋盘边缘（x=0 / x=cols*100），line 不出 viewBox。
          -->
          <svg class="path-svg" :viewBox="`0 0 ${(selectedLevel?.cols ?? 0) * 100} ${(selectedLevel?.rows ?? 0) * 100}`" preserveAspectRatio="none">
            <polyline
              v-if="game.lastPath.value"
              :points="pathPoints"
              class="path-line"
            />
          </svg>
        </view>
      </view>

      <view class="counter">
        <text>已消除 {{ game.eliminatedCount.value }} / {{ selectedLevel?.pairCount }} 对</text>
      </view>
    </view>

    <view v-else class="done">
      <view class="done-card">
        <text class="done-emoji">🎉</text>
        <text class="done-title">太棒了！</text>
        <text class="done-sub">{{ selectedLevel?.name }} · {{ selectedTheme?.name }}</text>
        <text class="done-time">用时 {{ formatSeconds(elapsedSeconds) }}</text>
        <view class="done-actions">
          <van-button type="primary" block round @click="playAgain">再玩一次</van-button>
          <van-button block round @click="changeTheme">换主题</van-button>
          <van-button block round @click="goHome">回首页</van-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { LEVELS, type Level } from '@/data/lianliankanLevels';
import { THEMES, type Theme } from '@/data/lianliankanThemes';
import { useLianliankanGame } from '@/composables/useLianliankanGame';

const levels = LEVELS;
const themes = THEMES;
const selectedLevel = ref<Level | null>(null);
const selectedTheme = ref<Theme | null>(null);
const phase = ref<'setup' | 'playing' | 'done'>('setup');
const game = useLianliankanGame();
const startedAt = ref<number>(0);
const elapsedSeconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function startTimer() {
  stopTimer();
  timer = setInterval(() => {
    elapsedSeconds.value = Math.floor((Date.now() - startedAt.value) / 1000);
  }, 1000);
}
function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}
onUnmounted(stopTimer);

function startGame() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  game.reset(selectedLevel.value, selectedTheme.value);
  startedAt.value = Date.now();
  elapsedSeconds.value = 0;
  phase.value = 'playing';
  startTimer();
}

function onShuffle() {
  // 智能重排：只打乱剩余 tile 的位置，已消除的格子保留为空
  // 不重置 elapsedSeconds / 计时器，done 态的"用时"如实反映总耗时
  game.shuffleRemaining();
}

function onTileClick(r: number, c: number) {
  game.selectCell(r, c);
  // isGameOver 在 composable 内部 setTimeout(220ms) 后才为 true；这里再排 250ms
  // 等待路径动画与消除动画结束再切到 done 态
  setTimeout(() => {
    if (game.isGameOver.value) {
      stopTimer();
      saveBest();
      phase.value = 'done';
    }
  }, 250);
}

function imageFor(tileId: string): string {
  const t = themes.find(th => th.tiles.some(x => x.id === tileId));
  return t?.tiles.find(x => x.id === tileId)?.image ?? '';
}

const pathPoints = computed(() => {
  if (!game.lastPath.value || !selectedLevel.value) return '';
  const cols = selectedLevel.value.cols;
  const rows = selectedLevel.value.rows;
  return game.lastPath.value.turns
    .map(p => {
      // 钳虚拟边界到棋盘边缘：col=-1 → x=0, col=cols → x=cols*100, row 同理
      // 这样 line 永远不出 viewBox，绕边的视觉仍清晰（"绕到棋盘边"）
      let x: number;
      if (p.col === -1) x = 0;
      else if (p.col === cols) x = cols * 100;
      else x = (p.col + 0.5) * 100;
      let y: number;
      if (p.row === -1) y = 0;
      else if (p.row === rows) y = rows * 100;
      else y = (p.row + 0.5) * 100;
      return `${x},${y}`;
    })
    .join(' ');
});

function saveBest() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  const seconds = Math.floor((Date.now() - startedAt.value) / 1000);
  const key = `${selectedLevel.value.id}_${selectedTheme.value.id}`;
  try {
    const prev = uni.getStorageSync('lianliankan-best') as Record<string, number> | null;
    const cur = prev ?? {};
    if (!cur[key] || seconds < cur[key]) {
      cur[key] = seconds;
      uni.setStorageSync('lianliankan-best', cur);
    }
  } catch {}
}

function onBack() {
  // setup / done 态直接退出；playing 态弹确认
  if (phase.value === 'playing') {
    uni.showModal({
      title: '放弃本局？',
      success: (r) => {
        if (r.confirm) phase.value = 'setup';
      },
    });
  } else {
    uni.navigateBack();
  }
}

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m} 分 ${sec} 秒`;
}

function playAgain() {
  if (!selectedLevel.value || !selectedTheme.value) return;
  game.reset(selectedLevel.value, selectedTheme.value);
  startedAt.value = Date.now();
  elapsedSeconds.value = 0;
  startTimer();
  phase.value = 'playing';
}
function changeTheme() {
  phase.value = 'setup';
  selectedLevel.value = null;
  selectedTheme.value = null;
}
function goHome() {
  uni.navigateBack();
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx;
}
.header {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  .back {
    font-size: 48rpx;
    width: 64rpx;
  }
  .title {
    font-size: 40rpx;
    font-weight: 600;
    margin-left: 16rpx;
  }
}
.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin: 32rpx 0 16rpx;
}
.cards-row {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
}
.card {
  flex: 1 1 30%;
  min-width: 200rpx;
  padding: 32rpx 16rpx;
  background: #fff;
  border: 4rpx solid transparent;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
  text-align: center;
  transition: all 150ms;
  &.active {
    border-color: #4f8cff;
    transform: scale(1.04);
  }
  .card-icon {
    font-size: 56rpx;
    display: block;
  }
  .card-title {
    font-size: 28rpx;
    color: #333;
    display: block;
    margin-top: 8rpx;
  }
}
.start-btn {
  margin-top: 64rpx;
}
.playing {
  margin-top: 24rpx;
}
.play-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  .play-title {
    font-size: 32rpx;
    font-weight: 600;
  }
  .reshuffle {
    font-size: 28rpx;
    color: #4f8cff;
    padding: 8rpx 16rpx;
  }
}
.board-wrap {
  position: relative;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}
.board {
  position: relative;
  display: grid;
  gap: 8rpx;
  width: 100%;
}
.tile {
  aspect-ratio: 1;
  background: #fafbfc;
  border: 4rpx solid transparent;
  border-radius: 12rpx;
  transition: all 150ms;
  display: flex;
  align-items: center;
  justify-content: center;
  &.selected {
    border-color: #4f8cff;
    transform: scale(1.08);
  }
  &.shaking {
    animation: shake 220ms;
  }
  &.eliminated {
    background: transparent;
    pointer-events: none;
  }
  .tile-img {
    width: 80%;
    height: 80%;
  }
}
.path-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  .path-line {
    fill: none;
    stroke: #4f8cff;
    stroke-width: 6;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: draw 220ms ease-out;
  }
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6rpx); }
  75% { transform: translateX(6rpx); }
}
@keyframes draw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}
.counter {
  margin-top: 24rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
}
.done {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.done-card {
  width: 80%;
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  .done-emoji {
    font-size: 120rpx;
    display: block;
  }
  .done-title {
    font-size: 48rpx;
    font-weight: 700;
    display: block;
    margin-top: 16rpx;
  }
  .done-sub {
    font-size: 28rpx;
    color: #666;
    display: block;
    margin-top: 16rpx;
  }
  .done-time {
    font-size: 32rpx;
    color: #333;
    display: block;
    margin: 24rpx 0 32rpx;
  }
  .done-actions {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
  }
}
</style>
