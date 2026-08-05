import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { OrderService } from '../order.service';
import { DELETABLE_STATUSES, Order, OrderStatus } from '../order.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiError } from '../../../shared/models/api-error.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { isDeletableStatus } from '../../../shared/models/status-workflow.model';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTooltipModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    CurrencyPipe,
    DatePipe,
    TableSkeletonComponent,
  ],
  templateUrl: './order-list.html',
  styleUrl: './order-list.scss',
})
export class OrderListComponent implements OnInit {
  private readonly ordersService = inject(OrderService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = [
    'id',
    'customerName',
    'status',
    'totalAmount',
    'createdAt',
    'actions',
  ];
  readonly orders = signal<Order[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly statuses: OrderStatus[] = [
    'PENDING',
    'AWAITING_PAYMENT',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
  ];

  readonly filterForm = this.fb.group({
    status: [null as OrderStatus | null],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadOrders();
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadOrders();
    });
  }

  loadOrders(): void {
    this.loading.set(true);
    const status = this.filterForm.value.status;

    const request$ = status
      ? this.ordersService.search({ status }, this.pageIndex(), this.pageSize())
      : this.ordersService.getAll(this.pageIndex(), this.pageSize());

    request$.subscribe({
      next: (page) => {
        this.orders.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load orders.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadOrders();
  }

  isDeletable(order: Order): boolean {
    return isDeletableStatus(DELETABLE_STATUSES, order.status);
  }

  get isFiltering(): boolean {
    return !!this.filterForm.value.status;
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/orders', order.id]);
  }

  deleteOrder(order: Order): void {
    this.confirmDialog
      .confirm({
        title: 'Delete order',
        message: `Delete order #${order.id}? This cannot be undone.`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.ordersService.delete(order.id!).subscribe({
          next: () => {
            this.snackbar.success('Order deleted.');
            this.loadOrders();
          },
          error: (err: HttpErrorResponse) => {
            const apiError = err.error as ApiError | undefined;
            this.snackbar.error(apiError?.message ?? 'Failed to delete order.');
          },
        });
      });
  }
}
