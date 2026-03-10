'use server'

import { createClient } from '@/lib/supabase/server'

async function getAuthUserId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return { supabase, userId: user.id }
}

export async function moveQRToFolder(qrId: string, folderId: string | null) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .update({ folder_id: folderId })
        .eq('id', qrId)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function bulkMoveQRToFolder(qrIds: string[], folderId: string | null) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .update({ folder_id: folderId })
        .in('id', qrIds)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}

export async function bulkDeleteQRCodes(qrIds: string[]) {
    const { supabase, userId } = await getAuthUserId()

    const { error } = await supabase
        .from('qr_codes')
        .delete()
        .in('id', qrIds)
        .eq('user_id', userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
}
