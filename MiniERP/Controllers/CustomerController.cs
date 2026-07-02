using Microsoft.AspNetCore.Mvc;

namespace MiniERP.Controllers;

[ApiController]
[Route("[controller]")]
public class CustomerController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer customer)
    {
    }

    [HttpPost]
    public async Task<IActionResult> Update([FromBody] Customer customer)
    {
    }

    [HttpPost("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
    }
}
