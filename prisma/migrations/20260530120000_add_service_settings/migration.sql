CREATE TABLE "ServiceSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "creditsPerUsd" INTEGER NOT NULL DEFAULT 100,
    "welcomeCredits" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ServiceSettings" ("id", "creditsPerUsd", "welcomeCredits", "createdAt", "updatedAt")
VALUES ('global', 100, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
