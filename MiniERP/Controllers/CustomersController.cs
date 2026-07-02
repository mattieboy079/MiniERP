using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MiniERP.Dtos.Customers;
using MiniERP.Handlers;
using MiniERP.Security;

namespace MiniERP.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize] // any authenticated user may read; writes are further restricted below
public class CustomersController(ICustomerHandler handler) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search)
        => Ok(await handler.GetAllAsync(search));

    [HttpGet("count")]
    public async Task<IActionResult> Count()
        => Ok(await handler.GetCountAsync());

    [Authorize(Roles = Roles.Admin)]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request)
    {
        var created = await handler.CreateAsync(request);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCustomerRequest request)
    {
        var updated = await handler.UpdateAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [Authorize(Roles = Roles.Admin)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await handler.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
