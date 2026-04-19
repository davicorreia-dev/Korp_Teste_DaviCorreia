import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { NotaFiscal } from '../../../models/nota-fiscal.model';

@Component({
  selector: 'app-detalhe-nota',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatTableModule, MatChipsModule, MatIconModule, MatDividerModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>description</mat-icon> Nota Fiscal #{{ nota.numero }}
      <mat-chip [class.chip-aberta]="nota.status==='Aberta'" [class.chip-fechada]="nota.status==='Fechada'" style="margin-left:12px">{{ nota.status }}</mat-chip>
    </h2>
    <mat-dialog-content>
      <div class="info-row"><span class="label">Criado em:</span><span>{{ nota.criadoEm | date:'dd/MM/yyyy HH:mm:ss' }}</span></div>
      <div class="info-row" *ngIf="nota.fechadoEm"><span class="label">Fechado em:</span><span>{{ nota.fechadoEm | date:'dd/MM/yyyy HH:mm:ss' }}</span></div>
      <mat-divider style="margin:16px 0"/>
      <h3>Itens da Nota</h3>
      <table mat-table [dataSource]="nota.itens" class="full-width">
        <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let i">{{ i.produtoCodigo }}</td></ng-container>
        <ng-container matColumnDef="descricao"><th mat-header-cell *matHeaderCellDef>Descrição</th><td mat-cell *matCellDef="let i">{{ i.produtoDescricao }}</td></ng-container>
        <ng-container matColumnDef="quantidade"><th mat-header-cell *matHeaderCellDef>Qtd</th><td mat-cell *matCellDef="let i"><strong>{{ i.quantidade }}</strong></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="['codigo','descricao','quantidade']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['codigo','descricao','quantidade'];"></tr>
      </table>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button mat-dialog-close>Fechar</button></mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] { display:flex; align-items:center; gap:8px; }
    .info-row { display:flex; gap:12px; margin-bottom:8px; } .label { font-weight:600; color:#555; min-width:100px; }
    .full-width { width:100%; } .chip-aberta { background-color:#d1fae5 !important; color:#065f46 !important; }
    .chip-fechada { background-color:#f3f4f6 !important; color:#6b7280 !important; }
  `]
})
export class DetalheNotaComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public nota: NotaFiscal) {}
}
