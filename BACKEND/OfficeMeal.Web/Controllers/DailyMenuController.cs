using Microsoft.AspNetCore.Mvc;
using OfficeMeal.BLL.Services;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DailyMenuController : ControllerBase
{
    private readonly IDailyMenuService _dailyMenuService;

    public DailyMenuController(IDailyMenuService dailyMenuService)
    {
        _dailyMenuService = dailyMenuService;
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayMenu()
    {
        var result = await _dailyMenuService.GetTodayMenuAsync();
        return Ok(result);
    }
}
