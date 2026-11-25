import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { memoryCache, CACHE_KEYS } from '../lib/cache';
import { clearInventoryCaches } from './inventory.controller';

let categoryCacheInvalidator: (() => void) | null = null;
export function registerCategoryCacheInvalidator(fn: () => void) {
  categoryCacheInvalidator = fn;
}

function invalidateAllCategoryCaches() {
  memoryCache.invalidate(CACHE_KEYS.CATEGORIES_LIST);
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

function generateSlug(text: string): string {
  const base = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
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
                select: { products: true }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          _count: {
            select: { products: true }
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
  }
};
