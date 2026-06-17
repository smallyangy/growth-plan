import type { Level } from '../data/lianliankanLevels';
import type { Theme } from '../data/useLianliankanTypes';

export interface Cell {
  row: number;
  col: number;
  tileId: string | null;
}

export interface Board {
  rows: number;
  cols: number;
  cells: Cell[];
}

export interface Path {
  from: Cell;
  to: Cell;
  turns: Array<{ row: number; col: number }>;
}

/* ===== 棋盘生成 ===== */

function pickRandom<T>(arr: T[], n: number): T[] {
  const a = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
    out.push(a[i]);
  }
  return out;
}

export function generateBoard(level: Level, theme: Theme): Board {
  const { rows, cols, pairCount } = level;
  if (theme.tiles.length < pairCount) {
    throw new Error(`theme.tiles has ${theme.tiles.length} < pairCount ${pairCount}`);
  }
  const sampled = pickRandom(theme.tiles, pairCount);
  const ids: string[] = [];
  for (const t of sampled) ids.push(t.id, t.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  const cells: Cell[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({ row: r, col: c, tileId: ids[r * cols + c] });
    }
  }
  return { rows, cols, cells };
}

/* ===== 2 拐角路径 ===== */

function inBoard(b: Board, r: number, c: number) {
  return r >= 0 && r < b.rows && c >= 0 && c < b.cols;
}

function isEmpty(b: Board, r: number, c: number): boolean {
  if (!inBoard(b, r, c)) return true; // 虚拟边界
  return b.cells[r * b.cols + c].tileId === null;
}

function clearH(b: Board, row: number, c1: number, c2: number): boolean {
  const lo = Math.min(c1, c2);
  const hi = Math.max(c1, c2);
  for (let c = lo + 1; c < hi; c++) {
    if (!isEmpty(b, row, c)) return false;
  }
  return true;
}

function clearV(b: Board, col: number, r1: number, r2: number): boolean {
  const lo = Math.min(r1, r2);
  const hi = Math.max(r1, r2);
  for (let r = lo + 1; r < hi; r++) {
    if (!isEmpty(b, r, col)) return false;
  }
  return true;
}

export function findPath(a: Cell, b: Cell, board: Board): Path | null {
  if (a.row === b.row && a.col === b.col) return null;
  if (a.tileId === null || b.tileId === null) return null;
  if (a.tileId !== b.tileId) return null;

  // 0 拐角：同行
  if (a.row === b.row && clearH(board, a.row, a.col, b.col)) {
    return { from: a, to: b, turns: [{ row: a.row, col: a.col }, { row: b.row, col: b.col }] };
  }
  // 0 拐角：同列
  if (a.col === b.col && clearV(board, a.col, a.row, b.row)) {
    return { from: a, to: b, turns: [{ row: a.row, col: a.col }, { row: b.row, col: b.col }] };
  }

  // 1 拐角：两个候选 pivot
  const pivots: Array<{ row: number; col: number }> = [
    { row: a.row, col: b.col },
    { row: b.row, col: a.col },
  ];
  for (const p of pivots) {
    if (!isEmpty(board, p.row, p.col)) continue;
    if (
      (p.row === a.row ? clearH(board, a.row, a.col, p.col) : clearV(board, a.col, a.row, p.row)) &&
      (p.row === b.row ? clearH(board, b.row, b.col, p.col) : clearV(board, b.col, b.row, p.row))
    ) {
      return { from: a, to: b, turns: [{ row: a.row, col: a.col }, p, { row: b.row, col: b.col }] };
    }
  }

  // 2 拐角：扫虚拟列 X ∈ [-1, cols]
  for (let X = -1; X <= board.cols; X++) {
    if (
      isEmpty(board, a.row, X) &&
      isEmpty(board, b.row, X) &&
      clearH(board, a.row, a.col, X) &&
      clearV(board, X, a.row, b.row) &&
      clearH(board, b.row, b.col, X)
    ) {
      return {
        from: a,
        to: b,
        turns: [
          { row: a.row, col: a.col },
          { row: a.row, col: X },
          { row: b.row, col: X },
          { row: b.row, col: b.col },
        ],
      };
    }
  }
  // 2 拐角：扫虚拟行 Y ∈ [-1, rows]
  for (let Y = -1; Y <= board.rows; Y++) {
    if (
      isEmpty(board, Y, a.col) &&
      isEmpty(board, Y, b.col) &&
      clearV(board, a.col, a.row, Y) &&
      clearH(board, Y, a.col, b.col) &&
      clearV(board, b.col, b.row, Y)
    ) {
      return {
        from: a,
        to: b,
        turns: [
          { row: a.row, col: a.col },
          { row: Y, col: a.col },
          { row: Y, col: b.col },
          { row: b.row, col: b.col },
        ],
      };
    }
  }

  return null;
}

/* ===== 完整游戏状态机（页面用） ===== */

import { ref, computed, type Ref } from 'vue';

export interface GameState {
  board: Ref<Board>;
  selected: Ref<Cell | null>;
  eliminatedCount: Ref<number>;
  isGameOver: Ref<boolean>;
  shaking: Ref<{ row: number; col: number } | null>;
  lastPath: Ref<Path | null>;
  selectCell: (r: number, c: number) => void;
  reset: (level: Level, theme: Theme) => void;
  /** 智能重排：仅打乱剩余 tile 的位置，已消除的格子保留为空（不重置计时/进度） */
  shuffleRemaining: () => void;
}

export function useLianliankanGame(): GameState {
  const board = ref<Board>({ rows: 0, cols: 0, cells: [] });
  const selected = ref<Cell | null>(null);
  const eliminatedCount = ref(0);
  const isGameOver = ref(false);
  const shaking = ref<{ row: number; col: number } | null>(null);
  const lastPath = ref<Path | null>(null);

  function reset(level: Level, theme: Theme) {
    board.value = generateBoard(level, theme);
    selected.value = null;
    eliminatedCount.value = 0;
    isGameOver.value = false;
    shaking.value = null;
    lastPath.value = null;
  }

  function shuffleRemaining() {
    // 收集所有非空 cell 及其 tileId
    const remaining = board.value.cells.filter(c => c.tileId !== null);
    const ids = remaining.map(c => c.tileId as string);
    // Fisher-Yates 洗牌
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    // 填回原 cell（null cell 保持不变）
    for (let i = 0; i < remaining.length; i++) {
      remaining[i].tileId = ids[i];
    }
    // 重置交互态（保留 eliminatedCount / isGameOver / 计时）
    selected.value = null;
    lastPath.value = null;
    shaking.value = null;
  }

  function selectCell(r: number, c: number) {
    const target = board.value.cells[r * board.value.cols + c];
    if (target.tileId === null) return;

    if (selected.value && selected.value.row === r && selected.value.col === c) {
      selected.value = null;
      return;
    }

    if (!selected.value) {
      selected.value = target;
      return;
    }

    const path = findPath(selected.value, target, board.value);
    if (!path) {
      shaking.value = { row: r, col: c };
      setTimeout(() => (shaking.value = null), 220);
      selected.value = null;
      return;
    }

    lastPath.value = path;
    const first = selected.value;
    setTimeout(() => {
      first.tileId = null;
      target.tileId = null;
      eliminatedCount.value++;
      const totalPairs = board.value.cells.length / 2;
      if (eliminatedCount.value >= totalPairs) isGameOver.value = true;
      selected.value = null;
      lastPath.value = null;
    }, 220);
  }

  return { board, selected, eliminatedCount, isGameOver, shaking, lastPath, selectCell, reset, shuffleRemaining };
}
