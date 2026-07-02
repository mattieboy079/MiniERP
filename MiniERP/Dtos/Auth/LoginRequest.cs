using System.ComponentModel.DataAnnotations;

namespace MiniERP.Dtos.Auth;

public record LoginRequest(
    [Required] string Username,
    [Required] string Password);
