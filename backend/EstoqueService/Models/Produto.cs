namespace EstoqueService.Models;

/// <summary>
/// Entidade de domínio - mapeada diretamente para a tabela "Produtos" no SQLite.
/// </summary>
public class Produto
{
    public int Id { get; set; }

    /// <summary>
    /// Código único do produto (ex: "PROD-001"). Indexado com unique constraint.
    /// Uso de 'required' para garantir integridade na criação.
    /// </summary>
    public required string Codigo { get; set; }

    public required string Descricao { get; set; }

    /// <summary>
    /// Quantidade em estoque.
    /// Validado na service ‘layer’, ou seja, não pode ser negativo.
    /// </summary>
    public int Saldo { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    
    public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
}