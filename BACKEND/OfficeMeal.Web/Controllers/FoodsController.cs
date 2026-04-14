using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    private readonly OfficeMealContext _dbContext;

    public FoodsController(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetFoods()
    {
        var foods = await _dbContext.Foods
            .AsNoTracking()
            .Include(food => food.Category)
            .Select(food => new
            {
                food.Id,
                food.Name,
                food.Price,
                food.Description,
                food.ImageUrl,
                food.IsActive,
                food.CategoryId,
                CategoryName = food.Category != null ? food.Category.Name : null
            })
            .ToListAsync();

        return Ok(foods);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateFood([FromBody] Food model)
    {
        _dbContext.Foods.Add(model);
        await _dbContext.SaveChangesAsync();
        return Ok(model);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateFood(int id, [FromBody] Food model)
    {
        var existing = await _dbContext.Foods.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.Name = model.Name;
        existing.CategoryId = model.CategoryId;
        existing.Price = model.Price;
        existing.Description = model.Description;
        existing.ImageUrl = model.ImageUrl;
        existing.IsActive = model.IsActive;

        await _dbContext.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteFood(int id)
    {
        var existing = await _dbContext.Foods.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        _dbContext.Foods.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPatch("{id:int}/availability")]
    [Authorize(Roles = "Admin,KitchenManager")]
    public async Task<IActionResult> UpdateAvailability(int id, [FromBody] bool isActive)
    {
        var existing = await _dbContext.Foods.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        existing.IsActive = isActive;
        await _dbContext.SaveChangesAsync();
        return Ok(new { existing.Id, existing.Name, existing.IsActive });
    }
}
