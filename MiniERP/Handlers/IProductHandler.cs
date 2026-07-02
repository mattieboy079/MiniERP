using MiniERP.Dtos.Products;

namespace MiniERP.Handlers;

public interface IProductHandler
{
    Task<IReadOnlyList<ProductResponse>> GetAllAsync();
    Task<int> GetLowStockCountAsync();
    Task<ProductResponse> CreateAsync(CreateProductRequest request);
    Task<ProductResponse?> UpdateAsync(int id, UpdateProductRequest request);
    Task<bool> DeleteAsync(int id);
}
