# AGENTS.md

## Cursor Cloud specific instructions

This repo is the **Stock Accuracy Monitor** (Rittal CSM Plymouth): an ASP.NET Core 8 Web API
(`StockAccuracy.API`) that serves a React + Vite SPA (`stockaccuracy-ui`) and reads a
Microsoft SQL Server database. Standard commands live in `StockAccuracy.API/StockAccuracy.API.csproj`,
`stockaccuracy-ui/package.json`, and `sql/views.sql`; only non-obvious caveats are captured here.

### Services and how to run them (dev)

The startup dependency install (SDKs, SQL Server, sqlcmd) is already baked into the VM snapshot.
`~/.bashrc` exports the DB connection string (`ConnectionStrings__StockDb`) and adds
`/opt/mssql-tools18/bin` (sqlcmd) to `PATH`. New login shells pick these up automatically.

1. **SQL Server** — required; it is NOT managed by systemd in this VM. Start it manually if not running:
   ```
   sudo -u mssql MSSQL_SA_PASSWORD='StockAcc#2026!' ACCEPT_EULA=Y /opt/mssql/bin/sqlservr
   ```
   Run it in a background/tmux session (it stays in the foreground). SA password is `StockAcc#2026!`.
   The `StockAccuracy` database, schema (`sql/views.sql`), and sample data persist in the snapshot,
   so re-seeding is usually unnecessary.
2. **API** (`StockAccuracy.API`) — required. Run on port **5000** so the Vite dev proxy works:
   ```
   dotnet run --project StockAccuracy.API/StockAccuracy.API.csproj --urls "http://localhost:5000"
   ```
   The API also serves the built SPA from `StockAccuracy.API/wwwroot`, so on its own it is a full app.
   Verify with `curl http://localhost:5000/api/stock/health` (expect `"viewsOk":true`).
3. **Frontend dev server** (`stockaccuracy-ui`) — optional, for hot reload: `npm run dev --prefix stockaccuracy-ui`
   (Vite on port **5173**). Its proxy in `stockaccuracy-ui/vite.config.js` targets `http://localhost:5000`,
   which is why the API must run on 5000 (not the 5080/7080 in `launchSettings.json`).

### Gotchas

- **Vite proxy port mismatch**: `launchSettings.json` uses 5080/7080, but the Vite proxy targets 5000.
  Always start the API with `--urls "http://localhost:5000"` when using the Vite dev server.
- **`sql/views.sql` has no `GO` batch separators**, so `sqlcmd -i sql/views.sql` fails with
  "CREATE VIEW must be the first statement in a query batch". Apply the pre-split copy at
  `~/.stockaccuracy-setup/views_go.sql` instead. Sample data seed is `~/.stockaccuracy-setup/seed.sql`
  (needs ≥2 distinct `SnapshotDate` values for the comparison views to be meaningful).
- **Bash history expansion**: the SA password contains `!`. In interactive bash, quote it with single
  quotes (or `set +H`) or the `!` triggers "event not found".
- **No lint or automated test setup exists** in this repo (no ESLint, no test project). "Build" = `dotnet build`
  (backend) and `npm run build --prefix stockaccuracy-ui` (frontend, outputs into `StockAccuracy.API/wwwroot`).

### Re-seed the database (only if needed)

```
sqlcmd -S localhost -U sa -P 'StockAcc#2026!' -C -Q "IF DB_ID('StockAccuracy') IS NULL CREATE DATABASE StockAccuracy;"
sqlcmd -S localhost -U sa -P 'StockAcc#2026!' -C -d StockAccuracy -i ~/.stockaccuracy-setup/views_go.sql
sqlcmd -S localhost -U sa -P 'StockAcc#2026!' -C -d StockAccuracy -i ~/.stockaccuracy-setup/seed.sql
```
