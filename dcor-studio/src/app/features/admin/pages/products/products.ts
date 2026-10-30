import { Component, OnInit, HostListener, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { 
  LucideAngularModule, 
  Package, Tag, AlertCircle, TrendingUp, Search, Download, Upload, Plus, 
  ChevronDown, ChevronRight, ChevronLeft, ArrowUpDown, Trash2, Edit, Copy, Eye, EyeOff, 
  RotateCcw, CheckCircle2, X, Filter, FileSpreadsheet, Info, Check, RefreshCw,
  AlertTriangle
} from 'lucide-angular';
import * as XLSX from 'xlsx';

import { environment } from '../../../../../environments/environment';
import { AdminAuthService } from '../../../../core/services/admin-auth.service';

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
  name: string;
  baseSku: string; // SKU tổng, readonly
  categoryName: string;
  categoryId: string;
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
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1580481077195-c9b83b3e6c0c?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1580481077195-c9b83b3e6c0c?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=300&q=80',
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
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80',
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
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
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
        image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=300&q=80',
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
export class ProductsComponent implements OnInit {
  readonly Math = Math;

  icons = { 
    Package, Tag, AlertCircle, TrendingUp, Search, Download, Upload, Plus, 
    ChevronDown, ChevronRight, ChevronLeft, ArrowUpDown, Trash2, Edit, Copy, Eye, EyeOff, 
    RotateCcw, CheckCircle2, X, Filter, FileSpreadsheet, Info, Check, RefreshCw,
    AlertTriangle
  };

  // State chính - Khởi tạo rỗng để hiển thị loading spinner đồng bộ khi tải từ database
  allProducts: ProductListItem[] = [];
  filteredProducts: ProductListItem[] = [];
  isLoading = true;

  // Phân trang 10 sản phẩm mỗi trang
  pageSize = 10;
  currentPage = 1;

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

  get pagesArray(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Tabs & Filters
  activeTab: StatusTab = 'ALL';
  searchQuery = '';
  private searchDebounceTimer: any = null;

  selectedCategory = 'ALL';
  selectedStockFilter: StockFilter = 'ALL';
  sortBy: SortOption = 'newest';

  // Dropdown UI states
  isCategoryDropdownOpen = false;
  isStockDropdownOpen = false;
  isSortDropdownOpen = false;

  // Danh mục động
  categories: Array<{ id: string; name: string }> = [
    { id: 'ALL', name: 'Tất cả danh mục' },
    { id: 'cat-sofa', name: 'Sofa & Ghế bành' },
    { id: 'cat-table', name: 'Bàn trà & Bàn góc' },
    { id: 'cat-bed', name: 'Phòng ngủ' },
    { id: 'cat-dining', name: 'Bàn ăn & Ghế ăn' },
    { id: 'cat-storage', name: 'Kệ & Tủ lưu trữ' },
    { id: 'cat-lighting', name: 'Đèn & Ánh sáng' },
    { id: 'cat-decor', name: 'Phụ kiện & Thảm' }
  ];

  // Bulk actions
  selectedProductIds = new Set<string>();

  // Modals & Feedback Toast
  toastMessage: string | null = null;
  toastType: 'success' | 'warning' | 'info' | 'error' = 'success';
  private toastTimer: any = null;

  // Modal Xóa 2 bước
  isDeleteModalOpen = false;
  deleteStep: 1 | 2 = 1;
  deleteConfirmText = '';
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
    private adminAuthService: AdminAuthService
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

  ngOnInit() {
    this.loadProducts();
  }

  // Tải dữ liệu ban đầu từ Database thực tế (PostgreSQL / Prisma)
  loadProducts() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // 1. Tải danh mục ngầm
    this.http.get<any>(`${environment.apiUrl}/admin/categories`).subscribe({
      next: (catsRes) => {
        const catsData = catsRes?.tree || (Array.isArray(catsRes) ? catsRes : []);
        if (Array.isArray(catsData) && catsData.length > 0) {
          const dbCats: Array<{ id: string; name: string }> = [];
          catsData.forEach((parentCat: any) => {
            dbCats.push({ id: parentCat.slug || parentCat.id, name: parentCat.name });
            if (Array.isArray(parentCat.children)) {
              parentCat.children.forEach((child: any) => {
                dbCats.push({ id: child.slug || child.id, name: `— ${child.name}` });
              });
            }
          });
          this.categories = [{ id: 'ALL', name: 'Tất cả danh mục' }, ...dbCats];
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });

    // 2. Tải sản phẩm trực tiếp từ API backend qua HttpClient (phân trang 50 sản phẩm nhanh)
    this.http.get<any[]>(`${environment.apiUrl}/admin/products?page=1&limit=50`).subscribe({
      next: (prodsData) => {
        if (Array.isArray(prodsData) && prodsData.length > 0) {
          const apiProducts: ProductListItem[] = prodsData.map((p: any, idx: number) => {
            const rawVariants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : [];
            const mappedVariants: ProductVariantItem[] = rawVariants.map((v: any, vIdx: number) => {
              const opt = typeof v.optionValues === 'string' ? JSON.parse(v.optionValues) : (v.optionValues || {});
              const varImg = (opt.images && opt.images[0]) || (p.images && p.images[0]) || '';
              const baseStock = typeof v.stock === 'number' ? v.stock : 5;
              return {
                id: v.id || `var-${idx}-${vIdx}`,
                sku: v.sku || `SKU-${idx}-${vIdx}`,
                name: v.name || `Biến thể ${vIdx + 1}`,
                price: Number(v.price) || Number(p.basePrice) || 10000000,
                originalPrice: undefined,
                image: varImg || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
                isActive: v.isActive !== false,
                branchStocks: [
                  { branchId: 'wh-main', branchName: 'Kho Tổng', stock: Math.max(0, Math.floor(baseStock * 0.6)) },
                  { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: Math.max(0, Math.floor(baseStock * 0.2)) },
                  { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: Math.max(0, Math.floor(baseStock * 0.1)) },
                  { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: Math.max(0, Math.floor(baseStock * 0.1)) }
                ]
              };
            });

            const prices = mappedVariants.map(v => v.price);
            const minPrice = prices.length > 0 ? Math.min(...prices) : (Number(p.basePrice) || 10000000);
            const maxPrice = prices.length > 0 ? Math.max(...prices) : (Number(p.basePrice) || 10000000);
            const totalStock = mappedVariants.reduce((sum, v) => {
              return sum + v.branchStocks.reduce((bSum, b) => bSum + b.stock, 0);
            }, 0);

            const catName = (p.category && p.category.name) ? p.category.name : (typeof p.category === 'string' ? p.category : 'Khác');
            const catId = (p.category && (p.category.slug || p.category.id)) ? (p.category.slug || p.category.id) : 'cat-other';
            const baseSku = (p.variants && p.variants[0]?.sku) ? p.variants[0].sku : `DCOR-${String(p.slug || idx).toUpperCase().substring(0, 10)}`;

            let coverImg = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80';
            if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === 'string') {
              coverImg = p.images[0];
            } else if (mappedVariants[0]?.image) {
              coverImg = mappedVariants[0].image;
            }

            return {
              id: p.id,
              name: p.name || 'Sản phẩm nội thất DCor',
              baseSku: baseSku,
              categoryName: catName,
              categoryId: catId,
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
          this.allProducts = [...INITIAL_PRODUCTS];
        }
        this.isLoading = false;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Không thể tải từ backend, dùng dữ liệu dự phòng:', err);
        this.allProducts = [...INITIAL_PRODUCTS];
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

    // 3. Lọc theo Danh mục
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(p => p.categoryId === this.selectedCategory || p.categoryName === this.selectedCategory);
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

  // --- TOGGLE VARIANT ACTIVE STATUS ---
  toggleVariantActive(product: ProductListItem, variant: ProductVariantItem, event: Event) {
    event.stopPropagation();
    variant.isActive = !variant.isActive;
    
    // Tự động tính lại tổng tồn khả dụng của các biến thể đang active
    this.recalculateProductStats(product);
    this.showToast(`Đã ${variant.isActive ? 'kích hoạt' : 'tạm dừng'} bán biến thể ${variant.sku}`, 'info');
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


  // --- XÓA SẢN PHẨM 2 BƯỚC (BỎ THÙNG RÁC, XÁC THỰC YES) ---
  openDeleteStep1(product: ProductListItem, event: Event) {
    event.stopPropagation();
    this.productToDelete = product;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.isDeleteModalOpen = true;
  }

  goToDeleteStep2() {
    this.deleteStep = 2;
    this.deleteConfirmText = '';
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.deleteStep = 1;
    this.deleteConfirmText = '';
    this.productToDelete = null;
  }

  executePermanentDelete() {
    if (this.deleteConfirmText !== 'YES' || !this.productToDelete) {
      return;
    }
    const target = this.productToDelete;
    this.http.delete(`${environment.apiUrl}/admin/products/${target.id}`).subscribe({
      next: () => {
        this.allProducts = this.allProducts.filter(p => p.id !== target.id);
        this.selectedProductIds.delete(target.id);
        this.showToast(`Đã xóa vĩnh viễn sản phẩm "${target.name}" khỏi hệ thống`, 'success');
        this.closeDeleteModal();
        this.applyFilters();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Máy chủ từ chối: Bạn không có quyền xóa sản phẩm trên hệ thống! (403 Forbidden)';
        this.showToast(msg, 'warning');
        this.closeDeleteModal();
      }
    });
  }

  // Tương thích với các gọi cũ
  moveToTrash(product: ProductListItem, event: Event) {
    this.openDeleteStep1(product, event);
  }

  openPermanentDeleteModal(product: ProductListItem, event: Event) {
    this.openDeleteStep1(product, event);
  }

  confirmPermanentDelete() {
    this.executePermanentDelete();
  }

  closeDeleteConfirmModal() {
    this.closeDeleteModal();
  }

  // --- BULK ACTIONS ---
  bulkHide() {
    let count = 0;
    this.allProducts.forEach(p => {
      if (this.selectedProductIds.has(p.id) && p.status !== 'Đã ẩn') {
        p.status = 'Đã ẩn';
        count++;
      }
    });
    this.showToast(`Đã ẩn ${count} sản phẩm được chọn`, 'info');
    this.clearSelection();
    this.applyFilters();
  }

  bulkShow() {
    let count = 0;
    this.allProducts.forEach(p => {
      if (this.selectedProductIds.has(p.id) && p.status !== 'Đang bán') {
        p.status = 'Đang bán';
        count++;
      }
    });
    this.showToast(`Đã bật bán ${count} sản phẩm được chọn`, 'success');
    this.clearSelection();
    this.applyFilters();
  }

  bulkMoveToTrash() {
    let count = 0;
    this.allProducts.forEach(p => {
      if (this.selectedProductIds.has(p.id)) {
        p.isDeleted = true;
        p.isExpanded = false;
        count++;
      }
    });
    this.showToast(`Đã chuyển ${count} sản phẩm vào Thùng rác`, 'warning');
    this.clearSelection();
    this.applyFilters();
  }

  bulkRestore() {
    let count = 0;
    this.allProducts.forEach(p => {
      if (this.selectedProductIds.has(p.id) && p.isDeleted) {
        p.isDeleted = false;
        count++;
      }
    });
    this.showToast(`Đã khôi phục ${count} sản phẩm`, 'success');
    this.clearSelection();
    this.applyFilters();
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

  // 7. XÁC NHẬN NHẬP DỮ LIỆU
  confirmImport() {
    const rowsToImport = this.precheckRows.filter(r => r.isValid);
    if (rowsToImport.length === 0) {
      this.showToast('Không có dòng hợp lệ nào để nhập!', 'warning');
      return;
    }

    const now = new Date();
    const createdDate = now.toISOString().split('T')[0];

    const newProducts: ProductListItem[] = rowsToImport.map((row, idx) => {
      const prodId = `prod-imp-${Date.now()}-${idx}`;
      return {
        id: prodId,
        name: row.name,
        baseSku: row.sku,
        categoryName: row.categoryName,
        categoryId: row.categoryId || 'cat-sofa',
        priceRange: { min: row.price, max: row.price },
        totalVariants: 1,
        totalAvailableStock: row.stock || 0,
        status: this.importStatusOption,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80',
        createdAt: createdDate,
        hasOrders: false,
        isExpanded: false,
        isDeleted: false,
        variants: [
          {
            id: `var-imp-${Date.now()}-${idx}`,
            sku: `${row.sku}-STD`,
            name: 'Tiêu chuẩn',
            price: row.price,
            image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=300&q=80',
            isActive: true,
            branchStocks: [
              { branchId: 'wh-main', branchName: 'Kho Tổng', stock: row.stock || 0 },
              { branchId: 'sr-q1', branchName: 'Showroom Q1', stock: 0 },
              { branchId: 'sr-td', branchName: 'Showroom Thủ Đức', stock: 0 },
              { branchId: 'sr-hn', branchName: 'Showroom Cầu Giấy HN', stock: 0 }
            ]
          }
        ]
      };
    });

    // Đưa sản phẩm mới lên đầu danh sách
    this.allProducts = [...newProducts, ...this.allProducts];
    this.applyFilters();
    this.closeImportModal();
    this.showToast(`Đã nhập thành công ${newProducts.length} sản phẩm mới vào hệ thống!`, 'success');
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
  toggleCategoryDropdown(e: Event) {
    e.stopPropagation();
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    this.isStockDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  selectCategory(catId: string) {
    this.selectedCategory = catId;
    this.isCategoryDropdownOpen = false;
    this.applyFilters();
  }

  get selectedCategoryLabel(): string {
    const found = this.categories.find(c => c.id === this.selectedCategory);
    return found ? found.name : 'Tất cả danh mục';
  }

  toggleStockDropdown(e: Event) {
    e.stopPropagation();
    this.isStockDropdownOpen = !this.isStockDropdownOpen;
    this.isCategoryDropdownOpen = false;
    this.isSortDropdownOpen = false;
  }

  selectStockFilter(filter: StockFilter) {
    this.selectedStockFilter = filter;
    this.isStockDropdownOpen = false;
    this.applyFilters();
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
    this.isSortDropdownOpen = !this.isSortDropdownOpen;
    this.isCategoryDropdownOpen = false;
    this.isStockDropdownOpen = false;
  }

  selectSort(option: SortOption) {
    this.sortBy = option;
    this.isSortDropdownOpen = false;
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
      this.isCategoryDropdownOpen = false;
      this.isStockDropdownOpen = false;
      this.isSortDropdownOpen = false;
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
