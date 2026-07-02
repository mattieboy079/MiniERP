using MiniERP.Dtos.Customers;

namespace MiniERP.Handlers;

public interface ICustomerHandler
{
    Task<IReadOnlyList<CustomerResponse>> GetAllAsync(string? search);
    Task<int> GetCountAsync();
    Task<CustomerResponse> CreateAsync(CreateCustomerRequest request);
    Task<CustomerResponse?> UpdateAsync(int id, UpdateCustomerRequest request);
    Task<bool> DeleteAsync(int id);
}
