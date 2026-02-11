export enum DesignStyle {
  MODERN = 'Modern',
  SCANDINAVIAN = 'Scandinavian',
  INDUSTRIAL = 'Industrial',
  MID_CENTURY_MODERN = 'Mid-Century Modern',
  BOHEMIAN = 'Bohemian',
  TRADITIONAL = 'Traditional',
  MINIMALIST = 'Minimalist',
  COASTAL = 'Coastal',
  FARMHOUSE = 'Farmhouse',
  CONTEMPORARY = 'Contemporary',
  ART_DECO = 'Art Deco',
  JAPANDI = 'Japandi',
  RUSTIC = 'Rustic',
  TRANSITIONAL = 'Transitional',
  MEDITERRANEAN = 'Mediterranean',
  ECLECTIC = 'Eclectic',
  FRENCH_COUNTRY = 'French Country',
  HOLLYWOOD_REGENCY = 'Hollywood Regency',
  SHABBY_CHIC = 'Shabby Chic',
  ZEN = 'Zen',
  BAUHAUS = 'Bauhaus',
  SOUTHWESTERN = 'Southwestern',
  VICTORIAN = 'Victorian',
  GOTHIC = 'Gothic'
}

export type ImageStatus = 'idle' | 'processing' | 'completed' | 'error';

export type DeclutterMode = 'none' | 'auto' | 'manual';

export interface ImageItem {
  id: string;
  original: string;
  generated: string | null;
  status: ImageStatus;
  error?: string;
  style?: DesignStyle;
  customPrompt?: string;
  weatherPrompt?: string;
  declutterMode?: DeclutterMode;
  declutterPrompt?: string;
  isAIAnalysisEnabled?: boolean;
  selected?: boolean;
}

export interface StagingState {
  items: ImageItem[];
  selectedStyle: DesignStyle;
  isRefineModalOpen: boolean;
  activeRefineItemId: string | null;
}
