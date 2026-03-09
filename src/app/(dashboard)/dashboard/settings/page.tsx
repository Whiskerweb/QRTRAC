'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'
import { Settings, User, Globe, Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function SettingsPage() {
    const { user, profile, updateProfile } = useAuth()
    const [displayName, setDisplayName] = useState(profile?.display_name || '')
    const [saving, setSaving] = useState(false)

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
                { icon: Globe, title: 'Langue', desc: 'Choisir la langue de l\'interface', soon: true },
                { icon: Bell, title: 'Notifications', desc: 'Gerer vos preferences de notification', soon: true },
            ].map((section) => (
                <section key={section.title} className="bg-white border border-gray-200 rounded-2xl overflow-hidden opacity-60">
                    <div className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <section.icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-sm font-semibold text-gray-900">{section.title}</h2>
                            <p className="text-xs text-gray-400">{section.desc}</p>
                        </div>
                        {section.soon && (
                            <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Bientot
                            </span>
                        )}
                    </div>
                </section>
            ))}
        </motion.div>
    )
}
