using System.ComponentModel.DataAnnotations;

namespace OfficeMeal.BLL.ViewModels;

public class LoginViewModel
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;
}

public class RegisterViewModel
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, DataType(DataType.Password)]
    [MinLength(6)]
    [StringLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required, Phone]
    public string Phone { get; set; } = string.Empty;
}

public class UpdateProfileViewModel
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }
}
