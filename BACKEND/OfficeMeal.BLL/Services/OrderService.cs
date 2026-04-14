using Microsoft.EntityFrameworkCore;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public class OrderService : IOrderService
{
    private readonly OfficeMealContext _dbContext;

    public OrderService(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<OrderResponseViewModel> CreateOrderAsync(int customerId, CreateOrderViewModel model)
    {
        if (model.Items.Count == 0)
        {
            throw new InvalidOperationException("Order items cannot be empty.");
        }

        var foodIds = model.Items.Where(x => x.FoodId.HasValue).Select(x => x.FoodId!.Value).Distinct().ToList();
        var comboIds = model.Items.Where(x => x.ComboId.HasValue).Select(x => x.ComboId!.Value).Distinct().ToList();

        var foods = await _dbContext.Foods.Where(x => foodIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        var combos = await _dbContext.Combos.Where(x => comboIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);

        var details = new List<OrderDetail>();
        decimal total = 0;
        foreach (var item in model.Items)
        {
            if (item.Quantity <= 0 || (item.FoodId is null && item.ComboId is null))
            {
                continue;
            }

            decimal unitPrice = 0;
            if (item.FoodId.HasValue && foods.TryGetValue(item.FoodId.Value, out var food))
            {
                unitPrice = food.Price;
            }
            else if (item.ComboId.HasValue && combos.TryGetValue(item.ComboId.Value, out var combo))
            {
                unitPrice = combo.Price;
            }
            else
            {
                continue;
            }

            details.Add(new OrderDetail
            {
                FoodId = item.FoodId,
                ComboId = item.ComboId,
                Quantity = item.Quantity,
                UnitPrice = unitPrice
            });

            total += unitPrice * item.Quantity;
        }

        var order = new Order
        {
            CustomerId = customerId,
            OrderDate = DateTime.Now,
            TotalAmount = total,
            PaymentMethod = model.PaymentMethod,
            DeliveryAddress = model.DeliveryAddress,
            Note = model.Note,
            Status = OrderStatus.Pending,
            OrderDetails = details
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        var created = await QueryOrders().FirstAsync(x => x.OrderId == order.Id);
        return created;
    }

    public async Task<IReadOnlyList<OrderResponseViewModel>> GetOrdersAsync(string role, int userId)
    {
        var query = QueryOrders();

        if (string.Equals(role, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.CustomerId == userId);
        }
        else if (string.Equals(role, "KitchenManager", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status == OrderStatus.Pending || x.Status == OrderStatus.Preparing);
        }
        else if (string.Equals(role, "Shipper", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Status == OrderStatus.Ready || x.Status == OrderStatus.Shipping || x.Status == OrderStatus.Returned);
        }

        return await query.OrderByDescending(x => x.OrderDate).ToListAsync();
    }

    public async Task<OrderResponseViewModel?> UpdateStatusAsync(int orderId, OrderStatus newStatus, string role, int userId)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == orderId);
        if (order is null)
        {
            return null;
        }

        ValidateTransition(order, newStatus, role);

        order.Status = newStatus;
        if (string.Equals(role, "KitchenManager", StringComparison.OrdinalIgnoreCase))
        {
            order.KitchenStaffId = userId;
        }
        else if (string.Equals(role, "Shipper", StringComparison.OrdinalIgnoreCase))
        {
            order.ShipperId = userId;
        }

        await _dbContext.SaveChangesAsync();
        return await QueryOrders().FirstAsync(x => x.OrderId == orderId);
    }

    private IQueryable<OrderResponseViewModel> QueryOrders()
    {
        return _dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Customer)
            .Include(x => x.Shipper)
            .Include(x => x.OrderDetails)
                .ThenInclude(x => x.Food)
            .Include(x => x.OrderDetails)
                .ThenInclude(x => x.Combo)
            .Select(order => new OrderResponseViewModel
            {
                OrderId = order.Id,
                CustomerId = order.CustomerId,
                CustomerName = order.Customer != null ? order.Customer.FullName : "Unknown",
                OrderDate = order.OrderDate,
                TotalAmount = order.TotalAmount,
                PaymentMethod = order.PaymentMethod,
                Status = order.Status,
                DeliveryAddress = order.DeliveryAddress,
                Note = order.Note,
                ShipperId = order.ShipperId,
                ShipperName = order.Shipper != null ? order.Shipper.FullName : null,
                ShipperPhone = order.Shipper != null ? order.Shipper.Phone : null,
                Items = order.OrderDetails.Select(detail => new OrderItemResponseViewModel
                {
                    FoodId = detail.FoodId,
                    ComboId = detail.ComboId,
                    Quantity = detail.Quantity,
                    UnitPrice = detail.UnitPrice,
                    ItemName = detail.Food != null
                        ? detail.Food.Name
                        : (detail.Combo != null ? detail.Combo.Name : "Unknown")
                }).ToList()
            });
    }

    private static void ValidateTransition(Order order, OrderStatus nextStatus, string role)
    {
        if (string.Equals(role, "KitchenManager", StringComparison.OrdinalIgnoreCase))
        {
            if (!((order.Status == OrderStatus.Pending && nextStatus == OrderStatus.Preparing)
                || (order.Status == OrderStatus.Preparing && nextStatus == OrderStatus.Ready)))
            {
                throw new InvalidOperationException("Kitchen manager can only move Pending->Preparing or Preparing->Ready.");
            }
            return;
        }

        if (string.Equals(role, "Shipper", StringComparison.OrdinalIgnoreCase))
        {
            if (!((order.Status == OrderStatus.Ready && nextStatus == OrderStatus.Shipping)
                || (order.Status == OrderStatus.Shipping && nextStatus == OrderStatus.Completed)
                || (order.Status == OrderStatus.Shipping && nextStatus == OrderStatus.Returned)))
            {
                throw new InvalidOperationException("Shipper can only move Ready->Shipping or Shipping->Completed/Returned.");
            }
            return;
        }

        if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        throw new InvalidOperationException("This role cannot update order status.");
    }
}
