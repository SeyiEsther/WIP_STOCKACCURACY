namespace StockAccuracy.API.Models;

// A "model" is simply a data shape — a plain container with named fields and no
// behaviour. Each property here lines up with a column returned by the
// vw_StockComparison database view; Dapper copies the values across for us. This
// is the same shape the React front end receives as JSON (see norm() in the UI).
//
// One row = one material at one storage location, comparing today vs yesterday.
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

    /// <summary>Real ABC classification from vw_StockComparison ('A','B','C', or null).</summary>
    public string? ABCClass       { get; set; }

    public DateTime TodayDate     { get; set; }
    public DateTime YesterdayDate { get; set; }

    /// <summary>
    /// Unit price / moving-average price.
    /// Add to vw_StockComparison:  ISNULL(mb.VERPR, mb.STPRS) / 10 AS UnitValue
    /// joining MBEW mb ON mb.MATNR = … AND mb.BWKEY = … (or local SAP equivalent)
    /// </summary>
    public decimal? UnitValue { get; set; }
}
