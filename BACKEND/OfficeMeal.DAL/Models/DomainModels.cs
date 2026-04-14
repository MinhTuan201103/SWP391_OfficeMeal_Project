namespace OfficeMeal.DAL.Models;

public enum OrderStatus
{
    Pending = 0,
    Preparing = 1,
    Ready = 2,
    Shipping = 3,
    Completed = 4,
    Cancelled = 5,
    Returned = 6
}

public enum DailyMenuTargetType
{
    Food,
    Combo
}

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public ICollection<User> Users { get; set; } = new List<User>();
}

public class User
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
    public Role? Role { get; set; }
    public ICollection<Order> CustomerOrders { get; set; } = new List<Order>();
    public ICollection<Order> KitchenOrders { get; set; } = new List<Order>();
    public ICollection<Order> ShippingOrders { get; set; } = new List<Order>();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<Food> Foods { get; set; } = new List<Food>();
}

public class Food
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DiscountPercent { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public Category? Category { get; set; }
    public ICollection<ComboDetail> ComboDetails { get; set; } = new List<ComboDetail>();
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}

public class Combo
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int DiscountPercent { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public ICollection<ComboDetail> ComboDetails { get; set; } = new List<ComboDetail>();
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}

public class ComboDetail
{
    public int ComboId { get; set; }
    public int FoodId { get; set; }
    public int Quantity { get; set; }
    public Combo? Combo { get; set; }
    public Food? Food { get; set; }
}

public class DailyMenu
{
    public int Id { get; set; }
    public int TargetId { get; set; }
    public DailyMenuTargetType TargetType { get; set; }
    public int DayOfWeek { get; set; }
    public bool IsActive { get; set; }
}

public class Order
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public int? KitchenStaffId { get; set; }
    public int? ShipperId { get; set; }
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public OrderStatus Status { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Note { get; set; }
    public User? Customer { get; set; }
    public User? KitchenStaff { get; set; }
    public User? Shipper { get; set; }
    public ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();
}

public class OrderDetail
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? FoodId { get; set; }
    public int? ComboId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public Order? Order { get; set; }
    public Food? Food { get; set; }
    public Combo? Combo { get; set; }
}
