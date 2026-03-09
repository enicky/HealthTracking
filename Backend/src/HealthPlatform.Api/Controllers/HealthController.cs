using Microsoft.AspNetCore.Mvc;
using HealthPlatform.Infrastructure.Persistence;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class HealthController : ControllerBase
{
    private readonly HealthDbContext _dbContext;
    private readonly ILogger<HealthController> _logger;

    public HealthController(HealthDbContext dbContext, ILogger<HealthController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Liveness probe endpoint for Kubernetes
    /// Returns 200 if the service is running
    /// </summary>
    [HttpGet("live")]
    public IActionResult Live()
    {
        _logger.LogInformation("Liveness probe check");
        return Ok(new
        {
            status = "alive",
            timestamp = DateTime.UtcNow,
            service = "health-platform-api"
        });
    }

    /// <summary>
    /// Readiness probe endpoint for Kubernetes
    /// Returns 200 only if the service is ready to accept traffic
    /// (includes database connectivity check)
    /// </summary>
    [HttpGet("ready")]
    public async Task<IActionResult> Ready()
    {
        _logger.LogInformation("Readiness probe check");

        try
        {
            // Check if database is accessible
            var canConnect = await _dbContext.Database.CanConnectAsync();

            if (!canConnect)
            {
                _logger.LogWarning("Database connectivity check failed");
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new
                {
                    status = "not_ready",
                    reason = "database_unavailable",
                    timestamp = DateTime.UtcNow
                });
            }

            return Ok(new
            {
                status = "ready",
                timestamp = DateTime.UtcNow,
                checks = new
                {
                    database = "connected"
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during readiness check");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "not_ready",
                reason = "internal_error",
                message = ex.Message,
                timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Combined health endpoint that provides comprehensive health information
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetHealth()
    {
        _logger.LogInformation("Health check requested");

        try
        {
            var canConnect = await _dbContext.Database.CanConnectAsync();

            var healthStatus = new
            {
                status = canConnect ? "healthy" : "unhealthy",
                timestamp = DateTime.UtcNow,
                service = "health-platform-api",
                version = "1.0.0",
                checks = new
                {
                    database = canConnect ? "connected" : "disconnected"
                }
            };

            var statusCode = canConnect ? StatusCodes.Status200OK : StatusCodes.Status503ServiceUnavailable;
            return StatusCode(statusCode, healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during health check");
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                timestamp = DateTime.UtcNow,
                service = "health-platform-api",
                error = ex.Message
            });
        }
    }
}
