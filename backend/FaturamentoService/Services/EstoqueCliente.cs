using System.Net;
using FaturamentoService.DTOs;

namespace FaturamentoService.Services;

/// <summary>
/// Cliente resiliente para o EstoqueService usando Primary Constructor.
/// </summary>
public class EstoqueClient(HttpClient httpClient, ILogger<EstoqueClient> logger) : IEstoqueClient
{
    public async Task<ProdutoEstoqueDto?> ObterProdutoAsync(int produtoId)
    {
        try
        {
            logger.LogInformation("Consultando produto {Id} no EstoqueService...", produtoId);

            var response = await httpClient.GetAsync($"/api/produtos/{produtoId}");

            if (response.StatusCode == HttpStatusCode.NotFound)
                return null;

            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<ProdutoEstoqueDto>();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            LogAndThrowIndisponivel(ex, $"falha ao consultar produto {produtoId}");
            return null; // Nunca alcançado devido ao throw acima
        }
    }

    public async Task AtualizarSaldoAsync(int produtoId, int quantidade)
    {
        try
        {
            logger.LogInformation("Debitando {Qtde} do produto {Id} no Estoque...", quantidade, produtoId);

            var payload = new AtualizarSaldoEstoqueDto(-quantidade);
            var response = await httpClient.PatchAsJsonAsync($"/api/produtos/{produtoId}/saldo", payload);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"Erro no EstoqueService: {body}");
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            LogAndThrowIndisponivel(ex, $"falha ao atualizar saldo do produto {produtoId}");
        }
    }

    // DRY: Centralizando o log e a conversão para exceção de domínio
    private void LogAndThrowIndisponivel(Exception ex, string contexto)
    {
        logger.LogError(ex, "Erro de comunicação: {Contexto}", contexto);
        throw new ServicoIndisponivelException("EstoqueService", ex);
    }
}