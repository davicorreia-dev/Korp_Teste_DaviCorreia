using FaturamentoService.DTOs;

namespace FaturamentoService.Services;

/// <summary>
/// Contrato para a lógica de negócio de Faturamento.
/// Define as operações de ciclo de vida de uma Nota Fiscal.
/// </summary>
public interface INotaFiscalService
{
    /// <summary>Retorna todas as notas com os seus itens (Projeção para DTO).</summary>
    Task<IEnumerable<NotaFiscalDto>> ListarTodasAsync();

    /// <summary>Busca uma nota específica. Retorna null se não existir.</summary>
    Task<NotaFiscalDto?> ObterPorIdAsync(int id);

    /// <summary>
    /// Cria uma nota com status inicial 'ABERTA'. 
    /// Valida se os produtos existem no EstoqueService antes de salvar.
    /// </summary>
    Task<NotaFiscalDto> CriarAsync(CriarNotaFiscalDto dto);

    /// <summary>
    /// Realiza o fechamento da nota ("Impressão").
    /// 1. Valida se a nota já não está fechada.
    /// 2. Para cada item, solicita o débito no EstoqueService.
    /// 3. Atualiza o status para 'FECHADA' e define a data de fechamento.
    /// </summary>
    Task<NotaFiscalDto> ImprimirAsync(int id);
}