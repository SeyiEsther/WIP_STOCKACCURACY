namespace StockAccuracy.API.Models;

/// <summary>
/// One SOFPRO/SOFCSM order line from PrototypePartsDaily (StockAccuracy DB).
/// Not aggregated — a material can appear on multiple lines with different SDDocument values.
/// </summary>
public class PrototypeStockLine
{
    public string   SLoc           { get; set; } = string.Empty;
    public string   MaterialNumber { get; set; } = string.Empty;
    public string   MaterialDesc   { get; set; } = string.Empty;
    public decimal? Quantity       { get; set; }
    public string   SDDocument     { get; set; } = string.Empty;
    public string?  ABCClass       { get; set; }
}
