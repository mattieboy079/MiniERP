using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Quotes;

public record CreateQuoteRequest(
    [Range(1, int.MaxValue)] int CustomerId,
    DateTime? ValidUntil,
    [Range(0, 100)] double OverallDiscountPercent,
    [Required, MinLength(1)] IReadOnlyList<QuoteLineRequest> Lines);
