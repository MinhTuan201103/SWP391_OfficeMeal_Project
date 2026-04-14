using OfficeMeal.BLL.ViewModels;

namespace OfficeMeal.BLL.Services;

public interface IDailyMenuService
{
    Task<TodayMenuResponseViewModel> GetTodayMenuAsync();
}
