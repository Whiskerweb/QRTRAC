import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Simple seeded random for deterministic mock data
function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 16807 + 0) % 2147483647
        return (s - 1) / 2147483646
    }
}

export async function GET(request: NextRequest) {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateFromParam = searchParams.get('date_from')
    const dateToParam = searchParams.get('date_to')

    const now = new Date()
    const dateTo = dateToParam ? new Date(dateToParam) : now
    const dateFrom = dateFromParam ? new Date(dateFromParam) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const daysDiff = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)))

    // Generate deterministic timeseries based on date
    const timeseries = []
    const seed = dateFrom.getFullYear() * 10000 + (dateFrom.getMonth() + 1) * 100 + dateFrom.getDate()
    const rand = seededRandom(seed)

    for (let i = 0; i < daysDiff; i++) {
        const date = new Date(dateFrom)
        date.setDate(date.getDate() + i)

        // Weekdays get more traffic
        const dayOfWeek = date.getDay()
        const weekdayMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.4 : 1.0

        // Slight upward trend over time
        const trendMultiplier = 1 + (i / daysDiff) * 0.3

        const baseClicks = Math.floor((rand() * 80 + 40) * weekdayMultiplier * trendMultiplier)
        const baseLeads = Math.floor(baseClicks * (rand() * 0.15 + 0.08))
        const baseSales = Math.floor(baseClicks * (rand() * 0.06 + 0.02))
        const baseRevenue = baseSales * Math.floor(rand() * 4500 + 1500)

        timeseries.push({
            date: date.toISOString().split('T')[0],
            clicks: baseClicks,
            leads: baseLeads,
            sales: baseSales,
            revenue: baseRevenue,
        })
    }

    // Calculate totals
    const totals = timeseries.reduce(
        (acc, day) => ({
            clicks: acc.clicks + day.clicks,
            leads: acc.leads + day.leads,
            sales: acc.sales + day.sales,
            revenue: acc.revenue + day.revenue,
        }),
        { clicks: 0, leads: 0, sales: 0, revenue: 0 }
    )

    const conversion_rate = totals.clicks > 0
        ? parseFloat(((totals.sales / totals.clicks) * 100).toFixed(2))
        : 0

    return NextResponse.json({
        data: [{
            ...totals,
            conversion_rate,
            timeseries,
        }],
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
    })
}
