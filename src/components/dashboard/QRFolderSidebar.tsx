'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { QrCode, FolderOpen, ChevronRight, Plus, MoreHorizontal, Pencil, Trash2, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createQRFolder, updateQRFolder, deleteQRFolder, getQRFolderTree } from '@/app/actions/qr-folders'
import type { QRFolderNode } from '@/types/qr'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface QRFolderSidebarProps {
    activeFolderId: string | null
    onSelectFolder: (folderId: string | null) => void
    totalQrCount: number
}

export function QRFolderSidebar({ activeFolderId, onSelectFolder, totalQrCount }: QRFolderSidebarProps) {
    const [folders, setFolders] = useState<QRFolderNode[]>([])
    const [expanded, setExpanded] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState<string | null>(null) // null = root, parentId for sub
    const [showCreate, setShowCreate] = useState(false)
    const [renaming, setRenaming] = useState<string | null>(null)
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const loadFolders = useCallback(async () => {
        const result = await getQRFolderTree()
        if (result.success && result.data) {
            setFolders(result.data)
        }
    }, [])

    useEffect(() => {
        loadFolders()
    }, [loadFolders])

    useEffect(() => {
        if ((showCreate || renaming) && inputRef.current) {
            inputRef.current.focus()
        }
    }, [showCreate, renaming])

    const handleCreate = async () => {
        if (!inputValue.trim()) {
            setShowCreate(false)
            setCreating(null)
            return
        }
        const result = await createQRFolder({
            name: inputValue.trim(),
            parentId: creating,
        })
        if (result.success) {
            toast.success('Dossier créé')
            setInputValue('')
            setShowCreate(false)
            setCreating(null)
            loadFolders()
        } else {
            toast.error(result.error || 'Erreur')
        }
    }

    const handleRename = async (id: string) => {
        if (!inputValue.trim()) {
            setRenaming(null)
            return
        }
        const result = await updateQRFolder(id, { name: inputValue.trim() })
        if (result.success) {
            toast.success('Dossier renommé')
            setRenaming(null)
            setInputValue('')
            loadFolders()
        } else {
            toast.error(result.error || 'Erreur')
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteQRFolder(id)
        if (result.success) {
            toast.success('Dossier supprimé')
            if (activeFolderId === id) onSelectFolder(null)
            loadFolders()
        } else {
            toast.error(result.error || 'Erreur')
        }
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const startCreateSub = (parentId: string) => {
        setCreating(parentId)
        setShowCreate(true)
        setInputValue('')
        setExpanded(prev => new Set(prev).add(parentId))
    }

    const startRename = (folder: QRFolderNode) => {
        setRenaming(folder.id)
        setInputValue(folder.name)
    }

    const renderFolder = (folder: QRFolderNode, depth: number = 0) => {
        const isActive = activeFolderId === folder.id
        const isExpanded = expanded.has(folder.id)
        const hasChildren = folder.children.length > 0

        return (
            <div key={folder.id}>
                {renaming === folder.id ? (
                    <div className="px-2 py-1" style={{ paddingLeft: `${8 + depth * 16}px` }}>
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRename(folder.id)
                                if (e.key === 'Escape') setRenaming(null)
                            }}
                            onBlur={() => handleRename(folder.id)}
                            className="h-7 text-xs"
                        />
                    </div>
                ) : (
                    <div
                        className={`group flex items-center gap-1.5 px-2 py-1.5 mx-1 rounded-lg cursor-pointer text-[13px] transition-colors ${
                            isActive
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        style={{ paddingLeft: `${8 + depth * 16}px` }}
                        onClick={() => onSelectFolder(folder.id)}
                    >
                        {hasChildren ? (
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleExpand(folder.id) }}
                                className="p-0.5 rounded hover:bg-gray-100"
                            >
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                        ) : (
                            <span className="w-4" />
                        )}
                        <Folder
                            className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-gray-700' : 'text-gray-400'}`}
                            style={{ color: isActive ? undefined : folder.color }}
                            fill={isActive ? 'currentColor' : 'none'}
                        />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <span className={`text-[11px] tabular-nums ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                            {folder.qrCount}
                        </span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <button className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity">
                                    <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => startRename(folder)}>
                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Renommer
                                </DropdownMenuItem>
                                {depth === 0 && (
                                    <DropdownMenuItem onClick={() => startCreateSub(folder.id)}>
                                        <Plus className="w-3.5 h-3.5 mr-2" /> Sous-dossier
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                    onClick={() => handleDelete(folder.id)}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden"
                        >
                            {folder.children.map(child => renderFolder(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Inline create for sub-folder */}
                {showCreate && creating === folder.id && (
                    <div className="px-2 py-1" style={{ paddingLeft: `${24 + depth * 16}px` }}>
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Nom du dossier..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate()
                                if (e.key === 'Escape') { setShowCreate(false); setCreating(null) }
                            }}
                            onBlur={handleCreate}
                            className="h-7 text-xs"
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="w-full flex flex-col">
            <div className="px-3 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Dossiers</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                            setCreating(null)
                            setShowCreate(true)
                            setInputValue('')
                        }}
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>

                {/* All QR codes */}
                <button
                    onClick={() => onSelectFolder(null)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
                        activeFolderId === null
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <QrCode className={`w-4 h-4 ${activeFolderId === null ? 'text-gray-700' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">Tous les QR</span>
                    <span className={`text-[11px] tabular-nums ${activeFolderId === null ? 'text-gray-500' : 'text-gray-400'}`}>
                        {totalQrCount}
                    </span>
                </button>

                {/* Uncategorized */}
                <button
                    onClick={() => onSelectFolder('uncategorized')}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-colors ${
                        activeFolderId === 'uncategorized'
                            ? 'bg-gray-100 text-gray-900 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <FolderOpen className={`w-4 h-4 ${activeFolderId === 'uncategorized' ? 'text-gray-700' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">Non classés</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-1 pb-4">
                {folders.map(folder => renderFolder(folder))}

                {/* Root-level create input */}
                {showCreate && creating === null && (
                    <div className="px-2 py-1">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Nom du dossier..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate()
                                if (e.key === 'Escape') { setShowCreate(false) }
                            }}
                            onBlur={handleCreate}
                            className="h-7 text-xs"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
