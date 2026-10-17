import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RevenueReportData {
  kpi: {
    totalRevenue: number;
    netRevenue: number;
    dailyAverage: number;
    aov: number;
    growthRate: number;
    prevTotalRevenue: number;
  };
  chart: {
    labels: string[];
    current: number[];
    previous: number[];
  };
  byCategory: { name: string; value: number }[];
  byShowroom: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
  categoriesFilter?: string[];
}

export interface OrdersReportData {
  kpi: {
    totalOrders: number;
    completedOrders: number;
    completedRate: number;
    processingOrders: number;
    cancelledOrders: number;
    cancelRate: number;
    avgProcessingHours: number;
  };
  chart: {
    labels: string[];
    total: number[];
    completed: number[];
  };
  byStatus: { name: string; value: number }[];
  byPaymentMethod: { name: string; value: number }[];
  byShippingMethod: { name: string; value: number }[];
  byLocation: { name: string; value: number }[];
  topOrders: {
    id: string;
    customer: string;
    items: number;
    total: string;
    status: string;
    date: string;
  }[];
}

export interface ProductsReportData {
  kpi: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    bestSellerName: string;
    bestSellerCount: number;
  };
  categoryProducts: { name: string; value: number }[];
  topSales: { name: string; value: number }[];
  revenueByProduct: { name: string; value: number }[];
  performanceList: {
    id: string;
    name: string;
    sales: number;
    revenue: string;
    stock: number;
    rating: number;
  }[];
}

export interface CustomersReportData {
  kpi: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    repeatPurchaseRate: number;
  };
  chart: {
    labels: string[];
    values: number[];
  };
  byMembership: { name: string; value: number }[];
  byLocation: { name: string; value: number }[];
  topSpenders: {
    id: string;
    name: string;
    tier: string;
    orders: number;
    spent: string;
  }[];
  topOrderFreq: {
    id: string;
    name: string;
    tier: string;
    orders: number;
    spent: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/reports`;

  getRevenueReport(params: {
    timeRange?: string;
    category?: string;
    brand?: string;
    collection?: string;
    interval?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<RevenueReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<RevenueReportData>(`${this.baseUrl}/revenue`, { params: httpParams });
  }

  getOrdersReport(params: {
    timeRange?: string;
    status?: string;
    payment?: string;
    shipping?: string;
    interval?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<OrdersReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<OrdersReportData>(`${this.baseUrl}/orders`, { params: httpParams });
  }

  getProductsReport(params: {
    timeRange?: string;
    category?: string;
    brand?: string;
    status?: string;
  }): Observable<ProductsReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<ProductsReportData>(`${this.baseUrl}/products`, { params: httpParams });
  }

  getCustomersReport(params: {
    timeRange?: string;
    tier?: string;
    location?: string;
    interval?: string;
  }): Observable<CustomersReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<CustomersReportData>(`${this.baseUrl}/customers`, { params: httpParams });
  }

  getOverviewReport(params: {
    timeRange?: string;
    showroom?: string;
    startDate?: string;
    endDate?: string;
  }): Observable<OverviewReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<OverviewReportData>(`${this.baseUrl}/overview`, { params: httpParams });
  }
}

export interface OverviewReportData {
  kpi: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    totalCustomers: number;
    newCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    totalAppointments: number;
    upcomingAppointments: number;
  };
  revenueChart: {
    labels: string[];
    current: number[];
    previous: number[];
  };
  orderStatusData: { name: string; value: number }[];
  categoryRevenueData: { name: string; value: number }[];
  funnelData: { value: number; name: string; fill: string }[];
  topProducts: {
    id: number | string;
    name: string;
    sku: string;
    sales: number;
    revenue: string;
    stock: number;
  }[];
  topCustomers: {
    id: string;
    name: string;
    phone: string;
    orders: number;
    totalSpent: string;
    rank: string;
  }[];
}

