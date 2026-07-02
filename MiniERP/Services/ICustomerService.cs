using MiniERP.Data;

namespace MiniERP.Services;

public interface ICustomerService
{
    Task<IReadOnlyList<Customer>> GetAllAsync(string? search);
    Task<int> GetCountAsync();
    Task<Customer?> GetByIdAsync(int id);
    Task<Customer> AddAsync(Customer customer);
    Task<Customer?> UpdateAsync(int id, Customer changes);
    Task<bool> DeleteAsync(int id);
}
