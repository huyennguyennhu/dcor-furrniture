export interface ProductCategory {
  id: string;
  name: string;
  name_vi?: string;
  slug: string;
  parentId?: string | null;
  parent?: ProductCategory | null;
  children?: ProductCategory[];
  _count?: {
    products: number;
  };
}

export interface ProductPrice {
  price: number;
  formattedPrice: string;
  currency: string;
  isDefaultPrice?: boolean;
}

export interface ProductColorSwatch {
  id: string;
  name: string;
  rawName: string;
  hex: string;
  images: string[];
  price?: number;
}

export interface CatalogProduct {
  id?: string;
  productId: string;
  slug?: string;
  name?: string;
  colorSwatches?: ProductColorSwatch[];
  shortDescription: string;
  shortDescription_vi?: string;
  description?: string;
  description_vi?: string;
  category: string;
  categoryObj?: ProductCategory;
  categoryId?: string;
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
  variants?: any[];
  discountValue?: number;
  discountType?: string;
  isSale?: boolean;
  dimensions?: { width: number; depth: number };
  rating?: number;
  reviewCount?: number;
  room?: string;
  designStyle?: string;
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
