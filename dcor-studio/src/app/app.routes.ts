import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { adminGuestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // --- Admin Landing Page ---
  {
    path: 'admin',
    pathMatch: 'full',
    canActivate: [adminGuestGuard],
    loadComponent: () => import('./features/admin/pages/admin-landing/admin-landing').then(m => m.AdminLandingComponent)
  },
  
  // --- Admin Area (Dashboard) ---
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/components/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: 'reports', loadComponent: () => import('./features/admin/pages/reports/reports').then(m => m.ReportsComponent) },
      { path: 'reports/overview', loadComponent: () => import('./features/admin/pages/reports/reports').then(m => m.ReportsComponent) },
      { path: 'reports/revenue', loadComponent: () => import('./features/admin/pages/reports/revenue/revenue').then(m => m.RevenueComponent) },
      { path: 'reports/orders', loadComponent: () => import('./features/admin/pages/reports/orders/orders').then(m => m.OrdersComponent) },
      { path: 'reports/products', loadComponent: () => import('./features/admin/pages/reports/products-report/products-report').then(m => m.ProductsReportComponent) },
      { path: 'reports/customers', loadComponent: () => import('./features/admin/pages/reports/customers-report/customers-report').then(m => m.CustomersReportComponent) },
      { path: 'dashboard', loadComponent: () => import('./features/admin/pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/pages/customers/customers').then(m => m.CustomersComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/admin/pages/customers/customer-detail/customer-detail').then(m => m.CustomerDetailComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/pages/products/products').then(m => m.ProductsComponent) },
      { path: 'products/new', loadComponent: () => import('./features/admin/pages/products/product-form/product-form').then(m => m.ProductFormComponent) },
      { path: 'products/categories', loadComponent: () => import('./features/admin/pages/product-categories/product-categories').then(m => m.ProductCategoriesComponent) },
      { path: 'products/:id', loadComponent: () => import('./features/admin/pages/products/product-form/product-form').then(m => m.ProductFormComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/pages/orders/orders').then(m => m.OrdersComponent) },
      { path: 'orders/returns', loadComponent: () => import('./features/admin/pages/orders/orders-returns/orders-returns').then(m => m.OrdersReturnsComponent) },
      { path: 'orders/warranty', loadComponent: () => import('./features/admin/pages/orders/orders-warranty/orders-warranty').then(m => m.OrdersWarrantyComponent) },
      { path: 'orders/:id', loadComponent: () => import('./features/admin/pages/orders/order-detail/order-detail').then(m => m.OrderDetailComponent) },
      { path: 'inventory', loadComponent: () => import('./features/admin/pages/inventory/inventory').then(m => m.InventoryComponent) },
      { path: 'inventory/product/:id', loadComponent: () => import('./features/admin/pages/inventory/inventory-product-detail/inventory-product-detail').then(m => m.InventoryProductDetailComponent) },
      { path: 'inventory/audit', loadComponent: () => import('./features/admin/pages/inventory/inventory-audit/inventory-audit').then(m => m.InventoryAuditComponent) },
      // Lệnh xuất - nhập kho
      { path: 'inventory/orders', redirectTo: 'inventory/transactions', pathMatch: 'full' },
      { path: 'inventory/transactions', loadComponent: () => import('./features/admin/pages/inventory/inventory-transactions/inventory-transactions').then(m => m.InventoryTransactionsComponent) },
      { path: 'inventory/history', loadComponent: () => import('./features/admin/pages/inventory/inventory-history/inventory-history').then(m => m.InventoryHistoryComponent) },
      { path: 'promotions', loadComponent: () => import('./features/admin/pages/promotions/promotions').then(m => m.PromotionsComponent) },
      { path: 'vouchers', loadComponent: () => import('./features/admin/pages/promotions/vouchers/vouchers').then(m => m.VouchersComponent) },
      { path: 'campaigns', loadComponent: () => import('./features/admin/pages/promotions/campaigns/campaigns').then(m => m.CampaignsComponent) },
      { path: 'appointments', loadComponent: () => import('./features/admin/pages/appointments/appointments').then(m => m.AppointmentsComponent) },
      { path: 'appointments/schedule', loadComponent: () => import('./features/admin/pages/appointments/appointment-schedule/appointment-schedule').then(m => m.AppointmentScheduleComponent) },
      { path: 'appointments/requests', loadComponent: () => import('./features/admin/pages/appointments/appointment-requests/appointment-requests').then(m => m.AppointmentRequestsComponent) },
      { path: 'content', loadComponent: () => import('./features/admin/pages/content/content').then(m => m.ContentComponent) },
      { path: 'chat', loadComponent: () => import('./features/admin/pages/chat/chat').then(m => m.ChatComponent) },
      { path: 'designs', loadComponent: () => import('./features/admin/pages/designs/designs').then(m => m.DesignsComponent) },
      { path: 'designs/settings', loadComponent: () => import('./features/admin/pages/designs/design-settings/design-settings').then(m => m.DesignSettingsComponent) },
      { path: 'designs/posts', loadComponent: () => import('./features/admin/pages/designs/design-posts/design-posts').then(m => m.DesignPostsComponent) },
      { path: 'staff', loadComponent: () => import('./features/admin/pages/staff/staff-accounts/staff-accounts').then(m => m.StaffAccountsComponent) },
      { path: 'staff/accounts', loadComponent: () => import('./features/admin/pages/staff/staff-accounts/staff-accounts').then(m => m.StaffAccountsComponent) },
      { path: 'staff/permissions', loadComponent: () => import('./features/admin/pages/staff/staff-permissions/staff-permissions').then(m => m.StaffPermissionsComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/pages/settings/settings').then(m => m.SettingsComponent) },
      { path: '**', redirectTo: 'dashboard' },
    ]
  },
  
  // --- Auth Area ---
  { path: 'login', loadComponent: () => import('./features/auth/pages/login/login').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/pages/register/register').then(m => m.RegisterComponent) },
  { 
    path: 'admin-login', 
    canActivate: [adminGuestGuard],
    loadComponent: () => import('./features/auth/pages/admin-login/admin-login').then(m => m.AdminLoginComponent) 
  },
  { path: 'admin-logout', loadComponent: () => import('./features/auth/pages/admin-logout/admin-logout').then(m => m.AdminLogout) },
  { path: 'admin-invite', loadComponent: () => import('./features/auth/pages/admin-invite-accept/admin-invite-accept').then(m => m.AdminInviteAcceptComponent) },
  
  // --- Store Area (Default Layout) ---
  {
    path: '',
    loadComponent: () => import('./features/store/components/store-layout/store-layout').then(m => m.StoreLayout),
    children: [
      { path: '', loadComponent: () => import('./features/store/pages/home/home').then(m => m.HomeComponent) },
      { path: 'explore', loadComponent: () => import('./features/store/pages/explore/explore').then(m => m.ExploreComponent) },
      { path: 'products/:id', loadComponent: () => import('./features/store/pages/product-detail/product-detail').then(m => m.ProductDetailComponent) },
      { path: 'explore/:id', loadComponent: () => import('./features/store/pages/product-detail/product-detail').then(m => m.ProductDetailComponent) }, // Alias
      { path: 'cart', loadComponent: () => import('./features/store/pages/cart/cart').then(m => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('./features/store/pages/checkout/checkout').then(m => m.CheckoutComponent) },
      { path: 'blog', loadComponent: () => import('./features/store/pages/blog/blog').then(m => m.BlogComponent) },
      { path: 'custom-design', loadComponent: () => import('./features/store/pages/custom-design/custom-design').then(m => m.CustomDesignComponent) },
      
      // --- Account Area (inside Store Layout) ---
      {
        path: 'account',
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          { path: 'profile', loadComponent: () => import('./features/account/pages/profile/profile').then(m => m.ProfileComponent) },
          { path: 'orders', loadComponent: () => import('./features/account/pages/my-orders/my-orders').then(m => m.MyOrdersComponent) },
          { path: 'wishlist', loadComponent: () => import('./features/account/pages/wishlist/wishlist').then(m => m.WishlistComponent) },
          { path: 'custom-requests', loadComponent: () => import('./features/account/pages/custom-requests/custom-requests').then(m => m.CustomRequestsComponent) },
        ]
      }
    ]
  },
  
  // Fallback
  { path: '**', redirectTo: '' }
];
