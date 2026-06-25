CREATE TABLE "resumes" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "content" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER,
  "language" TEXT DEFAULT 'pt',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analyses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "resumeId" UUID NOT NULL,
  "jobDescription" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "breakdown" JSONB NOT NULL,
  "matchedKeywords" TEXT[],
  "missingKeywords" TEXT[],
  "formatIssues" TEXT[],
  "recommendations" JSONB NOT NULL,
  "questions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "optimizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "analysisId" UUID NOT NULL,
  "previousScore" INTEGER NOT NULL,
  "newScore" INTEGER NOT NULL,
  "gain" INTEGER NOT NULL,
  "optimizedContent" TEXT NOT NULL,
  "changes" JSONB NOT NULL,
  "answers" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "optimizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "analyses_resumeId_idx" ON "analyses"("resumeId");
CREATE INDEX "analyses_score_idx" ON "analyses"("score");
CREATE INDEX "analyses_createdAt_idx" ON "analyses"("createdAt");
CREATE UNIQUE INDEX "optimizations_analysisId_key" ON "optimizations"("analysisId");
CREATE INDEX "optimizations_gain_idx" ON "optimizations"("gain");
CREATE INDEX "optimizations_createdAt_idx" ON "optimizations"("createdAt");

ALTER TABLE "analyses"
  ADD CONSTRAINT "analyses_resumeId_fkey"
  FOREIGN KEY ("resumeId") REFERENCES "resumes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "optimizations"
  ADD CONSTRAINT "optimizations_analysisId_fkey"
  FOREIGN KEY ("analysisId") REFERENCES "analyses"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
