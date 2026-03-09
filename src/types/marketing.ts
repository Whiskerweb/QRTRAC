export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'

export interface MarketingLink {
    id: string
    slug: string
    original_url: string
    short_url?: string
    workspace_id: string
    affiliate_id: string | null
    link_type: string
    channel: string | null
    campaign: string | null
    campaign_id: string | null
    folder_id: string | null
    clicks: number
    utm_source: string | null
    utm_medium: string | null
    utm_campaign: string | null
    utm_term: string | null
    utm_content: string | null
    og_title: string | null
    og_description: string | null
    og_image: string | null
    created_at: string
    tags?: { id: string; name: string; color: string }[]
    Campaign?: { id: string; name: string; color: string | null; status: string } | null
    Folder?: { id: string; name: string; color: string | null } | null
}

export interface MarketingCampaign {
    id: string
    name: string
    description: string | null
    color: string | null
    status: CampaignStatus
    start_date: string | null
    end_date: string | null
    workspace_id: string
    created_at: string
    linkCount?: number
    totalClicks?: number
}

export interface MarketingFolder {
    id: string
    name: string
    color: string | null
    position: number
    parent_id: string | null
    workspace_id: string
    linkCount?: number
    children?: MarketingFolder[]
}

export interface MarketingTag {
    id: string
    name: string
    color: string
    workspace_id: string
    linkCount?: number
}
