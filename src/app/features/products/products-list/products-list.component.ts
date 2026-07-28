import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime } from 'rxjs';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ProductService } from '../product.service';
import { Product } from '../product.model';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    CurrencyPipe,
    DatePipe,
  ],
  templateUrl: './products-list.html',
  styleUrl: './products-list.scss',
})
export class ProductsListComponent implements OnInit {
  private readonly productsService = inject(ProductService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['name', 'description', 'price', 'updatedAt', 'actions'];
  readonly products = signal<Product[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);

  readonly filterForm = this.fb.group({
    name: [''],
    minPrice: [null as number | null],
    maxPrice: [null as number | null],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  private sortBy = 'id';
  private sortDir: 'asc' | 'desc' = 'asc';

  ngOnInit(): void {
    this.loadProducts();

    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadProducts();
    });
  }

  isFiltering(): boolean {
    const { name, minPrice, maxPrice } = this.filterForm.value;
    return !!name || minPrice != null || maxPrice != null;
  }

  loadProducts(): void {
    this.loading.set(true);

    const request$ = this.isFiltering()
      ? this.productsService.search(
          {
            name: this.filterForm.value.name || undefined,
            minPrice: this.filterForm.value.minPrice ?? undefined,
            maxPrice: this.filterForm.value.maxPrice ?? undefined,
          },
          this.pageIndex(),
          this.pageSize(),
        )
      : this.productsService.getAll(this.pageIndex(), this.pageSize(), this.sortBy, this.sortDir);

    request$.subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load products.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadProducts();
  }

  onSortChange(sort: Sort): void {
    if (this.isFiltering()) return; // sorting only applies to the plain list endpoint
    this.sortBy = sort.direction ? sort.active : 'id';
    this.sortDir = sort.direction === 'desc' ? 'desc' : 'asc';
    this.loadProducts();
  }

  editProduct(product: Product): void {
    this.router.navigate(['/products', product.id, 'edit']);
  }

  deleteProduct(product: Product): void {
    this.confirmDialog
      .confirm({
        title: 'Delete product',
        message: `Delete "${product.name}"? This cannot be undone.`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.productsService.delete(product.id).subscribe({
          next: () => {
            this.snackbar.success('Product deleted.');
            this.loadProducts();
          },
          error: () => this.snackbar.error('Failed to delete product.'),
        });
      });
  }
}
