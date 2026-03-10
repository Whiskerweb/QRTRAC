'use client';

import { useMemo } from 'react';
import { calculateScannability } from '@/lib/qr/validators';
import type { QREditorState } from '@/types/qr';

interface ScannabilityScoreProps {
  state: QREditorState;
}

export function ScannabilityScore({ state }: ScannabilityScoreProps) {
  const result = useMemo(() => calculateScannability(state), [state]);

  const barColor =
    result.level === 'good'
      ? 'bg-emerald-400'
      : result.level === 'warning'
        ? 'bg-amber-400'
        : 'bg-red-400';

  const textColor =
    result.level === 'good'
      ? 'text-emerald-600'
      : result.level === 'warning'
        ? 'text-amber-600'
        : 'text-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-gray-600">Scannabilité</span>
        <span className={`text-[13px] font-bold tabular-nums ${textColor}`}>
          {result.score}%
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${result.score}%` }}
        />
      </div>
      {result.issues.length > 0 && (
        <div className="space-y-0.5">
          {result.issues.map((issue, i) => (
            <p key={i} className="text-[11px] text-gray-400 leading-relaxed">
              {issue}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
