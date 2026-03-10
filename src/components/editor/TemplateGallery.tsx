'use client';

import { QR_TEMPLATES } from '@/lib/qr/templates';
import type { QREditorState } from '@/types/qr';

interface TemplateGalleryProps {
  onApply: (config: Partial<QREditorState>) => void;
  compact?: boolean;
}

export function TemplateGallery({ onApply, compact = false }: TemplateGalleryProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {QR_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onApply(template.config)}
            title={template.name}
            className="group relative flex-shrink-0"
          >
            <div
              className="w-9 h-9 rounded-xl border-2 border-gray-200 hover:border-gray-400 transition-all hover:scale-110 shadow-sm"
              style={{ background: template.preview }}
            />
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">Templates</p>
      <div className="grid grid-cols-2 gap-2">
        {QR_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onApply(template.config)}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 transition-all text-left group"
          >
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm"
              style={{ background: template.preview }}
            />
            <span className="text-[13px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              {template.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
