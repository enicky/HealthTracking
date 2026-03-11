using HealthPlatform.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class WristTemperatureController : ControllerBase
{
    private readonly IWristTemperatureService _service;
    private readonly ILogger<WristTemperatureController> _logger;

    public WristTemperatureController(IWristTemperatureService service, ILogger<WristTemperatureController> logger)
    {
        _service = service;
        _logger = logger;
    }

    /// <summary>Creates a new wrist temperature reading</summary>
    [HttpPost]
    public async Task<ActionResult<WristTemperatureReadingDto>> CreateReading([FromBody] CreateWristTemperatureReadingDto dto)
    {
        try
        {
            _logger.LogInformation("Creating wrist temperature reading");
            var result = await _service.CreateReadingAsync(dto);
            return CreatedAtAction(nameof(GetReading), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized access: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning("Duplicate reading detected: {Message}", ex.Message);
            return Conflict(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating wrist temperature reading");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves wrist temperature readings for the current user</summary>
    [HttpGet]
    public async Task<ActionResult<List<WristTemperatureReadingDto>>> GetReadings([FromQuery] int skip = 0, [FromQuery] int take = 50)
    {
        try
        {
            var readings = await _service.GetReadingsAsync(skip, take);
            return Ok(readings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving wrist temperature readings");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Retrieves a specific wrist temperature reading by ID</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<WristTemperatureReadingDto>> GetReading(Guid id)
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
            _logger.LogError(ex, "Error retrieving wrist temperature reading {ReadingId}", id);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Deletes a wrist temperature reading by ID</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReading(Guid id)
    {
        try
        {
            await _service.DeleteReadingAsync(id);
            _logger.LogInformation($"Deleted reading: {id}");
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            _logger.LogWarning($"Reading not found for deletion: {id}");
            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error deleting reading: {id}");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Bulk insert wrist temperature readings</summary>
    [HttpPost("bulk")]
    public async Task<IActionResult> Bulk([FromBody] List<CreateWristTemperatureReadingDto> records)
    {
        if (!records.Any())
        {
            _logger.LogWarning("Bulk insert called with empty list");
            return BadRequest(new { error = "No records provided" });
        }

        try
        {
            _logger.LogInformation("Processing bulk request with {Count} wrist temperature records", records.Count);

            var createdReadings = new List<WristTemperatureReadingDto>();
            var failedRecords = new List<object>();

            for (int i = 0; i < records.Count; i++)
            {
                try
                {
                    var result = await _service.CreateReadingAsync(records[i]);
                    createdReadings.Add(result);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create wrist temperature reading at index {Index}", i);
                    failedRecords.Add(new
                    {
                        index = i,
                        record = records[i],
                        error = ex.Message
                    });
                }
            }

            _logger.LogInformation("Bulk operation completed: {SuccessCount} created, {FailureCount} failed",
                createdReadings.Count, failedRecords.Count);

            return Ok(new
            {
                successCount = createdReadings.Count,
                failureCount = failedRecords.Count,
                createdReadings = createdReadings,
                failedRecords = failedRecords.Any() ? failedRecords : null
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Unauthorized bulk insert: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk wrist temperature insert");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
