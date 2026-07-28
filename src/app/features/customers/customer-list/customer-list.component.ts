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
import { CustomerService } from '../customer.service';
import { Customer, CustomerStatus } from '../customer.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { TableSkeletonComponent } from '../../../shared/components/table-skeleton/table-skeleton.component';

@Component({
  selector: 'app-customers-list',
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
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    HasRoleDirective,
    TableSkeletonComponent,
  ],
  templateUrl: './customer-list.html',
  styleUrl: './customer-list.scss',
})
export class CustomersListComponent implements OnInit {
  private readonly customersService = inject(CustomerService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackbar = inject(SnackbarService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['name', 'email', 'phone', 'city', 'status', 'actions'];
  readonly customers = signal<Customer[]>([]);
  readonly totalElements = signal(0);
  readonly loading = signal(false);
  readonly statuses: CustomerStatus[] = ['ACTIVE', 'INACTIVE'];

  readonly filterForm = this.fb.group({
    name: [''],
    email: [''],
    status: [null as CustomerStatus | null],
  });

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.loadCustomers();
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.pageIndex.set(0);
      this.loadCustomers();
    });
  }

  isFiltering(): boolean {
    const { name, email, status } = this.filterForm.value;
    return !!name || !!email || !!status;
  }

  loadCustomers(): void {
    this.loading.set(true);

    const request$ = this.isFiltering()
      ? this.customersService.search(
          {
            name: this.filterForm.value.name || undefined,
            email: this.filterForm.value.email || undefined,
            status: this.filterForm.value.status ?? undefined,
          },
          this.pageIndex(),
          this.pageSize(),
        )
      : this.customersService.getAll(this.pageIndex(), this.pageSize());

    request$.subscribe({
      next: (page) => {
        this.customers.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Failed to load customers.');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCustomers();
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/customers', customer.id, 'edit']);
  }

  deleteCustomer(customer: Customer): void {
    this.confirmDialog
      .confirm({
        title: 'Delete customer',
        message: `Delete "${customer.firstName} ${customer.lastName}"?`,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;
        this.customersService.delete(customer.id!).subscribe({
          next: () => {
            this.snackbar.success('Customer deleted.');
            this.loadCustomers();
          },
          error: () => this.snackbar.error('Failed to delete customer.'),
        });
      });
  }
}
