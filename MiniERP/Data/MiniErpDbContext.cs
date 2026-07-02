using Microsoft.EntityFrameworkCore;

namespace MiniERP.Data;

public class MiniErpDbContext(DbContextOptions<MiniErpDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(product =>
        {
            product.Property(p => p.Name).HasMaxLength(200).IsRequired();
            product.Property(p => p.Price).HasColumnType("decimal(18,2)");
        });
    }
}
