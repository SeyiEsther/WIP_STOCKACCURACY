namespace StockAccuracy.API.Models;

public class MaterialTrend
{
    public string MaterialNumber   { get; set; } = string.Empty;
    public string SLoc             { get; set; } = string.Empty;
    public string TrendDirection   { get; set; } = "FLAT";
    public int    DataPoints       { get; set; }
}
