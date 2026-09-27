/*
  Warnings:

  - You are about to drop the column `mistakeCount` on the `Task` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "mistakeCount";

-- CreateTable
CREATE TABLE "TaskMistake" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskMistake_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskMistake" ADD CONSTRAINT "TaskMistake_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMistake" ADD CONSTRAINT "TaskMistake_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
