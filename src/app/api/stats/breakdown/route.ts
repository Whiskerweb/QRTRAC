import { NextResponse, NextRequest } from 'next/server'
import { getCurrentUserWorkspace } from '@/lib/workspace'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    executeTinybirdSQL,
    isTinybirdConfigured,
    sanitizeUUID,
    sanitizeDateString,
    buildClicksFilterSQL,
    COUNTRY_FLAGS,
} from '@/lib/tinybird'

export const dynamic = 'force-dynamic'

async function getLinkIdsForScope(
    wsId: string,
    params: { linkId?: string | null; campaignId?: string | null; folderId?: string | null; channel?: string | null }
): Promise<string[] | null> {
    const { linkId, campaignId, folderId, channel } = params
    if (linkId) return [linkId]
    if (!campaignId && !folderId && !channel) return null

    const admin = createAdminClient()
    let query = admin.from('ShortLink').select('id').eq('workspace_id', wsId)
    if (campaignId) query = query.eq('campaign_id', campaignId)
    if (folderId) query = query.eq('folder_id', folderId)
    if (channel) query = query.eq('channel', channel)
    const { data } = await query
    return (data || []).map((l: { id: string }) => l.id)
}

function buildLinkIdFilter(linkIds: string[] | null): string {
    if (!linkIds) return ''
    if (linkIds.length === 0) return 'AND 1=0'
    const escaped = linkIds.map(id => `'${sanitizeUUID(id) || ''}'`).join(',')
    return `AND link_id IN (${escaped})`
}

type Dimension = 'countries' | 'cities' | 'devices' | 'browsers' | 'os'

function buildDimensionSQL(dimension: Dimension, baseWhere: string, linkFilter: string, crossFilter: string): string {
    switch (dimension) {
        case 'countries':
            return `SELECT country as name, count() as clicks FROM clicks WHERE ${baseWhere} ${linkFilter} ${crossFilter} AND country != '' GROUP BY country ORDER BY clicks DESC LIMIT 10 FORMAT JSON`
        case 'cities':
            return `SELECT city as name, country, count() as clicks FROM clicks WHERE ${baseWhere} ${linkFilter} ${crossFilter} AND city != '' GROUP BY city, country ORDER BY clicks DESC LIMIT 10 FORMAT JSON`
        case 'devices':
            return `SELECT device as name, count() as clicks FROM clicks WHERE ${baseWhere} ${linkFilter} ${crossFilter} AND device != '' GROUP BY device ORDER BY clicks DESC FORMAT JSON`
        case 'browsers':
            return `SELECT
                CASE
                    WHEN positionCaseInsensitive(user_agent, 'Edg') > 0 THEN 'Edge'
                    WHEN positionCaseInsensitive(user_agent, 'OPR') > 0 OR positionCaseInsensitive(user_agent, 'Opera') > 0 THEN 'Opera'
                    WHEN positionCaseInsensitive(user_agent, 'Firefox') > 0 THEN 'Firefox'
                    WHEN positionCaseInsensitive(user_agent, 'Chrome') > 0 THEN 'Chrome'
                    WHEN positionCaseInsensitive(user_agent, 'Safari') > 0 THEN 'Safari'
                    ELSE 'Other'
                END as name,
                count() as clicks
                FROM clicks WHERE ${baseWhere} ${linkFilter} ${crossFilter}
                GROUP BY name ORDER BY clicks DESC FORMAT JSON`
        case 'os':
            return `SELECT
                CASE
                    WHEN positionCaseInsensitive(user_agent, 'iPhone') > 0 OR positionCaseInsensitive(user_agent, 'iPad') > 0 THEN 'iOS'
                    WHEN positionCaseInsensitive(user_agent, 'Android') > 0 THEN 'Android'
                    WHEN positionCaseInsensitive(user_agent, 'Mac OS X') > 0 OR positionCaseInsensitive(user_agent, 'Macintosh') > 0 THEN 'macOS'
                    WHEN positionCaseInsensitive(user_agent, 'Windows') > 0 THEN 'Windows'
                    WHEN positionCaseInsensitive(user_agent, 'Linux') > 0 THEN 'Linux'
                    ELSE 'Other'
                END as name,
                count() as clicks
                FROM clicks WHERE ${baseWhere} ${linkFilter} ${crossFilter}
                GROUP BY name ORDER BY clicks DESC FORMAT JSON`
    }
}

export async function GET(request: NextRequest) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dimension = (searchParams.get('dimension') || 'countries') as Dimension
    const linkId = searchParams.get('link_id')
    const campaignId = searchParams.get('campaign_id')
    const folderId = searchParams.get('folder_id')
    const channel = searchParams.get('channel')
    const dateFromParam = searchParams.get('date_from')
    const dateToParam = searchParams.get('date_to')

    if (!isTinybirdConfigured()) {
        return NextResponse.json({ data: [], dimension }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }

    const wsId = sanitizeUUID(workspace.workspaceId)
    if (!wsId) {
        return NextResponse.json({ data: [], dimension }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }

    const now = new Date()
    const dateTo = sanitizeDateString(dateToParam) || now.toISOString().split('T')[0]
    const dateFrom = sanitizeDateString(dateFromParam) || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Cross-filtering: exclude the current dimension from filters to avoid double-filtering
    const crossFilterParams: Record<string, string | undefined> = {
        country: searchParams.get('country') || undefined,
        city: searchParams.get('city') || undefined,
        region: searchParams.get('region') || undefined,
        continent: searchParams.get('continent') || undefined,
        device: searchParams.get('device') || undefined,
        browser: searchParams.get('browser') || undefined,
        os: searchParams.get('os') || undefined,
    }
    // Remove current dimension from cross-filter
    if (dimension === 'countries') { delete crossFilterParams.country; delete crossFilterParams.continent }
    if (dimension === 'cities') { delete crossFilterParams.city; delete crossFilterParams.region }
    if (dimension === 'devices') delete crossFilterParams.device
    if (dimension === 'browsers') delete crossFilterParams.browser
    if (dimension === 'os') delete crossFilterParams.os

    const crossFilter = buildClicksFilterSQL(crossFilterParams)
    const linkIds = await getLinkIdsForScope(wsId, { linkId, campaignId, folderId, channel })
    const linkFilter = buildLinkIdFilter(linkIds)
    const baseWhere = `workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59'`

    try {
        const sql = buildDimensionSQL(dimension, baseWhere, linkFilter, crossFilter)
        const result = await executeTinybirdSQL(sql)
        let data = result?.data || []

        // Add country flags for countries and cities
        if (dimension === 'countries') {
            data = data.map((row: { name: string; clicks: number }) => ({
                ...row,
                flag: COUNTRY_FLAGS[row.name] || '',
            }))
        } else if (dimension === 'cities') {
            data = data.map((row: { name: string; country: string; clicks: number }) => ({
                ...row,
                flag: COUNTRY_FLAGS[row.country] || '',
            }))
        }

        return NextResponse.json({ data, dimension }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    } catch (error) {
        console.error('[stats/breakdown] Tinybird query error:', error)
        return NextResponse.json({ data: [], dimension }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }
}
