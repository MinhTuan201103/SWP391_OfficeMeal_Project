using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombosController : ControllerBase
{
    private readonly OfficeMealContext _dbContext;

    public CombosController(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCombos()
    {
        var combos = await _dbContext.Combos
            .AsNoTracking()
            .Include(combo => combo.ComboDetails)
                .ThenInclude(detail => detail.Food)
            .Select(combo => new
            {
                combo.Id,
                combo.Name,
                combo.Price,
                combo.ImageUrl,
                combo.Description,
                combo.IsActive,
                Items = combo.ComboDetails.Select(detail => new
                {
                    detail.FoodId,
                    FoodName = detail.Food != null ? detail.Food.Name : null,
                    detail.Quantity
                })
            })
            .ToListAsync();

        return Ok(combos);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCombo([FromBody] Combo model)
    {
        _dbContext.Combos.Add(model);
        await _dbContext.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCombo(int id, [FromBody] Combo model)
    {
        var existing = await _dbContext.Combos.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Name = model.Name;
        existing.Price = model.Price;
        existing.Description = model.Description;
        existing.ImageUrl = model.ImageUrl;
        existing.IsActive = model.IsActive;
        await _dbContext.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCombo(int id)
    {
        var existing = await _dbContext.Combos.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        _dbContext.Combos.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
