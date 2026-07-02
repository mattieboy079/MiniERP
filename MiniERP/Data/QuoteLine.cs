namespace MiniERP.Data;

public class QuoteLine
{
    public int Id { get; set; }

    public int QuoteId { get; set; }
    public Quote Quote { get; set; } = null!;

    // Nullable reference to the source product (ON DELETE SET NULL); the name, article
    // number and unit price are snapshotted at save time so the line survives a product
    // being repriced, renamed or deleted.
    public int? ProductId { get; set; }
    public Product? Product { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ArticleNumber { get; set; } = string.Empty;
    public double UnitPrice { get; set; }

    public int Quantity { get; set; }
    public double LineDiscountPercent { get; set; }
}
