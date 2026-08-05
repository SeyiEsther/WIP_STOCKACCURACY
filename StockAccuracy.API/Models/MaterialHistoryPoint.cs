namespace StockAccuracy.API.Models;

/// <summary>
/// One day's total quantity for a single material across all storage locations,
/// used to draw a per-material trend line over the last N snapshot days.
/// </summary>
public class MaterialHistoryPoint
{
    public DateTime SnapshotDate { get; set; }
    public decimal  Quantity     { get; set; }
}
