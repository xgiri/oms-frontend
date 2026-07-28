import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
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
import { ShipmentService } from '../shipment.service';
import {
  ALLOWED_SHIPMENT_TRANSITIONS,
  isShipmentDeletable,
  Shipment,
  ShipmentStatus,
} from '../shipment.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { PromptDialogComponent } from '../../../shared/components/prompt-dialog/prompt-dialog.component';
import { ApiError } from '../../../shared/models/api-error.model';
import { DatePipe } from '@angular/common';
import { getAllowedTransitions } from '../../../shared/models/status-workflow.model';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-shipments-list',
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
    TableSkeletonComponent,
  ],
  templateUrl: './shipments-list.html',
  styleUrl: './shipments-list.scss',
})
export class ShipmentsListComponent implements OnInit {
  private readonly shipmentService = inject(ShipmentService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = [
    'orderId',
    'carrier',
    'status',
    'trackingNumber',
    'shippedAt',
    'deliveredAt',
    'actions',
  ];
  readonly shipments = signal<Shipment[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly statuses: ShipmentStatus[] = [
    'PENDING',
    'SHIPPED',
    'IN_TRANSIT',
    'DELIVERED',
    'RETURNED',
  ];

  readonly filterForm = this.fb.group({
    orderId: [null as number | null],
    status: [null as ShipmentStatus | null],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadShipments();
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadShipments();
    });
  }

  isFiltering(): boolean {
    const { orderId, status } = this.filterForm.value;
    return orderId != null || !!status;
  }

  loadShipments(): void {
    this.loading.set(true);

    const request$ = this.isFiltering()
      ? this.shipmentService.search(
          {
            orderId: this.filterForm.value.orderId ?? undefined,
            status: this.filterForm.value.status ?? undefined,
          },
          this.pageIndex(),
          this.pageSize(),
        )
      : this.shipmentService.getAll(this.pageIndex(), this.pageSize());

    request$.subscribe({
      next: (page) => {
        this.shipments.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load shipments.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadShipments();
  }

  availableTransitions(shipment: Shipment): ShipmentStatus[] {
    return getAllowedTransitions(ALLOWED_SHIPMENT_TRANSITIONS, shipment.status);
  }

  isDeletable(shipment: Shipment): boolean {
    return isShipmentDeletable(shipment.status);
  }

  changeStatus(shipment: Shipment, newStatus: ShipmentStatus): void {
    if (newStatus === 'SHIPPED') {
      const ref = this.dialog.open(PromptDialogComponent, {
        data: { title: 'Mark as shipped', label: 'Tracking number (optional)', optional: true },
        width: '360px',
      });
      ref.afterClosed().subscribe((trackingNumber: string | null) => {
        this.applyStatusChange(shipment, newStatus, trackingNumber ?? undefined);
      });
      return;
    }

    this.applyStatusChange(shipment, newStatus);
  }

  private applyStatusChange(
    shipment: Shipment,
    newStatus: ShipmentStatus,
    trackingNumber?: string,
  ): void {
    this.shipmentService.updateStatus(shipment.id!, newStatus, trackingNumber).subscribe({
      next: () => {
        this.snackbar.success('Shipment status updated.');
        this.loadShipments();
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.snackbar.error(apiError?.message ?? 'Failed to update shipment status.');
      },
    });
  }

  deleteShipment(shipment: Shipment): void {
    this.confirmDialog
      .confirm({ title: 'Delete shipment', message: `Delete shipment #${shipment.id}?` })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.shipmentService.delete(shipment.id!).subscribe({
          next: () => {
            this.snackbar.success('Shipment deleted.');
            this.loadShipments();
          },
          error: (err: HttpErrorResponse) => {
            const apiError = err.error as ApiError | undefined;
            this.snackbar.error(apiError?.message ?? 'Failed to delete shipment.');
          },
        });
      });
  }
}
