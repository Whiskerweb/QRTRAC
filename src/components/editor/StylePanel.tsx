'use client';

import { useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Circle, Minus, Sun, ChevronDown, Upload, X, ImagePlus } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import type { QREditorState, ColorConfig, DotsType, CornerSquareType, CornerDotType } from '@/types/qr';

interface StylePanelProps {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
}

// ── Color Picker ──────────────────────────────────────────────

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ColorConfig;
  onChange: (config: ColorConfig) => void;
}) {
  // Derive mode from value — no local state, always in sync
  const mode = value.type;
  const hiddenRef1 = useRef<HTMLInputElement>(null);
  const hiddenRef2 = useRef<HTMLInputElement>(null);

  const handleModeChange = (newMode: ColorConfig['type']) => {
    if (newMode === mode) return;
    if (newMode === 'single') {
      onChange({
        type: 'single',
        color: value.type === 'single' ? value.color : value.colors[0],
      });
    } else if (newMode === 'linearGradient') {
      const colors: [string, string] =
        value.type !== 'single' ? value.colors : [value.color, '#888888'];
      onChange({ type: 'linearGradient', colors, rotation: 45 });
    } else {
      const colors: [string, string] =
        value.type !== 'single' ? value.colors : [value.color, '#888888'];
      onChange({ type: 'radialGradient', colors });
    }
  };

  const modeButtons: { id: ColorConfig['type']; icon: React.ReactNode; tip: string }[] = [
    { id: 'single', icon: <Circle className="w-3 h-3" />, tip: 'Uni' },
    { id: 'linearGradient', icon: <Minus className="w-3 h-3 rotate-45" />, tip: 'Linéaire' },
    { id: 'radialGradient', icon: <Sun className="w-3 h-3" />, tip: 'Radial' },
  ];

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-gray-500">{label}</span>
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
          {modeButtons.map((m) => (
            <button
              key={m.id}
              onClick={() => handleModeChange(m.id)}
              title={m.tip}
              className={`p-1.5 rounded-md transition-all ${
                mode === m.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {m.icon}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'single' && (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2.5"
          >
            <button
              onClick={() => hiddenRef1.current?.click()}
              className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer flex-shrink-0 shadow-sm"
              style={{ backgroundColor: (value as { color: string }).color }}
            />
            <input
              ref={hiddenRef1}
              type="color"
              value={(value as { color: string }).color}
              onChange={(e) => onChange({ type: 'single', color: e.target.value })}
              className="sr-only"
            />
            <input
              type="text"
              value={(value as { color: string }).color}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                  onChange({ type: 'single', color: v });
                }
              }}
              className="w-[80px] text-[12px] font-mono text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300"
            />
          </motion.div>
        )}

        {(mode === 'linearGradient' || mode === 'radialGradient') && (
          <motion.div
            key="gradient"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="space-y-2.5"
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => hiddenRef1.current?.click()}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                style={{ backgroundColor: (value as { colors: [string, string] }).colors[0] }}
              />
              <input
                ref={hiddenRef1}
                type="color"
                value={(value as { colors: [string, string] }).colors[0]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    colors: [e.target.value, (value as { colors: [string, string] }).colors[1]],
                  } as ColorConfig)
                }
                className="sr-only"
              />
              <div className="flex-1 h-[3px] rounded-full bg-gray-200 relative">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      mode === 'linearGradient'
                        ? `linear-gradient(90deg, ${(value as { colors: [string, string] }).colors[0]}, ${(value as { colors: [string, string] }).colors[1]})`
                        : `linear-gradient(90deg, ${(value as { colors: [string, string] }).colors[0]}, ${(value as { colors: [string, string] }).colors[1]})`,
                  }}
                />
              </div>
              <button
                onClick={() => hiddenRef2.current?.click()}
                className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer flex-shrink-0 shadow-sm"
                style={{ backgroundColor: (value as { colors: [string, string] }).colors[1] }}
              />
              <input
                ref={hiddenRef2}
                type="color"
                value={(value as { colors: [string, string] }).colors[1]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    colors: [(value as { colors: [string, string] }).colors[0], e.target.value],
                  } as ColorConfig)
                }
                className="sr-only"
              />
            </div>
            {mode === 'linearGradient' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-gray-400 flex-shrink-0">Angle</span>
                <Slider
                  min={0}
                  max={360}
                  step={15}
                  value={[(value as { rotation: number }).rotation || 0]}
                  onValueChange={([r]) =>
                    onChange({ ...value, rotation: r } as ColorConfig)
                  }
                  className="flex-1"
                />
                <span className="text-[11px] font-mono text-gray-400 w-8 text-right">
                  {(value as { rotation: number }).rotation || 0}°
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shape Selector ──────────────────────────────────────────────

function ShapeSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-[13px] text-gray-500">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className="w-full appearance-none text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── Section Wrapper ──────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ── Logo Section (integrated) ──────────────────────────────────

const MAX_LOGO_SIZE = 500 * 1024;

async function resizeImage(file: File, maxSizeBytes: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
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
      while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.src = url;
  });
}

export function LogoSection({
  state,
  onUpdate,
}: {
  state: QREditorState;
  onUpdate: (updates: Partial<QREditorState>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await resizeImage(file, MAX_LOGO_SIZE);
      onUpdate({
        logo: { ...state.logo, file, url: dataUrl },
        errorCorrectionLevel: state.logo.size > 0.2 ? 'H' : state.errorCorrectionLevel,
      });
    },
    [state.logo, state.errorCorrectionLevel, onUpdate]
  );

  const removeLogo = () => {
    onUpdate({ logo: { ...state.logo, file: null, url: null } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {state.logo.url ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-gray-50/50">
          <img
            src={state.logo.url}
            alt="Logo"
            className="w-10 h-10 object-contain rounded-lg bg-white"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-gray-700 truncate">
              {state.logo.file?.name || 'Logo'}
            </p>
            {state.logo.file && (
              <p className="text-[11px] text-gray-400">
                {(state.logo.file.size / 1024).toFixed(0)} KB
              </p>
            )}
          </div>
          <button
            onClick={removeLogo}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border border-dashed border-gray-300 rounded-xl p-4 flex items-center gap-3 hover:border-gray-400 hover:bg-gray-50/50 transition-colors cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            <Upload className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-left">
            <p className="text-[13px] font-medium text-gray-600">Ajouter un logo</p>
            <p className="text-[11px] text-gray-400">PNG, JPG, SVG</p>
          </div>
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {state.logo.url && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Taille</span>
              <span className="text-[11px] font-mono text-gray-400">
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-500">Marge</span>
              <span className="text-[11px] font-mono text-gray-400">
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
          <ShapeSelector
            label="Forme"
            value={state.logo.shape}
            options={[
              { value: 'square', label: 'Carré' },
              { value: 'circle', label: 'Cercle' },
              { value: 'rounded', label: 'Arrondi' },
            ]}
            onChange={(v) =>
              onUpdate({ logo: { ...state.logo, shape: v as 'square' | 'circle' | 'rounded' } })
            }
          />
        </div>
      )}
    </div>
  );
}

// ── Main StylePanel ──────────────────────────────────────────────

const DOT_SHAPES: { value: DotsType; label: string }[] = [
  { value: 'square', label: 'Carré' },
  { value: 'dots', label: 'Cercle' },
  { value: 'rounded', label: 'Arrondi' },
  { value: 'extra-rounded', label: 'Extra arrondi' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy arrondi' },
];

const CORNER_SQUARE_SHAPES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Carré' },
  { value: 'dot', label: 'Cercle' },
  { value: 'extra-rounded', label: 'Extra arrondi' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy arrondi' },
];

const CORNER_DOT_SHAPES: { value: CornerDotType; label: string }[] = [
  { value: 'square', label: 'Carré' },
  { value: 'dot', label: 'Cercle' },
];

const EC_LEVELS: { value: string; label: string }[] = [
  { value: 'L', label: 'L — Faible (7%)' },
  { value: 'M', label: 'M — Moyen (15%)' },
  { value: 'Q', label: 'Q — Quartile (25%)' },
  { value: 'H', label: 'H — Élevé (30%)' },
];

export function StylePanel({ state, onUpdate }: StylePanelProps) {
  return (
    <div className="space-y-6">
      {/* Dots */}
      <Section title="Dots">
        <ShapeSelector
          label="Forme"
          value={state.dotsStyle.type}
          options={DOT_SHAPES}
          onChange={(v) => onUpdate({ dotsStyle: { ...state.dotsStyle, type: v } })}
        />
        <ColorPicker
          label="Couleur"
          value={state.dotsStyle.color}
          onChange={(color) => onUpdate({ dotsStyle: { ...state.dotsStyle, color } })}
        />
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Corners */}
      <Section title="Coins">
        <ShapeSelector
          label="Carrés de coin"
          value={state.cornerSquaresStyle.type}
          options={CORNER_SQUARE_SHAPES}
          onChange={(v) =>
            onUpdate({ cornerSquaresStyle: { ...state.cornerSquaresStyle, type: v } })
          }
        />
        <ColorPicker
          label="Couleur des carrés"
          value={state.cornerSquaresStyle.color}
          onChange={(color) =>
            onUpdate({ cornerSquaresStyle: { ...state.cornerSquaresStyle, color } })
          }
        />
        <ShapeSelector
          label="Points centraux"
          value={state.cornerDotsStyle.type}
          options={CORNER_DOT_SHAPES}
          onChange={(v) =>
            onUpdate({ cornerDotsStyle: { ...state.cornerDotsStyle, type: v } })
          }
        />
        <ColorPicker
          label="Couleur des points"
          value={state.cornerDotsStyle.color}
          onChange={(color) =>
            onUpdate({ cornerDotsStyle: { ...state.cornerDotsStyle, color } })
          }
        />
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Background */}
      <Section title="Fond">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={state.background.transparent}
            onChange={(e) =>
              onUpdate({ background: { ...state.background, transparent: e.target.checked } })
            }
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300"
          />
          <span className="text-[13px] text-gray-600">Fond transparent</span>
        </label>
        {!state.background.transparent && (
          <ColorPicker
            label="Couleur"
            value={state.background.color}
            onChange={(color) => onUpdate({ background: { ...state.background, color } })}
          />
        )}
      </Section>

      <div className="h-px bg-gray-100" />

      {/* Error Correction */}
      <Section title="Correction d'erreur">
        <ShapeSelector
          label="Niveau"
          value={state.errorCorrectionLevel}
          options={EC_LEVELS as { value: 'L' | 'M' | 'Q' | 'H'; label: string }[]}
          onChange={(v) => onUpdate({ errorCorrectionLevel: v })}
        />
      </Section>
    </div>
  );
}
