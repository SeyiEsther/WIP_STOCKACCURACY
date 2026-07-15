using Microsoft.AspNetCore.Mvc;
using StockAccuracy.API.Data;

namespace StockAccuracy.API.Controllers;

[ApiController]
[Route("api/watchlist")]
public class WatchlistController : ControllerBase
{
    private readonly IWatchlistRepository _repo;
    private readonly IHostEnvironment     _env;
    private readonly ILogger<WatchlistController> _log;

    public WatchlistController(IWatchlistRepository repo, IHostEnvironment env, ILogger<WatchlistController> log)
    {
        _repo = repo;
        _env  = env;
        _log  = log;
    }

    // Watchlisted materials with current stock and quantity produced in the last
    // 24 hours, sourced from CSMDATAWH.
    [HttpGet("production")]
    public async Task<IActionResult> GetProduction()
    {
        try
        {
            var data = await _repo.GetProductionWatchAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "GET watchlist/production failed");
            object payload = _env.IsDevelopment()
                ? new { error = ex.Message, type = ex.GetType().Name }
                : new { error = "Internal server error" };
            return StatusCode(500, payload);
        }
    }
}
