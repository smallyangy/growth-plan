import { describe, it, expect } from 'vitest';
import { generateBoard, findPath, useLianliankanGame, type Cell, type Board } from '../useLianliankanGame';
import type { Theme } from '../../data/useLianliankanTypes';
import type { Level } from '../../data/lianliankanLevels';
import { LEVELS } from '../../data/lianliankanLevels';

const EASY = LEVELS.find(l => l.id === 'easy')!;
const MEDIUM = LEVELS.find(l => l.id === 'medium')!;

function mkTheme(): Theme {
  return {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    tiles: Array.from({ length: 32 }, (_, i) => ({
      id: `fruit-${i}`,
      image: `/static/lianliankan/fruit/${i}.png`,
      label: `t${i}`,
    })),
  };
}

function mkBoard(rows: number, cols: number, tileIds: (string | null)[]): Board {
  return {
    rows,
    cols,
    cells: tileIds.map((tid, i) => ({
      row: Math.floor(i / cols),
      col: i % cols,
      tileId: tid,
    })),
  };
}

function cellAt(b: Board, r: number, c: number): Cell {
  return b.cells[r * b.cols + c];
}

describe('generateBoard', () => {
  it('4x4 棋盘返回 16 个 cell', () => {
    const b = generateBoard(EASY, mkTheme());
    expect(b.cells.length).toBe(16);
    expect(b.rows).toBe(4);
    expect(b.cols).toBe(4);
  });

  it('6x6 棋盘返回 36 个 cell', () => {
    const b = generateBoard(MEDIUM, mkTheme());
    expect(b.cells.length).toBe(36);
  });

  it('pairCount 张不同 tileId，每张恰好出现 2 次', () => {
    const b = generateBoard(MEDIUM, mkTheme());
    const counts = new Map<string, number>();
    for (const c of b.cells) {
      if (c.tileId) counts.set(c.tileId, (counts.get(c.tileId) ?? 0) + 1);
    }
    expect(counts.size).toBe(MEDIUM.pairCount);
    for (const v of counts.values()) expect(v).toBe(2);
  });

  it('所有 tileId 都在传入 theme.tiles 内', () => {
    const theme = mkTheme();
    const ids = new Set(theme.tiles.map(t => t.id));
    const b = generateBoard(MEDIUM, theme);
    for (const c of b.cells) expect(ids.has(c.tileId!)).toBe(true);
  });
});

describe('findPath - 0 拐角', () => {
  it('同行两牌中间无阻挡 → 0 拐角 path', () => {
    const b = mkBoard(2, 4, ['A', null, null, 'A', null, null, null, null]);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(2);
  });

  it('同行两牌中间有阻挡 → 借助棋盘外虚拟行 2 拐角 path', () => {
    // 1x4 棋盘，A 在 (0,0) 和 (0,3)，中间 B 阻挡
    // 0 拐角被阻，1 拐角两 pivot 都在端点 → 2 拐角绕虚拟行 Y=-1
    const b = mkBoard(1, 4, ['A', 'B', null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(4);
  });

  it('同列两牌中间无阻挡 → 0 拐角 path', () => {
    const b = mkBoard(4, 2, ['A', null, null, null, 'A', null, null, null]);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 0), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(2);
  });
});

describe('findPath - 1 拐角', () => {
  it('通过 pivot (A.row, B.col) 拐 1 次 → 1 拐角 path', () => {
    // 3x3：A(0,0) 和 A(2,2)，pivot (0,2) 通畅：(0,1) 空 + (1,2) 空
    // 同时 pivot (2,0) 被阻：(1,0)='X'
    const b = mkBoard(3, 3, [
      'A',  null, null,
      'X',  'X',  null,
      null, null, 'A',
    ]);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 2), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(3);
    const pivot = p!.turns[1];
    const ok = (pivot.row === 0 && pivot.col === 2) || (pivot.row === 2 && pivot.col === 0);
    expect(ok).toBe(true);
  });

  it('pivot 上有阻挡 → null', () => {
    const b = mkBoard(3, 3, ['A', 'X', 'Y', 'X', 'X', 'X', 'Y', 'X', 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 2, 2), b);
    expect(p).toBeNull();
  });
});

describe('findPath - 2 拐角（棋盘外虚拟边界）', () => {
  it('借助棋盘外虚拟列消 2 拐角 → 2 拐角 path', () => {
    // 4x4 棋盘，(0,0) 和 (0,2) 同行中间 X 阻，1 拐角两 pivot 也被占
    // 2 拐角绕 X=-1：(0,0) → (-1,0) → (-1,2) → (0,2)
    const b = mkBoard(4, 4, [
      'A', 'X', 'A', 'X',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
      'X', 'X', 'X', 'X',
    ]);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 2), b);
    expect(p).not.toBeNull();
    expect(p!.turns.length).toBe(4);
  });
});

describe('findPath - 非法输入', () => {
  it('tileId 不同 → null', () => {
    const b = mkBoard(1, 4, ['A', null, null, 'B']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).toBeNull();
  });

  it('任一格 tileId == null → null', () => {
    const b = mkBoard(1, 4, [null, null, null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 3), b);
    expect(p).toBeNull();
  });

  it('起点终点相同 → null', () => {
    const b = mkBoard(1, 4, ['A', null, null, 'A']);
    const p = findPath(cellAt(b, 0, 0), cellAt(b, 0, 0), b);
    expect(p).toBeNull();
  });
});

describe('useLianliankanGame.shuffleRemaining', () => {
  it('已消除的格子保持 null', () => {
    const g = useLianliankanGame();
    g.reset(EASY, mkTheme());
    // 手动把 (0,0) 和 (0,1) 标为已消除
    g.board.value.cells[0].tileId = null;
    g.board.value.cells[1].tileId = null;
    const beforeNullPositions = [0, 1];

    g.shuffleRemaining();

    for (const i of beforeNullPositions) {
      expect(g.board.value.cells[i].tileId).toBeNull();
    }
  });

  it('总 tile 数和种类数不变', () => {
    const g = useLianliankanGame();
    g.reset(EASY, mkTheme());
    // 消除一对（2 个 cell）
    g.board.value.cells[0].tileId = null;
    g.board.value.cells[1].tileId = null;
    const beforeRemaining = g.board.value.cells.filter(c => c.tileId !== null).length;
    const beforeIds = g.board.value.cells
      .filter(c => c.tileId !== null)
      .map(c => c.tileId)
      .sort();

    g.shuffleRemaining();

    const afterRemaining = g.board.value.cells.filter(c => c.tileId !== null).length;
    const afterIds = g.board.value.cells
      .filter(c => c.tileId !== null)
      .map(c => c.tileId)
      .sort();

    expect(afterRemaining).toBe(beforeRemaining);
    expect(afterIds).toEqual(beforeIds);
  });

  it('重排后清空 selected / lastPath / shaking 交互态', () => {
    const g = useLianliankanGame();
    g.reset(EASY, mkTheme());
    g.selected.value = g.board.value.cells[0];
    g.lastPath.value = { from: g.board.value.cells[0], to: g.board.value.cells[1], turns: [] };
    g.shaking.value = { row: 0, col: 0 };

    g.shuffleRemaining();

    expect(g.selected.value).toBeNull();
    expect(g.lastPath.value).toBeNull();
    expect(g.shaking.value).toBeNull();
  });

  it('全空棋盘调用不出错（边界）', () => {
    const g = useLianliankanGame();
    g.reset(EASY, mkTheme());
    // 把所有 cell 标 null
    for (const c of g.board.value.cells) c.tileId = null;
    expect(() => g.shuffleRemaining()).not.toThrow();
    expect(g.board.value.cells.every(c => c.tileId === null)).toBe(true);
  });
});
