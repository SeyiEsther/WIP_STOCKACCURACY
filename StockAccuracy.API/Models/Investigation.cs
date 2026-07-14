namespace StockAccuracy.API.Models;

/// <summary>
/// A material/SLoc that a user has marked as investigated. Persisted server-side
/// so acknowledgements are shared across users and browsers.
/// </summary>
public class Investigation
{
    public string   MaterialNumber { get; set; } = string.Empty;
    public string   SLoc           { get; set; } = string.Empty;
    public DateTime InvestigatedAt { get; set; }
    public string?  Note           { get; set; }
}

/// <summary>Request body for marking a material/SLoc as investigated.</summary>
public class InvestigationRequest
{
    public string  MaterialNumber { get; set; } = string.Empty;
    public string  SLoc           { get; set; } = string.Empty;
    public string? Note           { get; set; }
}
