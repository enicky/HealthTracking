using HealthPlatform.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class BloodPressureController : ControllerBase
{
    private readonly IBloodPressureService _service;
    private readonly ILogger<BloodPressureController> _logger;

    public BloodPressureController(IBloodPressureService service, ILogger<BloodPressureController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>Creates a new blood pressure reading</summary>
    [HttpPost]
    public async Task<ActionResult<BloodPressureReadingDto>> CreateReading([FromBody] CreateBloodPressureReadingDto dto)
    {
        try
        {
            _logger.LogInformation("Creating blood pressure reading for user {UserId}", HttpContext.Items["UserId"]);
            var result = await _service.CreateReadingAsync(dto);
            return CreatedAtAction(nameof(GetReading), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating blood pressure reading");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves blood pressure readings for the current user</summary>
    [HttpGet]
    public async Task<ActionResult<List<BloodPressureReadingDto>>> GetReadings([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        try
        {
            var readings = await _service.GetReadingsAsync(skip, take);
            return Ok(readings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blood pressure readings");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves a specific blood pressure reading by ID</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<BloodPressureReadingDto>> GetReading(Guid id)
    {
        try
        {
            var reading = await _service.GetReadingByIdAsync(id);
            if (reading == null)
                return NotFound();

            return Ok(reading);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving blood pressure reading {ReadingId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Deletes a blood pressure reading</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReading(Guid id)
    {
        try
        {
            var userId = HttpContext.Items["UserId"]?.ToString();
            _logger.LogInformation("Deleting blood pressure reading {ReadingId} for user {UserId}", id, userId);
            
            await _service.DeleteReadingAsync(id);
            return Ok(new { success = true, message = "Blood pressure reading deleted successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting blood pressure reading {ReadingId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
