using Microsoft.AspNetCore.Identity;
using MiniERP.Data;
using MiniERP.Dtos.Auth;
using MiniERP.Services;

namespace MiniERP.Handlers;

public class AuthHandler(IUserService users, IPasswordHasher<User> passwordHasher) : IAuthHandler
{
    public async Task<CurrentUserResponse?> ValidateCredentialsAsync(LoginRequest request)
    {
        var user = await users.FindByUsernameAsync(request.Username);
        if (user is null)
            return null;

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
            return null;

        return new CurrentUserResponse(user.Username, user.Role);
    }
}
