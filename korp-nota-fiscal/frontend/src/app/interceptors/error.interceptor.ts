import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let msg = 'Ocorreu um erro inesperado.';
      if      (error.status === 0)   msg = 'Não foi possível conectar ao servidor. Verifique se os serviços estão rodando.';
      else if (error.status === 400) msg = error.error?.error ?? 'Dados inválidos.';
      else if (error.status === 404) msg = error.error?.error ?? 'Recurso não encontrado.';
      else if (error.status === 503) msg = error.error?.error ?? 'Serviço de Estoque temporariamente indisponível.';
      else if (error.status >= 500)  msg = 'Erro interno no servidor.';
      snackBar.open(msg, 'Fechar', { duration: 6000, panelClass: ['snack-error'], horizontalPosition: 'end', verticalPosition: 'top' });
      return throwError(() => error);
    })
  );
};
