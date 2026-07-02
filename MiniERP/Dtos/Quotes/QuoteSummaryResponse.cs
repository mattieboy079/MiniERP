namespace MiniERP.Dtos.Quotes;

public record QuoteSummaryResponse(
    int Id,
    string QuoteNumber,
    int? CustomerId,
    string CustomerName,
    DateTime CreatedDate,
    DateTime ValidUntil,
    double Total);
