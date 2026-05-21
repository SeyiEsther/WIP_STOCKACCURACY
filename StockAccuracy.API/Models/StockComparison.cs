namespace StockAccuracy.API.Models;

public class StockComparison
{
    public string  MaterialNumber { get; set; } = string.Empty;
    public string  MaterialDesc   { get; set; } = string.Empty;
    public string  SLoc           { get; set; } = string.Empty;
    public decimal QtyYesterday   { get; set; }
    public decimal QtyToday       { get; set; }
    public decimal Delta          { get; set; }
    public decimal PctChange      { get; set; }
    public string  Status         { get; set; } = string.Empty;
    public string  BaseUnit       { get; set; } = string.Empty;
    public string? MRPController  { get; set; }
    public DateTime TodayDate     { get; set; }
    public DateTime YesterdayDate { get; set; }

    /// <summary>
    /// Unit price / moving-average price.
    /// Add to vw_StockComparison:  ISNULL(mb.VERPR, mb.STPRS) / 10 AS UnitValue
    /// joining MBEW mb ON mb.MATNR = … AND mb.BWKEY = … (or local SAP equivalent)
    /// </summary>
    public decimal? UnitValue { get; set; }
}
