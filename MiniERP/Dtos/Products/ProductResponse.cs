namespace MiniERP.Dtos.Products;

public record ProductResponse(
    int Id,
    string Name,
    string ArticleNumber,
    double Price,
    double CostPrice,
    int? MinimumStock,
    int CurrentStock);
