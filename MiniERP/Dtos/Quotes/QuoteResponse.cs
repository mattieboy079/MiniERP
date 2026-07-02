namespace MiniERP.Dtos.Quotes;

public record QuoteResponse(
    int Id,
    string QuoteNumber,
    int? CustomerId,
    string CustomerName,
    DateTime CreatedDate,
    DateTime ValidUntil,
    double VatRate,
    double OverallDiscountPercent,
    IReadOnlyList<QuoteLineResponse> Lines,
    double Subtotal,
    double DiscountedSubtotal,
    double VatAmount,
    double Total);
