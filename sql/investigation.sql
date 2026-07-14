-- =====================================================
-- Stock Accuracy Monitor — Investigation table
-- Stores "investigated ✓" acknowledgements server-side so they are
-- shared across users and browsers (previously browser-local only).
-- Safe to re-run. Run once in SSMS against  csmsvr02 → StockAccuracy.
-- =====================================================
IF OBJECT_ID('dbo.Investigation', 'U') IS NULL
    CREATE TABLE dbo.Investigation (
        MaterialNumber NVARCHAR(18)  NOT NULL,
        SLoc           NVARCHAR(4)   NOT NULL,
        InvestigatedAt DATETIME2     NOT NULL CONSTRAINT DF_Investigation_At DEFAULT SYSUTCDATETIME(),
        Note           NVARCHAR(400) NULL,
        CONSTRAINT PK_Investigation PRIMARY KEY (MaterialNumber, SLoc)
    );
GO
