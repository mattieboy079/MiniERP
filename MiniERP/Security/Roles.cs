namespace MiniERP.Security;

/// <summary>
/// The two application-wide roles. Admin has full CRUD; User is read-only.
/// </summary>
public static class Roles
{
    public const string Admin = "Admin";
    public const string User = "User";
}
