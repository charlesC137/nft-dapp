import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { ContractService } from '../services/contract.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const contractSrv = inject(ContractService);

  const walletAddress = contractSrv.getWalletAddress();

  if (!walletAddress) {
    throw new Error('Wallet Address Not Found For Interceptor');
  }

  let modifiedReq = req;

  modifiedReq = req.clone({
    setHeaders: {
      'x-wallet-address': walletAddress,
    },
    withCredentials: true,
  });

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (authService.isRefreshing) {
        return throwError(() => error);
      }

      authService.isRefreshing = true;

      return authService.refreshAccessToken().pipe(
        switchMap(() => {
          authService.isRefreshing = false;

          return next(modifiedReq);
        }),
        catchError((refreshError) => {
          authService.isRefreshing = false;
          authService.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
