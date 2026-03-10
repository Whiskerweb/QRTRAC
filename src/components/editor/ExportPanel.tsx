'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Download } from 'lucide-react';
import type { QREditorState, ExportFormat } from '@/types/qr';
import type QRCodeStyling from 'qr-code-styling';

interface ExportPanelProps {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
  qrInstance: React.MutableRefObject<QRCodeStyling | null>;
}

const FORMATS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: 'png', label: 'PNG', desc: 'Web & réseaux sociaux' },
  { value: 'svg', label: 'SVG', desc: 'Impression vectorielle' },
  { value: 'jpeg', label: 'JPEG', desc: 'Documents & emails' },
  { value: 'webp', label: 'WebP', desc: 'Web moderne, compressé' },
];

export function ExportPanel({ state, onUpdate, qrInstance }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!qrInstance.current) return;
    setExporting(true);

    try {
      const { format } = state.exportConfig;
      if (format === 'svg') {
        await qrInstance.current.download({ name: state.name, extension: 'svg' });
      } else {
        const ext = format === 'jpeg' ? 'jpeg' : 'png';
        await qrInstance.current.download({
          name: state.name,
          extension: ext,
        });
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Format selector */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Format</span>
        <div className="grid grid-cols-2 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              onClick={() =>
                onUpdate({ exportConfig: { ...state.exportConfig, format: f.value } })
              }
              className={`p-3 rounded-xl border text-left transition-all ${
                state.exportConfig.format === f.value
                  ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
              }`}
            >
              <p className={`text-[13px] font-semibold ${
                state.exportConfig.format === f.value ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {f.label}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Resolution */}
      {state.exportConfig.format !== 'svg' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-gray-500">Résolution</span>
            <span className="text-[11px] font-mono text-gray-400">
              {state.exportConfig.resolution}px
            </span>
          </div>
          <Slider
            min={300}
            max={4000}
            step={100}
            value={[state.exportConfig.resolution]}
            onValueChange={([v]) =>
              onUpdate({ exportConfig: { ...state.exportConfig, resolution: v } })
            }
          />
          <div className="flex justify-between text-[11px] text-gray-300">
            <span>300px</span>
            <span>4000px</span>
          </div>
        </div>
      )}

      {/* Download button */}
      <button
        onClick={handleExport}
        disabled={exporting}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-[13px] font-medium rounded-xl transition-all shadow-sm"
      >
        <Download className="w-4 h-4" />
        {exporting
          ? 'Export en cours...'
          : `Télécharger en ${state.exportConfig.format.toUpperCase()}`}
      </button>
    </div>
  );
}
