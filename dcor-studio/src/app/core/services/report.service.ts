import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface RevenueReportData {
  kpi: {
    grossSales: number;
    discountAmount: number;
    discountRate: number;
    netRevenue: number;
    aov: number;
    pendingReceivables: number;
    dailyAverage: number;
    growthRate: number;
    totalOrders?: number;
    totalRevenue?: number;
    prevTotalRevenue?: number;
  };
  chart: {
    labels: string[];
    revenue?: number[];
    discountRate?: number[];
    previousRevenue?: number[];
    current: number[];
    previous: number[];
  };
  paymentBreakdown?: {
    name: string;
    amount: number;
    count: number;
    percent: number;
    color: string;
  }[];
  byCategory: { name: string; value: number }[];
  regionalSales?: { name: string; value: number }[];
  topOrders?: {
    id: string;
    orderCode: string;
    customerName: string;
    phone: string;
    showroom: string;
    paymentMethod: string;
    paymentStatus: string;
    isDepositRequired: boolean;
    grossAmount: number;
    discountAmount: number;
    totalAmount: number;
    createdAt: string;
  }[];
  byShowroom?: { name: string; value: number }[];
  topProducts?: { name: string; value: number }[];
  categoriesFilter?: string[];
}

export interface OrdersReportData {
  kpi: {
    totalOrders: number;
    ordersGrowth: number;
    otifRate: number;
    avgLeadTimeHours: number;
    cancelledOrders: number;
    cancelRate: number;
    returnsAndWarranty: number;
  };
  lifecycle: {
    key: string;
    name: string;
    count: number;
    percent: number;
    color: string;
  }[];
  chart: {
    labels: string[];
    created: number[];
    completed: number[];
    prevCreated: number[];
  };
  cancellationReasons: {
    reason: string;
    count: number;
    percent: number;
    color: string;
  }[];
  carrierPerformance: {
    name: string;
    orders: number;
    onTimeRate: number;
    color: string;
  }[];
  ordersList: {
    id: string;
    orderCode: string;
    customerName: string;
    phone: string;
    showroom: string;
    shippingProvider: string;
    status: string;
    statusText: string;
    isCustomDesign: boolean;
    isHighValue: boolean;
    totalAmount: number;
    createdAt: string;
  }[];
}

export interface ProductsReportData {
  categoryList?: string[];
  categoryBreakdown?: {
    main: { name: string; value: number }[];
    sub: { name: string; value: number }[];
    room: { name: string; value: number }[];
    style: { name: string; value: number }[];
  };
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
    vipRevenuePercent?: number;
    vipCustomerCount?: number;
    growthRate?: number;
  };
  chart: {
    labels: string[];
    values: number[];
    prevValues?: number[];
  };
  byMembership: { name: string; value: number }[];
  byLocation: { name: string; value: number }[];
  byShowroom?: { name: string; value: number }[];
  topSpenders: {
    id: string;
    customerId?: string;
    name: string;
    phone?: string;
    email?: string;
    tier: string;
    orders: number;
    spent: string;
    rawSpent?: number;
  }[];
  topOrderFreq: {
    id: string;
    customerId?: string;
    name: string;
    phone?: string;
    email?: string;
    tier: string;
    orders: number;
    spent: string;
    rawSpent?: number;
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
    showroom?: string;
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
    showroom?: string;
    orderType?: string;
    carrier?: string;
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
    startDate?: string;
    endDate?: string;
    category?: string;
    brand?: string;
    status?: string;
    compare?: boolean;
  }): Observable<ProductsReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val) httpParams = httpParams.set(key, val);
    });
    return this.http.get<ProductsReportData>(`${this.baseUrl}/products`, { params: httpParams });
  }

  getCustomersReport(params: {
    timeRange?: string;
    startDate?: string;
    endDate?: string;
    tier?: string;
    location?: string;
    type?: string;
    interval?: string;
    compare?: boolean;
  }): Observable<CustomersReportData> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') httpParams = httpParams.set(key, val.toString());
    });
    return this.http.get<CustomersReportData>(`${this.baseUrl}/customers`, { params: httpParams });
  }

  getOverviewReport(params: {
    timeRange?: string;
    showroom?: string;
    interval?: string;
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
    // Executive KPIs
    netRevenue?: number;
    totalRevenue?: number;
    revenueGrowth: number;
    totalOrders: number;
    ordersGrowth: number;
    fulfillmentRate?: number;
    aov?: number;
    // Operational Urgent KPIs
    pendingConfirmationOrders?: number;
    pendingDepositOrders?: number;
    criticalLowStockSKUs?: number;
    todayAppointments?: number;
    // Directory counts
    totalCustomers: number;
    newCustomers: number;
    diamondCustomers?: number;
    totalProducts: number;
    lowStockProducts?: number;
    totalAppointments?: number;
    upcomingAppointments?: number;
  };
  revenueChart: {
    labels: string[];
    current: number[];
    previous: number[];
  };
  orderStatusData: { name: string; value: number; color?: string; code?: string }[];
  showroomSalesData?: { name: string; revenue: number; orders: number; delivered: number }[];
  categoryRevenueData?: { name: string; value: number }[];
  funnelData: { stage?: string; count?: number; percent?: number; value?: number; name?: string; fill?: string }[];
  topProducts: {
    rank?: number;
    id: number | string;
    name: string;
    sku: string;
    category?: string;
    sales: number;
    revenue: number | string;
    stock: number;
  }[];
  topCustomers: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    tier?: string;
    badgeClass?: string;
    orders?: number;
    ordersCount?: number;
    totalSpent: number | string;
    rank?: string;
    lastOrderDate?: string;
  }[];
}

