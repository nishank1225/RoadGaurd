import { useEffect, useRef, useState } from 'react';
import type { BoundingBox } from '@/lib/types';

export function DetectionCanvas({ imageUrl, boxes }: { imageUrl: string; boxes: BoundingBox[] }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => {
      if (imgRef.current) setSize({ w: imgRef.current.clientWidth, h: imgRef.current.clientHeight });
    };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden">
      <img ref={imgRef} src={imageUrl} onLoad={(e) => setSize({ w: e.currentTarget.clientWidth, h: e.currentTarget.clientHeight })}
        className="w-full h-auto block" alt="detection" />
      <svg className="absolute inset-0 pointer-events-none" width={size.w} height={size.h}>
        {boxes.map((b, i) => {
          const color = b.confidence > 0.8 ? '#ef4444' : b.confidence > 0.6 ? '#f59e0b' : '#3b82f6';
          return (
            <g key={i}>
              <rect x={b.x * size.w} y={b.y * size.h} width={b.width * size.w} height={b.height * size.h}
                fill="none" stroke={color} strokeWidth="2" rx="4" />
              <rect x={b.x * size.w} y={b.y * size.h - 18} width={b.label.length * 7 + 30} height="18" fill={color} rx="3" />
              <text x={b.x * size.w + 5} y={b.y * size.h - 5} fill="white" fontSize="11" fontWeight="600">
                {b.label} {(b.confidence * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
