'use client';

import { useMemo } from 'react';
import { calculateScannability } from '@/lib/qr/validators';
import type { QREditorState } from '@/types/qr';

interface ScannabilityScoreProps {
  state: QREditorState;
}

export function ScannabilityScore({ state }: ScannabilityScoreProps) {
  const result = useMemo(() => calculateScannability(state), [state]);

  const colorClass =
    result.level === 'good'
      ? 'text-green-500'
      : result.level === 'warning'
        ? 'text-yellow-500'
        : 'text-red-500';

  const barColor =
    result.level === 'good'
      ? 'bg-green-500'
      : result.level === 'warning'
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Scannabilité</span>
        <span className={`text-sm font-bold ${colorClass}`}>
          {result.score}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${result.score}%` }}
        />
      </div>
      {result.issues.length > 0 && (
        <ul className="space-y-1">
          {result.issues.map((issue, i) => (
            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
              <span className="mt-0.5">⚠️</span>
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
