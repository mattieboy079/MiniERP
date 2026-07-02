namespace MiniERP.Dtos.Customers;

public record CustomerResponse(
    int Id,
    string Name,
    string ContactName,
    string Email,
    string Phone,
    string Address);
