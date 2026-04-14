using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.ViewModels;

public class CreateOrderItemViewModel
{
    public int? FoodId { get; set; }
    public int? ComboId { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderViewModel
{
    public string DeliveryAddress { get; set; } = string.Empty;
    public string? Note { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public List<CreateOrderItemViewModel> Items { get; set; } = new();
}

public class UpdateOrderStatusViewModel
{
    public OrderStatus Status { get; set; }
}

public class ConfirmOrderPaymentViewModel
{
    public string Provider { get; set; } = string.Empty;
    public string? TransactionCode { get; set; }
}

public class OrderItemResponseViewModel
{
    public int? FoodId { get; set; }
    public int? ComboId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class OrderResponseViewModel
{
    public int OrderId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public OrderStatus Status { get; set; }
    public string? DeliveryAddress { get; set; }
    public string? Note { get; set; }
    public int? ShipperId { get; set; }
    public string? ShipperName { get; set; }
    public string? ShipperPhone { get; set; }
    public List<OrderItemResponseViewModel> Items { get; set; } = new();
}
