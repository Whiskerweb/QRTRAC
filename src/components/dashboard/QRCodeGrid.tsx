'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { QRCodeCard } from './QRCodeCard';
import { QRBulkActionBar } from './QRBulkActionBar';
import { CreateQRModal } from './CreateQRModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Star, Download } from 'lucide-react';
import type { QRCodeRecord } from '@/types/qr';
import { toast } from 'sonner';
import { seedDemoQRCodes } from '@/app/actions/qr-codes';

interface QRCodeGridProps {
  activeFolderId: string | null;
  onMoveToFolder?: (qrId: string) => void;
  onQrCountChange?: (total: number, scanTotal: number, favCount: number) => void;
}

export function QRCodeGrid({ activeFolderId, onMoveToFolder, onQrCountChange }: QRCodeGridProps) {
  const [qrCodes, setQrCodes] = useState<QRCodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQrId, setEditingQrId] = useState<string | undefined>(undefined);
  const [seeding, setSeeding] = useState(false);
  const supabase = createClient();

  const fetchQRCodes = useCallback(async () => {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      toast.error('Erreur lors du chargement');
    } else {
      const codes = (data as QRCodeRecord[]) || [];
      setQrCodes(codes);
      if (onQrCountChange) {
        const total = codes.length;
        const scanTotal = codes.reduce((sum, q) => sum + (q.scan_count || 0), 0);
        const favCount = codes.filter(q => q.is_favorite).length;
        onQrCountChange(total, scanTotal, favCount);
      }
    }
    setLoading(false);
  }, [supabase, onQrCountChange]);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeFolderId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('qr_codes').delete().eq('id', id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      setQrCodes((prev) => prev.filter((q) => q.id !== id));
      setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
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
      folder_id: qr.folder_id,
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

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedIds.size} QR code(s) ?`)) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('qr_codes').delete().in('id', ids);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      setQrCodes(prev => prev.filter(q => !selectedIds.has(q.id)));
      setSelectedIds(new Set());
      toast.success(`${ids.length} QR code(s) supprimé(s)`);
    }
  };

  const handleEdit = (id: string) => {
    setEditingQrId(id);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingQrId(undefined);
  };

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await seedDemoQRCodes();
      if (res.success) {
        toast.success(`${res.count} QR codes demo installés`);
        fetchQRCodes();
      } else {
        toast.error(res.error || 'Erreur lors de l\'installation');
      }
    } catch {
      toast.error('Erreur lors de l\'installation');
    } finally {
      setSeeding(false);
    }
  };

  const folderFiltered = qrCodes.filter(q => {
    if (activeFolderId === null) return true;
    if (activeFolderId === 'uncategorized') return !q.folder_id;
    return q.folder_id === activeFolderId;
  });

  const filtered = folderFiltered.filter((q) => {
    if (favoritesOnly && !q.is_favorite) return false;
    if (search && !q.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 relative">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-gray-50 border-gray-200"
          />
        </div>
        <Button
          variant={favoritesOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={favoritesOnly ? 'bg-gray-900 hover:bg-gray-800' : ''}
        >
          <Star className={`mr-2 h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
          Favoris
        </Button>
        <Button
          size="sm"
          className="bg-gray-900 hover:bg-gray-800 text-white"
          onClick={() => { setEditingQrId(undefined); setShowCreateModal(true); }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau QR
        </Button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          {qrCodes.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-gray-400">▪</span>
              </div>
              <p className="text-gray-600 font-medium">
                Aucun QR code pour l&apos;instant
              </p>
              <p className="text-sm text-gray-400">
                Créez votre premier QR code ou installez des exemples
              </p>
              <div className="flex items-center justify-center gap-3 mt-3">
                <Button
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                  onClick={() => { setEditingQrId(undefined); setShowCreateModal(true); }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer un QR code
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSeedDemo}
                  disabled={seeding}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {seeding ? 'Installation...' : 'Installer des exemples'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-gray-400">Aucun résultat pour cette recherche</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((qr) => (
            <QRCodeCard
              key={qr.id}
              qr={qr}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
              onMoveToFolder={onMoveToFolder}
              onEdit={handleEdit}
              selected={selectedIds.has(qr.id)}
              onToggleSelect={handleToggleSelect}
              selectionMode={selectedIds.size > 0}
            />
          ))}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <QRBulkActionBar
          count={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onDelete={handleBulkDelete}
          onMoveToFolder={onMoveToFolder ? () => {
            const ids = Array.from(selectedIds);
            if (ids.length > 0) onMoveToFolder(ids[0]);
          } : undefined}
        />
      )}

      {/* QR Editor Modal */}
      <CreateQRModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={fetchQRCodes}
        qrId={editingQrId}
      />
    </div>
  );
}
