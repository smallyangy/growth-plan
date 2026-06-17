// 跨 composable / 页面 / tests 共享的类型
export interface Tile {
  id: string;
  image: string;
  label: string;
}

export interface Theme {
  id: 'fruit' | 'animal' | 'transport' | 'plant';
  name: string;
  icon: string;
  tiles: Tile[];
}

export interface Level {
  id: 'easy' | 'medium' | 'hard';
  name: string;
  rows: number;
  cols: number;
  pairCount: number;
}
