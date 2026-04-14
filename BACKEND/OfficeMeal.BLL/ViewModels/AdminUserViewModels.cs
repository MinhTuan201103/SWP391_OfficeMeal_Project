namespace OfficeMeal.BLL.ViewModels;

public class AdminCreateUserViewModel
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Password { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int RoleId { get; set; }
}

public class AdminUpdateUserViewModel
{
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int RoleId { get; set; }
    public bool IsActive { get; set; }
}
