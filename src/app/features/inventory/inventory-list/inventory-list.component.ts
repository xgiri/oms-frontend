import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { InventoryService } from '../inventory.service';
import { Inventory } from '../inventory.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    TableSkeletonComponent,
  ],
  templateUrl: './inventory-list.html',
  styleUrl: './inventory-list.scss',
})
export class InventoryListComponent implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = [
    'productName',
    'location',
    'quantityAvailable',
    'quantityReserved',
    'reorderLevel',
    'actions',
  ];
  readonly records = signal<Inventory[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);

  readonly filterForm = this.fb.group({
    location: [''],
    lowStockOnly: [false],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadInventory();
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadInventory();
    });
  }

  isFiltering(): boolean {
    const { location, lowStockOnly } = this.filterForm.value;
    return !!location || !!lowStockOnly;
  }

  isLowStock(record: Inventory): boolean {
    return record.quantityAvailable <= record.reorderLevel;
  }

  loadInventory(): void {
    this.loading.set(true);

    const request$ = this.isFiltering()
      ? this.inventoryService.search(
          {
            location: this.filterForm.value.location || undefined,
            lowStockOnly: !!this.filterForm.value.lowStockOnly,
          },
          this.pageIndex(),
          this.pageSize(),
        )
      : this.inventoryService.getAll(this.pageIndex(), this.pageSize());

    request$.subscribe({
      next: (page) => {
        this.records.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load inventory.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadInventory();
  }

  editRecord(record: Inventory): void {
    this.router.navigate(['/inventory', record.id, 'edit']);
  }

  deleteRecord(record: Inventory): void {
    this.confirmDialog
      .confirm({
        title: 'Delete inventory record',
        message: `Delete stock record for "${record.productName}" at ${record.location}?`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.inventoryService.delete(record.id!).subscribe({
          next: () => {
            this.snackbar.success('Inventory record deleted.');
            this.loadInventory();
          },
          error: () => this.snackbar.error('Failed to delete inventory record.'),
        });
      });
  }
}
