using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OfficeMeal.Web.Hubs;

[Authorize]
public class OrderHub : Hub
{
    public async Task UpdateOrderStatus(int orderId, int status)
    {
        await Clients.All.SendAsync("UpdateStatus", orderId, status);
    }
}
