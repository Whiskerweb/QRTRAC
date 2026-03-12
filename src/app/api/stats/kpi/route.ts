import { NextResponse, NextRequest } from 'next/server'
import { getCurrentUserWorkspace } from '@/lib/workspace'
import { createAdminClient } from '@/lib/supabase/admin'
import {
    executeTinybirdSQL,
    isTinybirdConfigured,
    sanitizeUUID,
    sanitizeDateString,
    buildClicksFilterSQL,
} from '@/lib/tinybird'

export const dynamic = 'force-dynamic'

const EMPTY_RESPONSE = { clicks: 0, leads: 0, sales: 0, revenue: 0, conversion_rate: 0, timeseries: [] }

async function getLinkIdsForScope(
    wsId: string,
    params: { linkId?: string | null; campaignId?: string | null; folderId?: string | null; channel?: string | null }
): Promise<string[] | null> {
    const { linkId, campaignId, folderId, channel } = params
    if (linkId) return [linkId]
    if (!campaignId && !folderId && !channel) return null // workspace-wide, no link filter

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
    if (linkIds.length === 0) return 'AND 1=0' // no links match → no results
    const escaped = linkIds.map(id => `'${sanitizeUUID(id) || ''}'`).join(',')
    return `AND link_id IN (${escaped})`
}

export async function GET(request: NextRequest) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isTinybirdConfigured()) {
        return NextResponse.json({ data: [EMPTY_RESPONSE] }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }

    const { searchParams } = new URL(request.url)
    const dateFromParam = searchParams.get('date_from')
    const dateToParam = searchParams.get('date_to')
    const linkId = searchParams.get('link_id')
    const campaignId = searchParams.get('campaign_id')
    const folderId = searchParams.get('folder_id')
    const channel = searchParams.get('channel')

    const wsId = sanitizeUUID(workspace.workspaceId)
    if (!wsId) {
        return NextResponse.json({ data: [EMPTY_RESPONSE] }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }

    const now = new Date()
    const dateTo = sanitizeDateString(dateToParam) || now.toISOString().split('T')[0]
    const dateFrom = sanitizeDateString(dateFromParam) || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Dimensional filters
    const dimensionalFilter = buildClicksFilterSQL({
        country: searchParams.get('country') || undefined,
        city: searchParams.get('city') || undefined,
        region: searchParams.get('region') || undefined,
        continent: searchParams.get('continent') || undefined,
        device: searchParams.get('device') || undefined,
        browser: searchParams.get('browser') || undefined,
        os: searchParams.get('os') || undefined,
    })

    // Scope filter (link_id / campaign / folder / channel)
    const linkIds = await getLinkIdsForScope(wsId, { linkId, campaignId, folderId, channel })
    const linkFilter = buildLinkIdFilter(linkIds)

    const baseWhere = `workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59'`

    try {
        // Parallel queries for clicks, leads, sales, and timeseries
        const [clicksResult, leadsResult, salesResult, timeseriesResult] = await Promise.all([
            // Total clicks
            executeTinybirdSQL(
                `SELECT count() as clicks FROM clicks WHERE ${baseWhere} ${linkFilter} ${dimensionalFilter} FORMAT JSON`
            ),
            // Total leads
            executeTinybirdSQL(
                linkIds
                    ? `SELECT count() as leads FROM leads WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' AND click_id IN (SELECT DISTINCT click_id FROM clicks WHERE ${baseWhere} ${linkFilter}) FORMAT JSON`
                    : `SELECT count() as leads FROM leads WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' FORMAT JSON`
            ),
            // Total sales + revenue
            executeTinybirdSQL(
                linkIds
                    ? `SELECT count() as sales, sum(net_amount) / 100 as revenue FROM sales WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' AND click_id IN (SELECT DISTINCT click_id FROM clicks WHERE ${baseWhere} ${linkFilter}) FORMAT JSON`
                    : `SELECT count() as sales, sum(net_amount) / 100 as revenue FROM sales WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' FORMAT JSON`
            ),
            // Timeseries (clicks per day)
            executeTinybirdSQL(
                `SELECT toDate(timestamp) as date, count() as clicks FROM clicks WHERE ${baseWhere} ${linkFilter} ${dimensionalFilter} GROUP BY date ORDER BY date FORMAT JSON`
            ),
        ])

        const clicks = clicksResult?.data?.[0]?.clicks || 0
        const leads = leadsResult?.data?.[0]?.leads || 0
        const sales = salesResult?.data?.[0]?.sales || 0
        const revenue = salesResult?.data?.[0]?.revenue || 0

        // Also get leads and sales timeseries for merge
        const [leadsTs, salesTs] = await Promise.all([
            executeTinybirdSQL(
                linkIds
                    ? `SELECT toDate(timestamp) as date, count() as leads FROM leads WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' AND click_id IN (SELECT DISTINCT click_id FROM clicks WHERE ${baseWhere} ${linkFilter}) GROUP BY date ORDER BY date FORMAT JSON`
                    : `SELECT toDate(timestamp) as date, count() as leads FROM leads WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' GROUP BY date ORDER BY date FORMAT JSON`
            ),
            executeTinybirdSQL(
                linkIds
                    ? `SELECT toDate(timestamp) as date, count() as sales, sum(net_amount) / 100 as revenue FROM sales WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' AND click_id IN (SELECT DISTINCT click_id FROM clicks WHERE ${baseWhere} ${linkFilter}) GROUP BY date ORDER BY date FORMAT JSON`
                    : `SELECT toDate(timestamp) as date, count() as sales, sum(net_amount) / 100 as revenue FROM sales WHERE workspace_id = '${wsId}' AND timestamp >= '${dateFrom}' AND timestamp <= '${dateTo} 23:59:59' GROUP BY date ORDER BY date FORMAT JSON`
            ),
        ])

        // Merge timeseries
        const clicksByDate = new Map<string, number>()
        const leadsByDate = new Map<string, number>()
        const salesByDate = new Map<string, { sales: number; revenue: number }>()

        for (const row of (timeseriesResult?.data || [])) {
            clicksByDate.set(row.date, row.clicks)
        }
        for (const row of (leadsTs?.data || [])) {
            leadsByDate.set(row.date, row.leads)
        }
        for (const row of (salesTs?.data || [])) {
            salesByDate.set(row.date, { sales: row.sales, revenue: row.revenue })
        }

        // Build complete timeseries with all dates
        const allDates = new Set([
            ...clicksByDate.keys(),
            ...leadsByDate.keys(),
            ...salesByDate.keys(),
        ])
        const timeseries = Array.from(allDates)
            .sort()
            .map(date => ({
                date,
                clicks: clicksByDate.get(date) || 0,
                leads: leadsByDate.get(date) || 0,
                sales: salesByDate.get(date)?.sales || 0,
                revenue: salesByDate.get(date)?.revenue || 0,
            }))

        const conversion_rate = clicks > 0
            ? parseFloat(((sales / clicks) * 100).toFixed(2))
            : 0

        return NextResponse.json({
            data: [{
                clicks,
                leads,
                sales,
                revenue,
                conversion_rate,
                timeseries,
            }],
        }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    } catch (error) {
        console.error('[stats/kpi] Tinybird query error:', error)
        return NextResponse.json({ data: [EMPTY_RESPONSE] }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
        })
    }
}
