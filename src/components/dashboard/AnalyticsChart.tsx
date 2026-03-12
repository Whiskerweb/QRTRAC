'use client'

import NumberFlow from '@number-flow/react'
import { MousePointerClick } from 'lucide-react'

interface AnalyticsChartProps {
    clicks: number
}

export function AnalyticsChart({ clicks }: AnalyticsChartProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                        <MousePointerClick className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Clicks</p>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">
                            <NumberFlow value={clicks} />
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
