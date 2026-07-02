using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Customers;

public record CreateCustomerRequest(
    [Required] string Name,
    [Required] string ContactName,
    [Required][EmailAddress] string Email,
    [Required] string Phone,
    [Required] string Address);
