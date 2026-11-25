import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { clearInventoryCaches } from './inventory.controller';

const SUB_CATEGORIES_CACHE_KEY = 'store_sub_categories_list';

export interface SubCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  type: 'sub';
  parentId: string | null;
  parentName?: string;
  sortOrder: number;
  status: 'Hiển thị' | 'Đã ẩn';
  productsCount: number;
  linkedProducts: Array<{ id: string; name: string; sku: string }>;
}

const DEFAULT_SUB_CATEGORIES_SEED: SubCategoryRecord[] = [
  // 4 nhóm cha cấp 1
  {
    id: 'sub-room',
    name: 'Không gian & Phòng ứng dụng',
    slug: 'khong-gian-phong',
    description: 'Phân loại theo khu vực và không gian bài trí nội thất.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 36,
    linkedProducts: []
  },
  {
    id: 'sub-collection',
    name: 'Bộ sưu tập',
    slug: 'bo-suu-tap',
    description: 'Các bộ sưu tập thiết kế đồng bộ của thương hiệu DCor.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 23,
    linkedProducts: []
  },
  {
    id: 'sub-style',
    name: 'Phong cách thiết kế',
    slug: 'phong-cach',
    description: 'Các trường phái kiến trúc và ngôn ngữ nội thất.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 69,
    linkedProducts: []
  },
  {
    id: 'sub-material',
    name: 'Chất liệu chế tác',
    slug: 'chat-lieu',
    description: 'Vật liệu cấu thành: Da thật, nỉ, gỗ sồi, gỗ óc chó, đá ceramic.',
    image: '',
    type: 'sub',
    parentId: null,
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 43,
    linkedProducts: []
  },

  // Con của Không gian & Phòng ứng dụng (sub-room)
  {
    id: 'rm-living',
    name: 'Phòng khách',
    slug: 'phong-khach',
    description: 'Không gian sum họp tiện nghi với sofa, bàn trà và hệ tủ tivi.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 15,
    linkedProducts: []
  },
  {
    id: 'rm-dining',
    name: 'Phòng ăn',
    slug: 'phong-an',
    description: 'Khu vực gắn kết gia đình với bộ bàn ghế ăn cao cấp.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'rm-bed',
    name: 'Phòng ngủ',
    slug: 'phong-ngu',
    description: 'Không gian nghỉ ngơi thư thái với giường êm ái và tap đầu giường.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 9,
    linkedProducts: []
  },
  {
    id: 'rm-work',
    name: 'Phòng làm việc',
    slug: 'phong-lam-viec',
    description: 'Bàn làm việc thông minh và ghế công thái học bọc da cao cấp.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  },
  {
    id: 'rm-outdoor',
    name: 'Ngoài trời & Ban công',
    slug: 'ngoai-troi-ban-cong',
    description: 'Bàn ghế cafe ngoài trời kháng tia UV và chịu mưa nắng bền bỉ.',
    image: '',
    type: 'sub',
    parentId: 'sub-room',
    parentName: 'Không gian & Phòng ứng dụng',
    sortOrder: 5,
    status: 'Đã ẩn',
    productsCount: 0,
    linkedProducts: []
  },

  // Con của Bộ sưu tập (sub-collection)
  {
    id: 'col-bergamo',
    name: 'Bộ sưu tập Bergamo',
    slug: 'bo-suu-tap-bergamo',
    description: 'Dòng sản phẩm mang cảm hứng Bắc Âu đương đại với các đường bo viền hữu cơ.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 6,
    linkedProducts: []
  },
  {
    id: 'col-como',
    name: 'Bộ sưu tập Como',
    slug: 'bo-suu-tap-como',
    description: 'Sự kết hợp tinh tế giữa kính khói, gỗ óc chó và thép đen nhám.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  },
  {
    id: 'col-lugano',
    name: 'Bộ sưu tập Lugano',
    slug: 'bo-suu-tap-lugano',
    description: 'Thiết kế phòng ngủ và giường tối giản với đệm bọc đầu giường trang nhã.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 5,
    linkedProducts: []
  },
  {
    id: 'col-santiago',
    name: 'Bộ sưu tập Santiago',
    slug: 'bo-suu-tap-santiago',
    description: 'Dòng bàn ăn thông minh ceramic và ghế ăn da bò thủ công.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 5,
    linkedProducts: []
  },
  {
    id: 'col-cenova',
    name: 'Bộ sưu tập Cenova',
    slug: 'bo-suu-tap-cenova',
    description: 'Ghế bành đơn thư giãn bọc vải Boucle mềm mại.',
    image: '',
    type: 'sub',
    parentId: 'sub-collection',
    parentName: 'Bộ sưu tập',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 3,
    linkedProducts: []
  },

  // Con của Phong cách thiết kế (sub-style)
  {
    id: 'st-nordic',
    name: 'Bắc Âu (Scandinavian)',
    slug: 'bac-au-scandinavian',
    description: 'Phong cách đề cao ánh sáng tự nhiên, đường nét mộc mạc và tone màu trung tính.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 12,
    linkedProducts: []
  },
  {
    id: 'st-modern',
    name: 'Hiện đại (Modern Luxury)',
    slug: 'hien-dai-modern-luxury',
    description: 'Đường nét dứt khoát, kết hợp kim loại mạ vàng PVD và đá cẩm thạch sang trọng.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 18,
    linkedProducts: []
  },
  {
    id: 'st-minimal',
    name: 'Tối giản (Minimalism)',
    slug: 'toi-gian-minimalism',
    description: 'Loại bỏ chi tiết thừa, tập trung vào công năng và chất lượng vật liệu nguyên bản.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 14,
    linkedProducts: []
  },
  {
    id: 'st-japandi',
    name: 'Japandi',
    slug: 'japandi',
    description: 'Sự giao thoa hoàn hảo giữa thẩm mỹ tối giản Nhật Bản và sự ấm cúng Bắc Âu.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 10,
    linkedProducts: []
  },
  {
    id: 'st-wabisabi',
    name: 'Wabi-Sabi',
    slug: 'wabi-sabi',
    description: 'Vẻ đẹp của sự mộc mạc, bất toàn và hài hòa với thiên nhiên.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'st-industrial',
    name: 'Công nghiệp (Industrial)',
    slug: 'industrial',
    description: 'Phong cách phóng khoáng với khung kim loại, thép đen và bề mặt bê tông độc đáo.',
    image: '',
    type: 'sub',
    parentId: 'sub-style',
    parentName: 'Phong cách thiết kế',
    sortOrder: 6,
    status: 'Hiển thị',
    productsCount: 7,
    linkedProducts: []
  },

  // Con của Chất liệu chế tác (sub-material)
  {
    id: 'mat-leather-real',
    name: 'Da bò Aniline Ý thật',
    slug: 'da-bo-aniline-y',
    description: 'Chất liệu da thượng hạng mềm mịn, lưu giữ vân da tự nhiên và càng dùng càng bóng đẹp.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 1,
    status: 'Hiển thị',
    productsCount: 6,
    linkedProducts: []
  },
  {
    id: 'mat-fabric-felt',
    name: 'Vải nỉ Copenhagen',
    slug: 'vai-ni-copenhagen',
    description: 'Vải dệt cao cấp chống bám bụi, độ bền sợi cao và tạo cảm giác ấm cúng.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 2,
    status: 'Hiển thị',
    productsCount: 15,
    linkedProducts: []
  },
  {
    id: 'mat-wood-oak',
    name: 'Gỗ sồi (Oak) tự nhiên',
    slug: 'go-soi-tu-nhien',
    description: 'Gỗ sồi nhập khẩu Bắc Mỹ tẩm sấy chống cong vênh mối mọt, vân gỗ sáng trang nhã.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 3,
    status: 'Hiển thị',
    productsCount: 10,
    linkedProducts: []
  },
  {
    id: 'mat-wood-walnut',
    name: 'Gỗ óc chó (Walnut) thượng hạng',
    slug: 'go-oc-cho-walnut',
    description: 'Tone màu nâu trầm sang trọng với những đường vân cuộn sóng lôi cuốn.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 4,
    status: 'Hiển thị',
    productsCount: 8,
    linkedProducts: []
  },
  {
    id: 'mat-ceramic',
    name: 'Gốm Ceramic chống trầy',
    slug: 'gom-ceramic-chong-tray',
    description: 'Mặt bàn ceramic công nghệ nung nhiệt cao, chống trầy xước, chống ố màu và chịu nhiệt tuyệt đối.',
    image: '',
    type: 'sub',
    parentId: 'sub-material',
    parentName: 'Chất liệu chế tác',
    sortOrder: 5,
    status: 'Hiển thị',
    productsCount: 4,
    linkedProducts: []
  }
];

let subCategoriesTableInitialized = false;

interface MatchableProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  sku: string;
  categoryObj: {
    slug: string;
    parent: { slug: string };
  };
  refinementMaterials: string[];
  configOptions?: Record<string, any>;
}

function parseMatchableConfigOptions(prod: MatchableProduct): Record<string, any> {
  const raw = prod?.configOptions;
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof raw === 'object' ? raw : {};
}

function hasAssignedSubCategory(assigned: unknown, targetSlug: string, cat?: SubCategoryRecord): boolean {
  if (!assigned) return false;
  const targets = new Set<string>();
  if (targetSlug) targets.add(String(targetSlug).trim().toLowerCase());
  if (cat?.id) targets.add(String(cat.id).trim().toLowerCase());
  if (cat?.slug) targets.add(String(cat.slug).trim().toLowerCase());
  if (targets.size === 0) return false;

  const list = Array.isArray(assigned) ? assigned : [assigned];
  return list.some(val => {
    if (val === null || val === undefined) return false;
    const norm = String(val).trim().toLowerCase();
    return norm.length > 0 && targets.has(norm);
  });
}

function matchProductRoom(prod: MatchableProduct, roomSlug: string, cat?: SubCategoryRecord): boolean {
  if (!prod || !roomSlug) return false;
  const cfg = parseMatchableConfigOptions(prod);
  if (hasAssignedSubCategory(cfg.roomIds ?? cfg.roomId, roomSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.sku);
    if (isLinked) return true;
  }
  const catSlug = (prod.categoryObj?.slug || '').toLowerCase();
  const parentSlug = (prod.categoryObj?.parent?.slug || '').toLowerCase();
  const name = (prod.name || '').toLowerCase();

  if (roomSlug === 'phong-khach') {
    return parentSlug.includes('sofa') || parentSlug.includes('table') || parentSlug.includes('storage') ||
           parentSlug.includes('rug') || parentSlug.includes('lamp') || name.includes('sofa') ||
           name.includes('coffee') || name.includes('tv') || catSlug.includes('living');
  }
  if (roomSlug === 'phong-an') {
    return catSlug.includes('dining') || catSlug.includes('bar') || name.includes('dining') ||
           name.includes('bar') || parentSlug.includes('chair');
  }
  if (roomSlug === 'phong-ngu') {
    return parentSlug.includes('bed') || catSlug.includes('bed') || catSlug.includes('night-stand') ||
           catSlug.includes('throw') || name.includes('bed') || name.includes('nightstand');
  }
  if (roomSlug === 'phong-lam-viec') {
    return catSlug.includes('desk') || catSlug.includes('office') || name.includes('desk') || name.includes('office');
  }
  if (roomSlug === 'ngoai-troi' || roomSlug === 'ngoai-troi-ban-cong') {
    return parentSlug.includes('outdoor') || catSlug.includes('outdoor') || name.includes('outdoor');
  }
  if (cat?.name) {
    const term = cat.name.toLowerCase();
    return name.includes(term) || (prod.description || '').toLowerCase().includes(term);
  }
  return false;
}

function matchProductCollection(prod: MatchableProduct, collectionSlug: string, cat?: SubCategoryRecord): boolean {
  if (!prod || !collectionSlug) return false;
  const cfg = parseMatchableConfigOptions(prod);
  if (hasAssignedSubCategory(cfg.collectionId ?? cfg.collectionIds, collectionSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.sku);
    if (isLinked) return true;
  }
  const key = collectionSlug.replace('bo-suu-tap-', '').toLowerCase();
  const name = (prod.name || '').toLowerCase();
  const slug = (prod.slug || '').toLowerCase();
  return name.includes(key) || slug.includes(key);
}

function matchProductStyle(prod: MatchableProduct, styleSlug: string, cat?: SubCategoryRecord): boolean {
  if (!prod || !styleSlug) return false;
  const cfg = parseMatchableConfigOptions(prod);
  if (hasAssignedSubCategory(cfg.styleId ?? cfg.styleIds, styleSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.sku);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${prod.category || ''}`.toLowerCase();
  const s = styleSlug.toLowerCase();

  if (s.includes('scandinavian') || s.includes('bac-au')) {
    return text.includes('oak') || text.includes('wool') || text.includes('boucl') || text.includes('fabric') || text.includes('light');
  }
  if (s.includes('modern') || s.includes('hien-dai')) {
    return text.includes('leather') || text.includes('marble') || text.includes('lacquered') || text.includes('steel') || text.includes('dark');
  }
  if (s.includes('minimal') || s.includes('toi-gian')) {
    return text.includes('metal') || text.includes('glass') || text.includes('acrylic') || text.includes('aluminium') || text.includes('gọn');
  }
  if (s.includes('japandi')) {
    return text.includes('oak') || text.includes('wood') || text.includes('ceramic') || text.includes('linen') || text.includes('natural');
  }
  if (s.includes('wabi')) {
    return text.includes('concrete') || text.includes('ceramic') || text.includes('rough') || text.includes('cotton') || text.includes('organic');
  }
  if (s.includes('industrial')) {
    return text.includes('metal') || text.includes('concrete') || text.includes('steel') || text.includes('aluminium');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

function matchProductMaterial(prod: MatchableProduct, materialSlug: string, cat?: SubCategoryRecord): boolean {
  if (!prod || !materialSlug) return false;
  const cfg = parseMatchableConfigOptions(prod);
  if (hasAssignedSubCategory(cfg.materialIds ?? cfg.materialId, materialSlug, cat)) {
    return true;
  }
  if (cat?.linkedProducts && Array.isArray(cat.linkedProducts) && cat.linkedProducts.length > 0) {
    const isLinked = cat.linkedProducts.some((lp: any) => lp.id === prod.id || lp.sku === prod.slug || lp.sku === prod.sku);
    if (isLinked) return true;
  }
  const text = `${prod.name || ''} ${prod.description || ''} ${(prod.refinementMaterials || []).join(' ')}`.toLowerCase();
  const m = materialSlug.toLowerCase();

  if (m.includes('leather') || m.includes('da-bo')) {
    return text.includes('leather') || text.includes('da bò') || text.includes('da thật') || text.includes('aniline') || text.includes('nappa');
  }
  if (m.includes('fabric') || m.includes('vai-ni')) {
    return text.includes('fabric') || text.includes('vải') || text.includes('nỉ') || text.includes('boucl') || text.includes('velvet') || text.includes('linen');
  }
  if (m.includes('oak') || m.includes('go-soi')) {
    return text.includes('oak') || text.includes('sồi') || text.includes('gỗ sồi');
  }
  if (m.includes('walnut') || m.includes('go-oc-cho')) {
    return text.includes('walnut') || text.includes('óc chó') || text.includes('gỗ óc chó');
  }
  if (m.includes('ceramic') || m.includes('gom-ceramic')) {
    return text.includes('ceramic') || text.includes('gốm') || text.includes('đá') || text.includes('marble');
  }
  if (cat?.name) {
    return text.includes(cat.name.toLowerCase());
  }
  return false;
}

async function enrichSubCategoriesWithRealCounts(
  items: SubCategoryRecord[],
  onlyActiveProducts: boolean
): Promise<SubCategoryRecord[]> {
  try {
    const rawProducts = await prisma.product.findMany({
      where: onlyActiveProducts ? { deletedAt: null, isActive: true } : { deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        configOptions: true,
        category: {
          select: {
            name: true,
            slug: true,
            parent: { select: { name: true, slug: true } }
          }
        },
        variants: {
          select: {
            sku: true,
            name: true,
            optionValues: true
          }
        }
      }
    });

    const matchableProducts: MatchableProduct[] = rawProducts.map((p: any) => {
      const materialHints: string[] = [];
      (p.variants || []).forEach((v: any) => {
        if (v?.name) materialHints.push(String(v.name));
        const opt = typeof v?.optionValues === 'string'
          ? (() => { try { return JSON.parse(v.optionValues); } catch { return {}; } })()
          : (v?.optionValues || {});
        if (opt?.material) materialHints.push(String(opt.material));
        if (opt?.attributes && typeof opt.attributes === 'object') {
          Object.values(opt.attributes).forEach((val: any) => {
            if (typeof val === 'string') materialHints.push(val);
          });
        }
      });

      return {
        id: String(p.id),
        slug: String(p.slug || ''),
        name: String(p.name || ''),
        description: String(p.description || ''),
        category: `${p.category?.parent?.name || ''} ${p.category?.name || ''}`.trim(),
        sku: String(p.variants?.[0]?.sku || p.slug || ''),
        categoryObj: {
          slug: String(p.category?.slug || ''),
          parent: { slug: String(p.category?.parent?.slug || '') }
        },
        refinementMaterials: materialHints,
        configOptions: (p.configOptions && typeof p.configOptions === 'object') ? p.configOptions : {}
      };
    });

    const parentProductIdSets = new Map<string, Set<string>>();

    const enrichedChildren = items.map(item => {
      if (!item.parentId) {
        return item;
      }

      let matched: MatchableProduct[] = [];
      if (item.parentId === 'sub-room') {
        matched = matchableProducts.filter(p => matchProductRoom(p, item.slug, item));
      } else if (item.parentId === 'sub-collection') {
        matched = matchableProducts.filter(p => matchProductCollection(p, item.slug, item));
      } else if (item.parentId === 'sub-style') {
        matched = matchableProducts.filter(p => matchProductStyle(p, item.slug, item));
      } else if (item.parentId === 'sub-material') {
        matched = matchableProducts.filter(p => matchProductMaterial(p, item.slug, item));
      } else {
        const term = (item.name || item.slug || '').toLowerCase();
        matched = term
          ? matchableProducts.filter(p =>
              `${p.name} ${p.description} ${p.category} ${p.refinementMaterials.join(' ')}`.toLowerCase().includes(term)
            )
          : [];
      }

      let parentSet = parentProductIdSets.get(item.parentId);
      if (!parentSet) {
        parentSet = new Set<string>();
        parentProductIdSets.set(item.parentId, parentSet);
      }
      matched.forEach(p => parentSet!.add(p.id));

      return {
        ...item,
        productsCount: matched.length,
        linkedProducts: matched.slice(0, 10).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku
        }))
      };
    });

    return enrichedChildren.map(item => {
      if (item.parentId) return item;
      const uniqueIds = parentProductIdSets.get(item.id);
      return {
        ...item,
        productsCount: uniqueIds ? uniqueIds.size : 0
      };
    });
  } catch (err) {
    console.error('[SubCategories] Không thể tính số lượng sản phẩm thực tế:', err);
    return items;
  }
}

function mapSubCategoryRow(row: any): SubCategoryRecord {
  const linked = Array.isArray(row.linked_products)
    ? row.linked_products
    : (typeof row.linked_products === 'string'
        ? (() => { try { return JSON.parse(row.linked_products); } catch { return []; } })()
        : []);
  return {
    id: String(row.id),
    name: String(row.name || ''),
    slug: String(row.slug || ''),
    description: row.description || '',
    image: row.image || '',
    type: 'sub',
    parentId: row.parent_id ? String(row.parent_id) : null,
    parentName: row.parent_name || undefined,
    sortOrder: Number(row.sort_order ?? 1),
    status: row.status === 'Đã ẩn' ? 'Đã ẩn' : 'Hiển thị',
    productsCount: Number(row.products_count ?? 0),
    linkedProducts: linked
  };
}

export async function ensureSubCategoriesTable(): Promise<void> {
  if (subCategoriesTableInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SubCategories" (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        slug VARCHAR(150) UNIQUE NOT NULL,
        description TEXT DEFAULT '',
        image TEXT DEFAULT '',
        type VARCHAR(30) NOT NULL DEFAULT 'sub',
        parent_id VARCHAR(100),
        parent_name TEXT,
        sort_order INTEGER DEFAULT 1,
        status VARCHAR(30) DEFAULT 'Hiển thị',
        products_count INTEGER DEFAULT 0,
        linked_products JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const countRes = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int AS cnt FROM "SubCategories"`);
    const count = Number(countRes?.[0]?.cnt || 0);
    if (count === 0) {
      for (const item of DEFAULT_SUB_CATEGORIES_SEED) {
        await prisma.$executeRawUnsafe(
          `
            INSERT INTO "SubCategories" (
              id, name, slug, description, image, type, parent_id, parent_name,
              sort_order, status, products_count, linked_products
            )
            VALUES ($1, $2, $3, $4, $5, 'sub', $6, $7, $8, $9, $10, $11::jsonb)
            ON CONFLICT (id) DO NOTHING;
          `,
          item.id,
          item.name,
          item.slug,
          item.description,
          item.image,
          item.parentId,
          item.parentName || null,
          item.sortOrder,
          item.status,
          item.productsCount,
          JSON.stringify(item.linkedProducts || [])
        );
      }
    }
    subCategoriesTableInitialized = true;
  } catch (err) {
    console.error('[SubCategories] Không thể khởi tạo bảng SubCategories:', err);
    throw err;
  }
}

let categoryCacheInvalidator: (() => void) | null = null;
export function registerCategoryCacheInvalidator(fn: () => void) {
  categoryCacheInvalidator = fn;
}

function invalidateAllCategoryCaches() {
  memoryCache.invalidate(CACHE_KEYS.CATEGORIES_LIST);
  memoryCache.invalidate(SUB_CATEGORIES_CACHE_KEY);
  memoryCache.invalidate(CACHE_KEYS.PRODUCTS_CATALOG);
  memoryCache.invalidatePrefix('products_catalog');
  memoryCache.invalidatePrefix('products_cat_');
  memoryCache.invalidatePrefix('products_slug_');
  memoryCache.invalidatePrefix('admin_products_');
  memoryCache.invalidatePrefix('product_detail_');
  clearInventoryCaches(true);
  if (categoryCacheInvalidator) {
    categoryCacheInvalidator();
  }
}

function slugifyClean(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateSlug(text: string): string {
  const base = slugifyClean(text);
  return `${base}-${Date.now().toString().slice(-4)}`;
}

export const categoryController = {
  // Lấy toàn bộ danh mục cây phân cấp (Cấp 1 & Cấp 2)
  getAll: async (req: Request, res: Response): Promise<void> => {
    try {
      // Lấy danh mục gốc (parentId = null) kèm danh mục con (children)
      const rootCategories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              _count: {
                select: { products: { where: { deletedAt: null } } }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { products: { where: { deletedAt: null } } }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      // Lấy tất cả danh mục phẳng để hỗ trợ dropdown chọn danh mục cha
      const allFlat = await prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          sortOrder: true,
          isActive: true
        },
        orderBy: { sortOrder: 'asc' }
      });

      res.json({
        tree: rootCategories,
        flat: allFlat
      });
    } catch (error: any) {
      console.error('Lỗi lấy danh mục:', error);
      res.status(500).json({ message: 'Lỗi tải danh mục.', error: error?.message });
    }
  },

  // Tạo danh mục mới
  createCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, parentId, sortOrder, isActive } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ message: 'Tên danh mục không được để trống.' });
        return;
      }

      const slug = generateSlug(name);
      const cat = await prisma.category.create({
        data: {
          name: name.trim(),
          slug,
          parentId: parentId || null,
          sortOrder: Number(sortOrder) || 0,
          isActive: isActive !== false
        }
      });

      invalidateAllCategoryCaches();
      res.status(201).json({ message: 'Tạo danh mục thành công!', category: cat });
    } catch (error: any) {
      console.error('Lỗi tạo danh mục:', error);
      res.status(500).json({ message: 'Không thể tạo danh mục.', error: error?.message });
    }
  },

  // Cập nhật danh mục
  updateCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { name, parentId, sortOrder, isActive } = req.body;

      const existing = await prisma.category.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Danh mục không tồn tại.' });
        return;
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
          sortOrder: sortOrder !== undefined ? Number(sortOrder) : existing.sortOrder,
          isActive: isActive !== undefined ? !!isActive : existing.isActive
        }
      });

      invalidateAllCategoryCaches();
      res.json({ message: 'Cập nhật danh mục thành công!', category: updated });
    } catch (error: any) {
      console.error('Lỗi cập nhật danh mục:', error);
      res.status(500).json({ message: 'Không thể cập nhật danh mục.', error: error?.message });
    }
  },

  // Đổi trạng thái Ẩn / Hiện (có kiểm tra)
  toggleStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const existing: any = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: { select: { products: true, children: true } }
        }
      });

      if (!existing) {
        res.status(404).json({ message: 'Danh mục không tồn tại.' });
        return;
      }

      const newStatus = !existing.isActive;

      await prisma.category.update({
        where: { id },
        data: { isActive: newStatus }
      });

      invalidateAllCategoryCaches();
      res.json({
        message: `Đã ${newStatus ? 'hiển thị' : 'ẩn'} danh mục "${existing.name}" thành công!`,
        isActive: newStatus,
        productsCount: existing._count?.products || 0,
        childrenCount: existing._count?.children || 0
      });
    } catch (error: any) {
      console.error('Lỗi chuyển trạng thái danh mục:', error);
      res.status(500).json({ message: 'Không thể đổi trạng thái danh mục.', error: error?.message });
    }
  },

  // Xóa danh mục
  deleteCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const existing: any = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: { select: { products: true, children: true } }
        }
      });

      if (!existing) {
        res.status(404).json({ message: 'Danh mục không tồn tại.' });
        return;
      }

      if ((existing._count?.products || 0) > 0) {
        res.status(400).json({
          message: `Không thể xóa danh mục vì đang có ${existing._count?.products} sản phẩm trực thuộc!`
        });
        return;
      }

      if ((existing._count?.children || 0) > 0) {
        res.status(400).json({
          message: `Không thể xóa danh mục này vì đang có ${existing._count?.children} danh mục con!`
        });
        return;
      }

      await prisma.category.delete({ where: { id } });
      invalidateAllCategoryCaches();
      res.json({ message: `Đã xóa danh mục "${existing.name}" thành công!` });
    } catch (error: any) {
      console.error('Lỗi xóa danh mục:', error);
      res.status(500).json({ message: 'Không thể xóa danh mục.', error: error?.message });
    }
  },

  // =========================================================================
  // DANH MỤC PHỤ & THUỘC TÍNH (Dùng chung cho Admin & Storefront từ PostgreSQL)
  // =========================================================================
  getPublicSubCategories: async (req: Request, res: Response): Promise<void> => {
    try {
      const cached = memoryCache.get<SubCategoryRecord[]>(SUB_CATEGORIES_CACHE_KEY, 10 * 60 * 1000);
      if (cached) {
        res.json({ items: cached });
        return;
      }

      await ensureSubCategoriesTable();
      const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "SubCategories"
        ORDER BY (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC, sort_order ASC, created_at ASC
      `);
      const items = await enrichSubCategoriesWithRealCounts(rows.map(mapSubCategoryRow), true);
      memoryCache.set(SUB_CATEGORIES_CACHE_KEY, items);
      res.json({ items });
    } catch (error: any) {
      console.error('Lỗi tải danh mục phụ (storefront):', error);
      res.json({ items: DEFAULT_SUB_CATEGORIES_SEED });
    }
  },

  getAdminSubCategories: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureSubCategoriesTable();
      const rows = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM "SubCategories"
        ORDER BY (CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END) ASC, sort_order ASC, created_at ASC
      `);
      const items = await enrichSubCategoriesWithRealCounts(rows.map(mapSubCategoryRow), false);
      res.json({ items });
    } catch (error: any) {
      console.error('Lỗi tải danh mục phụ (admin):', error);
      res.status(500).json({ message: 'Không thể tải danh mục phụ.', error: error?.message });
    }
  },

  createSubCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureSubCategoriesTable();
      const { id, name, slug, description, image, parentId, sortOrder, isActive, status } = req.body;
      if (!name || !String(name).trim()) {
        res.status(400).json({ message: 'Tên danh mục phụ không được để trống.' });
        return;
      }

      const cleanName = String(name).trim();
      const baseSlug = slug && String(slug).trim() ? slugifyClean(String(slug).trim()) : slugifyClean(cleanName);
      let finalSlug = baseSlug || `sub-${Date.now()}`;

      // Đảm bảo slug duy nhất
      const slugCheck = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM "SubCategories" WHERE slug = $1 LIMIT 1`,
        finalSlug
      );
      if (slugCheck.length > 0) {
        finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
      }

      let parentName: string | null = null;
      const cleanParentId = parentId ? String(parentId).trim() : null;
      if (cleanParentId) {
        const parentRows = await prisma.$queryRawUnsafe<any[]>(
          `SELECT name FROM "SubCategories" WHERE id = $1 LIMIT 1`,
          cleanParentId
        );
        if (parentRows.length > 0) {
          parentName = String(parentRows[0].name);
        }
      }

      const finalId = (id && String(id).trim()) ? String(id).trim() : `sub-${Date.now()}`;
      const finalStatus = status === 'Đã ẩn' || isActive === false ? 'Đã ẩn' : 'Hiển thị';

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          INSERT INTO "SubCategories" (
            id, name, slug, description, image, type, parent_id, parent_name,
            sort_order, status, products_count, linked_products, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, 'sub', $6, $7, $8, $9, 0, '[]'::jsonb, NOW(), NOW())
          RETURNING *
        `,
        finalId,
        cleanName,
        finalSlug,
        String(description || '').trim(),
        String(image || '').trim(),
        cleanParentId,
        parentName,
        Number(sortOrder) || 1,
        finalStatus
      );

      invalidateAllCategoryCaches();
      res.status(201).json({
        message: 'Tạo danh mục phụ thành công!',
        category: mapSubCategoryRow(rows[0])
      });
    } catch (error: any) {
      console.error('Lỗi tạo danh mục phụ:', error);
      res.status(500).json({ message: 'Không thể tạo danh mục phụ.', error: error?.message });
    }
  },

  updateSubCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureSubCategoriesTable();
      const id = String(req.params.id || '').trim();
      const existingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "SubCategories" WHERE id = $1 LIMIT 1`,
        id
      );
      if (existingRows.length === 0) {
        res.status(404).json({ message: 'Danh mục phụ không tồn tại.' });
        return;
      }
      const existing = existingRows[0];
      const { name, slug, description, image, parentId, sortOrder, isActive, status } = req.body;

      const finalName = name !== undefined ? String(name).trim() : String(existing.name);
      let finalSlug = slug !== undefined && String(slug).trim()
        ? slugifyClean(String(slug).trim())
        : String(existing.slug);

      if (finalSlug !== existing.slug) {
        const dup = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id FROM "SubCategories" WHERE slug = $1 AND id <> $2 LIMIT 1`,
          finalSlug,
          id
        );
        if (dup.length > 0) {
          finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
        }
      }

      const cleanParentId = parentId !== undefined ? (parentId ? String(parentId).trim() : null) : existing.parent_id;
      let parentName: string | null = existing.parent_name || null;
      if (parentId !== undefined) {
        if (cleanParentId) {
          const pRows = await prisma.$queryRawUnsafe<any[]>(
            `SELECT name FROM "SubCategories" WHERE id = $1 LIMIT 1`,
            cleanParentId
          );
          parentName = pRows.length > 0 ? String(pRows[0].name) : null;
        } else {
          parentName = null;
        }
      }

      const finalStatus = status !== undefined
        ? (status === 'Đã ẩn' ? 'Đã ẩn' : 'Hiển thị')
        : (isActive !== undefined ? (isActive ? 'Hiển thị' : 'Đã ẩn') : existing.status);

      const rows = await prisma.$queryRawUnsafe<any[]>(
        `
          UPDATE "SubCategories"
          SET name = $1,
              slug = $2,
              description = $3,
              image = $4,
              parent_id = $5,
              parent_name = $6,
              sort_order = $7,
              status = $8,
              updated_at = NOW()
          WHERE id = $9
          RETURNING *
        `,
        finalName,
        finalSlug,
        description !== undefined ? String(description).trim() : (existing.description || ''),
        image !== undefined ? String(image).trim() : (existing.image || ''),
        cleanParentId,
        parentName,
        sortOrder !== undefined ? Number(sortOrder) : Number(existing.sort_order ?? 1),
        finalStatus,
        id
      );

      // Nếu đổi tên danh mục cha -> cập nhật parent_name cho các mục con
      if (finalName !== existing.name) {
        await prisma.$executeRawUnsafe(
          `UPDATE "SubCategories" SET parent_name = $1, updated_at = NOW() WHERE parent_id = $2`,
          finalName,
          id
        );
      }

      invalidateAllCategoryCaches();
      res.json({
        message: 'Cập nhật danh mục phụ thành công!',
        category: mapSubCategoryRow(rows[0])
      });
    } catch (error: any) {
      console.error('Lỗi cập nhật danh mục phụ:', error);
      res.status(500).json({ message: 'Không thể cập nhật danh mục phụ.', error: error?.message });
    }
  },

  toggleSubCategoryStatus: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureSubCategoriesTable();
      const id = String(req.params.id || '').trim();
      const existingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "SubCategories" WHERE id = $1 LIMIT 1`,
        id
      );
      if (existingRows.length === 0) {
        res.status(404).json({ message: 'Danh mục phụ không tồn tại.' });
        return;
      }

      const existing = existingRows[0];
      const newStatus = existing.status === 'Hiển thị' ? 'Đã ẩn' : 'Hiển thị';

      await prisma.$executeRawUnsafe(
        `UPDATE "SubCategories" SET status = $1, updated_at = NOW() WHERE id = $2`,
        newStatus,
        id
      );

      invalidateAllCategoryCaches();
      res.json({
        message: `Đã chuyển "${existing.name}" sang trạng thái ${newStatus}!`,
        status: newStatus,
        isActive: newStatus === 'Hiển thị'
      });
    } catch (error: any) {
      console.error('Lỗi đổi trạng thái danh mục phụ:', error);
      res.status(500).json({ message: 'Không thể đổi trạng thái danh mục phụ.', error: error?.message });
    }
  },

  deleteSubCategory: async (req: Request, res: Response): Promise<void> => {
    try {
      await ensureSubCategoriesTable();
      const id = String(req.params.id || '').trim();
      const existingRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "SubCategories" WHERE id = $1 LIMIT 1`,
        id
      );
      if (existingRows.length === 0) {
        res.status(404).json({ message: 'Danh mục phụ không tồn tại.' });
        return;
      }

      const childCountRows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT COUNT(*)::int AS cnt FROM "SubCategories" WHERE parent_id = $1`,
        id
      );
      const childCount = Number(childCountRows?.[0]?.cnt || 0);
      if (childCount > 0) {
        res.status(400).json({
          message: `Không thể xóa nhóm danh mục này vì đang có ${childCount} mục con!`
        });
        return;
      }

      await prisma.$executeRawUnsafe(`DELETE FROM "SubCategories" WHERE id = $1`, id);
      invalidateAllCategoryCaches();
      res.json({ message: `Đã xóa "${existingRows[0].name}" thành công!` });
    } catch (error: any) {
      console.error('Lỗi xóa danh mục phụ:', error);
      res.status(500).json({ message: 'Không thể xóa danh mục phụ.', error: error?.message });
    }
  }
};
