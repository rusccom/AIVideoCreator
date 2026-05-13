import { cache } from "react";
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
  const [projects, user, jobs] = await dashboardQuery(userId);
  return {
    projects: projects.map(toStudioProject),
    metrics: buildMetrics(user?.creditBalance ?? 0, jobs.length, Number(user?.storageBytesUsed ?? 0n)),
    activity: jobs.map(toActivityItem)
  };
}

export const getTopbarData = cache(async (userId: string) => {
  return {
    credits: await getCreditBalance(userId)
  };
});

const getCreditBalance = cache(async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true }
  });
  return user?.creditBalance ?? 0;
});

function dashboardQuery(userId: string) {
  return prisma.$transaction([
    getProjects(userId),
    getUserCounters(userId),
    getRecentJobs(userId)
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
      timelineItemCount: true,
      totalDurationSeconds: true
    }
  });
}

function getUserCounters(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true, storageBytesUsed: true }
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

function toStudioProject(project: Awaited<ReturnType<typeof getProjects>>[number]) {
  return {
    id: project.id,
    title: project.title,
    aspectRatio: project.aspectRatio,
    clips: project.timelineItemCount,
    duration: `${project.totalDurationSeconds}s`,
    status: project.status.toLowerCase(),
    updatedAt: project.updatedAt.toLocaleDateString("en-US")
  };
}

function buildMetrics(
  balance: number,
  queuedJobs: number,
  storage: number
) {
  return [
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
