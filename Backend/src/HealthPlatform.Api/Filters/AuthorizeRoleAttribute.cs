using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using HealthPlatform.Domain.Entities;

namespace HealthPlatform.Api.Filters;

/// <summary>
/// Attribute to restrict endpoint access to specific roles
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeRoleAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly UserRole[] _roles;

    public AuthorizeRoleAttribute(params UserRole[] roles)
    {
        _roles = roles;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        // Get user from context - check both the long-format and short claim names
        var userRoleClaim = context.HttpContext.User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role") 
            ?? context.HttpContext.User?.FindFirst("role");
        
        if (userRoleClaim == null)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var userRole = userRoleClaim.Value;
        
        // Check if user role is in allowed roles
        if (!_roles.Any(r => r.ToString().Equals(userRole, StringComparison.OrdinalIgnoreCase)))
        {
            context.Result = new ForbidResult();
            return;
        }

        await Task.CompletedTask;
    }
}

/// <summary>
/// Attribute to restrict endpoint access to Super Admin only
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeSuperAdminAttribute : AuthorizeRoleAttribute
{
    public AuthorizeSuperAdminAttribute() : base(UserRole.SuperAdmin)
    {
    }
}
