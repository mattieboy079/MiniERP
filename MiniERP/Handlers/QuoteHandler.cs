using MiniERP.Data;
using MiniERP.Dtos.Quotes;
using MiniERP.Services;

namespace MiniERP.Handlers;

// Use-case layer for quotes. This is the app's first composed handler: it reads the
// Customer and Product aggregates via their own services, applies the freeze/snapshot
// rule, and persists a Quote via IQuoteService. Totals are derived here for the response
// (never stored) so they can never drift from the frozen line data.
public class QuoteHandler(
    IQuoteService quotes,
    IProductService products,
    ICustomerService customers) : IQuoteHandler
{
    // Design levers.
    private const double VatRate = 21;
    private const int DefaultValidityDays = 30;

    public async Task<IReadOnlyList<QuoteSummaryResponse>> GetAllAsync(string? search)
    {
        var entities = await quotes.GetAllAsync(search);
        return entities.Select(ToSummary).ToList();
    }

    public async Task<QuoteResponse?> GetByIdAsync(int id)
    {
        var entity = await quotes.GetByIdAsync(id);
        return entity is null ? null : ToResponse(entity);
    }

    public Task<int> GetCountAsync()
        => quotes.GetCountAsync();

    public async Task<QuoteResponse> CreateAsync(CreateQuoteRequest request)
    {
        var quote = await BuildQuoteAsync(request.CustomerId, request.OverallDiscountPercent, request.Lines);
        quote.CreatedDate = DateTime.UtcNow;
        quote.ValidUntil = request.ValidUntil ?? quote.CreatedDate.AddDays(DefaultValidityDays);

        var saved = await quotes.AddAsync(quote);
        return ToResponse(saved);
    }

    public async Task<QuoteResponse?> UpdateAsync(int id, UpdateQuoteRequest request)
    {
        var existing = await quotes.GetByIdAsync(id);
        if (existing is null)
            return null;

        var rebuilt = await BuildQuoteAsync(request.CustomerId, request.OverallDiscountPercent, request.Lines);
        // Creation is immutable; validity re-defaults to +30d from creation when omitted.
        rebuilt.ValidUntil = request.ValidUntil ?? existing.CreatedDate.AddDays(DefaultValidityDays);

        var updated = await quotes.UpdateAsync(id, rebuilt);
        return updated is null ? null : ToResponse(updated);
    }

    public Task<bool> DeleteAsync(int id)
        => quotes.DeleteAsync(id);

    // Validates the referenced customer and products exist, then snapshots their current
    // details onto a fresh Quote aggregate. Throws ArgumentException on an unknown
    // reference (the controller maps that to 400).
    private async Task<Quote> BuildQuoteAsync(int customerId, double overallDiscountPercent, IReadOnlyList<QuoteLineRequest> lines)
    {
        var customer = await customers.GetByIdAsync(customerId)
            ?? throw new ArgumentException($"Klant {customerId} bestaat niet.");

        var quote = new Quote
        {
            CustomerId = customer.Id,
            CustomerName = customer.Name,
            OverallDiscountPercent = overallDiscountPercent,
            VatRate = VatRate,
        };

        foreach (var line in lines)
        {
            var product = await products.GetByIdAsync(line.ProductId)
                ?? throw new ArgumentException($"Product {line.ProductId} bestaat niet.");

            quote.Lines.Add(new QuoteLine
            {
                ProductId = product.Id,
                ProductName = product.Name,
                ArticleNumber = product.ArticleNumber,
                UnitPrice = product.Price,
                Quantity = line.Quantity,
                LineDiscountPercent = line.LineDiscountPercent,
            });
        }

        return quote;
    }

    private static QuoteResponse ToResponse(Quote q)
    {
        double subtotal = 0;
        var lines = new List<QuoteLineResponse>(q.Lines.Count);
        foreach (var l in q.Lines)
        {
            var net = LineNet(l);
            subtotal += net;
            lines.Add(new QuoteLineResponse(
                l.ProductId, l.ProductName, l.ArticleNumber, l.UnitPrice,
                l.Quantity, l.LineDiscountPercent, Round(net)));
        }

        var discountedSubtotal = subtotal * (1 - q.OverallDiscountPercent / 100);
        var vatAmount = discountedSubtotal * q.VatRate / 100;
        var total = discountedSubtotal + vatAmount;

        return new QuoteResponse(
            q.Id,
            FormatNumber(q.Id),
            q.CustomerId,
            q.CustomerName,
            q.CreatedDate,
            q.ValidUntil,
            q.VatRate,
            q.OverallDiscountPercent,
            lines,
            Round(subtotal),
            Round(discountedSubtotal),
            Round(vatAmount),
            Round(total));
    }

    private static QuoteSummaryResponse ToSummary(Quote q)
    {
        var subtotal = q.Lines.Sum(LineNet);
        var discountedSubtotal = subtotal * (1 - q.OverallDiscountPercent / 100);
        var total = discountedSubtotal + discountedSubtotal * q.VatRate / 100;

        return new QuoteSummaryResponse(
            q.Id, FormatNumber(q.Id), q.CustomerId, q.CustomerName,
            q.CreatedDate, q.ValidUntil, Round(total));
    }

    private static double LineNet(QuoteLine l)
        => l.Quantity * l.UnitPrice * (1 - l.LineDiscountPercent / 100);

    private static string FormatNumber(int id)
        => $"OFF-{id:D5}";

    private static double Round(double value)
        => Math.Round(value, 2, MidpointRounding.AwayFromZero);
}
