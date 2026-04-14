using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DailyMenusController : ControllerBase
{
    private readonly OfficeMealContext _dbContext;

    public DailyMenusController(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetDailyMenus()
    {
        var dailyMenus = await _dbContext.DailyMenus
            .AsNoTracking()
            .Where(menu => menu.IsActive)
            .ToListAsync();

        var foodNames = await _dbContext.Foods
            .AsNoTracking()
            .ToDictionaryAsync(food => food.Id, food => food.Name);

        var comboNames = await _dbContext.Combos
            .AsNoTracking()
            .ToDictionaryAsync(combo => combo.Id, combo => combo.Name);

        var payload = dailyMenus.Select(menu => new
        {
            menu.Id,
            menu.TargetId,
            TargetType = menu.TargetType.ToString(),
            menu.DayOfWeek,
            TargetName = menu.TargetType == DailyMenuTargetType.Food
                ? foodNames.GetValueOrDefault(menu.TargetId)
                : comboNames.GetValueOrDefault(menu.TargetId)
        });

        return Ok(payload);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateDailyMenu([FromBody] DailyMenu model)
    {
        _dbContext.DailyMenus.Add(model);
        await _dbContext.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDailyMenu(int id, [FromBody] DailyMenu model)
    {
        var existing = await _dbContext.DailyMenus.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.TargetId = model.TargetId;
        existing.TargetType = model.TargetType;
        existing.DayOfWeek = model.DayOfWeek;
        existing.IsActive = model.IsActive;
        await _dbContext.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDailyMenu(int id)
    {
        var existing = await _dbContext.DailyMenus.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        _dbContext.DailyMenus.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
