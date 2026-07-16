using Dapper;
using Microsoft.Data.SqlClient;
using StockAccuracy.API.Models;

namespace StockAccuracy.API.Data;

public interface IWatchlistRepository
{
    Task<IEnumerable<ProductionStock>> GetProductionWatchAsync();
}

public class WatchlistRepository : IWatchlistRepository
{
    private readonly string _connectionString;
    private readonly ILogger<WatchlistRepository> _logger;

    public WatchlistRepository(IConfiguration config, ILogger<WatchlistRepository> logger)
    {
        // Read the SQL-auth connection string straight from configuration and open
        // a raw SqlConnection with it (below) — no Entity Framework, no Windows Auth.
        _connectionString = config.GetConnectionString("DataWarehouseConnection")
            ?? throw new InvalidOperationException("Connection string 'DataWarehouseConnection' is not configured.");
        _logger = logger;
    }

    // Aggregate each source table separately before joining, so a material that
    // exists in multiple storage locations is not double-counted (a direct join
    // multiplies the stock and made-quantity rows together).
    private const string ProductionSql = @"
WITH StockByMaterial AS (
    SELECT
        LTRIM(RTRIM(Material)) AS Material,
        MAX(LTRIM(RTRIM(MaterialDescription))) AS Description,
        SUM(TRY_CAST(REPLACE(LTRIM(RTRIM(UnrestrU)), ',', '') AS DECIMAL(18,3))) AS InStockNow
    FROM dbo.zmm_li009
    WHERE LTRIM(RTRIM(Material)) IN (
        '433900','433432','433434','434026','433229','432574',
        '433901','434014','434016','434018','400463','433033',
        '434013','433433','433435','400477','434021','434027',
        '400478','400479','432625','433913','433909','433910',
        '433906','410401','434166','400557','434147','400592',
        '400593','434150','433230','433231','433746','433744'
    )
    GROUP BY LTRIM(RTRIM(Material))
),
MadeByMaterial AS (
    SELECT
        LTRIM(RTRIM(Material)) AS Material,
        SUM(TRY_CAST(LTRIM(RTRIM(YieldToConf)) AS DECIMAL(18,3))) AS MadeIn24Hours
    FROM dbo.zpp_conf_reportDataWH24Hour
    WHERE LTRIM(RTRIM(Material)) IN (
        '433900','433432','433434','434026','433229','432574',
        '433901','434014','434016','434018','400463','433033',
        '434013','433433','433435','400477','434021','434027',
        '400478','400479','432625','433913','433909','433910',
        '433906','410401','434166','400557','434147','400592',
        '400593','434150','433230','433231','433746','433744'
    )
    AND YieldToConf NOT LIKE '%-%'
    GROUP BY LTRIM(RTRIM(Material))
)
SELECT
    s.Material,
    s.Description,
    s.InStockNow,
    ISNULL(m.MadeIn24Hours, 0) AS MadeIn24Hours
FROM StockByMaterial s
LEFT JOIN MadeByMaterial m ON m.Material = s.Material
ORDER BY s.Material;";

    public async Task<IEnumerable<ProductionStock>> GetProductionWatchAsync()
    {
        try
        {
            using var conn = new SqlConnection(_connectionString);
            return await conn.QueryAsync<ProductionStock>(ProductionSql);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to query production watchlist from CSMDATAWH");
            throw;
        }
    }
}
