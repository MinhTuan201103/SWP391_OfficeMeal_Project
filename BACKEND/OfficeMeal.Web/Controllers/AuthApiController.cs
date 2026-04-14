using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OfficeMeal.BLL.Services;
using OfficeMeal.BLL.ViewModels;
using OfficeMeal.DAL.Data;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace OfficeMeal.Web.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthApiController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly OfficeMealContext _dbContext;

    public AuthApiController(IAuthService authService, IConfiguration configuration, OfficeMealContext dbContext)
    {
        _authService = authService;
        _configuration = configuration;
        _dbContext = dbContext;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        model.Email = model.Email.Trim();
        model.Password = model.Password.Trim();

        var user = await _authService.LoginAsync(model);
        if (user is null || user.Role is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.Name)
        };

        var token = GenerateJwtToken(claims);
        return Ok(new
        {
            AccessToken = token,
            TokenType = "Bearer",
            user.Id,
            user.FullName,
            user.Email,
            Role = user.Role.Name
        });
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        model.FullName = model.FullName.Trim();
        model.Email = model.Email.Trim();
        model.Phone = model.Phone.Trim();
        model.Password = model.Password.Trim();

        try
        {
            var user = await _authService.RegisterAsync(model);
            return Ok(new { user.Id, user.FullName, user.Email });
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
        {
            return Conflict(new { message = "Email already exists." });
        }
    }

    [HttpPost("logout")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> Logout()
    {
        await Task.CompletedTask;
        return Ok(new { message = "Logged out." });
    }

    [HttpGet("me")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public IActionResult Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var user = _dbContext.Users.AsNoTracking().FirstOrDefault(x => x.Id == userId);
        if (user is null)
        {
            return NotFound();
        }

        return Ok(new
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Role = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    [HttpPut("me")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var user = await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == userId);
        if (user is null)
        {
            return NotFound();
        }

        user.FullName = model.FullName.Trim();
        user.Phone = string.IsNullOrWhiteSpace(model.Phone) ? null : model.Phone.Trim();
        user.Address = string.IsNullOrWhiteSpace(model.Address) ? null : model.Address.Trim();

        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Phone = user.Phone,
            Address = user.Address,
            Role = User.FindFirstValue(ClaimTypes.Role)
        });
    }

    private string GenerateJwtToken(IEnumerable<Claim> claims)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var issuer = jwtSection["Issuer"] ?? "OfficeMeal";
        var audience = jwtSection["Audience"] ?? "OfficeMeal.Frontend";
        var expireMinutes = int.TryParse(jwtSection["ExpireMinutes"], out var value) ? value : 480;

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}