'use client';

import { useState, useRef, useCallback } from 'react';
import type QRCodeStyling from 'qr-code-styling';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { QRPreview } from '@/components/editor/QRPreview';
import { ScannabilityScore } from '@/components/editor/ScannabilityScore';
import { useQREditor } from '@/hooks/useQREditor';
import { QR_TEMPLATES } from '@/lib/qr/templates';
import { createClient } from '@/lib/supabase/client';
import type { DotsType, CornerSquareType, ContentType } from '@/types/qr';
import { Download, Upload, X, Save, Loader2, Type, UserRound, Link2 } from 'lucide-react';
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
    <div className="flex items-center gap-1.5 flex-wrap">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-150 hover:scale-110 ${
            value.toLowerCase() === c.toLowerCase()
              ? 'border-violet-500 ring-2 ring-violet-500/30 scale-110'
              : 'border-gray-200 hover:border-violet-400'
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
      <label className="relative w-6 h-6 cursor-pointer">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <span
          className="block w-6 h-6 rounded-full border-2 border-dashed border-gray-300 hover:border-violet-400 transition-colors"
          style={{
            background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
          }}
        />
      </label>
    </div>
  );
}

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
            value === o.value
              ? 'bg-violet-50 text-violet-700'
              : 'text-gray-500 hover:bg-gray-50 hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
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
    <div className="relative rounded-xl border border-gray-200 bg-white overflow-hidden h-full">
      <div className="grid lg:grid-cols-[1fr,380px] gap-0 h-full">
        {/* ====== LEFT — Controls ====== */}
        <div className="p-5 lg:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-y-auto">
          {/* Content type toggle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Type de contenu</Label>
            <div className="flex gap-1.5">
              <button
                onClick={() => handleContentTypeSwitch('url')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  state.contentType === 'url'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Link2 className="h-4 w-4" />
                Lien
              </button>
              <button
                onClick={() => handleContentTypeSwitch('text')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  state.contentType === 'text'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Type className="h-4 w-4" />
                Texte
              </button>
              <button
                onClick={() => handleContentTypeSwitch('vcard')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  state.contentType === 'vcard'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <UserRound className="h-4 w-4" />
                Contact
              </button>
            </div>
          </div>

          {/* Content fields */}
          {state.contentType === 'url' && (
            <div className="space-y-1.5">
              <Label htmlFor="qr-url" className="text-xs font-medium text-gray-500">
                URL
              </Label>
              <Input
                id="qr-url"
                type="url"
                placeholder="https://exemple.com"
                value={state.contentData.url ?? ''}
                onChange={(e) => update({ contentData: { url: e.target.value } })}
                className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
              />
            </div>
          )}

          {state.contentType === 'text' && (
            <div className="space-y-1.5">
              <Label htmlFor="qr-text" className="text-xs font-medium text-gray-500">
                Votre texte
              </Label>
              <textarea
                id="qr-text"
                placeholder="Entrez votre texte ici..."
                value={state.contentData.text ?? ''}
                onChange={(e) => update({ contentData: { text: e.target.value } })}
                className="w-full min-h-[80px] rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>
          )}

          {state.contentType === 'vcard' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Prenom</Label>
                  <Input
                    placeholder="Jean"
                    value={state.contentData.firstName ?? ''}
                    onChange={(e) => update({ contentData: { ...state.contentData, firstName: e.target.value } })}
                    className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-gray-500">Nom</Label>
                  <Input
                    placeholder="Dupont"
                    value={state.contentData.lastName ?? ''}
                    onChange={(e) => update({ contentData: { ...state.contentData, lastName: e.target.value } })}
                    className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Telephone</Label>
                <Input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={state.contentData.phone ?? ''}
                  onChange={(e) => update({ contentData: { ...state.contentData, phone: e.target.value } })}
                  className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Email</Label>
                <Input
                  type="email"
                  placeholder="jean@exemple.com"
                  value={state.contentData.email ?? ''}
                  onChange={(e) => update({ contentData: { ...state.contentData, email: e.target.value } })}
                  className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Organisation</Label>
                <Input
                  placeholder="Ma Societe"
                  value={state.contentData.organization ?? ''}
                  onChange={(e) => update({ contentData: { ...state.contentData, organization: e.target.value } })}
                  className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-gray-500">Site web</Label>
                <Input
                  placeholder="https://mon-site.com"
                  value={state.contentData.website ?? ''}
                  onChange={(e) => update({ contentData: { ...state.contentData, website: e.target.value } })}
                  className="h-9 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 text-sm"
                />
              </div>
            </div>
          )}

          {/* Templates */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Template</Label>
            <div className="flex flex-wrap gap-1.5">
              {QR_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplate(tpl.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 ${
                    activeTemplate === tpl.id
                      ? 'bg-violet-50 text-violet-700 font-medium'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-foreground'
                  }`}
                >
                  <span className="text-sm leading-none">{tpl.preview}</span>
                  <span>{tpl.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shapes row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Modules</Label>
              <Pills
                options={DOT_SHAPES}
                value={state.dotsStyle.type}
                onChange={(v) => {
                  update({ dotsStyle: { ...state.dotsStyle, type: v } });
                  setActiveTemplate(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Coins</Label>
              <Pills
                options={CORNER_SHAPES}
                value={state.cornerSquaresStyle.type}
                onChange={(v) => {
                  update({ cornerSquaresStyle: { ...state.cornerSquaresStyle, type: v } });
                  setActiveTemplate(null);
                }}
              />
            </div>
          </div>

          {/* Colors row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Couleur QR</Label>
              <Swatches colors={QR_COLORS} value={dotsColor} onChange={handleDotsColor} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Fond</Label>
              <div className="space-y-1.5">
                <div className={state.background.transparent ? 'opacity-40 pointer-events-none' : ''}>
                  <Swatches colors={BG_COLORS} value={bgColor} onChange={handleBgColor} />
                </div>
                <button
                  onClick={toggleTransparent}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    state.background.transparent
                      ? 'bg-violet-50 text-violet-700'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-foreground'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-gray-300 flex-shrink-0"
                    style={{
                      backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '6px 6px',
                      backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                    }}
                  />
                  Sans fond
                </button>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-500">Logo</Label>
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
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                    <img
                      src={state.logo.url}
                      alt="Logo"
                      className="w-9 h-9 object-contain rounded-md bg-white p-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{state.logo.file?.name || 'Logo'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {state.logo.file ? `${(state.logo.file.size / 1024).toFixed(0)} KB` : ''}
                      </p>
                    </div>
                    <button onClick={removeLogo} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">Taille</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{Math.round(state.logo.size * 100)}%</span>
                      </div>
                      <Slider
                        min={10}
                        max={40}
                        step={1}
                        value={[Math.round(state.logo.size * 100)]}
                        onValueChange={([v]) => update({ logo: { ...state.logo, size: v / 100 } })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground">Forme</span>
                      <Pills
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
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg border border-dashed border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-md bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Upload className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium">Ajouter un logo</p>
                    <p className="text-[10px] text-muted-foreground">PNG, JPG, SVG</p>
                  </div>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Format selector + Download */}
            <div className="flex-1 flex gap-1.5">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'png' | 'svg')}
                className="h-11 px-2.5 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
              <Button
                size="lg"
                className="flex-1 gap-2 h-11 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 btn-press"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
                Telecharger
              </Button>
            </div>
            {/* Save button (logged in only) */}
            {userId && (
              <Button
                variant="outline"
                size="lg"
                className="h-11 rounded-lg text-sm gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 btn-press"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            )}
          </div>
        </div>

        {/* ====== RIGHT — Preview ====== */}
        <div className="relative flex flex-col items-center justify-center gap-4 p-5 lg:p-6 lg:sticky lg:top-20 lg:self-start bg-[#FAFAFA]">
          {/* Preview frame */}
          <motion.div
            className="relative rounded-xl p-5 bg-white shadow-sm border border-gray-100"
            layout
          >
            {state.background.transparent && (
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  backgroundImage: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%), linear-gradient(-45deg, #e0e0e0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e0e0e0 75%), linear-gradient(-45deg, transparent 75%, #e0e0e0 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                  backgroundColor: '#ffffff',
                }}
              />
            )}
            <div className="relative">
              <QRPreview
                state={state}
                size={260}
                onInstanceReady={(instance) => {
                  qrInstance.current = instance;
                }}
              />
            </div>
          </motion.div>

          {/* Scannability */}
          <div className="w-full max-w-[260px]">
            <ScannabilityScore state={state} />
          </div>
        </div>
      </div>
    </div>
  );
}
