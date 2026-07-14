-- =====================================================
-- Stock Accuracy Monitor — Watchlist seed
-- Adds a batch of materials to dbo.Watchlist.
-- Safe to re-run: the migration and inserts are idempotent.
-- Run AFTER views.sql.
-- =====================================================

-- ------------------------------------
-- Migration
-- Earlier versions keyed the watchlist on (MaterialNumber, SLoc).
-- Collapse an existing table to material-only so each material is
-- watched across ALL of its storage locations.
-- ------------------------------------
IF OBJECT_ID('dbo.Watchlist', 'U') IS NOT NULL
   AND COL_LENGTH('dbo.Watchlist', 'SLoc') IS NOT NULL
BEGIN
    -- Collapse any material that had multiple SLoc rows down to one.
    ;WITH dupes AS (
        SELECT MaterialNumber,
               ROW_NUMBER() OVER (PARTITION BY MaterialNumber ORDER BY SLoc) AS rn
        FROM dbo.Watchlist
    )
    DELETE FROM dupes WHERE rn > 1;

    ALTER TABLE dbo.Watchlist DROP CONSTRAINT PK_Watchlist;
    ALTER TABLE dbo.Watchlist DROP COLUMN SLoc;
    ALTER TABLE dbo.Watchlist ADD CONSTRAINT PK_Watchlist PRIMARY KEY (MaterialNumber);
END

-- ------------------------------------
-- Seed
-- Descriptions are informational only (comments) — the watchlist stores
-- MaterialNumber; the description is resolved from dbo.StockSnapshot.
-- ------------------------------------
INSERT INTO dbo.Watchlist (MaterialNumber)
SELECT v.MaterialNumber
FROM (VALUES
    ('433901'),  -- FRAME,ORV3.600WxDEEP.WLD
    ('434014'),  -- PROFILE,FRAME MEM.VERTICAL.REAR.R/H.WLD
    ('434016'),  -- PROFILE,FRAME MEM.VERTICAL.REAR.L/H.WLD
    ('434018'),  -- PROFILE,FRAME MEM.VERTICAL.MID.UNI.WLD
    ('400463'),  -- PROFILE,FRAME MEM.VERT.INNER.S/M.PIERCED
    ('433033'),  -- PROFILE,FRAME MEM.VERTICAL.INNER.S/M
    ('434013'),  -- PROFILE,FRAME MEM.VERTICAL.FRONT.UNI.S/M
    ('433433'),  -- PROFILE,CABLE MANAGER.ORV3N.R/H.S/M
    ('433435'),  -- PROFILE,CABLE MANAGER.ORV3N.L/H.S/M
    ('400477'),  -- BASE TRAY,LOWER.600WxDEEP.S/M.PIERCED
    ('434021'),  -- BASE TRAY,LOWER.600WxDEEP.ORV3.S/M
    ('434027'),  -- PLATE,BASE TRAY.STIFFENING.ORV3.WLD
    ('400478'),  -- PLATE,BASE TRAY.STIFFENING.ORV3.S/M
    ('400479'),  -- PLATE,BASE TRAY.STIFFENING.S/M.PIERCED
    ('432625'),  -- BRACE MEMBER.1OU.600W.WLD
    ('433913'),  -- BRACE,EXTENSION.600W.ORV3HPR.S/M
    ('433909'),  -- BAFFLE,HOT AISLE,BTM.ORV3HPR.PEM
    ('433910'),  -- BAFFLE,HOT AISLE,BTM.ORV3HPR.S/M
    ('433906'),  -- BAFFLE,HOT AISLE,TOP.ORV3HPR.S/M
    ('410401'),  -- BAFFLE,HOT AISLE,TOP.ORV3HPR.S/M.PIERCED
    ('434166'),  -- EXTENSION,REAR.ORV3/HPRV3[STD.].WLD
    ('400557'),  -- PROFILE,BASE.EXTN.REAR.HPRV3[STD.].WLD
    ('434147'),  -- EXTENSION,REAR.ORV3/HPRV3[I.T.].WLD
    ('400592'),  -- PROFILE,BASE.EXTN.REAR.HPRV3[I.T.].WLD
    ('400593'),  -- PROFILE,BASE.EXTN.REAR.HPRV3[PWR.].WLD
    ('434150'),  -- EXTENSION,REAR.ORV3/HPRV3[PWR.].WLD
    ('433230'),  -- PANEL,SIDE.ORV3/E8000.WLD
    ('433231'),  -- PANEL,SIDE.ORV3/E8000.S/M
    ('433746'),  -- BRACKET,E.I.A.,FRONT,LOWER.ORV3N.S/M
    ('433744')   -- BRACKET,E.I.A.,FRONT,UPPER.ORV3N.S/M
) AS v(MaterialNumber)
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.Watchlist w WHERE w.MaterialNumber = v.MaterialNumber
);
