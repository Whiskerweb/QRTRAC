'use client'

import {
    Link2, Megaphone, BarChart3,
    ChevronLeft, LogOut, QrCode,
    Settings, ExternalLink, Menu, X
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { springSnappy } from '@/lib/animations'

const MotionLink = motion.create(Link)

interface NavItem {
    nameKey: string
    href: string
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

interface NavSection {
    titleKey: string
    items: NavItem[]
}

const navigationConfig: NavSection[] = [
    {
        titleKey: '',
        items: [
            { nameKey: 'qrCodes', href: '/dashboard', icon: QrCode },
        ]
    },
    {
        titleKey: 'marketing',
        items: [
            { nameKey: 'links', href: '/dashboard/links', icon: Link2 },
            { nameKey: 'campaigns', href: '/dashboard/campaigns', icon: Megaphone },
            { nameKey: 'analytics', href: '/dashboard/analytics', icon: BarChart3 },
        ]
    },
]

interface SidebarNavProps {
    displayName: string
    email: string
}

export function SidebarNav({ displayName, email }: SidebarNavProps) {
    const pathname = usePathname()
    const t = useTranslations('sidebar')
    const tc = useTranslations('common')
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    // Close mobile drawer on route change
    useEffect(() => {
        setMobileOpen(false)
    }, [pathname])

    // Lock body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileOpen])

    const initials = displayName.slice(0, 2).toUpperCase()

    const sidebarContent = (
        <>
            {/* Logo + Brand */}
            <div className={`h-16 flex items-center border-b border-gray-100 ${collapsed ? 'px-2 justify-center' : 'px-4'}`}>
                <Link href="/dashboard" className={`flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 transition-colors ${collapsed ? 'justify-center' : 'w-full'}`}>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span className="text-white font-bold text-[11px] tracking-tight">QR</span>
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 leading-tight">QR<span className="text-gray-400">.traaaction</span></p>
                            <p className="text-[11px] text-gray-400 leading-tight">Marketing Hub</p>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <nav className={`flex-1 py-4 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'}`}>
                <LayoutGroup id="qr-sidebar">
                    {navigationConfig.map((section, idx) => (
                        <div key={section.titleKey || 'main'} className={idx > 0 ? 'mt-6' : ''}>
                            {!collapsed && section.titleKey && (
                                <p className="px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    {t(section.titleKey)}
                                </p>
                            )}
                            {collapsed && idx > 0 && <div className="w-8 h-px bg-gray-200 mx-auto mb-3" />}

                            <ul className="space-y-0.5">
                                {section.items.map((item) => {
                                    const isActive = item.href === '/dashboard'
                                        ? pathname === '/dashboard'
                                        : pathname === item.href || pathname.startsWith(item.href + '/')
                                    const Icon = item.icon

                                    return (
                                        <li key={item.nameKey}>
                                            <MotionLink
                                                href={item.href}
                                                title={collapsed ? t(item.nameKey) : undefined}
                                                whileTap={{ scale: 0.97 }}
                                                transition={springSnappy}
                                                className={`flex items-center gap-3 rounded-xl transition-all duration-150 text-[13px] relative group ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} ${isActive
                                                    ? 'bg-gray-900 text-white font-medium shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={1.8} />
                                                {!collapsed && <span>{t(item.nameKey)}</span>}
                                            </MotionLink>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </LayoutGroup>

                {/* Settings link */}
                <div className="mt-6">
                    {!collapsed && (
                        <div className="w-full h-px bg-gray-100 mb-3" />
                    )}
                    {collapsed && <div className="w-8 h-px bg-gray-200 mx-auto mb-3" />}
                    <MotionLink
                        href="/dashboard/settings"
                        title={collapsed ? t('settings') : undefined}
                        whileTap={{ scale: 0.97 }}
                        transition={springSnappy}
                        className={`flex items-center gap-3 rounded-xl transition-all duration-150 text-[13px] group ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2'} ${pathname === '/dashboard/settings'
                            ? 'bg-gray-900 text-white font-medium shadow-sm'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                    >
                        <Settings className={`w-[18px] h-[18px] flex-shrink-0 ${pathname === '/dashboard/settings' ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} strokeWidth={1.8} />
                        {!collapsed && <span>{t('settings')}</span>}
                    </MotionLink>
                </div>
            </nav>

            {/* Back to Traaaction */}
            <div className={`px-3 py-2 border-t border-gray-100 ${collapsed ? 'flex justify-center' : ''}`}>
                <a
                    href="https://traaaction.com/dashboard"
                    className={`flex items-center gap-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors ${collapsed ? 'p-2 justify-center' : 'px-3 py-2 w-full'}`}
                    title={collapsed ? tc('backToTraaaction') : undefined}
                >
                    <ExternalLink className="w-4 h-4 flex-shrink-0" strokeWidth={1.8} />
                    {!collapsed && <span className="text-xs font-medium">{tc('backToTraaaction')}</span>}
                </a>
            </div>

            {/* Collapse (desktop only) */}
            <div className={`px-3 py-2 border-t border-gray-100 max-lg:hidden ${collapsed ? 'flex justify-center' : ''}`}>
                <motion.button
                    onClick={() => setCollapsed(!collapsed)}
                    whileTap={{ scale: 0.97 }}
                    transition={springSnappy}
                    className={`flex items-center gap-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-colors ${collapsed ? 'p-2' : 'px-3 py-2 w-full'}`}
                >
                    <motion.div animate={{ rotate: collapsed ? 180 : 0 }} transition={springSnappy}>
                        <ChevronLeft className="w-4 h-4" />
                    </motion.div>
                    {!collapsed && <span className="text-xs font-medium">{tc('collapse')}</span>}
                </motion.button>
            </div>

            {/* Profile */}
            <div className={`p-3 border-t border-gray-100 ${collapsed ? 'flex justify-center' : ''}`}>
                <div className={`flex items-center gap-3 rounded-xl ${collapsed ? 'p-2 justify-center' : 'px-3 py-2'}`}>
                    <div className={`rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${collapsed ? 'w-9 h-9' : 'w-8 h-8'} text-white text-xs font-semibold shadow-sm`}>
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-[11px] text-gray-400 truncate">{email}</p>
                        </div>
                    )}
                </div>
                {!collapsed && (
                    <form action="/auth/signout" method="post" className="mt-1">
                        <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                            <LogOut className="w-4 h-4" />
                            {tc('signOut')}
                        </button>
                    </form>
                )}
            </div>
        </>
    )

    return (
        <>
            {/* Mobile top bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-4 z-50">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <Menu className="w-5 h-5 text-gray-700" />
                </button>
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                        <span className="text-white font-bold text-[10px]">QR</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">QR<span className="text-gray-400">.traaaction</span></span>
                </Link>
                <div className="w-9" /> {/* Spacer for centering */}
            </div>

            {/* Mobile spacer */}
            <div className="lg:hidden h-14" />

            {/* Mobile drawer overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] lg:hidden"
                            onClick={() => setMobileOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                            className="fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 flex flex-col z-[70] lg:hidden shadow-2xl"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop sidebar */}
            <aside className={`max-lg:hidden fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-64'}`}>
                {sidebarContent}
            </aside>
        </>
    )
}
