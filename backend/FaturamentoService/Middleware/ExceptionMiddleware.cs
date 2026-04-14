using System.Net;
using System.Text.Json;
using FaturamentoService.Services;

namespace FaturamentoService.Middleware;

/// <summary>
/// Middleware global para captura de exceções.
/// Transforma exceções de domínio em respostas HTTP padronizadas.
/// </summary>
public class ExceptionMiddleware(
    RequestDelegate next, 
    ILogger<ExceptionMiddleware> logger, 
    IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ServicoIndisponivelException ex)
        {
            // O EstoqueService caiu, retorna 503 (Service Unavailable)
            logger.LogError(ex, "Falha de dependência externa.");
            await WriteErrorResponse(context, HttpStatusCode.ServiceUnavailable, ex.Message);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            logger.LogWarning("Falha de validação/regra de negócio: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.BadRequest, ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning("Recurso não encontrado: {Message}", ex.Message);
            await WriteErrorResponse(context, HttpStatusCode.NotFound, ex.Message);
        }
        catch (Exception ex)
        {
            // Erro 500 genérico para bugs inesperados
            logger.LogError(ex, "Erro crítico não tratado em {Path}", context.Request.Path);

            var message = env.IsDevelopment() 
                ? $"{ex.Message} | StackTrace: {ex.StackTrace}" 
                : "Ocorreu um erro interno. Nossa equipe técnica já foi avisada.";

            await WriteErrorResponse(context, HttpStatusCode.InternalServerError, message);
        }
    }
    
    // Regra CA1869 recomenda cachear/reutilizar a instância para melhorar performance.
    private static readonly JsonSerializerOptions DefaultJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private static async Task WriteErrorResponse(HttpContext context, HttpStatusCode status, string message)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)status;

        var response = new
        {
            error = message,
            statusCode = (int)status,
            timestamp = DateTime.UtcNow
        };

        var json = JsonSerializer.Serialize(response, DefaultJsonOptions);
        await context.Response.WriteAsync(json);
    }
}