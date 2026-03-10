'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type QRCodeStyling from 'qr-code-styling'
import { useQREditor } from '@/hooks/useQREditor'
import { createClient } from '@/lib/supabase/client'
import { QRPreview } from '@/components/editor/QRPreview'
import { DataPanel } from '@/components/editor/DataPanel'
import { StylePanel, LogoSection } from '@/components/editor/StylePanel'
import { ExportPanel } from '@/components/editor/ExportPanel'
import { TemplateGallery } from '@/components/editor/TemplateGallery'
import { ScannabilityScore } from '@/components/editor/ScannabilityScore'
import { X, Save, Loader2, Type, Palette, Download } from 'lucide-react'
import type { QRCodeRecord } from '@/types/qr'
import { toast } from 'sonner'

interface CreateQRModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
    qrId?: string
}

const TABS = [
    { id: 'content', label: 'Contenu', icon: Type },
    { id: 'style', label: 'Style', icon: Palette },
    { id: 'export', label: 'Export', icon: Download },
] as const

type TabId = (typeof TABS)[number]['id']

export function CreateQRModal({ isOpen, onClose, onSuccess, qrId }: CreateQRModalProps) {
    const supabase = createClient()
    const qrInstance = useRef<QRCodeStyling | null>(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(false)
    const [activeTab, setActiveTab] = useState<TabId>('content')

    const { state, update, setContentType, applyTemplate, reset } = useQREditor()

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = '' }
        }
    }, [isOpen])

    // Load existing QR when editing
    useEffect(() => {
        if (!isOpen) return
        if (!qrId) {
            reset()
            setActiveTab('content')
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
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50 p-2 md:p-4"
                onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 8 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white rounded-2xl w-full max-w-[920px] shadow-2xl flex flex-col max-h-[95vh] md:max-h-[88vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 flex-shrink-0">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" rx="1" />
                                    <rect x="14" y="3" width="7" height="7" rx="1" />
                                    <rect x="3" y="14" width="7" height="7" rx="1" />
                                    <rect x="14" y="14" width="3" height="3" />
                                    <rect x="18" y="14" width="3" height="3" />
                                    <rect x="14" y="18" width="3" height="3" />
                                    <rect x="18" y="18" width="3" height="3" />
                                </svg>
                            </div>
                            <input
                                value={state.name}
                                onChange={(e) => update({ name: e.target.value })}
                                className="text-[14px] md:text-[15px] font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 min-w-0 w-full max-w-[160px] md:max-w-[200px] placeholder:text-gray-300"
                                placeholder="Nom du QR code"
                            />
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                        </div>
                    ) : (
                        <>
                            {/* Content — flex row on desktop, column on mobile */}
                            <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

                                {/* Mobile: compact preview row */}
                                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/40 flex-shrink-0">
                                    <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100 flex-shrink-0">
                                        <QRPreview
                                            state={state}
                                            size={80}
                                            onInstanceReady={(instance) => {
                                                qrInstance.current = instance
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <LogoSection state={state} onUpdate={update} />
                                    </div>
                                </div>

                                {/* Left panel — tabs */}
                                <div className="flex-1 min-h-0 min-w-0 flex flex-col md:w-[55%] md:flex-shrink-0 md:border-r md:border-gray-100">
                                    {/* Tab bar */}
                                    <div className="px-4 md:px-6 pt-3 md:pt-4 flex-shrink-0">
                                        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
                                            {TABS.map((tab) => {
                                                const Icon = tab.icon
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => setActiveTab(tab.id)}
                                                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 md:px-3 py-2 rounded-lg text-[12px] md:text-[13px] font-medium transition-all ${
                                                            activeTab === tab.id
                                                                ? 'bg-white text-gray-900 shadow-sm'
                                                                : 'text-gray-400 hover:text-gray-600'
                                                        }`}
                                                    >
                                                        <Icon className="w-3.5 h-3.5" />
                                                        <span className="hidden sm:inline">{tab.label}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Tab content — scrollable */}
                                    <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 md:py-5">
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={activeTab}
                                                initial={{ opacity: 0, x: 8 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -8 }}
                                                transition={{ duration: 0.15 }}
                                            >
                                                {activeTab === 'content' && (
                                                    <DataPanel
                                                        state={state}
                                                        onContentTypeChange={setContentType}
                                                        onDataChange={handleDataChange}
                                                    />
                                                )}
                                                {activeTab === 'style' && (
                                                    <StylePanel state={state} onUpdate={update} />
                                                )}
                                                {activeTab === 'export' && (
                                                    <ExportPanel state={state} onUpdate={update} qrInstance={qrInstance} />
                                                )}
                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Right panel — Preview (hidden on mobile, shown on md+) */}
                                <div className="hidden md:flex md:w-[45%] bg-gray-50/60 p-6 flex-col items-center gap-5 overflow-y-auto overscroll-contain">
                                    {/* QR Preview */}
                                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                        <QRPreview
                                            state={state}
                                            size={200}
                                            onInstanceReady={(instance) => {
                                                qrInstance.current = instance
                                            }}
                                        />
                                    </div>

                                    {/* Logo — prominent placement */}
                                    <div className="w-full max-w-[260px]">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Logo</p>
                                        <LogoSection state={state} onUpdate={update} />
                                    </div>

                                    {/* Scannability */}
                                    <div className="w-full max-w-[260px]">
                                        <ScannabilityScore state={state} />
                                    </div>

                                    {/* Templates */}
                                    <div className="w-full max-w-[260px]">
                                        <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-2">Templates</p>
                                        <TemplateGallery onApply={applyTemplate} compact />
                                    </div>
                                </div>
                            </div>

                            {/* Mobile: templates + scannability at bottom */}
                            <div className="md:hidden border-t border-gray-100 px-4 py-3 bg-gray-50/40 flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <TemplateGallery onApply={applyTemplate} compact />
                                    </div>
                                    <div className="w-12 flex-shrink-0">
                                        <ScannabilityScore state={state} />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t border-gray-100 px-4 md:px-6 py-3 md:py-3.5 bg-white flex items-center justify-end gap-2 md:gap-2.5 flex-shrink-0">
                                <button
                                    onClick={handleClose}
                                    className="py-2 px-3 md:px-4 text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors rounded-lg hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="py-2.5 px-4 md:px-5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-[13px] font-medium rounded-xl transition-all flex items-center gap-2 shadow-sm"
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
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
