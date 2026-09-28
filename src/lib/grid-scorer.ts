import type { BoundingBox, GridCell, DamageType } from './types';

const GRID_SIZE = 3;

const DAMAGE_WEIGHTS: Record<DamageType, number> = {
  pothole: 5,
  crack: 3,
  surface_wear: 2,
  road_depression: 4,
  broken_edge: 4,
  water_damage: 3,
};

export function getDamageWeight(type: DamageType): number {
  return DAMAGE_WEIGHTS[type] ?? 2;
}

export function computeGridMap(boxes: BoundingBox[]): GridCell[] {
  const grid: GridCell[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      grid.push({ row, col, severity: 0, damage_count: 0 });
    }
  }

  for (const box of boxes) {
    const centerCol = Math.min(GRID_SIZE - 1, Math.floor((box.x + box.width / 2) * GRID_SIZE));
    const centerRow = Math.min(GRID_SIZE - 1, Math.floor((box.y + box.height / 2) * GRID_SIZE));
    const idx = centerRow * GRID_SIZE + centerCol;
    const weight = getDamageWeight(box.label);
    grid[idx].severity += weight * box.confidence;
    grid[idx].damage_count += 1;
  }

  for (const cell of grid) {
    cell.severity = Math.round(cell.severity * 10) / 10;
  }

  return grid;
}

export function maxGridSeverity(grid: GridCell[]): number {
  return grid.reduce((max, c) => Math.max(max, c.severity), 0);
}
