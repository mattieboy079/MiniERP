using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Products;

public record CreateProductRequest(
    [Required] string Name,
    [Required] string ArticleNumber,
    double Price,
    double CostPrice,
    int? MinimumStock,
    int CurrentStock);
