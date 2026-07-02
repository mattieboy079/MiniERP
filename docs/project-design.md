# MiniERP — Project Design

**Status:** Proposed · **Date:** 2026-07-02

## 1. Purpose

Establish a consistent, layered architecture for the MiniERP backend so that every
feature (Products, Customers, and anything added later) is built the same way. The
design fixes the current inconsistencies where `ProductsController` talks directly to
the `DbContext` and `CustomerController` is an empty, half-wired stub.

## 2. Guiding decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Layering is **Controller → Handler → Service** | A single, predictable call flow for every endpoint. |
| 2 | **Constructor dependency injection** everywhere | No `new`-ing dependencies; the DI container owns lifetimes. |
| 3 | **No test project / no tests** | Explicit project constraint. Interfaces exist only for DI clarity and swappability — never solely as test seams. |

## 3. Layer responsibilities

The three layers form a strict one-directional dependency chain. A layer may only call
the layer directly beneath it.

```
HTTP request
   │
   ▼
┌─────────────┐   thin HTTP adapter: route, model-bind, call handler,
│ Controller  │   translate result → IActionResult (status codes).
└─────────────┘   No business logic. No DbContext.
   │ calls
   ▼
┌─────────────┐   use-case orchestration: validate input, map DTO ⇄ entity,
│  Handler    │   coordinate one or more services, shape the response DTO.
└─────────────┘   No HTTP types (no ControllerBase, no IActionResult). No EF queries.
   │ calls
   ▼
┌─────────────┐   domain + persistence for one aggregate: EF Core queries,
│  Service    │   SaveChanges, entity-level rules. Returns entities.
└─────────────┘
   │ uses
   ▼
   MiniErpDbContext (EF Core / SQL Server via Aspire)
```

### Controller
- Owns HTTP concerns only: routing, attributes, model binding, `IActionResult` and
  status codes.
- Injects **one handler** per feature and delegates immediately.
- Contains **no** business logic and **never** touches `MiniErpDbContext`.

### Handler
- The application / use-case layer — one handler class per feature area
  (`ProductHandler`, `CustomerHandler`) exposing one method per operation.
- Responsibilities: input validation, mapping between **DTOs** and **entities**,
  orchestrating calls to one or more services, and building the response DTO.
- Knows nothing about HTTP (no `ControllerBase`, no `IActionResult`) and issues no EF
  queries of its own. Returns plain results / DTOs (or throws a domain exception).

### Service
- Encapsulates persistence and entity-level rules for a single aggregate.
- The **only** layer that uses `MiniErpDbContext` — all EF Core queries and
  `SaveChangesAsync` live here.
- Returns entities (or `null` / booleans); it does not know about DTOs.

> **Why a Handler *and* a Service?** The Service is reusable data-access for one entity.
> The Handler is where a use case is composed — e.g. "create an order" may read a
> Product and a Customer via two services, apply a rule, then persist. Keeping that
> orchestration out of both the Controller and the Service keeps each layer single-purpose.

## 4. Proposed folder structure

```
MiniERP/
├── Controllers/
│   ├── ProductsController.cs
│   └── CustomersController.cs
├── Handlers/
│   ├── IProductHandler.cs
│   ├── ProductHandler.cs
│   ├── ICustomerHandler.cs
│   └── CustomerHandler.cs
├── Services/
│   ├── IProductService.cs
│   ├── ProductService.cs
│   ├── ICustomerService.cs
│   └── CustomerService.cs
├── Dtos/
│   ├── Products/
│   │   ├── ProductResponse.cs
│   │   ├── CreateProductRequest.cs
│   │   └── UpdateProductRequest.cs
│   └── Customers/
│       ├── CustomerResponse.cs
│       ├── CreateCustomerRequest.cs
│       └── UpdateCustomerRequest.cs
├── Data/
│   ├── MiniErpDbContext.cs
│   ├── Product.cs
│   └── Customer.cs
├── Extensions/
│   └── ServiceCollectionExtensions.cs   ← DI registration lives here
└── Program.cs
```

## 5. Dependency injection

All handlers and services are registered as **scoped** (matching the EF Core
`DbContext` scope per request) via one extension method, keeping `Program.cs` clean.

```csharp
// Extensions/ServiceCollectionExtensions.cs
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Handlers (use-case layer)
        services.AddScoped<IProductHandler, ProductHandler>();
        services.AddScoped<ICustomerHandler, CustomerHandler>();

        // Services (persistence layer)
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<ICustomerService, CustomerService>();

        return services;
    }
}
```

```csharp
// Program.cs (excerpt)
builder.Services.AddControllers();
builder.AddSqlServerDbContext<MiniErpDbContext>("minierpdb");
builder.Services.AddApplicationServices();   // ← single line wires the whole app
```

Dependencies flow in via **primary constructors**, consistent with the existing
`ProductsController(MiniErpDbContext db)` and `MiniErpDbContext` styles:

```csharp
[ApiController]
[Route("[controller]")]
public class ProductsController(IProductHandler handler) : ControllerBase { /* ... */ }

public class ProductHandler(IProductService products) : IProductHandler { /* ... */ }

public class ProductService(MiniErpDbContext db) : IProductService { /* ... */ }
```

**Lifetimes:** everything scoped. Nothing is singleton (services close over the
request-scoped `DbContext`). No manual `new`, no service-locator (`GetRequiredService`)
outside of composition-root code like the startup seeding block.

## 6. Reference vertical slice (Products)

```csharp
// Controller — HTTP only
[HttpGet]
public async Task<IActionResult> GetAll()
    => Ok(await handler.GetAllAsync());

[HttpPost]
public async Task<IActionResult> Create(CreateProductRequest request)
{
    var created = await handler.CreateAsync(request);
    return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
}
```

```csharp
// Handler — validate, map, orchestrate
public async Task<IReadOnlyList<ProductResponse>> GetAllAsync()
{
    var products = await products.GetAllAsync();
    return products.Select(p => new ProductResponse(p.Id, p.Name, p.Price, p.Stock)).ToList();
}

public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
{
    var entity = new Product { Name = request.Name, Price = request.Price, Stock = request.Stock };
    var saved = await products.AddAsync(entity);
    return new ProductResponse(saved.Id, saved.Name, saved.Price, saved.Stock);
}
```

```csharp
// Service — EF Core only
public async Task<IReadOnlyList<Product>> GetAllAsync()
    => await db.Products.OrderBy(p => p.Id).ToListAsync();

public async Task<Product> AddAsync(Product product)
{
    db.Products.Add(product);
    await db.SaveChangesAsync();
    return product;
}
```

## 7. Conventions

- **DTOs at the boundary.** Controllers/handlers exchange request/response DTOs
  (records); entities never leave the Service layer directly. This decouples the API
  contract from the database schema.
- **Async all the way.** Every I/O method is `async` and returns `Task`/`Task<T>`.
- **Naming.** `I{Feature}Handler` / `{Feature}Handler`, `I{Feature}Service` /
  `{Feature}Service`. Controllers are pluralized (`CustomersController`).
- **No cross-layer leaks.** No `DbContext` above the Service layer; no `IActionResult`
  below the Controller.

## 8. Fixes this design applies to current code

1. `ProductsController` moves its EF query/`SaveChanges` down into `ProductService`,
   with a `ProductHandler` between them.
2. `CustomerController`'s empty methods get implemented through
   `CustomerHandler` → `CustomerService`, and `Delete` switches from `[HttpPost("{id}")]`
   to `[HttpDelete("{id}")]`.
3. `Customer` is registered in `MiniErpDbContext` (`DbSet<Customer> Customers`) with a
   configuration block mirroring `Product`, and `Customer`'s reference-type properties
   are made non-nullable/required to match the nullable-enabled project.

## 9. Explicitly out of scope

- **Testing** — no test project, no unit/integration tests, no mocking-only interfaces.
- MediatR / full CQRS — plain injected handlers are used; MediatR is a possible future
  evolution if operation-per-handler granularity is ever wanted.
- Authentication/authorization beyond the existing pipeline placeholder.
```
