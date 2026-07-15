using Microsoft.AspNetCore.Diagnostics;
using StockAccuracy.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<IWatchlistRepository, WatchlistRepository>();

// CORS is opt-in: only the origins listed in configuration ("Cors:AllowedOrigins")
// are allowed. The SPA is served same-origin from wwwroot, so production typically
// needs no cross-origin entries at all.
var corsOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (corsOrigins.Length > 0)
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

// Return JSON errors without leaking internal details to the client.
app.UseExceptionHandler(errApp => errApp.Run(async ctx =>
{
    var error = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    ctx.RequestServices
       .GetRequiredService<ILoggerFactory>()
       .CreateLogger("UnhandledException")
       .LogError(error, "Unhandled exception");

    ctx.Response.StatusCode  = 500;
    ctx.Response.ContentType = "application/json";
    await ctx.Response.WriteAsJsonAsync(new { error = "Internal server error" });
}));

app.UseCors();
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
