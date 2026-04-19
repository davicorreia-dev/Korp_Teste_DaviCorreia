import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { NotaFiscalService } from '../../../services/nota-fiscal.service';
import { NotaFiscal } from '../../../models/nota-fiscal.model';
import { DetalheNotaComponent } from '../detalhe-nota/detalhe-nota.component';

@Component({
  selector: 'app-lista-notas',
  standalone: true,
  imports: [CommonModule, RouterLink, MatTableModule, MatSortModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatCardModule, MatChipsModule, MatTooltipModule, MatBadgeModule, MatDialogModule],
  template: `
    <div class="page-header">
      <div><h1>Notas Fiscais</h1><p class="subtitle">Emissão e controle de notas fiscais</p></div>
      <button mat-raised-button color="primary" routerLink="/notas-fiscais/nova"><mat-icon>add</mat-icon> Nova Nota Fiscal</button>
    </div>
    <div class="spinner-container" *ngIf="carregando"><mat-spinner diameter="48"/><p>Carregando notas...</p></div>
    <mat-card *ngIf="!carregando">
      <mat-card-content>
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="numero">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nº</th>
            <td mat-cell *matCellDef="let n"><strong>#{{ n.numero }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let n">
              <mat-chip [class.chip-aberta]="n.status==='Aberta'" [class.chip-fechada]="n.status==='Fechada'">
                <mat-icon matChipAvatar>{{ n.status === 'Aberta' ? 'lock_open' : 'lock' }}</mat-icon>{{ n.status }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="itens">
            <th mat-header-cell *matHeaderCellDef>Itens</th>
            <td mat-cell *matCellDef="let n"><span [matBadge]="n.itens.length" matBadgeColor="accent" matBadgeSize="small">&nbsp;&nbsp;&nbsp;produtos</span></td>
          </ng-container>
          <ng-container matColumnDef="criadoEm">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Criado em</th>
            <td mat-cell *matCellDef="let n">{{ n.criadoEm | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="fechadoEm">
            <th mat-header-cell *matHeaderCellDef>Fechado em</th>
            <td mat-cell *matCellDef="let n">{{ n.fechadoEm ? (n.fechadoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let n">
              <button mat-icon-button color="primary" matTooltip="Ver detalhes" (click)="verDetalhes(n)"><mat-icon>visibility</mat-icon></button>
              <button mat-icon-button color="accent"
                      [matTooltip]="n.status === 'Aberta' ? 'Imprimir nota' : 'Nota já fechada'"
                      [disabled]="n.status !== 'Aberta' || imprimindoId === n.id"
                      (click)="imprimir(n)">
                <mat-spinner *ngIf="imprimindoId === n.id" diameter="20"/>
                <mat-icon *ngIf="imprimindoId !== n.id">print</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;" [class.row-fechada]="row.status === 'Fechada'"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell empty-state" colspan="6"><mat-icon>description</mat-icon><p>Nenhuma nota fiscal. Clique em "Nova Nota Fiscal".</p></td>
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
    .full-width { width:100%; } .chip-aberta { background-color:#d1fae5 !important; color:#065f46 !important; }
    .chip-fechada { background-color:#f3f4f6 !important; color:#6b7280 !important; } .row-fechada { opacity:0.7; }
    .empty-state { text-align:center; padding:48px !important; color:#999; }
    .empty-state mat-icon { font-size:48px; width:48px; height:48px; }
  `]
})
export class ListaNotasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatSort)      sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource   = new MatTableDataSource<NotaFiscal>([]);
  colunas      = ['numero', 'status', 'itens', 'criadoEm', 'fechadoEm', 'acoes'];
  carregando   = false;
  imprimindoId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(private notaService: NotaFiscalService, private snackBar: MatSnackBar, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.carregarNotas();
    this.notaService.notas$.pipe(takeUntil(this.destroy$)).subscribe(n => this.dataSource.data = n);
  }
  ngAfterViewInit(): void { this.dataSource.sort = this.sort; this.dataSource.paginator = this.paginator; }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  carregarNotas(): void {
    this.carregando = true;
    this.notaService.carregarNotas().pipe(finalize(() => this.carregando = false), takeUntil(this.destroy$)).subscribe();
  }

  verDetalhes(nota: NotaFiscal): void { this.dialog.open(DetalheNotaComponent, { width: '640px', data: nota }); }

  imprimir(nota: NotaFiscal): void {
    if (nota.status !== 'Aberta') return;
    this.imprimindoId = nota.id;
    this.notaService.imprimir(nota.id).pipe(finalize(() => this.imprimindoId = null), takeUntil(this.destroy$)).subscribe({
      next: n => {
        this.snackBar.open(`Nota Fiscal #${n.numero} impressa e fechada!`, 'OK', { duration: 4000, panelClass: ['snack-success'] });
        setTimeout(() => window.print(), 500);
      },
      error: () => {}
    });
  }
}
