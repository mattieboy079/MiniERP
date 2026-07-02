using MiniERP.Data;
using MiniERP.Dtos.Products;
using MiniERP.Services;

namespace MiniERP.Handlers;

public class ProductHandler(IProductService products) : IProductHandler
{
    public async Task<IReadOnlyList<ProductResponse>> GetAllAsync()
    {
        var entities = await products.GetAllAsync();
        return entities.Select(ToResponse).ToList();
    }

    public Task<int> GetLowStockCountAsync()
        => products.GetLowStockCountAsync();

    public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
    {
        var entity = new Product
        {
            Name = request.Name,
            ArticleNumber = request.ArticleNumber,
            Price = request.Price,
            CostPrice = request.CostPrice,
            MinimumStock = request.MinimumStock,
            CurrentStock = request.CurrentStock,
        };

        var saved = await products.AddAsync(entity);
        return ToResponse(saved);
    }

    public async Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request)
    {
        var changes = new Product
        {
            Name = request.Name,
            ArticleNumber = request.ArticleNumber,
            Price = request.Price,
            CostPrice = request.CostPrice,
            MinimumStock = request.MinimumStock,
            CurrentStock = request.CurrentStock,
        };

        var updated = await products.UpdateAsync(id, changes);
        return updated is null ? null : ToResponse(updated);
    }

    public Task<bool> DeleteAsync(int id)
        => products.DeleteAsync(id);

    private static ProductResponse ToResponse(Product p)
        => new(p.Id, p.Name, p.ArticleNumber, p.Price, p.CostPrice, p.MinimumStock, p.CurrentStock);
}
