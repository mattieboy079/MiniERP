using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniERP.Dtos.Quotes;
using MiniERP.Handlers;
using MiniERP.Security;

namespace MiniERP.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize] // any authenticated user may read, create and update; only Admin may delete
public class QuotesController(IQuoteHandler handler) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
        => Ok(await handler.GetAllAsync(search));

    [HttpGet("count")]
    public async Task<IActionResult> Count()
        => Ok(await handler.GetCountAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var quote = await handler.GetByIdAsync(id);
        return quote is null ? NotFound() : Ok(quote);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateQuoteRequest request)
    {
        try
        {
            var created = await handler.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            // An unknown customer/product reference in the body is a bad request.
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuoteRequest request)
    {
        try
        {
            var updated = await handler.UpdateAsync(id, request);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await handler.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
