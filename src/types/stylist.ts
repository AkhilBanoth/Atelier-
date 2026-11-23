export type OccasionId = 'casual' | 'business' | 'night_out';

export type GarmentCategory =
  | 'top'
  | 'bottom'
  | 'outerwear'
  | 'dress'
  | 'footwear'
  | 'bag'
  | 'accessory'
  | 'eyewear'
  | 'belt';

export type SilhouetteTemplate =
  | 'boxy-tee'
  | 'ribbed-tank'
  | 'silk-camisole'
  | 'button-down'
  | 'knit-sweater'
  | 'turtleneck'
  | 'tailored-blazer'
  | 'cropped-cardigan'
  | 'trench-coat'
  | 'leather-moto'
  | 'wide-trousers'
  | 'straight-denim'
  | 'pleated-skirt'
  | 'slip-dress'
  | 'loafers'
  | 'minimal-sneakers'
  | 'strappy-heels'
  | 'slingback-pumps'
  | 'ankle-boots'
  | 'tote-bag'
  | 'crossbody-bag'
  | 'structured-clutch'
  | 'mini-shoulder-bag'
  | 'gold-hoops'
  | 'sculptural-cuff'
  | 'silk-scarf'
  | 'sunglasses'
  | 'leather-belt';

export type BackdropStyle = 'chalk' | 'travertine' | 'linen';

export type SeasonPreference = 'all-season' | 'spring-summer' | 'autumn-winter';

export interface ColorSwatch {
  name: string;
  hex: string;
  role: 'Dominant' | 'Secondary' | 'Accent' | 'Neutral Anchor' | 'Bridge Tone';
  proportion: number; // percentage 5-70
}

export interface AnalyzedItem {
  name: string;
  category: 'top' | 'bottom' | 'outerwear' | 'dress' | 'footwear' | 'bag';
  silhouette: string;
  pattern: string;
  fabric: string;
  formalityRange: string;
  styleSummary: string;
  stylingChallenge: string;
  palette: ColorSwatch[];
}

export interface OutfitPiece {
  id: string;
  name: string;
  category: GarmentCategory;
  silhouette: SilhouetteTemplate;
  colorName: string;
  colorHex: string;
  secondaryColorHex?: string;
  material: string;
  fitNotes: string;
  stylingReason: string;
}

export interface OutfitOption {
  id: string;
  occasion: OccasionId;
  occasionLabel: 'Casual' | 'Business' | 'Night Out';
  title: string;
  vibe: string;
  colorHarmony: string;
  stylistNote: string;
  proportionTip: string;
  paletteUsed: string[];
  pieces: OutfitPiece[];
}

export interface StylingResult {
  id: string;
  source: 'ai' | 'curated';
  itemImageUrl: string;
  season: SeasonPreference;
  createdAt: string;
  item: AnalyzedItem;
  outfits: OutfitOption[];
}

export interface SavedLook {
  id: string;
  savedAt: string;
  itemName: string;
  itemImageUrl: string;
  itemCategory: AnalyzedItem['category'];
  backdrop: BackdropStyle;
  outfit: OutfitOption;
}

export interface SamplePiece {
  id: string;
  title: string;
  subtitle: string;
  categoryLabel: string;
  difficultyNote: string;
  imageUrl: string;
  presetResult: StylingResult;
}
