using Microsoft.EntityFrameworkCore;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using OfficeMeal.DAL.Models;
using System.Security.Cryptography;
using System.Text;

namespace OfficeMeal.BLL.Services;

public class AuthService : IAuthService
{
    private readonly OfficeMealContext _dbContext;

    public AuthService(OfficeMealContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> LoginAsync(LoginViewModel model)
    {
        string hashedPassword = HashPassword(model.Password);
        var user = await _dbContext.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == model.Email);

        if (user is null)
        {
            return null;
        }

        var isValidPassword = user.Password == hashedPassword || user.Password == model.Password;
        return isValidPassword ? user : null;
    }

    public async Task<User> RegisterAsync(RegisterViewModel model, string defaultRole = "Customer")
    {
        var normalizedEmail = model.Email.Trim().ToLower();
        var emailExists = await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (emailExists)
        {
            throw new InvalidOperationException("Email already exists.");
        }

        var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == defaultRole)
            ?? throw new InvalidOperationException($"Role '{defaultRole}' not found.");

        var user = new User
        {
            FullName = model.FullName,
            Email = model.Email.Trim(),
            Password = HashPassword(model.Password),
            Phone = model.Phone,
            RoleId = role.Id,
            CreatedAt = DateTime.Now,
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();
        return user;
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();
        byte[] bytes = Encoding.UTF8.GetBytes(password);
        byte[] hash = sha256.ComputeHash(bytes);
        return Convert.ToHexString(hash);
    }
}
