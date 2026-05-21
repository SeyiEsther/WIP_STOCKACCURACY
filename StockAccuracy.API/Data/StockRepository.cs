using Dapper;
using Microsoft.Data.SqlClient;
using StockAccuracy.API.Models;

namespace StockAccuracy.API.Data;

public interface IStockRepository
{
    Task<IEnumerable<StockComparison>> GetStockComparisonAsync();
    Task<StockSummary>                 GetStockSummaryAsync();
    Task<IEnumerable<StockTrend>>      GetStockTrendAsync();
    Task<IEnumerable<MaterialTrend>>   GetMaterialTrendsAsync(int days = 5);
}

public class StockRepository : IStockRepository
{
    private readonly string _connectionString;
    private readonly ILogger<StockRepository> _logger;

    public StockRepository(IConfiguration config, ILogger<StockRepository> logger)
    {
        _connectionString = config.GetConnectionString("StockDb")
            ?? throw new InvalidOperationException("Connection string 'StockDb' is not configured.");
        _logger = logger;
    }

    public async Task<IEnumerable<StockComparison>> GetStockComparisonAsync()
    {
        try
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryAsync<StockComparison>("SELECT * FROM dbo.vw_StockComparison");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query vw_StockComparison");
            throw;
        }
    }

    public async Task<StockSummary> GetStockSummaryAsync()
    {
        try
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryFirstOrDefaultAsync<StockSummary>(
                       "SELECT * FROM dbo.vw_StockSummary")
                   ?? new StockSummary();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query vw_StockSummary");
            throw;
        }
    }

    public async Task<IEnumerable<StockTrend>> GetStockTrendAsync()
    {
        try
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryAsync<StockTrend>(@"
                SELECT
                    t.SnapshotDate,
                    COUNT(*)  AS TotalTracked,
                    SUM(CASE
                        WHEN y.Qty IS NOT NULL
                         AND y.Qty > 0
                         AND ABS((t.Qty - y.Qty) / y.Qty * 100) > 10
                        THEN 1 ELSE 0
                    END) AS Flagged
                FROM dbo.StockSnapshot t
                LEFT JOIN dbo.StockSnapshot y
                    ON  y.MaterialNumber = t.MaterialNumber
                    AND y.SLoc           = t.SLoc
                    AND y.SnapshotDate   = DATEADD(DAY, -1, t.SnapshotDate)
                WHERE t.SnapshotDate IN (
                    SELECT TOP 7 SnapshotDate
                    FROM (SELECT DISTINCT SnapshotDate FROM dbo.StockSnapshot) d
                    ORDER BY SnapshotDate DESC
                )
                GROUP BY t.SnapshotDate
                ORDER BY t.SnapshotDate ASC
            ");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query stock trend");
            throw;
        }
    }

    /// <summary>
    /// Returns directional trend per material+SLoc over the last <paramref name="days"/> snapshot days.
    /// UP   = every day-over-day step was positive (qty rose each day)
    /// DOWN = every step was negative
    /// FLAT = mixed or zero movement
    /// </summary>
    public async Task<IEnumerable<MaterialTrend>> GetMaterialTrendsAsync(int days = 5)
    {
        if (days < 2)  days = 2;
        if (days > 30) days = 30;

        try
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryAsync<MaterialTrend>(@"
                WITH RecentDates AS (
                    SELECT TOP (@Days + 1) SnapshotDate
                    FROM (SELECT DISTINCT SnapshotDate FROM dbo.StockSnapshot) d
                    ORDER BY SnapshotDate DESC
                ),
                Snaps AS (
                    SELECT
                        s.MaterialNumber, s.SLoc, s.Qty,
                        LAG(s.Qty) OVER (
                            PARTITION BY s.MaterialNumber, s.SLoc
                            ORDER BY s.SnapshotDate
                        ) AS PrevQty
                    FROM dbo.StockSnapshot s
                    INNER JOIN RecentDates rd ON rd.SnapshotDate = s.SnapshotDate
                ),
                Steps AS (
                    SELECT MaterialNumber, SLoc,
                        SIGN(Qty - PrevQty) AS Dir
                    FROM Snaps
                    WHERE PrevQty IS NOT NULL
                )
                SELECT
                    MaterialNumber,
                    SLoc,
                    COUNT(*)  AS DataPoints,
                    CASE
                        WHEN MIN(Dir) = 1  THEN 'UP'
                        WHEN MAX(Dir) = -1 THEN 'DOWN'
                        ELSE 'FLAT'
                    END AS TrendDirection
                FROM Steps
                GROUP BY MaterialNumber, SLoc
                HAVING COUNT(*) >= 2
            ", new { Days = days });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query material trends (days={Days})", days);
            throw;
        }
    }
}
