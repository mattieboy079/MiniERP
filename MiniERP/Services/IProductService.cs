using MiniERP.Data;

namespace MiniERP.Services;

public interface IProductService
{
    Task<IReadOnlyList<Product>> GetAllAsync();
    Task<int> GetLowStockCountAsync();
    Task<Product?> GetByIdAsync(int id);
    Task<Product> AddAsync(Product product);
    Task<Product?> UpdateAsync(int id, Product changes);
    Task<bool> DeleteAsync(int id);
}
