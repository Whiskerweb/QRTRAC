'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWorkspace } from '@/lib/workspace'

interface CreateFolderInput {
    name: string
    color?: string
    parent_id?: string
}

export async function createMarketingFolder(input: CreateFolderInput) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }
    if (!input.name?.trim()) return { success: false, error: 'Name is required' }

    const supabase = await createClient()

    // Validate max 2 levels
    if (input.parent_id) {
        const { data: parent } = await supabase
            .from('MarketingFolder')
            .select('parent_id, workspace_id')
            .eq('id', input.parent_id)
            .single()
        if (!parent || parent.workspace_id !== workspace.workspaceId) return { success: false, error: 'Parent folder not found' }
        if (parent.parent_id) return { success: false, error: 'Maximum folder depth is 2 levels' }
    }

    // Auto-position
    let maxPosition = -1
    if (!input.parent_id) {
        const { data: rootSiblings } = await supabase
            .from('MarketingFolder')
            .select('position')
            .eq('workspace_id', workspace.workspaceId)
            .is('parent_id', null)
            .order('position', { ascending: false })
            .limit(1)
        maxPosition = rootSiblings?.[0]?.position ?? -1
    } else {
        const { data: siblings } = await supabase
            .from('MarketingFolder')
            .select('position')
            .eq('workspace_id', workspace.workspaceId)
            .eq('parent_id', input.parent_id)
            .order('position', { ascending: false })
            .limit(1)
        maxPosition = siblings?.[0]?.position ?? -1
    }

    const { data: folder, error } = await supabase.from('MarketingFolder').insert({
        name: input.name.trim(),
        color: input.color || null,
        position: maxPosition + 1,
        workspace_id: workspace.workspaceId,
        parent_id: input.parent_id || null,
    }).select().single()

    if (error) return { success: false, error: 'Folder name already exists in this location' }
    revalidatePath('/dashboard/links')
    return { success: true, data: folder }
}

export async function updateMarketingFolder(id: string, input: { name?: string; color?: string }) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data: folder } = await supabase.from('MarketingFolder').select('workspace_id').eq('id', id).single()
    if (!folder || folder.workspace_id !== workspace.workspaceId) return { success: false, error: 'Folder not found' }

    const data: Record<string, unknown> = {}
    if (input.name !== undefined) data.name = input.name.trim()
    if (input.color !== undefined) data.color = input.color || null

    const { data: updated, error } = await supabase.from('MarketingFolder').update(data).eq('id', id).select().single()
    if (error) return { success: false, error: 'Folder name already exists' }
    revalidatePath('/dashboard/links')
    return { success: true, data: updated }
}

export async function deleteMarketingFolder(id: string) {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated' }

    const supabase = await createClient()
    const { data: folder } = await supabase.from('MarketingFolder').select('workspace_id').eq('id', id).single()
    if (!folder || folder.workspace_id !== workspace.workspaceId) return { success: false, error: 'Folder not found' }

    // Unlink links in this folder
    await supabase.from('ShortLink').update({ folder_id: null }).eq('folder_id', id)

    // Unlink links in child folders
    const { data: children } = await supabase.from('MarketingFolder').select('id').eq('parent_id', id)
    if (children?.length) {
        const childIds = children.map(c => c.id)
        await supabase.from('ShortLink').update({ folder_id: null }).in('folder_id', childIds)
        // Delete children
        await supabase.from('MarketingFolder').delete().in('id', childIds)
    }

    await supabase.from('MarketingFolder').delete().eq('id', id)

    revalidatePath('/dashboard/links')
    return { success: true }
}

export async function getMarketingFolderTree() {
    const workspace = await getCurrentUserWorkspace()
    if (!workspace) return { success: false, error: 'Not authenticated', data: [] }

    const supabase = await createClient()
    const { data: folders } = await supabase
        .from('MarketingFolder')
        .select('*')
        .eq('workspace_id', workspace.workspaceId)
        .order('position', { ascending: true })

    if (!folders) return { success: false, error: 'Failed', data: [] }

    // Count links per folder
    const folderIds = folders.map(f => f.id)
    const { data: linkCounts } = await supabase
        .from('ShortLink')
        .select('folder_id')
        .in('folder_id', folderIds)

    const countMap = new Map<string, number>()
    for (const lc of (linkCounts || [])) {
        countMap.set(lc.folder_id, (countMap.get(lc.folder_id) || 0) + 1)
    }

    // Build tree
    const roots = folders
        .filter(f => !f.parent_id)
        .map(f => ({
            id: f.id,
            name: f.name,
            color: f.color,
            parent_id: f.parent_id,
            position: f.position,
            linkCount: countMap.get(f.id) || 0,
            children: folders
                .filter(c => c.parent_id === f.id)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    color: c.color,
                    parent_id: c.parent_id,
                    position: c.position,
                    linkCount: countMap.get(c.id) || 0,
                    children: [],
                })),
        }))

    return { success: true, data: roots }
}
