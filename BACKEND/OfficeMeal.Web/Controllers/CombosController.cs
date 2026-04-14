using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CombosController : ControllerBase
{
    public class ComboDetailUpsertDto
    {
        [Range(1, int.MaxValue)]
        public int FoodId { get; set; }
        [Range(1, 20)]
        public int Quantity { get; set; }
    }

    public class ComboUpsertDto
    {
        [Required]
        [StringLength(150, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;
        [Range(1000, 100000000)]
        public decimal Price { get; set; }
        [Range(0, 99)]
        public int DiscountPercent { get; set; }
        [StringLength(500)]
        public string? ImageUrl { get; set; }
        [StringLength(500)]
        public string? Description { get; set; }
        public bool IsActive { get; set; } = true;
        [MinLength(1)]
        public List<ComboDetailUpsertDto> ComboDetails { get; set; } = new();
    }

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
                combo.DiscountPercent,
                combo.ImageUrl,
                combo.Description,
                IsActive = combo.IsActive && combo.ComboDetails.All(detail => detail.Food != null && detail.Food.IsActive),
                DiscountedPrice = Math.Round(combo.Price * (100 - combo.DiscountPercent) / 100m, 2),
                Items = combo.ComboDetails.Select(detail => new
                {
                    detail.FoodId,
                    FoodName = detail.Food != null ? detail.Food.Name : null,
                    FoodIsActive = detail.Food != null && detail.Food.IsActive,
                    detail.Quantity
                })
            })
            .ToListAsync();

        return Ok(combos);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateCombo([FromBody] ComboUpsertDto model)
    {
        var details = model.ComboDetails
            .Where(x => x.FoodId > 0 && x.Quantity > 0)
            .GroupBy(x => x.FoodId)
            .Select(x => new ComboDetail { FoodId = x.Key, Quantity = x.Sum(y => y.Quantity) })
            .ToList();

        if (details.Count == 0)
        {
            return BadRequest(new { message = "Combo phai co it nhat 1 mon." });
        }

        var validFoodIds = await _dbContext.Foods
            .Where(x => details.Select(d => d.FoodId).Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (validFoodIds.Count != details.Count)
        {
            return BadRequest(new { message = "Danh sach mon trong combo khong hop le." });
        }

        var combo = new Combo
        {
            Name = model.Name.Trim(),
            Price = model.Price,
            DiscountPercent = model.DiscountPercent,
            Description = string.IsNullOrWhiteSpace(model.Description) ? null : model.Description.Trim(),
            ImageUrl = string.IsNullOrWhiteSpace(model.ImageUrl) ? null : model.ImageUrl.Trim(),
            IsActive = model.IsActive,
            ComboDetails = details
        };

        _dbContext.Combos.Add(combo);
        await _dbContext.SaveChangesAsync();
        var created = await _dbContext.Combos
            .AsNoTracking()
            .Include(x => x.ComboDetails)
                .ThenInclude(x => x.Food)
            .Where(x => x.Id == combo.Id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Price,
                x.DiscountPercent,
                x.ImageUrl,
                x.Description,
                IsActive = x.IsActive && x.ComboDetails.All(detail => detail.Food != null && detail.Food.IsActive),
                DiscountedPrice = Math.Round(x.Price * (100 - x.DiscountPercent) / 100m, 2),
                Items = x.ComboDetails.Select(detail => new
                {
                    detail.FoodId,
                    FoodName = detail.Food != null ? detail.Food.Name : null,
                    FoodIsActive = detail.Food != null && detail.Food.IsActive,
                    detail.Quantity
                })
            })
            .FirstAsync();
        return Ok(created);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCombo(int id, [FromBody] ComboUpsertDto model)
    {
        var existing = await _dbContext.Combos
            .Include(x => x.ComboDetails)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        var details = model.ComboDetails
            .Where(x => x.FoodId > 0 && x.Quantity > 0)
            .GroupBy(x => x.FoodId)
            .Select(x => new ComboDetail { ComboId = id, FoodId = x.Key, Quantity = x.Sum(y => y.Quantity) })
            .ToList();

        if (details.Count == 0)
        {
            return BadRequest(new { message = "Combo phai co it nhat 1 mon." });
        }

        var validFoodIds = await _dbContext.Foods
            .Where(x => details.Select(d => d.FoodId).Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        if (validFoodIds.Count != details.Count)
        {
            return BadRequest(new { message = "Danh sach mon trong combo khong hop le." });
        }

        existing.Name = model.Name.Trim();
        existing.Price = model.Price;
        existing.DiscountPercent = model.DiscountPercent;
        existing.Description = string.IsNullOrWhiteSpace(model.Description) ? null : model.Description.Trim();
        existing.ImageUrl = string.IsNullOrWhiteSpace(model.ImageUrl) ? null : model.ImageUrl.Trim();
        existing.IsActive = model.IsActive;

        if (existing.ComboDetails.Count > 0)
        {
            _dbContext.ComboDetails.RemoveRange(existing.ComboDetails);
        }
        existing.ComboDetails = details;

        await _dbContext.SaveChangesAsync();
        var updated = await _dbContext.Combos
            .AsNoTracking()
            .Include(x => x.ComboDetails)
                .ThenInclude(x => x.Food)
            .Where(x => x.Id == id)
            .Select(x => new
            {
                x.Id,
                x.Name,
                x.Price,
                x.DiscountPercent,
                x.ImageUrl,
                x.Description,
                IsActive = x.IsActive && x.ComboDetails.All(detail => detail.Food != null && detail.Food.IsActive),
                DiscountedPrice = Math.Round(x.Price * (100 - x.DiscountPercent) / 100m, 2),
                Items = x.ComboDetails.Select(detail => new
                {
                    detail.FoodId,
                    FoodName = detail.Food != null ? detail.Food.Name : null,
                    FoodIsActive = detail.Food != null && detail.Food.IsActive,
                    detail.Quantity
                })
            })
            .FirstAsync();
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCombo(int id)
    {
        var existing = await _dbContext.Combos
            .Include(x => x.ComboDetails)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (existing is null)
        {
            return NotFound();
        }

        var hasOrdered = await _dbContext.OrderDetails.AnyAsync(x => x.ComboId == id);
        if (hasOrdered)
        {
            return Conflict(new
            {
                message = "Combo da phat sinh don hang, khong the xoa. Hay tat trang thai hoat dong."
            });
        }

        if (existing.ComboDetails.Count > 0)
        {
            _dbContext.ComboDetails.RemoveRange(existing.ComboDetails);
        }

        _dbContext.Combos.Remove(existing);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
