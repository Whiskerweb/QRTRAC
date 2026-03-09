export type ColorConfig =
  | { type: 'single'; color: string }
  | { type: 'linearGradient'; colors: [string, string]; rotation: number }
  | { type: 'radialGradient'; colors: [string, string] };

export type ContentType = 'url' | 'text' | 'vcard';

export type DotsType =
  | 'square'
  | 'dots'
  | 'rounded'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';

export type CornerSquareType =
  | 'square'
  | 'dot'
  | 'extra-rounded'
  | 'classy'
  | 'classy-rounded';

export type CornerDotType = 'square' | 'dot';

export type ExportFormat = 'png' | 'svg' | 'jpeg' | 'webp';

export interface QREditorState {
  // Contenu
  contentType: ContentType;
  contentData: Record<string, string>;

  // Style des dots
  dotsStyle: {
    type: DotsType;
    color: ColorConfig;
  };

  // Style des corner squares
  cornerSquaresStyle: {
    type: CornerSquareType;
    color: ColorConfig;
  };

  // Style des corner dots
  cornerDotsStyle: {
    type: CornerDotType;
    color: ColorConfig;
  };

  // Fond
  background: {
    color: ColorConfig;
    transparent: boolean;
  };

  // Logo
  logo: {
    file: File | null;
    url: string | null;
    size: number; // 0.1 à 0.4
    margin: number; // pixels
    shape: 'square' | 'circle' | 'rounded';
  };

  // Export
  exportConfig: {
    format: ExportFormat;
    resolution: number; // 300 à 4000
  };

  // Meta
  name: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  qrSize: number;
}

export interface QRCodeRecord {
  id: string;
  user_id: string;
  name: string;
  content_type: ContentType;
  content_data: Record<string, string>;
  style_config: Omit<QREditorState, 'name' | 'exportConfig' | 'logo'> & {
    logo: Omit<QREditorState['logo'], 'file'>;
  };
  logo_path: string | null;
  thumbnail_url: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  plan: 'free' | 'pro' | 'business';
  qr_count: number;
  created_at: string;
}

export interface QRTemplate {
  id: string;
  name: string;
  preview: string;
  config: Partial<QREditorState>;
}

export type ScannabilityLevel = 'good' | 'warning' | 'danger';

export interface ScannabilityResult {
  score: number; // 0-100
  level: ScannabilityLevel;
  issues: string[];
}
