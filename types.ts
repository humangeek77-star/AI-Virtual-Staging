
export enum DesignStyle {
  MODERN = 'Modern',
  MINIMALIST = 'Minimalist',
  SCANDINAVIAN = 'Scandinavian',
  INDUSTRIAL = 'Industrial',
  BOHEMIAN = 'Bohemian',
  MID_CENTURY_MODERN = 'Mid-Century Modern',
  TRADITIONAL = 'Traditional',
  RUSTIC = 'Rustic',
  COASTAL = 'Coastal',
  LUXURY = 'Luxury/Glam',
  TRANSITIONAL = 'Transitional',
  JAPANDI = 'Japandi',
  FARMHOUSE = 'Farmhouse',
  ART_DECO = 'Art Deco',
  CONTEMPORARY = 'Contemporary',
  ECLECTIC = 'Eclectic',
  MEDITERRANEAN = 'Mediterranean',
  CRAFTSMAN = 'Craftsman',
  VICTORIAN = 'Victorian',
  HOLLYWOOD_REGENCY = 'Hollywood Regency',
  TROPICAL = 'Tropical',
  SOUTHWESTERN = 'Southwestern',
  MAXIMALIST = 'Maximalist',
  ZEN = 'Zen',
  BAUHAUS = 'Bauhaus',
  BRUTALIST = 'Brutalism',
  SHABBY_CHIC = 'Shabby Chic',
  FRENCH_COUNTRY = 'French Country',
  GOTHIC = 'Gothic',
  RETRO = 'Retro'
}

export interface StagingImage {
  id: string;
  originalUrl: string;
  stagedUrl?: string;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  error?: string;
  filename: string;
  style: DesignStyle; // The currently selected style in dropdown
  stagedStyle?: DesignStyle; // The style actually used for the generated image
  history: string[];
  isAIStyleSuggested?: boolean; // New: Indicates if the current 'style' was suggested by AI
}

export interface StagingConfig {
  style: DesignStyle;
  customPrompt?: string;
  isHighQuality: boolean;
}