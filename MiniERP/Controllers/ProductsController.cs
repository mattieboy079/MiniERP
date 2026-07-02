using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

namespace MiniERP.Controllers;

[ApiController]
[Route("[controller]")]
public class ProductsController(MiniErpDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<Product>> Get() =>
        await db.Products.OrderBy(p => p.Id).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<Product>> Create(Product product)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }
}
