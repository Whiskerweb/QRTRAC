'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Plus, Search, Copy, Trash2, ExternalLink, Link2, Check,
    MousePointerClick, ChevronDown, AlertCircle, RefreshCw
} from 'lucide-react'
import { getMarketingLinks, getMarketingOverview, deleteMarketingLink } from '@/app/actions/marketing-links'
import { getMarketingCampaignList } from '@/app/actions/marketing-campaigns'
import { CreateLinkModal } from '@/components/marketing/CreateLinkModal'
import { toast } from 'sonner'

interface MarketingLink {
    id: string
    slug: string
    original_url: string
    short_url: string
    clicks: number
    channel: string | null
    campaign: string | null
    campaign_id: string | null
    folder_id: string | null
    created_at: Date
    tags: { id: string; name: string; color: string }[]
    Campaign: { id: string; name: string; color: string | null; status: string } | null
    Folder: { id: string; name: string; color: string | null } | null
}

interface CampaignData {
    id: string
    name: string
    color: string | null
    status: string
    linkCount: number
    totalClicks: number
}

export default function LinksPage() {
    const t = useTranslations('marketing')
    const router = useRouter()
    const searchParams = useSearchParams()
    const [links, setLinks] = useState<MarketingLink[]>([])
    const [loading, setLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | false>(false)
    const [search, setSearch] = useState('')
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(searchParams.get('campaign_id'))
    const [campaigns, setCampaigns] = useState<CampaignData[]>([])
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [totalClicks, setTotalClicks] = useState(0)
    const [totalLinks, setTotalLinks] = useState(0)
    const [campaignDropdownOpen, setCampaignDropdownOpen] = useState(false)

    // Load overview stats
    useEffect(() => {
        getMarketingOverview().then(res => {
            if (res.success && res.data) {
                const d = res.data as { totalClicks: number; totalLinks: number }
                setTotalClicks(d.totalClicks)
                setTotalLinks(d.totalLinks)
            }
        })
    }, [])

    // Load campaigns
    const loadCampaigns = useCallback(async () => {
        const res = await getMarketingCampaignList()
        if (res.success && res.data) {
            setCampaigns(res.data as unknown as CampaignData[])
        }
    }, [])
    useEffect(() => { loadCampaigns() }, [loadCampaigns])

    const loadLinks = useCallback(async () => {
        try {
            setLoadError(false)
            const res = await getMarketingLinks({
                search: search || undefined,
                campaign_id: activeCampaignId || undefined,
            })
            if (res.success) {
                setLinks(res.data as unknown as MarketingLink[])
            } else {
                console.error('[links] getMarketingLinks failed:', res.error)
                setLoadError(res.error || 'Unknown error')
            }
        } catch (err) {
            console.error('[links] loadLinks exception:', err)
            setLoadError(err instanceof Error ? err.message : 'Exception')
        } finally {
            setLoading(false)
        }
    }, [search, activeCampaignId])

    useEffect(() => {
        setLoading(true)
        const timeout = setTimeout(loadLinks, 300)
        return () => clearTimeout(timeout)
    }, [loadLinks])

    const handleCopy = async (link: MarketingLink) => {
        await navigator.clipboard.writeText(link.short_url)
        setCopiedId(link.id)
        toast.success('Lien copié')
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce lien ?')) return
        setDeletingId(id)
        try {
            const res = await deleteMarketingLink(id)
            if (res.success) {
                setLinks(prev => prev.filter(l => l.id !== id))
                setTotalLinks(prev => prev - 1)
                toast.success('Lien supprimé')
            } else {
                toast.error(res.error || 'Erreur lors de la suppression')
            }
        } catch {
            toast.error('Erreur lors de la suppression')
        }
        setDeletingId(null)
    }

    const refreshData = () => {
        setIsCreateModalOpen(false)
        loadLinks()
        loadCampaigns()
        getMarketingOverview().then(res => {
            if (res.success && res.data) {
                const d = res.data as { totalClicks: number; totalLinks: number }
                setTotalClicks(d.totalClicks)
                setTotalLinks(d.totalLinks)
            }
        })
    }

    const formatDate = (date: Date) => {
        const d = new Date(date)
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }

    const truncateUrl = (url: string, max = 40) => {
        try {
            const u = new URL(url)
            const path = u.pathname + u.search
            const display = u.hostname + (path.length > 1 ? path : '')
            return display.length > max ? display.slice(0, max) + '…' : display
        } catch {
            return url.length > max ? url.slice(0, max) + '…' : url
        }
    }

    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
    const selectedCampaign = activeCampaignId
        ? campaigns.find(c => c.id === activeCampaignId)
        : null

    return (
        <div className="space-y-5 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">{t('links.title')}</h1>
                    <p className="text-[13px] text-gray-400 mt-0.5">
                        {totalLinks} {t('links.linksCount')} · {totalClicks.toLocaleString()} clics
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    {t('createLink')}
                </button>
            </div>

            {/* Search + Campaign filter */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('links.searchPlaceholder')}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all"
                    />
                </div>

                {/* Campaign filter dropdown */}
                {activeCampaigns.length > 0 && (
                    <div className="relative">
                        <button
                            onClick={() => setCampaignDropdownOpen(!campaignDropdownOpen)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[13px] font-medium transition-all ${
                                activeCampaignId
                                    ? 'border-gray-300 bg-gray-50 text-gray-900'
                                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                            }`}
                        >
                            {selectedCampaign ? (
                                <>
                                    <span
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: selectedCampaign.color || '#6B7280' }}
                                    />
                                    <span className="max-w-[120px] truncate">{selectedCampaign.name}</span>
                                </>
                            ) : (
                                <span>Campagne</span>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${campaignDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {campaignDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setCampaignDropdownOpen(false)} />
                                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
                                    <button
                                        onClick={() => { setActiveCampaignId(null); setCampaignDropdownOpen(false) }}
                                        className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                                            !activeCampaignId ? 'text-gray-900 font-medium' : 'text-gray-500'
                                        }`}
                                    >
                                        Toutes les campagnes
                                    </button>
                                    {activeCampaigns.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => { setActiveCampaignId(c.id); setCampaignDropdownOpen(false) }}
                                            className={`w-full text-left px-3 py-2 text-[13px] hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                                activeCampaignId === c.id ? 'text-gray-900 font-medium' : 'text-gray-600'
                                            }`}
                                        >
                                            <span
                                                className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: c.color || '#6B7280' }}
                                            />
                                            <span className="truncate">{c.name}</span>
                                            <span className="ml-auto text-[11px] text-gray-400 tabular-nums">{c.linkCount}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Links list */}
            {loading ? (
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                            <div className="w-9 h-9 rounded-lg bg-gray-100 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-28 rounded bg-gray-100 animate-pulse" />
                                <div className="h-3 w-44 rounded bg-gray-100 animate-pulse" />
                            </div>
                            <div className="h-4 w-12 rounded bg-gray-100 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : loadError ? (
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Erreur de chargement</h3>
                    <p className="text-[13px] text-gray-500 mb-1">Impossible de charger les liens.</p>
                    {typeof loadError === 'string' && (
                        <p className="text-[11px] text-red-400 mb-4 font-mono">{loadError}</p>
                    )}
                    <button
                        onClick={() => { setLoading(true); loadLinks() }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Réessayer
                    </button>
                </div>
            ) : !links.length ? (
                <div className="bg-white rounded-xl border border-gray-200 px-6 py-20 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Link2 className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-900 mb-1">{t('links.empty')}</h3>
                    <p className="text-[13px] text-gray-400 mb-5 max-w-xs mx-auto">{t('links.emptyDesc')}</p>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-[13px] font-medium rounded-xl hover:bg-gray-800 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        {t('overview.createFirst')}
                    </button>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {links.map((link) => {
                        const isCopied = copiedId === link.id
                        const isDeleting = deletingId === link.id

                        return (
                            <div
                                key={link.id}
                                className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                            >
                                <div className="flex items-center gap-3.5 px-4 py-3">
                                    {/* Icon */}
                                    <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                                        <ExternalLink className="w-4 h-4 text-gray-400" />
                                    </div>

                                    {/* Link info */}
                                    <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() => router.push(`/dashboard/links/${link.id}`)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <p className="text-[13px] font-semibold text-gray-900 truncate">
                                                /{link.slug}
                                            </p>
                                            {link.Campaign && (
                                                <span
                                                    className="hidden sm:inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{
                                                        backgroundColor: link.Campaign.color ? `${link.Campaign.color}15` : '#f3f4f6',
                                                        color: link.Campaign.color || '#6B7280',
                                                    }}
                                                >
                                                    <span
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: link.Campaign.color || '#6B7280' }}
                                                    />
                                                    {link.Campaign.name}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-gray-400 truncate mt-0.5">
                                            {truncateUrl(link.original_url)}
                                        </p>
                                    </div>

                                    {/* Clicks */}
                                    <div className="flex items-center gap-1.5 flex-shrink-0 mr-1">
                                        <MousePointerClick className="w-3 h-3 text-gray-300" />
                                        <span className="text-[12px] font-semibold text-gray-600 tabular-nums">
                                            {link.clicks.toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <span className="hidden sm:block text-[11px] text-gray-300 tabular-nums flex-shrink-0 w-14 text-right">
                                        {formatDate(link.created_at)}
                                    </span>

                                    {/* Actions */}
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button
                                            onClick={() => handleCopy(link)}
                                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="Copier le lien"
                                        >
                                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id)}
                                            disabled={isDeleting}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <CreateLinkModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={refreshData}
            />
        </div>
    )
}
