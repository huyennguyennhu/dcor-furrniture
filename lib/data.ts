import catalogData from './data/catalog.json';
import configData from './data/config.json';
import pricesData from './data/prices.json';

export interface ProductPrice {
  price: number;
  formattedPrice: string;
  currency: string;
}

export interface CatalogProduct {
  id?: string;
  productId: string;
  shortDescription: string;
  shortDescription_vi?: string;
  category: string;
  variantUrl: string;
  images: string[];
  refinementColors: string[];
  refinementColors_vi?: string[];
  refinementMaterials: string[];
  refinementMaterials_vi?: string[];
  prices: ProductPrice[];
  lowestPrices: ProductPrice[];
  isBestSeller?: boolean;
  isNew?: boolean;
  createdAt?: string | Date;
}

export interface LegStyle {
  id: string;
  name: string;
  name_vi?: string;
  imageLink: string;
  price?: number;
}

export interface Swatch {
  id: string;
  name: string;
  name_vi?: string;
  imageLink: string;
  price?: number;
  group?: 'fabric' | 'leather';
  groupName?: string;
  refinementColor?: string;
}

export interface IndiviConfig {
  legStyles: LegStyle[];
  upholsterySwatches: Swatch[];
}

export interface VariantPrice {
  superMasterKey: string;
  legId: string;
  swatchId: string;
  price: number;
  formattedPrice: string;
}

export const BOCONCEPT_CATALOG = catalogData as unknown as CatalogProduct[];
export const BOCONCEPT_INDIVI_CONFIG = configData as unknown as IndiviConfig;
export const BOCONCEPT_VARIANT_PRICES = pricesData as unknown as VariantPrice[];
