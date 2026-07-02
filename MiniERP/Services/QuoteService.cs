using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

namespace MiniERP.Services;

public class QuoteService(MiniErpDbContext db) : IQuoteService
{
    public async Task<IReadOnlyList<Quote>> GetAllAsync(string? search)
    {
        var query = db.Quotes.Include(q => q.Lines).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            // The offertenummer is OFF-{Id}; a search on the number (with or without the
            // prefix/padding) matches by id, alongside a match on the customer name.
            var digits = new string(term.Where(char.IsDigit).ToArray());
            int? id = int.TryParse(digits, out var parsed) ? parsed : null;

            query = query.Where(q =>
                q.CustomerName.Contains(term) ||
                (id != null && q.Id == id));
        }

        return await query
            .OrderByDescending(q => q.CreatedDate)
            .ThenByDescending(q => q.Id)
            .ToListAsync();
    }

    public async Task<Quote?> GetByIdAsync(int id)
        => await db.Quotes.Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == id);

    public async Task<int> GetCountAsync()
        => await db.Quotes.CountAsync();

    public async Task<Quote> AddAsync(Quote quote)
    {
        db.Quotes.Add(quote);
        await db.SaveChangesAsync();
        return quote;
    }

    public async Task<Quote?> UpdateAsync(int id, Quote changes)
    {
        var existing = await db.Quotes.Include(q => q.Lines).FirstOrDefaultAsync(q => q.Id == id);
        if (existing is null)
            return null;

        existing.CustomerId = changes.CustomerId;
        existing.CustomerName = changes.CustomerName;
        existing.ValidUntil = changes.ValidUntil;
        existing.OverallDiscountPercent = changes.OverallDiscountPercent;
        existing.VatRate = changes.VatRate;
        // CreatedDate is intentionally left untouched — creation is immutable.

        // Replace the lines wholesale; orphaned rows are cascade-deleted.
        existing.Lines.Clear();
        foreach (var line in changes.Lines)
            existing.Lines.Add(line);

        await db.SaveChangesAsync();
        return existing;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await db.Quotes.FindAsync(id);
        if (existing is null)
            return false;

        db.Quotes.Remove(existing);
        await db.SaveChangesAsync();
        return true;
    }
}
