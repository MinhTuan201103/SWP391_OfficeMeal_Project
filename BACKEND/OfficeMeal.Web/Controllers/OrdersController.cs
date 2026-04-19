using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using OfficeMeal.BLL.Services;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using OfficeMeal.Web.Hubs;
using System.Security.Claims;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private static readonly JsonSerializerOptions VnPayIpnJsonOptions = new()
    {
        PropertyNamingPolicy = null
    };

    private readonly IOrderService _orderService;
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly OfficeMealContext _dbContext;
    private readonly IConfiguration _configuration;

    public OrdersController(
        IOrderService orderService,
        IHubContext<OrderHub> hubContext,
        OfficeMealContext dbContext,
        IConfiguration configuration)
    {
        _orderService = orderService;
        _hubContext = hubContext;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        var orders = await _orderService.GetOrdersAsync(role, userId);
        return Ok(orders);
    }

    [HttpGet("customer")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> GetCustomerOrders()
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var orders = await _orderService.GetOrdersAsync(role, userId);
        return Ok(orders);
    }

    [HttpGet("kitchen")]
    [Authorize(Roles = "KitchenManager,Admin")]
    public async Task<IActionResult> GetKitchenOrders()
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var orders = await _orderService.GetOrdersAsync(role, userId);
        return Ok(orders);
    }

    [HttpGet("shipper")]
    [Authorize(Roles = "Shipper,Admin")]
    public async Task<IActionResult> GetShipperOrders()
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var orders = await _orderService.GetOrdersAsync(role, userId);
        return Ok(orders);
    }

    [HttpPost("vnpay")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> CreateVnPayOrder([FromBody] CreateOrderViewModel model)
    {
        var customerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        try
        {
            var created = await _orderService.CreateVnPayOrderAsync(customerId, model);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("vnpay-return")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayReturn()
    {
        var queryString = Request.QueryString.HasValue
            ? Request.QueryString.Value!.TrimStart('?')
            : string.Empty;

        var result = await _orderService.ConfirmVnPayPaymentAsync(queryString);

        if (result.Success)
        {
            await _hubContext.Clients.All.SendAsync("UpdateStatus", result.OrderId, (int)OrderStatus.Pending);
        }

        var redirect = _configuration["Vnpay:PaymentBackReturnUrl"] ?? "/";
        var tail = $"orderId={result.OrderId}&paid={(result.Success ? "1" : "0")}&msg={Uri.EscapeDataString(result.Message)}";
        var sep = redirect.Contains('?', StringComparison.Ordinal) ? "&" : "?";
        return Redirect($"{redirect}{sep}{tail}");
    }

    [HttpPost("vnpay-ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> VnPayIpn()
    {
        var queryString = await BuildVnPayQueryStringFromRequestAsync();
        var result = await _orderService.ConfirmVnPayPaymentAsync(queryString);

        if (result.Success)
        {
            await _hubContext.Clients.All.SendAsync("UpdateStatus", result.OrderId, (int)OrderStatus.Pending);
            var okJson = JsonSerializer.Serialize(new { RspCode = "00", Message = "Successfully" }, VnPayIpnJsonOptions);
            return Content(okJson, "application/json");
        }

        var failJson = JsonSerializer.Serialize(new { RspCode = "97", Message = "Confirm failed" }, VnPayIpnJsonOptions);
        return Content(failJson, "application/json");
    }

    private async Task<string> BuildVnPayQueryStringFromRequestAsync()
    {
        if (Request.HasFormContentType)
        {
            var form = await Request.ReadFormAsync();
            if (form.Count > 0)
            {
                return string.Join("&", form.Select(kv =>
                    $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value.ToString())}"));
            }
        }

        if (Request.QueryString.HasValue)
        {
            return Request.QueryString.Value!.TrimStart('?');
        }

        using var reader = new StreamReader(Request.Body);
        var body = (await reader.ReadToEndAsync()).Trim();
        return body.TrimStart('?');
    }

    [HttpPost]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderViewModel model)
    {
        var customerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        try
        {
            var created = await _orderService.CreateOrderAsync(customerId, model);
            await _hubContext.Clients.All.SendAsync("UpdateStatus", created.OrderId, (int)created.Status);
            return Ok(created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{orderId:int}/status")]
    [Authorize(Roles = "Admin,KitchenManager,Shipper")]
    public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] UpdateOrderStatusViewModel model)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

        try
        {
            var updated = await _orderService.UpdateStatusAsync(orderId, model.Status, role, userId);
            if (updated is null)
            {
                return NotFound();
            }

            await _hubContext.Clients.All.SendAsync("UpdateStatus", updated.OrderId, (int)updated.Status);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{orderId:int}/payment-confirm")]
    [Authorize(Roles = "Customer,Admin")]
    public async Task<IActionResult> ConfirmPayment(int orderId, [FromBody] ConfirmOrderPaymentViewModel model)
    {
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == orderId);
        if (order is null)
        {
            return NotFound();
        }

        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase) && order.CustomerId != userId)
        {
            return Forbid();
        }

        var provider = (model.Provider ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(provider))
        {
            return BadRequest(new { message = "Provider is required." });
        }

        order.PaymentMethod = provider;
        var tx = string.IsNullOrWhiteSpace(model.TransactionCode)
            ? $"TX-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}"
            : model.TransactionCode.Trim();
        var paidStamp = $"PAID:{provider}:{tx}:{DateTime.UtcNow:O}";
        order.Note = string.IsNullOrWhiteSpace(order.Note) ? paidStamp : $"{order.Note} | {paidStamp}";

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            OrderId = order.Id,
            order.PaymentMethod,
            order.Note
        });
    }
}
