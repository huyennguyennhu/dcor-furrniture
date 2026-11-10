/**
 * Tiện ích xử lý văn bản tiếng Việt cho ChatBot DCor
 * - Chuẩn hóa chữ thường, loại bỏ dấu (NFD), làm sạch ký tự thừa
 * - Mở rộng từ viết tắt và từ điển đồng nghĩa
 * - Trích xuất ngân sách (5tr, dưới 10 triệu, từ 3 đến 8 triệu...)
 * - Trích xuất mã đơn hàng (DC-xxxxxx, ORD-xxxxxx)
 * - Trích xuất số điện thoại bảo mật
 * - Chấm điểm tương đồng ngữ nghĩa / token overlap
 */

// Bảng thay thế từ viết tắt và tiếng lóng phổ biến
const ABBREVIATION_MAP: Record<string, string> = {
  k: 'khong',
  ko: 'khong',
  kh: 'khong',
  hok: 'khong',
  hog: 'khong',
  hem: 'khong',
  hong: 'khong',
  khg: 'khong',
  hongg: 'khong',
  dc: 'duoc',
  'đc': 'duoc',
  duoc: 'duoc',
  'dc.': 'duoc',
  sp: 'san pham',
  sanpham: 'san pham',
  tk: 'tai khoan',
  sdt: 'so dien thoai',
  'sđt': 'so dien thoai',
  tel: 'so dien thoai',
  phone: 'so dien thoai',
  nv: 'nhan vien',
  cskh: 'cham soc khach hang',
  ad: 'admin',
  adm: 'admin',
  sr: 'showroom',
  km: 'khuyen mai',
  vc: 'voucher',
  dh: 'don hang',
  don: 'don hang',
  ship: 'giao hang',
  gh: 'giao hang',
  bh: 'bao hanh',
  dt: 'doi tra',
  tv: 'tu van',
  bn: 'bao nhieu',
  bnh: 'bao nhieu',
  bnhieu: 'bao nhieu',
  nhu: 'nhu',
  ntn: 'nhu the nao',
  tnao: 'the nao',
  vs: 'voi',
  ak: 'a',
  ah: 'a',
  nhe: 'nha',
  nhoe: 'nha',
  kts: 'kien truc su',
};

// Từ khóa khiếu nại nghiêm trọng kích hoạt chuyển nhân viên ngay
export const COMPLAINT_KEYWORDS = [
  'khieu nai',
  'lua dao',
  'hoan tien gap',
  'te',
  'qua te',
  'buc minh',
  'that vong',
  'kien shop',
  'lua gat',
  'doi tien',
  'mat day',
  'lua gao',
  'chem gio',
  'vo trach nhiem',
  'chua thay giao',
];

/**
 * Loại bỏ dấu tiếng Việt (NFD)
 */
export function removeVietnameseDiacritics(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

/**
 * Chuẩn hóa văn bản đầu vào: chữ thường, bỏ dấu, chuẩn hóa viết tắt, loại bỏ ký tự rác
 */
export function normalizeChatText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.toLowerCase().trim();

  // Chuẩn hóa một số ký tự đặc biệt thành dấu cách
  text = text.replace(/[\r\n\t,;.?!/\\_~`@#$%^&*()+=<>'"[\]{}|]/g, ' ');

  // Loại bỏ dấu tiếng Việt
  text = removeVietnameseDiacritics(text);

  // Tách từ để thay thế viết tắt
  const words = text.split(/\s+/).filter(Boolean);
  const normalizedWords = words.map((w) => ABBREVIATION_MAP[w] || w);

  return normalizedWords.join(' ').trim();
}

/**
 * Interface kết quả trích xuất ngân sách
 */
export interface ExtractedBudget {
  minPrice?: number;
  maxPrice?: number;
  rawText?: string;
}

/**
 * Trích xuất khoảng ngân sách từ câu hỏi
 * Hỗ trợ: '5tr', 'dưới 10 triệu', 'từ 3 đến 8 triệu', 'trên 20tr', 'khoảng 15 triệu'
 */
export function extractBudget(rawText: string): ExtractedBudget | null {
  if (!rawText) return null;
  const normalized = normalizeChatText(rawText);

  // 1. Khoảng giá: 'từ X đến Y triệu/tr', 'X - Y triệu/tr', 'X den Y tr'
  const rangeRegex = /(?:tu\s+)?(\d+(?:\.\d+)?)\s*(?:den|-)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|m|k|nghin)?/i;
  const rangeMatch = normalized.match(rangeRegex);
  if (rangeMatch) {
    const rawMin = parseFloat(rangeMatch[1]);
    const rawMax = parseFloat(rangeMatch[2]);
    const unit = (rangeMatch[3] || 'trieu').toLowerCase();
    const multiplier = unit === 'k' || unit === 'nghin' ? 1_000 : 1_000_000;
    return {
      minPrice: Math.round(rawMin * multiplier),
      maxPrice: Math.round(rawMax * multiplier),
      rawText: rangeMatch[0],
    };
  }

  // 2. Dưới / không quá / ít hơn: 'dưới 10 triệu', 'duoi 5tr', '< 7tr'
  const underRegex = /(?:duoi|<|it hon|khong qua|tam duoi)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|m|k|nghin)?/i;
  const underMatch = normalized.match(underRegex);
  if (underMatch) {
    const val = parseFloat(underMatch[1]);
    const unit = (underMatch[2] || 'trieu').toLowerCase();
    const multiplier = unit === 'k' || unit === 'nghin' ? 1_000 : 1_000_000;
    return {
      minPrice: 0,
      maxPrice: Math.round(val * multiplier),
      rawText: underMatch[0],
    };
  }

  // 3. Trên / hơn: 'trên 20tr', 'tren 15 triệu', '> 10tr'
  const overRegex = /(?:tren|>|hon|tam tren)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|m|k|nghin)?/i;
  const overMatch = normalized.match(overRegex);
  if (overMatch) {
    const val = parseFloat(overMatch[1]);
    const unit = (overMatch[2] || 'trieu').toLowerCase();
    const multiplier = unit === 'k' || unit === 'nghin' ? 1_000 : 1_000_000;
    return {
      minPrice: Math.round(val * multiplier),
      rawText: overMatch[0],
    };
  }

  // 4. Khoảng / tầm: 'khoảng 15 triệu', 'tam 15tr' (cho phép dung sai +- 25%)
  const approxRegex = /(?:khoang|tam|co|tam co)\s*(\d+(?:\.\d+)?)\s*(trieu|tr|m|k|nghin)?/i;
  const approxMatch = normalized.match(approxRegex);
  if (approxMatch) {
    const val = parseFloat(approxMatch[1]);
    const unit = (approxMatch[2] || 'trieu').toLowerCase();
    const multiplier = unit === 'k' || unit === 'nghin' ? 1_000 : 1_000_000;
    const base = Math.round(val * multiplier);
    return {
      minPrice: Math.round(base * 0.75),
      maxPrice: Math.round(base * 1.25),
      rawText: approxMatch[0],
    };
  }

  // 5. Số đơn kèm đơn vị: '5tr', '10 triệu', '500k'
  const singleRegex = /\b(\d+(?:\.\d+)?)\s*(trieu|tr|m|k|nghin)\b/i;
  const singleMatch = normalized.match(singleRegex);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    const unit = singleMatch[2].toLowerCase();
    const multiplier = unit === 'k' || unit === 'nghin' ? 1_000 : 1_000_000;
    const exact = Math.round(val * multiplier);
    return {
      maxPrice: exact,
      rawText: singleMatch[0],
    };
  }

  return null;
}

/**
 * Trích xuất mã đơn hàng định dạng DC-xxxxxx hoặc ORD-xxxxxx
 * Hỗ trợ các biến thể: DC-123456, dc-123456, DC 123456, dc123456, ORD-1791280290761-1
 */
export function extractOrderNumber(text: string): string | null {
  if (!text) return null;
  const clean = text.trim();

  // 1. Kiểm tra format ORD-...
  const ordMatch = clean.match(/\b(ORD-[0-9a-zA-Z-]+)\b/i);
  if (ordMatch) {
    return ordMatch[1].toUpperCase();
  }

  // 2. Kiểm tra format DC-xxxxxx
  const dcMatch = clean.match(/\b(?:DC|dc)[-\s]?([0-9a-zA-Z]{5,12})\b/i);
  if (dcMatch) {
    return `DC-${dcMatch[1].toUpperCase()}`;
  }

  return null;
}

/**
 * Trích xuất số điện thoại Việt Nam (10 chữ số)
 */
export function extractPhoneNumber(text: string): string | null {
  if (!text) return null;
  const match = text.match(/(?:(?:\+84|84|0)[3|5|7|8|9])([0-9]{8})\b/);
  if (match) {
    const full = match[0].replace('+84', '0').replace(/^84/, '0');
    return full;
  }
  return null;
}

/**
 * Trích xuất danh mục sản phẩm, phòng và kích thước
 */
export function extractProductSearchCriteria(rawText: string): {
  categoryKeyword?: string;
  room?: string;
  dimensions?: string;
  budget?: ExtractedBudget | null;
} {
  const normalized = normalizeChatText(rawText);

  // Từ khóa danh mục
  const categories = [
    { key: 'sofa', terms: ['sofa', 'salon', 'ghe sofa'] },
    { key: 'ban an', terms: ['ban an', 'bo ban an'] },
    { key: 'ban tra', terms: ['ban tra', 'ban sofa', 'ban cafe'] },
    { key: 'ban lam viec', terms: ['ban lam viec', 'ban hoc'] },
    { key: 'giuong', terms: ['giuong', 'giuong ngu'] },
    { key: 'tu quan ao', terms: ['tu quan ao', 'tu ao', 'tu do'] },
    { key: 'ke tivi', terms: ['ke tivi', 'ke tv'] },
    { key: 'tu giay', terms: ['tu giay', 'ke giay'] },
    { key: 'ghe', terms: ['ghe don', 'ghe thu gian', 'ghe'] },
    { key: 'den', terms: ['den', 'den chum', 'den ban', 'den dung'] },
    { key: 'tham', terms: ['tham', 'tham trai san', 'tham sofa'] },
    { key: 'nem', terms: ['nem', 'dem'] },
    { key: 'guong', terms: ['guong', 'guong dung'] },
  ];

  let matchedCategory: string | undefined;
  for (const cat of categories) {
    for (const term of cat.terms) {
      if (normalized.includes(term)) {
        matchedCategory = cat.key;
        break;
      }
    }
    if (matchedCategory) break;
  }

  // Phòng
  const rooms = [
    { key: 'phòng khách', terms: ['phong khach'] },
    { key: 'phòng ngủ', terms: ['phong ngu'] },
    { key: 'phòng ăn', terms: ['phong an', 'bep', 'nha bep'] },
    { key: 'phòng làm việc', terms: ['phong lam viec', 'phong hoc'] },
    { key: 'ban công', terms: ['ban cong', 'ngoai troi'] },
  ];

  let matchedRoom: string | undefined;
  for (const r of rooms) {
    for (const term of r.terms) {
      if (normalized.includes(term)) {
        matchedRoom = r.key;
        break;
      }
    }
    if (matchedRoom) break;
  }

  // Kích thước (1m8, 2m, 1m6, 2m2, nhỏ, vừa, lớn...)
  const dimMatch = normalized.match(
    /\b(\d+(?:[.,]\d+)?\s*(?:m|met)(?:\s*(?:x|\*)\s*\d+(?:[.,]\d+)?\s*(?:m|met)?)?)\b/i
  );
  let dimensions: string | undefined = dimMatch ? dimMatch[0] : undefined;
  if (!dimensions) {
    if (normalized.includes('1m8')) dimensions = '1m8';
    else if (normalized.includes('1m6')) dimensions = '1m6';
    else if (normalized.includes('2m')) dimensions = '2m';
    else if (normalized.includes('2m2')) dimensions = '2m2';
    else if (normalized.includes('nho') || normalized.includes('mini')) dimensions = 'nhỏ';
    else if (normalized.includes('lon') || normalized.includes('rong')) dimensions = 'lớn';
  }

  const budget = extractBudget(rawText);

  return {
    categoryKeyword: matchedCategory,
    room: matchedRoom,
    dimensions,
    budget,
  };
}

/**
 * Kiểm tra câu chào hỏi có phải là thuần túy chào hỏi không (tối đa 4 từ hoặc chỉ gồm từ chào và từ đệm)
 */
export function isPureGreeting(rawText: string): boolean {
  if (!rawText) return false;
  const normalized = normalizeChatText(rawText);
  if (!normalized) return false;
  const words = normalized.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  const greetingWords = new Set([
    'xin', 'chao', 'hello', 'hi', 'alo', 'ad', 'admin', 'shop', 'dcor',
    'oi', 'nhe', 'nha', 'ban', 'co', 'ai', 'o', 'day', 'khong', 'a', 'ak', 'ah'
  ]);

  // Nếu tất cả các từ đều là từ chào hỏi/từ đệm
  if (words.every((w) => greetingWords.has(w))) {
    return true;
  }

  // Hoặc tối đa 4 từ và có chứa từ chào chính
  if (words.length <= 4) {
    const mainGreetings = ['xin chao', 'chao', 'hello', 'hi', 'alo'];
    return mainGreetings.some((g) => normalized.startsWith(g) || normalized === g);
  }

  return false;
}

/**
 * Kiểm tra xem câu có chứa ý định gặp nhân viên / chuyển nhân viên không
 */
export function isHandoffRequest(rawText: string): boolean {
  if (!rawText) return false;
  const normalized = normalizeChatText(rawText);
  const handoffPatterns = [
    'gap nhan vien',
    'gap cskh',
    'gap cham soc khach hang',
    'gap tu van vien',
    'noi chuyen voi nguoi that',
    'ho tro truc tiep',
    'nhan vien dau',
    'tu van vien dau',
    'tu van truc tiep',
    'chuyen nhan vien',
    'cho minh gap nhan vien',
    'cho toi gap nhan vien',
    'cho gap nhan vien',
    'muon gap nhan vien',
    'can gap nhan vien',
    'can nhan vien',
    'muon nhan vien',
    'noi chuyen nguoi that',
    'nguoi that tu van',
    'nhan vien ho tro',
    'tu van giup minh',
    'ket noi nhan vien',
    'co nhan vien o day khong',
    'muon gap nguoi that',
  ];
  return handoffPatterns.some((p) => normalized.includes(p));
}

/**
 * Kiểm tra xem câu có phải là yêu cầu khiếu nại không
 */
export function isComplaint(rawText: string): boolean {
  const normalized = normalizeChatText(rawText);
  return COMPLAINT_KEYWORDS.some((kw) => normalized.includes(kw));
}

/**
 * Tính điểm tương đồng giữa câu input và một pattern
 * Kết hợp cụm từ trùng khớp trọng số theo độ dài + tỉ lệ token trùng (Dice / Overlap)
 */
export function calculatePatternScore(normalizedInput: string, rawPattern: string): number {
  if (!normalizedInput || !rawPattern) return 0;

  const normalizedPattern = normalizeChatText(rawPattern);
  if (!normalizedPattern) return 0;

  // 1. Khớp hoàn toàn 100%
  if (normalizedInput === normalizedPattern) {
    return 1.0;
  }

  // 2. Tính tỉ lệ cụm từ (phrase containment)
  let phraseScore = 0;
  if (normalizedInput.includes(normalizedPattern)) {
    const lengthRatio = normalizedPattern.length / normalizedInput.length;
    phraseScore = 0.5 + 0.5 * lengthRatio;
  } else if (normalizedPattern.includes(normalizedInput) && normalizedInput.length >= 4) {
    const lengthRatio = normalizedInput.length / normalizedPattern.length;
    phraseScore = 0.45 + 0.45 * lengthRatio;
  }

  // 3. Phân rã tokens để tính Token Overlap (Dice / Jaccard similarity)
  const inputTokens = new Set(normalizedInput.split(' ').filter(Boolean));
  const patternTokens = new Set(normalizedPattern.split(' ').filter(Boolean));

  if (inputTokens.size === 0 || patternTokens.size === 0) return phraseScore;

  let commonTokens = 0;
  for (const t of inputTokens) {
    if (patternTokens.has(t)) {
      commonTokens++;
    }
  }

  if (commonTokens === 0) return phraseScore;

  // Tỉ lệ token trùng so với pattern (Coverage)
  const patternCoverage = commonTokens / patternTokens.size;

  // Điểm Dice: 2 * |A ∩ B| / (|A| + |B|)
  const dice = (2 * commonTokens) / (inputTokens.size + patternTokens.size);

  // Điểm token kết hợp
  const tokenScore = patternCoverage * 0.65 + dice * 0.35;

  return Math.min(1.0, Math.max(phraseScore, tokenScore));
}
