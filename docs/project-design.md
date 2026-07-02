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
| 4 | **REST-conform verbs on `CustomersController`** (`PUT /{id}` for update, `DELETE /{id}` for delete) | Replaces the stub's `POST`-only shape; makes the HTTP contract predictable and mirrors the planned Products refactor. |
| 5 | **`Product` owns its pricing and stock (single-tenant)** | `Price`, `CostPrice`, `MinimumStock` and `CurrentStock` live directly on `Product`. No per-customer product model — "low stock" is a plain product-level condition. |
| 6 | **Cookie authentication with two app-wide roles (`Admin`, `User`)** | Login issues an ASP.NET cookie (no full Identity stack); accounts are seeded. `Admin` has all CRUD, `User` is read-only. Roles are **global** — auth introduces no per-customer identity. Write endpoints require `Admin`; every business endpoint requires authentication. See §12. |

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
    return products.Select(p =>
        new ProductResponse(p.Id, p.Name, p.ArticleNumber, p.Price, p.CostPrice, p.MinimumStock, p.CurrentStock)).ToList();
}

public async Task<ProductResponse> CreateAsync(CreateProductRequest request)
{
    var entity = new Product
    {
        Name = request.Name, ArticleNumber = request.ArticleNumber,
        Price = request.Price, CostPrice = request.CostPrice,
        MinimumStock = request.MinimumStock, CurrentStock = request.CurrentStock,
    };
    var saved = await products.AddAsync(entity);
    return new ProductResponse(saved.Id, saved.Name, saved.ArticleNumber, saved.Price, saved.CostPrice, saved.MinimumStock, saved.CurrentStock);
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

> **Note.** `Product` carries `Id`, `Name`, `ArticleNumber` plus its own pricing and
> stock (`Price`, `CostPrice`, `MinimumStock`, `CurrentStock`) — single-tenant, no
> per-customer split. "Low stock" is a product-level condition (see §11).

## 7. Conventions

- **DTOs at the boundary.** Controllers/handlers exchange request/response DTOs
  (records); entities never leave the Service layer directly. This decouples the API
  contract from the database schema.
- **Async all the way.** Every I/O method is `async` and returns `Task`/`Task<T>`.
- **Naming.** `I{Feature}Handler` / `{Feature}Handler`, `I{Feature}Service` /
  `{Feature}Service`. Controllers are pluralized (`CustomersController`).
- **No cross-layer leaks.** No `DbContext` above the Service layer; no `IActionResult`
  below the Controller.
- **Schema is owned by EF Core migrations.** Entity/model changes are captured with
  `dotnet ef migrations add <Name>` and applied on startup via `Database.MigrateAsync()`
  (not `EnsureCreated`). A design-time `IDesignTimeDbContextFactory` lets the tooling run
  without the Aspire host. Reset a dev database with `docker volume rm minierp-sqldata`.

## 8. Fixes this design applies to current code

1. ✅ **Done.** `ProductsController` moves its EF query/`SaveChanges` down into
   `ProductService`, with a `ProductHandler` between them. The broken duplicate-`[HttpGet]`
   `LowStock` stub is replaced by `GET /products/low-stock/count`. See §11.
2. ✅ **Done.** `CustomerController` → `CustomersController` (pluralized); its empty
   methods are implemented through `CustomerHandler` → `CustomerService`; `Update`
   switches to `[HttpPut("{id}")]` and `Delete` to `[HttpDelete("{id}")]`.
3. ✅ **Done.** `Customer` is registered in `MiniErpDbContext` (`DbSet<Customer> Customers`)
   with a configuration block mirroring `Product`, and `Customer`'s reference-type
   properties are non-nullable (`= string.Empty`) to match the nullable-enabled project.

## 9. Explicitly out of scope

- **Testing** — no test project, no unit/integration tests, no mocking-only interfaces.
- MediatR / full CQRS — plain injected handlers are used; MediatR is a possible future
  evolution if operation-per-handler granularity is ever wanted.
- Self-service registration, user-management UI, and external identity providers (OIDC).
  Authentication itself is now **in scope and implemented** — see decision #6 and §12.

## 10. Customers slice (implemented 2026-07-02)

The first full vertical slice built on this architecture. Serves as the reference
implementation until Products is refactored to match.

### Endpoints (`CustomersController`, route `/customers`)

| Verb & route | Operation | Handler → Service | Response |
|---|---|---|---|
| `GET /customers?search=` | List, optionally filtered | `GetAllAsync(search)` | `200` + `CustomerResponse[]` |
| `GET /customers/count` | Customer count | `GetCountAsync()` | `200` + `int` |
| `POST /customers` | Create | `CreateAsync(CreateCustomerRequest)` | `201` + `CustomerResponse` |
| `PUT /customers/{id}` | Update | `UpdateAsync(id, UpdateCustomerRequest)` | `200` + `CustomerResponse`, or `404` |
| `DELETE /customers/{id}` | Delete | `DeleteAsync(id)` | `204`, or `404` |

- **Search filter** lives in `CustomerService`: on a non-empty `search`, a single
  `Where` OR-matches `Name`, `ContactName` and `Email` with `Contains` (case-insensitive
  via SQL Server's default collation). Empty/whitespace `search` returns the full list
  ordered by `Id`.
- **Count** uses `CountAsync()` — no rows shipped to the client.
- **DTOs** (`Dtos/Customers/`): `CustomerResponse`, `CreateCustomerRequest`,
  `UpdateCustomerRequest` (all records). The `id` for update comes from the route, not
  the body.
- **Validation:** all five fields are `[Required]`; `Email` also carries `[EmailAddress]`.
  Invalid bodies return `400` automatically via `[ApiController]`.

### Frontend (`MiniERP.Web`)

- **Customers page** (`/customers`): searchable list (250 ms debounced), a single "Klant
  toevoegen" button, and per-row Wijzig/Verwijder actions. Delete asks for confirmation.
- **`CustomerForm`** is one reusable component used for both create and edit; on edit it
  is pre-filled with the selected customer and shown in a modal.
- **Dashboard widget** fetches `GET /customers/count` and shows the total with its own
  loading/error state.

## 11. Products slice (implemented 2026-07-02)

Refactors Products onto the layered architecture and surfaces its pricing/stock
(decision #5). Mirrors the Customers slice. Single-tenant — no `CustomerProduct`.

### Entity & persistence

- `Product` = `Id, Name, ArticleNumber, Price, CostPrice, MinimumStock (int?),
  CurrentStock`. `Name` and `ArticleNumber` have max-length config; the rest are plain
  columns. No join entity.

### Endpoints (`ProductsController`, route `/products`)

| Verb & route | Operation | Handler → Service | Response |
|---|---|---|---|
| `GET /products` | List all products | `GetAllAsync()` | `200` + `ProductResponse[]` |
| `GET /products/low-stock/count` | Count of low-stock products | `GetLowStockCountAsync()` | `200` + `int` |
| `POST /products` | Create | `CreateAsync(CreateProductRequest)` | `201` + `ProductResponse` |
| `PUT /products/{id}` | Update | `UpdateAsync(id, UpdateProductRequest)` | `200` + `ProductResponse`, or `404` |
| `DELETE /products/{id}` | Delete | `DeleteAsync(id)` | `204`, or `404` |

- **Low-stock rule** lives in `ProductService`: a `CountAsync` over `Products` where
  `MinimumStock != null && CurrentStock <= MinimumStock`. Products without a minimum have
  no threshold and are excluded. No rows shipped to the client.
- **DTOs** (`Dtos/Products/`): `ProductResponse`, `CreateProductRequest`,
  `UpdateProductRequest` (records) carrying all fields. `Name` and `ArticleNumber` are
  `[Required]`; `MinimumStock` is optional (nullable); the `id` for update comes from the
  route.

### Frontend (`MiniERP.Web`)

- **Products page** (`/products`): list of Naam, Artikelnummer, Prijs and Voorraad (low
  rows flagged), a single "Product toevoegen" button, and per-row Wijzig/Verwijder
  actions. Delete asks for confirmation.
- **`ProductForm`** is one reusable component used for both create and edit (name, article
  number, price, cost price, current and minimum stock), shown in a modal (mirrors
  `CustomerForm`).
- **Dashboard** gains a "Lage voorraad" widget fetching `GET /products/low-stock/count`
  (own loading/error state) and a "Producten beheren" button that navigates to `/products`.

## 12. Auth slice (implemented 2026-07-02)

Adds cookie authentication and two global roles (decision #6). Follows the same
Controller → Handler → Service layering as the other slices.

### Entity & persistence

- `User` = `Id, Username, PasswordHash, Role`. Registered as `DbSet<User> Users` with a
  unique index on `Username`; `Role` holds a `Roles` constant (`"Admin"` / `"User"`).
- **Seeding** (`Program.cs`, alongside the Product/Customer seeds): one `admin`/`admin`
  (Admin) and one `user`/`user` (User). Passwords are hashed with `IPasswordHasher<User>`;
  the credentials are well-known dev defaults only.

### Endpoints (`AuthController`, route `/auth`)

| Verb & route | Operation | Handler → Service | Response |
|---|---|---|---|
| `POST /auth/login` | Authenticate, set cookie | `ValidateCredentialsAsync(LoginRequest)` | `200` + `CurrentUserResponse`, or `401` |
| `POST /auth/logout` | Clear cookie | — (controller `SignOutAsync`) | `204` (auth required) |
| `GET /auth/me` | Current user from claims | — (reads `User` claims) | `200` + `CurrentUserResponse`, or `401` |

- **`AuthHandler`** looks up the user via `IUserService` and verifies the hash; it returns
  a `CurrentUserResponse` or `null`. Building the `ClaimsPrincipal` and `SignInAsync` /
  `SignOutAsync` stay in the controller (HTTP/auth-scheme concern), keeping the handler
  HTTP-free.
- **DTOs** (`Dtos/Auth/`): `LoginRequest` (both fields `[Required]`) and
  `CurrentUserResponse` (records).

### Authorization & pipeline

- **Cookie scheme** (`AddCookie`): `HttpOnly`, `SameSite=Lax`, `SecurePolicy=SameAsRequest`,
  8 h sliding expiration, cookie name `MiniERP.Auth`. `OnRedirectToLogin` /
  `OnRedirectToAccessDenied` are overridden to return **401 / 403** instead of HTML
  redirects (this is a SPA API). `app.UseAuthentication()` runs before `UseAuthorization()`.
- **Enforcement:** `ProductsController` and `CustomersController` carry a class-level
  `[Authorize]` (any authenticated user may read); their `POST`/`PUT`/`DELETE` actions add
  `[Authorize(Roles = Roles.Admin)]`. `AuthController.Login` is `[AllowAnonymous]`.
  Enforcement is per-controller rather than a global fallback policy so Aspire's health-check
  and OpenAPI endpoints stay anonymous.
- **CORS:** cookie auth needs credentialed CORS, which is incompatible with
  `AllowAnyOrigin()`. Because Aspire assigns the frontend port dynamically, the policy
  reflects the request origin (`SetIsOriginAllowed(_ => true).AllowCredentials()`); a
  production build would pin the real origin(s).

### Frontend (`MiniERP.Web`)

- **`api.ts`** — central fetch helpers that always send the cookie (`credentials:'include'`).
  `api()` turns a `401` into a typed `UnauthorizedError` and notifies the auth layer;
  `apiRaw()` is used by the auth flows that treat `401` as a normal outcome.
- **`AuthContext`** — restores the session on load via `GET /auth/me`, exposes
  `user`, `isAdmin`, `login`, `logout`. A `401` from any protected call clears the session,
  dropping the app to the login screen.
- **Login page** (`/login`): username/password form; on success the app renders the
  authenticated shell.
- **`App`** gates routing: unauthenticated users only reach `/login`; authenticated users
  get the nav (with username, role, and a logout button) and the three pages.
- **Role gating:** the Products and Customers pages hide the "toevoegen" button and the
  per-row Wijzig/Verwijder actions (and the actions column) unless `isAdmin`. The API is
  the real gate; the UI mirrors it.
