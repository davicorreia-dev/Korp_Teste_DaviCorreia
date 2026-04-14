using FaturamentoService.Data;
using FaturamentoService.DTOs;
using FaturamentoService.Models;
using Microsoft.EntityFrameworkCore;

namespace FaturamentoService.Services;

/// <summary>
/// Orquestrador de Faturamento: Implementa a lógica de negócio e integração com Estoque.
/// USO DO LINQ:
/// - Include() para eager loading de relacionamentos
/// - OrderByDescending() para listar notas mais recentes primeiro
/// - Select() para projeção entidade ir para DTO
/// - AnyAsync() para verificar existência sem carregar dados
/// - MaxAsync() para obter o maior número de nota (numeração sequencial)
/// - GroupBy() + Where() para detectar itens duplicados
/// - All() para validações em memória
/// </summary>
public class NotaFiscalService(
    FaturamentoDbContext context,
    IEstoqueClient estoqueClient,
    ILogger<NotaFiscalService> logger) : INotaFiscalService
{
    public async Task<IEnumerable<NotaFiscalDto>> ListarTodasAsync()
    {
        var notas = await context.NotasFiscais
            .AsNoTracking()
            .Include(n => n.Itens)
            .OrderByDescending(n => n.Numero)
            .ToListAsync();

        return notas.Select(MapToDto);
    }

    public async Task<NotaFiscalDto?> ObterPorIdAsync(int id)
    {
        var nota = await context.NotasFiscais
            .AsNoTracking()
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id);

        return nota is null ? null : MapToDto(nota);
    }

    public async Task<NotaFiscalDto> CriarAsync(CriarNotaFiscalDto dto)
    {
        ValidarInputCriacao(dto);

        var itens = new List<ItemNotaFiscal>();

        foreach (var itemDto in dto.Itens)
        {
            var produto = await estoqueClient.ObterProdutoAsync(itemDto.ProdutoId) 
                ?? throw new InvalidOperationException($"Produto {itemDto.ProdutoId} não existe no Estoque.");

            if (produto.Saldo < itemDto.Quantidade)
                throw new InvalidOperationException($"Saldo insuficiente para '{produto.Descricao}'.");

            itens.Add(new ItemNotaFiscal
            {
                ProdutoId = produto.Id,
                ProdutoCodigo = produto.Codigo,
                ProdutoDescricao = produto.Descricao,
                Quantidade = itemDto.Quantidade
            });
        }

        var proximoNumero = await GerarProximoNumeroNota();

        var nota = new NotaFiscal
        {
            Numero = proximoNumero,
            Status = StatusNota.Aberta,
            CriadoEm = DateTime.UtcNow,
            Itens = itens
        };

        context.NotasFiscais.Add(nota);
        await context.SaveChangesAsync();

        logger.LogInformation("NF #{Numero} criada com sucesso.", nota.Numero);
        return MapToDto(nota);
    }

    public async Task<NotaFiscalDto> ImprimirAsync(int id)
    {
        var nota = await context.NotasFiscais
            .Include(n => n.Itens)
            .FirstOrDefaultAsync(n => n.Id == id) 
            ?? throw new KeyNotFoundException("Nota não encontrada.");

        if (nota.Status != StatusNota.Aberta)
            throw new InvalidOperationException("Apenas notas 'Abertas' podem ser impressas.");

        // Orquestração: Baixa o estoque antes de fechar a nota
        foreach (var item in nota.Itens)
        {
            await estoqueClient.AtualizarSaldoAsync(item.ProdutoId, item.Quantidade);
        }

        nota.Status = StatusNota.Fechada;
        nota.FechadoEm = DateTime.UtcNow;
        
        await context.SaveChangesAsync();

        logger.LogInformation("NF #{Numero} finalizada e estoque baixado.", nota.Numero);
        return MapToDto(nota);
    }

    // Métodos Auxiliares (KISS/DRY)

    private static void ValidarInputCriacao(CriarNotaFiscalDto dto)
    {
        if (dto.Itens == null || !dto.Itens.Any())
            throw new ArgumentException("A nota deve ter itens.");

        if (dto.Itens.Any(i => i.Quantidade <= 0))
            throw new ArgumentException("Existem itens com quantidade inválida.");
        
        var duplicados = dto.Itens.GroupBy(x => x.ProdutoId).Any(g => g.Count() > 1);
        if (duplicados)
            throw new InvalidOperationException("Produtos duplicados não permitidos.");
    }

    private async Task<int> GerarProximoNumeroNota() =>
        await context.NotasFiscais.AnyAsync() 
            ? await context.NotasFiscais.MaxAsync(n => n.Numero) + 1 
            : 1;

    private static NotaFiscalDto MapToDto(NotaFiscal n) => new(
        n.Id, n.Numero, n.Status.ToString(), n.CriadoEm, n.FechadoEm,
        n.Itens.Select(i => new ItemNotaDto(i.ProdutoId, i.ProdutoCodigo, i.ProdutoDescricao, i.Quantidade))
    );
}