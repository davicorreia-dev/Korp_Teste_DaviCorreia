using FaturamentoService.DTOs;
using FaturamentoService.Services;
using Microsoft.AspNetCore.Mvc;

namespace FaturamentoService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
// Usando Primary Constructor
public class NotasFiscaisController(INotaFiscalService service) : ControllerBase
{
    /// <summary>
    /// Lista todas as notas fiscais ordenadas da mais recente para a mais antiga.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<NotaFiscalDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar()
    {
        var notas = await service.ListarTodasAsync();
        return Ok(notas);
    }

    /// <summary>
    /// Obtém os detalhes de uma nota fiscal específica.
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(NotaFiscalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var nota = await service.ObterPorIdAsync(id);
        
        // Mantendo a lógica de retorno simples e direta (KISS)
        return nota is null
            ? NotFound(new { message = $"Nota Fiscal {id} não encontrada." })
            : Ok(nota);
    }

    /// <summary>
    /// Cria uma nota fiscal (Status: Aberta).
    /// Valida a existência e saldo dos itens no EstoqueService.
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(NotaFiscalDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Criar([FromBody] CriarNotaFiscalDto dto)
    {
        var nota = await service.CriarAsync(dto);
        
        // Padrão REST: Retorna 201 Created e o link para o recurso criado
        return CreatedAtAction(nameof(ObterPorId), new { id = nota.Id }, nota);
    }

    /// <summary>
    /// Fecha a nota e debita o estoque.
    /// Retorna 503 se o serviço de estoque estiver fora do ar.
    /// </summary>
    [HttpPost("{id:int}/imprimir")]
    [ProducesResponseType(typeof(NotaFiscalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Imprimir(int id)
    {
        var nota = await service.ImprimirAsync(id);
        return Ok(nota);
    }
}