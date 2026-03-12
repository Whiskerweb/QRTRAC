import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MOCK_DATA: Record<string, Array<Record<string, unknown>>> = {
    countries: [
        { name: 'France', flag: '\u{1F1EB}\u{1F1F7}', clicks: 847 },
        { name: 'United States', flag: '\u{1F1FA}\u{1F1F8}', clicks: 423 },
        { name: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', clicks: 312 },
        { name: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', clicks: 189 },
        { name: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', clicks: 145 },
        { name: 'Morocco', flag: '\u{1F1F2}\u{1F1E6}', clicks: 98 },
        { name: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}', clicks: 76 },
        { name: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', clicks: 64 },
        { name: 'Switzerland', flag: '\u{1F1E8}\u{1F1ED}', clicks: 52 },
        { name: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', clicks: 41 },
    ],
    cities: [
        { name: 'Paris', country: 'France', flag: '\u{1F1EB}\u{1F1F7}', clicks: 420 },
        { name: 'New York', country: 'United States', flag: '\u{1F1FA}\u{1F1F8}', clicks: 235 },
        { name: 'Berlin', country: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', clicks: 188 },
        { name: 'Lyon', country: 'France', flag: '\u{1F1EB}\u{1F1F7}', clicks: 147 },
        { name: 'London', country: 'United Kingdom', flag: '\u{1F1EC}\u{1F1E7}', clicks: 144 },
        { name: 'Marseille', country: 'France', flag: '\u{1F1EB}\u{1F1F7}', clicks: 98 },
        { name: 'Madrid', country: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', clicks: 87 },
        { name: 'Casablanca', country: 'Morocco', flag: '\u{1F1F2}\u{1F1E6}', clicks: 65 },
        { name: 'Bordeaux', country: 'France', flag: '\u{1F1EB}\u{1F1F7}', clicks: 54 },
        { name: 'Brussels', country: 'Belgium', flag: '\u{1F1E7}\u{1F1EA}', clicks: 48 },
    ],
    devices: [
        { name: 'Desktop', clicks: 1245 },
        { name: 'Mobile', clicks: 871 },
        { name: 'Tablet', clicks: 131 },
    ],
    browsers: [
        { name: 'Chrome', clicks: 992 },
        { name: 'Safari', clicks: 634 },
        { name: 'Firefox', clicks: 287 },
        { name: 'Edge', clicks: 156 },
        { name: 'Other', clicks: 47 },
    ],
    os: [
        { name: 'Windows', clicks: 678 },
        { name: 'macOS', clicks: 489 },
        { name: 'iOS', clicks: 512 },
        { name: 'Android', clicks: 359 },
        { name: 'Linux', clicks: 78 },
    ],
}

function hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash)
}

export async function GET(request: NextRequest) {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dimension = searchParams.get('dimension') || 'countries'
    const source = searchParams.get('source')
    const linkId = searchParams.get('link_id')
    const campaignId = searchParams.get('campaign_id')
    const folderId = searchParams.get('folder_id')
    const channel = searchParams.get('channel')

    // Determine scale and hash based on scope
    let scale = source === 'marketing' ? 0.3 : 1
    let scopeHash = 0
    let isScoped = false

    if (linkId) {
        scale *= 0.15
        scopeHash = hashString(linkId)
        isScoped = true
    } else if (campaignId) {
        scale *= 0.5
        scopeHash = hashString(campaignId)
        isScoped = true
    } else if (folderId) {
        scale *= 0.4
        scopeHash = hashString(folderId)
        isScoped = true
    } else if (channel) {
        scale *= 0.4
        scopeHash = hashString(channel)
        isScoped = true
    }

    let data = (MOCK_DATA[dimension] || []).map((item, idx) => ({
        ...item,
        clicks: Math.max(1, Math.floor((item.clicks as number) * scale * (isScoped ? (0.5 + ((scopeHash + idx * 37) % 100) / 100) : 1))),
    }))

    // For scoped views (not workspace-wide), return fewer items
    if (linkId) {
        data = data.slice(0, 5)
    } else if (isScoped) {
        data = data.slice(0, 7)
    }

    return NextResponse.json({
        data,
        dimension,
    }, {
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        }
    })
}
