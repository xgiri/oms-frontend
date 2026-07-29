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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { CurrencyPipe } from '@angular/common';
import { OrderService } from '../order.service';
import { CustomerService } from '../../customers/customer.service';
import { Customer } from '../../customers/customer.model';
import { ProductService } from '../../products/product.service';
import { Product } from '../../products/product.model';
import { ApiError } from '../../../shared/models/api-error.model';
import { SnackbarService } from '../../../shared/services/snackbar.service';
import { OrderRequest } from '../order.model';

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatAutocompleteModule,
    CurrencyPipe,
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

  // A control's value is one of three things at any moment:
  // - null (nothing typed/selected yet)
  // - a string (the user is typing, hasn't picked an option)
  // - a real object (a genuine selection was made)
  // Only the third case is actually valid — no separate id control to keep
  // in sync, since the object itself carries everything needed.
  private readonly requireRealCustomer: ValidatorFn = (control) => {
    const value = control.value;
    if (value === null || value === '') return { required: true };
    if (typeof value === 'string') return { invalidSelection: true };
    return null;
  };

  private readonly requireRealProduct: ValidatorFn = (control) => {
    const value = control.value;
    if (value === null || value === '') return { required: true };
    if (typeof value === 'string') return { invalidSelection: true };
    return null;
  };

  readonly form = this.fb.group({
    customer: this.fb.control<Customer | string | null>(null, this.requireRealCustomer),
    items: this.fb.array([this.createItemGroup()]),
  });

  get items(): FormArray {
    return this.form.controls.items as FormArray;
  }

  displayCustomer = (customer: Customer | string | null): string => {
    if (!customer) return '';
    if (typeof customer === 'string') return customer;
    return `${customer.firstName} ${customer.lastName}`;
  };

  displayProduct = (product: Product | string | null): string => {
    if (!product) return '';
    if (typeof product === 'string') return product;
    return product.name;
  };

  private createItemGroup() {
    return this.fb.group({
      product: this.fb.control<Product | string | null>(null, this.requireRealProduct),
      quantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    });
  }

  private selectedProductIdsElsewhere(excludingIndex: number): number[] {
    return this.items.controls
      .filter((_, i) => i !== excludingIndex)
      .map((group) => group.value.product)
      .filter((v): v is Product => v !== null && typeof v !== 'string')
      .map((p) => p.id);
  }

  availableProducts(index: number): Product[] {
    const usedElsewhere = this.selectedProductIdsElsewhere(index);
    const query = this.displayProduct(this.items.at(index).value.product).toLowerCase();
    return this.products()
      .filter((p) => !usedElsewhere.includes(p.id))
      .filter((p) => p.name.toLowerCase().includes(query));
  }

  filteredCustomers(): Customer[] {
    const query = this.displayCustomer(this.form.controls.customer.value).toLowerCase();
    return this.customers().filter((c) =>
      c.firstName.toLowerCase().concat(' ').concat(c.lastName.toLowerCase()).includes(query),
    );
  }

  private selectedProductCount(): number {
    const selected = this.items.controls
      .map((g) => g.value.product)
      .filter((v): v is Product => v !== null && typeof v !== 'string');
    return new Set(selected.map((p) => p.id)).size;
  }

  get canAddItem(): boolean {
    return this.items.length < this.products().length;
  }

  get allProductsSelected(): boolean {
    return this.selectedProductCount() === this.products().length && this.products().length > 0;
  }

  addItem(): void {
    this.items.push(this.createItemGroup());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.removeAt(index);
    }
  }

  private productPrice(index: number): number {
    const value = this.items.at(index).value.product;
    return value && typeof value !== 'string' ? value.price : 0;
  }

  lineSubtotal(index: number): number {
    const quantity = this.items.at(index).value.quantity ?? 0;
    return this.productPrice(index) * quantity;
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
    const customer = raw.customer as Customer; // validator guarantees this is a real Customer here

    const request: OrderRequest = {
      customerId: customer.id,
      items: raw.items.map((item) => ({
        productId: (item.product as Product).id, // validator guarantees a real Product here
        quantity: item.quantity,
      })),
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
