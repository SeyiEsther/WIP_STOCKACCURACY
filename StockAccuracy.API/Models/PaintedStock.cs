namespace StockAccuracy.API.Models;

/// <summary>
/// A painted (RAL-finished) material with its current unrestricted stock
/// quantity, sourced from the CSMDATAWH warehouse. Drives the "Painted Parts"
/// tab in the UI.
/// </summary>
public class PaintedStock
{
    public string   Material    { get; set; } = string.Empty;
    public string   Description { get; set; } = string.Empty;
    public decimal? Qty         { get; set; }
}
