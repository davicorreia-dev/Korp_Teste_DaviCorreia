using EstoqueService.Data;
using EstoqueService.DTOs;
using EstoqueService.Models;
using Microsoft.EntityFrameworkCore;

namespace EstoqueService.Services;

/// <summary>
/// Implementação da camada de serviço com Primary Constructor.
/// Camada de serviço: contém toda a lógica de negócio e validações.
/// O controller apenas roteia a requisição e delega para cá.
/// USO DE LINQ:
/// Todos os acessos ao banco usam LINQ via EF Core. O EF Core traduz
/// as expressões LINQ para SQL otimizado em tempo de execução.
/// </summary>
public class ProdutoService(EstoqueDbContext context, ILogger<ProdutoService> logger) : IProdutoService
{
    public async Task<IEnumerable<ProdutoDto>> ListarTodosAsync()
    {
        // AsNoTracking() melhora performance em consultas somente-leitura
        return await context.Produtos
            .AsNoTracking()
            .OrderBy(p => p.Codigo)
            .Select(p => MapToDto(p)) 
            .ToListAsync();
    }

    public async Task<ProdutoDto?> ObterPorIdAsync(int id)
    {
        var produto = await context.Produtos
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        return produto is null ? null : MapToDto(produto);
    }
    
    /// <summary>
    /// LINQ: AnyAsync verifica duplicidade de código antes de inserir e sem carregar a entidade inteira.
    /// Evita ir ao banco duas vezes em cenários de concorrência.
    /// </summary>
    public async Task<ProdutoDto> CriarAsync(CriarProdutoDto dto)
    {
        ValidarDadosBasicos(dto.Codigo, dto.Descricao, dto.Saldo);
        
        // Verifica duplicidade (KISS - Simples e direto)
        var codigoJaExiste = await context.Produtos
            .AnyAsync(p => p.Codigo.Equals(dto.Codigo.Trim(), StringComparison.CurrentCultureIgnoreCase));

        if (codigoJaExiste)
            throw new InvalidOperationException($"O código '{dto.Codigo}' já está em uso.");

        var produto = new Produto
        {
            Codigo = dto.Codigo.Trim().ToUpper(),
            Descricao = dto.Descricao.Trim(),
            Saldo = dto.Saldo,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        };

        context.Produtos.Add(produto);
        await context.SaveChangesAsync();

        logger.LogInformation("Produto {Codigo} criado com sucesso.", produto.Codigo);

        return MapToDto(produto);
    }

    public async Task<ProdutoDto?> AtualizarAsync(int id, AtualizarProdutoDto dto)
    {
        ValidarDadosBasicos("VALIDO", dto.Descricao, dto.Saldo);
        
        // FindAsync busca pelo PK - usa cache do contexto se já carregado
        var produto = await context.Produtos.FindAsync(id);
        if (produto is null) return null;

        produto.Descricao = dto.Descricao.Trim();
        produto.Saldo = dto.Saldo;
        produto.AtualizadoEm = DateTime.UtcNow;

        await context.SaveChangesAsync();
        return MapToDto(produto);
    }

    public async Task<bool> DeletarAsync(int id)
    {
        var produto = await context.Produtos.FindAsync(id);
        if (produto is null) return false;

        context.Produtos.Remove(produto);
        await context.SaveChangesAsync();
        return true;
    }
    
    /// <summary>
    /// Atualiza saldo de forma transacional.
    /// LINQ: FindAsync + validação de negócio + SaveChangesAsync.
    /// Usado pelo FaturamentoService ao imprimir uma nota fiscal.
    /// </summary>
    public async Task<ProdutoDto?> AtualizarSaldoAsync(int id, int quantidade)
    {
        var produto = await context.Produtos.FindAsync(id);
        if (produto is null) return null;

        var novoSaldo = produto.Saldo + quantidade;

        if (novoSaldo < 0)
            throw new InvalidOperationException($"Saldo insuficiente para o produto {produto.Codigo}.");

        produto.Saldo = novoSaldo;
        produto.AtualizadoEm = DateTime.UtcNow;

        await context.SaveChangesAsync();
        logger.LogInformation("Movimentação de estoque: {Qtde} no produto {ID}", quantidade, id);

        return MapToDto(produto);
    }

    // Centralizando validações comuns (DRY)
    private static void ValidarDadosBasicos(string codigo, string descricao, int saldo)
    {
        if (string.IsNullOrWhiteSpace(codigo)) throw new ArgumentException("Código inválido.");
        if (string.IsNullOrWhiteSpace(descricao)) throw new ArgumentException("Descrição inválida.");
        if (saldo < 0) throw new ArgumentException("Saldo não pode ser negativo.");
    }

    // Centralizando o mapeamento (DRY)
    private static ProdutoDto MapToDto(Produto p) =>
        new(p.Id, p.Codigo, p.Descricao, p.Saldo, p.CriadoEm, p.AtualizadoEm);
}