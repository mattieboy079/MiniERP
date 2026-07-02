using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Quotes;

public record QuoteLineRequest(
    int ProductId,
    [Range(1, int.MaxValue)] int Quantity,
    [Range(0, 100)] double LineDiscountPercent);
