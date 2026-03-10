'use server'

import { createClient } from '@/lib/supabase/server'
import type { QRFolderNode } from '@/types/qr'

async function getAuthUserId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return { supabase, userId: user.id }
}

export async function createQRFolder({ name, color, parentId }: {
    name: string
    color?: string
    parentId?: string | null
}) {
    const { supabase, userId } = await getAuthUserId()

    // Enforce max 2 levels
    if (parentId) {
        const { data: parent } = await supabase
            .from('qr_folders')
            .select('parent_id')
            .eq('id', parentId)
            .eq('user_id', userId)
            .single()

        if (!parent) return { success: false, error: 'Parent folder not found' }
        if (parent.parent_id) return { success: false, error: 'Max 2 levels of nesting' }
    }

    const { data, error } = await supabase
        .from('qr_folders')
        .insert({
            user_id: userId,
            name: name.trim(),
            color: color || '#8B5CF6',
            parent_id: parentId || null,
        })
        .select('id')
        .single()

    if (error) {
        if (error.code === '23505') return { success: false, error: 'A folder with this name already exists' }
        return { success: false, error: error.message }
    }

    return { success: true, data }
}

export async function updateQRFolder(id: string, updates: { name?: string; color?: string }) {
    const { supabase, userId } = await getAuthUserId()

    const updateData: Record<string, string> = {}
    if (updates.name) updateData.name = updates.name.trim()
    if (updates.color) updateData.color = updates.color

    const { error } = await supabase
        .from('qr_folders')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', userId)

    if (error) {
        if (error.code === '23505') return { success: false, error: 'A folder with this name already exists' }
        return { success: false, error: error.message }
    }

    return { success: true }
}

export async function deleteQRFolder(id: string) {
    const { supabase, userId } = await getAuthUserId()

    // Unlink QR codes from this folder (and child folders)
    await supabase
        .from('qr_codes')
        .update({ folder_id: null })
        .eq('folder_id', id)

    // Get children and unlink their QR codes too
    const { data: children } = await supabase
        .from('qr_folders')
        .select('id')
        .eq('parent_id', id)
        .eq('user_id', userId)

    if (children) {
        for (const child of children) {
            await supabase
                .from('qr_codes')
                .update({ folder_id: null })
                .eq('folder_id', child.id)
        }
    }

    // Delete folder (CASCADE will delete children)
    const { error } = await supabase
        .from('qr_folders')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function getQRFolderTree(): Promise<{ success: boolean; data?: QRFolderNode[]; error?: string }> {
    const { supabase, userId } = await getAuthUserId()

    const { data: folders, error } = await supabase
        .from('qr_folders')
        .select('id, name, color, parent_id, position')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('name', { ascending: true })

    if (error) return { success: false, error: error.message }

    // Get QR counts per folder
    const { data: qrCodes } = await supabase
        .from('qr_codes')
        .select('folder_id')
        .eq('user_id', userId)
        .not('folder_id', 'is', null)

    const countMap: Record<string, number> = {}
    if (qrCodes) {
        for (const qr of qrCodes) {
            if (qr.folder_id) {
                countMap[qr.folder_id] = (countMap[qr.folder_id] || 0) + 1
            }
        }
    }

    // Build tree
    const nodeMap = new Map<string, QRFolderNode>()
    const roots: QRFolderNode[] = []

    for (const f of folders || []) {
        nodeMap.set(f.id, {
            id: f.id,
            name: f.name,
            color: f.color || '#8B5CF6',
            parent_id: f.parent_id,
            position: f.position || 0,
            qrCount: countMap[f.id] || 0,
            children: [],
        })
    }

    for (const node of nodeMap.values()) {
        if (node.parent_id && nodeMap.has(node.parent_id)) {
            nodeMap.get(node.parent_id)!.children.push(node)
        } else {
            roots.push(node)
        }
    }

    return { success: true, data: roots }
}
