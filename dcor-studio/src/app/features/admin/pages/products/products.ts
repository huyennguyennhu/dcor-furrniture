import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Package, Tag, AlertCircle, TrendingUp, Search, Download, Upload, Plus, 
  ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ArrowUpDown, Trash2, Edit, Copy, Eye, EyeOff, 
  RotateCcw, CheckCircle2, X, Filter, FileSpreadsheet, Info, Check, RefreshCw,
  AlertTriangle, Home, Sparkles, Palette, Layers
} from 'lucide-angular';
import * as XLSX from 'xlsx';

import { environment } from '../../../../../environments/environment';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';
import { ProductService } from '../../../../core/services/product.service';
import {
  CategoryClassificationService,
  CategoryItem,
  matchProductRoom,
  matchProductCollection,
  matchProductStyle,
  matchProductMaterial
} from '../../../../core/services/category-classification.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ImportPrecheckRow {
  rowNumber: number;
  sku: string;
  name: string;
  categoryName: string;
  categoryId?: string;
  price: number;
  stock?: number;
  description?: string;
  isValid: boolean;
  errors: string[];
}

export interface BranchStock {
  branchId: string;
  branchName: string;
  stock: number;
}

export interface ProductVariantItem {
  id: string;
  sku: string;
  name: string; // ví dụ: 'Xám ghi / 1m8'
  price: number;
  originalPrice?: number;
  image: string;
  isActive: boolean;
  branchStocks: BranchStock[];
}

export interface ProductListItem {
  id: string;
  slug?: string;
  description?: string;
  name: string;
  baseSku: string; // SKU tổng, readonly
  categoryName: string;
  categoryId: string;
  categorySlug?: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  parentCategorySlug?: string;
  majorCategoryKey?: string;
  refinementMaterials?: string[];
  configOptions?: Record<string, any>;
  priceRange: { min: number; max: number };
  totalVariants: number;
  totalAvailableStock: number;
  status: 'Đang bán' | 'Nháp' | 'Đã ẩn';
  image: string;
  createdAt: string;
  hasOrders: boolean; // Đánh dấu sản phẩm đã từng phát sinh đơn hàng hay chưa
  isExpanded?: boolean; // Trạng thái mở rộng dòng con Accordion
  isDeleted?: boolean; // Đánh dấu sản phẩm nằm trong thùng rác
  variants: ProductVariantItem[];
}

export type StatusTab = 'ALL' | 'ACTIVE' | 'DRAFT' | 'HIDDEN';
export type StockFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'stock_desc' | 'stock_asc' | 'name_asc';

export const INITIAL_PRODUCTS: ProductListItem[] = [
  {
    id: 'prod-001',
    name: 'Sofa Bergamo Góc L Chữ L',
    baseSku: 'DCOR-SF-BER',
    categoryName: 'Sofa & Ghế bành',
    categoryId: 'cat-sofa',
    priceRange: { min: 28500000, max: 48000000 },
    totalVariants: 4,
    totalAvailableStock: 22,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-15',
    hasOrders: true,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-001-1',
        sku: 'SF-BER-GR-24',
        name: 'Vải nỉ Copenhagen Xám ghi / 2m4',
        price: 28500000,
        originalPrice: 32000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 8 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 2 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 2 }
        ]
      },
      {
        id: 'var-001-2',
        sku: 'SF-BER-BE-28',
        name: 'Vải nỉ Copenhagen Be sáng / 2m8',
        price: 34000000,
        originalPrice: 38000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 4 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      },
      {
        id: 'var-001-3',
        sku: 'SF-BER-NV-28',
        name: 'Vải nhung Sapphire Xanh Navy / 2m8',
        price: 35500000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 0 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      },
      {
        id: 'var-001-4',
        sku: 'SF-BER-CG-32',
        name: 'Da bò Aniline Nâu Cognac / 3m2',
        price: 48000000,
        originalPrice: 52000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 2 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-002',
    name: 'Bàn Trà Como Kính & Gỗ Óc Chó',
    baseSku: 'DCOR-TB-COM',
    categoryName: 'Bàn trà & Bàn góc',
    categoryId: 'cat-table',
    priceRange: { min: 9200000, max: 14500000 },
    totalVariants: 2,
    totalAvailableStock: 29,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-14',
    hasOrders: true,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-002-1',
        sku: 'TB-COM-GL-BL',
        name: 'Mặt kính khói đen / Chân thép sơn tĩnh điện',
        price: 9200000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 12 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 3 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 2 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 4 }
        ]
      },
      {
        id: 'var-002-2',
        sku: 'TB-COM-CR-BR',
        name: 'Mặt đá Ceramic trắng vân mây / Chân đồng xước',
        price: 14500000,
        originalPrice: 16000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 5 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      }
    ]
  },
  {
    id: 'prod-003',
    name: 'Giường Ngủ Lugano Đệm Bọc Tinh Tế',
    baseSku: 'DCOR-BD-LUG',
    categoryName: 'Phòng ngủ',
    categoryId: 'cat-bed',
    priceRange: { min: 22000000, max: 31000000 },
    totalVariants: 3,
    totalAvailableStock: 6,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-12',
    hasOrders: true,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-003-1',
        sku: 'BD-LUG-OAK-16',
        name: 'Gỗ sồi tự nhiên / 1m6 × 2m0',
        price: 22000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 2 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      },
      {
        id: 'var-003-2',
        sku: 'BD-LUG-OAK-18',
        name: 'Gỗ sồi tự nhiên / 1m8 × 2m0',
        price: 25500000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 1 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      },
      {
        id: 'var-003-3',
        sku: 'BD-LUG-WAL-18',
        name: 'Gỗ óc chó thượng hạng (Có ngăn kéo) / 1m8 × 2m0',
        price: 31000000,
        originalPrice: 35000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: false,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 0 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-004',
    name: 'Bàn Ăn Santiago Mở Rộng Ceramic',
    baseSku: 'DCOR-DT-SAN',
    categoryName: 'Bàn ăn & Ghế ăn',
    categoryId: 'cat-dining',
    priceRange: { min: 131900000, max: 131900000 },
    totalVariants: 2,
    totalAvailableStock: 27,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-10',
    hasOrders: true,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-004-1',
        sku: 'DT-SAN-W-OAK',
        name: 'Mặt gốm Ceramic trắng / Chân gỗ sồi sẫm (1m35 - 1m81)',
        price: 131900000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 10 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 2 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 2 }
        ]
      },
      {
        id: 'var-004-2',
        sku: 'DT-SAN-G-NAT',
        name: 'Mặt gốm Ceramic xám / Chân gỗ sồi tự nhiên (1m35 - 1m81)',
        price: 131900000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 8 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 2 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      }
    ]
  },
  {
    id: 'prod-005',
    name: 'Ghế Bành Thư Giãn Cenova Boucle',
    baseSku: 'DCOR-AC-CEN',
    categoryName: 'Sofa & Ghế bành',
    categoryId: 'cat-sofa',
    priceRange: { min: 18500000, max: 26000000 },
    totalVariants: 2,
    totalAvailableStock: 13,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-08',
    hasOrders: false,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-005-1',
        sku: 'AC-CEN-BOU-WH',
        name: 'Vải lông cừu Boucle trắng kem / Chân xoay 360°',
        price: 18500000,
        originalPrice: 21000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 6 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 2 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 2 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      },
      {
        id: 'var-005-2',
        sku: 'AC-CEN-LEA-BR',
        name: 'Da Nappa Ý màu Nâu Caramel / Chân xoay đen',
        price: 26000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 1 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-006',
    name: 'Kệ Tivi Treo Tường Cupertino Tối Giản',
    baseSku: 'DCOR-CB-CUP',
    categoryName: 'Kệ & Tủ lưu trữ',
    categoryId: 'cat-storage',
    priceRange: { min: 15000000, max: 21500000 },
    totalVariants: 2,
    totalAvailableStock: 0,
    status: 'Đã ẩn',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-05',
    hasOrders: true,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-006-1',
        sku: 'CB-CUP-WH-18',
        name: 'Sơn mài trắng mờ Scandinavian / 1m8',
        price: 15000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: false,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 0 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      },
      {
        id: 'var-006-2',
        sku: 'CB-CUP-WAL-22',
        name: 'Gỗ óc chó kết hợp kính đen / 2m2',
        price: 21500000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: false,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 0 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-007',
    name: 'Đèn Sàn Vòm Kim Loại Kuta Đương Đại',
    baseSku: 'DCOR-LP-KUT',
    categoryName: 'Đèn & Ánh sáng',
    categoryId: 'cat-lighting',
    priceRange: { min: 5900000, max: 6800000 },
    totalVariants: 2,
    totalAvailableStock: 15,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-04',
    hasOrders: false,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-007-1',
        sku: 'LP-KUT-COP',
        name: 'Đồng xước nghệ thuật (Brushed Copper)',
        price: 6800000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 5 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      },
      {
        id: 'var-007-2',
        sku: 'LP-KUT-BLK',
        name: 'Đen mờ tĩnh điện (Matte Black)',
        price: 5900000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 4 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 2 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 1 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-008',
    name: 'Bàn Ăn Cánh Bướm Ottawa Karim Rashid',
    baseSku: 'DCOR-DT-OTT',
    categoryName: 'Bàn ăn & Ghế ăn',
    categoryId: 'cat-dining',
    priceRange: { min: 45000000, max: 45000000 },
    totalVariants: 1,
    totalAvailableStock: 1,
    status: 'Nháp',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-10-02',
    hasOrders: false,
    isExpanded: false,
    isDeleted: false,
    variants: [
      {
        id: 'var-008-1',
        sku: 'DT-OTT-OAK-CH',
        name: 'Mặt gỗ sồi trắng Bắc Âu / Chân cánh lá Chrome',
        price: 45000000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 1 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
        ]
      }
    ]
  },
  {
    id: 'prod-009',
    name: 'Thảm Dệt Tay Thủ Công Scandinavia',
    baseSku: 'DCOR-RG-SCA',
    categoryName: 'Phụ kiện & Thảm',
    categoryId: 'cat-decor',
    priceRange: { min: 11200000, max: 16800000 },
    totalVariants: 2,
    totalAvailableStock: 8,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-09-28',
    hasOrders: false,
    isExpanded: false,
    isDeleted: true, // Trong thùng rác, chưa có đơn hàng -> được phép xóa vĩnh viễn
    variants: [
      {
        id: 'var-009-1',
        sku: 'RG-SCA-1724',
        name: 'Họa tiết Diamond Grey / 1m7 × 2m4',
        price: 11200000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 3 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 1 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      },
      {
        id: 'var-009-2',
        sku: 'RG-SCA-2030',
        name: 'Họa tiết Diamond Grey / 2m0 × 3m0',
        price: 16800000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 2 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 1 }
        ]
      }
    ]
  },
  {
    id: 'prod-010',
    name: 'Gối Tựa Lưng Velvet DCor Decor',
    baseSku: 'DCOR-PL-VEL',
    categoryName: 'Phụ kiện & Thảm',
    categoryId: 'cat-decor',
    priceRange: { min: 650000, max: 650000 },
    totalVariants: 2,
    totalAvailableStock: 45,
    status: 'Đang bán',
    image: '/assets/img/furniture-placeholder.svg',
    createdAt: '2026-09-20',
    hasOrders: true, // Đã từng có đơn hàng -> KHÔNG được phép xóa vĩnh viễn (khóa nút)
    isExpanded: false,
    isDeleted: true, // Trong thùng rác
    variants: [
      {
        id: 'var-010-1',
        sku: 'PL-VEL-GR-45',
        name: 'Vải nhung Xanh rêu / 45×45cm',
        price: 650000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 15 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 5 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 4 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 6 }
        ]
      },
      {
        id: 'var-010-2',
        sku: 'PL-VEL-PK-45',
        name: 'Vải nhung Hồng phấn / 45×45cm',
        price: 650000,
        image: '/assets/img/furniture-placeholder.svg',
        isActive: true,
        branchStocks: [
          { branchId: 'wh-main', branchName: 'Kho Tổng', stock: 8 },
          { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 2 },
          { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 3 },
          { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 2 }
        ]
      }
    ]
  }
];

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LucideAngularModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  readonly Math = Math;

  icons = { 
    Package, Tag, AlertCircle, TrendingUp, Search, Download, Upload, Plus, 
    ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, ArrowUpDown, Trash2, Edit, Copy, Eye, EyeOff, 
    RotateCcw, CheckCircle2, X, Filter, FileSpreadsheet, Info, Check, RefreshCw,
    AlertTriangle, Home, Sparkles, Palette, Layers
  };

  // State chính - Khởi tạo rỗng để hiển thị loading spinner đồng bộ khi tải từ database
  allProducts: ProductListItem[] = [];
  filteredProducts: ProductListItem[] = [];
  isLoading = true;

  // Phân trang 10 sản phẩm mỗi trang
  pageSize = 10;
  currentPage = 1;
  jumpPageInput: number | null = null;

  goToFirstPage() {
    this.goToPage(1);
  }

  goToLastPage() {
    this.goToPage(this.totalPages);
  }

  onJumpPageSubmit() {
    if (this.jumpPageInput && this.jumpPageInput >= 1 && this.jumpPageInput <= this.totalPages) {
      this.goToPage(this.jumpPageInput);
      this.jumpPageInput = null;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get paginatedProducts(): ProductListItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
    }
  }

  get pagesArray(): Array<number | '...'> {
    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    if (current <= 4) {
      return [1, 2, 3, 4, 5, '...', total];
    }

    if (current >= total - 3) {
      return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }

    return [1, '...', current - 1, current, current + 1, '...', total];
  }

  onPageClick(p: number | '...') {
    if (typeof p === 'number') {
      this.goToPage(p);
    }
  }

  // Tabs & Filters
  activeTab: StatusTab = 'ALL';
  searchQuery = '';
  private searchDebounceTimer: any = null;

  selectedCategory = 'ALL';
  selectedRoomFilter = 'ALL';
  selectedCollectionFilter = 'ALL';
  selectedStyleFilter = 'ALL';
  selectedMaterialFilter = 'ALL';
  selectedStockFilter: StockFilter = 'ALL';
  selectedBranchFilter = 'ALL';
  branchOptions = [
    { id: 'wh-main', name: 'Kho Tổng' },
    { id: 'sr-q1', name: 'Showroom Q1' },
    { id: 'sr-td', name: 'Showroom Thủ Đức' },
    { id: 'sr-hn', name: 'Showroom Cầu Giấy HN' }
  ];
  sortBy: SortOption = 'newest';

  // Dropdown UI states
  isStatusDropdownOpen = false;
  isCategoryDropdownOpen = false;
  isSubCategoryDropdownOpen = false;
  expandedSubCategoryGroups: Record<'room' | 'collection' | 'style' | 'material', boolean> = {
    room: false,
    collection: false,
    style: false,
    material: false
  };
  isStockDropdownOpen = false;
  isBranchDropdownOpen = false;
  isSortDropdownOpen = false;

  // Danh sách Subcategories dùng chung từ PostgreSQL (CategoryClassificationService)
  roomOptions: CategoryItem[] = [];
  collectionOptions: CategoryItem[] = [];
  styleOptions: CategoryItem[] = [];
  materialOptions: CategoryItem[] = [];
  private subCategoriesSub?: Subscription;

  // Danh mục động (Chỉ lọc danh mục chính: Tables, Sofas, Chairs, Beds, Storage...)
  categories: Array<{ id: string; name: string; slug?: string; childIds?: string[] }> = [
    { id: 'ALL', name: 'Tất cả danh mục' },
    { id: 'a8ee5c87-3e71-4052-b61c-92bf543c41c1', name: 'Tables', slug: 'tables-3' },
    { id: '735a03d0-26dc-4441-bd7d-9c565b66cbb4', name: 'Sofas', slug: 'sofas-1' },
    { id: '3639f69e-452a-48c0-b032-d7f3bd8ce14a', name: 'Chairs', slug: 'chairs-2' },
    { id: 'd492b7b7-8624-48f1-8caa-e7592d144630', name: 'Storage', slug: 'storage-4' },
    { id: 'cf9a6a0b-482d-45b3-b75f-4505c2a8f102', name: 'Beds', slug: 'beds-5' },
    { id: '1cd91a18-e854-46e6-9184-81586245a80a', name: 'Lamps', slug: 'lamps-7' },
    { id: '4401c13a-85f9-4668-806f-20ab07f69cb4', name: 'Rugs', slug: 'rugs-8' },
    { id: '3aab992e-8c1d-4840-97ef-16e886b26167', name: 'Accessories', slug: 'accessories-9' },
    { id: 'e5c2232d-fc4b-4e8d-bd99-514ed2446882', name: 'Outdoor', slug: 'outdoor-furniture-6' }
  ];

  // Bulk actions
  selectedProductIds = new Set<string>();

  // Modals & Feedback Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' | 'error' = 'success';
  private toastTimer: any = null;

  // Modal Xóa mềm 2 bước (nhập đúng tên sản phẩm)
  isDeleteModalOpen = false;
  deleteStep: 1 | 2 = 1;
  deleteConfirmText = '';
  isDeletingProduct = false;
  productToDelete: ProductListItem | null = null;

  // Modal Xác nhận Ẩn / Hiện
  isConfirmVisibilityModalOpen = false;
  productToToggle: ProductListItem | null = null;

  // Modal Xóa cũ (giữ tương thích)
  isDeleteConfirmModalOpen = false;
  isBulkPermanentDelete = false;

  // Modal Import Excel & State 3 Giai đoạn
  isImportModalOpen = false;
  importStage: 'upload' | 'precheck' = 'upload';
  isDraggingFile = false;
  selectedImportFile: File | null = null;
  importFileError: string | null = null;
  isAnalyzingFile = false;

  // Dữ liệu Pre-check
  precheckRows: ImportPrecheckRow[] = [];
  skipErrorRows: boolean = true;
  importStatusOption: 'Đang bán' | 'Nháp' = 'Đang bán';

  @ViewChild('filterContainerRef', { static: false }) filterContainerRef!: ElementRef;

  constructor(
    private router: Router, 
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private adminAuthService: AdminAuthService,
    private productService: ProductService,
    private categoryClassificationService: CategoryClassificationService
  ) {}

  get canCreate(): boolean {
    return this.adminAuthService.hasPermission('products', 'create');
  }

  get canEdit(): boolean {
    return this.adminAuthService.hasPermission('products', 'edit');
  }

  get canDelete(): boolean {
    return this.adminAuthService.hasPermission('products', 'delete');
  }

  getMajorCategoryKey(
    name: string = '',
    catName: string = '',
    parentCatName: string = '',
    catSlug: string = '',
    parentSlug: string = ''
  ): string {
    const text = `${name} ${catName} ${parentCatName} ${catSlug} ${parentSlug}`.toLowerCase();
    if (text.includes('sofa') || text.includes('ghế bành') || text.includes('couch') || text.includes('armchair')) return 'sofas';
    if (text.includes('table') || text.includes('desk') || text.includes('bàn')) return 'tables';
    if (text.includes('chair') || text.includes('stool') || text.includes('bench') || text.includes('ghế')) return 'chairs';
    if (text.includes('bed') || text.includes('giường') || text.includes('nệm') || text.includes('mattress') || text.includes('phòng ngủ')) return 'beds';
    if (text.includes('storage') || text.includes('tủ') || text.includes('kệ') || text.includes('cabinet') || text.includes('drawer') || text.includes('shelf') || text.includes('sideboard')) return 'storage';
    if (text.includes('rug') || text.includes('thảm')) return 'rugs';
    if (text.includes('lamp') || text.includes('đèn') || text.includes('light')) return 'lamps';
    return 'other';
  }

  ngOnInit() {
    this.syncSubCategoryOptions();
    this.subCategoriesSub = this.categoryClassificationService.categories$.subscribe(() => {
      this.syncSubCategoryOptions();
      this.applyFilters();
      this.cdr.detectChanges();
    });
    this.loadProducts();
  }

  ngOnDestroy() {
    this.subCategoriesSub?.unsubscribe();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private syncSubCategoryOptions() {
    this.roomOptions = this.categoryClassificationService.getRooms();
    this.collectionOptions = this.categoryClassificationService.getCollections();
    this.styleOptions = this.categoryClassificationService.getStyles();
    this.materialOptions = this.categoryClassificationService.getMaterials();
  }

  // Tải dữ liệu ban đầu từ Database thực tế (PostgreSQL / Prisma)
  loadProducts() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // 1. Tải danh mục ngầm (CHỈ LẤY DANH MỤC CHÍNH: Tables, Sofas, Chairs...)
    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (catsRes) => {
        const catsData = catsRes?.tree || (Array.isArray(catsRes) ? catsRes : []);
        if (Array.isArray(catsData) && catsData.length > 0) {
          const dbCats: Array<{ id: string; name: string; slug: string; childIds: string[] }> = [];
          catsData.forEach((parentCat: any) => {
            const childIds: string[] = [
              String(parentCat.id).toLowerCase(),
              String(parentCat.slug || '').toLowerCase()
            ];
            if (Array.isArray(parentCat.children)) {
              parentCat.children.forEach((child: any) => {
                if (child.id) childIds.push(String(child.id).toLowerCase());
                if (child.slug) childIds.push(String(child.slug).toLowerCase());
              });
            }

            dbCats.push({
              id: parentCat.id,
              name: parentCat.name,
              slug: parentCat.slug || '',
              childIds: childIds
            });
            // Tuyệt đối không thêm parentCat.children vào danh sách dropdown (chỉ lọc theo danh mục chính)
          });
          this.categories = [{ id: 'ALL', name: 'Tất cả danh mục', slug: 'all', childIds: [] }, ...dbCats];
          this.applyFilters();
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });

    // 2. Tải toàn bộ sản phẩm trực tiếp từ API backend (limit=500 để hiển thị đầy đủ 214+ sản phẩm)
    this.http.get<any[]>(`${environment.apiUrl}/admin/products?limit=500`).subscribe({
      next: (prodsData) => {
        if (Array.isArray(prodsData) && prodsData.length > 0) {
          const apiProducts: ProductListItem[] = prodsData.map((p: any, idx: number) => {
            const rawVariants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [];
            const mappedVariants: ProductVariantItem[] = rawVariants.map((v: any, vIdx: number) => {
              const opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
              const varImg = (opt.images && opt.images[0]) || (p.images && p.images[0]) || '';
              const baseStock = typeof v.stock === 'number' ? v.stock : 0;
              const whStocks = Array.isArray(v.warehouseStocks) && v.warehouseStocks.length > 0
                ? v.warehouseStocks.map((ws: any) => ({
                    branchId: ws.warehouseId || ws.warehouse?.id || 'wh-main',
                    branchName: ws.warehouse?.name || 'Kho Tổng',
                    stock: Math.max(0, Number(ws.physicalStock || 0) - Number(ws.reservedStock || 0))
                  }))
                : [{ branchId: 'wh-main', branchName: 'Kho Tổng', stock: Math.max(0, baseStock) }];
              return {
                id: v.id || `var-${idx}-${vIdx}`,
                sku: v.sku || `SKU-${idx}-${vIdx}`,
                name: v.name || `Biến thể ${vIdx + 1}`,
                price: Number(v.price) || Number(p.basePrice) || 10000000,
                originalPrice: undefined,
                image: varImg || '/assets/img/furniture-placeholder.svg',
                isActive: v.isActive !== false,
                branchStocks: whStocks
              };
            });

            const prices = mappedVariants.map(v => v.price);
            const minPrice = prices.length > 0 ? Math.min(...prices) : (Number(p.basePrice) || 10000000);
            const maxPrice = prices.length > 0 ? Math.max(...prices) : (Number(p.basePrice) || 10000000);
            const totalStock = rawVariants.reduce((sum: number, v: any) => sum + (v.isActive !== false ? Math.max(0, Number(v.stock || 0)) : 0), 0);

            const cat = p.category;
            const catName = (cat && cat.name) ? cat.name : (typeof p.category === 'string' ? p.category : 'Khác');
            const catId = (cat && cat.id) ? cat.id : (cat?.slug || 'cat-other');
            
            let parentCat = cat && cat.parent ? cat.parent : (cat && !cat.parentId ? cat : null);
            if (!parentCat && cat && cat.parentId) {
              const foundInCats = this.categories.find(c => c.id === cat.parentId);
              if (foundInCats) {
                parentCat = foundInCats;
              }
            }

            const parentCatId = parentCat ? parentCat.id : '';
            const parentCatName = parentCat ? parentCat.name : '';
            const parentCatSlug = parentCat ? parentCat.slug : '';

            const baseSku = (p.variants && p.variants[0]?.sku) ? p.variants[0].sku : `DCOR-${String(p.slug || idx).toUpperCase().substring(0, 10)}`;

            let coverImg = '/assets/img/furniture-placeholder.svg';
            if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string') {
              coverImg = p.images[0];
            } else if (mappedVariants[0]?.image) {
              coverImg = mappedVariants[0].image;
            }

            const variantMaterialHints: string[] = [];
            rawVariants.forEach((v: any) => {
              if (v?.name) variantMaterialHints.push(String(v.name));
              const opt = typeof v?.optionValues === 'string'
                ? (() => { try { return JSON.parse(v.optionValues); } catch { return {}; } })()
                : (v?.optionValues || {});
              if (opt?.material) variantMaterialHints.push(String(opt.material));
              if (opt?.attributes && typeof opt.attributes === 'object') {
                Object.values(opt.attributes).forEach((val: any) => {
                  if (typeof val === 'string') variantMaterialHints.push(val);
                });
              }
            });

            return {
              id: p.id,
              slug: p.slug || '',
              description: p.description || '',
              name: p.name || 'Sản phẩm nội thất DCor',
              baseSku: baseSku,
              categoryName: catName,
              categoryId: catId,
              categorySlug: cat?.slug || '',
              parentCategoryId: parentCatId,
              parentCategoryName: parentCatName,
              parentCategorySlug: parentCatSlug,
              majorCategoryKey: (parentCatName || catName).toLowerCase(),
              refinementMaterials: variantMaterialHints,
              configOptions: p.configOptions || {},
              priceRange: { min: minPrice, max: maxPrice },
              totalVariants: mappedVariants.length || 1,
              totalAvailableStock: totalStock,
              status: p.isActive === false ? 'Đã ẩn' : 'Đang bán',
              image: coverImg,
              createdAt: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '2026-10-14',
              hasOrders: Boolean(p.isBestSeller),
              isExpanded: false,
              isDeleted: Boolean(p.deletedAt),
              variants: mappedVariants
            };
          });

          this.allProducts = apiProducts;
        } else {
          this.allProducts = INITIAL_PRODUCTS.map(ip => ({
            ...ip,
            majorCategoryKey: this.getMajorCategoryKey(ip.name, ip.categoryName, '', ip.categoryId)
          }));
        }
        this.isLoading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Không thể tải từ backend, dùng dữ liệu dự phòng:', err);
        this.allProducts = INITIAL_PRODUCTS.map(ip => ({
          ...ip,
          majorCategoryKey: this.getMajorCategoryKey(ip.name, ip.categoryName, '', ip.categoryId)
        }));
        this.isLoading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      }
    });
  }

  // --- KPI COUNTERS ---
  get totalActiveCount(): number {
    return this.allProducts.filter(p => !p.isDeleted && p.status === 'Đang bán').length;
  }

  get totalLowStockCount(): number {
    return this.allProducts.filter(p => !p.isDeleted && p.totalAvailableStock > 0 && p.totalAvailableStock < 10).length;
  }

  get totalOutOfStockCount(): number {
    return this.allProducts.filter(p => !p.isDeleted && p.totalAvailableStock === 0).length;
  }

  get totalTrashCount(): number {
    return this.allProducts.filter(p => p.isDeleted).length;
  }

  get totalNonTrashCount(): number {
    return this.allProducts.filter(p => !p.isDeleted).length;
  }

  get totalDraftCount(): number {
    return this.allProducts.filter(p => !p.isDeleted && p.status === 'Nháp').length;
  }

  get totalHiddenCount(): number {
    return this.allProducts.filter(p => !p.isDeleted && p.status === 'Đã ẩn').length;
  }

  // --- TABS & FILTERING ---
  setTab(tab: StatusTab) {
    this.activeTab = tab;
    this.currentPage = 1;
    this.selectedProductIds.clear();
    this.applyFilters();
  }

  onSearchChange() {
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.applyFilters();
      this.cdr.detectChanges();
    }, 300);
  }

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allProducts];

    // 1. Lọc theo Tab trạng thái
    result = result.filter(p => !p.isDeleted);
    if (this.activeTab === 'ACTIVE') {
      result = result.filter(p => p.status === 'Đang bán');
    } else if (this.activeTab === 'DRAFT') {
      result = result.filter(p => p.status === 'Nháp');
    } else if (this.activeTab === 'HIDDEN') {
      result = result.filter(p => p.status === 'Đã ẩn');
    }

    // 2. Tìm kiếm theo Tên hoặc SKU
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(p => {
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.baseSku.toLowerCase().includes(q);
        const matchVariantSku = p.variants.some(v => v.sku.toLowerCase().includes(q) || v.name.toLowerCase().includes(q));
        return matchName || matchSku || matchVariantSku;
      });
    }

    // 3. Lọc theo Danh mục chính (Tables, Sofas, Chairs, Beds, Storage...)
    if (this.selectedCategory !== 'ALL') {
      const selectedCat = this.categories.find(c => c.id === this.selectedCategory);
      const targetId = String(this.selectedCategory).toLowerCase();
      const targetSlug = String(selectedCat?.slug || '').toLowerCase();
      const targetName = String(selectedCat?.name || '').trim().toLowerCase();
      const targetChildIds = (selectedCat?.childIds || []).map(id => String(id).toLowerCase());

      result = result.filter(p => {
        const pParentId = String(p.parentCategoryId || '').toLowerCase();
        const pCatId = String(p.categoryId || '').toLowerCase();
        const pParentName = String(p.parentCategoryName || '').trim().toLowerCase();
        const pCatName = String(p.categoryName || '').trim().toLowerCase();
        const pParentSlug = String(p.parentCategorySlug || '').toLowerCase();

        // 1. So khớp ID danh mục cha (parentCategoryId) chính xác
        if (pParentId && (pParentId === targetId || (targetSlug && pParentId === targetSlug))) {
          return true;
        }

        // 2. So khớp ID danh mục trực tiếp (categoryId) chính xác
        if (pCatId === targetId || (targetSlug && pCatId === targetSlug)) {
          return true;
        }

        // 3. So khớp qua danh sách ID/Slug của các danh mục con trực thuộc
        if (targetChildIds.length > 0) {
          if (pCatId && targetChildIds.includes(pCatId)) return true;
          if (pParentId && targetChildIds.includes(pParentId)) return true;
        }

        // 4. So khớp CHÍNH XÁC tên danh mục cha (Tuyệt đối KHÔNG dùng .includes để tránh Bedside tables bị dính vào Beds)
        if (pParentName && targetName && pParentName === targetName) {
          return true;
        }

        // 5. So khớp slug danh mục cha chính xác
        if (targetSlug && pParentSlug && pParentSlug === targetSlug) {
          return true;
        }

        // 6. Trường hợp đặc biệt: sản phẩm gán trực tiếp danh mục cha (không có parent, tên trùng exact)
        if (!pParentName && pCatName && targetName && pCatName === targetName) {
          return true;
        }

        // 7. Hỗ trợ dữ liệu mock fallback (prod-xxx) khi offline
        if (p.id.startsWith('prod-')) {
          const catKey = (p.majorCategoryKey || '').toLowerCase();
          if (catKey && (targetSlug.startsWith(catKey) || targetName.toLowerCase().startsWith(catKey))) {
            return true;
          }
        }

        return false;
      });
    }

    // 3.5. Lọc theo các Subcategories (Phòng & Không gian, Bộ sưu tập, Phong cách, Chất liệu) dùng chung logic Storefront
    const toMatchableProduct = (p: ProductListItem) => ({
      id: p.id,
      productId: p.id,
      slug: p.slug || '',
      name: p.name || '',
      description: p.description || '',
      category: `${p.parentCategoryName || ''} ${p.categoryName || ''}`.trim(),
      categoryObj: {
        slug: p.categorySlug || '',
        parent: { slug: p.parentCategorySlug || '' }
      },
      refinementMaterials: p.refinementMaterials || p.variants.map(v => v.name),
      configOptions: p.configOptions || {}
    });

    if (this.selectedRoomFilter !== 'ALL') {
      const cat = this.roomOptions.find(r => r.slug === this.selectedRoomFilter);
      result = result.filter(p => matchProductRoom(toMatchableProduct(p), this.selectedRoomFilter, cat));
    }

    if (this.selectedCollectionFilter !== 'ALL') {
      const cat = this.collectionOptions.find(c => c.slug === this.selectedCollectionFilter);
      result = result.filter(p => matchProductCollection(toMatchableProduct(p), this.selectedCollectionFilter, cat));
    }

    if (this.selectedStyleFilter !== 'ALL') {
      const cat = this.styleOptions.find(s => s.slug === this.selectedStyleFilter);
      result = result.filter(p => matchProductStyle(toMatchableProduct(p), this.selectedStyleFilter, cat));
    }

    if (this.selectedMaterialFilter !== 'ALL') {
      const cat = this.materialOptions.find(m => m.slug === this.selectedMaterialFilter);
      result = result.filter(p => matchProductMaterial(toMatchableProduct(p), this.selectedMaterialFilter, cat));
    }

    // 4. Lọc theo Tồn kho
    if (this.selectedStockFilter !== 'ALL') {
      if (this.selectedStockFilter === 'IN_STOCK') {
        result = result.filter(p => p.totalAvailableStock >= 10);
      } else if (this.selectedStockFilter === 'LOW_STOCK') {
        result = result.filter(p => p.totalAvailableStock > 0 && p.totalAvailableStock < 10);
      } else if (this.selectedStockFilter === 'OUT_OF_STOCK') {
        result = result.filter(p => p.totalAvailableStock === 0);
      }
    }

    // Lọc theo Kho hàng / Showroom (BUG-9)
    if (this.selectedBranchFilter !== 'ALL') {
      result = result.filter(p => {
        return p.variants.some(v => {
          const bs = v.branchStocks.find(b => b.branchId === this.selectedBranchFilter);
          return bs && bs.stock > 0;
        });
      });
    }

    // 5. Sắp xếp
    result.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price_asc':
          return a.priceRange.min - b.priceRange.min;
        case 'price_desc':
          return b.priceRange.max - a.priceRange.max;
        case 'stock_desc':
          return b.totalAvailableStock - a.totalAvailableStock;
        case 'stock_asc':
          return a.totalAvailableStock - b.totalAvailableStock;
        case 'name_asc':
          return a.name.localeCompare(b.name, 'vi');
        default:
          return 0;
      }
    });

    this.filteredProducts = result;
  }

  // --- ACCORDION ROW EXPAND / COLLAPSE ---
  toggleRowExpand(product: ProductListItem, event: Event) {
    event.stopPropagation();
    product.isExpanded = !product.isExpanded;
  }

  expandAll() {
    this.filteredProducts.forEach(p => p.isExpanded = true);
  }

  collapseAll() {
    this.filteredProducts.forEach(p => p.isExpanded = false);
  }

  // --- TOGGLE VARIANT ACTIVE STATUS (ĐỒNG BỘ DB) ---
  toggleVariantActive(product: ProductListItem, variant: ProductVariantItem, event: Event) {
    event.stopPropagation();
    const prevActive = variant.isActive;
    const nextActive = !prevActive;
    variant.isActive = nextActive;
    this.recalculateProductStats(product);

    this.http.patch(`${environment.apiUrl}/admin/products/${product.id}/variants/${variant.id}/status`, {
      isActive: nextActive
    }).subscribe({
      next: () => {
        this.productService.clearCache();
        this.showToast(`Đã ${nextActive ? 'kích hoạt' : 'tạm dừng'} bán biến thể ${variant.sku}`, 'info');
      },
      error: (err) => {
        variant.isActive = prevActive;
        this.recalculateProductStats(product);
        this.showToast(err?.error?.message || 'Không thể cập nhật trạng thái biến thể lên máy chủ.', 'warning');
      }
    });
  }

  private recalculateProductStats(product: ProductListItem) {
    const activeVariants = product.variants.filter(v => v.isActive);
    product.totalAvailableStock = activeVariants.reduce((sum, v) => {
      return sum + v.branchStocks.reduce((bSum, b) => bSum + b.stock, 0);
    }, 0);
    this.applyFilters();
  }

  // --- CHECKBOX SELECTION ---
  get isAllSelected(): boolean {
    if (this.filteredProducts.length === 0) return false;
    return this.filteredProducts.every(p => this.selectedProductIds.has(p.id));
  }

  get isPartiallySelected(): boolean {
    return this.selectedProductIds.size > 0 && !this.isAllSelected;
  }

  toggleSelectAll() {
    if (this.isAllSelected) {
      this.selectedProductIds.clear();
    } else {
      this.filteredProducts.forEach(p => this.selectedProductIds.add(p.id));
    }
  }

  toggleSelectProduct(productId: string, event: Event) {
    event.stopPropagation();
    if (this.selectedProductIds.has(productId)) {
      this.selectedProductIds.delete(productId);
    } else {
      this.selectedProductIds.add(productId);
    }
  }

  clearSelection() {
    this.selectedProductIds.clear();
  }

  // --- ROW ACTIONS ---
  goToEdit(productId: string) {
    this.router.navigate(['/admin/products', productId]);
  }

  goToNew() {
    this.router.navigate(['/admin/products/new']);
  }

  // Xác thực thay đổi trạng thái Ẩn / Mở bán
  requestToggleVisibility(product: ProductListItem, event: Event) {
    event.stopPropagation();
    this.productToToggle = product;
    this.isConfirmVisibilityModalOpen = true;
  }

  confirmToggleVisibility() {
    if (!this.productToToggle) return;
    const target = this.productToToggle;
    const newStatus = target.status === 'Đang bán' ? 'Đã ẩn' : 'Đang bán';

    this.http.patch(`${environment.apiUrl}/admin/products/${target.id}/status`, {
      isActive: newStatus === 'Đang bán'
    }).subscribe({
      next: () => {
        target.status = newStatus;
        this.productService.clearCache();
        this.showToast(`Đã chuyển trạng thái sản phẩm "${target.name}" sang ${newStatus}`, 'success');
        this.isConfirmVisibilityModalOpen = false;
        this.productToToggle = null;
        this.applyFilters();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Máy chủ từ chối: Bạn không có quyền thay đổi trạng thái sản phẩm! (403 Forbidden)';
        this.showToast(msg, 'warning');
        this.closeVisibilityModal();
      }
    });
  }

  closeVisibilityModal() {
    this.isConfirmVisibilityModalOpen = false;
    this.productToToggle = null;
  }

  toggleProductVisibility(product: ProductListItem, event: Event) {
    this.requestToggleVisibility(product, event);
  }


  // --- XÓA MỀM SẢN PHẨM 2 BƯỚC (NHẬP CHÍNH XÁC TÊN SẢN PHẨM) ---
  get isDeleteConfirmMatched(): boolean {
    const expected = (this.productToDelete?.name || '').trim();
    const typed = (this.deleteConfirmText || '').trim();
    return expected.length > 0 && typed === expected;
  }

  openDeleteStep1(product: ProductListItem, event: Event) {
    event.stopPropagation();
    this.productToDelete = product;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.isDeletingProduct = false;
    this.isDeleteModalOpen = true;
  }

  goToDeleteStep2() {
    this.deleteStep = 2;
    this.deleteConfirmText = '';
  }

  closeDeleteModal() {
    if (this.isDeletingProduct) return;
    this.isDeleteModalOpen = false;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.productToDelete = null;
  }

  executeSoftDelete() {
    if (!this.isDeleteConfirmMatched || !this.productToDelete || this.isDeletingProduct) {
      return;
    }
    const target = this.productToDelete;
    this.isDeletingProduct = true;

    this.http.delete(`${environment.apiUrl}/admin/products/${target.id}`).subscribe({
      next: () => {
        this.isDeletingProduct = false;
        this.allProducts = this.allProducts.filter(p => p.id !== target.id);
        this.selectedProductIds.delete(target.id);
        this.productService.clearCache();
        this.showToast(`Đã xóa sản phẩm "${target.name}" khỏi giao diện hệ thống`, 'success');
        this.closeDeleteModal();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isDeletingProduct = false;
        const msg = err?.error?.message || 'Máy chủ từ chối: Bạn không có quyền xóa sản phẩm trên hệ thống! (403 Forbidden)';
        this.showToast(msg, 'warning');
        this.closeDeleteModal();
        this.cdr.detectChanges();
      }
    });
  }

  // Tương thích với các gọi cũ
  executePermanentDelete() {
    this.executeSoftDelete();
  }

  moveToTrash(product: ProductListItem, event: Event) {
    this.openDeleteStep1(product, event);
  }

  openPermanentDeleteModal(product: ProductListItem, event: Event) {
    this.openDeleteStep1(product, event);
  }

  confirmPermanentDelete() {
    this.executeSoftDelete();
  }

  closeDeleteConfirmModal() {
    this.closeDeleteModal();
  }

  // --- BULK ACTIONS (ĐỒNG BỘ DB) ---
  bulkHide() {
    const targetIds = this.allProducts
      .filter(p => this.selectedProductIds.has(p.id) && p.status !== 'Đã ẩn')
      .map(p => p.id);
    if (targetIds.length === 0) return;

    this.http.patch(`${environment.apiUrl}/admin/products/bulk/status`, {
      productIds: targetIds,
      isActive: false
    }).subscribe({
      next: () => {
        this.allProducts.forEach(p => {
          if (targetIds.includes(p.id)) p.status = 'Đã ẩn';
        });
        this.productService.clearCache();
        this.showToast(`Đã ẩn ${targetIds.length} sản phẩm và đồng bộ lên cửa hàng!`, 'info');
        this.clearSelection();
        this.applyFilters();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Không thể ẩn hàng loạt sản phẩm.', 'warning');
      }
    });
  }

  bulkShow() {
    const targetIds = this.allProducts
      .filter(p => this.selectedProductIds.has(p.id) && p.status !== 'Đang bán')
      .map(p => p.id);
    if (targetIds.length === 0) return;

    this.http.patch(`${environment.apiUrl}/admin/products/bulk/status`, {
      productIds: targetIds,
      isActive: true
    }).subscribe({
      next: () => {
        this.allProducts.forEach(p => {
          if (targetIds.includes(p.id)) p.status = 'Đang bán';
        });
        this.productService.clearCache();
        this.showToast(`Đã bật bán ${targetIds.length} sản phẩm và đồng bộ lên cửa hàng!`, 'success');
        this.clearSelection();
        this.applyFilters();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Không thể bật bán hàng loạt sản phẩm.', 'warning');
      }
    });
  }

  bulkMoveToTrash() {
    const targetIds = this.allProducts
      .filter(p => this.selectedProductIds.has(p.id))
      .map(p => p.id);
    if (targetIds.length === 0) return;

    this.http.post(`${environment.apiUrl}/admin/products/bulk/delete`, {
      productIds: targetIds
    }).subscribe({
      next: () => {
        const targetSet = new Set(targetIds);
        this.allProducts = this.allProducts.filter(p => !targetSet.has(p.id));
        this.productService.clearCache();
        this.showToast(`Đã xóa ${targetIds.length} sản phẩm khỏi giao diện hệ thống!`, 'success');
        this.clearSelection();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Không thể xóa hàng loạt sản phẩm.', 'warning');
      }
    });
  }

  bulkRestore() {
    const targetIds = this.allProducts
      .filter(p => this.selectedProductIds.has(p.id) && p.isDeleted)
      .map(p => p.id);
    if (targetIds.length === 0) return;

    this.http.post(`${environment.apiUrl}/admin/products/bulk/restore`, {
      productIds: targetIds
    }).subscribe({
      next: () => {
        this.allProducts.forEach(p => {
          if (targetIds.includes(p.id)) p.isDeleted = false;
        });
        this.productService.clearCache();
        this.showToast(`Đã khôi phục ${targetIds.length} sản phẩm!`, 'success');
        this.clearSelection();
        this.applyFilters();
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Không thể khôi phục sản phẩm.', 'warning');
      }
    });
  }

  bulkPermanentDelete() {
    const eligibleCount = this.filteredProducts.filter(p => this.selectedProductIds.has(p.id) && !p.hasOrders).length;
    if (eligibleCount === 0) {
      this.showToast('Tất cả sản phẩm đã chọn đều có lịch sử đơn hàng, không thể xóa vĩnh viễn!', 'error');
      return;
    }
    this.isBulkPermanentDelete = true;
    this.productToDelete = null;
    this.isDeleteConfirmModalOpen = true;
  }

  // --- EXPORT & IMPORT EXCEL AN TOÀN THEO CHUẨN DCOR ---
  
  // 1. XUẤT DỮ LIỆU EXCEL (.XLSX)
  exportExcel() {
    if (!this.filteredProducts || this.filteredProducts.length === 0) {
      this.showToast('Không có dữ liệu sản phẩm nào để xuất!', 'warning');
      return;
    }

    // Lấy toàn bộ danh sách sản phẩm đang hiển thị (theo đúng bộ lọc từ khóa, danh mục và trạng thái hiện tại)
    const exportData = this.filteredProducts.map(p => ({
      'Mã SKU': p.baseSku,
      'Tên sản phẩm': p.name,
      'Danh mục chính': p.categoryName,
      'Giá từ (VNĐ)': p.priceRange.min,
      'Giá đến (VNĐ)': p.priceRange.max,
      'Số biến thể': p.totalVariants,
      'Tổng tồn kho': p.totalAvailableStock,
      'Trạng thái': p.status,
      'Ngày tạo': p.createdAt
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Định dạng chiều rộng cột cho chuyên nghiệp
    worksheet['!cols'] = [
      { wch: 18 }, // Mã SKU
      { wch: 38 }, // Tên sản phẩm
      { wch: 24 }, // Danh mục chính
      { wch: 18 }, // Giá từ
      { wch: 18 }, // Giá đến
      { wch: 14 }, // Số biến thể
      { wch: 16 }, // Tổng tồn kho
      { wch: 15 }, // Trạng thái
      { wch: 15 }  // Ngày tạo
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sản phẩm DCor');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const fileName = `DCOR_Danh_Sach_San_Pham_${year}${month}${day}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    this.showToast('Đã xuất dữ liệu sản phẩm thành công!', 'success');
  }

  // 2. TẢI FILE MẪU EXCEL CHUẨN (.XLSX)
  downloadTemplate() {
    const templateData = [
      {
        'Mã SKU (*)': 'DCOR-SF-MOD',
        'Tên sản phẩm (*)': 'Sofa Văng Hiện Đại Modula 3 Chỗ',
        'Danh mục chính (*)': 'Sofa & Ghế bành',
        'Giá bán (VNĐ) (*)': 18500000,
        'Tồn kho ban đầu': 10,
        'Mô tả ngắn': 'Sofa nỉ cao cấp phong cách Bắc Âu tối giản'
      },
      {
        'Mã SKU (*)': 'DCOR-TB-ZEN',
        'Tên sản phẩm (*)': 'Bàn Trà Tròn Zen Stone Mặt Đá',
        'Danh mục chính (*)': 'Bàn trà & Bàn góc',
        'Giá bán (VNĐ) (*)': 6800000,
        'Tồn kho ban đầu': 15,
        'Mô tả ngắn': 'Bàn trà khung thép mặt đá Ceramic chống trầy'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 40 },
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_San_Pham');
    XLSX.writeFile(wb, 'DCOR_Product_Import_Template.xlsx');
    this.showToast('Đã tải file mẫu Excel chuẩn DCOR_Product_Import_Template.xlsx', 'info');
  }

  // 3. ĐIỀU KHIỂN MODAL NHẬP DỮ LIỆU
  openImportModal() {
    this.resetImportState();
    this.isImportModalOpen = true;
  }

  closeImportModal() {
    this.isImportModalOpen = false;
    this.resetImportState();
  }

  resetImportState() {
    this.importStage = 'upload';
    this.isDraggingFile = false;
    this.selectedImportFile = null;
    this.importFileError = null;
    this.isAnalyzingFile = false;
    this.precheckRows = [];
    this.skipErrorRows = true;
    this.importStatusOption = 'Đang bán';
  }

  get validRowsCount(): number {
    return this.precheckRows.filter(r => r.isValid).length;
  }

  get errorRowsCount(): number {
    return this.precheckRows.filter(r => !r.isValid).length;
  }

  get canConfirmImport(): boolean {
    if (this.validRowsCount === 0) return false;
    if (this.errorRowsCount > 0 && !this.skipErrorRows) return false;
    return true;
  }

  // 4. KÉO THẢ & CHỌN FILE
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleIncomingFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files && event.target.files[0];
    if (file) {
      this.handleIncomingFile(file);
    }
    event.target.value = '';
  }

  // 5. LỚP BẢO VỆ MAGIC BYTES CHỐNG FILE GIẢ MẠO
  handleIncomingFile(file: File) {
    this.importFileError = null;
    this.selectedImportFile = file;

    // Giới hạn dung lượng tối đa 5MB
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.importFileError = 'Dung lượng tệp vượt quá 5MB. Vui lòng chọn tệp nhỏ hơn.';
      return;
    }

    // Đọc byte đầu kiểm tra chữ ký Magic Bytes
    this.isAnalyzingFile = true;
    const headerSlice = file.slice(0, 8);
    const reader = new FileReader();

    reader.onload = (e: any) => {
      try {
        const buffer = new Uint8Array(e.target.result as ArrayBuffer);

        // Chữ ký ZIP/XLSX: PK.. (0x50, 0x4B)
        const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
        // Chữ ký OLE2/XLS: 0xD0, 0xCF, 0x11, 0xE0
        const isOle = buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0;
        // Chữ ký Windows Executable nguy hiểm: MZ (0x4D, 0x5A)
        const isExe = buffer[0] === 0x4D && buffer[1] === 0x5A;

        if (isExe || (!isZip && !isOle)) {
          this.isAnalyzingFile = false;
          this.importFileError = 'Tệp tin không đúng định dạng bảng tính Excel an toàn. Vui lòng kiểm tra lại.';
          this.cdr.detectChanges();
          return;
        }

        // Tệp an toàn -> Đọc toàn bộ nội dung để phân tích
        this.readAndParseExcel(file);
      } catch (err) {
        this.isAnalyzingFile = false;
        this.importFileError = 'Không thể xác thực cấu trúc tệp tin. Vui lòng kiểm tra lại tệp Excel.';
        this.cdr.detectChanges();
      }
    };

    reader.onerror = () => {
      this.isAnalyzingFile = false;
      this.importFileError = 'Lỗi khi đọc tệp tin. Vui lòng thử lại.';
      this.cdr.detectChanges();
    };

    reader.readAsArrayBuffer(headerSlice);
  }

  // 6. PHÂN TÍCH & BẢNG KIỂM TRA LỖI (ERROR PRE-CHECK GRID)
  readAndParseExcel(file: File) {
    const fullReader = new FileReader();
    fullReader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        // Vô hiệu hóa Macro/thực thi công thức (cellFormula: false)
        const workbook = XLSX.read(data, { 
          type: 'array', 
          cellFormula: false, 
          cellHTML: false 
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          this.isAnalyzingFile = false;
          this.importFileError = 'Tệp Excel không chứa bảng tính (sheet) nào.';
          this.cdr.detectChanges();
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const sheetData: any[][] = XLSX.utils.sheet_to_json(firstSheet, { 
          header: 1, 
          raw: false, 
          defval: '' 
        });

        if (!sheetData || sheetData.length <= 1) {
          this.isAnalyzingFile = false;
          this.importFileError = 'Tệp Excel không có dòng dữ liệu nào ngoài dòng tiêu đề.';
          this.cdr.detectChanges();
          return;
        }

        // Nhận diện cột theo tiêu đề dòng 0
        const headers: string[] = (sheetData[0] || []).map(h => this.sanitizeCellValue(h).toLowerCase());
        
        const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('mã'));
        const nameIdx = headers.findIndex(h => h.includes('tên') || h.includes('name'));
        const catIdx = headers.findIndex(h => h.includes('danh mục') || h.includes('nhóm') || h.includes('category'));
        const priceIdx = headers.findIndex(h => h.includes('giá') || h.includes('price'));
        const stockIdx = headers.findIndex(h => h.includes('tồn') || h.includes('kho') || h.includes('số lượng') || h.includes('stock'));
        const descIdx = headers.findIndex(h => h.includes('mô tả') || h.includes('desc'));

        const evaluated: ImportPrecheckRow[] = [];
        const fileSkus = new Set<string>();

        // Duyệt từng dòng dữ liệu (từ dòng 1)
        for (let r = 1; r < sheetData.length; r++) {
          const row = sheetData[r];
          if (!row || row.length === 0) continue;

          const rawSku = skuIdx >= 0 ? this.sanitizeCellValue(row[skuIdx]) : '';
          const rawName = nameIdx >= 0 ? this.sanitizeCellValue(row[nameIdx]) : '';
          const rawCat = catIdx >= 0 ? this.sanitizeCellValue(row[catIdx]) : '';
          const rawPrice = priceIdx >= 0 ? this.sanitizeCellValue(row[priceIdx]) : '';
          const rawStock = stockIdx >= 0 ? this.sanitizeCellValue(row[stockIdx]) : '';
          const rawDesc = descIdx >= 0 ? this.sanitizeCellValue(row[descIdx]) : '';

          // Bỏ qua dòng trống hoàn toàn
          if (!rawSku && !rawName && !rawCat && !rawPrice) continue;

          const errors: string[] = [];
          const excelRowNumber = r + 1;

          // 1. Kiểm tra SKU
          if (!rawSku) {
            errors.push('Thiếu mã SKU');
          } else {
            const skuUpper = rawSku.toUpperCase();
            if (fileSkus.has(skuUpper)) {
              errors.push('Trùng mã SKU trong cùng tệp tải lên');
            } else if (this.allProducts.some(p => p.baseSku.toUpperCase() === skuUpper)) {
              errors.push('Trùng mã SKU đã có trong hệ thống');
            } else {
              fileSkus.add(skuUpper);
            }
          }

          // 2. Kiểm tra Tên sản phẩm (tối thiểu 3 ký tự)
          if (!rawName || rawName.trim().length < 3) {
            errors.push('Tên sản phẩm tối thiểu 3 ký tự');
          }

          // 3. Kiểm tra Danh mục chính (phải tồn tại trong danh sách danh mục)
          let matchedCategoryId = '';
          let matchedCategoryName = rawCat;
          if (!rawCat) {
            errors.push('Thiếu danh mục chính');
          } else {
            const normalizedInputCat = this.normalizeSearchText(rawCat);
            const foundCat = this.categories.find(c => 
              c.id !== 'ALL' && (
                this.normalizeSearchText(c.name) === normalizedInputCat ||
                this.normalizeSearchText(c.name).includes(normalizedInputCat) ||
                normalizedInputCat.includes(this.normalizeSearchText(c.name))
              )
            );
            if (foundCat) {
              matchedCategoryId = foundCat.id;
              matchedCategoryName = foundCat.name;
            } else {
              errors.push(`Danh mục "${rawCat}" không tồn tại trong hệ thống`);
            }
          }

          // 4. Kiểm tra Giá bán (phải là số dương > 0)
          const cleanPrice = Number(String(rawPrice).replace(/[^0-9]/g, ''));
          if (!cleanPrice || isNaN(cleanPrice) || cleanPrice <= 0) {
            errors.push('Giá bán phải là số dương lớn hơn 0');
          }

          const cleanStock = Number(String(rawStock).replace(/[^0-9]/g, '')) || 0;

          evaluated.push({
            rowNumber: excelRowNumber,
            sku: rawSku.toUpperCase(),
            name: rawName,
            categoryName: matchedCategoryName || rawCat,
            categoryId: matchedCategoryId,
            price: cleanPrice || 0,
            stock: cleanStock,
            description: rawDesc,
            isValid: errors.length === 0,
            errors
          });
        }

        this.isAnalyzingFile = false;

        if (evaluated.length === 0) {
          this.importFileError = 'Không tìm thấy dòng dữ liệu sản phẩm nào trong tệp.';
          this.cdr.detectChanges();
          return;
        }

        this.precheckRows = evaluated;
        this.importStage = 'precheck';
        this.cdr.detectChanges();

      } catch (err: any) {
        this.isAnalyzingFile = false;
        this.importFileError = 'Lỗi khi xử lý cấu trúc bảng tính Excel. Vui lòng kiểm tra lại định dạng tệp.';
        this.cdr.detectChanges();
      }
    };

    fullReader.onerror = () => {
      this.isAnalyzingFile = false;
      this.importFileError = 'Không thể đọc nội dung tệp. Vui lòng thử lại.';
      this.cdr.detectChanges();
    };

    fullReader.readAsArrayBuffer(file);
  }

  // 7. XÁC NHẬN NHẬP DỮ LIỆU EXCEL VÀ LƯU THẬT VÀO POSTGRESQL
  confirmImport() {
    const rowsToImport = this.precheckRows.filter(r => r.isValid);
    if (rowsToImport.length === 0) {
      this.showToast('Không có dòng hợp lệ nào để nhập!', 'warning');
      return;
    }

    const fallbackCat = this.categories.find(c => c.id !== 'ALL');
    const resolveCatId = (row: ImportPrecheckRow): string => {
      if (row.categoryId && this.categories.some(c => c.id === row.categoryId)) {
        return row.categoryId;
      }
      const targetName = (row.categoryName || '').trim().toLowerCase();
      const matched = this.categories.find(c =>
        c.id !== 'ALL' && (c.name.toLowerCase() === targetName || c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase()))
      );
      return matched?.id || fallbackCat?.id || '';
    };

    const isActive = this.importStatusOption === 'Đang bán';
    const requests = rowsToImport.map((row) => {
      const catId = resolveCatId(row);
      const payload = {
        name: row.name,
        categoryId: catId,
        description: row.description || '',
        basePrice: Number(row.price) || 0,
        images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80'],
        isActive,
        variants: [
          {
            sku: `${row.sku}-STD`,
            name: 'Tiêu chuẩn',
            price: Number(row.price) || 0,
            stock: Number(row.stock) || 0,
            safetyThreshold: 5,
            isActive: true,
            optionValues: {
              safetyThreshold: 5,
              stock: Number(row.stock) || 0
            }
          }
        ]
      };
      return this.http.post<any>(`${environment.apiUrl}/admin/products`, payload).pipe(
        map(() => ({ ok: true })),
        catchError(() => of({ ok: false }))
      );
    });

    this.isAnalyzingFile = true;
    forkJoin(requests).subscribe({
      next: (results) => {
        this.isAnalyzingFile = false;
        const okCount = results.filter(r => r.ok).length;
        const failCount = results.length - okCount;
        this.productService.clearCache();
        this.closeImportModal();
        this.loadProducts();
        if (okCount > 0 && failCount === 0) {
          this.showToast(`Đã nhập và lưu thành công ${okCount} sản phẩm vào cơ sở dữ liệu!`, 'success');
        } else if (okCount > 0) {
          this.showToast(`Đã lưu ${okCount} sản phẩm vào DB (${failCount} dòng lỗi).`, 'warning');
        } else {
          this.showToast('Không thể nhập sản phẩm vào cơ sở dữ liệu. Vui lòng kiểm tra danh mục/quyền hạn.', 'error');
        }
      },
      error: () => {
        this.isAnalyzingFile = false;
        this.showToast('Lỗi khi nhập dữ liệu Excel lên máy chủ.', 'error');
      }
    });
  }

  // Làm sạch các ký tự đặc biệt đầu chuỗi chống Formula / CSV Injection (CWE-1236)
  private sanitizeCellValue(val: any): string {
    if (val === null || val === undefined) return '';
    let str = String(val).trim();
    while (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str.charAt(0))) {
      str = str.substring(1).trim();
    }
    return str;
  }

  private normalizeSearchText(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .trim();
  }

  // --- DROPDOWN CONTROL ---
  private closeAllDropdowns() {
    this.isStatusDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
    this.isSubCategoryDropdownOpen = false;
    this.isStockDropdownOpen = false;
    this.isBranchDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  get hasSubCategoryOptions(): boolean {
    return (
      this.roomOptions.length > 0 ||
      this.collectionOptions.length > 0 ||
      this.styleOptions.length > 0 ||
      this.materialOptions.length > 0
    );
  }

  get activeSubCategoryCount(): number {
    let count = 0;
    if (this.selectedRoomFilter !== 'ALL') count++;
    if (this.selectedCollectionFilter !== 'ALL') count++;
    if (this.selectedStyleFilter !== 'ALL') count++;
    if (this.selectedMaterialFilter !== 'ALL') count++;
    return count;
  }

  get selectedSubCategoryLabel(): string {
    const selectedNames: string[] = [];
    if (this.selectedRoomFilter !== 'ALL') {
      const found = this.roomOptions.find(r => r.slug === this.selectedRoomFilter);
      if (found) selectedNames.push(found.name);
    }
    if (this.selectedCollectionFilter !== 'ALL') {
      const found = this.collectionOptions.find(c => c.slug === this.selectedCollectionFilter);
      if (found) selectedNames.push(found.name);
    }
    if (this.selectedStyleFilter !== 'ALL') {
      const found = this.styleOptions.find(s => s.slug === this.selectedStyleFilter);
      if (found) selectedNames.push(found.name);
    }
    if (this.selectedMaterialFilter !== 'ALL') {
      const found = this.materialOptions.find(m => m.slug === this.selectedMaterialFilter);
      if (found) selectedNames.push(found.name);
    }

    if (selectedNames.length === 0) return 'Danh mục phụ';
    if (selectedNames.length === 1) return selectedNames[0];
    return 'Danh mục phụ';
  }

  toggleSubCategoryDropdown(e: Event) {
    e.stopPropagation();
    const next = !this.isSubCategoryDropdownOpen;
    this.closeAllDropdowns();
    this.isSubCategoryDropdownOpen = next;
  }

  toggleSubCategoryGroup(group: 'room' | 'collection' | 'style' | 'material', e: Event) {
    e.stopPropagation();
    this.expandedSubCategoryGroups[group] = !this.expandedSubCategoryGroups[group];
  }

  toggleSubCategoryOption(group: 'room' | 'collection' | 'style' | 'material', slug: string) {
    const isAlreadySelected =
      (group === 'room' && this.selectedRoomFilter === slug) ||
      (group === 'collection' && this.selectedCollectionFilter === slug) ||
      (group === 'style' && this.selectedStyleFilter === slug) ||
      (group === 'material' && this.selectedMaterialFilter === slug);

    // Chỉ cho phép chọn duy nhất 1 danh mục phụ tại một thời điểm
    this.selectedRoomFilter = 'ALL';
    this.selectedCollectionFilter = 'ALL';
    this.selectedStyleFilter = 'ALL';
    this.selectedMaterialFilter = 'ALL';

    if (!isAlreadySelected) {
      if (group === 'room') this.selectedRoomFilter = slug;
      else if (group === 'collection') this.selectedCollectionFilter = slug;
      else if (group === 'style') this.selectedStyleFilter = slug;
      else if (group === 'material') this.selectedMaterialFilter = slug;
    }

    this.isSubCategoryDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  clearSubCategoryFilters() {
    this.selectedRoomFilter = 'ALL';
    this.selectedCollectionFilter = 'ALL';
    this.selectedStyleFilter = 'ALL';
    this.selectedMaterialFilter = 'ALL';
    this.isSubCategoryDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      this.activeTab !== 'ALL' ||
      this.selectedCategory !== 'ALL' ||
      this.selectedRoomFilter !== 'ALL' ||
      this.selectedCollectionFilter !== 'ALL' ||
      this.selectedStyleFilter !== 'ALL' ||
      this.selectedMaterialFilter !== 'ALL' ||
      this.selectedStockFilter !== 'ALL' ||
      this.selectedBranchFilter !== 'ALL' ||
      this.sortBy !== 'newest'
    );
  }

  resetAllFilters() {
    this.activeTab = 'ALL';
    this.selectedCategory = 'ALL';
    this.selectedRoomFilter = 'ALL';
    this.selectedCollectionFilter = 'ALL';
    this.selectedStyleFilter = 'ALL';
    this.selectedMaterialFilter = 'ALL';
    this.selectedStockFilter = 'ALL';
    this.selectedBranchFilter = 'ALL';
    this.sortBy = 'newest';
    this.closeAllDropdowns();
    this.currentPage = 1;
    this.selectedProductIds.clear();
    this.applyFilters();
  }

  toggleStatusDropdown(e: Event) {
    e.stopPropagation();
    const next = !this.isStatusDropdownOpen;
    this.closeAllDropdowns();
    this.isStatusDropdownOpen = next;
  }

  selectStatusFilter(tab: StatusTab) {
    this.isStatusDropdownOpen = false;
    this.setTab(tab);
  }

  get selectedStatusLabel(): string {
    switch (this.activeTab) {
      case 'ACTIVE': return `Đang bán (${this.totalActiveCount})`;
      case 'DRAFT': return `Bản nháp (${this.totalDraftCount})`;
      case 'HIDDEN': return `Đã ẩn (${this.totalHiddenCount})`;
      default: return 'Tất cả trạng thái';
    }
  }

  toggleCategoryDropdown(e: Event) {
    e.stopPropagation();
    const next = !this.isCategoryDropdownOpen;
    this.closeAllDropdowns();
    this.isCategoryDropdownOpen = next;
  }

  selectCategory(catId: string) {
    this.selectedCategory = catId;
    this.isCategoryDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  get selectedCategoryLabel(): string {
    const found = this.categories.find(c => c.id === this.selectedCategory);
    return found ? found.name : 'Tất cả danh mục';
  }

  toggleStockDropdown(e: Event) {
    e.stopPropagation();
    const next = !this.isStockDropdownOpen;
    this.closeAllDropdowns();
    this.isStockDropdownOpen = next;
  }

  selectStockFilter(filter: StockFilter) {
    this.selectedStockFilter = filter;
    this.isStockDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  get selectedBranchLabel(): string {
    if (this.selectedBranchFilter === 'ALL') return 'Tất cả kho/showroom';
    const found = this.branchOptions.find(b => b.id === this.selectedBranchFilter);
    return found ? found.name : 'Kho/Showroom';
  }

  toggleBranchDropdown(event: Event) {
    event.stopPropagation();
    const next = !this.isBranchDropdownOpen;
    this.closeAllDropdowns();
    this.isBranchDropdownOpen = next;
  }

  selectBranchFilter(branchId: string) {
    this.selectedBranchFilter = branchId;
    this.isBranchDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  get isAllExpanded(): boolean {
    return this.filteredProducts.length > 0 && this.filteredProducts.every(p => p.isExpanded);
  }

  toggleExpandAll() {
    const nextState = !this.isAllExpanded;
    this.filteredProducts.forEach(p => p.isExpanded = nextState);
  }

  getVariantTotalStock(variant: ProductVariantItem): number {
    if (!variant || !Array.isArray(variant.branchStocks)) return 0;
    return variant.branchStocks.reduce((sum, b) => sum + (b.stock || 0), 0);
  }

  get selectedStockLabel(): string {
    switch (this.selectedStockFilter) {
      case 'IN_STOCK': return 'Còn hàng (> 10)';
      case 'LOW_STOCK': return 'Sắp hết (1 - 9)';
      case 'OUT_OF_STOCK': return 'Hết hàng (0)';
      default: return 'Tất cả tồn kho';
    }
  }

  toggleSortDropdown(e: Event) {
    e.stopPropagation();
    const next = !this.isSortDropdownOpen;
    this.closeAllDropdowns();
    this.isSortDropdownOpen = next;
  }

  selectSort(option: SortOption) {
    this.sortBy = option;
    this.isSortDropdownOpen = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  get selectedSortLabel(): string {
    switch (this.sortBy) {
      case 'newest': return 'Mới nhất';
      case 'price_asc': return 'Giá: Thấp đến cao';
      case 'price_desc': return 'Giá: Cao đến thấp';
      case 'stock_desc': return 'Tồn kho: Cao đến thấp';
      case 'stock_asc': return 'Tồn kho: Thấp đến cao';
      case 'name_asc': return 'Tên A → Z';
      default: return 'Mới nhất';
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.filterContainerRef && !this.filterContainerRef.nativeElement.contains(event.target)) {
      this.closeAllDropdowns();
    }
  }

  // --- HELPERS FORMATTING ---
  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  }

  formatPriceRange(range: { min: number; max: number }): string {
    if (range.min === range.max) {
      return this.formatVND(range.min);
    }
    return `${this.formatVND(range.min)} – ${this.formatVND(range.max)}`;
  }

  showToast(message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
      this.cdr.detectChanges();
    }, 3500);
  }

  dismissToast() {
    this.toastMessage = null;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
