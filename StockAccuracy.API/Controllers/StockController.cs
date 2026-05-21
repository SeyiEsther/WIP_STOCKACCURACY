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

    public StockController(IStockRepository repo, IConfiguration config)
    {
        _repo   = repo;
        _config = config;
    }

    // ── Diagnostic: open browser to /api/stock/health to see the real error ──
    [HttpGet("health")]
    public async Task<IActionResult> Health()
    {
        var cs = _config.GetConnectionString("StockDb") ?? "(connection string missing)";
        try
        {
            using var conn = new SqlConnection(cs);
            await conn.OpenAsync();

            var server   = conn.DataSource;
            var database = conn.Database;

            // Verify both views exist
            var views = await conn.QueryAsync<string>(
                "SELECT name FROM sys.views WHERE name IN ('vw_StockComparison','vw_StockSummary')");

            return Ok(new
            {
                status   = "connected",
                server,
                database,
                views    = views.ToList(),
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "failed",
                error  = ex.Message,
                type   = ex.GetType().Name,
            });
        }
    }

    [HttpGet("comparison")]
    public async Task<ActionResult<IEnumerable<StockComparison>>> GetComparison()
    {
        var data = await _repo.GetStockComparisonAsync();
        return Ok(data);
    }

    [HttpGet("summary")]
    public async Task<ActionResult<StockSummary>> GetSummary()
    {
        var summary = await _repo.GetStockSummaryAsync();
        return Ok(summary);
    }

    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string?  status,
        [FromQuery] string?  sloc,
        [FromQuery] string?  search,
        [FromQuery] decimal  threshold = 10)
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

        var filename = $"stock-accuracy-{DateTime.Today:yyyyMMdd}.csv";
        return File(stream, "text/csv", filename);
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
            _         => data
        };

        return data;
    }
}
