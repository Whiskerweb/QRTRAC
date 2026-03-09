'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { QREditorState, ContentType } from '@/types/qr';

interface DataPanelProps {
  state: QREditorState;
  onContentTypeChange: (type: ContentType) => void;
  onDataChange: (key: string, value: string) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: string }[] = [
  { value: 'url', label: 'URL / Lien', icon: '🔗' },
  { value: 'text', label: 'Texte libre', icon: '📝' },
  { value: 'vcard', label: 'Contact (vCard)', icon: '👤' },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function DataPanel({ state, onContentTypeChange, onDataChange }: DataPanelProps) {
  const d = state.contentData;

  return (
    <div className="space-y-4">
      <FieldGroup label="Type de contenu">
        <Select value={state.contentType} onValueChange={(v) => onContentTypeChange(v as ContentType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONTENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.icon} {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>

      {state.contentType === 'url' && (
        <FieldGroup label="URL">
          <Input
            type="url"
            placeholder="https://exemple.com"
            value={d.url || ''}
            onChange={(e) => onDataChange('url', e.target.value)}
          />
        </FieldGroup>
      )}

      {state.contentType === 'text' && (
        <FieldGroup label="Texte">
          <textarea
            className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Votre texte..."
            value={d.text || ''}
            onChange={(e) => onDataChange('text', e.target.value)}
          />
        </FieldGroup>
      )}

      {state.contentType === 'vcard' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Prénom">
              <Input
                placeholder="Jean"
                value={d.firstName || ''}
                onChange={(e) => onDataChange('firstName', e.target.value)}
              />
            </FieldGroup>
            <FieldGroup label="Nom">
              <Input
                placeholder="Dupont"
                value={d.lastName || ''}
                onChange={(e) => onDataChange('lastName', e.target.value)}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Téléphone">
            <Input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={d.phone || ''}
              onChange={(e) => onDataChange('phone', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Email">
            <Input
              type="email"
              placeholder="jean@exemple.com"
              value={d.email || ''}
              onChange={(e) => onDataChange('email', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Organisation">
            <Input
              placeholder="Ma Société"
              value={d.organization || ''}
              onChange={(e) => onDataChange('organization', e.target.value)}
            />
          </FieldGroup>
          <FieldGroup label="Site web">
            <Input
              placeholder="https://mon-site.com"
              value={d.website || ''}
              onChange={(e) => onDataChange('website', e.target.value)}
            />
          </FieldGroup>
        </>
      )}

    </div>
  );
}
