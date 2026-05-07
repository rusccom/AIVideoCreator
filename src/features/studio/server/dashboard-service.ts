import { prisma } from "@/shared/server/prisma";

export type StudioProject = {
  id: string;
  title: string;
  aspectRatio: string;
  clips: number;
  duration: string;
  status: string;
  updatedAt: string;
};

export type DashboardData = {
  projects: StudioProject[];
  metrics: Array<{ label: string; value: string }>;
  activity: Array<{ name: string; status: string }>;
};

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const [projects, subscription, balance, jobs, storage] = await dashboardQuery(userId);
  return {
    projects: projects.map(toStudioProject),
    metrics: buildMetrics(subscription, creditSum(balance), jobs.length, storageSum(storage)),
    activity: jobs.map(toActivityItem)
  };
}

export async function getTopbarData(userId: string) {
  return {
    credits: await getCreditBalance(userId)
  };
}

function dashboardQuery(userId: string) {
  return prisma.$transaction([
    getProjects(userId),
    getSubscription(userId),
    getCreditBalanceQuery(userId),
    getRecentJobs(userId),
    getStorageBytesQuery(userId)
  ]);
}

function getProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId, archivedAt: null },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      aspectRatio: true,
      status: true,
      updatedAt: true,
      scenes: { select: { durationSeconds: true } }
    }
  });
}

function getSubscription(userId: string) {
  return prisma.subscription.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

async function getCreditBalance(userId: string) {
  const result = await getCreditBalanceQuery(userId);
  return creditSum(result);
}

function getCreditBalanceQuery(userId: string) {
  return prisma.creditLedger.aggregate({
    where: { userId },
    _sum: { amount: true }
  });
}

function getRecentJobs(userId: string) {
  return prisma.generationJob.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { type: true, modelId: true, status: true }
  });
}

function getStorageBytesQuery(userId: string) {
  return prisma.asset.aggregate({
    where: { userId },
    _sum: { sizeBytes: true }
  });
}

function creditSum(result: Awaited<ReturnType<typeof getCreditBalanceQuery>>) {
  return result._sum.amount ?? 0;
}

function storageSum(result: Awaited<ReturnType<typeof getStorageBytesQuery>>) {
  return result._sum.sizeBytes ?? 0;
}

function toStudioProject(project: Awaited<ReturnType<typeof getProjects>>[number]) {
  return {
    id: project.id,
    title: project.title,
    aspectRatio: project.aspectRatio,
    clips: project.scenes.length,
    duration: `${totalSceneSeconds(project.scenes)}s`,
    status: project.status.toLowerCase(),
    updatedAt: project.updatedAt.toLocaleDateString("en-US")
  };
}

function totalSceneSeconds(scenes: Array<{ durationSeconds: number }>) {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
}

function buildMetrics(
  subscription: Awaited<ReturnType<typeof getSubscription>>,
  balance: number,
  queuedJobs: number,
  storage: number
) {
  return [
    { label: "Current plan", value: subscription?.planKey ?? "starter" },
    { label: "Credits", value: `${balance}` },
    { label: "Queued jobs", value: `${queuedJobs}` },
    { label: "Storage", value: formatBytes(storage) }
  ];
}

function toActivityItem(job: Awaited<ReturnType<typeof getRecentJobs>>[number]) {
  return {
    name: `${job.type.toLowerCase().replaceAll("_", " ")} - ${job.modelId}`,
    status: job.status.toLowerCase()
  };
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 B";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${Math.round(bytes / 1024 / 1024)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
