import { CatalogProduct } from '@/lib/data';

export const getProductPriceVal = (prod: CatalogProduct) =>
  prod.prices?.[0]?.price ?? 0;

export const getProductPriceFormatted = (prod: CatalogProduct) =>
  prod.prices?.[0]?.formattedPrice ?? 'Liên hệ';

export const getLowestPriceFormatted = (prod: CatalogProduct) =>
  prod.lowestPrices?.[0]?.formattedPrice ?? null;

export const isOnSale = (prod: CatalogProduct) => {
  const base = prod.prices?.[0]?.price ?? 0;
  const low = prod.lowestPrices?.[0]?.price ?? 0;
  return low > 0 && low < base;
};
