namespace MiniERP.Data;

public class Quote
{
    public int Id { get; set; }

    // Reference to the customer, kept nullable so deleting a customer never breaks a
    // saved quote (ON DELETE SET NULL). CustomerName is snapshotted at save time so the
    // offerte stays a self-contained document.
    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerName { get; set; } = string.Empty;

    public DateTime CreatedDate { get; set; }
    public DateTime ValidUntil { get; set; }

    // Discount over the whole (line-discounted) subtotal and the VAT rate, both frozen
    // on the quote at save time. Totals are derived from these + the lines, never stored.
    public double OverallDiscountPercent { get; set; }
    public double VatRate { get; set; }

    public List<QuoteLine> Lines { get; set; } = [];
}
