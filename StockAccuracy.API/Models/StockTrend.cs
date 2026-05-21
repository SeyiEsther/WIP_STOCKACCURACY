namespace StockAccuracy.API.Models;

public class StockTrend
{
    public DateTime SnapshotDate  { get; set; }
    public int      TotalTracked  { get; set; }
    public int      Flagged       { get; set; }
}
