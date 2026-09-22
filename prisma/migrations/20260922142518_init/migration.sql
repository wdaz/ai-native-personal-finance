-- CreateExtension (hand-written: Prisma 7 does not manage extensions; Pot.name is citext)
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Entertainment', 'Bills', 'Groceries', 'Dining Out', 'Transportation', 'Personal Care', 'Education', 'Lifestyle', 'Shopping', 'General');

-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('Green', 'Yellow', 'Cyan', 'Navy', 'Red', 'Purple', 'Turquoise', 'Brown', 'Magenta', 'Blue', 'Navy Grey', 'Army Green', 'Gold', 'Orange', 'Pink');

-- CreateEnum
CREATE TYPE "ResetReason" AS ENUM ('scheduled', 'threshold', 'manual', 'test');

-- CreateTable
CREATE TABLE "Balance" (
    "id" UUID NOT NULL,
    "current" BIGINT NOT NULL,
    "income" BIGINT NOT NULL,
    "expenses" BIGINT NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "date" TIMESTAMPTZ(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "recurring" BOOLEAN NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" UUID NOT NULL,
    "seq" SERIAL NOT NULL,
    "category" "Category" NOT NULL,
    "maximum" BIGINT NOT NULL,
    "theme" "Theme" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pot" (
    "id" UUID NOT NULL,
    "seq" SERIAL NOT NULL,
    "name" CITEXT NOT NULL,
    "target" BIGINT NOT NULL,
    "total" BIGINT NOT NULL,
    "theme" "Theme" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Pot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetLog" (
    "id" UUID NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" "ResetReason" NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ResetLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_seq_key" ON "Budget"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_category_key" ON "Budget"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_theme_key" ON "Budget"("theme");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_seq_key" ON "Pot"("seq");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_name_key" ON "Pot"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pot_theme_key" ON "Pot"("theme");
