export const PLACEHOLDER_PRODUCT_IMAGE = '/assets/img/furniture-placeholder.svg';

/**
 * Tách URL gốc nằm bên trong đường dẫn proxy Cloudinary `/image/fetch/.../https://...`.
 * Dùng để fallback khi Cloudinary từ chối ảnh gốc quá giới hạn 10MB (HTTP 400).
 */
export function extractCloudinaryFetchSourceUrl(url: string | undefined | null): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('cloudinary.com') || !url.includes('/image/fetch/')) return null;

  const match = url.match(/\/image\/fetch\/(?:[^/]+\/)*(https?:\/\/.+)$/i);
  if (match && match[1]) {
    return match[1];
  }

  const encodedMatch = url.match(/\/image\/fetch\/(?:[^/]+\/)*(https?%3A%2F%2F.+)$/i);
  if (encodedMatch && encodedMatch[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Tính URL dự phòng tiếp theo cho một URL ảnh vừa tải lỗi.
 * Thứ tự ưu tiên:
 * 1. Link gốc bên trong Cloudinary `/image/fetch/` (nếu có)
 * 2. Các ảnh dự phòng hợp lệ (VD: ảnh bìa `.webp` đã upload lên Cloudinary của sản phẩm)
 * 3. Ảnh placeholder cục bộ
 */
export function resolveNextImageFallback(
  failedUrl: string | undefined | null,
  fallbackCandidates: Array<string | undefined | null> = [],
  triedUrls?: Set<string>
): string {
  const current = (failedUrl || '').trim();
  const isTried = (u: string) => u === current || (triedUrls ? triedUrls.has(u) : false);

  const unwrapped = extractCloudinaryFetchSourceUrl(current);
  if (unwrapped && !isTried(unwrapped)) {
    return unwrapped;
  }

  for (const raw of fallbackCandidates) {
    if (!raw || typeof raw !== 'string') continue;
    const candidate = raw.trim();
    if (!candidate || candidate === PLACEHOLDER_PRODUCT_IMAGE) continue;
    if (!isTried(candidate)) {
      return candidate;
    }
  }

  return PLACEHOLDER_PRODUCT_IMAGE;
}

/**
 * Handler gắn trực tiếp vào sự kiện `(error)` của thẻ `<img>`.
 * Tự động chuyển từ Cloudinary `/image/fetch/` sang link gốc, sau đó sang fallback hoặc placeholder,
 * đồng thời chống vòng lặp lỗi vô hạn.
 */
export function applyImageErrorFallback(
  event: Event,
  fallbackCandidates: Array<string | undefined | null> = []
): string {
  const img = event?.target as HTMLImageElement | null;
  if (!img) return PLACEHOLDER_PRODUCT_IMAGE;

  const currentSrc = img.getAttribute('src') || img.src || '';
  if (currentSrc.endsWith(PLACEHOLDER_PRODUCT_IMAGE)) {
    return PLACEHOLDER_PRODUCT_IMAGE;
  }

  const rawTried = img.dataset['triedSrcs'] || '';
  const triedSet = new Set<string>(rawTried ? rawTried.split('|').filter(Boolean) : []);
  if (currentSrc) triedSet.add(currentSrc);

  const nextUrl = resolveNextImageFallback(currentSrc, fallbackCandidates, triedSet);
  triedSet.add(nextUrl);
  img.dataset['triedSrcs'] = Array.from(triedSet).join('|');

  if (nextUrl !== currentSrc) {
    img.src = nextUrl;
  }
  return nextUrl;
}
