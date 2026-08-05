import { TestBed } from '@angular/core/testing';

import { GlobalErrorHandler } from './global-error-handler.service';
import { SnackbarService } from '../shared/services/snackbar.service';

describe('GlobalErrorHandler', () => {
  let service: GlobalErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: SnackbarService, useValue: { error: vi.fn(), success: vi.fn() } },
      ],
    });
    service = TestBed.inject(GlobalErrorHandler);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
