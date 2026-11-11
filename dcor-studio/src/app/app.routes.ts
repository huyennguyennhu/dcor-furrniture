import { Routes, Router } from '@angular/router';
import { inject } from '@angular/core';
import { adminGuard } from './core/guards/admin.guard';
import { adminGuestGuard } from './core/guards/guest.guard';
import { customerGuard } from './core/guards/customer.guard';

export const routes: Routes = [
  // --- Admin Area (Dashboard) ---
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/components/admin-layout/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/pages/reports/reports').then(m => m.ReportsComponent) },
      { path: 'reports', redirectTo: 'reports/overview', pathMatch: 'full' },
      { path: 'reports/overview', loadComponent: () => import('./features/admin/pages/reports/reports').then(m => m.ReportsComponent) },
      { path: 'reports/revenue', loadComponent: () => import('./features/admin/pages/reports/revenue/revenue').then(m => m.RevenueComponent) },
      { path: 'reports/orders', loadComponent: () => import('./features/admin/pages/reports/orders/orders').then(m => m.OrdersComponent) },
      { path: 'reports/products', loadComponent: () => import('./features/admin/pages/reports/products-report/products-report').then(m => m.ProductsReportComponent) },
      { path: 'reports/customers', loadComponent: () => import('./features/admin/pages/reports/customers-report/customers-report').then(m => m.CustomersReportComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/pages/customers/customers').then(m => m.CustomersComponent) },
      { path: 'customers/:id', loadComponent: () => import('./features/admin/pages/customers/customer-detail/customer-detail').then(m => m.CustomerDetailComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/pages/products/products').then(m => m.ProductsComponent) },
      { path: 'products/new', loadComponent: () => import('./features/admin/pages/products/product-form/product-form').then(m => m.ProductFormComponent) },
      { path: 'products/categories', loadComponent: () => import('./features/admin/pages/product-categories/product-categories').then(m => m.ProductCategoriesComponent) },
      { path: 'products/:id', loadComponent: () => import('./features/admin/pages/products/product-form/product-form').then(m => m.ProductFormComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/pages/orders/orders').then(m => m.OrdersComponent) },
      { path: 'custom-requests', loadComponent: () => import('./features/admin/pages/custom-requests/custom-requests').then(m => m.AdminCustomRequestsComponent) },
      { path: 'orders/returns', loadComponent: () => import('./features/admin/pages/orders/orders-returns/orders-returns').then(m => m.OrdersReturnsComponent) },
      { path: 'orders/returns/:id', loadComponent: () => import('./features/admin/pages/orders/orders-returns/order-return-detail/order-return-detail').then(m => m.OrderReturnDetailComponent) },
      { path: 'orders/warranty', loadComponent: () => import('./features/admin/pages/orders/orders-warranty/orders-warranty').then(m => m.OrdersWarrantyComponent) },
      { path: 'orders/settings', loadComponent: () => import('./features/admin/pages/orders/orders-settings/orders-settings').then(m => m.OrdersSettingsComponent) },
      { path: 'orders/:id', loadComponent: () => import('./features/admin/pages/orders/order-detail/order-detail').then(m => m.OrderDetailComponent) },
      { path: 'orders-v2', redirectTo: 'orders', pathMatch: 'full' },
      { path: 'orders-v2/:id', redirectTo: 'orders/:id' },
      { path: 'inventory', loadComponent: () => import('./features/admin/pages/inventory/inventory').then(m => m.InventoryComponent) },
      { path: 'inventory/product/:id', loadComponent: () => import('./features/admin/pages/inventory/inventory-product-detail/inventory-product-detail').then(m => m.InventoryProductDetailComponent) },
      { path: 'inventory/audit', loadComponent: () => import('./features/admin/pages/inventory/inventory-audit/inventory-audit').then(m => m.InventoryAuditComponent) },
      // Lệnh xuất - nhập kho
      { path: 'inventory/orders', redirectTo: 'inventory/transactions', pathMatch: 'full' },
      { path: 'inventory/transactions', loadComponent: () => import('./features/admin/pages/inventory/inventory-transactions/inventory-transactions').then(m => m.InventoryTransactionsComponent) },
      { path: 'inventory/history', loadComponent: () => import('./features/admin/pages/inventory/inventory-history/inventory-history').then(m => m.InventoryHistoryComponent) },
      { path: 'inventory/settings', loadComponent: () => import('./features/admin/pages/inventory/inventory-settings/inventory-settings').then(m => m.InventorySettingsComponent) },
      { path: 'promotions', loadComponent: () => import('./features/admin/pages/promotions/promotions').then(m => m.PromotionsComponent) },
      { path: 'promotions/vouchers', redirectTo: 'vouchers', pathMatch: 'full' },
      { path: 'promotions/campaigns', redirectTo: 'campaigns', pathMatch: 'full' },
      { path: 'vouchers', loadComponent: () => import('./features/admin/pages/promotions/vouchers/vouchers').then(m => m.VouchersComponent) },
      { path: 'campaigns', loadComponent: () => import('./features/admin/pages/promotions/campaigns/campaigns').then(m => m.CampaignsComponent) },
      { path: 'appointments', loadComponent: () => import('./features/admin/pages/appointments/appointments').then(m => m.AppointmentsComponent) },
      { path: 'appointments/schedule', loadComponent: () => import('./features/admin/pages/appointments/appointments').then(m => m.AppointmentsComponent) },
      { path: 'appointments/requests', loadComponent: () => import('./features/admin/pages/appointments/appointments').then(m => m.AppointmentsComponent) },
      { path: 'content', loadComponent: () => import('./features/admin/pages/content/content').then(m => m.ContentComponent) },
      { path: 'chat', loadComponent: () => import('./features/admin/pages/chat/chat').then(m => m.ChatComponent) },
      { path: 'chat/scripts', loadComponent: () => import('./features/admin/pages/chat/chat-scripts/chat-scripts').then(m => m.ChatScriptsComponent) },
      { path: 'chat/settings', loadComponent: () => import('./features/admin/pages/chat/chat-settings/chat-settings').then(m => m.ChatSettingsComponent) },
      { path: 'designs', loadComponent: () => import('./features/admin/pages/designs/designs').then(m => m.DesignsComponent) },
      { path: 'designs/settings', loadComponent: () => import('./features/admin/pages/designs/design-settings/design-settings').then(m => m.DesignSettingsComponent) },
      { path: 'designs/posts', loadComponent: () => import('./features/admin/pages/designs/design-posts/design-posts').then(m => m.DesignPostsComponent) },
      { path: 'staff', loadComponent: () => import('./features/admin/pages/staff/staff-accounts/staff-accounts').then(m => m.StaffAccountsComponent) },
      { path: 'staff/accounts', loadComponent: () => import('./features/admin/pages/staff/staff-accounts/staff-accounts').then(m => m.StaffAccountsComponent) },
      { path: 'staff/shifts', redirectTo: 'staff/accounts', pathMatch: 'full' },
      { path: 'staff/my-shifts', redirectTo: 'staff/accounts', pathMatch: 'full' },
      { path: 'staff/showroom-shifts', redirectTo: 'staff/accounts', pathMatch: 'full' },
      { path: 'staff/permissions', loadComponent: () => import('./features/admin/pages/staff/staff-permissions/staff-permissions').then(m => m.StaffPermissionsComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/pages/settings/settings').then(m => m.SettingsComponent) },
      { path: 'audit-log', loadComponent: () => import('./features/admin/pages/audit-log/audit-log').then(m => m.AuditLogComponent) },
      { path: 'activity', redirectTo: 'audit-log', pathMatch: 'full' },
      { path: '**', redirectTo: 'reports/overview' },
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
      { path: 'kham-pha', redirectTo: 'explore', pathMatch: 'full' },
      { path: 'kham-pha/:id', redirectTo: 'products/:id' },
      { path: 'products/:id', loadComponent: () => import('./features/store/pages/product-detail/product-detail').then(m => m.ProductDetailComponent) },
      { path: 'explore/:id', loadComponent: () => import('./features/store/pages/product-detail/product-detail').then(m => m.ProductDetailComponent) }, // Alias
      { path: 'cart', redirectTo: '', pathMatch: 'full' },
      { path: 'checkout', loadComponent: () => import('./features/store/pages/checkout/checkout').then(m => m.CheckoutComponent) },
      { path: 'blog', loadComponent: () => import('./features/store/pages/blog/blog').then(m => m.BlogComponent) },
      { path: 'blog/:slug', loadComponent: () => import('./features/store/pages/blog/blog-detail/blog-detail').then(m => m.BlogDetailComponent) },
      { path: 'custom-design', loadComponent: () => import('./features/store/pages/custom-design/custom-design').then(m => m.CustomDesignComponent) },
      { path: 'community', loadComponent: () => import('./features/store/pages/community/community').then(m => m.CommunityComponent) },
      { path: 'about', loadComponent: () => import('./features/store/pages/support/pages/about/about').then(m => m.AboutComponent) },
      { path: 'faq', loadComponent: () => import('./features/store/pages/support/pages/faq/faq').then(m => m.FaqComponent) },
      { path: 'huong-dan-mua-hang', loadComponent: () => import('./features/store/pages/support/pages/guide/guide').then(m => m.ShoppingGuideComponent) },
      { path: 'chinh-sach/:slug', loadComponent: () => import('./features/store/pages/support/pages/policy/policy').then(m => m.PolicyComponent) },
      { path: 'consultation', redirectTo: 'account/appointments', pathMatch: 'full' },
      { path: 'showroom', redirectTo: 'account/appointments', pathMatch: 'full' },
      
      // --- Account Area (inside Store Layout) ---
      {
        path: 'account',
        children: [
          { path: '', redirectTo: 'profile', pathMatch: 'full' },
          { path: 'profile', loadComponent: () => import('./features/account/pages/profile/profile').then(m => m.ProfileComponent) },
          { path: 'addresses', canActivate: [customerGuard], loadComponent: () => import('./features/account/pages/addresses/addresses').then(m => m.AccountAddressesComponent) },
          { path: 'orders', loadComponent: () => import('./features/account/pages/my-orders/my-orders').then(m => m.MyOrdersComponent) },
          { path: 'my-orders', redirectTo: 'orders', pathMatch: 'full' },
          { path: 'reviews', loadComponent: () => import('./features/account/pages/reviews/reviews').then(m => m.AccountReviewsComponent) },
          { path: 'returns', loadComponent: () => import('./features/account/pages/returns/returns').then(m => m.AccountReturnsComponent) },
          { path: 'warranty', loadComponent: () => import('./features/account/pages/warranty/warranty').then(m => m.AccountWarrantyComponent) },
          { path: 'wishlist', loadComponent: () => import('./features/account/pages/wishlist/wishlist').then(m => m.WishlistComponent) },
          { path: 'appointments', loadComponent: () => import('./features/account/pages/appointments/appointments').then(m => m.AccountAppointmentsComponent) },
          { path: 'custom-requests', loadComponent: () => import('./features/account/pages/custom-requests/custom-requests').then(m => m.CustomRequestsComponent) },
          { path: 'designs', redirectTo: () => inject(Router).createUrlTree(['/community'], { queryParams: { tab: 'my-hub', sub: 'saved' } }) },
          { path: 'notifications', canActivate: [customerGuard], loadComponent: () => import('./features/account/pages/notifications/notifications').then(m => m.AccountNotificationsComponent) },
        ]
      }
    ]
  },
  
  // Fallback
  { path: '**', redirectTo: '' }
];
