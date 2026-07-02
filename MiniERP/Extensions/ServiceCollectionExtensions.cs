using Microsoft.AspNetCore.Identity;
using MiniERP.Data;
using MiniERP.Handlers;
using MiniERP.Services;

namespace MiniERP.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Handlers (use-case layer)
        services.AddScoped<IProductHandler, ProductHandler>();
        services.AddScoped<ICustomerHandler, CustomerHandler>();
        services.AddScoped<IAuthHandler, AuthHandler>();

        // Services (persistence layer)
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICustomerService, CustomerService>();
        services.AddScoped<IUserService, UserService>();

        // Stateless framework helper for password hashing/verification.
        // Singleton is idiomatic here (it holds no request state).
        services.AddSingleton<IPasswordHasher<User>, PasswordHasher<User>>();

        return services;
    }
}
