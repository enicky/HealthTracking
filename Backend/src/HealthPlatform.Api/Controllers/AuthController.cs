using HealthPlatform.Application;
using HealthPlatform.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HealthPlatform.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>Authenticates a user and returns a JWT token</summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT token and user information</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { error = "Email and password are required" });
        }

        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);
            var response = await _authService.LoginAsync(request.Email, request.Password);
            _logger.LogInformation("Successful login for user: {Email}", request.Email);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed: {Message}", ex.Message);
            return Unauthorized(new { error = "Invalid credentials" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Login error: {Message}", ex.Message);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>Validates a JWT token</summary>
    /// <param name="token">JWT token to validate</param>
    /// <returns>Validation result</returns>
    [HttpPost("validate")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(object), StatusCodes.Status401Unauthorized)]
    public ActionResult ValidateToken([FromBody] TokenValidationRequest request)
    {
        if (string.IsNullOrEmpty(request.Token))
        {
            return BadRequest(new { error = "Token is required" });
        }

        var principal = _authService.ValidateToken(request.Token);
        if (principal == null)
        {
            return Unauthorized(new { error = "Invalid or expired token" });
        }

        return Ok(new { valid = true });
    }
}

/// <summary>Token validation request</summary>
public class TokenValidationRequest
{
    public string Token { get; set; } = string.Empty;
}
