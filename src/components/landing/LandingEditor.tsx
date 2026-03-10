'use client';

import { useState, useRef, useCallback } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { QRPreview } from '@/components/editor/QRPreview';
import { ScannabilityScore } from '@/components/editor/ScannabilityScore';
import { useQREditor } from '@/hooks/useQREditor';
import { QR_TEMPLATES } from '@/lib/qr/templates';
import { createClient } from '@/lib/supabase/client';
import type { DotsType, CornerSquareType, ContentType } from '@/types/qr';
import { Download, Upload, X, Save, Loader2, Type, UserRound, Link2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// --- Constants ---

const DOT_SHAPES: { value: DotsType; label: string }[] = [
  { value: 'rounded', label: 'Arrondi' },
  { value: 'dots', label: 'Ronds' },
  { value: 'square', label: 'Carre' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy+' },
  { value: 'extra-rounded', label: 'Extra' },
];

const CORNER_SHAPES: { value: CornerSquareType; label: string }[] = [
  { value: 'square', label: 'Carre' },
  { value: 'dot', label: 'Cercle' },
  { value: 'extra-rounded', label: 'Arrondi' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy+' },
];

const QR_COLORS = [
  '#000000', '#7C3AED', '#06B6D4', '#E74C3C',
  '#2ECC71', '#F39C12', '#3498DB', '#E91E63',
];

const BG_COLORS = [
  '#FFFFFF', '#F8F9FA', '#F0F4FF', '#FFF8E1',
  '#FFF3E0', '#F5F0FF', '#ECFDF5', '#FEF2F2',
];

const MAX_LOGO_SIZE = 500 * 1024;

async function resizeImage(file: File, maxSizeBytes: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
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

// --- Sub-components ---

function Swatches({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-5 h-5 rounded-full border transition-all duration-150 hover:scale-110 ${
            value.toLowerCase() === c.toLowerCase()
              ? 'border-gray-900 ring-1 ring-gray-900/20 scale-110'
              : 'border-gray-200 hover:border-gray-400'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="relative w-5 h-5 cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          className="block w-5 h-5 rounded-full border border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          style={{
            background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
        />
      </label>
    </div>
  );
}

function MiniPills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
            value === o.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Section({
  label,
  children,
  defaultOpen = true,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-1"
      >
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <ChevronDown className={`w-3 h-3 text-gray-300 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pt-1.5 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main ---

interface LandingEditorProps {
  userId?: string;
}

export function LandingEditor({ userId }: LandingEditorProps) {
  const { state, update, setContentType, applyTemplate } = useQREditor({
    contentType: 'url',
    contentData: { url: 'https://exemple.com' },
    qrSize: 280,
  });
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'svg'>('png');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInstance = useRef<QRCodeStyling | null>(null);

  const dotsColor =
    state.dotsStyle.color.type === 'single' ? state.dotsStyle.color.color : '#7C3AED';
  const bgColor =
    state.background.color.type === 'single' ? state.background.color.color : '#ffffff';

  function handleTemplate(id: string) {
    const tpl = QR_TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    applyTemplate(tpl.config);
    setActiveTemplate(id);
  }

  function handleDotsColor(color: string) {
    update({
      dotsStyle: { ...state.dotsStyle, color: { type: 'single', color } },
      cornerSquaresStyle: { ...state.cornerSquaresStyle, color: { type: 'single', color } },
      cornerDotsStyle: { ...state.cornerDotsStyle, color: { type: 'single', color } },
    });
    setActiveTemplate(null);
  }

  function handleBgColor(color: string) {
    update({ background: { ...state.background, transparent: false, color: { type: 'single', color } } });
    setActiveTemplate(null);
  }

  function toggleTransparent() {
    update({ background: { ...state.background, transparent: !state.background.transparent } });
    setActiveTemplate(null);
  }

  const handleLogoFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await resizeImage(file, MAX_LOGO_SIZE);
      update({
        logo: { ...state.logo, file, url: dataUrl },
        errorCorrectionLevel: 'H',
      });
    },
    [state.logo, update]
  );

  function removeLogo() {
    update({ logo: { ...state.logo, file: null, url: null } });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDownload() {
    if (!qrInstance.current) return;
    try {
      if (exportFormat === 'svg') {
        await qrInstance.current.download({ name: state.name || 'qrcode', extension: 'svg' });
      } else {
        await qrInstance.current.download({ name: state.name || 'qrcode', extension: 'png' });
      }
    } catch {
      toast.error('Erreur lors du telechargement');
    }
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        user_id: userId,
        name: state.name || 'Mon QR Code',
        content_type: state.contentType,
        content_data: state.contentData,
        style_config: {
          dotsStyle: state.dotsStyle,
          cornerSquaresStyle: state.cornerSquaresStyle,
          cornerDotsStyle: state.cornerDotsStyle,
          background: state.background,
          errorCorrectionLevel: state.errorCorrectionLevel,
          qrSize: state.qrSize,
          logo: {
            url: state.logo.url,
            size: state.logo.size,
            margin: state.logo.margin,
            shape: state.logo.shape,
          },
        },
        logo_path: state.logo.url ?? null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('qr_codes').insert(payload);
      if (error) throw error;
      toast.success('QR code sauvegarde !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  function handleContentTypeSwitch(type: ContentType) {
    setContentType(type);
    setActiveTemplate(null);
  }

  return (
    <div className="grid lg:grid-cols-[1fr,320px] gap-0">
      {/* ====== LEFT — Controls ====== */}
      <div className="p-4 lg:p-5 space-y-3 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">
        {/* Content type — compact tabs */}
        <div className="flex gap-1 p-0.5 bg-gray-50 rounded-lg">
          {[
            { type: 'url' as const, icon: Link2, label: 'Lien' },
            { type: 'text' as const, icon: Type, label: 'Texte' },
            { type: 'vcard' as const, icon: UserRound, label: 'Contact' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => handleContentTypeSwitch(type)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                state.contentType === type
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Content fields — compact */}
        {state.contentType === 'url' && (
          <Input
            type="url"
            placeholder="https://exemple.com"
            value={state.contentData.url ?? ''}
            onChange={(e) => update({ contentData: { url: e.target.value } })}
            className="h-8 rounded-lg text-[12px] border-gray-200 placeholder:text-gray-300"
          />
        )}

        {state.contentType === 'text' && (
          <textarea
            placeholder="Entrez votre texte..."
            value={state.contentData.text ?? ''}
            onChange={(e) => update({ contentData: { text: e.target.value } })}
            className="w-full min-h-[60px] rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-300"
          />
        )}

        {state.contentType === 'vcard' && (
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <Input placeholder="Prenom" value={state.contentData.firstName ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, firstName: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
              <Input placeholder="Nom" value={state.contentData.lastName ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, lastName: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
            </div>
            <Input placeholder="Telephone" value={state.contentData.phone ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, phone: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
            <Input placeholder="Email" value={state.contentData.email ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, email: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
            <div className="grid grid-cols-2 gap-1.5">
              <Input placeholder="Organisation" value={state.contentData.organization ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, organization: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
              <Input placeholder="Site web" value={state.contentData.website ?? ''} onChange={(e) => update({ contentData: { ...state.contentData, website: e.target.value } })} className="h-7 rounded-lg text-[11px] border-gray-200 placeholder:text-gray-300" />
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100" />

        {/* Templates — horizontal scroll */}
        <Section label="Style" defaultOpen={true}>
          <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {QR_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleTemplate(tpl.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] whitespace-nowrap transition-all flex-shrink-0 ${
                  activeTemplate === tpl.id
                    ? 'bg-gray-900 text-white font-medium'
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              >
                <span className="text-xs leading-none">{tpl.preview}</span>
                {tpl.name}
              </button>
            ))}
          </div>

          {/* Shapes — inline */}
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-[10px] text-gray-400 mb-1 block">Modules</span>
              <MiniPills
                options={DOT_SHAPES}
                value={state.dotsStyle.type}
                onChange={(v) => {
                  update({ dotsStyle: { ...state.dotsStyle, type: v } });
                  setActiveTemplate(null);
                }}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 mb-1 block">Coins</span>
              <MiniPills
                options={CORNER_SHAPES}
                value={state.cornerSquaresStyle.type}
                onChange={(v) => {
                  update({ cornerSquaresStyle: { ...state.cornerSquaresStyle, type: v } });
                  setActiveTemplate(null);
                }}
              />
            </div>
          </div>

          {/* Colors — inline */}
          <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-[10px] text-gray-400 mb-1 block">Couleur</span>
              <Swatches colors={QR_COLORS} value={dotsColor} onChange={handleDotsColor} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400">Fond</span>
                <button
                  onClick={toggleTransparent}
                  className={`text-[9px] font-medium px-1.5 py-0.5 rounded transition-all ${
                    state.background.transparent
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-300 hover:text-gray-500'
                  }`}
                >
                  Transparent
                </button>
              </div>
              <div className={state.background.transparent ? 'opacity-30 pointer-events-none' : ''}>
                <Swatches colors={BG_COLORS} value={bgColor} onChange={handleBgColor} />
              </div>
            </div>
          </div>
        </Section>

        <div className="h-px bg-gray-100" />

        {/* Logo — compact */}
        <Section label="Logo" defaultOpen={false}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            className="hidden"
            onChange={handleLogoFile}
          />

          <AnimatePresence mode="wait">
            {state.logo.url ? (
              <motion.div
                key="has-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-50">
                  <img src={state.logo.url} alt="Logo" className="w-7 h-7 object-contain rounded bg-white p-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-medium truncate">{state.logo.file?.name || 'Logo'}</p>
                  </div>
                  <button onClick={removeLogo} className="text-gray-300 hover:text-red-500 transition-colors p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-gray-400">Taille</span>
                      <span className="text-[9px] font-mono text-gray-300">{Math.round(state.logo.size * 100)}%</span>
                    </div>
                    <Slider
                      min={10}
                      max={40}
                      step={1}
                      value={[Math.round(state.logo.size * 100)]}
                      onValueChange={([v]) => update({ logo: { ...state.logo, size: v / 100 } })}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block mb-1">Forme</span>
                    <MiniPills
                      options={[
                        { value: 'square' as const, label: 'Carre' },
                        { value: 'circle' as const, label: 'Rond' },
                        { value: 'rounded' as const, label: 'Arrondi' },
                      ]}
                      value={state.logo.shape}
                      onChange={(v) =>
                        update({ logo: { ...state.logo, shape: v as 'square' | 'circle' | 'rounded' } })
                      }
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="no-logo"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 p-2 rounded-lg border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all cursor-pointer group"
              >
                <div className="w-7 h-7 rounded bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                  <Upload className="h-3 w-3 text-gray-400" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-medium text-gray-500">Ajouter un logo</p>
                  <p className="text-[9px] text-gray-300">PNG, JPG, SVG</p>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </Section>

        <div className="h-px bg-gray-100" />

        {/* Actions — compact bottom bar */}
        <div className="flex gap-1.5 pt-1">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg')}
            className="h-9 px-2 rounded-lg border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-600 focus:outline-none"
          >
            <option value="png">PNG</option>
            <option value="svg">SVG</option>
          </select>
          <Button
            className="flex-1 gap-1.5 h-9 rounded-lg text-[12px] font-semibold bg-gray-900 text-white hover:bg-gray-800"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            Telecharger
          </Button>
          {userId && (
            <Button
              variant="outline"
              className="h-9 rounded-lg text-[12px] gap-1.5 border-gray-200 text-gray-500 hover:bg-gray-50"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Sauvegarder
            </Button>
          )}
        </div>
      </div>

      {/* ====== RIGHT — Preview ====== */}
      <div className="flex flex-col items-center justify-center gap-3 p-4 lg:p-5 lg:sticky lg:top-20 lg:self-start bg-gray-50/50">
        <motion.div
          className="relative rounded-xl p-4 bg-white shadow-sm border border-gray-100"
          layout
        >
          {state.background.transparent && (
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundImage: 'linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                backgroundColor: '#fff',
              }}
            />
          )}
          <div className="relative">
            <QRPreview
              state={state}
              size={220}
              onInstanceReady={(instance) => {
                qrInstance.current = instance;
              }}
            />
          </div>
        </motion.div>

        <div className="w-full max-w-[220px]">
          <ScannabilityScore state={state} />
        </div>
      </div>
    </div>
  );
}
