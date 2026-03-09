'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type QRCodeStyling from 'qr-code-styling';
import { useQREditor } from '@/hooks/useQREditor';
import { createClient } from '@/lib/supabase/client';
import { QRPreview } from './QRPreview';
import { DataPanel } from './DataPanel';
import { StylePanel } from './StylePanel';
import { LogoPanel } from './LogoPanel';
import { ExportPanel } from './ExportPanel';
import { TemplateGallery } from './TemplateGallery';
import { ScannabilityScore } from './ScannabilityScore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Save, Maximize2, ArrowLeft, Loader2 } from 'lucide-react';
import type { ContentType, QRCodeRecord } from '@/types/qr';
import { toast } from 'sonner';

interface QREditorProps {
  qrId?: string;
}

export function QREditor({ qrId }: QREditorProps) {
  const router = useRouter();
  const supabase = createClient();
  const qrInstance = useRef<QRCodeStyling | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!qrId);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const { state, update, setContentType, applyTemplate } = useQREditor();

  // Charger un QR existant
  useEffect(() => {
    if (!qrId) return;

    const loadQR = async () => {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('id', qrId)
        .single();

      if (error || !data) {
        toast.error('QR code introuvable');
        router.push('/dashboard');
        return;
      }

      const record = data as QRCodeRecord;
      update({
        ...record.style_config,
        contentType: record.content_type,
        contentData: record.content_data,
        name: record.name,
        logo: {
          ...record.style_config.logo,
          file: null,
        },
      });
      setLoading(false);
    };

    loadQR();
  }, [qrId, supabase, update, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const payload = {
        user_id: user.id,
        name: state.name,
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

      if (qrId) {
        const { error } = await supabase
          .from('qr_codes')
          .update(payload)
          .eq('id', qrId);
        if (error) throw error;
        toast.success('QR code mis à jour');
      } else {
        const { error } = await supabase.from('qr_codes').insert(payload);
        if (error) throw error;
        toast.success('QR code sauvegardé');
        router.push('/dashboard');
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDataChange = useCallback(
    (key: string, value: string) => {
      update({ contentData: { ...state.contentData, [key]: value } });
    },
    [state.contentData, update]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Dashboard
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Input
          value={state.name}
          onChange={(e) => update({ name: e.target.value })}
          className="max-w-[200px] h-8 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-0"
          placeholder="Nom du QR code"
        />
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 border-r border-border flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <Tabs defaultValue="content">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="content" className="text-xs px-2">📝</TabsTrigger>
                <TabsTrigger value="style" className="text-xs px-2">🎨</TabsTrigger>
                <TabsTrigger value="logo" className="text-xs px-2">🖼️</TabsTrigger>
                <TabsTrigger value="export" className="text-xs px-2">📤</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Contenu</h3>
                <DataPanel
                  state={state}
                  onContentTypeChange={setContentType}
                  onDataChange={handleDataChange}
                />
              </TabsContent>

              <TabsContent value="style" className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Style</h3>
                <StylePanel state={state} onUpdate={update} />
              </TabsContent>

              <TabsContent value="logo" className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Logo</h3>
                <LogoPanel state={state} onUpdate={update} />
              </TabsContent>

              <TabsContent value="export" className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Export</h3>
                <ExportPanel state={state} onUpdate={update} qrInstance={qrInstance} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Save button */}
          <div className="p-4 border-t border-border">
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {/* Right panel — Preview */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8 bg-muted/20">
          {/* QR Preview */}
          <div className="relative bg-white rounded-2xl p-6 shadow-2xl">
            <QRPreview
              state={state}
              size={300}
              onInstanceReady={(instance) => {
                qrInstance.current = instance;
              }}
            />
          </div>

          {/* Scannability */}
          <div className="w-full max-w-sm">
            <ScannabilityScore state={state} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullscreen(true)}
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Tester en grand
            </Button>
          </div>

          {/* Templates */}
          <div className="w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-2">Templates rapides</p>
            <TemplateGallery onApply={applyTemplate} compact />
          </div>
        </div>
      </div>

      {/* Fullscreen modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => setShowFullscreen(false)}
        >
          <div className="bg-white rounded-2xl p-8">
            <QRPreview state={state} size={500} />
          </div>
          <p className="absolute bottom-8 text-white/60 text-sm">
            Cliquez n&apos;importe où pour fermer
          </p>
        </div>
      )}
    </div>
  );
}
