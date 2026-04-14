namespace OfficeMeal.BLL.ViewModels;

public class TodayMenuFoodItemViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public string? Description { get; set; }
    public string? CategoryName { get; set; }
    public bool IsActive { get; set; }
}

public class TodayMenuResponseViewModel
{
    public int DayOfWeek { get; set; }
    public IReadOnlyList<TodayMenuFoodItemViewModel> Foods { get; set; } = Array.Empty<TodayMenuFoodItemViewModel>();
}
