using HealthPlatform.Application;
using HealthPlatform.Application.Interfaces;
using HealthPlatform.Api.Filters;
using HealthPlatform.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class TenantsController : ControllerBase
{
    private readonly ITenantService _tenantService;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(ITenantService tenantService, ILogger<TenantsController> logger)
    {
        _tenantService = tenantService;
        _logger = logger;
    }

    /// <summary>Gets all tenants (Super Admin only)</summary>
    /// <returns>List of all tenants</returns>
    [HttpGet]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(List<TenantDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<TenantDto>>> GetAllTenants()
    {
        try
        {
            _logger.LogInformation("Fetching all tenants");
            var tenants = await _tenantService.GetAllTenantsAsync();
            return Ok(tenants);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tenants");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Gets a specific tenant by ID (Super Admin only)</summary>
    /// <param name="id">Tenant ID</param>
    /// <returns>Tenant information</returns>
    [HttpGet("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TenantDto>> GetTenant(Guid id)
    {
        try
        {
            _logger.LogInformation("Fetching tenant: {TenantId}", id);
            var tenant = await _tenantService.GetTenantByIdAsync(id);
            
            if (tenant == null)
            {
                return NotFound(new { error = "Tenant not found" });
            }

            return Ok(tenant);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching tenant");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Creates a new tenant (Super Admin only)</summary>
    /// <param name="dto">Tenant creation details</param>
    /// <returns>Created tenant information</returns>
    [HttpPost]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(CreateTenantResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CreateTenantResponseDto>> CreateTenant([FromBody] CreateTenantDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { error = "Tenant name is required" });
        }

        if (string.IsNullOrWhiteSpace(dto.AdminEmail))
        {
            return BadRequest(new { error = "Admin email is required" });
        }

        try
        {
            _logger.LogInformation("Creating tenant: {TenantName}", dto.Name);
            var result = await _tenantService.CreateTenantAsync(dto);
            return CreatedAtAction(nameof(GetTenant), new { id = result.TenantId }, result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Invalid operation: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tenant");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Updates a tenant (Super Admin only)</summary>
    /// <param name="id">Tenant ID</param>
    /// <param name="dto">Updated tenant information</param>
    /// <returns>Updated tenant information</returns>
    [HttpPut("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TenantDto>> UpdateTenant(Guid id, [FromBody] UpdateTenantDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
        {
            return BadRequest(new { error = "Tenant name is required" });
        }

        try
        {
            _logger.LogInformation("Updating tenant: {TenantId}", id);
            var result = await _tenantService.UpdateTenantAsync(id, dto);
            
            if (result == null)
            {
                return NotFound(new { error = "Tenant not found" });
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
            _logger.LogError(ex, "Error updating tenant");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Deletes a tenant (Super Admin only)</summary>
    /// <param name="id">Tenant ID</param>
    /// <returns>Success status</returns>
    [HttpDelete("{id}")]
    [AuthorizeSuperAdmin]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteTenant(Guid id)
    {
        try
        {
            _logger.LogInformation("Deleting tenant: {TenantId}", id);
            var result = await _tenantService.DeleteTenantAsync(id);
            
            if (!result)
            {
                return NotFound(new { error = "Tenant not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tenant");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
