export type CreateVideoGenerationJobInput = {
  estimatedCredits: number;
  input: unknown;
  modelId: string;
  projectId: string;
  sceneId: string | null;
  userId: string;
};

export type GenerationJobRecord = {
  actualCredits: number | null;
  completedAt: Date | null;
  createdAt: Date;
  creditsReserved: number;
  creditsSpent: number;
  durationMs: number | null;
  errorJson: unknown;
  estimatedCredits: number;
  id: string;
  inputJson: unknown;
  modelId: string;
  outputJson: unknown;
  projectId: string | null;
  provider: string;
  providerCostEstimate: number | null;
  providerRequestId: string | null;
  sceneId: string | null;
  startedAt: Date | null;
  status: string;
  type: string;
  userId: string;
};

export type GenerationJobRepository = {
  createVideoJob(input: CreateVideoGenerationJobInput): Promise<GenerationJobRecord>;
  markSceneGenerating(sceneId: string, jobId: string): Promise<void>;
  setProviderRequest(jobId: string, requestId: string): Promise<GenerationJobRecord>;
};
