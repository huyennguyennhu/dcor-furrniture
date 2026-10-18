// Dữ liệu Hành chính Việt Nam mới dựa trên cột D (Tỉnh/Thành phố mới) và cột E (Phường/Xã mới)
import administrativeData from './vietnam-administrative-data.json';

export const VIETNAM_ADMINISTRATIVE_DATA: Record<string, string[]> = administrativeData as Record<string, string[]>;

// Danh sách tất cả các Tỉnh / Thành phố mới (Cột D)
export const ALL_VIETNAM_PROVINCE_NAMES: string[] = Object.keys(VIETNAM_ADMINISTRATIVE_DATA);

/**
 * Lấy danh sách các Phường / Xã mới (Cột E) theo Tỉnh / Thành phố mới (Cột D)
 */
export function getWardsForProvince(provinceName: string): string[] {
  if (!provinceName) return [];
  
  if (VIETNAM_ADMINISTRATIVE_DATA[provinceName]) {
    return VIETNAM_ADMINISTRATIVE_DATA[provinceName];
  }

  // Tìm kiếm tương đối nếu người dùng truyền chuỗi gần đúng
  const normalizedSearch = provinceName.toLowerCase().replace(/^(tỉnh|thành phố|tp\.)\s*/, '').trim();
  const matchedKey = Object.keys(VIETNAM_ADMINISTRATIVE_DATA).find(key => {
    const normalizedKey = key.toLowerCase().replace(/^(tỉnh|thành phố|tp\.)\s*/, '').trim();
    return normalizedKey === normalizedSearch || key.includes(provinceName) || provinceName.includes(key);
  });

  if (matchedKey && VIETNAM_ADMINISTRATIVE_DATA[matchedKey]) {
    return VIETNAM_ADMINISTRATIVE_DATA[matchedKey];
  }

  return [];
}

/**
 * Hàm hỗ trợ tương thích ngược
 */
export function getDistrictsForProvince(provinceName: string): string[] {
  return [];
}

export function getWardsForDistrict(provinceName: string, districtName?: string): string[] {
  return getWardsForProvince(provinceName);
}
