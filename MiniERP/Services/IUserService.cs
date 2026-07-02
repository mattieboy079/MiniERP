using MiniERP.Data;

namespace MiniERP.Services;

public interface IUserService
{
    Task<User?> FindByUsernameAsync(string username);
}
