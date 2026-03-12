'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, springGentle } from '@/lib/animations'
import { subDays, format } from 'date-fns'
import {
    ArrowLeft, Copy, ExternalLink,
    Check, Link2, Calendar, Tag, Trash2, Pencil, Folder,
    Globe, Monitor, BarChart3
} from 'lucide-react'
import { getMarketingLink, deleteMarketingLink, updateMarketingLink } from '@/app/actions/marketing-links'
import { toast } from 'sonner'
import { getChannelConfig, PREDEFINED_CHANNELS } from '@/lib/marketing/channels'
import { getTagColor } from '@/lib/marketing/tags'
import { CampaignSelect } from '@/components/marketing/CampaignSelect'
import { FolderSelect } from '@/components/marketing/FolderSelect'
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart'

interface LinkData {
    id: string
    slug: string
    original_url: string
    short_url: string
    clicks: number
    channel: string | null
    campaign: string | null
    campaign_id: string | null
    folder_id: string | null
    created_at: string
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_term: string | null
    utm_content: string | null
    tags: { id: string; name: string; color: string }[]
    Campaign: { id: string; name: string; color: string | null; status: string } | null
    Folder: { id: string; name: string; color: string | null } | null
}

interface KPIData {
    clicks: number
    leads: number
    sales: number
    revenue: number
    timeseries?: Array<{ date: string; clicks: number; leads: number; sales: number; revenue: number }>
}

interface BreakdownItem {
    name: string
    clicks: number
    flag?: string
}

type StatsScope = 'link' | 'campaign' | 'folder' | 'channel' | 'workspace'

const kpiFetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data?.[0] || { clicks: 0, leads: 0, sales: 0, revenue: 0 })
const breakdownFetcher = (url: string) => fetch(url).then(r => r.json()).then(d => d.data || [])

function bucketTimeseriesData(data: KPIData['timeseries'], maxBuckets: number) {
    if (!data || data.length <= maxBuckets) return data || []
    const bucketSize = Math.ceil(data.length / maxBuckets)
    const buckets = []
    for (let i = 0; i < data.length; i += bucketSize) {
        const slice = data.slice(i, i + bucketSize)
        const label = slice.length === 1
            ? slice[0].date
            : `${slice[0].date.slice(5)} - ${slice[slice.length - 1].date.slice(5)}`
        buckets.push({
            date: label,
            clicks: slice.reduce((s, d) => s + d.clicks, 0),
            leads: slice.reduce((s, d) => s + d.leads, 0),
            sales: slice.reduce((s, d) => s + d.sales, 0),
            revenue: slice.reduce((s, d) => s + d.revenue, 0),
        })
    }
    return buckets
}

export default function LinkDetailPage() {
    const t = useTranslations('marketing')
    const router = useRouter()
    const params = useParams()
    const linkId = params.id as string

    const [link, setLink] = useState<LinkData | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [selectedDays, setSelectedDays] = useState(30)
    const [statsScope, setStatsScope] = useState<StatsScope>('link')
    const [activeEventTypes, setActiveEventTypes] = useState<Set<string>>(new Set(['clicks', 'leads', 'sales']))

    useEffect(() => {
        getMarketingLink(linkId).then(res => {
            if (res.success && res.data) {
                setLink(res.data as unknown as LinkData)
            }
            setLoading(false)
        }).catch(() => {
            toast.error('Erreur lors du chargement du lien')
            setLoading(false)
        })
    }, [linkId])

    // Analytics data — build query params based on scope
    const dateFrom = format(subDays(new Date(), selectedDays), 'yyyy-MM-dd')
    const dateTo = format(new Date(), 'yyyy-MM-dd')

    const statsFilter = useMemo(() => {
        if (!link) return ''
        switch (statsScope) {
            case 'campaign': return `campaign_id=${link.campaign_id}`
            case 'folder': return `folder_id=${link.folder_id}`
            case 'channel': return `channel=${link.channel}`
            case 'workspace': return ''
            default: return `link_id=${linkId}`
        }
    }, [statsScope, link, linkId])

    const kpiUrl = link ? `/api/stats/kpi?${statsFilter}${statsFilter ? '&' : ''}date_from=${dateFrom}&date_to=${dateTo}` : null
    const breakdownBase = link ? `/api/stats/breakdown?${statsFilter}${statsFilter ? '&' : ''}` : null

    const { data: kpi, isValidating } = useSWR<KPIData>(
        kpiUrl,
        kpiFetcher,
        { revalidateOnFocus: false }
    )
    const { data: countriesData } = useSWR<BreakdownItem[]>(
        breakdownBase ? `${breakdownBase}dimension=countries` : null,
        breakdownFetcher,
        { revalidateOnFocus: false }
    )
    const { data: devicesData } = useSWR<BreakdownItem[]>(
        breakdownBase ? `${breakdownBase}dimension=devices` : null,
        breakdownFetcher,
        { revalidateOnFocus: false }
    )

    const kpiData = kpi || { clicks: 0, leads: 0, sales: 0, revenue: 0 }
    const displayTimeseries = useMemo(() => bucketTimeseriesData(kpi?.timeseries, 20), [kpi?.timeseries])

    const toggleEventType = useCallback((type: 'clicks' | 'leads' | 'sales') => {
        setActiveEventTypes(prev => {
            if (prev.size === 3) return new Set([type])
            if (prev.size === 1 && prev.has(type)) return new Set(['clicks', 'leads', 'sales'])
            return new Set([type])
        })
    }, [])

    const handleCopy = async () => {
        if (!link) return
        await navigator.clipboard.writeText(link.short_url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDelete = async () => {
        if (!link || !confirm('Supprimer ce lien ?')) return
        const res = await deleteMarketingLink(link.id)
        if (res.success) {
            toast.success('Lien supprime')
            router.push('/dashboard/links')
        } else {
            toast.error(res.error || 'Erreur lors de la suppression')
        }
    }

    const handleUpdateCampaign = async (campaignId: string | null) => {
        if (!link) return
        await updateMarketingLink(link.id, { campaign_id: campaignId || undefined })
        const res = await getMarketingLink(linkId)
        if (res.success && res.data) setLink(res.data as unknown as LinkData)
        setEditingField(null)
    }

    const handleUpdateFolder = async (folderId: string | null) => {
        if (!link) return
        await updateMarketingLink(link.id, { folder_id: folderId || undefined })
        const res = await getMarketingLink(linkId)
        if (res.success && res.data) setLink(res.data as unknown as LinkData)
        setEditingField(null)
    }

    const handleUpdateChannel = async (channel: string) => {
        if (!link) return
        await updateMarketingLink(link.id, { channel: channel || undefined })
        const res = await getMarketingLink(linkId)
        if (res.success && res.data) setLink(res.data as unknown as LinkData)
        setEditingField(null)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 animate-pulse">
                    <div className="h-8 w-48 bg-gray-200 rounded" />
                    <div className="h-4 w-64 bg-gray-100 rounded" />
                </div>
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        )
    }

    if (!link) {
        return (
            <div className="text-center py-20">
                <Link2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('detail.notFound')}</p>
                <button
                    onClick={() => router.push('/dashboard/links')}
                    className="mt-4 text-sm text-purple-600 hover:text-purple-700"
                >
                    {t('create.back')}
                </button>
            </div>
        )
    }

    const channelCfg = getChannelConfig(link.channel)
    const createdDate = new Date(link.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    })

    const utmEntries = [
        { key: 'utm_source', value: link.utm_source },
        { key: 'utm_medium', value: link.utm_medium },
        { key: 'utm_campaign', value: link.utm_campaign },
        { key: 'utm_term', value: link.utm_term },
        { key: 'utm_content', value: link.utm_content },
    ].filter(u => u.value)

    const countries = countriesData || []
    const devices = devicesData || []
    const maxCountry = Math.max(...countries.map(c => c.clicks), 1)
    const maxDevice = Math.max(...devices.map(d => d.clicks), 1)

    return (
        <motion.div
            className="space-y-6 max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            {/* Back */}
            <button
                onClick={() => router.push('/dashboard/links')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('detail.backToLinks')}
            </button>

            {/* Header Card */}
            <motion.div variants={fadeInUp} transition={springGentle} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl ${channelCfg.color} flex items-center justify-center`}>
                            <ExternalLink className={`w-5 h-5 ${channelCfg.textColor}`} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl font-bold text-gray-900">/{link.slug}</h1>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${channelCfg.color} ${channelCfg.textColor}`}>
                                    {channelCfg.label}
                                </span>
                                {link.Campaign && (
                                    <span
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                                        style={{
                                            backgroundColor: link.Campaign.color ? `${link.Campaign.color}20` : '#f3f4f6',
                                            color: link.Campaign.color || '#6B7280',
                                        }}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: link.Campaign.color || '#6B7280' }} />
                                        {link.Campaign.name}
                                    </span>
                                )}
                                {link.tags?.map(tag => {
                                    const tc = getTagColor(tag.color)
                                    return (
                                        <span
                                            key={tag.id}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tc.bg} ${tc.text}`}
                                        >
                                            <span className={`w-2 h-2 rounded-full ${tc.dot}`} />
                                            {tag.name}
                                        </span>
                                    )
                                })}
                            </div>
                            <p className="text-sm text-gray-400 mt-0.5 truncate max-w-lg">{link.original_url}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {createdDate}</span>
                                <span className="flex items-center gap-1"><Link2 className="w-3 h-3" /> {link.short_url}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copied ? t('detail.copied') : t('links.copy')}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Stats Scope Selector */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs text-gray-400 mr-1">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Stats :</span>
                    </div>
                    <button
                        onClick={() => setStatsScope('link')}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                            statsScope === 'link'
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Ce lien
                    </button>
                    {link.campaign_id && link.Campaign && (
                        <button
                            onClick={() => setStatsScope('campaign')}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                                statsScope === 'campaign'
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: statsScope === 'campaign' ? 'white' : (link.Campaign.color || '#6B7280') }}
                            />
                            {link.Campaign.name}
                        </button>
                    )}
                    {link.folder_id && link.Folder && (
                        <button
                            onClick={() => setStatsScope('folder')}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5 ${
                                statsScope === 'folder'
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            <Folder className="w-3 h-3" />
                            {link.Folder.name}
                        </button>
                    )}
                    {link.channel && (
                        <button
                            onClick={() => setStatsScope('channel')}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                                statsScope === 'channel'
                                    ? 'bg-gray-900 text-white shadow-sm'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                            }`}
                        >
                            {getChannelConfig(link.channel).label}
                        </button>
                    )}
                    <button
                        onClick={() => setStatsScope('workspace')}
                        className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                            statsScope === 'workspace'
                                ? 'bg-gray-900 text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Tous les liens
                    </button>
                </div>
            </motion.div>

            {/* Analytics Funnel */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <AnalyticsChart
                    clicks={kpiData.clicks}
                    leads={kpiData.leads}
                    sales={kpiData.sales}
                    revenue={kpiData.revenue}
                    timeseries={displayTimeseries}
                    activeEventTypes={activeEventTypes}
                    onEventTypeToggle={toggleEventType}
                    selectedDays={selectedDays}
                    onRangeChange={setSelectedDays}
                    loadingTimeseries={isValidating}
                />
            </motion.div>

            {/* Breakdown Cards */}
            <motion.div variants={fadeInUp} transition={springGentle} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Countries */}
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">Pays</h3>
                        <span className="ml-auto text-[11px] text-gray-400 font-medium uppercase">Clicks</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                        {countries.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Aucune donnee</p>
                        ) : countries.map((item) => (
                            <div key={item.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base leading-none">{item.flag}</span>
                                        <span className="text-[13px] font-medium text-gray-700">{item.name}</span>
                                    </div>
                                    <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{item.clicks.toLocaleString()}</span>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gray-300 transition-all duration-700 ease-out"
                                        style={{ width: `${Math.max((item.clicks / maxCountry) * 100, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Devices */}
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-700">Appareils</h3>
                        <span className="ml-auto text-[11px] text-gray-400 font-medium uppercase">Clicks</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                        {devices.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">Aucune donnee</p>
                        ) : devices.map((item) => (
                            <div key={item.name}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[13px] font-medium text-gray-700">{item.name}</span>
                                    <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{item.clicks.toLocaleString()}</span>
                                </div>
                                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gray-300 transition-all duration-700 ease-out"
                                        style={{ width: `${Math.max((item.clicks / maxDevice) * 100, 2)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Editable Properties */}
            <motion.div variants={fadeInUp} transition={springGentle} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">{t('detail.properties')}</h2>
                <div className="space-y-3">
                    {/* Campaign */}
                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Tag className="w-4 h-4" />
                            <span>{t('campaigns.label')}</span>
                        </div>
                        {editingField === 'campaign' ? (
                            <div className="w-64">
                                <CampaignSelect
                                    value={link.campaign_id}
                                    onChange={(id) => handleUpdateCampaign(id)}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingField('campaign')}
                                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 group/edit"
                            >
                                {link.Campaign ? (
                                    <span
                                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: link.Campaign.color ? `${link.Campaign.color}20` : '#f3f4f6',
                                            color: link.Campaign.color || '#6B7280',
                                        }}
                                    >
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: link.Campaign.color || '#6B7280' }} />
                                        {link.Campaign.name}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">{t('campaigns.none')}</span>
                                )}
                                <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>

                    {/* Folder */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Folder className="w-4 h-4" />
                            <span>{t('folders.label')}</span>
                        </div>
                        {editingField === 'folder' ? (
                            <div className="w-64">
                                <FolderSelect
                                    value={link.folder_id}
                                    onChange={(id) => handleUpdateFolder(id)}
                                />
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingField('folder')}
                                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 group/edit"
                            >
                                {link.Folder ? (
                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        <Folder className="w-2.5 h-2.5" />
                                        {link.Folder.name}
                                    </span>
                                ) : (
                                    <span className="text-gray-400">{t('folders.none')}</span>
                                )}
                                <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>

                    {/* Channel */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <ExternalLink className="w-4 h-4" />
                            <span>{t('create.channel')}</span>
                        </div>
                        {editingField === 'channel' ? (
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {PREDEFINED_CHANNELS.filter(c => c.id !== 'other').map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => handleUpdateChannel(ch.id)}
                                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                                            link.channel === ch.id
                                                ? `${ch.color} ${ch.textColor}`
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {ch.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setEditingField(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                    <Check className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditingField('channel')}
                                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 group/edit"
                            >
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${channelCfg.color} ${channelCfg.textColor}`}>
                                    {channelCfg.label}
                                </span>
                                <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* UTM Parameters */}
            {utmEntries.length > 0 && (
                <motion.div variants={fadeInUp} transition={springGentle} className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">{t('detail.utmParameters')}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {utmEntries.map(u => (
                            <div key={u.key} className="bg-gray-50 rounded-lg px-3 py-2">
                                <p className="text-[10px] font-medium text-gray-400 uppercase">{u.key}</p>
                                <p className="text-sm text-gray-700 font-medium">{u.value}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Short URL */}
            <motion.div variants={fadeInUp} transition={springGentle} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3">{t('detail.shortUrl')}</h2>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                    <Link2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm font-mono text-gray-700 flex-1 truncate">{link.short_url}</span>
                    <button
                        onClick={handleCopy}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex-shrink-0"
                    >
                        {copied ? t('detail.copied') : t('links.copy')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}
