namespace MiniERP.Dtos.Quotes;

public record QuoteLineResponse(
    int? ProductId,
    string ProductName,
    string ArticleNumber,
    double UnitPrice,
    int Quantity,
    double LineDiscountPercent,
    double LineTotal);
