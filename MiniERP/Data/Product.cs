namespace MiniERP.Data;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ArticleNumber { get; set; } = string.Empty;

    public double Price { get; set; }
    public double CostPrice { get; set; }
    public int? MinimumStock { get; set; }
    public int CurrentStock { get; set; }
}
