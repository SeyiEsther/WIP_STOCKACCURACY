// ─── WatchlistController.cs — the API endpoints behind the watchlist tabs ─────
// A small sibling of StockController. Same pattern throughout: ask the
// repository, return JSON, and turn any error into a safe response. It serves:
//   • GET /api/watchlist/production — watched materials' current stock and the
//     quantity produced in the last 24 hours.
//   • GET /api/watchlist/painted    — painted (RAL-finished) materials' current
//     stock quantity.

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

    // Painted (RAL-finished) materials with their current stock quantity,
    // sourced from CSMDATAWH.
    [HttpGet("painted")]
    public async Task<IActionResult> GetPainted()
    {
        try
        {
            var data = await _repo.GetPaintedWatchAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "GET watchlist/painted failed");
            object payload = _env.IsDevelopment()
                ? new { error = ex.Message, type = ex.GetType().Name }
                : new { error = "Internal server error" };
            return StatusCode(500, payload);
        }
    }
}
