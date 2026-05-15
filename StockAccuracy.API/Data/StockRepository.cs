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

    public StockRepository(IConfiguration config)
    {
        _connectionString = config.GetConnectionString("StockDb")
            ?? throw new InvalidOperationException("Connection string 'StockDb' not configured.");
    }

    public async Task<IEnumerable<StockComparison>> GetStockComparisonAsync()
    {
        using var conn = new SqlConnection(_connectionString);
        return await conn.QueryAsync<StockComparison>("SELECT * FROM vw_StockComparison");
    }

    public async Task<StockSummary> GetStockSummaryAsync()
    {
        using var conn = new SqlConnection(_connectionString);
        return await conn.QuerySingleAsync<StockSummary>("SELECT * FROM vw_StockSummary");
    }
}
