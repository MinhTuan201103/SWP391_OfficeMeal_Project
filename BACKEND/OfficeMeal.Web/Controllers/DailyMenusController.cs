using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DailyMenusController : ControllerBase
{
    public class DailyMenuUpsertDto
    {
        [Range(1, int.MaxValue)]
        public int TargetId { get; set; }
        public DailyMenuTargetType TargetType { get; set; }
        [Range(0, 6)]
        public int DayOfWeek { get; set; }
        public bool IsActive { get; set; } = true;
    }

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
    public async Task<IActionResult> CreateDailyMenu([FromBody] DailyMenuUpsertDto model)
    {
        var targetExists = model.TargetType == DailyMenuTargetType.Food
            ? await _dbContext.Foods.AnyAsync(x => x.Id == model.TargetId)
            : await _dbContext.Combos.AnyAsync(x => x.Id == model.TargetId);
        if (!targetExists)
        {
            return BadRequest(new { message = "Target does not exist." });
        }
        var duplicated = await _dbContext.DailyMenus.AnyAsync(x =>
            x.TargetId == model.TargetId && x.TargetType == model.TargetType && x.DayOfWeek == model.DayOfWeek);
        if (duplicated)
        {
            return Conflict(new { message = "Daily menu entry already exists." });
        }

        var dailyMenu = new DailyMenu
        {
            TargetId = model.TargetId,
            TargetType = model.TargetType,
            DayOfWeek = model.DayOfWeek,
            IsActive = model.IsActive
        };
        _dbContext.DailyMenus.Add(dailyMenu);
        await _dbContext.SaveChangesAsync();
        return Ok(dailyMenu);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateDailyMenu(int id, [FromBody] DailyMenuUpsertDto model)
    {
        var existing = await _dbContext.DailyMenus.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }
        var targetExists = model.TargetType == DailyMenuTargetType.Food
            ? await _dbContext.Foods.AnyAsync(x => x.Id == model.TargetId)
            : await _dbContext.Combos.AnyAsync(x => x.Id == model.TargetId);
        if (!targetExists)
        {
            return BadRequest(new { message = "Target does not exist." });
        }
        var duplicated = await _dbContext.DailyMenus.AnyAsync(x =>
            x.Id != id && x.TargetId == model.TargetId && x.TargetType == model.TargetType && x.DayOfWeek == model.DayOfWeek);
        if (duplicated)
        {
            return Conflict(new { message = "Daily menu entry already exists." });
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
