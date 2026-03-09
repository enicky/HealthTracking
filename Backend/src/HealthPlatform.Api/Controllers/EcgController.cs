using HealthPlatform.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class EcgController : ControllerBase
{
    private readonly IEcgService _ecgService;
    private readonly ILogger<EcgController> _logger;

    public EcgController(IEcgService ecgService, ILogger<EcgController> logger)
    {
        _ecgService = ecgService;
        _logger = logger;
    }

    /// <summary>Creates a new ECG session</summary>
    [HttpPost]
    public async Task<ActionResult<EcgSessionDto>> CreateSession([FromBody] CreateEcgSessionDto dto)
    {
        try
        {
            _logger.LogInformation("Creating ECG session for user {UserId}", HttpContext.Items["UserId"]);
            var result = await _ecgService.CreateEcgSessionAsync(dto);
            return CreatedAtAction(nameof(GetSession), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating ECG session");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves ECG sessions for the current user</summary>
    [HttpGet]
    public async Task<ActionResult<List<EcgSessionDto>>> GetSessions([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        try
        {
            var sessions = await _ecgService.GetEcgSessionsAsync(skip, take);
            return Ok(sessions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ECG sessions");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves a specific ECG session by ID</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<EcgSessionDto>> GetSession(Guid id)
    {
        try
        {
            var session = await _ecgService.GetEcgSessionByIdAsync(id);
            if (session == null)
                return NotFound();

            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving ECG session {SessionId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
