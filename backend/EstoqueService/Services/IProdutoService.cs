using EstoqueService.DTOs;

namespace EstoqueService.Services;

/// <summary>
/// Contrato da camada de serviço.
/// Define as operações de negócio para o gerenciamento de produtos.
/// </summary>
public interface IProdutoService
{
    // Operações de Leitura
    Task<IEnumerable<ProdutoDto>> ListarTodosAsync();
    Task<ProdutoDto?> ObterPorIdAsync(int id);

    // Operações de Escrita
    Task<ProdutoDto> CriarAsync(CriarProdutoDto dto);
    Task<ProdutoDto?> AtualizarAsync(int id, AtualizarProdutoDto dto);
    Task<bool> DeletarAsync(int id);

    /// <summary>
    /// Ajusta o saldo do produto de forma atômica.
    /// Crucial para a integração com o FaturamentoService via HTTP.
    /// </summary>
    Task<ProdutoDto?> AtualizarSaldoAsync(int id, int quantidade);
}