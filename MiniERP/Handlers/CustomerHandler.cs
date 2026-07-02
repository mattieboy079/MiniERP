using MiniERP.Data;
using MiniERP.Dtos.Customers;
using MiniERP.Services;

namespace MiniERP.Handlers;

public class CustomerHandler(ICustomerService customers) : ICustomerHandler
{
    public async Task<IReadOnlyList<CustomerResponse>> GetAllAsync(string? search)
    {
        var entities = await customers.GetAllAsync(search);
        return entities.Select(ToResponse).ToList();
    }

    public Task<int> GetCountAsync()
        => customers.GetCountAsync();

    public async Task<CustomerResponse> CreateAsync(CreateCustomerRequest request)
    {
        var entity = new Customer
        {
            Name = request.Name,
            ContactName = request.ContactName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
        };

        var saved = await customers.AddAsync(entity);
        return ToResponse(saved);
    }

    public async Task<CustomerResponse?> UpdateAsync(int id, UpdateCustomerRequest request)
    {
        var changes = new Customer
        {
            Name = request.Name,
            ContactName = request.ContactName,
            Email = request.Email,
            Phone = request.Phone,
            Address = request.Address,
        };

        var updated = await customers.UpdateAsync(id, changes);
        return updated is null ? null : ToResponse(updated);
    }

    public Task<bool> DeleteAsync(int id)
        => customers.DeleteAsync(id);

    private static CustomerResponse ToResponse(Customer c)
        => new(c.Id, c.Name, c.ContactName, c.Email, c.Phone, c.Address);
}
