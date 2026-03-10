'use client'

import { motion } from 'framer-motion'
import { Trash2, FolderInput, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QRBulkActionBarProps {
    count: number
    onClearSelection: () => void
    onDelete: () => void
    onMoveToFolder?: () => void
}

export function QRBulkActionBar({ count, onClearSelection, onDelete, onMoveToFolder }: QRBulkActionBarProps) {
    return (
        <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-2.5 flex items-center gap-3"
        >
            <span className="text-sm font-medium tabular-nums">
                {count} sélectionné{count > 1 ? 's' : ''}
            </span>

            <div className="w-px h-5 bg-gray-700" />

            {onMoveToFolder && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMoveToFolder}
                    className="text-white hover:bg-gray-800 h-8"
                >
                    <FolderInput className="w-4 h-4 mr-1.5" />
                    Déplacer
                </Button>
            )}

            <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-red-400 hover:text-red-300 hover:bg-gray-800 h-8"
            >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Supprimer
            </Button>

            <div className="w-px h-5 bg-gray-700" />

            <button
                onClick={onClearSelection}
                className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </motion.div>
    )
}
