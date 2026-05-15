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
-- vw_StockComparison
-- One row per material/SLoc comparing
-- today's snapshot against yesterday's
-- ------------------------------------
CREATE OR ALTER VIEW dbo.vw_StockComparison AS
WITH Today AS (
    SELECT * FROM dbo.StockSnapshot
    WHERE SnapshotDate = CAST(GETDATE() AS DATE)
),
Yesterday AS (
    SELECT * FROM dbo.StockSnapshot
    WHERE SnapshotDate = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)
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
        CAST(GETDATE() AS DATE)                         AS TodayDate,
        CAST(DATEADD(DAY,-1,GETDATE()) AS DATE)        AS YesterdayDate,
        CASE
            WHEN y.MaterialNumber IS NULL THEN 'NEW'
            WHEN t.MaterialNumber IS NULL THEN 'MISSING'
            ELSE 'OK'
        END AS RawStatus
    FROM Today      t
    FULL OUTER JOIN Yesterday y
        ON  t.MaterialNumber = y.MaterialNumber
        AND t.SLoc           = y.SLoc
)
SELECT
    MaterialNumber,
    MaterialDesc,
    SLoc,
    QtyYesterday,
    QtyToday,
    QtyToday - QtyYesterday                              AS Delta,
    CASE
        WHEN QtyYesterday = 0 AND QtyToday = 0 THEN 0
        WHEN QtyYesterday = 0                  THEN 100
        ELSE ROUND((QtyToday - QtyYesterday) / QtyYesterday * 100, 2)
    END                                                  AS PctChange,
    CASE
        WHEN RawStatus IN ('NEW','MISSING') THEN RawStatus
        WHEN ABS(CASE
                    WHEN QtyYesterday = 0 AND QtyToday = 0 THEN 0
                    WHEN QtyYesterday = 0                  THEN 100
                    ELSE ROUND((QtyToday - QtyYesterday) / QtyYesterday * 100, 2)
                 END) > 10 THEN 'FLAGGED'
        ELSE 'OK'
    END                                                  AS Status,
    BaseUnit,
    MRPController,
    TodayDate,
    YesterdayDate
FROM Combined;

-- ------------------------------------
-- vw_StockSummary
-- Single-row summary for stat cards
-- ------------------------------------
CREATE OR ALTER VIEW dbo.vw_StockSummary AS
SELECT
    COUNT(*)                                              AS TotalTracked,
    SUM(CASE WHEN Status = 'FLAGGED' THEN 1 ELSE 0 END)  AS TotalFlagged,
    SUM(CASE WHEN Status = 'NEW'     THEN 1 ELSE 0 END)  AS TotalNew,
    SUM(CASE WHEN Status = 'MISSING' THEN 1 ELSE 0 END)  AS TotalMissing,
    MAX(TodayDate)                                        AS LastSnapshotDate
FROM dbo.vw_StockComparison;
