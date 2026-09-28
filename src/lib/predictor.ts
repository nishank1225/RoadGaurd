import type { Severity, DamageType, Priority } from './types';
import { getDamageWeight } from './grid-scorer';

const SEVERITY_SCORES: Record<Severity, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 5,
};

const PRIORITY_FROM_SCORE: [number, Priority][] = [
  [4.5, 'urgent'],
  [3.5, 'high'],
  [2.0, 'normal'],
  [0, 'low'],
];

export function computeSeverityScore(
  boxes: { label: DamageType; confidence: number }[],
): number {
  if (boxes.length === 0) return 0;
  let total = 0;
  for (const b of boxes) {
    total += getDamageWeight(b.label) * b.confidence;
  }
  const avg = total / boxes.length;
  const countBonus = Math.min(boxes.length, 5) * 0.2;
  return Math.min(5, Math.round((avg + countBonus) * 10) / 10);
}

export function severityFromScore(score: number): Severity {
  if (score >= 4.0) return 'critical';
  if (score >= 2.8) return 'high';
  if (score >= 1.5) return 'medium';
  return 'low';
}

export function computeDeteriorationRisk(
  severityScore: number,
  damageCount: number,
  maxGridSev: number,
): number {
  const base = severityScore * 0.5;
  const countFactor = Math.min(damageCount, 8) * 0.08;
  const gridFactor = maxGridSev * 0.05;
  return Math.min(1, Math.round((base + countFactor + gridFactor) * 100) / 100);
}

export function computeMaintenancePriority(
  severityScore: number,
  deteriorationRisk: number,
  damageCount: number,
): Priority {
  const composite = severityScore * 0.6 + deteriorationRisk * 2 + Math.min(damageCount, 5) * 0.15;
  for (const [threshold, priority] of PRIORITY_FROM_SCORE) {
    if (composite >= threshold) return priority;
  }
  return 'low';
}

export function healthFromSeverity(sev: Severity, count: number, severityScore: number): number {
  const per: Record<Severity, number> = { low: 8, medium: 18, high: 32, critical: 50 };
  const base = per[sev] * count;
  const scoreAdj = severityScore * 2;
  return Math.max(5, Math.round(100 - base - scoreAdj));
}
