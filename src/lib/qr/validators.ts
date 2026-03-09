import type { QREditorState, ScannabilityResult, ColorConfig } from '@/types/qr';

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getBaseColor(config: ColorConfig): string {
  if (config.type === 'single') return config.color;
  return config.colors[0];
}

export function calculateScannability(state: QREditorState): ScannabilityResult {
  const issues: string[] = [];
  let score = 100;

  // Vérifier le contraste dots / fond
  if (!state.background.transparent) {
    const dotsColor = getBaseColor(state.dotsStyle.color);
    const bgColor = getBaseColor(state.background.color);
    const contrast = getContrastRatio(dotsColor, bgColor);

    if (contrast < 2) {
      score -= 40;
      issues.push('Contraste très faible entre les dots et le fond');
    } else if (contrast < 3) {
      score -= 20;
      issues.push('Contraste insuffisant entre les dots et le fond');
    } else if (contrast < 4.5) {
      score -= 10;
      issues.push('Contraste limite — testez le scan sur mobile');
    }
  }

  // Vérifier la taille du logo
  if (state.logo.url) {
    if (state.logo.size > 0.35) {
      score -= 20;
      issues.push('Logo trop grand — risque de rendre le QR illisible');
    } else if (state.logo.size > 0.25) {
      score -= 10;
      issues.push('Logo assez grand — niveau de correction H recommandé');
    }

    // Vérifier le niveau de correction d'erreur
    if (state.logo.size > 0.2 && state.errorCorrectionLevel === 'L') {
      score -= 15;
      issues.push('Niveau de correction d\'erreur trop faible avec un logo');
    } else if (state.logo.size > 0.2 && state.errorCorrectionLevel === 'M') {
      score -= 5;
      issues.push('Niveau de correction Q ou H recommandé avec un logo');
    }
  }

  // Vérifier le fond transparent
  if (state.background.transparent) {
    score -= 5;
    issues.push('Fond transparent : assurez un bon contraste avec le fond réel');
  }

  // Bonus pour les bons niveaux de correction
  if (state.errorCorrectionLevel === 'H') {
    score = Math.min(100, score + 5);
  }

  score = Math.max(0, Math.min(100, score));

  const level =
    score >= 70 ? 'good' : score >= 40 ? 'warning' : 'danger';

  return { score, level, issues };
}
