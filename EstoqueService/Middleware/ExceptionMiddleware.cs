using System.Net;
using System.Text.Json;

namespace EstoqueService.Middleware;

/// <summary>
/// Middleware de tratamento centralizado de erros utilizando Primary Constructors.
/// Em vez de try/catch em cada controller/service, usei um middleware
/// que lida com TODAS as exceções não tratadas do pipeline HTTP.
/// </summary>
public class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context); // Tenta executar a próxima etapa do pipeline
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    /// <summary>
    /// - ArgumentException = 400 Bad Request (entrada inválida)
    /// - InvalidOperationException = 400 Bad Request (violação de regra de negócio)
    /// - KeyNotFoundException = 404 Not Found
    /// - Exception (genérica) = 500 Internal Server Error
    /// </summary>
    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var statusCode = exception switch
        {
            ArgumentException or InvalidOperationException => HttpStatusCode.BadRequest,
            KeyNotFoundException => HttpStatusCode.NotFound,
            _ => HttpStatusCode.InternalServerError
        };

        // Logando o erro com contexto
        if (statusCode == HttpStatusCode.InternalServerError)
            logger.LogError(exception, "Erro crítico: {Message}", exception.Message);
        else
            logger.LogWarning("Falha na requisição: {Message}", exception.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        // Nunca mostra detalhes técnicos (StackTrace) em produção
        var message = env.IsDevelopment() 
            ? exception.ToString() 
            : "Ocorreu um erro ao processar sua solicitação.";

        var response = new
        {
            error = message,
            statusCode = (int)statusCode,
            timestamp = DateTime.UtcNow
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}