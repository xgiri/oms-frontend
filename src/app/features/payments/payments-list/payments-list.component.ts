import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { PaymentService } from '../payment.service';
import {
  ALLOWED_PAYMENT_TRANSITIONS,
  isPaymentDeletable,
  Payment,
  PaymentStatus,
} from '../payment.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { ApiError } from '../../../shared/models/api-error.model';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '../../../shared/components/prompt-dialog/prompt-dialog.component';
import { getAllowedTransitions } from '../../../shared/models/status-workflow.model';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    DatePipe,
    CurrencyPipe,
    TableSkeletonComponent,
  ],
  templateUrl: './payments-list.html',
  styleUrl: './payments-list.scss',
})
export class PaymentsListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);

  readonly displayedColumns = [
    'orderId',
    'amount',
    'method',
    'status',
    'transactionReference',
    'createdAt',
    'actions',
  ];
  readonly payments = signal<Payment[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly statuses: PaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];

  readonly filterForm = this.fb.group({
    orderId: [null as number | null],
    status: [null as PaymentStatus | null],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadPayments();
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadPayments();
    });
  }

  isFiltering(): boolean {
    const { orderId, status } = this.filterForm.value;
    return orderId != null || !!status;
  }

  loadPayments(): void {
    this.loading.set(true);

    const request$ = this.isFiltering()
      ? this.paymentService.search(
          {
            orderId: this.filterForm.value.orderId ?? undefined,
            status: this.filterForm.value.status ?? undefined,
          },
          this.pageIndex(),
          this.pageSize(),
        )
      : this.paymentService.getAll(this.pageIndex(), this.pageSize());

    request$.subscribe({
      next: (page) => {
        this.payments.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load payments.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadPayments();
  }

  availableTransitions(payment: Payment): PaymentStatus[] {
    return getAllowedTransitions(ALLOWED_PAYMENT_TRANSITIONS, payment.status);
  }

  isDeletable(payment: Payment): boolean {
    return isPaymentDeletable(payment.status);
  }

  changeStatus(payment: Payment, newStatus: PaymentStatus): void {
    if (newStatus === 'COMPLETED') {
      const ref = this.dialog.open(PromptDialogComponent, {
        data: {
          title: 'Confirm payment',
          label: 'Transaction reference (optional)',
          optional: true,
        },
        width: '360px',
      });
      ref.afterClosed().subscribe((transactionReference: string | null) => {
        this.applyStatusChange(payment, newStatus, transactionReference ?? undefined);
      });
      return;
    }

    this.applyStatusChange(payment, newStatus);
  }

  private applyStatusChange(
    payment: Payment,
    newStatus: PaymentStatus,
    transactionReference?: string,
  ): void {
    this.paymentService.updateStatus(payment.id!, newStatus, transactionReference).subscribe({
      next: () => {
        this.snackbar.success('Payment status updated.');
        this.loadPayments();
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.snackbar.error(apiError?.message ?? 'Failed to update payment status.');
      },
    });
  }

  deletePayment(payment: Payment): void {
    this.confirmDialog
      .confirm({ title: 'Delete payment', message: `Delete payment #${payment.id}?` })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.paymentService.delete(payment.id!).subscribe({
          next: () => {
            this.snackbar.success('Payment deleted.');
            this.loadPayments();
          },
          error: (err: HttpErrorResponse) => {
            const apiError = err.error as ApiError | undefined;
            this.snackbar.error(apiError?.message ?? 'Failed to delete payment.');
          },
        });
      });
  }
}
