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
      <div className="flex gap-2 overflow-x-auto pb-1">
        {QR_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onApply(template.config)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm whitespace-nowrap"
          >
            {template.preview} {template.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Démarrez avec un template</p>
      <div className="grid grid-cols-2 gap-2">
        {QR_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => onApply(template.config)}
            className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-left group"
          >
            <span className="text-2xl">{template.preview}</span>
            <div>
              <p className="text-sm font-medium group-hover:text-primary transition-colors">
                {template.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
