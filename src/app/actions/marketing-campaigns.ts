'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWorkspace } from '@/lib/workspace'
import type { CampaignStatus } from '@/types/marketing'

interface CreateCampaignInput {
    name: string
    description?: string
    color?: string
    status?: CampaignStatus
    start_date?: string
    end_date?: string
}

export async function createMarketingCampaign(input: CreateCampaignInput) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }
    if (!input.name?.trim()) return { success: false, error: 'Name is required' }

    const supabase = await createClient()
    const { data: campaign, error } = await supabase.from('MarketingCampaign').insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        color: input.color || null,
        status: input.status || 'ACTIVE',
        start_date: input.start_date ? new Date(input.start_date).toISOString() : null,
        end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
        workspace_id: workspace.workspaceId,
    }).select().single()

    if (error) return { success: false, error: 'Campaign name already exists' }
    revalidatePath('/dashboard/campaigns')
    return { success: true, data: campaign }
}

interface UpdateCampaignInput {
    name?: string
    description?: string
    color?: string
    status?: CampaignStatus
    start_date?: string | null
    end_date?: string | null
}

export async function updateMarketingCampaign(id: string, input: UpdateCampaignInput) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data: campaign } = await supabase.from('MarketingCampaign').select('name, workspace_id').eq('id', id).single()
    if (!campaign || campaign.workspace_id !== workspace.workspaceId) return { success: false, error: 'Campaign not found' }

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name.trim()
    if (input.description !== undefined) data.description = input.description?.trim() || null
    if (input.color !== undefined) data.color = input.color || null
    if (input.status !== undefined) data.status = input.status
    if (input.start_date !== undefined) data.start_date = input.start_date ? new Date(input.start_date).toISOString() : null
    if (input.end_date !== undefined) data.end_date = input.end_date ? new Date(input.end_date).toISOString() : null

    const { data: updated, error } = await supabase.from('MarketingCampaign').update(data).eq('id', id).select().single()
    if (error) return { success: false, error: 'Campaign name already exists' }

    // Cascade name change to links
    if (input.name !== undefined && input.name.trim() !== campaign.name) {
        await supabase.from('ShortLink').update({ campaign: input.name.trim() }).eq('campaign_id', id)
    }

    revalidatePath('/dashboard/campaigns')
    return { success: true, data: updated }
}

export async function deleteMarketingCampaign(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data: campaign } = await supabase.from('MarketingCampaign').select('workspace_id').eq('id', id).single()
    if (!campaign || campaign.workspace_id !== workspace.workspaceId) return { success: false, error: 'Campaign not found' }

    await supabase.from('ShortLink').update({ campaign_id: null, campaign: null }).eq('campaign_id', id)
    await supabase.from('MarketingCampaign').delete().eq('id', id)

    revalidatePath('/dashboard/campaigns')
    return { success: true }
}

export async function getMarketingCampaignList() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    const supabase = await createClient()
    const { data: campaigns } = await supabase
        .from('MarketingCampaign')
        .select('*')
        .eq('workspace_id', workspace.workspaceId)
        .order('created_at', { ascending: false })

    if (!campaigns) return { success: false, error: 'Failed', data: [] }

    // Get link counts and clicks per campaign
    const campaignIds = campaigns.map(c => c.id)
    const { data: links } = await supabase
        .from('ShortLink')
        .select('campaign_id, clicks')
        .in('campaign_id', campaignIds)

    const statsMap = new Map<string, { linkCount: number; totalClicks: number }>()
    for (const link of (links || [])) {
        const existing = statsMap.get(link.campaign_id)
        if (existing) { existing.linkCount++; existing.totalClicks += link.clicks }
        else statsMap.set(link.campaign_id, { linkCount: 1, totalClicks: link.clicks })
    }

    return {
        success: true,
        data: campaigns.map(c => ({
            ...c,
            linkCount: statsMap.get(c.id)?.linkCount || 0,
            totalClicks: statsMap.get(c.id)?.totalClicks || 0,
        })),
    }
}

export async function getMarketingCampaign(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data: campaign } = await supabase.from('MarketingCampaign').select('*').eq('id', id).single()
    if (!campaign || campaign.workspace_id !== workspace.workspaceId) return { success: false, error: 'Campaign not found' }

    const { data: links } = await supabase
        .from('ShortLink')
        .select('clicks')
        .eq('campaign_id', id)

    return {
        success: true,
        data: {
            ...campaign,
            linkCount: links?.length || 0,
            totalClicks: (links || []).reduce((sum, l) => sum + l.clicks, 0),
        },
    }
}
