using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly OfficeMealContext _dbContext;

    public UsersController(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _dbContext.Users
            .AsNoTracking()
            .Include(x => x.Role)
            .Where(x => x.Role == null || x.Role.Name != "Admin")
            .Select(x => new
            {
                x.Id,
                x.FullName,
                x.Email,
                x.Phone,
                x.IsActive,
                x.RoleId,
                RoleName = x.Role != null ? x.Role.Name : null
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPatch("{id:int}/role/{roleId:int}")]
    public async Task<IActionResult> AssignRole(int id, int roleId)
    {
        var user = await _dbContext.Users.Include(x => x.Role).FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound();
        }
        if (string.Equals(user.Role?.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot manage Admin account." });
        }

        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.Id == roleId);
        if (role is null)
        {
            return BadRequest(new { message = "Role not found." });
        }
        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot assign Admin role in this screen." });
        }

        user.RoleId = roleId;
        await _dbContext.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _dbContext.Roles
            .AsNoTracking()
            .Where(x => x.Name != "Admin")
            .Select(x => new { x.Id, x.Name })
            .ToListAsync();
        return Ok(roles);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserViewModel model)
    {
        var email = model.Email.Trim().ToLowerInvariant();
        var fullName = model.FullName.Trim();
        string password = string.IsNullOrWhiteSpace(model.Password) ? "123" : model.Password;

        if (await _dbContext.Users.AnyAsync(x => x.Email.ToLower() == email))
        {
            return BadRequest(new { message = "Email already exists." });
        }
        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.Id == model.RoleId);
        if (role is null)
        {
            return BadRequest(new { message = "Role not found." });
        }
        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot create Admin account here." });
        }

        var user = new DAL.Models.User
        {
            FullName = fullName,
            Email = email,
            Password = password,
            Phone = string.IsNullOrWhiteSpace(model.Phone) ? null : model.Phone.Trim(),
            Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim(),
            RoleId = model.RoleId,
            IsActive = true,
            CreatedAt = DateTime.Now
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] AdminUpdateUserViewModel model)
    {
        var user = await _dbContext.Users.Include(x => x.Role).FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound();
        }
        if (string.Equals(user.Role?.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot manage Admin account." });
        }
        var role = await _dbContext.Roles.FirstOrDefaultAsync(x => x.Id == model.RoleId);
        if (role is null)
        {
            return BadRequest(new { message = "Role not found." });
        }
        if (string.Equals(role.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot assign Admin role in this screen." });
        }

        user.FullName = model.FullName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(model.Phone) ? null : model.Phone.Trim();
        user.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();
        user.RoleId = model.RoleId;
        user.IsActive = model.IsActive;
        await _dbContext.SaveChangesAsync();
        return Ok(user);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _dbContext.Users.Include(x => x.Role).FirstOrDefaultAsync(x => x.Id == id);
        if (user is null)
        {
            return NotFound();
        }
        if (string.Equals(user.Role?.Name, "Admin", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Cannot manage Admin account." });
        }

        _dbContext.Users.Remove(user);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }
}
