'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import type QRCodeStyling from 'qr-code-styling'
import { useQREditor } from '@/hooks/useQREditor'
import { createClient } from '@/lib/supabase/client'
import { QRPreview } from '@/components/editor/QRPreview'
import { DataPanel } from '@/components/editor/DataPanel'
import { StylePanel } from '@/components/editor/StylePanel'
import { LogoPanel } from '@/components/editor/LogoPanel'
import { ExportPanel } from '@/components/editor/ExportPanel'
import { TemplateGallery } from '@/components/editor/TemplateGallery'
import { ScannabilityScore } from '@/components/editor/ScannabilityScore'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Save, Loader2 } from 'lucide-react'
import type { QRCodeRecord } from '@/types/qr'
import { toast } from 'sonner'

interface CreateQRModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    qrId?: string
}

export function CreateQRModal({ isOpen, onClose, onSuccess, qrId }: CreateQRModalProps) {
    const supabase = createClient()
    const qrInstance = useRef<QRCodeStyling | null>(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)

    const { state, update, setContentType, applyTemplate, reset } = useQREditor()

    // Load existing QR when editing
    useEffect(() => {
        if (!isOpen) return
        if (!qrId) {
            reset()
            return
        }

        setLoading(true)
        const loadQR = async () => {
            const { data, error } = await supabase
                .from('qr_codes')
                .select('*')
                .eq('id', qrId)
                .single()

            if (error || !data) {
                toast.error('QR code introuvable')
                onClose()
                return
            }

            const record = data as QRCodeRecord
            update({
                ...record.style_config,
                contentType: record.content_type,
                contentData: record.content_data,
                name: record.name,
                logo: {
                    ...record.style_config.logo,
                    file: null,
                },
            })
            setLoading(false)
        }

        loadQR()
    }, [isOpen, qrId, supabase, update, reset, onClose])

    // Escape key
    useEffect(() => {
        if (!isOpen) return
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
        document.addEventListener('keydown', handleEsc)
        return () => document.removeEventListener('keydown', handleEsc)
    }, [isOpen, saving, onClose])

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Vous devez être connecté')
                return
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
            }

            if (qrId) {
                const { error } = await supabase
                    .from('qr_codes')
                    .update(payload)
                    .eq('id', qrId)
                if (error) throw error
                toast.success('QR code mis à jour')
            } else {
                const { error } = await supabase.from('qr_codes').insert(payload)
                if (error) throw error
                toast.success('QR code sauvegardé')
            }

            onSuccess?.()
            onClose()
        } catch {
            toast.error('Erreur lors de la sauvegarde')
        } finally {
            setSaving(false)
        }
    }

    const handleDataChange = useCallback(
        (key: string, value: string) => {
            update({ contentData: { ...state.contentData, [key]: value } })
        },
        [state.contentData, update]
    )

    const handleClose = () => { if (!saving) onClose() }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-medium text-gray-900">
                            {qrId ? 'Modifier le QR code' : 'Créer un QR code'}
                        </h2>
                        <span className="text-gray-300">·</span>
                        <Input
                            value={state.name}
                            onChange={(e) => update({ name: e.target.value })}
                            className="max-w-[180px] h-7 text-sm font-medium border-none shadow-none focus-visible:ring-0 px-0 bg-transparent"
                            placeholder="Nom du QR code"
                        />
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-0 min-h-[480px]">
                                {/* Left panel — Tabs */}
                                <div className="md:col-span-3 p-5 overflow-y-auto">
                                    <Tabs defaultValue="content">
                                        <TabsList className="w-full grid grid-cols-4 mb-4">
                                            <TabsTrigger value="content" className="text-xs">Contenu</TabsTrigger>
                                            <TabsTrigger value="style" className="text-xs">Style</TabsTrigger>
                                            <TabsTrigger value="logo" className="text-xs">Logo</TabsTrigger>
                                            <TabsTrigger value="export" className="text-xs">Export</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="content">
                                            <DataPanel
                                                state={state}
                                                onContentTypeChange={setContentType}
                                                onDataChange={handleDataChange}
                                            />
                                        </TabsContent>

                                        <TabsContent value="style">
                                            <StylePanel state={state} onUpdate={update} />
                                        </TabsContent>

                                        <TabsContent value="logo">
                                            <LogoPanel state={state} onUpdate={update} />
                                        </TabsContent>

                                        <TabsContent value="export">
                                            <ExportPanel state={state} onUpdate={update} qrInstance={qrInstance} />
                                        </TabsContent>
                                    </Tabs>
                                </div>

                                {/* Right panel — Preview */}
                                <div className="md:col-span-2 md:border-l border-gray-200 bg-gray-50/50 p-5 flex flex-col items-center gap-4">
                                    <div className="bg-white rounded-xl p-4 shadow-lg">
                                        <QRPreview
                                            state={state}
                                            size={200}
                                            onInstanceReady={(instance) => {
                                                qrInstance.current = instance
                                            }}
                                        />
                                    </div>

                                    <div className="w-full max-w-[240px]">
                                        <ScannabilityScore state={state} />
                                    </div>

                                    <div className="w-full max-w-[240px]">
                                        <p className="text-[11px] text-gray-400 mb-1.5">Templates rapides</p>
                                        <TemplateGallery onApply={applyTemplate} compact />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-200 px-5 py-3 bg-white sticky bottom-0 z-10 flex items-center justify-end gap-2">
                            <button
                                onClick={handleClose}
                                className="py-2 px-4 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="py-2 px-5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
