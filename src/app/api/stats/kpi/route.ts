import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWorkspace } from '@/lib/workspace'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await getCurrentUserWorkspace()
    if (!workspace) {
        return NextResponse.json({ error: 'No workspace' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('link_id')
    const campaignId = searchParams.get('campaign_id')
    const folderId = searchParams.get('folder_id')
    const channel = searchParams.get('channel')

    const admin = createAdminClient()
    let totalClicks = 0

    if (linkId) {
        // Single link
        const { data } = await admin
            .from('ShortLink')
            .select('clicks')
            .eq('id', linkId)
            .eq('workspace_id', workspace.workspaceId)
            .single()
        totalClicks = data?.clicks || 0
    } else {
        // Build query for aggregation
        let query = admin
            .from('ShortLink')
            .select('clicks')
            .eq('workspace_id', workspace.workspaceId)
            .eq('link_type', 'marketing')

        if (campaignId) query = query.eq('campaign_id', campaignId)
        if (folderId) query = query.eq('folder_id', folderId)
        if (channel) query = query.eq('channel', channel)

        const { data: links } = await query
        totalClicks = (links || []).reduce((sum, l) => sum + (l.clicks || 0), 0)
    }

    return NextResponse.json({
        data: [{
            clicks: totalClicks,
            leads: 0,
            sales: 0,
            revenue: 0,
            conversion_rate: 0,
            timeseries: [],
        }],
    }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    })
}
