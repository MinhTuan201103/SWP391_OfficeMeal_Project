using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public interface IOrderService
{
    Task<VnPayPaymentResponseViewModel> CreateVnPayOrderAsync(int customerId, CreateOrderViewModel model);
    Task<VnPayConfirmResponseViewModel> ConfirmVnPayPaymentAsync(string queryString);
    Task<OrderResponseViewModel> CreateOrderAsync(int customerId, CreateOrderViewModel model);
    Task<IReadOnlyList<OrderResponseViewModel>> GetOrdersAsync(string role, int userId);
    Task<OrderResponseViewModel?> UpdateStatusAsync(int orderId, OrderStatus newStatus, string role, int userId);
}
