export interface DmcColor {
  name: string;
  dmc: string;
  hex: string;
}

// FIX: Add the missing `SavedPattern` interface to resolve an import error.
export interface SavedPattern {
  id: string;
  createdAt: number;
  previewDataUrl: string;
  originalImageDataUrl: string;
  gridSize: number;
  threshold: number;
  fillShape: 'circle' | 'square';
  outlineOffset: number;
  selectedColor: DmcColor;
}
