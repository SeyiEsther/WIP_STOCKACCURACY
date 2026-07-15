namespace StockAccuracy.API.Models;

/// <summary>
/// A watchlisted material with its current stock and the quantity produced in
/// the last 24 hours, sourced from the CSMDATAWH warehouse.
/// </summary>
public class ProductionStock
{
    public string   Material      { get; set; } = string.Empty;
    public string   Description   { get; set; } = string.Empty;
    public decimal? InStockNow    { get; set; }
    public decimal  MadeIn24Hours { get; set; }
}
