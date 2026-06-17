// 3 档关卡：rows*cols 均为偶数
export interface Level {
  id: 'easy' | 'medium' | 'hard';
  name: string;
  rows: number;
  cols: number;
  pairCount: number;
}

export const LEVELS: Level[] = [
  { id: 'easy', name: '入门 4×4', rows: 4, cols: 4, pairCount: 8 },
  { id: 'medium', name: '进阶 6×6', rows: 6, cols: 6, pairCount: 18 },
  { id: 'hard', name: '挑战 8×8', rows: 8, cols: 8, pairCount: 32 },
];
