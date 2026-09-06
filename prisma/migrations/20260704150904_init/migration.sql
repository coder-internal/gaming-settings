-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('STEAM', 'XBOX', 'OTHER');

-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('CURATED', 'AI_GENERATED');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "steamAppId" INTEGER,
    "coverImageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Computer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpu" TEXT NOT NULL,
    "gpu" TEXT NOT NULL,
    "ramGb" INTEGER NOT NULL,
    "os" TEXT NOT NULL,
    "storageNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettingsProfile" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "computerId" TEXT NOT NULL,
    "targetResolution" TEXT NOT NULL DEFAULT '3840x2160',
    "targetFps" INTEGER NOT NULL DEFAULT 120,
    "settings" JSONB NOT NULL,
    "source" "RecommendationSource" NOT NULL DEFAULT 'CURATED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettingsProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_steamAppId_key" ON "Game"("steamAppId");

-- CreateIndex
CREATE INDEX "Game_name_idx" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SettingsProfile_gameId_computerId_targetResolution_targetFp_key" ON "SettingsProfile"("gameId", "computerId", "targetResolution", "targetFps");

-- AddForeignKey
ALTER TABLE "SettingsProfile" ADD CONSTRAINT "SettingsProfile_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettingsProfile" ADD CONSTRAINT "SettingsProfile_computerId_fkey" FOREIGN KEY ("computerId") REFERENCES "Computer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
