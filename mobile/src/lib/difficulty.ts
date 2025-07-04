export function getDifficultyColor(d: number | undefined, defaultColor: string = '#6b7280'): string {
  switch (d) {
    case 1: return '#10b981';
    case 2: return '#f59e0b';
    case 3: return '#f97316';
    case 4: return '#ef4444';
    default: return defaultColor;
  }
}

export function getDifficultyLabel(d: number | undefined): string {
  switch (d) {
    case 1: return 'レベル１';
    case 2: return 'レベル２';
    case 3: return 'レベル３';
    case 4: return 'レベル４';
    default: return '未評価';
  }
}
