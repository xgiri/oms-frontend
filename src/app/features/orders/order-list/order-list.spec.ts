import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { OrderListComponent } from './order-list.component';
import { OrderService } from '../order.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { SnackbarService } from '../../../shared/services/snackbar.service';

describe('OrderListComponent', () => {
  let component: OrderListComponent;
  let fixture: ComponentFixture<OrderListComponent>;

  beforeEach(async () => {
    const ordersService = {
      getAll: vi
        .fn()
        .mockReturnValue(
          of({ content: [], pageNo: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true }),
        ),
      search: vi
        .fn()
        .mockReturnValue(
          of({ content: [], pageNo: 0, pageSize: 10, totalElements: 0, totalPages: 0, last: true }),
        ),
    };
    const confirmDialog = { confirm: vi.fn().mockReturnValue(of(false)) };
    const snackbar = { success: vi.fn(), error: vi.fn() };
    const router = { navigate: vi.fn(), navigateByUrl: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OrderListComponent],
      providers: [
        { provide: OrderService, useValue: ordersService },
        { provide: ConfirmDialogService, useValue: confirmDialog },
        { provide: SnackbarService, useValue: snackbar },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
