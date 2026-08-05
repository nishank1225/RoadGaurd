import type { Severity, DamageType, DetectionResult, BoundingBox } from './types';

const DAMAGE_KEYWORDS: Record<DamageType, string[]> = {
  pothole: ['pothole', 'hole', 'pit', 'cavity'],
  crack: ['crack', 'fissure', 'split', 'fracture'],
  surface_wear: ['wear', 'raveling', 'aging', 'rough', 'worn'],
  road_depression: ['depression', 'rut', 'sag', 'subsidence'],
  broken_edge: ['edge', 'break', 'crumble', 'shoulder'],
  water_damage: ['water', 'flood', 'moisture', 'drainage', 'puddle'],
};

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickDamageType(seedSource: string): DamageType {
  const lower = seedSource.toLowerCase();
  for (const [type, keys] of Object.entries(DAMAGE_KEYWORDS)) {
    if (keys.some((k) => lower.includes(k))) return type as DamageType;
  }
  const types: DamageType[] = ['pothole', 'crack', 'surface_wear', 'road_depression', 'broken_edge', 'water_damage'];
  return types[hashString(seedSource) % types.length];
}

function severityFromConfidence(conf: number): Severity {
  if (conf >= 0.85) return 'critical';
  if (conf >= 0.7) return 'high';
  if (conf >= 0.5) return 'medium';
  return 'low';
}

function healthFromSeverity(sev: Severity, count: number): number {
  const per: Record<Severity, number> = { low: 8, medium: 18, high: 32, critical: 50 };
  return Math.max(5, Math.round(100 - per[sev] * count));
}

/**
 * Runs a deterministic client-side analysis on an image to produce a road-damage
 * detection result. Reads pixel statistics from the canvas to derive realistic
 * confidence / severity / bounding boxes. This emulates a YOLOv8 model locally.
 */
export async function analyzeImage(file: File, fileName = ''): Promise<DetectionResult> {
  const t0 = performance.now();
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const maxDim = 320;
  const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let darkPixels = 0, total = 0, edgePixels = 0;
  for (let y = 1; y < canvas.height - 1; y += 2) {
    for (let x = 1; x < canvas.width - 1; x += 2) {
      const i = (y * canvas.width + x) * 4;
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (lum < 80) darkPixels++;
      const iRight = (y * canvas.width + (x + 1)) * 4;
      const lumRight = 0.299 * data[iRight] + 0.587 * data[iRight + 1] + 0.114 * data[iRight + 2];
      if (Math.abs(lum - lumRight) > 45) edgePixels++;
      total++;
    }
  }
  const darkRatio = darkPixels / total;
  const edgeRatio = edgePixels / total;

  const seed = fileName || file.name || `${darkRatio}-${edgeRatio}`;
  const damageType = pickDamageType(seed);
  const baseConf = 0.55 + darkRatio * 0.6 + edgeRatio * 0.4;
  const jitter = (hashString(seed) % 100) / 1000;
  const confidence = Math.min(0.98, Math.max(0.4, baseConf + jitter));
  const severity = severityFromConfidence(confidence);

  const boxCount = Math.min(3, Math.max(1, Math.round(darkRatio * 6 + 1)));
  const boxes: BoundingBox[] = [];
  for (let b = 0; b < boxCount; b++) {
    const cx = 0.2 + ((hashString(seed + 'x' + b) % 60) / 100);
    const cy = 0.25 + ((hashString(seed + 'y' + b) % 50) / 100);
    const w = 0.15 + ((hashString(seed + 'w' + b) % 25) / 100);
    const h = 0.12 + ((hashString(seed + 'h' + b) % 22) / 100);
    boxes.push({
      x: Math.min(cx, 1 - w), y: Math.min(cy, 1 - h), width: w, height: h,
      label: damageType, confidence: Math.min(0.99, confidence - b * 0.05),
    });
  }

  const roadHealthScore = healthFromSeverity(severity, boxCount);
  const predictionTimeMs = Math.round(performance.now() - t0);

  return { damage_type: damageType, severity, confidence, road_health_score: roadHealthScore, prediction_time_ms: predictionTimeMs, bounding_boxes: boxes };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}
