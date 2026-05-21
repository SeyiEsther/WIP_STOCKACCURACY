using Dapper;
using Microsoft.Data.SqlClient;
using StockAccuracy.API.Models;

namespace StockAccuracy.API.Data;

public interface IStockRepository
{
    Task<IEnumerable<StockComparison>> GetStockComparisonAsync();
    Task<StockSummary> GetStockSummaryAsync();
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
}
