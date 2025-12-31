export interface ProductDimensions {
  length?: string;
  width?: string;
  height?: string;
  raw: string; // The primary display string (e.g., "36x24x12 inches")
}

export interface PlatformListing {
  platform: string;
  title: string;
  description: string;
  price?: string;
  numericPrice?: number;
  url?: string;
  dimensions?: string;
}

export interface CrossPlatformResearch {
  listings: PlatformListing[];
  mergedMaster: string;
  commonKeywords: string[];
  groundingSources?: { uri: string; title: string }[];
  confirmedDimensions?: string;
  dimensionSourceCount: number;
  visualSignature?: string; 
}

export interface ProductMetadata {
  garmentType: string;
  fabricTexture: string;
  colors: string[];
  pattern: string;
  neckline: string;
  sleeveStyle: string;
  brandClues: string;
  suggestedName: string;
  visualSignature: string; 
}

export interface ProductDetails {
  name: string;
  brand: string;
  category: string;
  fabric: string;
  colors: string;
  price: string;
  dimensions: string;
  itemsIncluded: string;
  styleCode: string;
  topType: string;
  bottomType: string;
  pattern: string;
  occasion: string;
  size: string;
  sleeveLength: string;
  neck: string;
  fabricCare: string;
  shippingDays: string;
}

export interface ListingSection {
  description: string;
  fabricCare: string;
  shipping: string;
  moreInfo: Record<string, string>;
}

export interface FullListing {
  casual: ListingSection;
  professional: ListingSection;
  luxurious: ListingSection;
}

export interface MatchResult {
  isMatch: boolean;
  confidence: number;
  reason: string;
  mismatchedIndices: number[];
  mergedMetadata: ProductMetadata | null;
}