import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { Subject, takeUntil, finalize, switchMap, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProdutoService } from '../../../services/produto.service';
import { NotaFiscalService } from '../../../services/nota-fiscal.service';
import { Produto } from '../../../models/produto.model';

@Component({
  selector: 'app-form-nota',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule, MatTableModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <div><h1>Nova Nota Fiscal</h1><p class="subtitle">Adicione produtos e quantidades à nota</p></div>
      <button mat-stroked-button routerLink="/notas-fiscais"><mat-icon>arrow_back</mat-icon> Voltar</button>
    </div>
    <div class="spinner-container" *ngIf="carregandoProdutos"><mat-spinner diameter="40"/><p>Carregando produtos...</p></div>
    <mat-card *ngIf="!carregandoProdutos && produtos.length === 0" class="empty-card">
      <mat-card-content>
        <mat-icon class="empty-icon">inventory_2</mat-icon>
        <h3>Nenhum produto disponível</h3><p>Cadastre produtos com saldo antes de criar uma nota.</p>
        <button mat-raised-button color="primary" routerLink="/produtos"><mat-icon>add</mat-icon> Cadastrar Produto</button>
      </mat-card-content>
    </mat-card>
    <form [formGroup]="form" *ngIf="!carregandoProdutos && produtos.length > 0">
      <mat-card>
        <mat-card-header>
          <mat-card-title><mat-icon>receipt</mat-icon> Itens da Nota</mat-card-title>
          <mat-card-subtitle>A numeração será gerada automaticamente</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div formArrayName="itens">
            <div *ngFor="let item of itensArray.controls; let i = index" [formGroupName]="i" class="item-row">
              <mat-form-field appearance="outline" class="field-produto">
                <mat-label>Produto</mat-label>
                <mat-select formControlName="produtoId" (selectionChange)="onProdutoSelecionado(i)">
                  <mat-option *ngFor="let p of produtos" [value]="p.id" [disabled]="isProdutoJaSelecionado(p.id, i)">
                    <strong>{{ p.codigo }}</strong> — {{ p.descricao }} <span class="saldo-option" [class.saldo-zero]="p.saldo===0">(saldo: {{ p.saldo }})</span>
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="item.get('produtoId')?.hasError('required')">Selecione um produto</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="field-qtd">
                <mat-label>Quantidade</mat-label>
                <input matInput type="number" formControlName="quantidade" min="1" (input)="validarQuantidade(i)" />
                <mat-hint *ngIf="item.get('produtoId')?.value">Máx: {{ getSaldoProduto(item.get('produtoId')?.value) }}</mat-hint>
                <mat-error *ngIf="item.get('quantidade')?.hasError('min')">Mínimo: 1</mat-error>
                <mat-error *ngIf="item.get('quantidade')?.hasError('max')">Excede o saldo</mat-error>
              </mat-form-field>
              <div class="saldo-info" *ngIf="item.get('produtoId')?.value">
                <mat-icon [class.icon-ok]="getSaldoProduto(item.get('produtoId')?.value) > 0" [class.icon-warn]="getSaldoProduto(item.get('produtoId')?.value) === 0">
                  {{ getSaldoProduto(item.get('produtoId')?.value) > 0 ? 'check_circle' : 'warning' }}
                </mat-icon>
                <span>{{ getSaldoProduto(item.get('produtoId')?.value) }} em estoque</span>
              </div>
              <button mat-icon-button color="warn" type="button" matTooltip="Remover" [disabled]="itensArray.length===1" (click)="removerItem(i)">
                <mat-icon>remove_circle_outline</mat-icon>
              </button>
            </div>
          </div>
          <div class="form-error" *ngIf="form.hasError('produtosDuplicados')"><mat-icon>error</mat-icon> Produtos duplicados na nota.</div>
          <mat-divider style="margin:16px 0"/>
          <button mat-stroked-button color="primary" type="button" (click)="adicionarItem()" [disabled]="itensArray.length >= produtos.length">
            <mat-icon>add</mat-icon> Adicionar Produto
          </button>
        </mat-card-content>
        <mat-card-content *ngIf="itensPreenchidos.length > 0" class="resumo">
          <mat-divider style="margin-bottom:16px"/><h3>Resumo</h3>
          <table mat-table [dataSource]="itensPreenchidos" class="full-width resumo-table">
            <ng-container matColumnDef="codigo"><th mat-header-cell *matHeaderCellDef>Código</th><td mat-cell *matCellDef="let r">{{ r.codigo }}</td></ng-container>
            <ng-container matColumnDef="descricao"><th mat-header-cell *matHeaderCellDef>Produto</th><td mat-cell *matCellDef="let r">{{ r.descricao }}</td></ng-container>
            <ng-container matColumnDef="quantidade"><th mat-header-cell *matHeaderCellDef>Qtd</th><td mat-cell *matCellDef="let r"><strong>{{ r.quantidade }}</strong></td></ng-container>
            <ng-container matColumnDef="saldoRestante">
              <th mat-header-cell *matHeaderCellDef>Saldo após</th>
              <td mat-cell *matCellDef="let r" [class.saldo-baixo]="r.saldoRestante <= 5" [class.saldo-zerado]="r.saldoRestante === 0">{{ r.saldoRestante }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['codigo','descricao','quantidade','saldoRestante']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['codigo','descricao','quantidade','saldoRestante'];"></tr>
          </table>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-button type="button" routerLink="/notas-fiscais" [disabled]="salvando">Cancelar</button>
          <button mat-raised-button color="primary" type="button" (click)="salvar()" [disabled]="form.invalid || salvando">
            <mat-spinner *ngIf="salvando" diameter="20" style="display:inline-block"/>
            <ng-container *ngIf="!salvando"><mat-icon>save</mat-icon> Criar Nota Fiscal</ng-container>
          </button>
        </mat-card-actions>
      </mat-card>
    </form>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    h1 { margin:0; font-size:1.8rem; } .subtitle { margin:4px 0 0; color:#666; }
    .spinner-container { display:flex; flex-direction:column; align-items:center; padding:48px; gap:16px; color:#666; }
    .empty-card mat-card-content { display:flex; flex-direction:column; align-items:center; padding:48px; gap:12px; text-align:center; }
    .empty-icon { font-size:56px; width:56px; height:56px; color:#ccc; }
    .item-row { display:flex; gap:12px; align-items:center; margin-bottom:8px; padding:8px; border-radius:8px; background:#fafafa; border:1px solid #eee; }
    .field-produto { flex:3; } .field-qtd { flex:1; min-width:120px; }
    .saldo-info { display:flex; align-items:center; gap:4px; font-size:.85rem; color:#555; white-space:nowrap; }
    .icon-ok { color:#22c55e; } .icon-warn { color:#f59e0b; }
    .saldo-option { color:#888; font-size:.85em; } .saldo-zero { color:#ef4444; font-weight:600; }
    .form-error { display:flex; align-items:center; gap:8px; color:#ef4444; margin:8px 0; font-size:.9rem; }
    .resumo h3 { margin-top:0; } .full-width { width:100%; } .resumo-table { margin-bottom:16px; }
    .saldo-baixo { color:#f59e0b; font-weight:600; } .saldo-zerado { color:#ef4444; font-weight:700; }
    mat-card-header { margin-bottom:16px; } mat-card-actions { padding:16px; }
    mat-card-header mat-card-title { display:flex; align-items:center; gap:8px; }
  `]
})
export class FormNotaComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  produtos: Produto[] = [];
  carregandoProdutos = false;
  salvando = false;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private produtoService: ProdutoService, private notaService: NotaFiscalService, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void { this.inicializarFormulario(); this.carregarProdutos(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private inicializarFormulario(): void {
    this.form = this.fb.group({ itens: this.fb.array([this.criarItemGroup()]) }, { validators: this.validarProdutosDuplicados });
  }
  private criarItemGroup(): FormGroup {
    return this.fb.group({ produtoId: [null, Validators.required], quantidade: [1, [Validators.required, Validators.min(1)]] });
  }
  private carregarProdutos(): void {
    this.carregandoProdutos = true;
    this.produtoService.carregarProdutos().pipe(switchMap(p => of(p)), finalize(() => this.carregandoProdutos = false), takeUntil(this.destroy$))
      .subscribe({ next: p => { this.produtos = p.filter(x => x.saldo > 0); } });
  }

  get itensArray(): FormArray { return this.form.get('itens') as FormArray; }
  get itensPreenchidos() {
    return this.itensArray.controls
      .filter(c => c.get('produtoId')?.value && c.get('quantidade')?.value > 0)
      .map(c => {
        const p = this.produtos.find(x => x.id === c.get('produtoId')!.value);
        return { codigo: p?.codigo ?? '', descricao: p?.descricao ?? '', quantidade: c.get('quantidade')!.value, saldoRestante: (p?.saldo ?? 0) - c.get('quantidade')!.value };
      });
  }

  getSaldoProduto(id: number | null): number { return id ? (this.produtos.find(p => p.id === id)?.saldo ?? 0) : 0; }
  isProdutoJaSelecionado(id: number, idx: number): boolean { return this.itensArray.controls.some((c, i) => i !== idx && c.get('produtoId')?.value === id); }
  adicionarItem(): void { this.itensArray.push(this.criarItemGroup()); }
  removerItem(i: number): void { if (this.itensArray.length > 1) this.itensArray.removeAt(i); }

  onProdutoSelecionado(i: number): void {
    const item = this.itensArray.at(i);
    const saldo = this.getSaldoProduto(item.get('produtoId')?.value);
    item.get('quantidade')?.setValidators([Validators.required, Validators.min(1), Validators.max(saldo)]);
    item.get('quantidade')?.updateValueAndValidity();
  }
  validarQuantidade(i: number): void { this.onProdutoSelecionado(i); }

  private validarProdutosDuplicados(group: AbstractControl) {
    const ids = (group.get('itens') as FormArray).controls.map(c => c.get('produtoId')?.value).filter(Boolean);
    return ids.length !== new Set(ids).size ? { produtosDuplicados: true } : null;
  }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    const itens = this.itensArray.controls.filter(c => c.get('produtoId')?.value)
      .map(c => ({ produtoId: c.get('produtoId')!.value as number, quantidade: c.get('quantidade')!.value as number }));
    this.notaService.criar({ itens }).pipe(finalize(() => this.salvando = false), takeUntil(this.destroy$)).subscribe({
      next: n => {
        this.snackBar.open(`Nota Fiscal #${n.numero} criada!`, 'OK', { duration: 4000, panelClass: ['snack-success'] });
        this.router.navigate(['/notas-fiscais']);
      },
      error: () => {}
    });
  }
}
