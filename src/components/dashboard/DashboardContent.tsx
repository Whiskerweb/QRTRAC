'use client'

import { useState, useCallback } from 'react'
import { QrCode, ScanLine, Star } from 'lucide-react'
import { QRCodeGrid } from './QRCodeGrid'
import { QRFolderSidebar } from './QRFolderSidebar'

interface DashboardContentProps {
    initialQrCount: number
    initialScanTotal: number
    initialFavCount: number
}

export function DashboardContent({ initialQrCount, initialScanTotal, initialFavCount }: DashboardContentProps) {
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null)
    const [qrCount, setQrCount] = useState(initialQrCount)
    const [scanTotal, setScanTotal] = useState(initialScanTotal)
    const [favCount, setFavCount] = useState(initialFavCount)

    const handleQrCountChange = useCallback((total: number, scans: number, favs: number) => {
        setQrCount(total)
        setScanTotal(scans)
        setFavCount(favs)
    }, [])

    const stats = [
        {
            label: 'QR codes',
            value: qrCount,
            icon: QrCode,
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-700',
        },
        {
            label: 'Total scans',
            value: scanTotal,
            icon: ScanLine,
            bgColor: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Favoris',
            value: favCount,
            icon: Star,
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-500',
        },
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Mes QR Codes</h1>
                <p className="text-[13px] text-gray-400 mt-1">
                    Gérez, éditez et téléchargez vos QR codes
                </p>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-3">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className={`w-9 h-9 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${stat.iconColor}`} strokeWidth={1.8} />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-gray-900 leading-tight tabular-nums">{stat.value}</p>
                                <p className="text-[11px] text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* 2-column layout: folder sidebar + grid */}
            <div className="flex gap-6">
                {/* Folder Sidebar — hidden on mobile */}
                <div className="hidden md:block flex-shrink-0">
                    <div className="w-[220px] bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden sticky top-24">
                        <QRFolderSidebar
                            activeFolderId={activeFolderId}
                            onSelectFolder={setActiveFolderId}
                            totalQrCount={qrCount}
                        />
                    </div>
                </div>

                {/* QR Grid */}
                <div className="flex-1 min-w-0">
                    <QRCodeGrid
                        activeFolderId={activeFolderId}
                        onQrCountChange={handleQrCountChange}
                    />
                </div>
            </div>
        </div>
    )
}
