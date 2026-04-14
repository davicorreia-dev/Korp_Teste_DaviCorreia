namespace FaturamentoService.Models;

/// <summary>
/// Enum para status da nota fiscal.
/// </summary>
public enum StatusNota
{
    Aberta,
    Fechada
}

/// <summary>Entidade principal: Nota Fiscal.</summary>
public class NotaFiscal
{
    public int Id { get; set; }

    /// <summary> Numeração sequencial gerada automaticamente na criação.</summary>
    public int Numero { get; set; }

    public StatusNota Status { get; set; } = StatusNota.Aberta;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    /// <summary> Preenchido apenas quando a nota é impressa/fechada.</summary>
    public DateTime? FechadoEm { get; set; }

    /// <summary> Relacionamento 1:N com itens da nota.</summary>
    public List<ItemNotaFiscal> Itens { get; set; } = [];
}

/// <summary>
/// Item de uma Nota Fiscal: produto + quantidade.
/// Armazena os dados do produto desnormalizados (codigo, descrição) para
/// preservar o histórico mesmo que o produto seja alterado no Estoque Service.
/// </summary>
public class ItemNotaFiscal
{
    public int Id { get; set; }
    
    public int NotaFiscalId { get; set; }
    public NotaFiscal NotaFiscal { get; set; } = null!;

    /// <summary> Referência ao produto no EstoqueService (FK lógica, não física).</summary>
    public int ProdutoId { get; set; }

    /// <summary>Snapshot dos dados do produto utilizando 'required'.</summary>
    public required string ProdutoCodigo { get; set; }

    public required string ProdutoDescricao { get; set; }

    public int Quantidade { get; set; }
}