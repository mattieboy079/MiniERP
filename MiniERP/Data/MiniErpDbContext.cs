using Microsoft.EntityFrameworkCore;

namespace MiniERP.Data;

public class MiniErpDbContext(DbContextOptions<MiniErpDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(product =>
        {
            product.Property(p => p.Name).HasMaxLength(200).IsRequired();
            product.Property(p => p.ArticleNumber).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Customer>(customer =>
        {
            customer.Property(c => c.Name).HasMaxLength(200).IsRequired();
            customer.Property(c => c.ContactName).HasMaxLength(200).IsRequired();
            customer.Property(c => c.Email).HasMaxLength(256).IsRequired();
            customer.Property(c => c.Phone).HasMaxLength(50).IsRequired();
            customer.Property(c => c.Address).HasMaxLength(500).IsRequired();
        });

        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Username).HasMaxLength(100).IsRequired();
            user.HasIndex(u => u.Username).IsUnique();
            user.Property(u => u.PasswordHash).IsRequired();
            user.Property(u => u.Role).HasMaxLength(50).IsRequired();
        });
    }
}
