import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { NotaFiscal, CriarNotaFiscalDto } from '../models/nota-fiscal.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotaFiscalService {
  private readonly url = `${environment.faturamentoApiUrl}/api/notasfiscais`;
  private _notas$ = new BehaviorSubject<NotaFiscal[]>([]);
  readonly notas$ = this._notas$.asObservable();

  constructor(private http: HttpClient) {}

  carregarNotas(): Observable<NotaFiscal[]> { return this.http.get<NotaFiscal[]>(this.url).pipe(tap(n => this._notas$.next(n))); }
  obterPorId(id: number): Observable<NotaFiscal> { return this.http.get<NotaFiscal>(`${this.url}/${id}`); }
  criar(dto: CriarNotaFiscalDto): Observable<NotaFiscal> { return this.http.post<NotaFiscal>(this.url, dto).pipe(tap(() => this.carregarNotas().subscribe())); }
  imprimir(id: number): Observable<NotaFiscal> { return this.http.post<NotaFiscal>(`${this.url}/${id}/imprimir`, {}).pipe(tap(() => this.carregarNotas().subscribe())); }
}
