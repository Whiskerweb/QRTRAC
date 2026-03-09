'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import type { QREditorState, ColorConfig, DotsType, CornerSquareType, CornerDotType } from '@/types/qr';

interface StylePanelProps {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ColorConfig;
  onChange: (config: ColorConfig) => void;
}) {
  const [mode, setMode] = useState<'single' | 'linearGradient' | 'radialGradient'>(
    value.type
  );

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    if (newMode === 'single') {
      onChange({ type: 'single', color: value.type === 'single' ? value.color : '#000000' });
    } else if (newMode === 'linearGradient') {
      onChange({
        type: 'linearGradient',
        colors: ['#7C3AED', '#06B6D4'],
        rotation: 45,
      });
    } else {
      onChange({ type: 'radialGradient', colors: ['#3B82F6', '#06B6D4'] });
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2">
        {(['single', 'linearGradient', 'radialGradient'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`text-xs px-2 py-1 rounded border transition-colors ${
              mode === m
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            {m === 'single' ? 'Uni' : m === 'linearGradient' ? 'Linéaire' : 'Radial'}
          </button>
        ))}
      </div>

      {mode === 'single' && value.type === 'single' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ type: 'single', color: e.target.value })}
            className="w-10 h-8 rounded cursor-pointer border border-input"
          />
          <span className="text-xs font-mono text-muted-foreground">{value.color}</span>
        </div>
      )}

      {(mode === 'linearGradient' || mode === 'radialGradient') &&
        (value.type === 'linearGradient' || value.type === 'radialGradient') && (
          <div className="space-y-2">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={value.colors[0]}
                onChange={(e) =>
                  onChange({ ...value, colors: [e.target.value, value.colors[1]] } as ColorConfig)
                }
                className="w-10 h-8 rounded cursor-pointer border border-input"
              />
              <input
                type="color"
                value={value.colors[1]}
                onChange={(e) =>
                  onChange({ ...value, colors: [value.colors[0], e.target.value] } as ColorConfig)
                }
                className="w-10 h-8 rounded cursor-pointer border border-input"
              />
              <div
                className="flex-1 h-8 rounded border border-input"
                style={{
                  background:
                    mode === 'linearGradient'
                      ? `linear-gradient(${(value as { rotation: number }).rotation || 45}deg, ${value.colors[0]}, ${value.colors[1]})`
                      : `radial-gradient(circle, ${value.colors[0]}, ${value.colors[1]})`,
                }}
              />
            </div>
            {mode === 'linearGradient' && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Angle : {(value as { rotation: number }).rotation || 0}°
                </Label>
                <Slider
                  min={0}
                  max={360}
                  step={15}
                  value={[(value as { rotation: number }).rotation || 0]}
                  onValueChange={([r]) =>
                    onChange({ ...value, rotation: r } as ColorConfig)
                  }
                />
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export function StylePanel({ state, onUpdate }: StylePanelProps) {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="dots">
        <TabsList className="w-full">
          <TabsTrigger value="dots" className="flex-1 text-xs">Dots</TabsTrigger>
          <TabsTrigger value="corners" className="flex-1 text-xs">Coins</TabsTrigger>
          <TabsTrigger value="background" className="flex-1 text-xs">Fond</TabsTrigger>
        </TabsList>

        <TabsContent value="dots" className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Forme des dots</Label>
            <Select
              value={state.dotsStyle.type}
              onValueChange={(v) =>
                onUpdate({ dotsStyle: { ...state.dotsStyle, type: v as DotsType } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Carré</SelectItem>
                <SelectItem value="dots">Cercle</SelectItem>
                <SelectItem value="rounded">Arrondi</SelectItem>
                <SelectItem value="extra-rounded">Extra arrondi</SelectItem>
                <SelectItem value="classy">Classy</SelectItem>
                <SelectItem value="classy-rounded">Classy arrondi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ColorPicker
            label="Couleur des dots"
            value={state.dotsStyle.color}
            onChange={(color) =>
              onUpdate({ dotsStyle: { ...state.dotsStyle, color } })
            }
          />
        </TabsContent>

        <TabsContent value="corners" className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Forme des carrés de coin</Label>
            <Select
              value={state.cornerSquaresStyle.type}
              onValueChange={(v) =>
                onUpdate({
                  cornerSquaresStyle: {
                    ...state.cornerSquaresStyle,
                    type: v as CornerSquareType,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Carré</SelectItem>
                <SelectItem value="dot">Cercle</SelectItem>
                <SelectItem value="extra-rounded">Extra arrondi</SelectItem>
                <SelectItem value="classy">Classy</SelectItem>
                <SelectItem value="classy-rounded">Classy arrondi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ColorPicker
            label="Couleur des carrés de coin"
            value={state.cornerSquaresStyle.color}
            onChange={(color) =>
              onUpdate({
                cornerSquaresStyle: { ...state.cornerSquaresStyle, color },
              })
            }
          />

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Forme des points centraux</Label>
            <Select
              value={state.cornerDotsStyle.type}
              onValueChange={(v) =>
                onUpdate({
                  cornerDotsStyle: {
                    ...state.cornerDotsStyle,
                    type: v as CornerDotType,
                  },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Carré</SelectItem>
                <SelectItem value="dot">Cercle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ColorPicker
            label="Couleur des points centraux"
            value={state.cornerDotsStyle.color}
            onChange={(color) =>
              onUpdate({
                cornerDotsStyle: { ...state.cornerDotsStyle, color },
              })
            }
          />
        </TabsContent>

        <TabsContent value="background" className="space-y-4 mt-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="transparent-bg"
              checked={state.background.transparent}
              onChange={(e) =>
                onUpdate({
                  background: { ...state.background, transparent: e.target.checked },
                })
              }
              className="rounded"
            />
            <Label htmlFor="transparent-bg" className="text-sm cursor-pointer">
              Fond transparent
            </Label>
          </div>
          {!state.background.transparent && (
            <ColorPicker
              label="Couleur de fond"
              value={state.background.color}
              onChange={(color) =>
                onUpdate({ background: { ...state.background, color } })
              }
            />
          )}
        </TabsContent>
      </Tabs>

      <div className="space-y-1.5 pt-2 border-t border-border">
        <Label className="text-xs text-muted-foreground">
          Correction d&apos;erreur
        </Label>
        <Select
          value={state.errorCorrectionLevel}
          onValueChange={(v) =>
            onUpdate({ errorCorrectionLevel: v as 'L' | 'M' | 'Q' | 'H' })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="L">L — Faible (7%)</SelectItem>
            <SelectItem value="M">M — Moyen (15%)</SelectItem>
            <SelectItem value="Q">Q — Quartile (25%)</SelectItem>
            <SelectItem value="H">H — Élevé (30%)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
