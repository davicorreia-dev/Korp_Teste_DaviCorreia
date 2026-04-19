import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Produto, CriarProdutoDto, AtualizarProdutoDto } from '../models/produto.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly url = `${environment.estoqueApiUrl}/api/produtos`;
  private _produtos$ = new BehaviorSubject<Produto[]>([]);
  readonly produtos$ = this._produtos$.asObservable();

  constructor(private http: HttpClient) {}

  carregarProdutos(): Observable<Produto[]> {
    return this.http.get<Produto[]>(this.url).pipe(tap(p => this._produtos$.next(p)));
  }
  obterPorId(id: number): Observable<Produto> { return this.http.get<Produto>(`${this.url}/${id}`); }
  criar(dto: CriarProdutoDto): Observable<Produto> { return this.http.post<Produto>(this.url, dto).pipe(tap(() => this.carregarProdutos().subscribe())); }
  atualizar(id: number, dto: AtualizarProdutoDto): Observable<Produto> { return this.http.put<Produto>(`${this.url}/${id}`, dto).pipe(tap(() => this.carregarProdutos().subscribe())); }
  deletar(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`).pipe(tap(() => this.carregarProdutos().subscribe())); }
}
