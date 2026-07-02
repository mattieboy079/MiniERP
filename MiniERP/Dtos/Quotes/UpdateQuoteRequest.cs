using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Quotes;

public record UpdateQuoteRequest(
    [Range(1, int.MaxValue)] int CustomerId,
    DateTime? ValidUntil,
    [Range(0, 100)] double OverallDiscountPercent,
    [Required, MinLength(1)] IReadOnlyList<QuoteLineRequest> Lines);
