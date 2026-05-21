using Dapper;
using Microsoft.Data.SqlClient;
using StockAccuracy.API.Models;

namespace StockAccuracy.API.Data;

public interface IStockRepository
{
    Task<IEnumerable<StockComparison>> GetStockComparisonAsync();
    Task<StockSummary> GetStockSummaryAsync();
    Task<IEnumerable<StockTrend>> GetStockTrendAsync();
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
}
