'use client';

import { Link2, FileText, UserCircle } from 'lucide-react';
import type { QREditorState, ContentType } from '@/types/qr';

interface DataPanelProps {
  state: QREditorState;
  onContentTypeChange: (type: ContentType) => void;
  onDataChange: (key: string, value: string) => void;
}

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'url', label: 'URL', icon: Link2 },
  { value: 'text', label: 'Texte', icon: FileText },
  { value: 'vcard', label: 'Contact', icon: UserCircle },
];

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[13px] text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  'w-full text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 placeholder:text-gray-300';

export function DataPanel({ state, onContentTypeChange, onDataChange }: DataPanelProps) {
  const d = state.contentData;

  return (
    <div className="space-y-5">
      {/* Content type selector */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Type de contenu</span>
        <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
          {CONTENT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => onContentTypeChange(t.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                  state.contentType === t.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields */}
      {state.contentType === 'url' && (
        <FieldGroup label="URL de destination">
          <input
            type="url"
            placeholder="https://exemple.com"
            value={d.url || ''}
            onChange={(e) => onDataChange('url', e.target.value)}
            className={inputClass}
          />
        </FieldGroup>
      )}

      {state.contentType === 'text' && (
        <FieldGroup label="Texte">
          <textarea
            placeholder="Votre texte..."
            value={d.text || ''}
            onChange={(e) => onDataChange('text', e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </FieldGroup>
      )}

      {state.contentType === 'vcard' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Prénom">
              <input
                placeholder="Jean"
                value={d.firstName || ''}
                onChange={(e) => onDataChange('firstName', e.target.value)}
                className={inputClass}
              />
            </FieldGroup>
            <FieldGroup label="Nom">
              <input
                placeholder="Dupont"
                value={d.lastName || ''}
                onChange={(e) => onDataChange('lastName', e.target.value)}
                className={inputClass}
              />
            </FieldGroup>
          </div>
          <FieldGroup label="Téléphone">
            <input
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={d.phone || ''}
              onChange={(e) => onDataChange('phone', e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Email">
            <input
              type="email"
              placeholder="jean@exemple.com"
              value={d.email || ''}
              onChange={(e) => onDataChange('email', e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Organisation">
            <input
              placeholder="Ma Société"
              value={d.organization || ''}
              onChange={(e) => onDataChange('organization', e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
          <FieldGroup label="Site web">
            <input
              placeholder="https://mon-site.com"
              value={d.website || ''}
              onChange={(e) => onDataChange('website', e.target.value)}
              className={inputClass}
            />
          </FieldGroup>
        </div>
      )}
    </div>
  );
}
