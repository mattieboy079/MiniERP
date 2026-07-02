using MiniERP.Dtos.Quotes;

namespace MiniERP.Handlers;

public interface IQuoteHandler
{
    Task<IReadOnlyList<QuoteSummaryResponse>> GetAllAsync(string? search);
    Task<QuoteResponse?> GetByIdAsync(int id);
    Task<int> GetCountAsync();
    Task<QuoteResponse> CreateAsync(CreateQuoteRequest request);
    Task<QuoteResponse?> UpdateAsync(int id, UpdateQuoteRequest request);
    Task<bool> DeleteAsync(int id);
}
