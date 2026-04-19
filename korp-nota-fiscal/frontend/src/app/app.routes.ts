import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'produtos', pathMatch: 'full' },
  { path: 'produtos', loadComponent: () => import('./components/produtos/lista-produtos/lista-produtos.component').then(m => m.ListaProdutosComponent), title: 'Produtos - Korp' },
  { path: 'notas-fiscais', loadComponent: () => import('./components/notas-fiscais/lista-notas/lista-notas.component').then(m => m.ListaNotasComponent), title: 'Notas Fiscais - Korp' },
  { path: 'notas-fiscais/nova', loadComponent: () => import('./components/notas-fiscais/form-nota/form-nota.component').then(m => m.FormNotaComponent), title: 'Nova Nota Fiscal - Korp' },
  { path: '**', redirectTo: 'produtos' }
];
