namespace StockAccuracy.API.Models;

public class StockSummary
{
    public int TotalTracked { get; set; }
    public int TotalFlagged { get; set; }
    public int TotalNew { get; set; }
    public int TotalMissing { get; set; }
    public DateTime? LastSnapshotDate { get; set; }
}
