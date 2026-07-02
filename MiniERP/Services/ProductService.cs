using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

namespace MiniERP.Services;

public class ProductService(MiniErpDbContext db) : IProductService
{
    public async Task<IReadOnlyList<Product>> GetAllAsync()
        => await db.Products.OrderBy(p => p.Id).ToListAsync();

    public async Task<int> GetLowStockCountAsync()
        // A product is low when a minimum is set and current stock has reached or dropped
        // below it. Products without a minimum have no threshold and are excluded.
        => await db.Products.CountAsync(p =>
            p.MinimumStock != null &&
            p.CurrentStock <= p.MinimumStock);

    public async Task<Product?> GetByIdAsync(int id)
        => await db.Products.FindAsync(id);

    public async Task<Product> AddAsync(Product product)
    {
        db.Products.Add(product);
        await db.SaveChangesAsync();
        return product;
    }

    public async Task<Product?> UpdateAsync(int id, Product changes)
    {
        var existing = await db.Products.FindAsync(id);
        if (existing is null)
            return null;

        existing.Name = changes.Name;
        existing.ArticleNumber = changes.ArticleNumber;
        existing.Price = changes.Price;
        existing.CostPrice = changes.CostPrice;
        existing.MinimumStock = changes.MinimumStock;
        existing.CurrentStock = changes.CurrentStock;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await db.Products.FindAsync(id);
        if (existing is null)
            return false;

        db.Products.Remove(existing);
        await db.SaveChangesAsync();
        return true;
    }
}
