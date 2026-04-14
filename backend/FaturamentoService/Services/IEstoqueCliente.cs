using FaturamentoService.DTOs;

namespace FaturamentoService.Services;

/// <summary>
/// Exceção customizada para falhas de comunicação inter-serviços.
/// </summary>
public class ServicoIndisponivelException(string servico, Exception? inner = null) 
    : Exception($"O serviço '{servico}' está temporariamente indisponível.", inner);

/// <summary>
/// Interface para comunicação com o EstoqueService via HTTP.
/// Princípio de Inversão de Dependência (DIP).
/// O isolamento da interface permite modificar a implementação sem alterar o service.
/// </summary>
public interface IEstoqueClient
{
    /// <summary>
    /// Consulta os dados de um produto no EstoqueService.
    /// </summary>
    Task<ProdutoEstoqueDto?> ObterProdutoAsync(int produtoId);

    /// <summary>
    /// Solicita o débito ou crédito de saldo no EstoqueService.
    /// </summary>
    Task AtualizarSaldoAsync(int produtoId, int quantidade);
}