'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { QRCodeCard } from './QRCodeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Star } from 'lucide-react';
import type { QRCodeRecord } from '@/types/qr';
import { toast } from 'sonner';

export function QRCodeGrid() {
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const supabase = createClient();

  const fetchQRCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement');
    } else {
      setQrCodes((data as QRCodeRecord[]) || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('qr_codes').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      setQrCodes((prev) => prev.filter((q) => q.id !== id));
      toast.success('QR code supprimé');
    }
  };

  const handleDuplicate = async (qr: QRCodeRecord) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('qr_codes').insert({
      user_id: user.id,
      name: `${qr.name} (copie)`,
      content_type: qr.content_type,
      content_data: qr.content_data,
      style_config: qr.style_config,
      logo_path: qr.logo_path,
    });

    if (error) {
      toast.error('Erreur lors de la duplication');
    } else {
      toast.success('QR code dupliqué');
      fetchQRCodes();
    }
  };

  const handleToggleFavorite = async (id: string, value: boolean) => {
    const { error } = await supabase
      .from('qr_codes')
      .update({ is_favorite: value })
      .eq('id', id);

    if (!error) {
      setQrCodes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, is_favorite: value } : q))
      );
    }
  };

  const filtered = qrCodes.filter((q) => {
    if (favoritesOnly && !q.is_favorite) return false;
    if (search && !q.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
        >
          <Star className={`mr-2 h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
          Favoris
        </Button>
        <Link href="/dashboard/editor">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau QR
          </Button>
        </Link>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          {qrCodes.length === 0 ? (
            <>
              <div className="text-5xl">▪</div>
              <p className="text-muted-foreground font-medium">
                Aucun QR code pour l&apos;instant
              </p>
              <p className="text-sm text-muted-foreground">
                Créez votre premier QR code design
              </p>
              <Link href="/dashboard/editor">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un QR code
                </Button>
              </Link>
            </>
          ) : (
            <p className="text-muted-foreground">Aucun résultat pour cette recherche</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((qr) => (
            <QRCodeCard
              key={qr.id}
              qr={qr}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
