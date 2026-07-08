-- =====================================================
-- Stock Accuracy Monitor — SQL Server view definitions
-- Run once against the target database
-- =====================================================

-- ------------------------------------
-- Daily snapshot table (populated by
-- a scheduled SQL Agent job or SSIS package)
-- ------------------------------------
IF OBJECT_ID('dbo.StockSnapshot', 'U') IS NULL
CREATE TABLE dbo.StockSnapshot (
    SnapshotDate   DATE         NOT NULL,
    MaterialNumber NVARCHAR(18) NOT NULL,
    MaterialDesc   NVARCHAR(40) NOT NULL,
    SLoc           NVARCHAR(4)  NOT NULL,
    Qty            DECIMAL(15,3) NOT NULL DEFAULT 0,
    BaseUnit       NVARCHAR(3)  NOT NULL DEFAULT 'EA',
    MRPController  NVARCHAR(3)  NULL,
    CONSTRAINT PK_StockSnapshot PRIMARY KEY (SnapshotDate, MaterialNumber, SLoc)
);

-- ------------------------------------
-- Material usage (populated from SAP goods
-- movements — counts uses in last 60 days)
-- Dan's ABC rule: A >750, B 100–750, C <100
-- ------------------------------------
IF OBJECT_ID('dbo.MaterialUsage', 'U') IS NULL
CREATE TABLE dbo.MaterialUsage (
    MaterialNumber NVARCHAR(18) NOT NULL,
    UsageCount     INT          NOT NULL DEFAULT 0,
    PeriodEnd      DATE         NULL,
    CONSTRAINT PK_MaterialUsage PRIMARY KEY (MaterialNumber)
);

-- ------------------------------------
-- vw_StockComparison
-- Compares the two most recent snapshot dates
-- (not calendar today/yesterday)
-- ------------------------------------
CREATE OR ALTER VIEW dbo.vw_StockComparison AS
WITH Dates AS (
    SELECT
        (SELECT MAX(SnapshotDate) FROM dbo.StockSnapshot) AS TodayDate,
        (SELECT MAX(SnapshotDate)
         FROM dbo.StockSnapshot
         WHERE SnapshotDate < (SELECT MAX(SnapshotDate) FROM dbo.StockSnapshot)
        ) AS YesterdayDate
),
Today AS (
    SELECT s.*
    FROM dbo.StockSnapshot s
    CROSS JOIN Dates d
    WHERE s.SnapshotDate = d.TodayDate
),
Yesterday AS (
    SELECT s.*
    FROM dbo.StockSnapshot s
    CROSS JOIN Dates d
    WHERE s.SnapshotDate = d.YesterdayDate
),
Combined AS (
    SELECT
        COALESCE(t.MaterialNumber, y.MaterialNumber) AS MaterialNumber,
        COALESCE(t.MaterialDesc,   y.MaterialDesc)   AS MaterialDesc,
        COALESCE(t.SLoc,           y.SLoc)           AS SLoc,
        COALESCE(t.BaseUnit,       y.BaseUnit)       AS BaseUnit,
        COALESCE(t.MRPController,  y.MRPController)  AS MRPController,
        ISNULL(y.Qty, 0)  AS QtyYesterday,
        ISNULL(t.Qty, 0)  AS QtyToday,
        d.TodayDate,
        d.YesterdayDate,
        CASE
            WHEN y.MaterialNumber IS NULL THEN 'NEW'
            WHEN t.MaterialNumber IS NULL THEN 'MISSING'
            ELSE 'OK'
        END AS RawStatus
    FROM Today t
    FULL OUTER JOIN Yesterday y
        ON  t.MaterialNumber = y.MaterialNumber
        AND t.SLoc           = y.SLoc
    CROSS JOIN Dates d
)
SELECT
    c.MaterialNumber,
    c.MaterialDesc,
    c.SLoc,
    c.QtyYesterday,
    c.QtyToday,
    c.QtyToday - c.QtyYesterday                              AS Delta,
    CASE
        WHEN c.QtyYesterday = 0 AND c.QtyToday = 0 THEN 0
        WHEN c.QtyYesterday = 0                  THEN 100
        ELSE ROUND((c.QtyToday - c.QtyYesterday) / c.QtyYesterday * 100, 2)
    END                                                      AS PctChange,
    c.RawStatus                                              AS Status,
    c.BaseUnit,
    c.MRPController,
    c.TodayDate,
    c.YesterdayDate,
    mu.UsageCount,
    CASE
        WHEN mu.UsageCount > 750  THEN 'A'
        WHEN mu.UsageCount >= 100 THEN 'B'
        WHEN mu.UsageCount IS NOT NULL THEN 'C'
        ELSE NULL
    END                                                      AS AbcClass,
    NULL                                                     AS UnitValue
FROM Combined c
LEFT JOIN dbo.MaterialUsage mu ON mu.MaterialNumber = c.MaterialNumber;

-- ------------------------------------
-- vw_StockSummary
-- Single-row summary for stat cards
-- ------------------------------------
CREATE OR ALTER VIEW dbo.vw_StockSummary AS
SELECT
    COUNT(*)                                              AS TotalTracked,
    SUM(CASE WHEN Status = 'OK' AND ABS(PctChange) > 10 THEN 1 ELSE 0 END) AS TotalFlagged,
    SUM(CASE WHEN Status = 'NEW'     THEN 1 ELSE 0 END)  AS TotalNew,
    SUM(CASE WHEN Status = 'MISSING' THEN 1 ELSE 0 END)  AS TotalMissing,
    MAX(TodayDate)                                        AS LastSnapshotDate
FROM dbo.vw_StockComparison;

-- ------------------------------------
-- Watchlist
-- Materials/SLocs flagged for closer monitoring
-- ------------------------------------
IF OBJECT_ID('dbo.Watchlist', 'U') IS NULL
CREATE TABLE dbo.Watchlist (
    MaterialNumber NVARCHAR(18) NOT NULL,
    SLoc           NVARCHAR(4)  NOT NULL,
    CONSTRAINT PK_Watchlist PRIMARY KEY (MaterialNumber, SLoc)
);

-- ------------------------------------
-- vw_WatchlistComparison
-- Same shape as vw_StockComparison, scoped to watchlisted material/SLoc pairs
-- ------------------------------------
CREATE OR ALTER VIEW dbo.vw_WatchlistComparison AS
SELECT c.*
FROM dbo.vw_StockComparison c
INNER JOIN dbo.Watchlist w
    ON  w.MaterialNumber = c.MaterialNumber
    AND w.SLoc           = c.SLoc;
