using CsvHelper;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using StockAccuracy.API.Data;
using StockAccuracy.API.Models;
using System.Globalization;

namespace StockAccuracy.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StockController : ControllerBase
{
    private readonly IStockRepository  _repo;
    private readonly IConfiguration    _config;
    private readonly IHostEnvironment  _env;
    private readonly ILogger<StockController> _log;

    public StockController(IStockRepository repo, IConfiguration config, IHostEnvironment env, ILogger<StockController> log)
    {
        _repo   = repo;
        _config = config;
        _env    = env;
        _log    = log;
    }

    // Logs the full exception server-side and returns a client-safe payload.
    // Detailed messages are only surfaced in Development.
    private IActionResult ServerError(Exception ex, string context)
    {
        _log.LogError(ex, "{Context}", context);
        object payload = _env.IsDevelopment()
            ? new { error = ex.Message, type = ex.GetType().Name }
            : new { error = "Internal server error" };
        return StatusCode(500, payload);
    }

    // Navigate to /api/stock/health to verify the DB connection and schema.
    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var cs = _config.GetConnectionString("StockDb");
        if (string.IsNullOrWhiteSpace(cs))
            return StatusCode(500, new { error = "Connection string 'StockDb' is not configured." });

        try
        {
            using var conn = new SqlConnection(cs);
            await conn.OpenAsync();

            var views = (await conn.QueryAsync<string>(
                "SELECT name FROM sys.views WHERE name IN ('vw_StockComparison','vw_StockSummary','vw_WatchlistComparison') ORDER BY name"
            )).ToList();

            var tables = (await conn.QueryAsync<string>(
                "SELECT name FROM sys.tables WHERE name IN ('StockSnapshots','Watchlist','Investigation') ORDER BY name"
            )).ToList();

            return Ok(new
            {
                status    = "connected",
                server    = conn.DataSource,
                database  = conn.Database,
                views,
                viewsOk   = views.Count == 3,
                tables,
                tablesOk  = tables.Count == 3,
            });
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Health check failed");
            // Health is a diagnostic endpoint; surface the reason only in Development.
            var detail = _env.IsDevelopment() ? ex.Message : "Database connection failed.";
            return StatusCode(500, new { error = detail });
        }
    }

    [HttpGet("comparison")]
    public async Task<IActionResult> GetComparison()
    {
        try
        {
            var data = await _repo.GetStockComparisonAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET comparison failed");
        }
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        try
        {
            var summary = await _repo.GetStockSummaryAsync();
            return Ok(summary);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET summary failed");
        }
    }

    [HttpGet("trend")]
    public async Task<IActionResult> GetTrend()
    {
        try
        {
            var data = await _repo.GetStockTrendAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET trend failed");
        }
    }

    [HttpGet("material-trends")]
    public async Task<IActionResult> GetMaterialTrends([FromQuery] int days = 5)
    {
        try
        {
            var data = await _repo.GetMaterialTrendsAsync(days);
            return Ok(data);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET material-trends failed");
        }
    }

    [HttpGet("watchlist")]
    public async Task<IActionResult> GetWatchlist()
    {
        try
        {
            var data = await _repo.GetWatchlistComparisonAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET watchlist failed");
        }
    }

    [HttpGet("investigations")]
    public async Task<IActionResult> GetInvestigations()
    {
        try
        {
            var data = await _repo.GetInvestigationsAsync();
            return Ok(data);
        }
        catch (Exception ex)
        {
            return ServerError(ex, "GET investigations failed");
        }
    }

    [HttpPost("investigations")]
    public async Task<IActionResult> AddInvestigation([FromBody] InvestigationRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.MaterialNumber) || string.IsNullOrWhiteSpace(req.SLoc))
            return BadRequest(new { error = "materialNumber and sLoc are required." });

        try
        {
            await _repo.AddInvestigationAsync(req.MaterialNumber.Trim(), req.SLoc.Trim(), req.Note);
            return Ok(new { ok = true });
        }
        catch (Exception ex)
        {
            return ServerError(ex, "POST investigation failed");
        }
    }

    [HttpDelete("investigations")]
    public async Task<IActionResult> RemoveInvestigation([FromQuery] string materialNumber, [FromQuery] string sloc)
    {
        if (string.IsNullOrWhiteSpace(materialNumber) || string.IsNullOrWhiteSpace(sloc))
            return BadRequest(new { error = "materialNumber and sloc are required." });

        try
        {
            await _repo.RemoveInvestigationAsync(materialNumber.Trim(), sloc.Trim());
            return Ok(new { ok = true });
        }
        catch (Exception ex)
        {
            return ServerError(ex, "DELETE investigation failed");
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string?  status,
        [FromQuery] string?  sloc,
        [FromQuery] string?  search,
        [FromQuery] decimal  threshold = 10)
    {
        try
        {
            var data     = await _repo.GetStockComparisonAsync();
            var filtered = ApplyFilters(data, status, sloc, search, threshold);

            var stream = new MemoryStream();
            using (var writer = new StreamWriter(stream, leaveOpen: true))
            using (var csv    = new CsvWriter(writer, CultureInfo.InvariantCulture))
            {
                csv.WriteRecords(filtered);
            }
            stream.Position = 0;

            return File(stream, "text/csv", $"stock-accuracy-{DateTime.Today:yyyyMMdd}.csv");
        }
        catch (Exception ex)
        {
            return ServerError(ex, "Export failed");
        }
    }

    private static IEnumerable<StockComparison> ApplyFilters(
        IEnumerable<StockComparison> data,
        string?  status,
        string?  sloc,
        string?  search,
        decimal  threshold)
    {
        if (!string.IsNullOrWhiteSpace(sloc))
            data = data.Where(r => r.SLoc == sloc);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            data = data.Where(r =>
                r.MaterialNumber.ToLowerInvariant().Contains(q) ||
                r.MaterialDesc.ToLowerInvariant().Contains(q));
        }

        data = status?.ToUpperInvariant() switch
        {
            "FLAGGED" => data.Where(r => Math.Abs(r.PctChange) > threshold),
            "UP"      => data.Where(r => r.Delta > 0),
            "DOWN"    => data.Where(r => r.Delta < 0),
            "NEW"     => data.Where(r => r.Status == "NEW"),
            "MISSING" => data.Where(r => r.Status == "MISSING"),
            _         => data,
        };

        return data;
    }
}
