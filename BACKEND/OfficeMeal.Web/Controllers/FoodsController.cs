using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoodsController : ControllerBase
{
    public class FoodUpsertDto
    {
        [Required]
        [StringLength(150, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int CategoryId { get; set; }

        [Range(1000, 100000000)]
        public decimal Price { get; set; }
        [Range(0, 99)]
        public int DiscountPercent { get; set; }

        [StringLength(500)]
        public string? ImageUrl { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }

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
                food.DiscountPercent,
                food.Description,
                food.ImageUrl,
                food.IsActive,
                food.CategoryId,
                CategoryName = food.Category != null ? food.Category.Name : null,
                DiscountedPrice = Math.Round(food.Price * (100 - food.DiscountPercent) / 100m, 2)
            })
            .ToListAsync();

        return Ok(foods);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateFood([FromBody] FoodUpsertDto model)
    {
        var categoryExists = await _dbContext.Categories.AnyAsync(x => x.Id == model.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Category does not exist." });
        }

        var food = new Food
        {
            Name = model.Name.Trim(),
            CategoryId = model.CategoryId,
            Price = model.Price,
            DiscountPercent = model.DiscountPercent,
            Description = string.IsNullOrWhiteSpace(model.Description) ? null : model.Description.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(model.ImageUrl) ? null : model.ImageUrl.Trim(),
            IsActive = model.IsActive
        };

        _dbContext.Foods.Add(food);
        await _dbContext.SaveChangesAsync();
        return Ok(food);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateFood(int id, [FromBody] FoodUpsertDto model)
    {
        var existing = await _dbContext.Foods.FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }
        var categoryExists = await _dbContext.Categories.AnyAsync(x => x.Id == model.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Category does not exist." });
        }

        existing.Name = model.Name.Trim();
        existing.CategoryId = model.CategoryId;
        existing.Price = model.Price;
        existing.DiscountPercent = model.DiscountPercent;
        existing.Description = string.IsNullOrWhiteSpace(model.Description) ? null : model.Description.Trim();
        existing.ImageUrl = string.IsNullOrWhiteSpace(model.ImageUrl) ? null : model.ImageUrl.Trim();
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
        var inOrder = await _dbContext.OrderDetails.AnyAsync(x => x.FoodId == id);
        var inCombo = await _dbContext.ComboDetails.AnyAsync(x => x.FoodId == id);
        if (inOrder || inCombo)
        {
            return Conflict(new { message = "Food is used in order/combo and cannot be deleted." });
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
