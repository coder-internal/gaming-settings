-- AlterTable
ALTER TABLE "SettingsProfile" ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "SettingsProfile_favorite_idx" ON "SettingsProfile"("favorite");

