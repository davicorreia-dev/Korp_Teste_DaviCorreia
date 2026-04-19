import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';
import { FormProdutoComponent } from '../form-produto/form-produto.component';

@Component({
  selector: 'app-lista-produtos',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <div><h1>Produtos</h1><p class="subtitle">Gerencie o cadastro e estoque de produtos</p></div>
      <button mat-raised-button color="primary" (click)="abrirFormulario()"><mat-icon>add</mat-icon> Novo Produto</button>
    </div>
    <div class="spinner-container" *ngIf="carregando"><mat-spinner diameter="48"/><p>Carregando produtos...</p></div>
    <mat-card *ngIf="!carregando">
      <mat-card-content>
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="codigo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Código</th>
            <td mat-cell *matCellDef="let p"><mat-chip>{{ p.codigo }}</mat-chip></td>
          </ng-container>
          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Descrição</th>
            <td mat-cell *matCellDef="let p">{{ p.descricao }}</td>
          </ng-container>
          <ng-container matColumnDef="saldo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Saldo</th>
            <td mat-cell *matCellDef="let p">
              <span [class.saldo-baixo]="p.saldo <= 5" [class.saldo-zerado]="p.saldo === 0">{{ p.saldo }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" matTooltip="Editar" (click)="abrirFormulario(p)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn"    matTooltip="Excluir" (click)="deletar(p)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-state" colspan="4">
              <mat-icon>inventory_2</mat-icon>
              <p>Nenhum produto cadastrado. Clique em "Novo Produto" para começar.</p>
            </td>
          </tr>
        </table>
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    h1 { margin:0; font-size:1.8rem; } .subtitle { margin:4px 0 0; color:#666; }
    .spinner-container { display:flex; flex-direction:column; align-items:center; padding:48px; gap:16px; color:#666; }
    .full-width { width:100%; } .saldo-baixo { color:#f59e0b; font-weight:600; } .saldo-zerado { color:#ef4444; font-weight:700; }
    .empty-state { text-align:center; padding:48px !important; color:#999; }
    .empty-state mat-icon { font-size:48px; width:48px; height:48px; }
  `]
})
export class ListaProdutosComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort)      sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<Produto>([]);
  colunas    = ['codigo', 'descricao', 'saldo', 'acoes'];
  carregando = false;
  private destroy$ = new Subject<void>();

  constructor(private produtoService: ProdutoService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.carregarProdutos();
    this.produtoService.produtos$.pipe(takeUntil(this.destroy$)).subscribe(p => this.dataSource.data = p);
  }
  ngAfterViewInit(): void { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  carregarProdutos(): void {
    this.carregando = true;
    this.produtoService.carregarProdutos().pipe(finalize(() => this.carregando = false), takeUntil(this.destroy$)).subscribe();
  }

  abrirFormulario(produto?: Produto): void {
    const ref = this.dialog.open(FormProdutoComponent, { width: '480px', data: produto ?? null, disableClose: true });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(r => {
      if (r) this.snackBar.open(`Produto ${produto ? 'atualizado' : 'criado'} com sucesso!`, 'OK', { duration: 3000, panelClass: ['snack-success'] });
    });
  }

  deletar(produto: Produto): void {
    if (!confirm(`Deseja excluir "${produto.descricao}"?`)) return;
    this.produtoService.deletar(produto.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.snackBar.open('Produto excluído.', 'OK', { duration: 3000 }),
      error: () => {}
    });
  }
}
