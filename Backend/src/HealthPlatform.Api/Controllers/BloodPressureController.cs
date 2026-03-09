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
            _logger.LogInformation("Creating blood pressure reading");
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

    /// <summary>Deletes a blood pressure reading by ID</summary>
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

    [HttpPost("bulk")]
    public async Task<IActionResult> Bulk([FromBody] List<CreateBloodPressureReadingDto> records)
    {
        try
        {
            if (records == null || records.Count == 0)
            {
                return BadRequest(new { error = "No records provided" });
            }

            _logger.LogInformation("Processing bulk request with {Count} blood pressure records", records.Count);

            var createdReadings = new List<BloodPressureReadingDto>();
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
                    _logger.LogWarning(ex, "Failed to create blood pressure reading at index {Index}", i);
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
                failedRecords = failedRecords.Count > 0 ? failedRecords : null
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing bulk blood pressure records");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
