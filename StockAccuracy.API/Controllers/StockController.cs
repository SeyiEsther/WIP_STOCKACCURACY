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
    private readonly IStockRepository _repo;
    private readonly IConfiguration   _config;
    private readonly ILogger<StockController> _log;
    private readonly IWebHostEnvironment _env;

    public StockController(
        IStockRepository repo,
        IConfiguration config,
        ILogger<StockController> log,
        IWebHostEnvironment env)
    {
        _repo   = repo;
        _config = config;
        _log    = log;
        _env    = env;
    }

    // Navigate to /api/stock/health in the browser to see the real connection error
    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var cs = _config.GetConnectionString("StockDb");
        if (string.IsNullOrWhiteSpace(cs))
            return StatusCode(500, new {
                error = "Connection string 'StockDb' is not configured. " +
                        "Set the ConnectionStrings__StockDb environment variable."
            });

        try
        {
            using var conn = new SqlConnection(cs);
            await conn.OpenAsync();

            var views = (await conn.QueryAsync<string>(
                "SELECT name FROM sys.views WHERE name IN ('vw_StockComparison','vw_StockSummary','vw_WatchlistComparison') ORDER BY name"
            )).ToList();

            return Ok(new
            {
                status   = "connected",
                server   = conn.DataSource,
                database = conn.Database,
                views,
                viewsOk  = views.Count == 3,
            });
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Health check failed");
            return StatusCode(500, ErrorBody(ex));
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
            _log.LogError(ex, "GET comparison failed");
            return StatusCode(500, ErrorBody(ex));
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
            _log.LogError(ex, "GET summary failed");
            return StatusCode(500, ErrorBody(ex));
        }
    }

    [HttpGet("trend")]
    public async Task<IActionResult> GetTrend([FromQuery] decimal threshold = 10)
    {
        try
        {
            var data = await _repo.GetStockTrendAsync(threshold);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "GET trend failed");
            return StatusCode(500, ErrorBody(ex));
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
            _log.LogError(ex, "GET material-trends failed");
            return StatusCode(500, ErrorBody(ex));
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
            _log.LogError(ex, "GET watchlist failed");
            return StatusCode(500, ErrorBody(ex));
        }
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string?  status,
        [FromQuery] string?  sloc,
        [FromQuery] string?  search,
        [FromQuery] string?  abcClass,
        [FromQuery] decimal  threshold = 10)
    {
        try
        {
            var data     = await _repo.GetStockComparisonAsync();
            var filtered = ApplyFilters(data, status, sloc, search, threshold, abcClass);

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
            _log.LogError(ex, "Export failed");
            return StatusCode(500, ErrorBody(ex));
        }
    }

    private object ErrorBody(Exception ex) =>
        _env.IsDevelopment()
            ? new { error = ex.Message, type = ex.GetType().Name }
            : new { error = "An internal server error occurred." };

    private static IEnumerable<StockComparison> ApplyFilters(
        IEnumerable<StockComparison> data,
        string?  status,
        string?  sloc,
        string?  search,
        decimal  threshold,
        string?  abcClass = null)
    {
        if (!string.IsNullOrWhiteSpace(sloc))
            data = data.Where(r => r.SLoc == sloc);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            data = data.Where(r =>
                (r.MaterialNumber ?? "").ToLowerInvariant().Contains(q) ||
                (r.MaterialDesc   ?? "").ToLowerInvariant().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(abcClass) && abcClass.ToUpperInvariant() != "ALL")
        {
            var cls = abcClass.ToUpperInvariant();
            data = data.Where(r => string.Equals(r.AbcClass, cls, StringComparison.OrdinalIgnoreCase));
        }

        data = status?.ToUpperInvariant() switch
        {
            "FLAGGED" => data.Where(r =>
                r.Status != "NEW" &&
                r.Status != "MISSING" &&
                Math.Abs(r.PctChange) > threshold),
            "UP"      => data.Where(r => r.Delta > 0),
            "DOWN"    => data.Where(r => r.Delta < 0),
            "NEW"     => data.Where(r => r.Status == "NEW"),
            "MISSING" => data.Where(r => r.Status == "MISSING"),
            _         => data,
        };

        return data;
    }
}
