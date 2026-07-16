ALTER TABLE "Activity" ADD COLUMN "projectId" UUID;

UPDATE "Activity" AS activity
SET "projectId" = task."projectId"
FROM "Task" AS task
WHERE activity."taskId" = task."id";

ALTER TABLE "Activity" ALTER COLUMN "projectId" SET NOT NULL;
ALTER TABLE "Activity" ALTER COLUMN "taskId" DROP NOT NULL;

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Activity_projectId_createdAt_idx" ON "Activity"("projectId", "createdAt");
CREATE INDEX "Activity_field_idx" ON "Activity"("field");