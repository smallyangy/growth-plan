export type ThemeId = 'fruit' | 'animal' | 'transport' | 'plant';

export interface ItemSpec {
  id: string;
  label: string;
  prompt: string;
}

export interface ThemeSpec {
  id: ThemeId;
  name: string;
  icon: string;
  items: ItemSpec[];
}

export interface ThemeSpecsFile {
  themes: ThemeSpec[];
}
