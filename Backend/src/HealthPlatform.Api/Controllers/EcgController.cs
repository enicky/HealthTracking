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

    [HttpPost("ecgbulk")]
    public async Task<IActionResult> Bulk([FromBody] List<EcgSessionDto> sessions)
    {
        try
        {
            _logger.LogInformation("📥 Bulk ECG upload received: {Count} sessions", sessions?.Count ?? 0);

            var userId = HttpContext.Items["UserId"];
            var tenantId = HttpContext.Items["TenantId"];

            _logger.LogInformation("👤 User Context - UserId: {UserId}, TenantId: {TenantId}", userId, tenantId);

            if (sessions == null || sessions.Count == 0)
            {
                _logger.LogWarning("⚠️ Empty session list provided");
                return BadRequest(new { error = "Session list cannot be empty" });
            }

            // Log contents of received sessions
            _logger.LogInformation("📋 Received {Count} ECG sessions for processing:", sessions.Count);
            for (int i = 0; i < sessions.Count; i++)
            {
                var session = sessions[i];
                _logger.LogInformation("  [{Index}] Id: {SessionId}", i, session.Id);
                _logger.LogInformation("      RecordedAt: {RecordedAt:O} (Year: {Year})", session.RecordedAt, session.RecordedAt.Year);
                _logger.LogInformation("      CreatedAt: {CreatedAt:O} (Year: {Year})", session.CreatedAt, session.CreatedAt.Year);
                _logger.LogInformation("      Classification: {Classification}", session.Classification ?? "NULL");
                _logger.LogInformation("      AverageHeartRate: {HeartRate}", session.AverageHeartRate ?? 0);
                var sampleCount = session.Samples.ValueKind == System.Text.Json.JsonValueKind.Array ? session.Samples.GetArrayLength() : 0;
                _logger.LogInformation("      Sample Count: {SampleCount}", sampleCount);
            }

            // Fetch existing sessions to check for duplicates
            var existingSessions = await _ecgService.GetEcgSessionsAsync(0, 1000);
            var existingRecordedAtValues = existingSessions
                .Select(s => s.RecordedAt)
                .ToHashSet();

            int created = 0;
            int duplicates = 0;
            var errors = new List<string>();
            var createdInBatch = new HashSet<DateTime>();

            foreach (var sessionDto in sessions)
            {
                try
                {
                    // Check for duplicates: 1) in existing data, 2) in current batch
                    if (existingRecordedAtValues.Contains(sessionDto.RecordedAt) || createdInBatch.Contains(sessionDto.RecordedAt))
                    {
                        duplicates++;
                        _logger.LogInformation("⏭️ Skipped duplicate session - RecordedAt: {RecordedAt}", sessionDto.RecordedAt.ToString("yyyy-MM-dd HH:mm:ss"));
                        continue;
                    }

                    _logger.LogInformation("🔄 Processing session - RecordedAt (incoming): {RecordedAt:O} (Year: {Year}, Kind: {Kind})", 
                        sessionDto.RecordedAt, sessionDto.RecordedAt.Year, sessionDto.RecordedAt.Kind);

                    // Create new session from DTO
                    var createDto = new CreateEcgSessionDto
                    {
                        RecordedAt = sessionDto.RecordedAt,
                        Classification = sessionDto.Classification,
                        AverageHeartRate = sessionDto.AverageHeartRate,
                        Samples = sessionDto.Samples
                    };

                    _logger.LogInformation("   RecordedAt (after DTO copy): {RecordedAt:O} (Year: {Year}, Kind: {Kind})", 
                        createDto.RecordedAt, createDto.RecordedAt.Year, createDto.RecordedAt.Kind);

                    var result = await _ecgService.CreateEcgSessionAsync(createDto);
                    
                    _logger.LogInformation("   RecordedAt (after service): {RecordedAt:O} (Year: {Year}, Kind: {Kind})", 
                        result.RecordedAt, result.RecordedAt.Year, result.RecordedAt.Kind);
                    
                    created++;
                    createdInBatch.Add(sessionDto.CreatedAt);
                    _logger.LogInformation("✅ Bulk session created - SessionId: {SessionId}, RecordedAt stored as: {RecordedAt:yyyy-MM-dd HH:mm:ss}", result.Id, result.RecordedAt);
                }
                catch (Exception ex)
                {
                    errors.Add($"Failed to create session recorded at {sessionDto.RecordedAt:yyyy-MM-dd HH:mm:ss}: {ex.Message}");
                    _logger.LogWarning(ex, "❌ Error creating session in bulk upload - RecordedAt: {RecordedAt}", sessionDto.RecordedAt);
                }
            }

            _logger.LogInformation("📊 Bulk upload completed - Created: {Created}, Duplicates: {Duplicates}, Errors: {ErrorCount}", created, duplicates, errors.Count);

            return Ok(new
            {
                success = true,
                created,
                duplicates,
                errors = errors.Count > 0 ? errors : null,
                message = $"Imported {created} sessions, skipped {duplicates} duplicates"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error in bulk ECG upload");
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }
    /// <summary>Creates a new ECG session</summary>
    [HttpPost]
    public async Task<ActionResult<EcgSessionDto>> CreateSession([FromBody] CreateEcgSessionDto dto)
    {
        try
        {
            _logger.LogInformation("🚀 CreateSession endpoint hit!");

            var userId = HttpContext.Items["UserId"];
            var tenantId = HttpContext.Items["TenantId"];

            _logger.LogInformation("👤 User Context - UserId: {UserId}, TenantId: {TenantId}", userId, tenantId);

            if (dto == null)
            {
                _logger.LogWarning("⚠️ DTO is null");
                return BadRequest("Request body cannot be empty");
            }

            _logger.LogInformation("📲 ECG Data Received:");
            _logger.LogInformation("   - Classification: {Classification}", dto.Classification ?? "NULL");
            _logger.LogInformation("   - Heart Rate: {HeartRate}", dto.AverageHeartRate ?? 0);
            _logger.LogInformation("   - Recorded At (Raw): {RecordedAt:O}", dto.RecordedAt);
            _logger.LogInformation("   - Recorded At (Formatted): {RecordedAt:yyyy-MM-dd HH:mm:ss}", dto.RecordedAt);
            _logger.LogInformation("   - Recorded At (Unix Timestamp): {UnixTimestamp}", dto.RecordedAtDebug);
            _logger.LogInformation("   - Recorded At (Year): {Year}", dto.RecordedAt.Year);

            if (dto.Samples.ValueKind != System.Text.Json.JsonValueKind.Null && dto.Samples.ValueKind != System.Text.Json.JsonValueKind.Undefined)
            {
                try
                {
                    int sampleCount = 0;
                    if (dto.Samples.ValueKind == System.Text.Json.JsonValueKind.Array)
                    {
                        sampleCount = dto.Samples.GetArrayLength();
                    }
                    _logger.LogInformation("   - Sample Count: {SampleCount} (samples filtered from log)", sampleCount);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Could not parse ECG samples");
                }
            }
            else
            {
                _logger.LogWarning("⚠️ No samples provided in request");
            }

            _logger.LogInformation("💾 Creating ECG session...");
            var result = await _ecgService.CreateEcgSessionAsync(dto);

            _logger.LogInformation("✅ ECG session created successfully - SessionId: {SessionId}", result.Id);
            return CreatedAtAction(nameof(GetSession), new { id = result.Id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("❌ Unauthorized access: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error creating ECG session");
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
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

    /// <summary>Deletes an ECG session</summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        try
        {
            _logger.LogInformation("🗑️ DeleteSession endpoint hit! - SessionId: {SessionId}", id);

            var result = await _ecgService.DeleteEcgSessionAsync(id);

            if (!result)
            {
                _logger.LogWarning("❌ ECG session not found - SessionId: {SessionId}", id);
                return NotFound(new { error = "ECG session not found" });
            }

            _logger.LogInformation("✅ ECG session deleted successfully - SessionId: {SessionId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "💥 Error deleting ECG session {SessionId}", id);
            return StatusCode(500, new { error = "Internal server error", details = ex.Message });
        }
    }
}
