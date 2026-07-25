import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OrderService } from '../order.service';
import { CustomerService } from '../../customers/customer.service';
import { Customer } from '../../customers/customer.model';
import { ProductService } from '../../products/product.service';
import { Product } from '../../products/product.model';
import { ApiError } from '../../../shared/models/api-error.model';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { CurrencyPipe } from '@angular/common';
import { OrderRequest } from '../order.model';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    MatAutocompleteModule,
  ],
  templateUrl: './order-form.html',
  styleUrl: './order-form.scss',
})
export class OrderFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly customers = signal<Customer[]>([]);
  readonly products = signal<Product[]>([]);

  private readonly matchesRealCustomer: ValidatorFn = (control) => {
    const value = (control.value ?? '').trim();
    if (!value) return null; // let Validators.required own the "empty" case
    const isValid = this.customers().some((c) => `${c.firstName} ${c.lastName}` === value);
    return isValid ? null : { invalidSelection: true };
  };

  readonly form = this.fb.group({
    customerId: this.fb.control<number | null>(null, Validators.required),
    customerSearch: this.fb.nonNullable.control('', [
      Validators.required,
      this.matchesRealCustomer,
    ]),
    items: this.fb.array([this.createItemGroup()]),
  });

  constructor() {
    this.form.controls.customerSearch.valueChanges.subscribe((text) => {
      const selectedId = this.form.controls.customerId.value;
      const selected = this.customers().find((c) => c.id === selectedId);
      const expectedText = selected ? `${selected.firstName} ${selected.lastName}` : '';
      if (text !== expectedText) {
        this.form.controls.customerId.setValue(null, { emitEvent: false });
      }
    });
  }

  get items(): FormArray {
    return this.form.controls.items as FormArray;
  }

  private createItemGroup() {
    return this.fb.group({
      productId: this.fb.control<number | null>(null, Validators.required),
      quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    });
  }

  private selectedProductIds(excludingIndex: number): number[] {
    return this.items.controls
      .filter((_, i) => i !== excludingIndex)
      .map((group) => group.value.productId)
      .filter((id): id is number => id !== null);
  }

  availableProducts(index: number): Product[] {
    const usedElsewhere = this.selectedProductIds(index);
    return this.products().filter((p) => !usedElsewhere.includes(p.id));
  }

  filteredCustomers(): Customer[] {
    const query = (this.form.controls.customerSearch.value ?? '').toLowerCase();
    return this.customers().filter(
      (c) => c.firstName.toLowerCase().includes(query) || c.lastName.toLowerCase().includes(query),
    );
  }

  private selectedProductCount(): number {
    const selected = this.items.controls
      .map((g) => g.value.productId)
      .filter((id): id is number => id !== null);
    return new Set(selected).size;
  }

  get canAddItem(): boolean {
    return this.items.length < this.products().length;
  }

  get allProductsSelected(): boolean {
    return this.selectedProductCount() === this.products().length && this.products().length > 0;
  }

  onCustomerSelected(customer: Customer): void {
    this.form.controls.customerId.setValue(customer.id);
    this.form.controls.customerSearch.setValue(`${customer.firstName} ${customer.lastName}`);
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  productPrice(productId: number | null): number {
    return productId == null ? 0 : (this.products().find((p) => p.id === productId)?.price ?? 0);
  }

  lineSubtotal(index: number): number {
    const item = this.items.at(index).value;
    return this.productPrice(item.productId) * item.quantity;
  }

  get estimatedTotal(): number {
    return this.items.controls.reduce((sum, _, i) => sum + this.lineSubtotal(i), 0);
  }

  ngOnInit(): void {
    this.customerService.getAllForPicker().subscribe((customers) => this.customers.set(customers));
    this.productService.getAllForPicker().subscribe((products) => this.products.set(products));
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const raw = this.form.getRawValue();

    const request: OrderRequest = {
      customerId: raw.customerId!,
      items: raw.items.map((item) => ({ productId: item.productId!, quantity: item.quantity })),
    };

    this.orderService.create(request).subscribe({
      next: (order) => {
        this.snackbar.success('Order placed.');
        this.router.navigate(['/orders', order.id]);
      },
      error: (err: HttpErrorResponse) => {
        const apiError = err.error as ApiError | undefined;
        this.errorMessage.set(apiError?.message ?? 'Something went wrong. Please try again.');
        this.saving.set(false);
      },
    });
  }
}
