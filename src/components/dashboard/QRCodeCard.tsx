'use client';

import { useState } from 'react';
import Link from 'next/link';
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
import { MoreHorizontal, Edit, Copy, Download, Trash2, Star } from 'lucide-react';
import type { QRCodeRecord } from '@/types/qr';

interface QRCodeCardProps {
  qr: QRCodeRecord;
  onDelete: (id: string) => void;
  onDuplicate: (qr: QRCodeRecord) => void;
  onToggleFavorite: (id: string, value: boolean) => void;
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

export function QRCodeCard({ qr, onDelete, onDuplicate, onToggleFavorite }: QRCodeCardProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Supprimer ce QR code ?')) return;
    setLoading(true);
    onDelete(qr.id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative bg-muted/30 flex items-center justify-center h-40 border-b border-border">
        {qr.thumbnail_url ? (
          <img
            src={qr.thumbnail_url}
            alt={qr.name}
            className="w-32 h-32 object-contain"
          />
        ) : (
          <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-4xl">▪</span>
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

        {/* Favorite button */}
        <button
          onClick={() => onToggleFavorite(qr.id, !qr.is_favorite)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 hover:bg-background"
        >
          <Star
            className={`h-4 w-4 ${qr.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">{qr.name}</h3>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(qr.created_at), {
                addSuffix: true,
                locale: fr,
              })}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Badge variant="secondary" className="text-xs">
              {CONTENT_TYPE_LABELS[qr.content_type] || qr.content_type}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/editor/${qr.id}`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Éditer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(qr)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </Card>
  );
}
