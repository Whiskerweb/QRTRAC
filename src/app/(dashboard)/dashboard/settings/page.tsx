'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'
import { Settings, User, Globe, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { user, profile, loading, updateProfile } = useAuth()
    const [displayName, setDisplayName] = useState('')
    const [saving, setSaving] = useState(false)

    // Sync displayName when profile loads (async)
    useEffect(() => {
        if (profile?.display_name) setDisplayName(profile.display_name)
    }, [profile])

    const handleSave = async () => {
        if (!displayName.trim()) return
        setSaving(true)
        const { error } = await updateProfile({ display_name: displayName.trim() })
        if (error) {
            toast.error('Erreur lors de la sauvegarde')
        } else {
            toast.success('Profil mis a jour')
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="max-w-2xl space-y-8">
                <div>
                    <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-gray-100 rounded animate-pulse mt-2" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                        <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <motion.div {...fadeInUp} className="max-w-2xl space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Parametres</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gerez votre profil et vos preferences
                </p>
            </div>

            {/* Profile Section */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">Profil</h2>
                        <p className="text-xs text-gray-400">Vos informations personnelles</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Email</label>
                        <Input
                            value={user?.email || ''}
                            disabled
                            className="bg-gray-50 text-gray-400 h-10 rounded-xl border-gray-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Nom d&apos;affichage</label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Votre nom"
                            className="h-10 rounded-xl border-gray-200"
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving || !displayName.trim()}
                            size="sm"
                            className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg h-9 px-4 text-xs"
                        >
                            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                        </Button>
                    </div>
                </div>
            </section>

            {/* Coming Soon Sections */}
            {[
                { icon: Globe, title: 'Langue', desc: 'Choisir la langue de l\'interface' },
                { icon: Bell, title: 'Notifications', desc: 'Gerer vos preferences de notification' },
            ].map((section) => (
                <section key={section.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                            <section.icon className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-gray-400">{section.title}</h2>
                            <p className="text-xs text-gray-300">{section.desc}</p>
                        </div>
                        <span className="text-[10px] font-medium bg-gray-900 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                            Bientot
                        </span>
                    </div>
                </section>
            ))}
        </motion.div>
    )
}
