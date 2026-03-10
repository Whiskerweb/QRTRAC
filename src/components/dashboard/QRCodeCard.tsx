'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Copy, Trash2, Star, ScanLine, FolderInput } from 'lucide-react';
import type { QRCodeRecord } from '@/types/qr';
import { QRCardPreview } from './QRCardPreview';

interface QRCodeCardProps {
  qr: QRCodeRecord;
  onDelete: (id: string) => void;
  onDuplicate: (qr: QRCodeRecord) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
  onMoveToFolder?: (qrId: string) => void;
  onEdit?: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  selectionMode?: boolean;
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  url: 'URL',
  text: 'Texte',
  email: 'Email',
  phone: 'Téléphone',
  sms: 'SMS',
  wifi: 'WiFi',
  vcard: 'Contact',
  geo: 'Lieu',
};

export function QRCodeCard({
  qr,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onMoveToFolder,
  onEdit,
  selected = false,
  onToggleSelect,
  selectionMode = false,
}: QRCodeCardProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce QR code ?')) return;
    setLoading(true);
    onDelete(qr.id);
  };

  return (
    <Card
      className={`group overflow-hidden transition-all duration-150 ${
        selected
          ? 'ring-2 ring-gray-900 shadow-md'
          : 'hover:shadow-md'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative bg-gray-50 flex items-center justify-center h-40 border-b border-gray-100">
        <QRCardPreview qr={qr} size={120} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.03] transition-colors" />

        {/* Checkbox - visible on hover or selection mode */}
        {onToggleSelect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect(qr.id); }}
            className={`absolute top-2 left-2 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              selected
                ? 'bg-gray-900 border-gray-900'
                : selectionMode
                  ? 'border-gray-300 bg-white/80'
                  : 'border-gray-300 bg-white/80 opacity-0 group-hover:opacity-100'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        {/* Content type badge */}
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-[10px] px-1.5 py-0 bg-white/90 text-gray-600 border-0 shadow-sm"
        >
          {CONTENT_TYPE_LABELS[qr.content_type] || qr.content_type}
        </Badge>

        {/* Scan count badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/90 shadow-sm">
          <ScanLine className="w-3 h-3 text-gray-500" />
          <span className="text-[11px] font-medium text-gray-600 tabular-nums">
            {qr.scan_count || 0}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={() => onToggleFavorite(qr.id, !qr.is_favorite)}
          className={`absolute bottom-2 right-2 p-1 rounded-full bg-white/90 shadow-sm transition-opacity ${
            qr.is_favorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Star
            className={`h-3.5 w-3.5 ${qr.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate text-gray-900">{qr.name}</h3>
            <p className="text-[11px] text-gray-400">
              {formatDistanceToNow(new Date(qr.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit?.(qr.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Éditer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(qr)}>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </DropdownMenuItem>
              {onMoveToFolder && (
                <DropdownMenuItem onClick={() => onMoveToFolder(qr.id)}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Déplacer
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={loading}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
