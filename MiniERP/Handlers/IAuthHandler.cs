using MiniERP.Dtos.Auth;

namespace MiniERP.Handlers;

public interface IAuthHandler
{
    /// <summary>
    /// Validates the supplied credentials. Returns the authenticated user's
    /// public details on success, or <c>null</c> when they are invalid.
    /// </summary>
    Task<CurrentUserResponse?> ValidateCredentialsAsync(LoginRequest request);
}
