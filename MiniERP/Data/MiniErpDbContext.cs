using Microsoft.EntityFrameworkCore;

namespace MiniERP.Data;

public class MiniErpDbContext(DbContextOptions<MiniErpDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Quote> Quotes => Set<Quote>();
    public DbSet<QuoteLine> QuoteLines => Set<QuoteLine>();

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

        modelBuilder.Entity<Quote>(quote =>
        {
            quote.Property(q => q.CustomerName).HasMaxLength(200).IsRequired();

            // The customer link may be severed on delete; the snapshotted name keeps the
            // quote a self-contained document.
            quote.HasOne(q => q.Customer)
                .WithMany()
                .HasForeignKey(q => q.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            // Lines are owned by the quote: removing the quote removes its lines.
            quote.HasMany(q => q.Lines)
                .WithOne(l => l.Quote)
                .HasForeignKey(l => l.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QuoteLine>(line =>
        {
            line.Property(l => l.ProductName).HasMaxLength(200).IsRequired();
            line.Property(l => l.ArticleNumber).HasMaxLength(100).IsRequired();

            // Same as the customer link: a deleted product nulls the reference but the
            // snapshotted name/article/price on the line remain.
            line.HasOne(l => l.Product)
                .WithMany()
                .HasForeignKey(l => l.ProductId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
