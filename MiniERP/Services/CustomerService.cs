using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

namespace MiniERP.Services;

public class CustomerService(MiniErpDbContext db) : ICustomerService
{
    public async Task<IReadOnlyList<Customer>> GetAllAsync(string? search)
    {
        var query = db.Customers.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c =>
                c.Name.Contains(term) ||
                c.ContactName.Contains(term) ||
                c.Email.Contains(term));
        }

        return await query.OrderBy(c => c.Id).ToListAsync();
    }

    public async Task<int> GetCountAsync()
        => await db.Customers.CountAsync();

    public async Task<Customer?> GetByIdAsync(int id)
        => await db.Customers.FindAsync(id);

    public async Task<Customer> AddAsync(Customer customer)
    {
        db.Customers.Add(customer);
        await db.SaveChangesAsync();
        return customer;
    }

    public async Task<Customer?> UpdateAsync(int id, Customer changes)
    {
        var existing = await db.Customers.FindAsync(id);
        if (existing is null)
            return null;

        existing.Name = changes.Name;
        existing.ContactName = changes.ContactName;
        existing.Email = changes.Email;
        existing.Phone = changes.Phone;
        existing.Address = changes.Address;

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await db.Customers.FindAsync(id);
        if (existing is null)
            return false;

        db.Customers.Remove(existing);
        await db.SaveChangesAsync();
        return true;
    }
}
