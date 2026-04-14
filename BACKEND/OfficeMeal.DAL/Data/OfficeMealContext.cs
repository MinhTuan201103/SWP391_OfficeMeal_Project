using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.DAL.Data;

public partial class OfficeMealContext : DbContext
{
    public OfficeMealContext(DbContextOptions<OfficeMealContext> options) : base(options)
    {
    }

    public virtual DbSet<Role> Roles => Set<Role>();
    public virtual DbSet<User> Users => Set<User>();
    public virtual DbSet<Category> Categories => Set<Category>();
    public virtual DbSet<Food> Foods => Set<Food>();
    public virtual DbSet<Combo> Combos => Set<Combo>();
    public virtual DbSet<ComboDetail> ComboDetails => Set<ComboDetail>();
    public virtual DbSet<DailyMenu> DailyMenus => Set<DailyMenu>();
    public virtual DbSet<Order> Orders => Set<Order>();
    public virtual DbSet<OrderDetail> OrderDetails => Set<OrderDetail>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("RoleId");
            entity.Property(e => e.Name).HasColumnName("RoleName");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("UserId");
            entity.Property(e => e.RoleId).HasColumnName("RoleId");
            entity.Property(e => e.Address).HasColumnName("Address");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt");
            entity.Property(e => e.IsActive).HasColumnName("IsActive");

            entity.HasOne(e => e.Role)
                .WithMany(e => e.Users)
                .HasForeignKey(e => e.RoleId);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("CategoryId");
            entity.Property(e => e.Name).HasColumnName("CategoryName");
            entity.Property(e => e.Description).HasColumnName("Description");
        });

        modelBuilder.Entity<Food>(entity =>
        {
            entity.ToTable("Foods");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("FoodId");
            entity.Property(e => e.CategoryId).HasColumnName("CategoryId");
            entity.Property(e => e.Name).HasColumnName("FoodName");
            entity.Property(e => e.ImageUrl).HasColumnName("ImageURL");
            entity.Property(e => e.IsActive).HasColumnName("IsActive");
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountPercent).HasColumnName("DiscountPercent").HasDefaultValue(0);

            entity.HasOne(e => e.Category)
                .WithMany(e => e.Foods)
                .HasForeignKey(e => e.CategoryId);
        });

        modelBuilder.Entity<Combo>(entity =>
        {
            entity.ToTable("Combos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("ComboId");
            entity.Property(e => e.Name).HasColumnName("ComboName");
            entity.Property(e => e.ImageUrl).HasColumnName("ImageURL");
            entity.Property(e => e.IsActive).HasColumnName("IsActive");
            entity.Property(e => e.Price).HasColumnType("decimal(18,2)");
            entity.Property(e => e.DiscountPercent).HasColumnName("DiscountPercent").HasDefaultValue(0);
        });

        modelBuilder.Entity<ComboDetail>(entity =>
        {
            entity.ToTable("ComboDetails");
            entity.HasKey(e => new { e.ComboId, e.FoodId });
            entity.Property(e => e.ComboId).HasColumnName("ComboId");
            entity.Property(e => e.FoodId).HasColumnName("FoodId");

            entity.HasOne(e => e.Combo)
                .WithMany(e => e.ComboDetails)
                .HasForeignKey(e => e.ComboId);

            entity.HasOne(e => e.Food)
                .WithMany(e => e.ComboDetails)
                .HasForeignKey(e => e.FoodId);
        });

        modelBuilder.Entity<DailyMenu>(entity =>
        {
            entity.ToTable("DailyMenus");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("MenuId");
            entity.Property(e => e.TargetId).HasColumnName("TargetId");
            entity.Property(e => e.TargetType).HasColumnName("TargetType").HasConversion<string>();
            entity.Property(e => e.DayOfWeek).HasColumnName("DayOfWeek");
            entity.Property(e => e.IsActive).HasColumnName("IsActive");
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("OrderId");
            entity.Property(e => e.CustomerId).HasColumnName("CustomerId");
            entity.Property(e => e.KitchenStaffId).HasColumnName("KitchenStaffId");
            entity.Property(e => e.ShipperId).HasColumnName("ShipperId");
            entity.Property(e => e.OrderDate).HasColumnName("OrderDate");
            entity.Property(e => e.TotalAmount).HasColumnName("TotalAmount").HasColumnType("decimal(18,2)");
            entity.Property(e => e.PaymentMethod).HasColumnName("PaymentMethod");
            entity.Property(e => e.DeliveryAddress).HasColumnName("DeliveryAddress");
            entity.Property(e => e.Note).HasColumnName("Note");
            entity.Property(e => e.Status).HasColumnName("Status").HasConversion<int>();

            entity.HasOne(e => e.Customer)
                .WithMany(e => e.CustomerOrders)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.KitchenStaff)
                .WithMany(e => e.KitchenOrders)
                .HasForeignKey(e => e.KitchenStaffId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Shipper)
                .WithMany(e => e.ShippingOrders)
                .HasForeignKey(e => e.ShipperId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderDetail>(entity =>
        {
            entity.ToTable("OrderDetails");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("OrderDetailId");
            entity.Property(e => e.OrderId).HasColumnName("OrderId");
            entity.Property(e => e.FoodId).HasColumnName("FoodId");
            entity.Property(e => e.ComboId).HasColumnName("ComboId");
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Order)
                .WithMany(e => e.OrderDetails)
                .HasForeignKey(e => e.OrderId);

            entity.HasOne(e => e.Food)
                .WithMany(e => e.OrderDetails)
                .HasForeignKey(e => e.FoodId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Combo)
                .WithMany(e => e.OrderDetails)
                .HasForeignKey(e => e.ComboId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
