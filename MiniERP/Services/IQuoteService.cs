using MiniERP.Data;

namespace MiniERP.Services;

public interface IQuoteService
{
    Task<IReadOnlyList<Quote>> GetAllAsync(string? search);
    Task<Quote?> GetByIdAsync(int id);
    Task<int> GetCountAsync();
    Task<Quote> AddAsync(Quote quote);
    Task<Quote?> UpdateAsync(int id, Quote changes);
    Task<bool> DeleteAsync(int id);
}
