import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutDashboard, LogOut, QrCode, Link2, BarChart3, Megaphone, ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';
import { LandingEditor } from '@/components/landing/LandingEditor';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = '';
  let initials = '';
  if (user) {
    let { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    // Auto-create profile for existing auth users (e.g. from main Traaaction app)
    if (!profile) {
      const fallbackName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Utilisateur';
      const { data: created } = await supabase
        .from('profiles')
        .upsert({ id: user.id, display_name: fallbackName }, { onConflict: 'id' })
        .select('display_name')
        .single();
      profile = created;
    }
    displayName = profile?.display_name || user.email?.split('@')[0] || 'Utilisateur';
    initials = displayName.slice(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 border-b border-black/[0.04]" style={{ background: 'rgba(250,250,250,0.8)', backdropFilter: 'blur(20px) saturate(1.8)', WebkitBackdropFilter: 'blur(20px) saturate(1.8)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[60px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-[10px] bg-[#111] flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-white font-bold text-[10px] tracking-[0.02em]">QR</span>
            </div>
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-[#111]">
              QR<span className="text-[#999]">.traaaction</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-0.5 mr-1">
                  {[
                    { href: '/dashboard', icon: QrCode, label: 'QR Codes' },
                    { href: '/dashboard/links', icon: Link2, label: 'Liens' },
                    { href: '/dashboard/campaigns', icon: Megaphone, label: 'Campagnes' },
                    { href: '/dashboard/analytics', icon: BarChart3, label: 'Stats' },
                  ].map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-[12px] text-[#666] hover:text-[#111] hover:bg-black/[0.04] h-8 px-2.5 rounded-lg font-medium">
                        <item.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>

                <Link href="/dashboard">
                  <Button size="sm" className="text-[12px] bg-[#111] text-white hover:bg-[#222] h-8 px-3.5 rounded-lg font-medium gap-1.5 shadow-none">
                    <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.8} />
                    Dashboard
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1.5 h-8 w-8 rounded-full bg-[#111] flex items-center justify-center text-white text-[11px] font-semibold tracking-wide hover:bg-[#222] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
                      {initials}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-black/[0.06] p-1">
                    <div className="px-3 py-2.5">
                      <p className="text-[13px] font-semibold text-[#111]">{displayName}</p>
                      <p className="text-[11px] text-[#999] mt-0.5">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-black/[0.06]" />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer rounded-lg text-[13px]">
                        <LayoutDashboard className="h-4 w-4 text-[#999]" strokeWidth={1.8} />
                        Dashboard QR
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href="https://traaaction.com/dashboard" className="flex items-center gap-2.5 cursor-pointer rounded-lg text-[13px]">
                        <ArrowRight className="h-4 w-4 text-[#999]" strokeWidth={1.8} />
                        Traaaction Dashboard
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-black/[0.06]" />
                    <form action="/auth/signout" method="post">
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full flex items-center gap-2.5 text-red-500 rounded-lg text-[13px]">
                          <LogOut className="h-4 w-4" strokeWidth={1.8} />
                          Se deconnecter
                        </button>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-[12px] text-[#666] hover:text-[#111] h-8 rounded-lg font-medium">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-[#111] text-white hover:bg-[#222] h-8 px-4 rounded-lg text-[12px] font-medium shadow-none">
                    Commencer gratuitement
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="pt-16 sm:pt-20 pb-6 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/[0.04] mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-[#666] tracking-wide uppercase">Gratuit &middot; Sans inscription</span>
          </div>

          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold tracking-[-0.035em] leading-[1.1] text-[#111] mb-4">
            Creez des QR codes<br className="hidden sm:block" />
            <span className="text-[#999]">qui convertissent</span>
          </h1>

          <p className="text-[15px] sm:text-base text-[#777] leading-relaxed max-w-lg mx-auto mb-10">
            Design, personnalisation, logos — generez des QR codes professionnels en quelques secondes. Telechargez en PNG ou SVG.
          </p>
        </div>
      </section>

      {/* ─── EDITOR ─── */}
      <section className="px-4 sm:px-8 pb-20">
        <div className="max-w-6xl w-full mx-auto">
          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="p-4 sm:p-6">
              <LandingEditor userId={user?.id} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="border-t border-black/[0.06] bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-20">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold text-[#999] tracking-[0.15em] uppercase mb-3">Plateforme complete</p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-bold tracking-[-0.03em] text-[#111]">
              Bien plus qu&apos;un generateur
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Zap,
                title: 'Liens traces',
                desc: 'Creez des liens courts avec UTM, domaine custom et suivi des clics en temps reel.',
              },
              {
                icon: Target,
                title: 'Campagnes',
                desc: 'Organisez vos liens par campagne, dossier et tags. Gerez tout depuis un seul dashboard.',
              },
              {
                icon: TrendingUp,
                title: 'Analytique',
                desc: 'Pays, appareils, navigateurs, referrers — comprenez votre audience avec des donnees precises.',
              },
            ].map((feature) => (
              <div key={feature.title} className="group p-6 rounded-2xl border border-transparent hover:border-black/[0.06] hover:bg-[#FAFAFA] transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] group-hover:bg-[#111] flex items-center justify-center mb-4 transition-colors duration-300">
                  <feature.icon className="h-[18px] w-[18px] text-[#666] group-hover:text-white transition-colors duration-300" strokeWidth={1.8} />
                </div>
                <h3 className="text-[15px] font-semibold text-[#111] mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-[#888] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {!user && (
            <div className="text-center mt-14">
              <Link href="/signup">
                <Button size="sm" className="bg-[#111] text-white hover:bg-[#222] h-9 px-5 rounded-lg text-[13px] font-medium gap-2 shadow-none">
                  Commencer gratuitement
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-black/[0.06]" style={{ background: '#FAFAFA' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#111] flex items-center justify-center">
              <span className="text-white font-bold text-[8px]">QR</span>
            </div>
            <span className="text-[12px] text-[#999]">
              &copy; 2026 Traaaction
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://traaaction.com" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#999] hover:text-[#111] transition-colors">
              traaaction.com
            </a>
            <a href="https://traaaction.com/terms" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#999] hover:text-[#111] transition-colors">
              Conditions
            </a>
            <a href="https://traaaction.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#999] hover:text-[#111] transition-colors">
              Confidentialite
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
