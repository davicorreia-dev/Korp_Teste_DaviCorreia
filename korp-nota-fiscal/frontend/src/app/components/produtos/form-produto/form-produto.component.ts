import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';
import { ProdutoService } from '../../../services/produto.service';
import { Produto } from '../../../models/produto.model';

@Component({
  selector: 'app-form-produto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <h2 mat-dialog-title><mat-icon>{{ produto ? 'edit' : 'add_circle' }}</mat-icon> {{ produto ? 'Editar Produto' : 'Novo Produto' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Código</mat-label>
          <input matInput formControlName="codigo" [readonly]="!!produto" placeholder="ex: PROD-001" />
          <mat-error *ngIf="form.get('codigo')?.hasError('required')">Obrigatório</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrição</mat-label>
          <input matInput formControlName="descricao" />
          <mat-error *ngIf="form.get('descricao')?.hasError('required')">Obrigatória</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Saldo</mat-label>
          <input matInput type="number" formControlName="saldo" min="0" />
          <mat-error *ngIf="form.get('saldo')?.hasError('min')">Não pode ser negativo</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancelar()" [disabled]="salvando">Cancelar</button>
      <button mat-raised-button color="primary" (click)="salvar()" [disabled]="form.invalid || salvando">
        <mat-spinner *ngIf="salvando" diameter="20" style="display:inline-block"/>
        <ng-container *ngIf="!salvando"><mat-icon>save</mat-icon> {{ produto ? 'Salvar' : 'Criar' }}</ng-container>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.form-grid { display:flex; flex-direction:column; gap:8px; padding-top:8px; min-width:400px; } .full-width { width:100%; } h2[mat-dialog-title] { display:flex; align-items:center; gap:8px; }`]
})
export class FormProdutoComponent implements OnInit {
  form!: FormGroup;
  salvando = false;

  constructor(
    private fb: FormBuilder,
    private produtoService: ProdutoService,
    private dialogRef: MatDialogRef<FormProdutoComponent>,
    @Inject(MAT_DIALOG_DATA) public produto: Produto | null
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      codigo:    [{ value: this.produto?.codigo ?? '', disabled: !!this.produto }, [Validators.required, Validators.maxLength(50)]],
      descricao: [this.produto?.descricao ?? '', [Validators.required, Validators.maxLength(200)]],
      saldo:     [this.produto?.saldo ?? 0, [Validators.required, Validators.min(0)]]
    });
  }

  salvar(): void {
    if (this.form.invalid) return;
    this.salvando = true;
    const { codigo, descricao, saldo } = this.form.getRawValue();
    const op$ = this.produto
      ? this.produtoService.atualizar(this.produto.id, { descricao, saldo })
      : this.produtoService.criar({ codigo, descricao, saldo });
    op$.pipe(finalize(() => this.salvando = false)).subscribe({ next: r => this.dialogRef.close(r), error: () => {} });
  }

  cancelar(): void { this.dialogRef.close(null); }
}
