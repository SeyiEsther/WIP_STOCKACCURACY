namespace StockAccuracy.API.Models;

// The single-row totals shown in the KPI cards at the top of the dashboard:
// how many materials are tracked, flagged, new, or missing today.
public class StockSummary
{
    public int TotalTracked { get; set; }
    public int TotalFlagged { get; set; }
    public int TotalNew { get; set; }
    public int TotalMissing { get; set; }
    public DateTime? LastSnapshotDate { get; set; }
}
