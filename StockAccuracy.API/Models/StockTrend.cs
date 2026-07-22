namespace StockAccuracy.API.Models;

// One row per day: how many materials were tracked and how many were flagged on
// that date. A series of these drives the 7-/14-day trend charts in the UI.
public class StockTrend
{
    public DateTime SnapshotDate  { get; set; }
    public int      TotalTracked  { get; set; }
    public int      Flagged       { get; set; }
}
