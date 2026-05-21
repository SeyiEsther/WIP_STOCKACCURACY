namespace StockAccuracy.API.Models;

/// <summary>
/// Per-material directional trend over the last N snapshot days.
/// TrendDirection: "UP" = all N day-over-day steps were positive,
///                 "DOWN" = all negative, "FLAT" = mixed or zero movement.
/// DataPoints = number of day-over-day steps evaluated (≤ N).
/// </summary>
public class MaterialTrend
{
    public string MaterialNumber   { get; set; } = string.Empty;
    public string SLoc             { get; set; } = string.Empty;
    public string TrendDirection   { get; set; } = "FLAT";   // UP | DOWN | FLAT
    public int    DataPoints       { get; set; }
}
