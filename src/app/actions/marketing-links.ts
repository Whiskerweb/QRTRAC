'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWorkspace } from '@/lib/workspace'
import { nanoid } from 'nanoid'

const DEFAULT_BASE = process.env.NEXT_PUBLIC_TRAAACTION_URL || 'https://traaaction.com'

async function getShortLinkBase(workspaceId: string): Promise<string> {
    const supabase = createAdminClient()
    const { data: domain } = await supabase
        .from('Domain')
        .select('name')
        .eq('workspace_id', workspaceId)
        .eq('verified', true)
        .limit(1)
        .single()
    return domain ? `https://${domain.name}` : DEFAULT_BASE
}

function buildShortUrl(base: string, slug: string): string {
    return `${base}/s/${slug}`
}

interface MarketingLinkInput {
    url: string
    slug?: string
    channel?: string
    campaign?: string
    campaign_id?: string
    folder_id?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
    domain?: string
    og_title?: string
    og_description?: string
    og_image?: string
    tagIds?: string[]
}

export async function createMarketingLink(input: MarketingLinkInput) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    if (!input.url) return { success: false, error: 'URL is required' }
    try { new URL(input.url) } catch { return { success: false, error: 'Invalid URL format' } }

    let slug = input.slug?.trim()
    if (!slug) {
        slug = nanoid(8)
    } else {
        slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
    }

    const supabase = createAdminClient()

    // Check uniqueness
    const { data: existing } = await supabase.from('ShortLink').select('id').eq('slug', slug).single()
    if (existing) return { success: false, error: 'This slug is already taken' }

    // Build target URL with UTMs
    let targetUrl = input.url
    const utmParams: Record<string, string | undefined> = {
        utm_source: input.utm_source, utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign, utm_term: input.utm_term, utm_content: input.utm_content,
    }
    const url = new URL(targetUrl)
    for (const [key, value] of Object.entries(utmParams)) {
        if (value) url.searchParams.set(key, value)
    }
    targetUrl = url.toString()

    // Resolve campaign
    let campaignName = input.campaign || null
    let campaignId = input.campaign_id || null
    if (campaignId) {
        const { data: camp } = await supabase
            .from('MarketingCampaign')
            .select('name, workspace_id')
            .eq('id', campaignId)
            .single()
        if (camp && camp.workspace_id === workspace.workspaceId) {
            campaignName = camp.name
        } else {
            campaignId = null
        }
    }

    try {
        const { data: link, error } = await supabase.from('ShortLink').insert({
            slug,
            original_url: targetUrl,
            workspace_id: workspace.workspaceId,
            affiliate_id: null,
            link_type: 'marketing',
            channel: input.channel || null,
            campaign: campaignName,
            campaign_id: campaignId,
            folder_id: input.folder_id || null,
            utm_source: input.utm_source || null,
            utm_medium: input.utm_medium || null,
            utm_campaign: input.utm_campaign || null,
            utm_term: input.utm_term || null,
            utm_content: input.utm_content || null,
            og_title: input.og_title || null,
            og_description: input.og_description || null,
            og_image: input.og_image || null,
        }).select().single()

        if (error || !link) {
            console.error('[createMarketingLink] insert error:', error?.message, error?.details, error?.hint)
            return { success: false, error: `Failed to create link: ${error?.message || 'no data returned'}` }
        }

        // Connect tags via join table
        if (input.tagIds?.length) {
            await supabase.from('_ShortLinkTags').insert(
                input.tagIds.map(tagId => ({ A: tagId, B: link.id }))
            )
        }

        // Dual-write to Redis
        const { setLinkInRedis } = await import('@/lib/redis')
        await setLinkInRedis(link.slug, {
            url: link.original_url,
            linkId: link.id,
            workspaceId: link.workspace_id,
            sellerId: null,
            ogTitle: input.og_title || null,
            ogDescription: input.og_description || null,
            ogImage: input.og_image || null,
        }, input.domain)

    

        const base = input.domain ? `https://${input.domain}` : await getShortLinkBase(workspace.workspaceId)
        return {
            success: true,
            data: {
                id: link.id,
                slug: link.slug,
                original_url: link.original_url,
                short_url: buildShortUrl(base, link.slug),
                channel: link.channel,
                campaign: link.campaign,
            }
        }
    } catch (error) {
        console.error('[createMarketingLink] exception:', error)
        return { success: false, error: `Failed to create link: ${error instanceof Error ? error.message : String(error)}` }
    }
}

export async function getMarketingLinks(filters?: {
    channel?: string
    campaign?: string
    campaign_id?: string
    folder_id?: string
    search?: string
    tagIds?: string[]
}) {
    let workspace
    try {
        workspace = await getCurrentUserWorkspace()
    } catch (err) {
        console.error('[getMarketingLinks] workspace error:', err)
        return { success: false, error: `Workspace error: ${err instanceof Error ? err.message : String(err)}`, data: [] }
    }
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    let supabase
    try {
        supabase = createAdminClient()
    } catch (err) {
        console.error('[getMarketingLinks] admin client error:', err)
        return { success: false, error: `Admin client error: ${err instanceof Error ? err.message : String(err)}`, data: [] }
    }

    let query = supabase
        .from('ShortLink')
        .select('*')
        .eq('workspace_id', workspace.workspaceId)
        .eq('link_type', 'marketing')
        .order('created_at', { ascending: false })

    if (filters?.channel) query = query.eq('channel', filters.channel)
    if (filters?.campaign) query = query.eq('campaign', filters.campaign)
    if (filters?.campaign_id) query = query.eq('campaign_id', filters.campaign_id)
    if (filters?.folder_id !== undefined) {
        if (filters.folder_id) {
            query = query.eq('folder_id', filters.folder_id)
        } else {
            query = query.is('folder_id', null)
        }
    }
    if (filters?.search) {
        query = query.or(`slug.ilike.%${filters.search}%,original_url.ilike.%${filters.search}%,campaign.ilike.%${filters.search}%`)
    }

    const { data: links, error } = await query
    if (error) {
        console.error('[getMarketingLinks] query error:', error.message, 'workspace:', workspace.workspaceId)
        return { success: false, error: `Query error: ${error.message}`, data: [] }
    }

    // Fetch tags for these links
    let linksWithTags = links || []
    if (linksWithTags.length > 0) {
        const linkIds = linksWithTags.map(l => l.id)

        // Get tag relations
        const { data: tagRelations } = await supabase
            .from('_ShortLinkTags')
            .select('A, B')
            .in('B', linkIds)

        if (tagRelations?.length) {
            const tagIds = [...new Set(tagRelations.map(r => r.A))]
            const { data: tags } = await supabase
                .from('MarketingTag')
                .select('id, name, color')
                .in('id', tagIds)

            const tagMap = new Map((tags || []).map(t => [t.id, t]))
            const linkTagMap = new Map<string, typeof tags>()
            for (const rel of tagRelations) {
                const tag = tagMap.get(rel.A)
                if (tag) {
                    if (!linkTagMap.has(rel.B)) linkTagMap.set(rel.B, [])
                    linkTagMap.get(rel.B)!.push(tag)
                }
            }

            linksWithTags = linksWithTags.map(l => ({
                ...l,
                tags: linkTagMap.get(l.id) || [],
            }))

            // Filter by tagIds if specified
            if (filters?.tagIds?.length) {
                const filterTagSet = new Set(filters.tagIds)
                linksWithTags = linksWithTags.filter(l =>
                    l.tags?.some((t: { id: string }) => filterTagSet.has(t.id))
                )
            }
        } else {
            linksWithTags = linksWithTags.map(l => ({ ...l, tags: [] }))
        }

        // Fetch campaigns and folders
        const campaignIds = [...new Set(linksWithTags.filter(l => l.campaign_id).map(l => l.campaign_id))]
        const folderIds = [...new Set(linksWithTags.filter(l => l.folder_id).map(l => l.folder_id))]

        let campaignMap = new Map()
        let folderMap = new Map()

        if (campaignIds.length) {
            const { data: campaigns } = await supabase
                .from('MarketingCampaign')
                .select('id, name, color, status')
                .in('id', campaignIds)
            campaignMap = new Map((campaigns || []).map(c => [c.id, c]))
        }

        if (folderIds.length) {
            const { data: folders } = await supabase
                .from('MarketingFolder')
                .select('id, name, color')
                .in('id', folderIds)
            folderMap = new Map((folders || []).map(f => [f.id, f]))
        }

        linksWithTags = linksWithTags.map(l => ({
            ...l,
            Campaign: l.campaign_id ? campaignMap.get(l.campaign_id) || null : null,
            Folder: l.folder_id ? folderMap.get(l.folder_id) || null : null,
        }))
    }

    const base = await getShortLinkBase(workspace.workspaceId)
    return {
        success: true,
        data: linksWithTags.map(l => ({
            ...l,
            short_url: buildShortUrl(base, l.slug),
        })),
    }
}

export async function getMarketingLink(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()

    const { data: link } = await supabase
        .from('ShortLink')
        .select('*')
        .eq('id', id)
        .single()

    if (!link || link.workspace_id !== workspace.workspaceId || link.link_type !== 'marketing') {
        return { success: false, error: 'Link not found' }
    }

    // Fetch tags
    const { data: tagRelations } = await supabase
        .from('_ShortLinkTags')
        .select('A')
        .eq('B', id)

    let tags: { id: string; name: string; color: string }[] = []
    if (tagRelations?.length) {
        const { data: tagData } = await supabase
            .from('MarketingTag')
            .select('id, name, color')
            .in('id', tagRelations.map(r => r.A))
        tags = tagData || []
    }

    // Fetch campaign and folder
    let Campaign = null
    let Folder = null
    if (link.campaign_id) {
        const { data } = await supabase.from('MarketingCampaign').select('id, name, color, status').eq('id', link.campaign_id).single()
        Campaign = data
    }
    if (link.folder_id) {
        const { data } = await supabase.from('MarketingFolder').select('id, name, color').eq('id', link.folder_id).single()
        Folder = data
    }

    const base = await getShortLinkBase(workspace.workspaceId)
    return {
        success: true,
        data: { ...link, tags, Campaign, Folder, short_url: buildShortUrl(base, link.slug) },
    }
}

export async function updateMarketingLink(id: string, input: Partial<MarketingLinkInput>) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()

    const { data: link } = await supabase.from('ShortLink').select('*').eq('id', id).single()
    if (!link || link.workspace_id !== workspace.workspaceId || link.link_type !== 'marketing') {
        return { success: false, error: 'Link not found' }
    }

    const data: Record<string, unknown> = {}
    if (input.channel !== undefined) data.channel = input.channel || null
    if (input.campaign !== undefined) data.campaign = input.campaign || null
    if (input.folder_id !== undefined) data.folder_id = input.folder_id || null

    if (input.campaign_id !== undefined) {
        if (input.campaign_id) {
            const { data: camp } = await supabase
                .from('MarketingCampaign')
                .select('name, workspace_id')
                .eq('id', input.campaign_id)
                .single()
            if (camp && camp.workspace_id === workspace.workspaceId) {
                data.campaign_id = input.campaign_id
                data.campaign = camp.name
            }
        } else {
            data.campaign_id = null
            data.campaign = null
        }
    }

    if (input.utm_source !== undefined) data.utm_source = input.utm_source || null
    if (input.utm_medium !== undefined) data.utm_medium = input.utm_medium || null
    if (input.utm_campaign !== undefined) data.utm_campaign = input.utm_campaign || null
    if (input.utm_term !== undefined) data.utm_term = input.utm_term || null
    if (input.utm_content !== undefined) data.utm_content = input.utm_content || null
    if (input.og_title !== undefined) data.og_title = input.og_title || null
    if (input.og_description !== undefined) data.og_description = input.og_description || null
    if (input.og_image !== undefined) data.og_image = input.og_image || null

    const { data: updated, error } = await supabase
        .from('ShortLink')
        .update(data)
        .eq('id', id)
        .select()
        .single()

    if (error) return { success: false, error: 'Failed to update link' }

    // Re-sync Redis
    const { setLinkInRedis } = await import('@/lib/redis')
    await setLinkInRedis(updated.slug, {
        url: updated.original_url,
        linkId: updated.id,
        workspaceId: updated.workspace_id,
        sellerId: updated.affiliate_id || null,
        ogTitle: updated.og_title || null,
        ogDescription: updated.og_description || null,
        ogImage: updated.og_image || null,
    }, input.domain)


    return { success: true, data: updated }
}

export async function deleteMarketingLink(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()

    const { data: link } = await supabase.from('ShortLink').select('slug, workspace_id, link_type').eq('id', id).single()
    if (!link || link.workspace_id !== workspace.workspaceId || link.link_type !== 'marketing') {
        return { success: false, error: 'Link not found' }
    }

    // Remove tag relations first
    await supabase.from('_ShortLinkTags').delete().eq('B', id)
    await supabase.from('ShortLink').delete().eq('id', id)

    const { deleteLinkFromRedis } = await import('@/lib/redis')
    await deleteLinkFromRedis(link.slug)


    return { success: true }
}

export async function getMarketingOverview() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()

    const { data: links } = await supabase
        .from('ShortLink')
        .select('slug, clicks, channel')
        .eq('workspace_id', workspace.workspaceId)
        .eq('link_type', 'marketing')
        .order('clicks', { ascending: false })

    if (!links) return { success: false, error: 'Failed to fetch links' }

    const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0)
    const totalLinks = links.length

    const channelClicks = new Map<string, number>()
    for (const link of links) {
        const ch = link.channel || 'other'
        channelClicks.set(ch, (channelClicks.get(ch) || 0) + link.clicks)
    }
    let topChannel = 'none'
    let topChannelClicks = 0
    for (const [ch, clicks] of channelClicks) {
        if (clicks > topChannelClicks) { topChannel = ch; topChannelClicks = clicks }
    }

    const bestLink = links[0] || null
    const base = await getShortLinkBase(workspace.workspaceId)
    const topLinks = links.slice(0, 10).map(l => ({ ...l, short_url: buildShortUrl(base, l.slug) }))

    return {
        success: true,
        data: {
            totalClicks, totalLinks, topChannel, topChannelClicks,
            bestLink: bestLink ? { ...bestLink, short_url: buildShortUrl(base, bestLink.slug) } : null,
            topLinks,
        },
    }
}

export async function getMarketingChannelStats() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    const supabase = createAdminClient()

    const { data: links } = await supabase
        .from('ShortLink')
        .select('channel, clicks')
        .eq('workspace_id', workspace.workspaceId)
        .eq('link_type', 'marketing')

    if (!links) return { success: false, error: 'Failed', data: [] }

    const channelMap = new Map<string, { channel: string; linkCount: number; totalClicks: number }>()
    for (const link of links) {
        const ch = link.channel || 'other'
        const existing = channelMap.get(ch)
        if (existing) { existing.linkCount++; existing.totalClicks += link.clicks }
        else channelMap.set(ch, { channel: ch, linkCount: 1, totalClicks: link.clicks })
    }

    return { success: true, data: Array.from(channelMap.values()) }
}

// TAGS

export async function createMarketingTag(name: string, color: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }
    if (!name.trim()) return { success: false, error: 'Name is required' }

    const supabase = createAdminClient()
    const { data: tag, error } = await supabase.from('MarketingTag').insert({
        name: name.trim(), color, workspace_id: workspace.workspaceId,
    }).select().single()

    if (error) return { success: false, error: 'Tag name already exists' }

    return { success: true, data: tag }
}

export async function updateMarketingTag(id: string, data: { name?: string; color?: string }) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()
    const { data: tag } = await supabase.from('MarketingTag').select('workspace_id').eq('id', id).single()
    if (!tag || tag.workspace_id !== workspace.workspaceId) return { success: false, error: 'Tag not found' }

    const updateData: Record<string, string> = {}
    if (data.name !== undefined) updateData.name = data.name.trim()
    if (data.color !== undefined) updateData.color = data.color

    const { data: updated, error } = await supabase.from('MarketingTag').update(updateData).eq('id', id).select().single()
    if (error) return { success: false, error: 'Tag name already exists' }

    return { success: true, data: updated }
}

export async function deleteMarketingTag(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()
    const { data: tag } = await supabase.from('MarketingTag').select('workspace_id').eq('id', id).single()
    if (!tag || tag.workspace_id !== workspace.workspaceId) return { success: false, error: 'Tag not found' }

    await supabase.from('_ShortLinkTags').delete().eq('A', id)
    await supabase.from('MarketingTag').delete().eq('id', id)

    return { success: true }
}

export async function getMarketingTags() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    const supabase = createAdminClient()
    const { data: tags } = await supabase
        .from('MarketingTag')
        .select('id, name, color')
        .eq('workspace_id', workspace.workspaceId)
        .order('created_at', { ascending: true })

    if (!tags) return { success: false, error: 'Failed', data: [] }

    // Count links per tag
    const tagIds = tags.map(t => t.id)
    const { data: relations } = await supabase
        .from('_ShortLinkTags')
        .select('A')
        .in('A', tagIds)

    const countMap = new Map<string, number>()
    for (const rel of (relations || [])) {
        countMap.set(rel.A, (countMap.get(rel.A) || 0) + 1)
    }

    return {
        success: true,
        data: tags.map(t => ({ ...t, linkCount: countMap.get(t.id) || 0 })),
    }
}

export async function setLinkTags(linkId: string, tagIds: string[]) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = createAdminClient()
    const { data: link } = await supabase.from('ShortLink').select('workspace_id').eq('id', linkId).single()
    if (!link || link.workspace_id !== workspace.workspaceId) return { success: false, error: 'Link not found' }

    // Replace all tags: delete existing, insert new
    await supabase.from('_ShortLinkTags').delete().eq('B', linkId)
    if (tagIds.length > 0) {
        await supabase.from('_ShortLinkTags').insert(
            tagIds.map(tagId => ({ A: tagId, B: linkId }))
        )
    }


    return { success: true }
}

export async function getMarketingCampaigns() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    const supabase = createAdminClient()
    const { data: links } = await supabase
        .from('ShortLink')
        .select('campaign, channel, clicks')
        .eq('workspace_id', workspace.workspaceId)
        .eq('link_type', 'marketing')
        .not('campaign', 'is', null)

    if (!links) return { success: false, error: 'Failed', data: [] }

    const campaignMap = new Map<string, { name: string; linkCount: number; totalClicks: number; channels: Set<string> }>()
    for (const link of links) {
        if (!link.campaign) continue
        const existing = campaignMap.get(link.campaign)
        if (existing) {
            existing.linkCount++
            existing.totalClicks += link.clicks
            if (link.channel) existing.channels.add(link.channel)
        } else {
            const channels = new Set<string>()
            if (link.channel) channels.add(link.channel)
            campaignMap.set(link.campaign, { name: link.campaign, linkCount: 1, totalClicks: link.clicks, channels })
        }
    }

    return {
        success: true,
        data: Array.from(campaignMap.values()).map(c => ({ ...c, channels: Array.from(c.channels) })),
    }
}

// BULK

async function validateBulkLinks(linkIds: string[]) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { error: 'Not authenticated' }

    const supabase = createAdminClient()
    const { data: links } = await supabase
        .from('ShortLink')
        .select('id, slug')
        .in('id', linkIds)
        .eq('workspace_id', workspace.workspaceId)
        .eq('link_type', 'marketing')

    if (!links || links.length !== linkIds.length) return { error: 'Some links not found' }
    return { workspace, links, supabase }
}

export async function bulkDeleteLinks(linkIds: string[]) {
    const result = await validateBulkLinks(linkIds)
    if ('error' in result) return { success: false, error: result.error }
    const { links, supabase } = result

    await supabase.from('_ShortLinkTags').delete().in('B', linkIds)
    await supabase.from('ShortLink').delete().in('id', linkIds)

    const { deleteLinkFromRedis } = await import('@/lib/redis')
    await Promise.all(links.map(l => deleteLinkFromRedis(l.slug)))


    return { success: true }
}

export async function bulkMoveToFolder(linkIds: string[], folderId: string | null) {
    const result = await validateBulkLinks(linkIds)
    if ('error' in result) return { success: false, error: result.error }

    await result.supabase.from('ShortLink').update({ folder_id: folderId }).in('id', linkIds)

    return { success: true }
}

export async function bulkSetCampaign(linkIds: string[], campaignId: string | null) {
    const result = await validateBulkLinks(linkIds)
    if ('error' in result) return { success: false, error: result.error }

    let campaignName: string | null = null
    if (campaignId) {
        const { data: camp } = await result.supabase.from('MarketingCampaign').select('name').eq('id', campaignId).single()
        if (!camp) return { success: false, error: 'Campaign not found' }
        campaignName = camp.name
    }

    await result.supabase.from('ShortLink').update({ campaign_id: campaignId, campaign: campaignName }).in('id', linkIds)

    return { success: true }
}

export async function bulkAddTags(linkIds: string[], tagIds: string[]) {
    const result = await validateBulkLinks(linkIds)
    if ('error' in result) return { success: false, error: result.error }

    // Get existing relations to avoid duplicates
    const { data: existing } = await result.supabase
        .from('_ShortLinkTags')
        .select('A, B')
        .in('B', linkIds)
        .in('A', tagIds)

    const existingSet = new Set((existing || []).map(r => `${r.A}:${r.B}`))

    const inserts: { A: string; B: string }[] = []
    for (const linkId of linkIds) {
        for (const tagId of tagIds) {
            if (!existingSet.has(`${tagId}:${linkId}`)) {
                inserts.push({ A: tagId, B: linkId })
            }
        }
    }

    if (inserts.length > 0) {
        await result.supabase.from('_ShortLinkTags').insert(inserts)
    }


    return { success: true }
}

export async function bulkRemoveTags(linkIds: string[], tagIds: string[]) {
    const result = await validateBulkLinks(linkIds)
    if ('error' in result) return { success: false, error: result.error }

    await result.supabase
        .from('_ShortLinkTags')
        .delete()
        .in('B', linkIds)
        .in('A', tagIds)


    return { success: true }
}
