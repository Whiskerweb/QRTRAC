import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserWorkspace() {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) return null

    // Try existing workspace membership (Traaaction startup user)
    const { data: membership } = await supabase
        .from('WorkspaceMember')
        .select('workspace_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

    if (membership) {
        return { workspaceId: membership.workspace_id, userId: user.id }
    }

    // Fallback for standalone QR users: use user ID as workspace scope
    // This allows server actions to work without a formal Workspace record
    return { workspaceId: user.id, userId: user.id }
}
