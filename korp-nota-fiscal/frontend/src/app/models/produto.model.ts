export interface Produto {
  id: number;
  codigo: string;
  descricao: string;
  saldo: number;
  criadoEm: string;
  atualizadoEm: string;
}
export interface CriarProdutoDto  { codigo: string; descricao: string; saldo: number; }
export interface AtualizarProdutoDto { descricao: string; saldo: number; }
