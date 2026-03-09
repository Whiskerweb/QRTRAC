'use client';

import { useRef, useCallback } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import type { QREditorState } from '@/types/qr';

interface LogoPanelProps {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
}

const MAX_LOGO_SIZE = 500 * 1024; // 500 KB

async function resizeImage(file: File, maxSizeBytes: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      // Réduire si trop grand
      const maxDim = 400;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      let quality = 0.9;
      let dataUrl = canvas.toDataURL('image/png');

      // Réduire la qualité si trop lourd
      while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.src = url;
  });
}

export function LogoPanel({ state, onUpdate }: LogoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const dataUrl = await resizeImage(file, MAX_LOGO_SIZE);
      onUpdate({
        logo: { ...state.logo, file, url: dataUrl },
        // Augmenter la correction d'erreur si logo assez grand
        errorCorrectionLevel:
          state.logo.size > 0.2 ? 'H' : state.errorCorrectionLevel,
      });
    },
    [state.logo, state.errorCorrectionLevel, onUpdate]
  );

  const removeLogo = () => {
    onUpdate({ logo: { ...state.logo, file: null, url: null } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Upload zone */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Image du logo</Label>
        {state.logo.url ? (
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <img
              src={state.logo.url}
              alt="Logo"
              className="w-12 h-12 object-contain rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {state.logo.file?.name || 'Logo chargé'}
              </p>
              <p className="text-xs text-muted-foreground">
                {state.logo.file
                  ? `${(state.logo.file.size / 1024).toFixed(0)} KB`
                  : ''}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeLogo}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
          >
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Cliquez pour uploader un logo
            </span>
            <span className="text-xs text-muted-foreground">PNG, JPG, SVG</span>
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {state.logo.url && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Taille du logo</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {Math.round(state.logo.size * 100)}%
              </span>
            </div>
            <Slider
              min={10}
              max={40}
              step={1}
              value={[Math.round(state.logo.size * 100)]}
              onValueChange={([v]) =>
                onUpdate({ logo: { ...state.logo, size: v / 100 } })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Marge</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {state.logo.margin}px
              </span>
            </div>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[state.logo.margin]}
              onValueChange={([v]) =>
                onUpdate({ logo: { ...state.logo, margin: v } })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Forme du cadre</Label>
            <Select
              value={state.logo.shape}
              onValueChange={(v) =>
                onUpdate({
                  logo: { ...state.logo, shape: v as 'square' | 'circle' | 'rounded' },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Carré</SelectItem>
                <SelectItem value="circle">Cercle</SelectItem>
                <SelectItem value="rounded">Arrondi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              Avec un logo, le niveau de correction H est recommandé pour garantir la scannabilité.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
