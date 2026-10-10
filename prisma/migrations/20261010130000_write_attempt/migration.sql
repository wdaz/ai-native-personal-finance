-- CreateTable
CREATE TABLE "WriteAttempt" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "WriteAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WriteAttempt_ip_at_idx" ON "WriteAttempt"("ip", "at");
