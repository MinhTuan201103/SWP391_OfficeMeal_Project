using System.Data;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public class OrderService : IOrderService
{
    private readonly OfficeMealContext _dbContext;
    private readonly IVnPayService _vnPayService;
    private readonly IConfiguration _configuration;

    public OrderService(OfficeMealContext dbContext, IVnPayService vnPayService, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _vnPayService = vnPayService;
        _configuration = configuration;
    }

    public async Task<VnPayPaymentResponseViewModel> CreateVnPayOrderAsync(int customerId, CreateOrderViewModel model)
    {
        var paymentMethod = (model.PaymentMethod ?? string.Empty).Trim().ToLowerInvariant();
        if (paymentMethod != "vnpay")
        {
            throw new InvalidOperationException("Only vnpay supported for this method.");
        }
        if (string.IsNullOrWhiteSpace(model.DeliveryAddress))
        {
            throw new InvalidOperationException("Delivery address is required.");
        }
        if (model.Items.Count == 0)
        {
            throw new InvalidOperationException("Order items cannot be empty.");
        }

        var customer = await _dbContext.Users.FindAsync(customerId);
        if (customer == null)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        var foodIds = model.Items.Where(x => x.FoodId.HasValue).Select(x => x.FoodId!.Value).Distinct().ToList();
        var comboIds = model.Items.Where(x => x.ComboId.HasValue).Select(x => x.ComboId!.Value).Distinct().ToList();

        var foods = await _dbContext.Foods.Where(x => foodIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        var combos = await _dbContext.Combos
            .Include(x => x.ComboDetails)
                .ThenInclude(x => x.Food)
            .Where(x => comboIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        var details = new List<OrderDetail>();
        decimal total = 0;
        foreach (var item in model.Items)
        {
            if (item.Quantity <= 0 || (item.FoodId is null && item.ComboId is null))
            {
                continue;
            }
            if (item.FoodId.HasValue && item.ComboId.HasValue)
            {
                continue;
            }

            decimal unitPrice = 0;
            if (item.FoodId.HasValue && foods.TryGetValue(item.FoodId.Value, out var food))
            {
                if (!food.IsActive)
                {
                    continue;
                }
                unitPrice = Math.Round(food.Price * (100 - food.DiscountPercent) / 100m, 2);
            }
            else if (item.ComboId.HasValue && combos.TryGetValue(item.ComboId.Value, out var combo))
            {
                var comboSellable = combo.IsActive && combo.ComboDetails.All(x => x.Food != null && x.Food.IsActive);
                if (!comboSellable)
                {
                    continue;
                }
                unitPrice = Math.Round(combo.Price * (100 - combo.DiscountPercent) / 100m, 2);
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

        if (details.Count == 0)
        {
            throw new InvalidOperationException("Order has no valid items.");
        }

        var order = new Order
        {
            CustomerId = customerId,
            OrderDate = DateTime.Now,
            TotalAmount = total,
            PaymentMethod = "vnpay",
            DeliveryAddress = model.DeliveryAddress.Trim(),
            Note = string.IsNullOrWhiteSpace(model.Note) ? null : model.Note.Trim(),
            Status = OrderStatus.PendingPayment,
            OrderDetails = details
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        var paymentInfo = new PaymentInformationModel
        {
            OrderId = order.Id,
            Amount = total,
            OrderDescription = $"Thanh toan don hang #{order.Id} - {customer.FullName}",
            CustomerFullName = customer.FullName,
            ReturnUrl = _configuration["Vnpay:BackendReturnUrl"],
            IpnUrl = _configuration["Vnpay:IpnUrl"]
        };

        var paymentUrl = await _vnPayService.CreatePaymentUrlAsync(paymentInfo);

        return new VnPayPaymentResponseViewModel
        {
            PaymentUrl = paymentUrl,
            OrderId = order.Id,
            TxnRef = paymentInfo.OrderId.ToString(CultureInfo.InvariantCulture),
            Amount = total
        };
    }

    public async Task<OrderResponseViewModel> CreateOrderAsync(int customerId, CreateOrderViewModel model)
    {
        var allowedPayments = new[] { "cash", "momo", "VNPay" };
        var paymentMethod = (model.PaymentMethod ?? string.Empty).Trim();
        if (!allowedPayments.Contains(paymentMethod.ToLowerInvariant()))
        {
            throw new InvalidOperationException("Unsupported payment method for this method (use CreateVnPayOrderAsync for vnpay).");
        }

        if (string.IsNullOrWhiteSpace(model.DeliveryAddress))
        {
            throw new InvalidOperationException("Delivery address is required.");
        }
        if (model.Items.Count == 0)
        {
            throw new InvalidOperationException("Order items cannot be empty.");
        }

        var foodIds = model.Items.Where(x => x.FoodId.HasValue).Select(x => x.FoodId!.Value).Distinct().ToList();
        var comboIds = model.Items.Where(x => x.ComboId.HasValue).Select(x => x.ComboId!.Value).Distinct().ToList();

        var foods = await _dbContext.Foods.Where(x => foodIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id);
        var combos = await _dbContext.Combos
            .Include(x => x.ComboDetails)
                .ThenInclude(x => x.Food)
            .Where(x => comboIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id);

        var details = new List<OrderDetail>();
        decimal total = 0;
        foreach (var item in model.Items)
        {
            if (item.Quantity <= 0 || (item.FoodId is null && item.ComboId is null))
            {
                continue;
            }
            if (item.FoodId.HasValue && item.ComboId.HasValue)
            {
                continue;
            }

            decimal unitPrice = 0;
            if (item.FoodId.HasValue && foods.TryGetValue(item.FoodId.Value, out var food))
            {
                if (!food.IsActive)
                {
                    continue;
                }
                unitPrice = Math.Round(food.Price * (100 - food.DiscountPercent) / 100m, 2);
            }
            else if (item.ComboId.HasValue && combos.TryGetValue(item.ComboId.Value, out var combo))
            {
                var comboSellable = combo.IsActive && combo.ComboDetails.All(x => x.Food != null && x.Food.IsActive);
                if (!comboSellable)
                {
                    continue;
                }
                unitPrice = Math.Round(combo.Price * (100 - combo.DiscountPercent) / 100m, 2);
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

        if (details.Count == 0)
        {
            throw new InvalidOperationException("Order has no valid items.");
        }

        var order = new Order
        {
            CustomerId = customerId,
            OrderDate = DateTime.Now,
            TotalAmount = total,
            PaymentMethod = paymentMethod,
            DeliveryAddress = model.DeliveryAddress.Trim(),
            Note = string.IsNullOrWhiteSpace(model.Note) ? null : model.Note.Trim(),
            Status = OrderStatus.Pending,
            OrderDetails = details
        };

        _dbContext.Orders.Add(order);
        await _dbContext.SaveChangesAsync();

        var created = await QueryOrders().FirstAsync(x => x.OrderId == order.Id);
        return created;
    }

    public async Task<VnPayConfirmResponseViewModel> ConfirmVnPayPaymentAsync(string queryString)
    {
        var response = await _vnPayService.VerifyPaymentAsync(queryString);
        if (response == null)
        {
            return new VnPayConfirmResponseViewModel { Success = false, Message = "Invalid signature or payload." };
        }

        if (!response.Success)
        {
            return new VnPayConfirmResponseViewModel
            {
                Success = false,
                Message = $"VNPay declined (code: {response.ResponseCode})."
            };
        }

        if (!int.TryParse(response.TxnRef, NumberStyles.Integer, CultureInfo.InvariantCulture, out var orderId))
        {
            return new VnPayConfirmResponseViewModel { Success = false, Message = "Invalid order ID." };
        }

        var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == orderId);
        if (order == null)
        {
            return new VnPayConfirmResponseViewModel { Success = false, Message = "Order not found." };
        }

        var txNote = string.IsNullOrWhiteSpace(response.TransactionNo)
            ? string.Empty
            : $"VNPay TX:{response.TransactionNo}";

        if (order.Status == OrderStatus.Pending)
        {
            if (!string.IsNullOrEmpty(txNote) && order.Note?.Contains(txNote, StringComparison.Ordinal) == true)
            {
                return new VnPayConfirmResponseViewModel
                {
                    Success = true,
                    Message = "Payment already confirmed.",
                    OrderId = orderId,
                    TransactionId = response.TransactionNo
                };
            }
        }

        if (order.Status != OrderStatus.PendingPayment)
        {
            return new VnPayConfirmResponseViewModel
            {
                Success = false,
                Message = "Order is not awaiting VNPay payment."
            };
        }

        if (response.Amount > 0m)
        {
            var expected = Math.Round(order.TotalAmount, 2, MidpointRounding.AwayFromZero);
            var paid = Math.Round(response.Amount, 2, MidpointRounding.AwayFromZero);
            if (Math.Abs(paid - expected) > 0.01m)
            {
                return new VnPayConfirmResponseViewModel { Success = false, Message = "Paid amount does not match order total." };
            }
        }

        order.Status = OrderStatus.Pending;
        order.Note = string.IsNullOrWhiteSpace(order.Note)
            ? txNote
            : (string.IsNullOrWhiteSpace(txNote) ? order.Note : $"{order.Note} | {txNote}");

        await _dbContext.SaveChangesAsync();

        return new VnPayConfirmResponseViewModel
        {
            Success = true,
            Message = "Payment confirmed.",
            OrderId = orderId,
            TransactionId = response.TransactionNo
        };
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
            var isActiveNow = await IsKitchenManagerInActiveShiftNowAsync(userId);
            if (!isActiveNow)
            {
                return Array.Empty<OrderResponseViewModel>();
            }

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

        if (string.Equals(role, "KitchenManager", StringComparison.OrdinalIgnoreCase))
        {
            var isActiveNow = await IsKitchenManagerInActiveShiftNowAsync(userId);
            if (!isActiveNow)
            {
                throw new InvalidOperationException("Bạn không được xem hoặc xử lý đơn ngoài ca được phân.");
            }
        }

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

    /// <summary>
    /// Kitchen Manager chỉ được thao tác khi đang ở ca active hiện tại.
    /// </summary>
    private async Task<bool> IsKitchenManagerInActiveShiftNowAsync(int kitchenUserId)
    {
        var conn = _dbContext.Database.GetDbConnection();
        var openedHere = false;
        if (conn.State != ConnectionState.Open)
        {
            await conn.OpenAsync();
            openedHere = true;
        }

        var now = DateTime.Now;
        try
        {
            await using var cmd = conn.CreateCommand();
            cmd.CommandText = """
SELECT CASE WHEN EXISTS (
  SELECT 1
  FROM KitchenShiftAssignments a
  INNER JOIN KitchenShifts s ON s.Id = a.ShiftId
  WHERE a.UserId = @UserId
    AND a.WorkDate = CONVERT(date, @Now)
    AND CAST(@Now AS time) >= CAST(s.StartTime AS time)
    AND CAST(@Now AS time) < CAST(s.EndTime AS time)
) THEN 1 ELSE 0 END
""";
            var pUser = cmd.CreateParameter();
            pUser.ParameterName = "@UserId";
            pUser.Value = kitchenUserId;
            cmd.Parameters.Add(pUser);
            var pNow = cmd.CreateParameter();
            pNow.ParameterName = "@Now";
            pNow.Value = now;
            cmd.Parameters.Add(pNow);

            var scalar = await cmd.ExecuteScalarAsync();
            return scalar is not null && scalar != DBNull.Value && Convert.ToInt32(scalar) != 0;
        }
        finally
        {
            if (openedHere && conn.State == ConnectionState.Open)
            {
                await conn.CloseAsync();
            }
        }
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
                    .ThenInclude(x => x!.ComboDetails)
                        .ThenInclude(x => x.Food)
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
                        : (detail.Combo != null ? detail.Combo.Name : "Unknown"),
                    ComboComponents = detail.Combo != null
                        ? detail.Combo.ComboDetails.Select(component => new ComboComponentViewModel
                        {
                            FoodId = component.FoodId,
                            FoodName = component.Food != null ? component.Food.Name : string.Empty,
                            Quantity = component.Quantity
                        }).ToList()
                        : new List<ComboComponentViewModel>()
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
