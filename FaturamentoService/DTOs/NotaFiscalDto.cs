namespace FaturamentoService.DTOs;

// DTO de saída - retornado nas respostas da API.

public record ItemNotaDto(
    int ProdutoId,
    string ProdutoCodigo,
    string ProdutoDescricao,
    int Quantidade
);

public record NotaFiscalDto(
    int Id,
    int Numero,
    string Status,
    DateTime CriadoEm,
    DateTime? FechadoEm,
    // IEnumerable semanticamente indica que a coleção é de leitura e imutável
    IEnumerable<ItemNotaDto> Itens 
);

// DTO de entrada que API recebe.

public record CriarItemNotaDto(
    int ProdutoId,
    int Quantidade
);

public record CriarNotaFiscalDto(
    IEnumerable<CriarItemNotaDto> Itens
);

// Comunicação Inter-serviços (Anti-Corruption Layer)

/// <summary>
/// DTO que representa a "visão" que o Faturamento tem de um Produto.
/// Ignorei propositalmente campos do Estoque, visto que não importam aqui.
/// </summary>
public record ProdutoEstoqueDto(
    int Id,
    string Codigo,
    string Descricao,
    int Saldo
);

/// <summary>
/// Payload exato exigido pelo endpoint [PATCH] do EstoqueService.
/// </summary>
public record AtualizarSaldoEstoqueDto(int Quantidade);