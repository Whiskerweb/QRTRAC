import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarNav } from '@/components/dashboard/SidebarNav'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, plan')
        .eq('id', user.id)
        .single()

    const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
    const email = user.email || ''

    return (
        <div className="min-h-screen bg-background">
            <SidebarNav displayName={displayName} email={email} />
            {/* Main content — sidebar width handled via CSS variable in SidebarNav */}
            <main className="transition-all duration-300 ease-in-out pl-64 max-lg:pl-0">
                <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
