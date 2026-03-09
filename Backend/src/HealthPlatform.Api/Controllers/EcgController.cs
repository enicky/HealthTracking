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
            _logger.LogInformation("Creating ECG session");
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
            {
                _logger.LogWarning($"Session not found: {id}");
                return NotFound();
            }

            _logger.LogInformation($"Retrieved session: {id}");
            return Ok(session);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error retrieving session: {id}");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Creates multiple ECG sessions in bulk</summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> Bulk([FromBody] List<CreateEcgSessionDto> records)
    {
        try
        {
            if (records == null || records.Count == 0)
            {
                return BadRequest(new { error = "No records provided" });
            }

            _logger.LogInformation("Processing bulk ECG request with {Count} sessions", records.Count);

            var createdSessions = new List<EcgSessionDto>();
            var failedRecords = new List<object>();

            for (int i = 0; i < records.Count; i++)
            {
                try
                {
                    var result = await _ecgService.CreateEcgSessionAsync(records[i]);
                    createdSessions.Add(result);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create ECG session at index {Index}", i);
                    failedRecords.Add(new
                    {
                        index = i,
                        record = records[i],
                        error = ex.Message
                    });
                }
            }

            _logger.LogInformation("Bulk ECG operation completed: {SuccessCount} created, {FailureCount} failed", 
                createdSessions.Count, failedRecords.Count);

            return Ok(new
            {
                successCount = createdSessions.Count,
                failureCount = failedRecords.Count,
                createdSessions = createdSessions,
                failedRecords = failedRecords.Count > 0 ? failedRecords : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing bulk ECG sessions");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
