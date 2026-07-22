// ─── Program.cs — where the backend web server starts up ──────────────────────
//
// This is the C#/.NET equivalent of main.jsx: the first code that runs on the
// server. It wires everything together, then starts listening for web requests.
// Reading top to bottom, it:
//   1. Registers our services so the framework can supply them where needed
//      (this "dependency injection" is how a Controller receives a Repository
//      without creating one itself).
//   2. Sets up CORS (which websites are allowed to call this API) and a global
//      error handler that hides internal details from clients.
//   3. Serves the built React app (the files in wwwroot) and routes /api/* calls
//      to the matching Controller.
//
// The two main building blocks you'll meet elsewhere:
//   • Controller – receives an HTTP request (e.g. GET /api/stock/summary) and
//                  returns a response. Think "the front desk".
//   • Repository – the code that actually talks to the SQL database. Controllers
//                  ask a repository for data rather than querying directly.

using Microsoft.AspNetCore.Diagnostics;
using StockAccuracy.API.Data;

// "builder" collects configuration and services before the app is built/started.
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
