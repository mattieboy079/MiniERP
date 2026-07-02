using Microsoft.EntityFrameworkCore;
using MiniERP.Data;

namespace MiniERP.Services;

public class UserService(MiniErpDbContext db) : IUserService
{
    public async Task<User?> FindByUsernameAsync(string username)
        => await db.Users.FirstOrDefaultAsync(u => u.Username == username);
}
