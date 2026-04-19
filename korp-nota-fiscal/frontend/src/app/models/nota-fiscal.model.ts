export interface ItemNota { produtoId: number; produtoCodigo: string; produtoDescricao: string; quantidade: number; }
export type StatusNota = 'Aberta' | 'Fechada';
export interface NotaFiscal { id: number; numero: number; status: StatusNota; criadoEm: string; fechadoEm?: string; itens: ItemNota[]; }
export interface CriarItemNotaDto  { produtoId: number; quantidade: number; }
export interface CriarNotaFiscalDto { itens: CriarItemNotaDto[]; }
