import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { GlobalErrorHandler } from './core/global-error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Angular Material's components (dialogs, dropdowns, snackbars, tooltips) internally still rely on
    // the @angular/animations package to animate open/close — that's the whole reason we added
    // provideAnimationsAsync() in the first place. Ripping it out now can break Material component transitions
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    // Override a built-in Angular service — you're telling the DI system "whenever anything asks for
    // ErrorHandler (including Angular's own internals), give them this class instead of the framework's default.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
