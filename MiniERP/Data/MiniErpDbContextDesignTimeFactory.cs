using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MiniERP.Data;

// Lets `dotnet ef` construct the context at design time without the Aspire host or a
// live database. The connection string is a placeholder used only to configure the
// SQL Server provider; migrations are generated from the model and applied at runtime
// with the real Aspire-supplied connection.
public class MiniErpDbContextDesignTimeFactory : IDesignTimeDbContextFactory<MiniErpDbContext>
{
    public MiniErpDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<MiniErpDbContext>()
            .UseSqlServer("Server=localhost;Database=minierpdb;Trusted_Connection=True;TrustServerCertificate=True")
            .Options;

        return new MiniErpDbContext(options);
    }
}
