import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserWorkspace() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return null

    // Try existing workspace membership (Traaaction startup user)
    // Use maybeSingle() to avoid 406 error when no rows found
    const { data: membership, error: memberError } = await supabase
        .from('WorkspaceMember')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

    if (memberError) {
        console.warn('[workspace] WorkspaceMember query failed:', memberError.message)
    }

    if (membership) {
        return { workspaceId: membership.workspace_id, userId: user.id }
    }

    // Fallback for standalone QR users: use user ID as workspace scope
    // This allows server actions to work without a formal Workspace record
    return { workspaceId: user.id, userId: user.id }
}
