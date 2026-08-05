import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/components/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products-list/products-list.component').then(
            (m) => m.ProductsListComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/products/product-form/product-form.component').then(
            (m) => m.ProductFormComponent,
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list/customer-list.component').then(
            (m) => m.CustomersListComponent,
          ),
      },
      {
        path: 'customers/new',
        loadComponent: () =>
          import('./features/customers/customer-form/customer-form.component').then(
            (m) => m.CustomerFormComponent,
          ),
      },
      {
        path: 'customers/:id/edit',
        loadComponent: () =>
          import('./features/customers/customer-form/customer-form.component').then(
            (m) => m.CustomerFormComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-list/inventory-list.component').then(
            (m) => m.InventoryListComponent,
          ),
      },
      {
        path: 'inventory/new',
        loadComponent: () =>
          import('./features/inventory/inventory-form/inventory-form.component').then(
            (m) => m.InventoryFormComponent,
          ),
      },
      {
        path: 'inventory/:id/edit',
        loadComponent: () =>
          import('./features/inventory/inventory-form/inventory-form.component').then(
            (m) => m.InventoryFormComponent,
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/order-list/order-list.component').then(
            (m) => m.OrderListComponent,
          ),
      },
      {
        path: 'orders/new',
        loadComponent: () =>
          import('./features/orders/order-form/order-form.component').then(
            (m) => m.OrderFormComponent,
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail/order-detail.component').then(
            (m) => m.OrderDetailComponent,
          ),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payments-list/payments-list.component').then(
            (m) => m.PaymentsListComponent,
          ),
      },
      {
        path: 'payments/new',
        loadComponent: () =>
          import('./features/payments/payment-form/payment-form.component').then(
            (m) => m.PaymentFormComponent,
          ),
      },
      {
        path: 'shipments',
        loadComponent: () =>
          import('./features/shipments/shipments-list/shipments-list.component').then(
            (m) => m.ShipmentsListComponent,
          ),
      },
      {
        path: 'shipments/new',
        loadComponent: () =>
          import('./features/shipments/shipment-form/shipment-form.component').then(
            (m) => m.ShipmentFormComponent,
          ),
      },
    ],
  },
];
