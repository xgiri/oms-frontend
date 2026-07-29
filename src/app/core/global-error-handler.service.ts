import { ErrorHandler, Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { SnackbarService } from '../shared/services/snackbar.service';

//deliberately using @Injectable(), not @Service(), since this class is only ever meant to be
// resolved via the ErrorHandler injection token, not injected directly anywhere by its own type
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly snackbar = inject(SnackbarService);

  handleError(error: unknown): void {
    // HTTP failures already get a specific, meaningful message from
    // error.interceptor.ts. If one reaches here, it means some code
    // subscribed to an Observable without an error callback — log it so
    // it isn't silently lost, but don't show a second, generic toast on
    // top of whatever message (if any) already appeared.
    if (error instanceof HttpErrorResponse) {
      console.error('Unhandled HTTP error reached GlobalErrorHandler:', error);
      return;
    }

    console.error('Unhandled error:', error);

    try {
      this.snackbar.error('Something went wrong. Please try again.');
    } catch {
      // If the snackbar itself can't render (e.g. extremely early during
      // bootstrap, before MatSnackBar's overlay container exists), fail
      // silently rather than throwing again — an ErrorHandler that itself
      // throws can take the whole app down instead of degrading gracefully.
    }
  }
}
