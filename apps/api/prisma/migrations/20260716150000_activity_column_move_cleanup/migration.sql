-- Remove legacy no-op column move activity rows created before column move audit
-- started storing position snapshots. Rows where from = to do not describe a
-- meaningful audit change and only add noise to project activity queries.
DELETE FROM "Activity"
WHERE "field" = 'column.moved'
  AND "from" IS NOT NULL
  AND "to" IS NOT NULL
  AND "from" = "to";