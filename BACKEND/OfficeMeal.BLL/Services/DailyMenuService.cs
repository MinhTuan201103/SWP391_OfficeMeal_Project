using Microsoft.EntityFrameworkCore;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;

namespace OfficeMeal.BLL.Services;

public class DailyMenuService : IDailyMenuService
{
    private readonly OfficeMealContext _dbContext;

    public DailyMenuService(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TodayMenuResponseViewModel> GetTodayMenuAsync()
    {
        var currentDay = DateTime.Now.DayOfWeek;
        var dbDayOfWeek = currentDay == DayOfWeek.Sunday ? 8 : (int)currentDay + 1;

        var foodIds = await _dbContext.DailyMenus
            .AsNoTracking()
            .Where(menu => menu.DayOfWeek == dbDayOfWeek
                && menu.IsActive
                && menu.TargetType == DailyMenuTargetType.Food)
            .Select(menu => menu.TargetId)
            .ToListAsync();

        var foods = await _dbContext.Foods
            .AsNoTracking()
            .Include(food => food.Category)
            .Where(food => food.IsActive && foodIds.Contains(food.Id))
            .Select(food => new TodayMenuFoodItemViewModel
            {
                Id = food.Id,
                Name = food.Name,
                Price = food.Price,
                ImageUrl = food.ImageUrl,
                Description = food.Description,
                CategoryName = food.Category != null ? food.Category.Name : null,
                IsActive = food.IsActive
            })
            .ToListAsync();

        return new TodayMenuResponseViewModel
        {
            DayOfWeek = dbDayOfWeek,
            Foods = foods
        };
    }
}
