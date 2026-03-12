'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { fadeInUp, staggerContainer, springGentle } from '@/lib/animations'
import {
    Globe,
    TrendingUp,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getMarketingLinks } from '@/app/actions/marketing-links'
import { getChannelConfig } from '@/lib/marketing/channels'
import { AnalyticsChart } from '@/components/dashboard/AnalyticsChart'

interface LinkData {
    id: string
    slug: string
    clicks: number
    channel: string | null
    campaign: string | null
    campaign_id: string | null
}

function formatNumber(n: number): string {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toLocaleString()
}

function ChannelBar({ label, icon, color, count, total }: {
    label: string; icon: React.ReactNode; color: string; count: number; total: number
}) {
    const pct = total > 0 ? (count / total) * 100 : 0
    return (
        <div className="group">
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shadow-sm`}>
                        {icon}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700">{label}</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-[13px] font-semibold text-gray-900 tabular-nums">{count.toLocaleString()}</span>
                    <span className="text-[11px] text-gray-400 tabular-nums">{pct.toFixed(0)}%</span>
                </div>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full ${color} transition-all duration-700 ease-out`}
                    style={{ width: `${Math.max(pct, 1)}%` }}
                />
            </div>
        </div>
    )
}

function CampaignItem({ name, clicks, maxClicks }: { name: string; clicks: number; maxClicks: number }) {
    const pct = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0
    return (
        <div className="group relative flex items-center justify-between px-4 py-2.5">
            <div
                className="absolute inset-y-0 left-0 bg-gray-100/40 transition-all duration-500 ease-out"
                style={{ width: `${Math.min(pct * 0.55, 55)}%` }}
            />
            <span className="relative text-[13px] text-gray-700 font-medium">{name}</span>
            <span className="relative text-[13px] text-gray-400 font-medium tabular-nums">
                {formatNumber(clicks)}
            </span>
        </div>
    )
}

export default function AnalyticsPage() {
    const t = useTranslations('marketing')

    const [marketingLinks, setMarketingLinks] = useState<LinkData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getMarketingLinks().then(res => {
            if (res.success) setMarketingLinks(res.data as unknown as LinkData[])
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const totalClicks = useMemo(() => marketingLinks.reduce((sum, l) => sum + l.clicks, 0), [marketingLinks])

    const channelBreakdown = useMemo(() => {
        const map = new Map<string, number>()
        for (const link of marketingLinks) {
            const ch = link.channel || 'other'
            map.set(ch, (map.get(ch) || 0) + link.clicks)
        }
        return Array.from(map.entries())
            .map(([channel, clicks]) => ({ channel, clicks, config: getChannelConfig(channel) }))
            .sort((a, b) => b.clicks - a.clicks)
    }, [marketingLinks])

    const campaignBreakdown = useMemo(() => {
        const map = new Map<string, { clicks: number; id: string | null }>()
        for (const link of marketingLinks) {
            if (link.campaign) {
                const existing = map.get(link.campaign) || { clicks: 0, id: link.campaign_id }
                existing.clicks += link.clicks
                if (!existing.id && link.campaign_id) existing.id = link.campaign_id
                map.set(link.campaign, existing)
            }
        }
        return Array.from(map.entries())
            .map(([name, { clicks }]) => ({ name, clicks }))
            .sort((a, b) => b.clicks - a.clicks)
    }, [marketingLinks])

    const maxCampaign = Math.max(...campaignBreakdown.map(c => c.clicks), 1)

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                    <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                </div>
            </div>
        )
    }

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
        >
            {/* Header */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">{t('analytics.title')}</h1>
                <p className="text-[13px] text-gray-400 mt-0.5">{t('analytics.subtitle')}</p>
            </motion.div>

            {/* Total Clicks */}
            <motion.div variants={fadeInUp} transition={springGentle}>
                <AnalyticsChart clicks={totalClicks} />
            </motion.div>

            {/* Channel & Campaign Breakdowns */}
            <motion.div variants={fadeInUp} transition={springGentle} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Channels */}
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-6 shadow-sm shadow-black/[0.02]">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-gray-900">{t('analytics.byChannel')}</h2>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">CLICKS</span>
                    </div>
                    {channelBreakdown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                                <TrendingUp className="w-4 h-4 text-gray-300" />
                            </div>
                            <p className="text-[13px] text-gray-400">{t('analytics.noData')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {channelBreakdown.map(({ channel, clicks, config }) => (
                                <ChannelBar
                                    key={channel}
                                    label={config.label}
                                    icon={<Globe className={`w-3.5 h-3.5 ${config.textColor}`} />}
                                    color={config.color}
                                    count={clicks}
                                    total={totalClicks}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Campaigns */}
                <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm shadow-black/[0.02]">
                    <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900">{t('analytics.byCampaign')}</h2>
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">CLICKS</span>
                    </div>
                    {campaignBreakdown.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-6">
                            <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                                <TrendingUp className="w-4 h-4 text-gray-300" />
                            </div>
                            <p className="text-[13px] text-gray-400">{t('analytics.noData')}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50/80">
                            {campaignBreakdown.map(({ name, clicks }) => (
                                <CampaignItem
                                    key={name}
                                    name={name}
                                    clicks={clicks}
                                    maxClicks={maxCampaign}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}
