using System.ComponentModel.DataAnnotations;

namespace OfficeMeal.BLL.ViewModels;

public class AdminCreateUserViewModel
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MinLength(6)]
    [StringLength(100)]
    public string? Password { get; set; }

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }
}

public class AdminUpdateUserViewModel
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string FullName { get; set; } = string.Empty;

    [Phone]
    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(250)]
    public string? Address { get; set; }

    [Range(1, int.MaxValue)]
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
}
