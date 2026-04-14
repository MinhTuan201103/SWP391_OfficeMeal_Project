using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public interface IAuthService
{
    Task<User?> LoginAsync(LoginViewModel model);
    Task<User> RegisterAsync(RegisterViewModel model, string defaultRole = "Customer");
}
