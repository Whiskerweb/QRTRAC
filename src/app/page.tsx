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
import { LayoutDashboard, LogOut, QrCode, Link2, BarChart3 } from 'lucide-react';
import { LandingEditor } from '@/components/landing/LandingEditor';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = '';
  let initials = '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName = profile?.display_name || user.email?.split('@')[0] || 'Utilisateur';
    initials = displayName.slice(0, 2).toUpperCase();
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-xl z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-[11px] tracking-tight">QR</span>
          </div>
          <span className="font-semibold text-sm">
            QR<span className="text-gray-400">.traaaction</span>
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          {user ? (
            <>
              {/* Quick nav pills */}
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-gray-900 h-8 px-3 rounded-lg">
                    <QrCode className="h-3.5 w-3.5" />
                    QR Codes
                  </Button>
                </Link>
                <Link href="/dashboard/links">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-gray-900 h-8 px-3 rounded-lg">
                    <Link2 className="h-3.5 w-3.5" />
                    Liens
                  </Button>
                </Link>
                <Link href="/dashboard/analytics">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-gray-900 h-8 px-3 rounded-lg">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Stats
                  </Button>
                </Link>
              </div>

              <Link href="/dashboard">
                <Button size="sm" className="gap-1.5 text-xs bg-gray-900 text-white hover:bg-gray-800 h-8 px-3.5 rounded-lg shadow-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-1 h-8 w-8 rounded-full p-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
                      {initials}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl shadow-lg border-gray-200">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 text-gray-400" />
                      Dashboard QR
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="https://traaaction.com/dashboard" className="flex items-center gap-2 cursor-pointer">
                      <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                      Traaaction Dashboard
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action="/auth/signout" method="post">
                    <DropdownMenuItem asChild>
                      <button type="submit" className="w-full flex items-center gap-2 text-red-500">
                        <LogOut className="h-4 w-4" />
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
                <Button variant="ghost" size="sm" className="text-xs text-gray-500 hover:text-gray-900 h-8 rounded-lg">Se connecter</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gray-900 text-white hover:bg-gray-800 h-8 px-4 rounded-lg text-xs shadow-sm">
                  S&apos;inscrire gratuitement
                </Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero + Editor */}
      <main className="flex-1 flex flex-col px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Generateur de{' '}
            <span className="bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent">
              QR codes
            </span>
            {' '}gratuit
          </h1>
          <p className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
            Creez et personnalisez vos QR codes en quelques secondes.
            Lien, texte ou contact — telechargez en PNG ou SVG.
          </p>
        </div>
        <div className="flex-1 max-w-6xl w-full mx-auto">
          <LandingEditor userId={user?.id} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-5 text-center">
        <p className="text-xs text-gray-400">
          Un outil par{' '}
          <a
            href="https://traaaction.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            traaaction.com
          </a>
          {' '}&middot; &copy; 2026 Traaaction
        </p>
      </footer>
    </div>
  );
}
