using EstoqueService.DTOs;
using EstoqueService.Services;
using Microsoft.AspNetCore.Mvc;

namespace EstoqueService.Controllers;

/// <summary>
/// Controller de Produtos: Porta de entrada para requisições HTTP.
/// Utiliza Primary Constructor para injeção de dependência.
/// Controller thin (magro): apenas valida a rota, repassa para a service
/// e retorna o status HTTP adequado.
/// Toda lógica de negócio está na ProdutoService.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ProdutosController(IProdutoService service) : ControllerBase
{
    /// <summary>Lista todos os produtos ordenados por código (Status 200).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProdutoDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar()
    {
        var produtos = await service.ListarTodosAsync();
        return Ok(produtos);
    }

    /// <summary>Obtém um produto específico (Status 200 ou 404).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObterPorId(int id)
    {
        var produto = await service.ObterPorIdAsync(id);
        return produto is null ? NotFound(new { message = "Produto não encontrado." }) : Ok(produto);
    }

    /// <summary>Cria um produto e retorna o caminho para acessá-lo (Status 201).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Criar([FromBody] CriarProdutoDto dto)
    {
        var produto = await service.CriarAsync(dto);
        // CreatedAtAction preenche o header 'Location' com a URL do novo recurso
        return CreatedAtAction(nameof(ObterPorId), new { id = produto.Id }, produto);
    }

    /// <summary>Atualização completa (Status 200 ou 404).</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Atualizar(int id, [FromBody] AtualizarProdutoDto dto)
    {
        var produto = await service.AtualizarAsync(id, dto);
        return produto is null ? NotFound(new { message = "Produto não encontrado." }) : Ok(produto);
    }

    /// <summary>Exclusão de recurso (Status 204).</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Deletar(int id)
    {
        var deletado = await service.DeletarAsync(id);
        return deletado ? NoContent() : NotFound(new { message = "Produto não encontrado." });
    }

    /// <summary>
    /// PATCH é semanticamente correto aqui, pois é uma atualização parcial do Saldo.
    /// </summary>
    [HttpPatch("{id:int}/saldo")]
    [ProducesResponseType(typeof(ProdutoDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AtualizarSaldo(int id, [FromBody] AtualizarSaldoDto dto)
    {
        var produto = await service.AtualizarSaldoAsync(id, dto.Quantidade);
        return produto is null ? NotFound(new { message = "Produto não encontrado." }) : Ok(produto);
    }
}