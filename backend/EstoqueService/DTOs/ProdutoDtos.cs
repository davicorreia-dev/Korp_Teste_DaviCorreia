namespace EstoqueService.DTOs;

/// <summary>
/// DTO de saída - retornado nas respostas da API.
/// </summary>
public record ProdutoDto(
    int Id,
    string Codigo,
    string Descricao,
    int Saldo,
    DateTime CriadoEm,
    DateTime AtualizadoEm
);

/// <summary>
/// DTO de entrada para criação de produto.
/// </summary>
public record CriarProdutoDto(
    string Codigo, 
    string Descricao, 
    int Saldo
);

/// <summary>
/// DTO de entrada para atualização de produto.
/// </summary>
public record AtualizarProdutoDto(
    string Descricao, 
    int Saldo
);

/// <summary>
/// DTO focado em comportamento - Usado para movimentações de estoque.
/// </summary>
public record AtualizarSaldoDto(int Quantidade);