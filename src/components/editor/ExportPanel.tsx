'use client';

import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import type { QREditorState, ExportFormat } from '@/types/qr';
import type QRCodeStyling from 'qr-code-styling';

interface ExportPanelProps {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
  qrInstance: React.MutableRefObject<QRCodeStyling | null>;
}

export function ExportPanel({ state, onUpdate, qrInstance }: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!qrInstance.current) return;
    setExporting(true);

    try {
      const { format, resolution } = state.exportConfig;

      if (format === 'svg') {
        await qrInstance.current.download({ name: state.name, extension: 'svg' });
      } else {
        // Télécharger en PNG/JPEG à la résolution demandée
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

  const formatInfo: Record<ExportFormat, string> = {
    png: 'Idéal pour le web et les réseaux sociaux',
    svg: 'Vectoriel — parfait pour l\'impression',
    jpeg: 'Pour les documents et emails',
    webp: 'Moderne, compressé, pour le web',
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Format d&apos;export</Label>
        <Select
          value={state.exportConfig.format}
          onValueChange={(v) =>
            onUpdate({
              exportConfig: { ...state.exportConfig, format: v as ExportFormat },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="png">PNG</SelectItem>
            <SelectItem value="svg">SVG (vectoriel)</SelectItem>
            <SelectItem value="jpeg">JPEG</SelectItem>
            <SelectItem value="webp">WebP</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {formatInfo[state.exportConfig.format]}
        </p>
      </div>

      {state.exportConfig.format !== 'svg' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Résolution</Label>
            <span className="text-xs font-mono text-muted-foreground">
              {state.exportConfig.resolution}px
            </span>
          </div>
          <Slider
            min={300}
            max={4000}
            step={100}
            value={[state.exportConfig.resolution]}
            onValueChange={([v]) =>
              onUpdate({
                exportConfig: { ...state.exportConfig, resolution: v },
              })
            }
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>300px</span>
            <span>4000px</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleExport}
        disabled={exporting}
        className="w-full"
        size="lg"
      >
        <Download className="mr-2 h-4 w-4" />
        {exporting ? 'Export en cours...' : `Exporter en ${state.exportConfig.format.toUpperCase()}`}
      </Button>
    </div>
  );
}
