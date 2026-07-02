using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MiniERP.Data;
using MiniERP.Extensions;
using MiniERP.Security;

var builder = WebApplication.CreateBuilder(args);

// Aspire service defaults (telemetry, health checks, service discovery).
builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// SQL Server connection wired up by Aspire (connection name "minierpdb").
builder.AddSqlServerDbContext<MiniErpDbContext>("minierpdb");

// Handlers and services (Controller -> Handler -> Service layering).
builder.Services.AddApplicationServices();

// Cookie authentication. This is an API for a SPA, so unauthenticated /
// forbidden requests return status codes rather than redirecting to an HTML
// login page.
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "MiniERP.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

// The SPA sends the auth cookie cross-origin, which requires credentialed CORS.
// AllowCredentials() is incompatible with AllowAnyOrigin(); the frontend port is
// assigned dynamically by Aspire, so we reflect the request origin instead of
// pinning a fixed list (a production build would pin the real origin(s)).
const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCors, policy =>
        policy.SetIsOriginAllowed(_ => true).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(FrontendCors);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map Aspire health check endpoints.
app.MapDefaultEndpoints();

// Apply EF Core migrations (creates the database if absent) and seed some sample
// data (development convenience).
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MiniErpDbContext>();
    await db.Database.MigrateAsync();

    if (!await db.Products.AnyAsync())
    {
        // Two of these are at/below their minimum, so the dashboard low-stock widget
        // has something to show.
        db.Products.AddRange(
            new Product { Name = "Widget", ArticleNumber = "WID-001", Price = 19.99, CostPrice = 12.00, MinimumStock = 10, CurrentStock = 3 },
            new Product { Name = "Gadget", ArticleNumber = "GAD-001", Price = 49.50, CostPrice = 30.00, MinimumStock = 5, CurrentStock = 5 },
            new Product { Name = "Gizmo", ArticleNumber = "GIZ-001", Price = 9.95, CostPrice = 6.00, MinimumStock = 20, CurrentStock = 50 });
        await db.SaveChangesAsync();
    }

    if (!await db.Customers.AnyAsync())
    {
        db.Customers.AddRange(
            new Customer { Name = "Acme Corp", ContactName = "John Doe", Email = "john@acme.example", Phone = "010-1234567", Address = "Dorpsstraat 1, Amsterdam" },
            new Customer { Name = "Globex BV", ContactName = "Jane Smith", Email = "jane@globex.example", Phone = "020-7654321", Address = "Kerkweg 42, Rotterdam" },
            new Customer { Name = "Initech", ContactName = "Bill Lumbergh", Email = "bill@initech.example", Phone = "030-5551212", Address = "Industrieweg 7, Utrecht" });
        await db.SaveChangesAsync();
    }

    // Seed one account per role. Dev convenience only — passwords are hashed but
    // the credentials (admin/admin, user/user) are well-known.
    if (!await db.Users.AnyAsync())
    {
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        var admin = new User { Username = "admin", Role = Roles.Admin };
        admin.PasswordHash = hasher.HashPassword(admin, "admin");

        var user = new User { Username = "user", Role = Roles.User };
        user.PasswordHash = hasher.HashPassword(user, "user");

        db.Users.AddRange(admin, user);
        await db.SaveChangesAsync();
    }

    // One sample quote so the dashboard "Offertes" widget has something to show. Prices
    // are snapshotted from the seeded products, exactly as the create flow does.
    if (!await db.Quotes.AnyAsync())
    {
        var customer = await db.Customers.OrderBy(c => c.Id).FirstOrDefaultAsync();
        var sampleProducts = await db.Products.OrderBy(p => p.Id).Take(2).ToListAsync();

        if (customer is not null && sampleProducts.Count > 0)
        {
            var now = DateTime.UtcNow;
            db.Quotes.Add(new Quote
            {
                CustomerId = customer.Id,
                CustomerName = customer.Name,
                CreatedDate = now,
                ValidUntil = now.AddDays(30),
                OverallDiscountPercent = 0,
                VatRate = 21,
                Lines = sampleProducts.Select((p, i) => new QuoteLine
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    ArticleNumber = p.ArticleNumber,
                    UnitPrice = p.Price,
                    Quantity = i + 1,
                    LineDiscountPercent = 0,
                }).ToList(),
            });
            await db.SaveChangesAsync();
        }
    }
}

app.Run();
