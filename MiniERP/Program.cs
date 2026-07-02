using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

var builder = WebApplication.CreateBuilder(args);

// Aspire service defaults (telemetry, health checks, service discovery).
builder.AddServiceDefaults();

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// SQL Server connection wired up by Aspire (connection name "minierpdb").
builder.AddSqlServerDbContext<MiniErpDbContext>("minierpdb");

const string FrontendCors = "frontend";
builder.Services.AddCors(options =>
    options.AddPolicy(FrontendCors, policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(FrontendCors);

app.UseAuthorization();

app.MapControllers();

// Map Aspire health check endpoints.
app.MapDefaultEndpoints();

// Ensure the database exists and seed some sample data (development convenience).
await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<MiniErpDbContext>();
    await db.Database.EnsureCreatedAsync();

    if (!await db.Products.AnyAsync())
    {
        db.Products.AddRange(
            new Product { Name = "Widget", Price = 9.99m, Stock = 100 },
            new Product { Name = "Gadget", Price = 19.95m, Stock = 42 },
            new Product { Name = "Gizmo", Price = 4.50m, Stock = 250 });
        await db.SaveChangesAsync();
    }
}

app.Run();
