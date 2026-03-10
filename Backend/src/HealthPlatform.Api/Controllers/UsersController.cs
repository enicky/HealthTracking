using HealthPlatform.Application;
using HealthPlatform.Application.Interfaces;
using HealthPlatform.Api.Filters;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _logger = logger;
    }

    /// <summary>Creates a new user in a tenant (Super Admin only)</summary>
    /// <param name="dto">User creation details</param>
    /// <returns>Created user information with temporary password</returns>
    [HttpPost]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(CreateUserResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CreateUserResponseDto>> CreateUser([FromBody] CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { error = "Email is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName))
        {
            return BadRequest(new { error = "First name is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.LastName))
        {
            return BadRequest(new { error = "Last name is required" });
        }

        if (dto.TenantId == Guid.Empty)
        {
            return BadRequest(new { error = "Tenant ID is required" });
        }

        try
        {
            _logger.LogInformation("Creating user: {Email} in tenant {TenantId}", dto.Email, dto.TenantId);
            var result = await _userService.CreateUserAsync(dto);
            return CreatedAtAction(nameof(GetUser), new { id = result.User.Id }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Gets all users in a tenant (Super Admin only)</summary>
    /// <param name="tenantId">Tenant ID</param>
    /// <returns>List of users in the tenant</returns>
    [HttpGet("tenant/{tenantId}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(List<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<UserDto>>> GetTenantUsers(Guid tenantId)
    {
        try
        {
            _logger.LogInformation("Fetching users for tenant: {TenantId}", tenantId);
            var users = await _userService.GetTenantUsersAsync(tenantId);
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tenant users");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Gets a specific user by ID (Super Admin only)</summary>
    /// <param name="id">User ID</param>
    /// <returns>User information</returns>
    [HttpGet("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserDto>> GetUser(Guid id)
    {
        try
        {
            _logger.LogInformation("Fetching user: {UserId}", id);
            var user = await _userService.GetUserByIdAsync(id);
            
            if (user == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Updates a user (Super Admin only)</summary>
    /// <param name="id">User ID</param>
    /// <param name="dto">Updated user information</param>
    /// <returns>Updated user information</returns>
    [HttpPut("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Email))
        {
            return BadRequest(new { error = "Email is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.FirstName))
        {
            return BadRequest(new { error = "First name is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.LastName))
        {
            return BadRequest(new { error = "Last name is required" });
        }

        try
        {
            _logger.LogInformation("Updating user: {UserId}", id);
            var result = await _userService.UpdateUserAsync(id, dto);
            
            if (result == null)
            {
                return NotFound(new { error = "User not found" });
            }

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Deletes a user (Super Admin only)</summary>
    /// <param name="id">User ID</param>
    /// <returns>Success status</returns>
    [HttpDelete("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            _logger.LogInformation("Deleting user: {UserId}", id);
            var result = await _userService.DeleteUserAsync(id);
            
            if (!result)
            {
                return NotFound(new { error = "User not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
